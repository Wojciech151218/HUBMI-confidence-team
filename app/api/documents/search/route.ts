import { NextResponse } from "next/server";
import { createEmbedding } from "@/lib/embedding";
import { getDataSource } from "@/lib/data-source";

const defaultLimit = 10;
const maxLimit = 50;

type SearchRow = {
  id: number;
  body: string;
  minioUrl: string | null;
  categories: string[] | null;
  similarity: number;
  createdAt: Date;
};

function parseCategories(searchParams: URLSearchParams): string[] {
  const names = searchParams
    .getAll("category")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(names)];
}

function parseLimit(searchParams: URLSearchParams): number | { error: string } {
  const limitParam = searchParams.get("limit");
  if (limitParam === null) {
    return defaultLimit;
  }

  const limit = Number(limitParam);
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    return { error: `limit must be an integer from 1 to ${maxLimit}` };
  }

  return limit;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const categories = parseCategories(searchParams);
  const limit = parseLimit(searchParams);

  if (!query) {
    return NextResponse.json(
      { error: "Provide q to search" },
      { status: 400 },
    );
  }

  if (typeof limit !== "number") {
    return NextResponse.json({ error: limit.error }, { status: 400 });
  }

  const embedding = await createEmbedding(query);
  const vector = `[${embedding.join(",")}]`;
  const params: unknown[] = [vector];
  const filters = ["d.embedding IS NOT NULL"];

  if (categories.length > 0) {
    params.push(categories);
    filters.push(`EXISTS (
      SELECT 1
      FROM document_categories dc
      INNER JOIN categories c ON c.id = dc.category_id
      WHERE dc.document_id = d.id
        AND lower(c.name) = ANY($${params.length})
    )`);
  }

  params.push(limit);

  const ds = await getDataSource();
  const rows: SearchRow[] = await ds.query(
    `
      SELECT
        d.id,
        d.body,
        d.minio_url AS "minioUrl",
        d.created_at AS "createdAt",
        1 - (d.embedding <=> $1::vector) AS similarity,
        COALESCE(
          (
            SELECT json_agg(c.name ORDER BY c.name)
            FROM document_categories dc
            INNER JOIN categories c ON c.id = dc.category_id
            WHERE dc.document_id = d.id
          ),
          '[]'::json
        ) AS categories
      FROM documents d
      WHERE ${filters.join(" AND ")}
      ORDER BY d.embedding <=> $1::vector
      LIMIT $${params.length}
    `,
    params,
  );

  console.log("documents GET search:", query, categories, rows.length);

  return NextResponse.json({
    query,
    categories,
    results: rows.map((row) => ({
      id: row.id,
      body: row.body,
      minioUrl: row.minioUrl,
      categories: row.categories ?? [],
      similarity: Number(row.similarity),
      createdAt: row.createdAt,
    })),
  });
}
