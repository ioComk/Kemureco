"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/components/auth/auth-status";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!ref.current) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-auth-dialog]")) return;
      if (!ref.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
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
          <AuthStatus />
        </div>
      ) : null}
    </div>
  );
}

export default UserMenu;
