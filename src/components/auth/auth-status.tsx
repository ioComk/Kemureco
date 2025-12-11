"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

type AuthState = {
  loading: boolean;
  email?: string;
};

export function AuthStatus() {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const { toast } = useToast();

  const [state, setState] = useState<AuthState>({ loading: true });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setState({ loading: false, email: data.user?.email ?? undefined });
      })
      .catch(() => {
        if (!mounted) return;
        setState({ loading: false, email: undefined });
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ loading: false, email: session?.user?.email ?? undefined });
      router.refresh();
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

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

    setState({ loading: false, email: undefined });
    toast({
      title: "サインアウトしました"
    });
    router.refresh();
  };

  if (state.loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        認証中...
      </Button>
    );
  }

  if (!state.email) {
    return (
      <Button asChild size="sm">
        <Link href="/auth">サインイン</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-right sm:flex-row sm:items-center sm:text-left">
      <span className="text-sm font-medium text-muted-foreground">Signed in</span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full sm:w-auto"
      >
        {signingOut ? "処理中..." : "サインアウト"}
      </Button>
    </div>
  );
}
