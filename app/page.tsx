import { HandHeart } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Logo } from "./components/Logo";
import { PageShell } from "./components/PageShell";
import { SearchBar } from "./components/SearchBar";
import { SuggestionBubbles, type SuggestionGroup } from "./components/SuggestionBubbles";
import { getSuggestionGroups } from "@/lib/suggestion-groups";

// Categories change with the data, so render per request instead of at build time.
export const dynamic = "force-dynamic";

async function loadSuggestionGroups(): Promise<SuggestionGroup[]> {
  try {
    return await getSuggestionGroups();
  } catch (error) {
    console.error("home: getSuggestionGroups failed", error);
    return [];
  }
}

export default async function Home() {
  const suggestionGroups = await loadSuggestionGroups();

  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-6 px-4 pt-10 text-center sm:px-6 md:pt-12">
        <div className="fade-up" style={{ "--i": 0 } as React.CSSProperties}>
          <Logo className="h-14 md:h-16" />
        </div>
        <h1
          className="fade-up slogan text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          Odkryj innowacje{" "}
          <span className="shimmer-gradient slogan-accent whitespace-nowrap">w Małopolsce</span>
        </h1>
        <Link
          href="/initiatives"
          className="fade-up liquid-glass-chip inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-medium text-accent transition-[transform,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-accent-hover active:scale-[0.98]"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <HandHeart aria-hidden size={20} weight="bold" />
          Inicjatywy lokalne
        </Link>
        <SuggestionBubbles
          groups={suggestionGroups}
          className="fade-up min-h-[340px] flex-1 sm:min-h-[420px]"
        />
      </main>
      <div
        className="fade-up sticky bottom-0 w-full px-4 pb-4 pt-2 sm:px-6"
        style={{ "--i": 2 } as React.CSSProperties}
      >
        <div className="mx-auto w-full max-w-2xl">
          <SearchBar />
        </div>
      </div>
    </PageShell>
  );
}
