"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@/lib/types";
import { createSupabaseClient } from "@/lib/supabase";
import type { SessionItem, SessionFlavorInfo } from "@/components/sessions/types";
import { SessionOverviewCard } from "@/components/sessions/session-overview-card";
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
      // セッション取得
      const { data, error } = await supabase
        .from("sessions")
        .select("id, started_at, location_text, satisfaction, notes")
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

      if (error) {
        throw error;
      }

      const rows: Session[] = Array.isArray(data) ? ((data as unknown) as Session[]) : [];
      const sessionIds = rows.map((row) => row.id);

      // session_flavors取得
      let flavorsMap = new Map<number, SessionFlavorInfo[]>();

      if (sessionIds.length > 0) {
        const { data: sfData, error: sfError } = await supabase
          .from("session_flavors")
          .select("id, session_id, flavor_id, custom_flavor_name, custom_brand_name, ratio_percent, grams, layer_order, flavors(name, image_path, brands(name))")
          .in("session_id", sessionIds)
          .order("layer_order", { ascending: true });

        if (sfError) {
          console.warn("session_flavors fetch failed", sfError);
        } else {
          const sfRows = Array.isArray(sfData) ? sfData : [];
          for (const sf of sfRows) {
            const sessionId = sf.session_id;
            const flavorInfo: SessionFlavorInfo = {
              id: sf.id,
              flavorId: sf.flavor_id,
              flavorName: sf.custom_flavor_name ?? sf.flavors?.name ?? "不明なフレーバー",
              brandName: sf.custom_brand_name ?? sf.flavors?.brands?.name ?? null,
              imageUrl: sf.flavors?.image_path
                ? supabase.storage.from("flavor-images").getPublicUrl(sf.flavors.image_path).data.publicUrl
                : null,
              grams: sf.grams,
              ratioPercent: sf.ratio_percent,
              customFlavorName: sf.custom_flavor_name,
              customBrandName: sf.custom_brand_name,
              layerOrder: sf.layer_order
            };
            const existing = flavorsMap.get(sessionId) ?? [];
            existing.push(flavorInfo);
            flavorsMap.set(sessionId, existing);
          }
        }
      }

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
