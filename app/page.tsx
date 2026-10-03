import { Logo } from "./components/Logo";
import { PageShell } from "./components/PageShell";
import { SearchBar } from "./components/SearchBar";
import { SuggestionBubbles } from "./components/SuggestionBubbles";

const SUGGESTIONS = [
  "Dotacje",
  "Wydarzenia",
  "Inkubatory",
  "Partnerzy",
  "Startupy",
  "Szkolenia",
  "Mentoring",
  "Badania i rozwój",
];

export default function Home() {
  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-6 px-4 pt-10 text-center sm:px-6 md:pt-12">
        <div className="fade-up" style={{ "--i": 0 } as React.CSSProperties}>
          <Logo className="h-14 md:h-16" />
        </div>
        <h1
          className="fade-up text-3xl font-semibold leading-[1.05] tracking-tighter md:text-5xl"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          Odkryj innowacje{" "}
          <span className="whitespace-nowrap text-accent">w Małopolsce</span>
        </h1>
        <SuggestionBubbles
          labels={SUGGESTIONS}
          className="fade-up min-h-[420px] flex-1"
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
