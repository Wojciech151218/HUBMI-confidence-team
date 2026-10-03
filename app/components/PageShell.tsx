import Grainient from "./Grainient";
import { UserStatus } from "./UserStatus";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <Grainient
          color1="#94C01F"
          color2="#eaeaea"
          color3="#4464AC"
          blendAngle={-36}
          warpFrequency={9}
          timeSpeed={0.4}
          grainAmount={0.02}
        />
      </div>
      {children}
      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-secondary text-sm text-muted sm:px-6">
        <span>© {new Date().getFullYear()} Hub Małopolskich Innowacji</span>
        <UserStatus />
      </footer>
    </div>
  );
}
