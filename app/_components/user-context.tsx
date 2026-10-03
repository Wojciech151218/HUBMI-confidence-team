"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getUser,
  login as loginRequest,
  register as registerRequest,
  type LoginInput,
  type PublicUser,
  type RegisterInput,
} from "@/lib/user-client";

const STORAGE_KEY = "hubmi-user";

type UserContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<PublicUser>;
  register: (input: RegisterInput) => Promise<PublicUser>;
  logout: () => void;
  refresh: () => Promise<PublicUser | null>;
};

const UserContext = createContext<UserContextValue | null>(null);

function readStoredUser(): PublicUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PublicUser;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistUser(user: PublicUser | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(readStoredUser());
    setIsLoading(false);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const next = await loginRequest(input);
    persistUser(next);
    setUser(next);
    console.log("useUser login:", next.username, next.id);
    return next;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const created = await registerRequest(input);
    console.log("useUser register:", created.username, created.id);
    return created;
  }, []);

  const logout = useCallback(() => {
    persistUser(null);
    setUser(null);
    console.log("useUser logout");
  }, []);

  const refresh = useCallback(async () => {
    const current = user ?? readStoredUser();
    if (!current) {
      return null;
    }
    const next = await getUser({ id: current.id });
    persistUser(next);
    setUser(next);
    console.log("useUser refresh:", next.username, next.id);
    return next;
  }, [user]);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refresh }),
    [user, isLoading, login, register, logout, refresh],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
