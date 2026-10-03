import type { Metadata } from "next";
import { Logo } from "../../components/Logo";
import { PageShell } from "../../components/PageShell";
import { InitiativeForm } from "./InitiativeForm";

export const metadata: Metadata = {
  title: "Zgłoś inicjatywę społeczną | Hub Małopolskich Innowacji",
};

export default function NewInitiativePage() {
  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-8 px-4 py-10 sm:px-6 md:pt-16">
        <div className="fade-up" style={{ "--i": 0 } as React.CSSProperties}>
          <Logo className="h-12 md:h-14" />
        </div>
        <div
          className="fade-up flex flex-col items-center gap-2 text-center"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight md:text-4xl">
            Zgłoś inicjatywę społeczną
          </h1>
          <p className="font-secondary text-muted">
            Opowiedz nam o swoim pomyśle lub działaniu, które wspiera lokalną społeczność.
          </p>
        </div>
        <div className="fade-up w-full" style={{ "--i": 2 } as React.CSSProperties}>
          <InitiativeForm />
        </div>
      </main>
    </PageShell>
  );
}
