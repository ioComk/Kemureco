import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthStatus } from "@/components/auth/auth-status";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kemureco | シーシャのフレーバー記録",
  description: "シーシャのフレーバーを記録し、おすすめのミックスを探す Web アプリ"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <div className="flex min-h-screen flex-col">
          <header className="border-b bg-card">
            <div className="container flex h-16 items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-lg font-semibold">Kemureco</span>
                <span className="hidden text-sm text-muted-foreground sm:inline-block">
                  シーシャ記録 &amp; おすすめ
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <AuthStatus />
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
        <Toaster />
      </body>
    </html>
  );
}
