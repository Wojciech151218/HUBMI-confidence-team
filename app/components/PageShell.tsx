import Grainient from "./Grainient";
import { UserStatus } from "./UserStatus";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <Grainient
          color1="#E5007E"
          color2="#c8c7c7"
          color3="#84CC16"
          blendAngle={-16}
          colorBalance={0.08}
          warpStrength={2.75}
          noiseScale={1.3}
          saturation={0.8}
          zoom={0.45}
          warpFrequency={7}
          warpSpeed={4.3}
          grainAmount={0.02}
          contrast={0.8}
          timeSpeed={0.75}
          rotationAmount={590}
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
