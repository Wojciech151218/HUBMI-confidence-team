"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "./user-context";

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const redirectTo = isLoading ? null : !user && !isPublic ? "/login" : user && isPublic ? "/" : null;

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
