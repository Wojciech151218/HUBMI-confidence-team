import { In, IsNull } from "typeorm";
import type { Document } from "@/db/document";
import { getDataSource } from "@/lib/data-source";
import { createEmbedding } from "@/lib/embedding";

const distanceSql = "document.embedding <=> CAST(:embedding AS vector)";

// Resolve the entity by name, not class: in Next dev the cached DataSource can hold a
// different module instance of Document than the route or page calling this helper.
const documentEntity = "Document";

export type DocumentSearchOptions = {
  query: string;
  categories?: string[];
  limit: number;
};

export type DocumentHit = {
  id: number;
  title: string | null;
  body: string;
  minioUrl: string | null;
  categories: string[];
  similarity: number;
  createdAt: Date;
};

// Embeds every document that has no vector yet, from its title plus category names: short
// search queries match that focused text far more closely than the whole diluted body,
// and the categories add the topic keywords a short title lacks.
// Search runs this too, so a cleared or failed embedding can't hide a document.
export async function embedMissingDocuments(): Promise<number> {
  const ds = await getDataSource();
  const repo = ds.getRepository<Document>(documentEntity);
  const missing = await repo.find({
    where: { embedding: IsNull() },
    relations: { categories: true },
    select: { id: true, title: true, body: true, categories: { id: true, name: true } },
  });

  for (const document of missing) {
    const title = document.title?.trim() || document.body.slice(0, 500);
    const categories = document.categories.map((category) => category.name).join(", ");
    const input = categories ? `${title}\n${categories}` : title;
    await repo.update(document.id, { embedding: await createEmbedding(input) });
  }

  return missing.length;
}

export async function searchDocuments({
  query,
  categories = [],
  limit,
}: DocumentSearchOptions): Promise<DocumentHit[]> {
  await embedMissingDocuments();
  const embedding = await createEmbedding(query);
  const ds = await getDataSource();
  const repo = ds.getRepository<Document>(documentEntity);

  const search = repo
    .createQueryBuilder("document")
    .select([
      "document.id",
      "document.title",
      "document.body",
      "document.minioUrl",
      "document.createdAt",
    ])
    .where("document.embedding IS NOT NULL")
    .addSelect(`1 - (${distanceSql})`, "similarity")
    .orderBy(distanceSql, "ASC")
    .setParameter("embedding", `[${embedding.join(",")}]`)
    .limit(limit);

  if (categories.length > 0) {
    search.andWhere((builder) => {
      const match = builder
        .subQuery()
        .select("filtered.id")
        .from(documentEntity, "filtered")
        .innerJoin("filtered.categories", "category")
        .where("LOWER(category.name) IN (:...categoryNames)")
        .getQuery();
      return `document.id IN ${match}`;
    });
    search.setParameter("categoryNames", categories);
  }

  const { entities, raw } = await search.getRawAndEntities();
  const ids = entities.map((document) => document.id);
  const withCategories =
    ids.length === 0
      ? []
      : await repo.find({
          where: { id: In(ids) },
          relations: { categories: true },
          select: {
            id: true,
            categories: { id: true, name: true },
          },
        });

  const categoryNamesById = new Map(
    withCategories.map((document) => [
      document.id,
      document.categories
        .map((category) => category.name)
        .sort((left, right) => left.localeCompare(right)),
    ]),
  );

  return entities.map((document, index) => ({
    id: document.id,
    title: document.title,
    body: document.body,
    minioUrl: document.minioUrl,
    categories: categoryNamesById.get(document.id) ?? [],
    similarity: Number(raw[index]?.similarity),
    createdAt: document.createdAt,
  }));
}
