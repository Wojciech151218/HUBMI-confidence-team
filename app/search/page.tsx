import type { Metadata } from "next";
import { searchDocuments, type DocumentHit } from "@/lib/document-search";
import { markdownPreview } from "@/lib/markdown-excerpt";
import { DocumentResultCard } from "../components/DocumentResultCard";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { SearchBar } from "../components/SearchBar";

export const metadata: Metadata = {
  title: "Wyszukiwanie | Hub Małopolskich Innowacji",
};

const resultLimit = 10;

function parseCategories(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const names = values
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(names)];
}

async function runSearch(query: string, categories: string[]) {
  try {
    const results = await searchDocuments({ query, categories, limit: resultLimit });
    return { results, failed: false };
  } catch (error) {
    console.error("search page: searchDocuments failed", error);
    return { results: [] as DocumentHit[], failed: true };
  }
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q, category } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const categories = parseCategories(category);
  // Browsing a category without a query: rank its documents by similarity to the category names.
  const searchText = query || categories.join(", ");
  const { results, failed } = searchText
    ? await runSearch(searchText, categories)
    : { results: [], failed: false };

  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 md:pt-16">
        <div className="flex justify-center">
          <Logo className="h-12 md:h-14" />
        </div>
        <SearchBar key={query} defaultValue={query} />

        {!searchText ? (
          <StatusMessage
            title="Zacznij wyszukiwanie"
            body="Wpisz hasło powyżej lub wybierz jedną z popularnych kategorii."
          />
        ) : failed ? (
          <StatusMessage
            title="Nie udało się wyszukać"
            body="Wystąpił problem z wyszukiwarką. Spróbuj ponownie za chwilę."
          />
        ) : results.length === 0 ? (
          <StatusMessage
            title={`Brak wyników dla „${searchText}”`}
            body="Spróbuj innego hasła lub bardziej ogólnego sformułowania."
          />
        ) : (
          <section className="flex flex-col gap-4" aria-label="Wyniki wyszukiwania">
            <h1 className="text-xl font-bold tracking-tight">
              Wyniki dla „{searchText}”
            </h1>
            <ol className="flex flex-col gap-3">
              {results.map((hit, index) => (
                <DocumentResultCard
                  key={hit.id}
                  index={index}
                  hit={{
                    ...hit,
                    preview: markdownPreview(hit.body),
                    createdAt: new Date(hit.createdAt).toISOString(),
                  }}
                />
              ))}
            </ol>
          </section>
        )}
      </main>
    </PageShell>
  );
}

function StatusMessage({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-[60ch] font-secondary text-muted">{body}</p>
    </section>
  );
}
