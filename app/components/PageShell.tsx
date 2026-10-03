import { SiteHeader } from "./SiteHeader";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col">
      <div aria-hidden className="backdrop-blobs">
        <span />
        <span />
        <span />
      </div>
      <SiteHeader />
      {children}
      <footer className="mx-auto w-full max-w-7xl px-4 py-6 text-sm text-muted sm:px-6">
        © {new Date().getFullYear()} Hub Małopolskich Innowacji
      </footer>
    </div>
  );
}
