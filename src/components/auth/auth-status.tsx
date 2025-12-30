"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleFill } from "akar-icons";
import { Mail } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1024 1024" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M921 912L601.11 445.745l.546.437L890.084 112h-96.385L558.738 384L372.15 112H119.367l298.648 435.31l-.036-.037L103 912h96.385l261.222-302.618L668.217 912zM333.96 184.727l448.827 654.546h-76.38l-449.19-654.546z"
    />
  </svg>
);

export function AuthStatus() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full justify-center">
        認証中...
      </Button>
    );
  }

  if (!user?.email) {
    return (
      <Button asChild size="sm" className="w-full justify-center">
        <Link href="/auth">サインイン</Link>
      </Button>
    );
  }

  const provider = user?.app_metadata?.provider;
  const providerIcon =
    provider === "google" ? (
      <GoogleFill size={14} />
    ) : provider === "twitter" ? (
      <XIcon className="h-4 w-4" />
    ) : (
      <Mail className="h-4 w-4" />
    );
  const providerLabel = provider === "google" ? "Google" : provider === "twitter" ? "X" : "Email";

  return (
    <div className="w-full text-center text-sm font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span>Signed in with</span>
        {providerIcon}
        <span className="sr-only">{providerLabel}</span>
      </span>
    </div>
  );
}
