"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Keep a deterministic render on the server to avoid hydration mismatches.
  const currentTheme = mounted ? resolvedTheme : "light";
  const toggle = () => setTheme(currentTheme === "dark" ? "light" : "dark");

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={currentTheme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
      className="rounded-full px-2 transition-transform duration-150 active:scale-95"
      disabled={!mounted}
    >
      {currentTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
