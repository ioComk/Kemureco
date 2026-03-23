"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

export function FloatingRecordButton() {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = pathname.split("/")[1] ?? "ja";
  const handleSelect = () => setOpen(false);

  // フローティングボタンを非表示にするパス
  const HIDDEN_PATHS = [`/${locale}/sessions/new`, `/${locale}/flavors/new`];

  // 記録・登録ページでは非表示
  if (authLoading || !user || HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 right-3 sm:bottom-7 sm:right-5 z-50 flex flex-col items-end"
      onMouseLeave={() => setOpen(false)}
    >
      <div
        id="floating-action-menu"
        role="group"
        aria-label="クイックアクション"
        className={`mb-3 flex flex-col items-end gap-2 transition-all duration-200 ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <Button asChild size="sm" className="rounded-full shadow-lg transition-transform duration-150 active:scale-95">
          <Link href={`/${locale}/flavors/new`} onClick={handleSelect}>
            フレーバーを登録する
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary" className="rounded-full shadow-lg transition-transform duration-150 active:scale-95">
          <Link href={`/${locale}/sessions/new`} onClick={handleSelect} className="text-black">
            記録する
          </Link>
        </Button>
      </div>
      <Button
        type="button"
        size="lg"
        className={`h-16 w-16 rounded-full shadow-lg p-0 transition-all duration-200 active:scale-95 ${open ? "rotate-45" : "rotate-0"}`}
        aria-expanded={open}
        aria-controls="floating-action-menu"
        aria-label={open ? "メニューを閉じる" : "記録・登録メニューを開く"}
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-2xl leading-none" aria-hidden="true">＋</span>
      </Button>
    </div>
  );
}

export default FloatingRecordButton;
