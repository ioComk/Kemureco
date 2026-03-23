"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Calendar, Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function BottomNav() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] ?? "ja";
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ボトムナビゲーションを非表示にするパス
  const HIDDEN_PATHS = [`/${locale}/sessions/new`, `/${locale}/flavors/new`, `/${locale}/auth`];

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  if (authLoading || HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  const navItems: Array<{ href: Route; label: string; icon: LucideIcon; exact: boolean }> = [
    {
      href: `/${locale}` as Route,
      label: "ホーム",
      icon: Home,
      exact: true
    },
    {
      href: `/${locale}/flavors` as Route,
      label: "フレーバー",
      icon: Package,
      exact: false
    },
    {
      href: `/${locale}/sessions` as Route,
      label: "記録",
      icon: Calendar,
      exact: false
    }
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* フローティングアクションメニュー（モバイルのみ） */}
      {user && open && (
        <div className="fixed inset-x-0 bottom-20 z-40 px-4 sm:hidden" ref={menuRef}>
          <div className="mx-auto flex max-w-sm flex-col gap-2 rounded-lg border bg-background p-2 shadow-lg">
            <Button asChild size="sm" variant="outline" className="w-full justify-start">
              <Link href={`/${locale}/sessions/new`} onClick={() => setOpen(false)}>
                <Calendar className="mr-2 h-4 w-4" />
                セッションを記録
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="w-full justify-start">
              <Link href={`/${locale}/flavors/new`} onClick={() => setOpen(false)}>
                <Package className="mr-2 h-4 w-4" />
                フレーバーを登録
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 min-h-[44px] transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "fill-current")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* 中央の記録ボタン */}
          {user ? (
            <button
              ref={buttonRef}
              onClick={() => setOpen((prev) => !prev)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all",
                open && "rotate-45"
              )}
              aria-label="記録する"
            >
              <Plus className="h-6 w-6" />
            </button>
          ) : (
            <Link
              href={`/${locale}/auth`}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all"
              aria-label="ログイン"
            >
              <Plus className="h-6 w-6" />
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
