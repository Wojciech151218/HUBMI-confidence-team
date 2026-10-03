import Grainient from "./Grainient";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <Grainient
          color1="#E5007E"
          color2="#bbb8b8"
          color3="#84CC16"
          blendAngle={-64}
          warpFrequency={9}
          timeSpeed={0.4}
          colorBalance={-0.03}
          warpStrength={2.75}
        />
      </div>
      {children}
      <footer className="mx-auto w-full max-w-7xl px-4 py-6 text-sm text-muted sm:px-6">
        © {new Date().getFullYear()} Hub Małopolskich Innowacji
      </footer>
    </div>
  );
}
