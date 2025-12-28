"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@/lib/types";
import { createSupabaseClient } from "@/lib/supabase";
import type { SessionItem } from "@/components/sessions/types";
import { SessionOverviewCard } from "@/components/sessions/session-overview-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function HomeSessionOverview() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<{ loading: boolean; userId?: string }>({ loading: true });
  const [mixColumnAvailable, setMixColumnAvailable] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const userId = data.user?.id;
        setSessionState({ loading: false, userId });
        if (userId) {
          void fetchSessions(userId);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setSessionState({ loading: false, userId: undefined });
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      const nextUserId = authSession?.user?.id;
      setSessionState({ loading: false, userId: nextUserId });
      if (nextUserId) {
        void fetchSessions(nextUserId);
      } else {
        setSessions([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async (userId: string) => {
    try {
      const baseSelect =
        "id, started_at, location_text, satisfaction, notes" + (mixColumnAvailable ? ", mix_id" : "");
      const { data, error } = await supabase
        .from("sessions")
        .select(baseSelect)
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

      if (error) {
        throw error;
      }

      const rows: Session[] = Array.isArray(data) ? ((data as unknown) as Session[]) : [];

      const mixIds = rows
        .map((row) => (mixColumnAvailable ? row.mix_id : null))
        .filter((id): id is number => typeof id === "number");
      const uniqueMixIds = Array.from(new Set(mixIds));

      let mixMap = new Map<
        number,
        { id: number; title: string; components: { flavorId: number; flavorName: string; brandName?: string | null }[] }
      >();

      if (uniqueMixIds.length > 0) {
        try {
          const { data: mixData, error: mixError } = await supabase
            .from("mixes")
            .select("id,title,mix_components:mix_components(flavor_id,flavors(name,brands(name)))")
            .in("id", uniqueMixIds);

          if (mixError) {
            throw mixError;
          }

          const mixRows = Array.isArray(mixData) ? mixData : [];
          mixMap = new Map(
            mixRows.map((mix) => [
              mix.id,
              {
                id: mix.id,
                title: mix.title,
                components: (Array.isArray(mix.mix_components) ? mix.mix_components : [])?.map((component) => ({
                  flavorId: component.flavor_id,
                  flavorName: component.flavors?.name ?? "不明なフレーバー",
                  brandName: component.flavors?.brands?.name ?? null
                })) ?? []
              }
            ])
          );
        } catch (mixErr) {
          console.warn("mix fetch skipped", mixErr);
          mixMap = new Map();
        }
      }

      const normalized: SessionItem[] =
        rows.map((item) => ({
          id: item.id,
          user_id: userId,
          started_at: item.started_at,
          location_text: item.location_text,
          satisfaction: item.satisfaction,
          notes: item.notes,
          mix_id: mixColumnAvailable ? item.mix_id : null,
          mix: mixColumnAvailable && item.mix_id ? mixMap.get(item.mix_id) ?? null : null
        })) ?? [];

      setSessions(normalized);
    } catch (err) {
      if (
        mixColumnAvailable &&
        typeof err === "object" &&
        err !== null &&
        ("message" in err ? String((err as any).message) : "").includes("mix_id")
      ) {
        setMixColumnAvailable(false);
        await fetchSessions(userId);
        return;
      }
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
