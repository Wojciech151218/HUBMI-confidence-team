"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";

type SearchBarProps = {
  defaultValue?: string;
};

export function SearchBar({ defaultValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const isEmpty = query.trim().length === 0;

  return (
    <form action="/search" method="get" role="search" className="flex w-full flex-col gap-2">
        <label htmlFor="site-search" className="sr-only">
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
            id="site-search"
            name="q"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="np. dotacje dla startupów, wydarzenia, partnerzy"
            className="min-w-0 flex-1 bg-transparent py-3 font-secondary text-base text-foreground outline-none placeholder:text-muted sm:text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="submit"
            disabled={isEmpty}
            className="shimmer-gradient shrink-0 rounded-full px-5 py-3 text-sm font-medium text-white transition-[transform,filter,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-7 sm:text-base"
          >
            Szukaj
          </button>
        </div>
    </form>
  );
}
