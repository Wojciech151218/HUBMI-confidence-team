"use client";

import { At, MapPin, Trash, Users } from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import { AuthError } from "../../components/AuthField";
import { deleteInitiative, listAdminInitiatives, type AdminInitiative } from "./actions";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });

type LoadState = { status: "loading" } | { status: "ready"; items: AdminInitiative[] };

export function AdminInitiativeList() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    listAdminInitiatives()
      .then((items) => {
        if (!cancelled) {
          setState({ status: "ready", items });
        }
      })
      .catch((err) => {
        console.error("AdminInitiativeList: listAdminInitiatives failed", err);
        if (!cancelled) {
          setState({ status: "ready", items: [] });
          setError("Nie udało się wczytać inicjatyw. Spróbuj ponownie za chwilę.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDelete(item: AdminInitiative) {
    if (!window.confirm(`Usunąć inicjatywę „${item.title}”? Tej operacji nie można cofnąć.`)) {
      return;
    }
    setError(null);
    setPendingId(item.id);
    startTransition(async () => {
      try {
        setState({ status: "ready", items: await deleteInitiative(item.id) });
      } catch (err) {
        console.error("AdminInitiativeList: deleteInitiative failed", err);
        setError("Nie udało się usunąć inicjatywy. Spróbuj ponownie.");
      } finally {
        setPendingId(null);
      }
    });
  }

  if (state.status === "loading") {
    return <p className="text-center font-secondary text-muted">Wczytywanie…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <AuthError message={error} />
      {state.items.length === 0 ? (
        <p className="liquid-glass-chip rounded-3xl p-8 text-center font-secondary text-muted">
          Brak zgłoszonych inicjatyw.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {state.items.map((item) => (
            <li
              key={item.id}
              className="liquid-glass-chip flex flex-col gap-3 rounded-3xl p-5 text-left sm:flex-row sm:items-start"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h2 className="text-lg font-bold leading-tight">{item.title}</h2>
                <p className="line-clamp-2 font-secondary text-sm text-muted">{item.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-secondary text-xs text-muted">
                  <span>{dateFormat.format(new Date(item.createdAt))}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users aria-hidden size={14} weight="bold" />
                    {item.votes}
                  </span>
                  {item.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden size={14} weight="bold" />
                      {item.location}
                    </span>
                  ) : null}
                  <a
                    href={`mailto:${item.contactEmail}`}
                    className="inline-flex items-center gap-1 text-accent hover:text-accent-hover"
                  >
                    <At aria-hidden size={14} weight="bold" />
                    {item.contactEmail}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item)}
                disabled={pendingId !== null}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-[transform,background-color,opacity] duration-300 hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash aria-hidden size={16} weight="bold" />
                {pendingId === item.id ? "Usuwanie…" : "Usuń"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
