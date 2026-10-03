"use client";

import { MapPin, Plus } from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import { useUser } from "@/app/_components/user-context";
import { AuthError } from "../components/AuthField";
import { listInitiatives, toggleVote, type InitiativeListItem } from "./actions";

export function InitiativeVoteList() {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<InitiativeListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    listInitiatives(userId)
      .then((next) => {
        if (!cancelled) {
          setItems(next);
        }
      })
      .catch((err) => {
        console.error("InitiativeVoteList: listInitiatives failed", err);
        if (!cancelled) {
          setItems([]);
          setError("Nie udało się wczytać inicjatyw. Spróbuj ponownie za chwilę.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function handleVote(initiativeId: number) {
    if (userId === null) {
      return;
    }
    setError(null);
    setPendingId(initiativeId);
    startTransition(async () => {
      try {
        setItems(await toggleVote(initiativeId, userId));
      } catch (err) {
        console.error("InitiativeVoteList: toggleVote failed", err);
        setError("Nie udało się oddać głosu. Spróbuj ponownie.");
      } finally {
        setPendingId(null);
      }
    });
  }

  if (items === null) {
    return <p className="text-center font-secondary text-muted">Wczytywanie…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <AuthError message={error} />
      {items.length === 0 ? (
        <p className="liquid-glass-chip rounded-3xl p-8 text-center font-secondary text-muted">
          Nie ma jeszcze żadnych inicjatyw — bądź pierwszy!
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="liquid-glass-chip flex items-start gap-4 rounded-3xl p-5 text-left transition-transform duration-300"
            >
              <span className="w-6 shrink-0 pt-0.5 text-lg font-bold text-muted">{index + 1}.</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h2 className="text-lg font-bold leading-tight">{item.title}</h2>
                <p className="whitespace-pre-line font-secondary text-sm text-muted">
                  {item.description}
                </p>
                {item.location ? (
                  <span className="inline-flex items-center gap-1 font-secondary text-xs text-muted">
                    <MapPin aria-hidden size={14} weight="bold" />
                    {item.location}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleVote(item.id)}
                disabled={userId === null || pendingId !== null}
                aria-pressed={item.voted}
                aria-label={item.voted ? `Cofnij głos na „${item.title}”` : `Zagłosuj na „${item.title}”`}
                className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3 py-2 font-medium transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-60 ${
                  item.voted
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "bg-accent-soft text-accent hover:bg-accent/20"
                }`}
              >
                <Plus aria-hidden size={18} weight="bold" />
                <span className="text-sm tabular-nums">{item.votes}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
