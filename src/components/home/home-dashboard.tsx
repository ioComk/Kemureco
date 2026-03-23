"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Kaisei_Decol, Zen_Kaku_Gothic_New } from "next/font/google";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeSessionOverview } from "@/components/sessions/home-session-overview";
import { HomeSessionsCalendar } from "@/components/sessions/home-sessions-calendar";
import { useAuth } from "@/components/auth/auth-provider";

const displayFont = Kaisei_Decol({
  weight: ["400", "700"],
  subsets: ["latin"]
});
const bodyFont = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"]
});

const featureHighlights = [
  {
    title: "フレーバーの記録を整える",
    description: "ブランド・タグ・写真で整理し、吸った後の印象まで残せます。"
  },
  {
    title: "ミックスの設計図を残す",
    description: "比率や層をメモして、再現性の高いブレンドを育てる。"
  },
  {
    title: "セッションの記憶をつなぐ",
    description: "場所・満足度・ノートを記録し、次の一杯に活かせます。"
  }
];

const workflowSteps = [
  {
    label: "Step 01",
    title: "気になるフレーバーを集める",
    detail: "タグやブランドで絞り込み、記録候補を増やします。"
  },
  {
    label: "Step 02",
    title: "ミックスを設計する",
    detail: "比率や層を保存して、再現性のあるブレンドを完成させます。"
  },
  {
    label: "Step 03",
    title: "セッションを記録する",
    detail: "満足度や場所を残して、次の好みが見えるように。"
  }
];

export function HomeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] ?? "ja";

  useEffect(() => {
    if (authLoading) return;
    if (user?.id) {
      router.replace(`/${locale}/sessions`);
    }
  }, [authLoading, user?.id, router, locale]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.scrollAnimate = "true";
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll]"));
    if (elements.length === 0) {
      return () => {
        delete root.dataset.scrollAnimate;
      };
    }
    const isInView = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const threshold = Math.min(rect.height * 0.2, viewportHeight * 0.2);
      return rect.top <= viewportHeight - threshold && rect.bottom >= threshold;
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    elements.forEach((el) => {
      if (isInView(el)) {
        el.classList.add("is-visible");
        return;
      }
      observer.observe(el);
    });
    return () => {
      observer.disconnect();
      delete root.dataset.scrollAnimate;
    };
  }, []);

  return (
    <div className={`space-y-16 ${bodyFont.className}`}>
      <section
        className="scroll-fade relative overflow-hidden rounded-[32px] border bg-[#f9f4ef] px-6 py-12 shadow-sm dark:border-[#3a3026] dark:bg-[#1e1a16] sm:px-12"
        data-scroll
      >
        <div className="absolute -left-16 top-10 h-44 w-44 rounded-full bg-[#f6d7b0] blur-3xl dark:bg-[#3a2a1f]" />
        <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-[#b7d6c7] blur-3xl dark:bg-[#274136]" />
        <div className="absolute right-12 top-8 hidden h-20 w-20 rotate-12 rounded-3xl border border-[#9a7b4f]/30 bg-white/50 dark:border-[#6f5a3a]/40 dark:bg-[#2a241e]/60 sm:block" />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-[#9a7b4f]/30 bg-white/70 text-[#6d4c2f] shadow-none dark:border-[#6f5a3a]/50 dark:bg-[#2a241e]/70 dark:text-[#f0d8b0]">
                香りを記録する
              </Badge>
              <Badge className="border border-[#3b6d57]/30 bg-white/70 text-[#2d5645] shadow-none dark:border-[#355f4c]/50 dark:bg-[#1f2a24]/70 dark:text-[#cfe2d6]">
                ミックスを設計する
              </Badge>
            </div>
            <div className={`${displayFont.className} space-y-4`}>
              <p className="text-sm font-medium tracking-[0.35em] text-[#7a5a3a] dark:text-[#b79a6d]">K E M U R E C O</p>
              <h1 className="text-3xl leading-tight text-[#2f2218] dark:text-[#f7ead9] sm:text-4xl lg:text-5xl">
                けむりの記憶を、<br />
                自分だけのレシピに。
              </h1>
            </div>
            <p className="text-base leading-relaxed text-[#4c3b2c] dark:text-[#d6c1a6] sm:text-lg">
              Kemurecoは、シーシャのフレーバーとミックスの記録を美しく整理し、次のセッションをもっと楽しむための
              記録プラットフォームです。
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Button asChild className="bg-[#2f2218] text-white hover:bg-[#3a2a1f] dark:bg-[#f3d8b2] dark:text-[#2a2018] dark:hover:bg-[#e9cfa4]">
                  <Link href={`/${locale}/sessions/new`}>今日の記録を残す</Link>
                </Button>
              ) : (
                <Button asChild className="bg-[#2f2218] text-white hover:bg-[#3a2a1f] dark:bg-[#f3d8b2] dark:text-[#2a2018] dark:hover:bg-[#e9cfa4]">
                  <Link href={`/${locale}/auth`}>はじめる</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <Card className="border-[#9a7b4f]/20 bg-white/80 shadow-sm dark:border-[#6f5a3a]/40 dark:bg-[#232019]/80">
              <CardHeader className="pb-2">
                <CardTitle className={`${displayFont.className} text-lg text-[#2f2218] dark:text-[#f5ead9]`}>
                  今日のフレーバーノート
                </CardTitle>
                <CardDescription className="text-[#5c4634] dark:text-[#cdb79b]">
                  フレーバーのニュアンス、熱の入り方、余韻をメモして次に活かせます。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[#5c4634] dark:text-[#cdb79b]">
                <div className="flex flex-col gap-1 rounded-xl border border-dashed border-[#9a7b4f]/30 bg-[#fdf9f4] px-3 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-[#6f5a3a]/50 dark:bg-[#1e1b16]">
                  <span>香り</span>
                  <span className="font-medium text-[#2f2218] dark:text-[#f2e6d6] sm:text-right">
                    フローラル / シトラス
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl border border-dashed border-[#9a7b4f]/30 bg-[#fdf9f4] px-3 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-[#6f5a3a]/50 dark:bg-[#1e1b16]">
                  <span>満足度</span>
                  <span className="font-medium text-[#2f2218] dark:text-[#f2e6d6] sm:text-right">
                    4.5 / 5
                  </span>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-[#3b6d57]/20 bg-white/80 shadow-sm dark:border-[#355f4c]/40 dark:bg-[#1f2a24]/80">
                <CardHeader className="pb-2">
                  <CardTitle className={`${displayFont.className} text-base text-[#2f2218] dark:text-[#f5ead9]`}>
                    ミックスの配合
                  </CardTitle>
                  <CardDescription className="text-[#4b5c52] dark:text-[#c3d7ca]">
                    比率を残して再現性を高める。
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-[#9a7b4f]/20 bg-white/80 shadow-sm dark:border-[#6f5a3a]/40 dark:bg-[#232019]/80">
                <CardHeader className="pb-2">
                  <CardTitle className={`${displayFont.className} text-base text-[#2f2218] dark:text-[#f5ead9]`}>
                    次の候補
                  </CardTitle>
                  <CardDescription className="text-[#4b5c52] dark:text-[#cdb79b]">
                    記録からおすすめを整理。
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featureHighlights.map((feature) => (
          <Card
            key={feature.title}
            className="scroll-fade border-[#9a7b4f]/20 bg-white/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-[#6f5a3a]/40 dark:bg-[#232019]/80"
            data-scroll
          >
            <CardHeader>
              <CardTitle className={`${displayFont.className} text-lg text-[#2f2218] dark:text-[#f5ead9]`}>
                {feature.title}
              </CardTitle>
              <CardDescription className="text-[#5c4634] dark:text-[#cdb79b]">
                {feature.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="scroll-fade space-y-6" data-scroll>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#7a5a3a] dark:text-[#b79a6d]">How it works</p>
            <h2 className={`${displayFont.className} text-2xl text-[#2f2218] dark:text-[#f5ead9]`}>
              記録の流れをシンプルに
            </h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <Card
              key={step.title}
              className="scroll-fade border-[#9a7b4f]/20 bg-white/80 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-[#6f5a3a]/40 dark:bg-[#232019]/80"
              data-scroll
              style={{ "--scroll-delay": `${index * 120}ms` } as CSSProperties}
            >
              <CardHeader className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7b4f] dark:text-[#d8b98c]">
                  {step.label}
                </span>
                <CardTitle className={`${displayFont.className} text-lg text-[#2f2218] dark:text-[#f5ead9]`}>
                  {step.title}
                </CardTitle>
                <CardDescription className="text-[#5c4634] dark:text-[#cdb79b]">
                  {step.detail}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {!authLoading && user ? (
        <section className="scroll-fade space-y-6" data-scroll>
          <div className="flex items-center justify-between gap-4">
            <h2 className={`${displayFont.className} text-2xl text-[#2f2218] dark:text-[#f5ead9]`}>
              今の記録
            </h2>
            <Button asChild variant="ghost" className="text-[#6d4c2f] dark:text-[#d8b98c]">
              <Link href={`/${locale}/sessions`}>記録一覧へ</Link>
            </Button>
          </div>
          <HomeSessionsCalendar />
          <HomeSessionOverview />
        </section>
      ) : (
        <section className="scroll-fade rounded-3xl border border-[#9a7b4f]/20 bg-[#fffaf4] p-8 dark:border-[#6f5a3a]/40 dark:bg-[#1e1a16]" data-scroll>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className={`${displayFont.className} text-2xl text-[#2f2218] dark:text-[#f5ead9]`}>
                Kemurecoで自分の香り地図を作ろう
              </h2>
              <p className="text-sm text-[#5c4634] dark:text-[#cdb79b]">
                ログインするとミックス管理・セッション記録・おすすめ機能が使えます。
              </p>
            </div>
            <Button asChild className="bg-[#2f2218] text-white hover:bg-[#3a2a1f] dark:bg-[#f3d8b2] dark:text-[#2a2018] dark:hover:bg-[#e9cfa4]">
              <Link href={`/${locale}/auth`}>無料で始める</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
