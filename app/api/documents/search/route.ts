import { NextResponse } from "next/server";
import { searchDocuments } from "@/lib/document-search";

const defaultLimit = 10;
const maxLimit = 50;

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

  const results = await searchDocuments({ query, categories, limit });

  console.log("documents GET search:", query, categories, results.length);

  return NextResponse.json({ query, categories, results });
}
