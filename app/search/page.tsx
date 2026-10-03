import type { Metadata } from "next";
import { searchDocuments, type DocumentHit } from "@/lib/document-search";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { SearchBar } from "../components/SearchBar";

export const metadata: Metadata = {
  title: "Wyszukiwanie | Hub Małopolskich Innowacji",
};

const resultLimit = 10;

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });

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
  const { results, failed } = query
    ? await runSearch(query, categories)
    : { results: [], failed: false };

  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 md:pt-16">
        <div className="flex justify-center">
          <Logo className="h-12 md:h-14" />
        </div>
        <SearchBar key={query} defaultValue={query} />

        {!query ? (
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
            title={`Brak wyników dla „${query}”`}
            body="Spróbuj innego hasła lub bardziej ogólnego sformułowania."
          />
        ) : (
          <section className="flex flex-col gap-4" aria-label="Wyniki wyszukiwania">
            <h1 className="text-xl font-bold tracking-tight">
              Wyniki dla „{query}”
            </h1>
            <ol className="flex flex-col gap-3">
              {results.map((hit) => (
                <ResultCard key={hit.id} hit={hit} />
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

function ResultCard({ hit }: { hit: DocumentHit }) {
  const match = Math.round(Math.max(0, Math.min(1, hit.similarity)) * 100);
  const createdAt = new Date(hit.createdAt);

  return (
    <li className="liquid-glass-chip flex flex-col gap-3 rounded-2xl p-5">
      {hit.title && (
        <h2 className="text-base font-bold tracking-tight text-foreground">
          {hit.title}
        </h2>
      )}
      <p className="line-clamp-4 font-secondary leading-relaxed text-foreground">
        {hit.body}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        {hit.categories.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Kategorie">
            {hit.categories.map((name) => (
              <li
                key={name}
                className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
              >
                {name}
              </li>
            ))}
          </ul>
        )}
        <span>Dopasowanie {match}%</span>
        <time dateTime={createdAt.toISOString()}>{dateFormat.format(createdAt)}</time>
        {hit.minioUrl && (
          <a
            href={hit.minioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto rounded-full font-medium text-accent hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Otwórz dokument
          </a>
        )}
      </div>
    </li>
  );
}
