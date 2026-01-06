import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import FloatingRecordButton from "@/components/sessions/floating-record-button";
import { UserMenu } from "@/components/header/user-menu";
import { NavMenu } from "@/components/header/nav-menu";
import { BrandLogo } from "@/components/header/brand-logo";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Github } from "lucide-react";
import { RouteProgress } from "@/components/ui/route-progress";
import { ConditionalAuthGuard } from "@/components/layout/conditional-auth-guard";

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

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
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
                    <Link href="/" className="flex items-center gap-3">
                      <BrandLogo />
                    </Link>
                    <div className="hidden items-center gap-2 sm:flex">
                      <Button asChild variant="ghost" size="sm">
                        <Link href="/flavors">Flavors</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href="/sessions">My records</Link>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                      <NavMenu />
                    </div>
                    <ThemeToggle />
                    <UserMenu />
                  </div>
                  </div>
                </header>
                <main className="container flex-1 py-10 pb-24 sm:pb-10">{children}</main>
                <footer className="border-t bg-card sm:block hidden">
                  <div className="container flex h-14 items-center justify-center gap-3 text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Kemureco
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
              <div className="hidden sm:block">
                <FloatingRecordButton />
              </div>
              <BottomNav />
              <Toaster />
          </ConditionalAuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
