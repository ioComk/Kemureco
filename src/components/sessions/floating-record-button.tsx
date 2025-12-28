"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FloatingRecordButton() {
  const [open, setOpen] = useState(false);
  const handleSelect = () => setOpen(false);

  return (
    <div
      className="fixed bottom-6 right-2 sm:right-4 z-50 flex flex-col items-end"
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
          <Link href="/sessions/new" onClick={handleSelect}>
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
