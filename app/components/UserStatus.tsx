"use client";

import { SignOut } from "@phosphor-icons/react";
import { useUser } from "@/app/_components/user-context";

export function UserStatus() {
  const { user, logout } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <span>
        Zalogowano jako <span className="font-semibold text-foreground">{user.username}</span>
      </span>
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-1.5 rounded-full font-medium text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <SignOut aria-hidden size={16} weight="bold" />
        Wyloguj
      </button>
    </div>
  );
}
