import { Logo } from "./components/Logo";
import { PageShell } from "./components/PageShell";
import { SearchBar } from "./components/SearchBar";

export default function Home() {
  return (
    <PageShell>
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-12 sm:px-6 md:pt-16">
        <div className="flex w-full max-w-2xl flex-col items-center gap-10 text-center">
          <div className="fade-up" style={{ "--i": 0 } as React.CSSProperties}>
            <Logo className="h-16 md:h-20" />
          </div>
          <div className="flex flex-col items-center gap-5">
            <h1
              className="fade-up text-4xl font-semibold leading-[1.05] tracking-tighter md:text-6xl"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              Odkryj innowacje{" "}
              <span className="whitespace-nowrap text-accent">w Małopolsce</span>
            </h1>
            <p
              className="fade-up max-w-[60ch] text-base leading-relaxed text-muted md:text-lg"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              Wyszukuj programy wsparcia, wydarzenia i partnerów, którzy rozwijają
              innowacyjną Małopolskę.
            </p>
          </div>
          <div className="fade-up w-full" style={{ "--i": 3 } as React.CSSProperties}>
            <SearchBar />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
