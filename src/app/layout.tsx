import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import FloatingRecordButton from "@/components/sessions/floating-record-button";
import { UserMenu } from "@/components/header/user-menu";
import { NavMenu } from "@/components/header/nav-menu";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthProvider } from "@/components/auth/auth-provider";

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
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <div className="container flex h-16 items-center justify-between gap-4">
                  <Link href="/" className="flex items-center gap-3">
                    <span className="text-lg font-semibold">Kemureco</span>
                  </Link>
                  <div className="flex items-center gap-3">
                    <NavMenu />
                    <div className="hidden items-center gap-2 sm:flex">
                      <Button asChild variant="ghost" size="sm">
                        <Link href="/flavors">Flavors</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href="/sessions">My records</Link>
                      </Button>
                    </div>
                    <ThemeToggle />
                    <UserMenu />
                  </div>
                </div>
              </header>
              <main className="container flex-1 py-10">{children}</main>
              <footer className="border-t bg-card">
                <div className="container flex h-14 items-center text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Kemureco
                </div>
              </footer>
            </div>
            <FloatingRecordButton />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
