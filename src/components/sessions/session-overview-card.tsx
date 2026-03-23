"use client";

import { useMemo, useState } from "react";
import type { SessionItem } from "@/components/sessions/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

type SessionOverviewCardProps = {
  sessions: SessionItem[];
  className?: string;
};

export function SessionOverviewCard({ sessions, className }: SessionOverviewCardProps) {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const {
    averageSatisfaction,
    topFlavors,
    topBrands,
    highSatisfactionFlavors,
    topLocations,
    dailyCounts,
    weeklyCountsLast7,
    monthlyCounts
  } = useMemo<{
    averageSatisfaction: number | null;
    topFlavors: { name: string; brand?: string | null; count: number }[];
    topBrands: { name: string; count: number }[];
    highSatisfactionFlavors: { name: string; brand?: string | null; count: number }[];
    topLocations: { name: string; count: number }[];
    dailyCounts: { label: string; count: number }[];
    weeklyCountsLast7: { label: string; count: number }[];
    monthlyCounts: { label: string; count: number }[];
  }>(() => {
    const avg = sessions.length
      ? sessions.reduce((sum, item) => sum + (item.satisfaction ?? 0), 0) / sessions.length
      : null;

    const now = new Date();

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

    // ブランド集計
    const brandCounts = new Map<string, number>();
    sessions.forEach((session) => {
      session.session_flavors?.forEach((sf) => {
        if (sf.brandName) {
          brandCounts.set(sf.brandName, (brandCounts.get(sf.brandName) ?? 0) + 1);
        }
      });
    });
    const topBrands = Array.from(brandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // 高満足度セッションのフレーバー集計
    const highSatisfactionFlavorCounts = new Map<string, { count: number; flavorName: string; brandName?: string | null }>();
    sessions
      .filter((s) => (s.satisfaction ?? 0) >= 4)
      .forEach((session) => {
        session.session_flavors?.forEach((sf) => {
          const key = sf.flavorId ? `flavor-${sf.flavorId}` : `custom-${sf.customFlavorName}`;
          const current = highSatisfactionFlavorCounts.get(key) ?? { count: 0, flavorName: sf.flavorName, brandName: sf.brandName };
          highSatisfactionFlavorCounts.set(key, { ...current, count: current.count + 1 });
        });
      });
    const highSatisfactionFlavors = Array.from(highSatisfactionFlavorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((value) => ({
        name: value.flavorName,
        brand: value.brandName,
        count: value.count
      }));

    // 場所集計
    const locationCounts = new Map<string, number>();
    sessions.forEach((session) => {
      if (session.location_name) {
        locationCounts.set(session.location_name, (locationCounts.get(session.location_name) ?? 0) + 1);
      }
    });
    const topLocations = Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const toLocalDateKey = (value: Date) => {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const countsByDate = new Map<string, number>();

    sessions.forEach((session) => {
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      const key = toLocalDateKey(date);
      countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
    });

    const dailyCounts = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      const key = toLocalDateKey(date);
      return { label: `${date.getMonth() + 1}/${date.getDate()}`, count: countsByDate.get(key) ?? 0 };
    });
    const weeklyCountsLast7 = dailyCounts.slice(-7);

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
      .slice(0, 5)
      .map((value) => ({
        name: value.flavorName,
        brand: value.brandName,
        count: value.count
      }));

    return {
      averageSatisfaction: avg,
      topFlavors,
      topBrands,
      highSatisfactionFlavors,
      topLocations,
      dailyCounts,
      weeklyCountsLast7,
      monthlyCounts
    };
  }, [sessions]);

  return (
    <Card className={`border-0 shadow-none ${className ?? ""}`.trim()}>
      <CardHeader>
        <CardTitle>セッション概要</CardTitle>
        <CardDescription>直近の記録をもとにサマリーを確認できます。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* カード1: フレーバー傾向サマリー（2カラム分） */}
        <div className="rounded-xl bg-muted/20 p-4 space-y-4 lg:col-span-2">
          <p className="text-sm font-medium">フレーバー傾向</p>
          <div className="grid gap-4 md:grid-cols-2">
            {/* よく使うフレーバーTOP5 */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">よく使うフレーバー TOP5</p>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">データがありません</p>
              ) : topFlavors.length > 0 ? (
                <div className="space-y-2">
                  {topFlavors.map((flavor, index) => {
                    const maxCount = topFlavors[0]?.count ?? 1;
                    const width = Math.max(12, (flavor.count / maxCount) * 100);
                    return (
                      <div key={`${flavor.name}-${index}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">
                            {flavor.brand ? `${flavor.brand} / ` : ""}
                            {flavor.name}
                          </span>
                          <span className="text-muted-foreground ml-2">{flavor.count}回</span>
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
            {/* よく使うブランドTOP3 */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">よく使うブランド TOP3</p>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">データがありません</p>
              ) : topBrands.length > 0 ? (
                <div className="space-y-2">
                  {topBrands.map((brand, index) => {
                    const maxCount = topBrands[0]?.count ?? 1;
                    const width = Math.max(12, (brand.count / maxCount) * 100);
                    return (
                      <div key={`${brand.name}-${index}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{brand.name}</span>
                          <span className="text-muted-foreground ml-2">{brand.count}回</span>
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
          </div>
        </div>

        {/* カード2: 満足度分析 */}
        <div className="rounded-xl bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-medium">満足度分析</p>
          {/* 高満足度フレーバー */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">高満足度セッションのフレーバー TOP3</p>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">データがありません</p>
            ) : highSatisfactionFlavors.length > 0 ? (
              <div className="space-y-1.5">
                {highSatisfactionFlavors.map((flavor, index) => (
                  <div key={`${flavor.name}-${index}`} className="flex items-center justify-between text-xs">
                    <span className="truncate">
                      {flavor.brand ? `${flavor.brand} / ` : ""}
                      {flavor.name}
                    </span>
                    <span className="text-muted-foreground ml-2">{flavor.count}回</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">満足度4以上の記録がありません</p>
            )}
          </div>
          {/* 平均満足度 */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">平均満足度</p>
              <p className="text-lg font-semibold">
                {averageSatisfaction !== null ? `${averageSatisfaction.toFixed(1)} / 5` : "-"}
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${averageSatisfaction ? (averageSatisfaction / 5) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* カード3: セッション活動サマリー */}
        <div className="rounded-xl bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-medium">活動サマリー</p>
          {/* 総セッション数 */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">総セッション数</p>
                <p className="text-2xl font-semibold">
                  {period === "week" ? weeklyCountsLast7.reduce((sum, item) => sum + item.count, 0) : null}
                  {period === "month" ? dailyCounts.reduce((sum, item) => sum + item.count, 0) : null}
                  {period === "year" ? monthlyCounts.reduce((sum, item) => sum + item.count, 0) : null}
                  件
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-muted p-1 text-xs" role="group" aria-label="集計期間">
                <button
                  type="button"
                  onClick={() => setPeriod("week")}
                  aria-pressed={period === "week"}
                  aria-label="直近1週間"
                  className={`rounded-full px-2 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${period === "week" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  1週間
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("month")}
                  aria-pressed={period === "month"}
                  aria-label="直近1ヶ月"
                  className={`rounded-full px-2 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${period === "month" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  1ヶ月
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("year")}
                  aria-pressed={period === "year"}
                  aria-label="直近1年"
                  className={`rounded-full px-2 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${period === "year" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
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
          {/* よく行く場所 */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">よく行く場所 TOP3</p>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">データがありません</p>
            ) : topLocations.length > 0 ? (
              <div className="space-y-1.5">
                {topLocations.map((location, index) => (
                  <div key={`${location.name}-${index}`} className="flex items-center justify-between text-xs">
                    <span className="truncate">{location.name}</span>
                    <span className="text-muted-foreground ml-2">{location.count}回</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">場所の記録がありません</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
