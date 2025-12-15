"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Mail } from "lucide-react";
import { GoogleFill } from "akar-icons";

type SessionInfo = {
  email?: string;
  loading: boolean;
};

type AuthScreenProps = {
  onSignedIn?: () => void;
};

export function AuthScreen({ onSignedIn }: AuthScreenProps = {}) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();

  const siteUrl =
    (typeof window === "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin) ??
    undefined;

  const [session, setSession] = useState<SessionInfo>({ loading: true });
  const [email, setEmail] = useState("");
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [notifiedSignedIn, setNotifiedSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setSession({ loading: false, email: data.user?.email ?? undefined });
        if (data.user?.email && onSignedIn && !notifiedSignedIn) {
          setNotifiedSignedIn(true);
          onSignedIn();
        }
      })
      .catch(() => {
        if (!mounted) return;
        setSession({ loading: false, email: undefined });
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession({ loading: false, email: authSession?.user?.email ?? undefined });
      if (authSession?.user?.email && onSignedIn && !notifiedSignedIn) {
        setNotifiedSignedIn(true);
        onSignedIn();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, onSignedIn, notifiedSignedIn]);

  const handleOtpSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    setIsOtpSubmitting(true);
    const redirectTo = siteUrl;
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
    const redirectTo = siteUrl ? `${siteUrl}/auth` : undefined;
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>現在の状態:</span>
              {session.loading ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  確認中...
                </Badge>
              ) : session.email ? (
                <Badge variant="default">Signed in</Badge>
              ) : (
                <Badge variant="outline">未サインイン</Badge>
              )}
            </div>
            {session.email ? (
              <p className="text-xs text-muted-foreground mt-1">※ メールアドレスの表示は省略しています</p>
            ) : null}
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
            <Button
              type="submit"
              disabled={isOtpSubmitting}
              className="w-full sm:w-auto gap-2 shadow-sm"
            >
              {isOtpSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {isOtpSubmitting ? "送信中..." : "認証メールを送る"}
            </Button>
          </form>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">または</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSigningIn}
              className="w-full sm:w-auto gap-2 shadow-sm"
            >
              {isGoogleSigningIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleFill size={18} />}
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
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            disabled={isSigningOut || !session.email}
            className="gap-2 shadow-sm w-full sm:w-auto"
          >
            {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {isSigningOut ? "処理中..." : "サインアウト"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
