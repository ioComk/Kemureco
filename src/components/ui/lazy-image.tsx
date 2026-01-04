"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LazyImageProps = {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  placeholderClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
};

export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  placeholderClassName,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px", // 200px手前から読み込み開始
        threshold: 0
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", containerClassName)}>
      {/* スケルトンローダー */}
      {!isLoaded && !hasError && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40 bg-[length:200%_100%]",
            placeholderClassName
          )}
          style={{
            animation: "shimmer 1.5s ease-in-out infinite"
          }}
        />
      )}

      {/* エラー表示 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <span className="text-xs text-muted-foreground">画像なし</span>
        </div>
      )}

      {/* 実際の画像 - 可視範囲に入ったら読み込み開始 */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}

