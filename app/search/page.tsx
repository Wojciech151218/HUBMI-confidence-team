import type { Metadata } from "next";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { SearchBar } from "../components/SearchBar";

export const metadata: Metadata = {
  title: "Wyszukiwanie | Hub Małopolskich Innowacji",
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-4 pb-16 pt-10 sm:px-6 md:pt-16">
        <div className="flex justify-center">
          <Logo className="h-12 md:h-14" />
        </div>
        <SearchBar key={query} defaultValue={query} />
        <section className="flex flex-col items-center gap-2 text-center">
          {query ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                Wyniki dla „{query}”
              </h1>
              <p className="max-w-[60ch] text-muted">
                Wyszukiwarka jest w przygotowaniu. Wyniki pojawią się tutaj wkrótce.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Zacznij wyszukiwanie</h1>
              <p className="max-w-[60ch] text-muted">
                Wpisz hasło powyżej lub wybierz jedną z popularnych kategorii.
              </p>
            </>
          )}
        </section>
      </main>
    </PageShell>
  );
}
