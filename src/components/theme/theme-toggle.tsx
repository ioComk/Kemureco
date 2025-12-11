"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const current = theme === "system" ? systemTheme : theme;

  const toggle = () => setTheme(current === "dark" ? "light" : "dark");

  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme" className="rounded-full px-2">
      {current === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
