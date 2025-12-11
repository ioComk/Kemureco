"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/components/auth/auth-status";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function UserMenu() {
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
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        aria-label="User menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <UserRound className="h-5 w-5" />
      </Button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-md border bg-popover p-3 shadow-lg">
          <div className="flex items-center justify-between gap-2 pb-3 border-b">
            <p className="text-sm font-medium">Settings</p>
            <ThemeToggle />
          </div>
          <div className="pt-3">
            <AuthStatus />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default UserMenu;
