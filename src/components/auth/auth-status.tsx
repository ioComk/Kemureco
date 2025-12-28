"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { GoogleFill } from "akar-icons";
import { Twitter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthScreen } from "@/components/auth/auth-screen";

type AuthState = {
  loading: boolean;
  email?: string;
  provider?: string;
};

export function AuthStatus() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();

  const [state, setState] = useState<AuthState>({ loading: true });
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const provider = data.user?.app_metadata?.provider ?? data.user?.identities?.[0]?.provider;
        setState({ loading: false, email: data.user?.email ?? undefined, provider });
      })
      .catch(() => {
        if (!mounted) return;
        setState({ loading: false, email: undefined });
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const provider = session?.user?.app_metadata?.provider ?? session?.user?.identities?.[0]?.provider;
      setState({ loading: false, email: session?.user?.email ?? undefined, provider });
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

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

    setState({ loading: false, email: undefined, provider: undefined });
    toast({
      title: "サインアウトしました"
    });
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full justify-center sm:w-auto">
            サインイン
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <div data-auth-dialog>
            <DialogTitle className="sr-only">サインイン</DialogTitle>
            <AuthScreen onSignedIn={() => setOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-right sm:flex-row sm:items-center sm:text-left">
      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {state.provider === "google" ? <GoogleFill size={14} /> : null}
        {state.provider === "twitter" ? <Twitter className="h-4 w-4" /> : null}
        Signed in
      </span>
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
