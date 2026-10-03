import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Strona główna"
      className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <Image
        src="/malopolska-logo.svg"
        alt="Małopolska"
        width={1106}
        height={526}
        priority
        className={`w-auto ${className}`.trim()}
      />
    </Link>
  );
}
