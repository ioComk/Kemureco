"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { GoogleFill } from "akar-icons";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("auth");
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // パス先頭の /[locale] を取得 (例: /ja → "ja")
  const locale = pathname.split("/")[1] ?? "ja";
  const authMethodStorageKey = "kemureco-auth-method";

  const siteUrl =
    (typeof window === "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin) ??
    undefined;

  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [authMethod, setAuthMethod] = useState<"magic" | "password">("magic");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isTwitterSigningIn, setIsTwitterSigningIn] = useState(false);
  const [notifiedSignedIn, setNotifiedSignedIn] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isMagicCooldownActive = authMethod === "magic" && resendCooldown > 0 && sentEmail === email;

  useEffect(() => {
    if (user?.email && !notifiedSignedIn) {
      setNotifiedSignedIn(true);
      onSignedIn?.();
      router.replace(`/${locale}/sessions`);
    }
  }, [user?.email, onSignedIn, notifiedSignedIn, router]);

  useEffect(() => {
    if (mode === "sign-up") {
      setAuthMethod("password");
      return;
    }
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(authMethodStorageKey);
    if (stored === "magic" || stored === "password") {
      setAuthMethod(stored);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "sign-in") return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(authMethodStorageKey, authMethod);
  }, [authMethod, mode, authMethodStorageKey]);

  useEffect(() => {
    if (authMethod !== "magic") {
      setSentEmail(null);
      setResendCooldown(0);
    }
  }, [authMethod]);

  useEffect(() => {
    if (!sentEmail || email === sentEmail) return;
    setSentEmail(null);
    setResendCooldown(0);
  }, [email, sentEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleOtpSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setEmailError(t("emailRequired"));
      return;
    }
    if (isMagicCooldownActive) return;

    setIsOtpSubmitting(true);
    setFormError(null);
    const redirectTo = siteUrl;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    setIsOtpSubmitting(false);

    if (error) {
      setFormError(error.message);
      toast({
        title: t("emailSendError"),
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: t("magicLinkSent"),
      description: t("checkEmail", { email })
    });
    setSentEmail(email);
    setResendCooldown(30);
  };

  const handlePasswordAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let hasError = false;
    if (!email) {
      setEmailError(t("emailRequired"));
      hasError = true;
    }
    if (!password) {
      setPasswordError(t("passwordRequired"));
      hasError = true;
    }
    if (hasError) return;

    setIsPasswordSubmitting(true);
    setFormError(null);
    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setIsPasswordSubmitting(false);
      if (error) {
        setFormError(error.message);
        toast({
          title: t("signInError"),
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      toast({ title: t("signInSuccess") });
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    setIsPasswordSubmitting(false);
    if (error) {
      setFormError(error.message);
      toast({
        title: t("signUpError"),
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: t("confirmEmailSent"),
      description: t("checkEmail", { email })
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
      setFormError(error.message);
      toast({
        title: t("googleSignInError"),
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
      setFormError(error.message);
      toast({
        title: t("xSignInError"),
        description: error.message,
        variant: "destructive"
      });
      return;
    }

  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 pb-16 sm:pb-12">
      <div className="mb-10 flex items-center justify-end text-sm">
        <button
          type="button"
          className="text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        >
          {mode === "sign-in" ? t("goToSignUp") : t("goToSignIn")}
        </button>
      </div>

      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {mode === "sign-in" ? t("signInTitle") : t("signUpTitle")}
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
                {t("continueWithGoogle")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTwitterSignIn}
                disabled={isTwitterSigningIn}
                className="h-12 gap-2 rounded-full"
              >
                {isTwitterSigningIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <XIcon className="h-4 w-4" />}
                {t("continueWithX")}
              </Button>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t("continueWithEmail")}
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
                {t("magicLink")}
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-2 font-medium transition ${
                  authMethod === "password" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => setAuthMethod("password")}
              >
                {t("password")}
              </button>
            </div>
          </>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={authMethod === "magic" ? handleOtpSignIn : handlePasswordAuth}
        >
          <div className="space-y-2">
            <Label htmlFor="auth-email">{t("email")}</Label>
            <Input
              id="auth-email"
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "auth-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(null);
                setFormError(null);
              }}
              disabled={isOtpSubmitting || isPasswordSubmitting}
            />
            {emailError ? (
              <p id="auth-email-error" className="text-xs text-destructive">
                {emailError}
              </p>
            ) : null}
          </div>
          {authMethod === "password" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="auth-password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? "auth-password-error" : undefined}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError(null);
                      setFormError(null);
                    }}
                    disabled={isPasswordSubmitting}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError ? (
                  <p id="auth-password-error" className="text-xs text-destructive">
                    {passwordError}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
          <Button
            type="submit"
            disabled={isOtpSubmitting || isPasswordSubmitting || isMagicCooldownActive}
            className="h-12 w-full rounded-full"
          >
            {isOtpSubmitting || isPasswordSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : authMethod === "magic" ? (
              <Mail className="mr-2 h-4 w-4" />
            ) : null}
            {isOtpSubmitting || isPasswordSubmitting
              ? t("sending")
              : authMethod === "magic"
                ? t("sendMagicLink")
                : mode === "sign-in"
                  ? t("signIn")
                  : t("createAccount")}
          </Button>
          {sentEmail && authMethod === "magic" ? (
            <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t("magicLinkSent")}</p>
              <p className="mt-1 text-xs">{sentEmail}</p>
              <p className="mt-2 text-xs">
                {resendCooldown > 0 ? t("resendIn", { seconds: resendCooldown }) : t("canResend")}
              </p>
              <button
                type="button"
                className="mt-3 text-xs font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setSentEmail(null);
                  setResendCooldown(0);
                  setEmail("");
                }}
              >
                {t("sendWithDifferentEmail")}
              </button>
            </div>
          ) : null}
          {formError ? (
            <p className="text-center text-xs text-destructive" role="alert" aria-live="polite">
              {formError}
            </p>
          ) : null}
          {user?.email ? (
            <p className="text-center text-xs text-muted-foreground">{t("loggedInAs", { email: user.email })}</p>
          ) : null}
          <p className="text-center text-xs text-muted-foreground">
            {t("agreeToTerms")}{" "}
            <Link href={`/${locale}/terms`} className="underline-offset-4 hover:underline">
              {t("termsLink")}
            </Link>
            {" / "}
            <Link href={`/${locale}/privacy`} className="underline-offset-4 hover:underline">
              {t("privacyLink")}
            </Link>
            {t("agreeToTermsSuffix")}
          </p>
        </form>
      </div>
    </div>
  );
}
