"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";

type ConditionalAuthGuardProps = {
  children: React.ReactNode;
};

export function ConditionalAuthGuard({ children }: ConditionalAuthGuardProps) {
  const pathname = usePathname();

  // /auth ページは認証ガードを適用しない
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  return <AuthGuard>{children}</AuthGuard>;
}

