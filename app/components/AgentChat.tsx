"use client";

import { ChatCircle, PaperPlaneTilt, Trash, X } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAgent } from "@/app/_components/agent-context";
import { useUser } from "@/app/_components/user-context";

const PUBLIC_PATHS = ["/login", "/register"];

export function AgentChat() {
  const pathname = usePathname();
  const { user } = useUser();
  const { isOpen, messages, isLoading, isSending, error, toggle, close, send, forget } =
    useAgent();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const hidden = !user || PUBLIC_PATHS.includes(pathname);
  const onHome = pathname === "/";

  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isOpen, isSending]);

  // On mobile the chat is full-screen, so stop the page behind it from scrolling.
  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 639px)").matches) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (hidden) {
    return null;
  }

  const isEmpty = draft.trim().length === 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isEmpty || isSending) {
      return;
    }
    const text = draft;
    setDraft("");
    await send(text);
  }

  return (
    <div
      className={`fixed right-4 z-50 flex flex-col items-end gap-3 sm:right-6 ${
        onHome
          ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-6"
          : "bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6"
      }`}
    >
      {isOpen && (
        <section
          aria-label="Rozmowa z asystentem"
          className="fixed inset-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-[rgb(255_255_255_/_0.96)] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:static sm:h-[min(32rem,70vh)] sm:w-[min(24rem,calc(100vw-2rem))] sm:rounded-3xl sm:border sm:border-[rgb(29_95_209_/_0.14)] sm:bg-[rgb(255_255_255_/_0.82)] sm:p-0 sm:shadow-[0_18px_50px_-12px_rgb(29_95_209_/_0.28)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Asystent</h2>
              <p className="font-secondary text-xs text-muted">Krótkie podsumowania dokumentów</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void forget()}
                disabled={isSending || messages.length === 0}
                className="rounded-full p-2 text-muted transition-colors hover:text-accent disabled:opacity-40"
                aria-label="Zapomnij rozmowę"
              >
                <Trash aria-hidden size={18} weight="bold" />
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-full p-2 text-muted transition-colors hover:text-foreground"
                aria-label="Zamknij rozmowę"
              >
                <X aria-hidden size={18} weight="bold" />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {isLoading ? (
              <p className="font-secondary text-sm text-muted">Wczytywanie rozmowy…</p>
            ) : messages.length === 0 ? (
              <p className="font-secondary text-sm text-muted">
                Zapytaj o dokumenty i innowacje w Małopolsce. Asystent wyszuka źródła i streszcze
                je krótko.
              </p>
            ) : (
              messages.map((message, index) => (
                <p
                  key={`${message.role}-${index}`}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 font-secondary text-sm leading-relaxed ${
                    message.role === "user"
                      ? "ml-auto bg-accent text-white"
                      : "bg-accent-soft text-foreground"
                  }`}
                >
                  {message.content}
                </p>
              ))
            )}
            {isSending && (
              <p className="font-secondary text-sm text-muted">Asystent szuka i streszcza…</p>
            )}
            {error && <p className="font-secondary text-sm text-red-600">{error}</p>}
          </div>

          <form onSubmit={onSubmit} className="border-t border-hairline p-3">
            <label htmlFor="agent-message" className="sr-only">
              Wiadomość do asystenta
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="agent-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={2}
                placeholder="O jaki dokument pytasz?"
                className="min-h-[2.75rem] min-w-0 flex-1 resize-none rounded-2xl bg-white/70 px-3 py-2 font-secondary text-base text-foreground sm:text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={isEmpty || isSending}
                className="shrink-0 rounded-full bg-accent p-3 text-white transition-[transform,background-color,opacity] hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Wyślij"
              >
                <PaperPlaneTilt aria-hidden size={18} weight="bold" />
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Zamknij asystenta" : "Otwórz asystenta"}
        className={`${
          isOpen ? "hidden sm:flex" : "flex"
        } h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-[0_18px_50px_-12px_rgb(29_95_209_/_0.45)] transition-[transform,background-color] hover:bg-accent-hover active:scale-[0.98] sm:h-14 sm:w-14`}
      >
        {isOpen ? <X aria-hidden size={26} weight="bold" /> : <ChatCircle aria-hidden size={26} weight="bold" />}
      </button>
    </div>
  );
}
