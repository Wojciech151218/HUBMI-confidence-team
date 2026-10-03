"use client";

import { ArrowSquareOut, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

export type ReaderDocument = {
  title: string | null;
  body: string;
  minioUrl: string | null;
  categories: string[];
};

type DocumentReaderProps = {
  document: ReaderDocument;
  open: boolean;
  onClose: () => void;
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);

// react-markdown passes its AST node as a prop; keep it off the DOM element.
function withoutNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

export function DocumentReader({ document: doc, open, onClose }: DocumentReaderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      scrollRef.current?.scrollTo({ top: 0 });
      setProgress(0);
      window.document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      window.document.documentElement.style.overflow = "";
    };
  }, [open]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 1);
  }

  // Table-of-contents anchors scroll inside the dialog instead of changing the page URL.
  function scrollToAnchor(hash: string) {
    const id = decodeURIComponent(hash.slice(1));
    const target = scrollRef.current?.querySelector(`[id="${CSS.escape(id)}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const components: Components = {
    a: ({ href = "", children, ...rest }) => {
      const props = withoutNode(rest);
      if (href.startsWith("#")) {
        return (
          <a
            {...props}
            href={href}
            onClick={(event) => {
              event.preventDefault();
              scrollToAnchor(href);
            }}
          >
            {children}
          </a>
        );
      }
      return (
        <a {...props} href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    // Relative image paths point at files that were never uploaded.
    img: ({ src, alt, ...props }) =>
      typeof src === "string" && isExternal(src) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img {...withoutNode(props)} src={src} alt={alt ?? ""} loading="lazy" />
      ) : null,
    table: ({ children, ...props }) => (
      <div className="doc-table">
        <table {...withoutNode(props)}>{children}</table>
      </div>
    ),
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-label={doc.title ?? "Dokument"}
      className="doc-reader m-auto h-[min(92dvh,1100px)] w-[min(100%-2rem,48rem)] max-h-none max-w-none overflow-hidden rounded-3xl bg-transparent p-0 text-foreground"
    >
      <div className="liquid-glass-panel flex h-full flex-col overflow-hidden rounded-3xl">
        <header className="relative flex items-start gap-3 border-b border-hairline px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="text-lg font-bold leading-snug tracking-tight sm:text-xl">
              {doc.title ?? "Dokument bez tytułu"}
            </h2>
            {(doc.categories.length > 0 || doc.minioUrl) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {doc.categories.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" aria-label="Kategorie">
                    {doc.categories.map((name) => (
                      <li
                        key={name}
                        className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
                {doc.minioUrl && (
                  <a
                    href={doc.minioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Oryginał
                    <ArrowSquareOut aria-hidden size={14} weight="bold" />
                  </a>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="liquid-glass-chip grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors duration-300 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X aria-hidden size={18} weight="bold" />
          </button>
          <div aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 overflow-hidden">
            <div
              className="shimmer-gradient h-full origin-left"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        </header>
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-8"
        >
          <article className="doc-prose mx-auto">
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSlug]}
              skipHtml
              components={components}
            >
              {doc.body}
            </Markdown>
          </article>
        </div>
      </div>
    </dialog>
  );
}
