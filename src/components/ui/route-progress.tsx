"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timeout = setTimeout(() => setActive(false), 400);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 right-0 top-0 z-[60] h-0.5 opacity-0 transition-opacity duration-200",
        active && "opacity-100"
      )}
      aria-hidden="true"
    >
      <div className="h-full w-full origin-left animate-[progress_0.4s_ease-out] bg-primary" />
    </div>
  );
}
