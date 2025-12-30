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
import { useAuth } from "@/components/auth/auth-provider";

type AuthScreenProps = {
  onSignedIn?: () => void;
};

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1024 1024" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M921 912L601.11 445.745l.546.437L890.084 112h-96.385L558.738 384L372.15 112H119.367l298.648 435.31l-.036-.037L103 912h96.385l261.222-302.618L668.217 912zM333.96 184.727l448.827 654.546h-76.38l-449.19-654.546z"
    />
  </svg>
);

export function AuthScreen({ onSignedIn }: AuthScreenProps = {}) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const siteUrl =
    (typeof window === "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin) ??
    undefined;

  const [email, setEmail] = useState("");
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isTwitterSigningIn, setIsTwitterSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [notifiedSignedIn, setNotifiedSignedIn] = useState(false);
  

  useEffect(() => {
    if (user?.email && onSignedIn && !notifiedSignedIn) {
      setNotifiedSignedIn(true);
      onSignedIn();
    }
  }, [user?.email, onSignedIn, notifiedSignedIn]);

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
    console.log(redirectTo);

    if (error) {
      toast({
        title: "Google サインインに失敗しました",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTwitterSignIn = async () => {
    setIsTwitterSigningIn(true);
    const redirectTo = siteUrl ? `${siteUrl}/auth` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo
      }
    });
    setIsTwitterSigningIn(false);

    if (error) {
      toast({
        title: "X サインインに失敗しました",
        description: error.message,
        variant: "destructive"
      });
      return;
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
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>サインイン</CardTitle>
          <CardDescription>
            メールによる認証リンク、または Google / X アカウントでサインインできます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>現在の状態:</span>
              {loading ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  確認中...
                </Badge>
              ) : user?.email ? (
                <Badge variant="default">Signed in</Badge>
              ) : (
                <Badge variant="outline">未サインイン</Badge>
              )}
            </div>
            {user?.email ? (
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
            <Button
              type="button"
              variant="outline"
              onClick={handleTwitterSignIn}
              disabled={isTwitterSigningIn}
              className="w-full sm:w-auto gap-2 shadow-sm"
            >
              {isTwitterSigningIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <XIcon className="h-4 w-4" />}
              {isTwitterSigningIn ? "リダイレクト中..." : "X でサインイン"}
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
              disabled={isSigningOut || !user?.email}
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
