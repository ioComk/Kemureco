import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "../globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import FloatingRecordButton from "@/components/sessions/floating-record-button";
import { UserMenu } from "@/components/header/user-menu";
import { NavMenu } from "@/components/header/nav-menu";
import { BrandLogo } from "@/components/header/brand-logo";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Github } from "lucide-react";
import { RouteProgress } from "@/components/ui/route-progress";
import { ConditionalAuthGuard } from "@/components/layout/conditional-auth-guard";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://kemureco.pages.dev"),
  title: {
    default: "Kemureco",
    template: "%s | Kemureco"
  },
  description: "Kemureco",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  }
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "nav" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <ConditionalAuthGuard>
                <Suspense fallback={null}>
                  <RouteProgress />
                </Suspense>
                <div className="flex min-h-screen flex-col">
                  <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                    <div className="container flex h-16 items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/${locale}`} className="flex items-center gap-3">
                          <BrandLogo />
                        </Link>
                        <div className="hidden items-center gap-2 sm:flex">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/${locale}/flavors`}>{t("flavors")}</Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/${locale}/sessions`}>{t("myRecords")}</Link>
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="sm:hidden">
                          <NavMenu locale={locale} />
                        </div>
                        <ThemeToggle />
                        <UserMenu />
                      </div>
                    </div>
                  </header>
                  <main className="container flex-1 py-10 pb-24 sm:pb-10">{children}</main>
                  <footer className="hidden border-t bg-card sm:block">
                    <div className="container flex h-14 items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span>&copy; {new Date().getFullYear()} Kemureco</span>
                      <Link className="underline-offset-4 hover:underline" href={`/${locale}/terms`}>
                        {tFooter("terms")}
                      </Link>
                      <Link className="underline-offset-4 hover:underline" href={`/${locale}/privacy`}>
                        {tFooter("privacy")}
                      </Link>
                      <a
                        href="https://github.com/ioComk/Kemureco"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Kemureco GitHub repository"
                        className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    </div>
                  </footer>
                </div>
                <FloatingRecordButton />
                <Toaster />
              </ConditionalAuthGuard>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
