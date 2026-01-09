"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
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
  const router = useRouter();

  const siteUrl =
    (typeof window === "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin) ??
    undefined;

  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [authMethod, setAuthMethod] = useState<"magic" | "password">("magic");
  const [password, setPassword] = useState("");
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isTwitterSigningIn, setIsTwitterSigningIn] = useState(false);
  const [notifiedSignedIn, setNotifiedSignedIn] = useState(false);
  

  useEffect(() => {
    if (user?.email && !notifiedSignedIn) {
      setNotifiedSignedIn(true);
      onSignedIn?.();
      router.replace("/");
    }
  }, [user?.email, onSignedIn, notifiedSignedIn, router]);

  useEffect(() => {
    if (mode === "sign-up") {
      setAuthMethod("password");
    }
  }, [mode]);

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

  const handlePasswordAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) return;

    setIsPasswordSubmitting(true);
    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setIsPasswordSubmitting(false);
      if (error) {
        toast({
          title: "サインインに失敗しました",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      toast({ title: "サインインしました" });
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    setIsPasswordSubmitting(false);
    if (error) {
      toast({
        title: "サインアップに失敗しました",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "確認メールを送信しました",
      description: `${email} を確認してください。`
    });
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

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-10 flex items-center justify-end text-sm">
        <button
          type="button"
          className="text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        >
          {mode === "sign-in" ? "Sign Up" : "Sign In"}
        </button>
      </div>

      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {mode === "sign-in" ? "Sign in to your account" : "Create an account"}
          </h1>
        </div>

        {mode === "sign-in" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSigningIn}
                className="h-12 gap-2 rounded-full"
              >
                {isGoogleSigningIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleFill size={18} />}
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTwitterSignIn}
                disabled={isTwitterSigningIn}
                className="h-12 gap-2 rounded-full"
              >
                {isTwitterSigningIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <XIcon className="h-4 w-4" />}
                X account
              </Button>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              OR CONTINUE WITH EMAIL
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 rounded-full border bg-muted/30 p-1 text-sm">
              <button
                type="button"
                className={`rounded-full px-3 py-2 font-medium transition ${
                  authMethod === "magic" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => setAuthMethod("magic")}
              >
                Magic Link
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-2 font-medium transition ${
                  authMethod === "password" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => setAuthMethod("password")}
              >
                Password
              </button>
            </div>
          </>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={authMethod === "magic" ? handleOtpSignIn : handlePasswordAuth}
        >
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isOtpSubmitting || isPasswordSubmitting}
            />
          </div>
          {authMethod === "password" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isPasswordSubmitting}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-input" />
                  Remember me
                </label>
                <button type="button" className="underline-offset-4 hover:underline">
                  Forgot password?
                </button>
              </div>
            </>
          ) : null}
          <Button
            type="submit"
            disabled={isOtpSubmitting || isPasswordSubmitting}
            className="h-12 w-full rounded-full"
          >
            {(isOtpSubmitting || isPasswordSubmitting) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : authMethod === "magic" ? (
              <Mail className="mr-2 h-4 w-4" />
            ) : null}
            {isOtpSubmitting || isPasswordSubmitting
              ? "Sending..."
              : authMethod === "magic"
                ? "Send magic link"
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
          </Button>
          {user?.email ? (
            <p className="text-center text-xs text-muted-foreground">Signed in as {user.email}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
