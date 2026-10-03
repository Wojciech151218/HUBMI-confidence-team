"use client";

import { CalendarBlank, CaretDown, MapPin, Plus, Users } from "@phosphor-icons/react";
import { useId, useState } from "react";
import type { InitiativeListItem } from "./actions";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" });

function votesLabel(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (count === 1) {
    return "1 głos";
  }
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return `${count} głosy`;
  }
  return `${count} głosów`;
}

type InitiativeCardProps = {
  item: InitiativeListItem;
  rank: number;
  onVote: (initiativeId: number) => void;
  voteDisabled: boolean;
};

export function InitiativeCard({ item, rank, onVote, voteDisabled }: InitiativeCardProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  return (
    <li className="liquid-glass-chip group flex items-start gap-4 rounded-3xl p-5 text-left">
      <span className="w-6 shrink-0 pt-0.5 text-lg font-bold text-muted">{rank}.</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="flex flex-col gap-1.5 rounded-xl text-left outline-none focus-visible:shadow-[0_0_0_4px_var(--accent-soft)]"
        >
          <span className="flex items-start gap-2">
            <span className="min-w-0 flex-1 text-lg font-bold leading-tight transition-colors duration-300 group-hover:text-accent">
              {item.title}
            </span>
            <CaretDown
              aria-hidden
              size={18}
              weight="bold"
              className={`mt-0.5 shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            />
          </span>
          <span
            className={`block font-secondary text-sm text-muted ${open ? "whitespace-pre-line" : "line-clamp-3"}`}
          >
            {item.description}
          </span>
          {item.location ? (
            <span className="inline-flex items-center gap-1 font-secondary text-xs text-muted">
              <MapPin aria-hidden size={14} weight="bold" />
              {item.location}
            </span>
          ) : null}
        </button>
        <div
          id={detailsId}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-hairline pt-3 font-secondary text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <CalendarBlank aria-hidden size={14} weight="bold" />
                Zgłoszono {dateFormat.format(new Date(item.createdAt))}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden size={14} weight="bold" />
                {votesLabel(item.votes)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onVote(item.id)}
        disabled={voteDisabled}
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
  );
}
