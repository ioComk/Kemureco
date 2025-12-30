"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeSessionOverview } from "@/components/sessions/home-session-overview";
import { HomeSessionsCalendar } from "@/components/sessions/home-sessions-calendar";
import { useAuth } from "@/components/auth/auth-provider";

export function HomeDashboard() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Kemureco</CardTitle>
          <CardDescription>認証状態を確認しています...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Kemurecoへようこそ</CardTitle>
          <CardDescription>
            シーシャのフレーバーを記録・管理・共有して、自分だけのミックス履歴を育てられるサービスです。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild>
            <Link href="/auth">ログインする</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/flavors">フレーバー一覧を見る</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <HomeSessionOverview />
      <HomeSessionsCalendar />
    </>
  );
}
