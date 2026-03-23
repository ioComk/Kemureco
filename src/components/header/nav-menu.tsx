"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type NavMenuProps = {
  locale: string;
};

export function NavMenu({ locale }: NavMenuProps) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const menuId = "nav-menu-dropdown";

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  return (
    <div className="relative sm:hidden" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        aria-label={open ? "メニューを閉じる" : "ナビゲーションメニューを開く"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="ナビゲーションメニュー"
          className="absolute right-0 z-50 mt-2 w-44 rounded-md border bg-popover p-2 shadow-lg"
        >
          <nav className="flex flex-col gap-1 text-sm" aria-label="サイトナビゲーション">
            <Link
              href={`/${locale}/flavors`}
              className="rounded-md px-3 py-2.5 min-h-[44px] flex items-center transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setOpen(false)}
            >
              {t("flavors")}
            </Link>
            <Link
              href={`/${locale}/sessions`}
              className="rounded-md px-3 py-2.5 min-h-[44px] flex items-center transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setOpen(false)}
            >
              {t("myRecords")}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="rounded-md px-3 py-2.5 min-h-[44px] flex items-center transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setOpen(false)}
            >
              {t("terms")}
            </Link>
            <Link
              href={`/${locale}/privacy`}
              className="rounded-md px-3 py-2.5 min-h-[44px] flex items-center transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setOpen(false)}
            >
              {t("privacy")}
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

export default NavMenu;
