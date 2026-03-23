"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type NavMenuProps = {
  locale: string;
};

export function NavMenu({ locale }: NavMenuProps) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative sm:hidden" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        aria-label="Navigation menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-md border bg-popover p-2 shadow-lg">
          <nav className="flex flex-col gap-1 text-sm">
            <Link
              href={`/${locale}/flavors`}
              className="rounded-md px-3 py-2.5 hover:bg-accent hover:text-accent-foreground min-h-[44px] flex items-center"
              onClick={() => setOpen(false)}
            >
              {t("flavors")}
            </Link>
            <Link
              href={`/${locale}/sessions`}
              className="rounded-md px-3 py-2.5 hover:bg-accent hover:text-accent-foreground min-h-[44px] flex items-center"
              onClick={() => setOpen(false)}
            >
              {t("myRecords")}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="rounded-md px-3 py-2.5 hover:bg-accent hover:text-accent-foreground min-h-[44px] flex items-center"
              onClick={() => setOpen(false)}
            >
              {t("terms")}
            </Link>
            <Link
              href={`/${locale}/privacy`}
              className="rounded-md px-3 py-2.5 hover:bg-accent hover:text-accent-foreground min-h-[44px] flex items-center"
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
