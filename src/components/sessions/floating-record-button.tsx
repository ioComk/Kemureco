"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

// フローティングボタンを非表示にするパス
const HIDDEN_PATHS = ["/sessions/new", "/flavors/new"];

export function FloatingRecordButton() {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const handleSelect = () => setOpen(false);

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
        className={`mb-3 flex flex-col items-end gap-2 transition-all ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <Button asChild size="sm" className="rounded-full shadow-lg">
          <Link href="/flavors/new" onClick={handleSelect}>
            フレーバーを登録する
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary" className="rounded-full shadow-lg">
          <Link href="/sessions/new" onClick={handleSelect} className="text-black">
            記録する
          </Link>
        </Button>
      </div>
      <Button
        type="button"
        size="lg"
        className="h-16 w-16 rounded-full shadow-lg p-0"
        aria-expanded={open}
        aria-controls="floating-action-menu"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-2xl leading-none">＋</span>
        <span className="sr-only">{open ? "閉じる" : "記録する"}</span>
      </Button>
    </div>
  );
}

export default FloatingRecordButton;
