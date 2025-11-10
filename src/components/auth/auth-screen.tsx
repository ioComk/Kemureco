"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SessionInfo = {
  email?: string;
  loading: boolean;
};

export function AuthScreen() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const router = useRouter();
  const { toast } = useToast();

  const [session, setSession] = useState<SessionInfo>({ loading: true });
  const [email, setEmail] = useState("");
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setSession({ loading: false, email: data.user?.email ?? undefined });
      })
      .catch(() => {
        if (!mounted) return;
        setSession({ loading: false, email: undefined });
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession({ loading: false, email: authSession?.user?.email ?? undefined });
      router.refresh();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleOtpSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    setIsOtpSubmitting(true);
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    setIsOtpSubmitting(false);

    if (error) {
      toast({
        title: "メール送信に失敗しました",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "認証メールを送信しました",
      description: `${email} を確認してください。`
    });
    setEmail("");
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
      }
    });
    setIsGoogleSigningIn(false);

    if (error) {
      toast({
        title: "Google サインインに失敗しました",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);

    if (error) {
      toast({
        title: "サインアウトに失敗しました",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "サインアウトしました"
    });
    setSession({ loading: false, email: undefined });
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>サインイン</CardTitle>
          <CardDescription>
            メールによる認証リンク、または Google アカウントでサインインできます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              現在の状態:{" "}
              {session.loading ? "確認中..." : session.email ? `${session.email} でサインイン中` : "未サインイン"}
            </p>
          </div>
          <form className="space-y-3" onSubmit={handleOtpSignIn}>
            <div className="space-y-2">
              <Label htmlFor="auth-email">メールアドレス</Label>
              <Input
                id="auth-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isOtpSubmitting}
              />
            </div>
            <Button type="submit" disabled={isOtpSubmitting}>
              {isOtpSubmitting ? "送信中..." : "認証メールを送る"}
            </Button>
          </form>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">または</p>
            <Button type="button" variant="secondary" onClick={handleGoogleSignIn} disabled={isGoogleSigningIn}>
              {isGoogleSigningIn ? "リダイレクト中..." : "Google でサインイン"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>サインアウト</CardTitle>
          <CardDescription>共有端末では利用後のサインアウトをおすすめします。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={handleSignOut} disabled={isSigningOut || !session.email}>
            {isSigningOut ? "処理中..." : "サインアウト"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
