import { readdir, readFile } from "fs/promises";
import path from "path";
import { In, Not } from "typeorm";
import type { Category } from "@/db/category";
import type { Document } from "@/db/document";
import { getDataSource } from "@/lib/data-source";
import { embedMissingDocuments } from "@/lib/document-search";

const sourceDir = path.join(process.cwd(), "md-database");

// Resolve entities by name, not class (see lib/document-search.ts).
const documentEntity = "Document";
const categoryEntity = "Category";

type SourceDocument = { title: string; body: string; categories: string[] };

// Reads the `---` frontmatter block: `title: ...` and `categories: [a, b, c]`.
function parseMarkdown(fileName: string, text: string): SourceDocument {
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta = frontmatter?.[1] ?? "";
  const body = (frontmatter ? text.slice(frontmatter[0].length) : text).trim();
  const field = (name: string) =>
    meta.match(new RegExp(`^${name}:\\s*(.*)$`, "m"))?.[1].trim();

  const title =
    field("title") ||
    body.match(/^#\s+(.+)$/m)?.[1].trim() ||
    path.basename(fileName, ".md");
  const categories = (field("categories") ?? "")
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  return { title, body, categories: [...new Set(categories)] };
}

async function readSourceDocuments(): Promise<SourceDocument[]> {
  const fileNames = (await readdir(sourceDir))
    .filter((name) => name.endsWith(".md"))
    .sort();
  return Promise.all(
    fileNames.map(async (name) =>
      parseMarkdown(name, await readFile(path.join(sourceDir, name), "utf8")),
    ),
  );
}

// Syncs md-database/*.md into documents/categories: creates or updates every file,
// embeds documents that have no vector yet, and removes documents and categories not backed by a file.
export async function seedDocuments(): Promise<void> {
  const sources = await readSourceDocuments();
  if (sources.length === 0) {
    console.warn(`[seed] no markdown files in ${sourceDir}, leaving the database untouched`);
    return;
  }

  const ds = await getDataSource();
  const existing = await ds.getRepository<Document>(documentEntity).find({
    where: { title: In(sources.map((source) => source.title)) },
    order: { id: "ASC" },
  });
  const existingByTitle = new Map<string, Document>();
  for (const document of existing) {
    if (document.title && !existingByTitle.has(document.title)) {
      existingByTitle.set(document.title, document);
    }
  }

  const { removedDocuments, removedCategories } = await ds.transaction(async (manager) => {
    const documents = manager.getRepository<Document>(documentEntity);
    const categories = manager.getRepository<Category>(categoryEntity);

    const categoryNames = [...new Set(sources.flatMap((source) => source.categories))];
    const known = await categories.find({ where: { name: In(categoryNames) } });
    const knownNames = new Set(known.map((category) => category.name));
    const created = await categories.save(
      categoryNames
        .filter((name) => !knownNames.has(name))
        .map((name) => categories.create({ name })),
    );
    const categoryByName = new Map(
      [...known, ...created].map((category) => [category.name, category]),
    );

    const keptIds: number[] = [];
    for (const source of sources) {
      const document = existingByTitle.get(source.title) ?? documents.create();
      document.title = source.title;
      document.body = source.body;
      document.minioUrl ??= null;
      document.categories = source.categories.map((name) => categoryByName.get(name)!);
      keptIds.push((await documents.save(document)).id);
    }

    const removedDocs = await documents.delete({ id: Not(In(keptIds)) });
    const removedCats = await categories
      .createQueryBuilder()
      .delete()
      .where("id NOT IN (SELECT category_id FROM document_categories)")
      .execute();

    return {
      removedDocuments: removedDocs.affected ?? 0,
      removedCategories: removedCats.affected ?? 0,
    };
  });

  const embedded = await embedMissingDocuments();

  console.log(
    `[seed] ${sources.length} docs (${embedded} embedded, ` +
      `${sources.length - embedded} unchanged), ` +
      `removed ${removedDocuments} old docs / ${removedCategories} categories`,
  );
}
