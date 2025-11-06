import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kemureco | シーシャのフレーバー記録",
  description:
    "シーシャのフレーバーを記録し、おすすめのミックスを探す Web アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className,
        )}
      >
        <div className="flex min-h-screen flex-col">
          <header className="border-b bg-card">
            <div className="container flex h-16 items-center justify-between">
              <span className="text-lg font-semibold">Kemureco</span>
              <nav className="text-sm text-muted-foreground">
                シーシャ記録 &amp; おすすめ
              </nav>
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
