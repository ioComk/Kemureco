"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/components/auth/auth-status";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-provider";

const SignOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 12h9m0 0l-3.333-4M22 12l-3.333 4M14 7V5.174a2 2 0 0 0-2.166-1.993l-8 .666A2 2 0 0 0 2 5.84v12.32a2 2 0 0 0 1.834 1.993l8 .667A2 2 0 0 0 14 18.826V17"
    />
  </svg>
);

export function UserMenu() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined);

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);

    if (error) {
      toast({
        title: "サインアウトに失敗しました",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setOpen(false);
    toast({
      title: "サインアウトしました"
    });
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!ref.current) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-auth-dialog]")) return;
      if (!ref.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        aria-label="User menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        {avatarUrl && !avatarError ? (
          <img
            src={avatarUrl}
            alt={user?.email ?? "User avatar"}
            className="h-6 w-6 rounded-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <UserRound className="h-5 w-5" />
        )}
      </Button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-md border bg-background p-3 shadow-lg dark:bg-neutral-900">
          <div className="space-y-3">
            <AuthStatus />
            <Button asChild variant="outline" size="sm" className="w-full">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSdkXvLIgi0GBFE9s5rCg_PO2EvPjJTEObG184eXXiKMtR8W5w/viewform?usp=header"
                target="_blank"
                rel="noreferrer"
              >
                バグ報告・お問い合わせ
              </a>
            </Button>
            {user?.email ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full text-destructive hover:text-destructive"
              >
                <span className="flex items-center gap-2">
                  <SignOutIcon className="h-4 w-4" />
                  {signingOut ? "処理中..." : "サインアウト"}
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default UserMenu;
