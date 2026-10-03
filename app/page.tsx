import { Logo } from "./components/Logo";
import { PageShell } from "./components/PageShell";
import { SearchBar } from "./components/SearchBar";
import { SuggestionBubbles, type SuggestionGroup } from "./components/SuggestionBubbles";

const SUGGESTION_GROUPS: SuggestionGroup[] = [
  { topic: "Finansowanie", labels: ["Dotacje", "Badania i rozwój"] },
  { topic: "Wiedza", labels: ["Szkolenia", "Mentoring", "Wydarzenia"] },
  { topic: "Ekosystem", labels: ["Startupy", "Inkubatory", "Partnerzy"] },
];

export default function Home() {
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
        <SuggestionBubbles
          groups={SUGGESTION_GROUPS}
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
