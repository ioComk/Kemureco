"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function BrandLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme = mounted ? resolvedTheme : "light";
  const logoSrc = currentTheme === "dark" ? "/icon-dark.png" : "/icon.png";

  return (
    <>
      <Image
        src={logoSrc}
        alt="Kemureco"
        width={22}
        height={22}
        className="h-[22px] w-[22px]"
        priority
      />
      <span className="text-lg font-semibold">Kemureco</span>
    </>
  );
}
