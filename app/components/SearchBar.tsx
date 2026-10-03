"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = ["Dotacje", "Wydarzenia", "Inkubatory", "Partnerzy"];

type SearchBarProps = {
  defaultValue?: string;
};

export function SearchBar({ defaultValue = "" }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isEmpty = query.trim().length === 0;

  return (
    <div className="flex w-full flex-col gap-4">
      <form action="/search" method="get" role="search" className="flex flex-col gap-2">
        <label htmlFor="site-search" className="pl-5 text-sm font-medium text-muted">
          Czego szukasz?
        </label>
        <div className="liquid-glass flex items-center gap-2 p-2 pl-5">
          <MagnifyingGlass
            aria-hidden
            size={22}
            weight="bold"
            className="shrink-0 text-accent"
          />
          <input
            ref={inputRef}
            id="site-search"
            name="q"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="np. dotacje dla startupów, wydarzenia, partnerzy"
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-foreground outline-none placeholder:text-muted sm:text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd
            aria-hidden
            className="mr-1 hidden rounded-full border border-hairline px-2.5 py-0.5 font-mono text-xs text-muted md:inline-block"
          >
            /
          </kbd>
          <button
            type="submit"
            disabled={isEmpty}
            className="shrink-0 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-[transform,background-color,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-7 sm:text-base dark:text-slate-950"
          >
            Szukaj
          </button>
        </div>
      </form>

      <ul className="flex flex-wrap justify-center gap-2" aria-label="Popularne wyszukiwania">
        {SUGGESTIONS.map((suggestion) => (
          <li key={suggestion}>
            <Link
              href={`/search?q=${encodeURIComponent(suggestion)}`}
              className="liquid-glass-chip inline-block rounded-full px-4 py-1.5 text-sm font-medium text-foreground transition-colors duration-300 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {suggestion}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
