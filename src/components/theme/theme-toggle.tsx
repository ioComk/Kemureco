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

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "relative flex w-36 items-center rounded-full border border-border p-1 text-xs font-semibold transition",
        isDark ? "bg-[#2f3645] text-white" : "bg-[#e3e7ef] text-slate-600"
      )}
      aria-pressed={isDark}
      aria-label="テーマを切り替える"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-1 flex items-center rounded-full bg-white/80 shadow transition",
          isDark ? "translate-x-16" : "translate-x-0"
        )}
      >
        <span className="mx-auto text-lg">{isDark ? "🌙" : "☀️"}</span>
      </div>
      <span className={cn("flex-1 text-center transition", isDark ? "text-white/40" : "text-slate-700")}>LIGHT MODE</span>
      <span className={cn("flex-1 text-center transition", isDark ? "text-white" : "text-slate-500/60")}>DARK MODE</span>
    </button>
  );
}
