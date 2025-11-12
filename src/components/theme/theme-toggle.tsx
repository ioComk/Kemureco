"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "kemureco-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? undefined;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initialTheme = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const handleToggle = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Theme: <span className="font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
      </span>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "relative flex w-16 items-center rounded-full border border-border bg-muted/50 px-1 py-1 transition",
          theme === "dark" ? "bg-muted" : "bg-background"
        )}
        aria-pressed={theme === "dark"}
        aria-label="テーマを切り替える"
      >
        <span className="pointer-events-none flex w-full items-center justify-between text-xs">
          <span className={cn("transition-opacity", theme === "dark" ? "opacity-30" : "opacity-100")}>☀️</span>
          <span className={cn("transition-opacity", theme === "dark" ? "opacity-100" : "opacity-30")}>🌙</span>
        </span>
        <span
          className={cn(
            "pointer-events-none absolute h-5 w-5 rounded-full bg-primary shadow transition-transform",
            theme === "dark" ? "translate-x-7" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
