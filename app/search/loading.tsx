import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";

export default function SearchLoading() {
  return (
    <PageShell>
      <main
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 md:pt-16"
        aria-busy="true"
      >
        <div className="flex justify-center">
          <Logo className="h-12 md:h-14" />
        </div>
        <div className="liquid-glass h-[66px] animate-pulse" />
        <span className="sr-only">Wyszukiwanie…</span>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="liquid-glass-chip flex animate-pulse flex-col gap-3 rounded-2xl p-5">
              <div className="h-3 w-full rounded-full bg-hairline" />
              <div className="h-3 w-11/12 rounded-full bg-hairline" />
              <div className="h-3 w-2/3 rounded-full bg-hairline" />
              <div className="mt-1 h-3 w-1/3 rounded-full bg-hairline" />
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
