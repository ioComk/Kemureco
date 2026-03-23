"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavMenu() {
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
              href="/flavors"
              className="rounded-md px-3 py-2.5 hover:bg-accent hover:text-accent-foreground min-h-[44px] flex items-center"
              onClick={() => setOpen(false)}
            >
              Flavors
            </Link>
            <Link
              href="/sessions"
              className="rounded-md px-3 py-2.5 hover:bg-accent hover:text-accent-foreground min-h-[44px] flex items-center"
              onClick={() => setOpen(false)}
            >
              My records
            </Link>
            <Link
              href="/terms"
              className="rounded-md px-3 py-2.5 hover:bg-accent hover:text-accent-foreground min-h-[44px] flex items-center"
              onClick={() => setOpen(false)}
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="rounded-md px-3 py-2.5 hover:bg-accent hover:text-accent-foreground min-h-[44px] flex items-center"
              onClick={() => setOpen(false)}
            >
              プライバシー
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

export default NavMenu;
