"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@/lib/types";
import { createSupabaseClient } from "@/lib/supabase";
import type { SessionItem } from "@/components/sessions/types";
import { SessionOverviewCard } from "@/components/sessions/session-overview-card";
import { fetchSessionFlavorsMap } from "@/lib/session-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-provider";

export function HomeSessionOverview() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [sessionState, setSessionState] = useState<{ loading: boolean; userId?: string }>({ loading: true });
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  useEffect(() => {
    if (authLoading) {
      setSessionState({ loading: true, userId: undefined });
      return;
    }
    const userId = user?.id;
    setSessionState({ loading: false, userId });
    if (userId) {
      void fetchSessions(userId);
    } else {
      setSessions([]);
    }
  }, [authLoading, user?.id]);

  const fetchSessions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, started_at, location_text, satisfaction, notes")
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

      if (error) throw error;

      const rows: Session[] = Array.isArray(data) ? ((data as unknown) as Session[]) : [];
      const sessionIds = rows.map((row) => row.id);
      const flavorsMap = await fetchSessionFlavorsMap(supabase, sessionIds);

      const normalized: SessionItem[] = rows.map((item) => ({
        id: item.id,
        user_id: userId,
        started_at: item.started_at,
        location_text: item.location_text,
        location_place_id: null,
        location_name: null,
        location_address: null,
        location_lat: null,
        location_lng: null,
        location_distance_km: null,
        satisfaction: item.satisfaction,
        notes: item.notes,
        session_flavors: flavorsMap.get(item.id) ?? []
      }));

      setSessions(normalized);
    } catch (err) {
      const errorDetail =
        err && typeof err === "object"
          ? JSON.stringify(err, Object.getOwnPropertyNames(err))
          : String(err);
      console.error("fetchSessions error", errorDetail);
      const message =
        (err as { message?: string; code?: string; hint?: string })?.message ??
        (err as { error_description?: string })?.error_description ??
        "不明なエラーが発生しました";
      toast({ title: "記録の取得に失敗しました", description: message, variant: "destructive" });
    }
  };

  if (sessionState.loading) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>セッション概要</CardTitle>
          <CardDescription>認証状態を確認しています...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!sessionState.userId) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>セッション概要</CardTitle>
          <CardDescription>サインインすると記録のサマリーが表示されます。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth">サインインページへ</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <SessionOverviewCard sessions={sessions} />;
}
