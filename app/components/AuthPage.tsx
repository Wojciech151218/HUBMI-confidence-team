import { Logo } from "./Logo";
import { PageShell } from "./PageShell";

type AuthPageProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthPage({ title, subtitle, children }: AuthPageProps) {
  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6">
        <div className="fade-up" style={{ "--i": 0 } as React.CSSProperties}>
          <Logo className="h-12 md:h-14" />
        </div>
        <div
          className="fade-up flex flex-col items-center gap-2 text-center"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="font-secondary text-muted">{subtitle}</p>
        </div>
        <div className="fade-up w-full" style={{ "--i": 2 } as React.CSSProperties}>
          {children}
        </div>
      </main>
    </PageShell>
  );
}
