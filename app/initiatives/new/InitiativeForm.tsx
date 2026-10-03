"use client";

import { At, CheckCircle, Lightbulb, MapPin } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState } from "react";
import { useUser } from "@/app/_components/user-context";
import { AuthError, AuthField, AuthSubmit } from "../../components/AuthField";
import { submitInitiative, type InitiativeFormState } from "./actions";

const initialState: InitiativeFormState = { status: "idle", message: null };

export function InitiativeForm() {
  const { user } = useUser();
  const [state, formAction, isPending] = useActionState(submitInitiative, initialState);

  if (state.status === "success") {
    return (
      <div className="liquid-glass-chip flex flex-col items-center gap-4 rounded-3xl p-8 text-center">
        <CheckCircle aria-hidden size={48} weight="fill" className="text-accent" />
        <h2 className="text-xl font-bold">Dziękujemy za zgłoszenie!</h2>
        <p className="font-secondary text-muted">
          Przyjrzymy się Twojej inicjatywie i skontaktujemy się z Tobą wkrótce.
        </p>
        <Link href="/initiatives" className="font-medium text-accent hover:text-accent-hover">
          Zobacz listę inicjatyw
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="liquid-glass-chip flex w-full flex-col gap-4 rounded-3xl p-6">
      <input type="hidden" name="userId" value={user?.id ?? ""} />
      <AuthField
        id="initiative-title"
        label="Nazwa inicjatywy"
        icon={Lightbulb}
        name="title"
        type="text"
        required
        placeholder="np. Sąsiedzka biblioteczka na osiedlu"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="initiative-description" className="text-sm font-medium">
          Opis
        </label>
        <textarea
          id="initiative-description"
          name="description"
          required
          rows={6}
          placeholder="Na czym polega inicjatywa, komu pomaga i czego potrzebuje?"
          className="liquid-glass-chip resize-y rounded-2xl px-4 py-3.5 font-secondary text-base text-foreground outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-muted focus:border-accent/40 focus:shadow-[0_0_0_4px_var(--accent-soft)]"
        />
      </div>
      <AuthField
        id="initiative-location"
        label="Miejscowość (opcjonalnie)"
        icon={MapPin}
        name="location"
        type="text"
        placeholder="np. Kraków, Nowy Sącz"
      />
      <AuthField
        id="initiative-email"
        label="E-mail kontaktowy"
        icon={At}
        name="contactEmail"
        type="email"
        autoComplete="email"
        required
        defaultValue={user?.email ?? ""}
        placeholder="jan.kowalski@example.com"
      />
      <AuthError message={state.status === "error" ? state.message : null} />
      <AuthSubmit disabled={isPending}>{isPending ? "Wysyłanie…" : "Wyślij zgłoszenie"}</AuthSubmit>
    </form>
  );
}
