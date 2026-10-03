"use client";

import { useEffect, useState, useTransition } from "react";
import { useUser } from "@/app/_components/user-context";
import { AuthError } from "../components/AuthField";
import { InitiativeCard } from "./InitiativeCard";
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
            <InitiativeCard
              key={item.id}
              item={item}
              rank={index + 1}
              onVote={handleVote}
              voteDisabled={userId === null || pendingId !== null}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
