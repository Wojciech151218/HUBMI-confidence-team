import { revalidatePath } from "next/cache";
import { getDataSource } from "@/lib/data-source";
import { Document } from "@/lib/document";
import { createEmbedding } from "@/lib/openai";

export const dynamic = "force-dynamic";

async function saveDocument(formData: FormData) {
  "use server";

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return;
  }

  const embedding = await createEmbedding(body);
  const dataSource = await getDataSource();
  await dataSource.query(
    "INSERT INTO documents (body, embedding) VALUES ($1, $2::vector)",
    [body, `[${embedding.join(",")}]`],
  );
  revalidatePath("/");
}

export default async function Home() {
  const dataSource = await getDataSource();
  const [extension] = await dataSource.query(
    "SELECT extversion FROM pg_extension WHERE extname = 'vector'",
  );
  const documents = await dataSource.getRepository(Document).find({
    order: { id: "ASC" },
  });
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          HUBMI confidence team
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          pgvector {extension?.extversion ?? "missing"} · OpenAI{" "}
          {openAIConfigured ? "configured" : "not configured"}
        </p>
      </div>

      {openAIConfigured ? (
        <form action={saveDocument} className="flex flex-col gap-3 sm:flex-row">
          <input
            name="body"
            required
            placeholder="Text to embed"
            className="h-11 flex-1 rounded-full border border-black/10 px-4 dark:border-white/15"
          />
          <button
            type="submit"
            className="h-11 rounded-full bg-foreground px-5 text-background"
          >
            Embed and save
          </button>
        </form>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">
          Set OPENAI_API_KEY in .env to create embeddings with the OpenAI
          TypeScript client.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {documents.length === 0 ? (
          <li className="text-zinc-600 dark:text-zinc-400">No documents yet.</li>
        ) : (
          documents.map((document) => (
            <li key={document.id} className="rounded-2xl border border-black/10 px-4 py-3 dark:border-white/15">
              <p>{document.body}</p>
              <p className="text-sm text-zinc-500">
                {document.embedding?.length ?? 0} dimensions
              </p>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
