"use client";

import { useMemo, useState } from "react";
import type { SessionItem } from "@/components/sessions/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

type SessionOverviewCardProps = {
  sessions: SessionItem[];
  className?: string;
};

export function SessionOverviewCard({ sessions, className }: SessionOverviewCardProps) {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const {
    averageSatisfaction,
    sessionsThisMonth,
    topFlavors,
    dailyCounts,
    weeklyCountsLast7,
    weeklyCounts,
    monthlyCounts,
    dailySatisfaction
  } = useMemo<{
    averageSatisfaction: number | null;
    sessionsThisMonth: SessionItem[];
    topFlavors: { name: string; brand?: string | null; count: number }[];
    dailyCounts: { label: string; count: number }[];
    weeklyCountsLast7: { label: string; count: number }[];
    weeklyCounts: { label: string; count: number }[];
    monthlyCounts: { label: string; count: number }[];
    dailySatisfaction: { label: string; value: number }[];
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

    // session_flavorsからフレーバー使用頻度を計算
    const flavorCounts = new Map<string, { count: number; flavorName: string; brandName?: string | null }>();

    sessions.forEach((session) => {
      const flavors = session.session_flavors ?? [];
      flavors.forEach((flavor) => {
        // カスタムフレーバーと既存フレーバーを区別するためのキーを生成
        const key = flavor.flavorId
          ? `flavor-${flavor.flavorId}`
          : `custom-${flavor.customFlavorName}-${flavor.customBrandName}`;

        const current = flavorCounts.get(key) ?? {
          count: 0,
          flavorName: flavor.flavorName,
          brandName: flavor.brandName
        };
        flavorCounts.set(key, { ...current, count: current.count + 1 });
      });
    });

    const toLocalDateKey = (value: Date) => {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const countsByDate = new Map<string, number>();
    const satisfactionByDate = new Map<string, { total: number; count: number }>();

    sessions.forEach((session) => {
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      const key = toLocalDateKey(date);
      countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
      const current = satisfactionByDate.get(key) ?? { total: 0, count: 0 };
      satisfactionByDate.set(key, {
        total: current.total + (session.satisfaction ?? 0),
        count: current.count + 1
      });
    });

    const dailyCounts = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      const key = toLocalDateKey(date);
      return { label: `${date.getMonth() + 1}/${date.getDate()}`, count: countsByDate.get(key) ?? 0 };
    });
    const weeklyCountsLast7 = dailyCounts.slice(-7);

    const dailySatisfaction = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (13 - index));
      const key = toLocalDateKey(date);
      const value = satisfactionByDate.get(key);
      const avgValue = value && value.count ? value.total / value.count : 0;
      return { label: `${date.getMonth() + 1}/${date.getDate()}`, value: Number(avgValue.toFixed(2)) };
    });

    const weeklyCounts = Array.from({ length: 5 }, (_, index) => ({
      label: `W${index + 1}`,
      count: 0
    }));
    monthlySessions.forEach((session) => {
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      const weekIndex = Math.min(4, Math.floor((date.getDate() - 1) / 7));
      weeklyCounts[weekIndex].count += 1;
    });

    const monthlyCounts = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
      const label = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
      return { label, count: 0 };
    });
    sessions.forEach((session) => {
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      const key = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
      const match = monthlyCounts.find((item) => item.label === key);
      if (match) {
        match.count += 1;
      }
    });

    const topFlavors = Array.from(flavorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((value) => ({
        name: value.flavorName,
        brand: value.brandName,
        count: value.count
      }));

    return {
      averageSatisfaction: avg,
      sessionsThisMonth: monthlySessions,
      topFlavors,
      dailyCounts,
      weeklyCountsLast7,
      weeklyCounts,
      monthlyCounts,
      dailySatisfaction
    };
  }, [sessions]);

  return (
    <Card className={`border-0 shadow-none ${className ?? ""}`.trim()}>
      <CardHeader>
        <CardTitle>セッション概要</CardTitle>
        <CardDescription>直近の記録をもとにサマリーを確認できます。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-muted/20 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">セッション概要</p>
              <p className="text-2xl font-semibold">
                {period === "week" ? weeklyCountsLast7.reduce((sum, item) => sum + item.count, 0) : null}
                {period === "month" ? dailyCounts.reduce((sum, item) => sum + item.count, 0) : null}
                {period === "year" ? monthlyCounts.reduce((sum, item) => sum + item.count, 0) : null}
                件
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-muted p-1 text-xs">
              <button
                type="button"
                onClick={() => setPeriod("week")}
                className={`rounded-full px-2 py-0.5 ${period === "week" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                1週間
              </button>
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`rounded-full px-2 py-0.5 ${period === "month" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                1ヶ月
              </button>
              <button
                type="button"
                onClick={() => setPeriod("year")}
                className={`rounded-full px-2 py-0.5 ${period === "year" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                1年
              </button>
            </div>
          </div>
          <div className="h-12">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">データがありません</p>
            ) : (
              <ChartContainer className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={period === "week" ? weeklyCountsLast7 : period === "month" ? dailyCounts : monthlyCounts}
                    margin={{ top: 6, right: 0, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="label" hide />
                    <YAxis hide />
                    <Bar dataKey="count" radius={4} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-muted/20 p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">今月の記録</p>
            <p className="text-2xl font-semibold">{sessionsThisMonth.length}件</p>
          </div>
          <div className="h-10">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">データがありません</p>
            ) : (
              <ChartContainer className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyCounts} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" hide />
                    <YAxis hide />
                    <Bar dataKey="count" radius={4} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-muted/20 p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">平均満足度</p>
            <p className="text-2xl font-semibold">
              {averageSatisfaction !== null ? `${averageSatisfaction.toFixed(1)} / 5` : "-"}
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${averageSatisfaction ? (averageSatisfaction / 5) * 100 : 0}%` }}
              />
            </div>
            <div className="h-8">
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">データがありません</p>
              ) : (
                <ChartContainer className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailySatisfaction} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" hide />
                      <YAxis hide domain={[0, 5]} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-muted/20 p-4 space-y-3">
          <p className="text-xs text-muted-foreground">よく使うフレーバー</p>
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">データがありません</p>
          ) : (
            <div className="space-y-3">
              {topFlavors.length > 0 ? (
                <div className="space-y-2">
                  {topFlavors.map((flavor, index) => {
                    const maxCount = topFlavors[0]?.count ?? 1;
                    const width = Math.max(12, (flavor.count / maxCount) * 100);
                    return (
                      <div key={`${flavor.name}-${index}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {flavor.brand ? `${flavor.brand} / ` : ""}
                            {flavor.name}
                          </span>
                          <span>{flavor.count}回</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">まだ記録がありません</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
