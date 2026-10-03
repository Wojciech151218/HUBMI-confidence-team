import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="w-full">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-4 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span className="flex shrink-0 items-center">
            <Image
              src="/malopolska_logo.png"
              alt="Małopolska"
              width={1106}
              height={526}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </span>
          <span aria-hidden className="h-8 w-px bg-hairline" />
          <span className="text-base font-semibold leading-tight tracking-tight sm:text-lg">
            Hub Małopolskich Innowacji
          </span>
        </Link>
      </div>
    </header>
  );
}
