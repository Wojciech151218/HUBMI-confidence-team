"use client";

import { LockSimple, User } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/app/_components/user-context";
import { AuthError, AuthField, AuthSubmit } from "../components/AuthField";

export function LoginForm() {
  const { login } = useUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isIncomplete = username.trim().length === 0 || password.length === 0;

  // On success AuthGate sees the user and redirects to the home page.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 401
          ? "Nieprawidłowa nazwa użytkownika lub hasło."
          : "Nie udało się zalogować. Spróbuj ponownie za chwilę.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="liquid-glass-chip flex w-full flex-col gap-4 rounded-3xl p-6"
      >
        <AuthField
          id="login-username"
          label="Nazwa użytkownika"
          icon={User}
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="np. jan.kowalski"
        />
        <AuthField
          id="login-password"
          label="Hasło"
          icon={LockSimple}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
        <AuthError message={error} />
        <AuthSubmit disabled={isIncomplete || isSubmitting}>
          {isSubmitting ? "Logowanie…" : "Zaloguj się"}
        </AuthSubmit>
      </form>
      <p className="font-secondary text-sm text-muted">
        Nie masz konta?{" "}
        <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
          Zarejestruj się
        </Link>
      </p>
    </div>
  );
}
