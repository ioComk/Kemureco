"use client";

import { useMemo } from "react";
import type { SessionItem } from "@/components/sessions/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SessionOverviewCardProps = {
  sessions: SessionItem[];
  className?: string;
};

export function SessionOverviewCard({ sessions, className }: SessionOverviewCardProps) {
  const { averageSatisfaction, sessionsThisMonth, topMix, topFlavor } = useMemo<{
    averageSatisfaction: number | null;
    sessionsThisMonth: SessionItem[];
    topMix: { title: string; count: number } | null;
    topFlavor: { name: string; brand?: string | null; count: number } | null;
  }>(() => {
    const avg = sessions.length
      ? sessions.reduce((sum, item) => sum + (item.satisfaction ?? 0), 0) / sessions.length
      : null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthlySessions = sessions.filter((session) => {
      if (!session.started_at) return false;
      const date = new Date(session.started_at);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    const mixCounts = new Map<number, { count: number; title: string }>();
    const flavorCounts = new Map<number, { count: number; flavorName: string; brandName?: string | null }>();

    sessions.forEach((session) => {
      if (session.mix && session.mix_id) {
        const current = mixCounts.get(session.mix_id) ?? { count: 0, title: session.mix.title };
        mixCounts.set(session.mix_id, { count: current.count + 1, title: current.title });
      }

      const components = session.mix?.components ?? [];
      components.forEach((component) => {
        if (!component?.flavorId) return;
        const current = flavorCounts.get(component.flavorId) ?? {
          count: 0,
          flavorName: component.flavorName,
          brandName: component.brandName
        };
        flavorCounts.set(component.flavorId, { ...current, count: current.count + 1 });
      });
    });

    let frequentMix: { title: string; count: number } | null = null;
    mixCounts.forEach((value) => {
      if (!frequentMix || value.count > frequentMix.count) {
        frequentMix = { title: value.title, count: value.count };
      }
    });

    let frequentFlavor: { name: string; brand?: string | null; count: number } | null = null;
    flavorCounts.forEach((value) => {
      if (!frequentFlavor || value.count > frequentFlavor.count) {
        frequentFlavor = { name: value.flavorName, brand: value.brandName, count: value.count };
      }
    });

    return {
      averageSatisfaction: avg,
      sessionsThisMonth: monthlySessions,
      topMix: frequentMix,
      topFlavor: frequentFlavor
    };
  }, [sessions]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>セッション概要</CardTitle>
        <CardDescription>直近の記録をもとにサマリーを確認できます。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">総セッション数</p>
          <p className="text-2xl font-semibold">{sessions.length}件</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">今月の記録</p>
          <p className="text-2xl font-semibold">{sessionsThisMonth.length}件</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">平均満足度</p>
          <p className="text-2xl font-semibold">
            {averageSatisfaction !== null ? `${averageSatisfaction.toFixed(1)} / 5` : "-"}
          </p>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs text-muted-foreground">よく使うミックス / フレーバー</p>
          {topMix ? (
            <p className="text-sm font-medium">
              {topMix.title} <span className="text-xs text-muted-foreground">({topMix.count}回)</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">まだ記録がありません</p>
          )}
          {topFlavor ? (
            <p className="text-xs text-muted-foreground">
              {topFlavor.brand ? `${topFlavor.brand} / ` : ""}
              {topFlavor.name} を {topFlavor.count}回使用
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
