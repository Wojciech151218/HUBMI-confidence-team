"use client";

import { ArrowRight, ArrowSquareOut, FileText } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { DocumentPreview } from "@/lib/markdown-excerpt";
import type { ReaderDocument } from "./DocumentReader";

// The Markdown renderer only loads once a reader is first opened.
const DocumentReader = dynamic(() => import("./DocumentReader").then((mod) => mod.DocumentReader), {
  ssr: false,
});

export type ResultCardHit = ReaderDocument & {
  id: number;
  preview: DocumentPreview;
  similarity: number;
  createdAt: string;
};

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });
const visibleFacts = 3;
const visibleCategories = 3;

export function DocumentResultCard({ hit, index }: { hit: ResultCardHit; index: number }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const match = Math.round(Math.max(0, Math.min(1, hit.similarity)) * 100);
  const createdAt = new Date(hit.createdAt);
  const title = hit.title ?? "Dokument bez tytułu";
  const { summary, facts } = hit.preview;
  const shownCategories = hit.categories.slice(0, visibleCategories);
  const hiddenCategories = hit.categories.slice(visibleCategories);

  function openReader() {
    setMounted(true);
    setOpen(true);
  }

  return (
    <li className="fade-up" style={{ "--i": index } as React.CSSProperties}>
      <article className="result-card liquid-glass-chip group relative flex flex-col gap-3 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"
          >
            <FileText size={18} weight="duotone" />
          </span>
          <h2 className="line-clamp-2 min-w-0 flex-1 pt-1.5 text-base font-bold leading-snug tracking-tight text-foreground transition-colors duration-300 group-hover:text-accent">
            {title}
          </h2>
          {match > 0 && (
            <span
              className="shrink-0 rounded-full border border-hairline bg-white/60 px-2 py-0.5 text-xs font-medium tabular-nums text-muted"
              title="Dopasowanie do zapytania"
            >
              {match}%
            </span>
          )}
        </div>

        {summary && (
          <p className="line-clamp-2 font-secondary text-[0.95rem] leading-relaxed text-foreground/75">
            {summary}
          </p>
        )}

        {facts.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-xl border border-hairline bg-white/45 px-4 py-3 sm:grid-cols-3">
            {facts.slice(0, visibleFacts).map((fact) => (
              <div key={fact.label} className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">
                  {fact.label}
                </dt>
                <dd className="truncate font-secondary text-sm font-semibold text-foreground" title={fact.value}>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          {hit.categories.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Kategorie">
              {shownCategories.map((name) => (
                <li
                  key={name}
                  className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
                >
                  {name}
                </li>
              ))}
              {hiddenCategories.length > 0 && (
                <li
                  className="rounded-full border border-hairline px-2 py-0.5 text-xs font-medium text-muted"
                  title={hiddenCategories.join(", ")}
                >
                  +{hiddenCategories.length}
                </li>
              )}
            </ul>
          )}
          <time dateTime={createdAt.toISOString()}>{dateFormat.format(createdAt)}</time>
          <span className="ml-auto flex items-center gap-4">
            {hit.minioUrl && (
              <a
                href={hit.minioUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Otwórz oryginał: ${title}`}
                className="relative z-10 inline-flex items-center gap-1 rounded-full hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Oryginał
                <ArrowSquareOut aria-hidden size={14} weight="bold" />
              </a>
            )}
            <span aria-hidden className="inline-flex items-center gap-1 font-medium text-accent">
              Czytaj
              <ArrowRight
                size={14}
                weight="bold"
                className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
              />
            </span>
          </span>
        </div>

        {/* Stretched button: the whole card opens the reader. */}
        <button
          type="button"
          onClick={openReader}
          aria-haspopup="dialog"
          aria-label={`Czytaj dokument: ${title}`}
          className="absolute inset-0 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </article>
      {mounted && <DocumentReader document={hit} open={open} onClose={() => setOpen(false)} />}
    </li>
  );
}
