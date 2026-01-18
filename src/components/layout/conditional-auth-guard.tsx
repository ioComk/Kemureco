"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";

type ConditionalAuthGuardProps = {
  children: React.ReactNode;
};

export function ConditionalAuthGuard({ children }: ConditionalAuthGuardProps) {
  const pathname = usePathname();

  // ランディングと公開ページは認証ガードを適用しない
  if (
    !pathname ||
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy")
  ) {
    return <>{children}</>;
  }

  return <AuthGuard>{children}</AuthGuard>;
}
