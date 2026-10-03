"use client";

import { At, LockSimple, User } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/app/_components/user-context";
import { AuthError, AuthField, AuthSubmit } from "../components/AuthField";

const MIN_PASSWORD_LENGTH = 4;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, username: string, password: string, confirm: string) {
  if (!EMAIL_PATTERN.test(email)) {
    return "Podaj poprawny adres e-mail.";
  }
  if (username.length < 3) {
    return "Nazwa użytkownika musi mieć co najmniej 3 znaki.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`;
  }
  if (password !== confirm) {
    return "Hasła nie są takie same.";
  }
  return null;
}

export function RegisterForm() {
  const { register, login } = useUser();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isIncomplete = !email.trim() || !username.trim() || !password || !confirm;

  // Registers, then logs straight in; AuthGate redirects to the home page.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const validationError = validate(trimmedEmail, trimmedUsername, password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await register({ email: trimmedEmail, username: trimmedUsername, password });
      await login({ username: trimmedUsername, password });
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 409
          ? "Ten adres e-mail lub nazwa użytkownika są już zajęte."
          : "Nie udało się założyć konta. Spróbuj ponownie za chwilę.",
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
          id="register-email"
          label="Adres e-mail"
          icon={At}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="jan.kowalski@example.com"
        />
        <AuthField
          id="register-username"
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
          id="register-password"
          label="Hasło"
          icon={LockSimple}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`Co najmniej ${MIN_PASSWORD_LENGTH} znaków`}
        />
        <AuthField
          id="register-confirm"
          label="Powtórz hasło"
          icon={LockSimple}
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="••••••••"
        />
        <AuthError message={error} />
        <AuthSubmit disabled={isIncomplete || isSubmitting}>
          {isSubmitting ? "Tworzenie konta…" : "Załóż konto"}
        </AuthSubmit>
      </form>
      <p className="font-secondary text-sm text-muted">
        Masz już konto?{" "}
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
