import type { Metadata } from "next";
import { Logo } from "../../components/Logo";
import { PageShell } from "../../components/PageShell";
import { AdminInitiativeList } from "./AdminInitiativeList";

export const metadata: Metadata = {
  title: "Panel administratora | Hub Małopolskich Innowacji",
};

export default function AdminInitiativesPage() {
  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-4 py-10 sm:px-6 md:pt-16">
        <div className="fade-up" style={{ "--i": 0 } as React.CSSProperties}>
          <Logo className="h-12 md:h-14" />
        </div>
        <div
          className="fade-up flex flex-col items-center gap-2 text-center"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight md:text-4xl">
            Zarządzanie inicjatywami
          </h1>
          <p className="font-secondary text-muted">
            Panel administratora — usuwanie zgłoszonych inicjatyw lokalnych.
          </p>
        </div>
        <div className="fade-up w-full" style={{ "--i": 2 } as React.CSSProperties}>
          <AdminInitiativeList />
        </div>
      </main>
    </PageShell>
  );
}
