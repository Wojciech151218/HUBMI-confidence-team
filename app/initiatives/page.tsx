import { Plus } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { InitiativeVoteList } from "./InitiativeVoteList";

export const metadata: Metadata = {
  title: "Inicjatywy lokalne | Hub Małopolskich Innowacji",
};

export default function InitiativesPage() {
  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-8 px-4 py-10 sm:px-6 md:pt-16">
        <div className="fade-up" style={{ "--i": 0 } as React.CSSProperties}>
          <Logo className="h-12 md:h-14" />
        </div>
        <div
          className="fade-up flex flex-col items-center gap-2 text-center"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight md:text-4xl">
            Inicjatywy lokalne
          </h1>
          <p className="font-secondary text-muted">
            Głosuj na pomysły, które chcesz zobaczyć w Małopolsce. Najpopularniejsze trafiają na górę.
          </p>
        </div>
        <Link
          href="/initiatives/new"
          className="fade-up inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.98]"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <Plus aria-hidden size={20} weight="bold" />
          Stwórz inicjatywę lokalną
        </Link>
        <div className="fade-up w-full" style={{ "--i": 3 } as React.CSSProperties}>
          <InitiativeVoteList />
        </div>
      </main>
    </PageShell>
  );
}
