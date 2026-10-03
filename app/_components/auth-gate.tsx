"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "./user-context";

const PUBLIC_PATHS = ["/login", "/register"];
// Reachable whether or not someone is logged in (the admin panel has no password).
const OPEN_PATH_PREFIXES = ["/admin"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isOpen = OPEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const redirectTo =
    isLoading || isOpen ? null : !user && !isPublic ? "/login" : user && isPublic ? "/" : null;

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  // Hide content until the stored session is known, so protected pages never flash.
  if (isLoading || redirectTo) {
    return null;
  }

  return children;
}
