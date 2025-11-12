"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import type { Database, Session } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

type MixOption = Pick<Database["public"]["Tables"]["mixes"]["Row"], "id" | "title">;

type SessionItem = Session & {
  mix?: MixOption | null;
};

const DEFAULT_FORM_STATE = {
  mixId: "",
  startedAt: new Date().toISOString().slice(0, 16),
  location: "",
  satisfaction: 3,
  notes: ""
};

export function SessionsDashboard() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [sessionState, setSessionState] = useState<{ loading: boolean; userId?: string }>({ loading: true });
  const [mixes, setMixes] = useState<MixOption[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const userId = data.user?.id;
        setSessionState({ loading: false, userId });
        if (userId) {
          void fetchMixes();
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
        void fetchMixes();
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

  const fetchMixes = async () => {
    const { data } = await supabase.from("mixes").select("id,title").order("created_at", { ascending: false });
    setMixes(data ?? []);
  };

  const fetchSessions = async (userId: string) => {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, started_at, location_text, satisfaction, notes, mix_id, mixes(id,title)")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error) {
      console.error(error);
      toast({ title: "記録の取得に失敗しました", description: error.message, variant: "destructive" });
      return;
    }

    const normalized: SessionItem[] =
      data?.map((item) => ({
        id: item.id,
        user_id: userId,
        started_at: item.started_at,
        location_text: item.location_text,
        satisfaction: item.satisfaction,
        notes: item.notes,
        mix_id: item.mix_id,
        mix: item.mixes ?? null
      })) ?? [];

    setSessions(normalized);
  };

  const handleChange = <K extends keyof typeof DEFAULT_FORM_STATE>(key: K, value: (typeof DEFAULT_FORM_STATE)[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionState.userId) return;
    const currentUserId = sessionState.userId;

    startTransition(async () => {
      const { error } = await supabase.from("sessions").insert({
        user_id: currentUserId,
        mix_id: formState.mixId ? Number(formState.mixId) : null,
        location_text: formState.location.trim() || null,
        notes: formState.notes.trim() || null,
        satisfaction: formState.satisfaction,
        started_at: new Date(formState.startedAt).toISOString()
      });

      if (error) {
        toast({ title: "記録の保存に失敗しました", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "記録しました" });
      setFormState({ ...DEFAULT_FORM_STATE, startedAt: new Date().toISOString().slice(0, 16) });
      if (sessionState.userId) {
        void fetchSessions(sessionState.userId);
      }
    });
  };

  const averageSatisfaction = sessions.length
    ? sessions.reduce((sum, item) => sum + (item.satisfaction ?? 0), 0) / sessions.length
    : null;

  if (sessionState.loading) {
    return <p className="text-sm text-muted-foreground">認証状態を確認しています...</p>;
  }

  if (!sessionState.userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>記録にはサインインが必要です</CardTitle>
          <CardDescription>セッションを残すには Supabase Auth でログインしてください。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth">サインインページへ</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>吸った記録を残す</CardTitle>
          <CardDescription>日付や満足度、場所などをメモしておきましょう。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="mix">ミックス</Label>
              <select
                id="mix"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formState.mixId}
                onChange={(event) => handleChange("mixId", event.target.value)}
              >
                <option value="">選択しない</option>
                {mixes.map((mix) => (
                  <option key={mix.id} value={mix.id}>
                    {mix.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startedAt">開始時間</Label>
              <Input
                id="startedAt"
                type="datetime-local"
                value={formState.startedAt}
                onChange={(event) => handleChange("startedAt", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">場所</Label>
              <Input
                id="location"
                placeholder="自宅 / ラウンジ名など"
                value={formState.location}
                onChange={(event) => handleChange("location", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>満足度 {formState.satisfaction}/5</Label>
              <Slider
                value={[formState.satisfaction]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => handleChange("satisfaction", value[0] ?? 3)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">メモ</Label>
              <Textarea
                id="notes"
                placeholder="設定や感想をメモ"
                value={formState.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "記録する"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近の記録</CardTitle>
          <CardDescription>直近のセッションを振り返りましょう。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {averageSatisfaction !== null ? (
            <p className="text-sm text-muted-foreground">
              平均満足度: <span className="font-semibold">{averageSatisfaction.toFixed(1)}</span>/5
            </p>
          ) : null}
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだ記録がありません。</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.mix?.title ? item.mix.title : "ミックス未選択"}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.started_at
                          ? new Date(item.started_at).toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" })
                          : "日時不明"}
                      </p>
                    </div>
                    <Badge variant="secondary">満足度 {item.satisfaction ?? 0}/5</Badge>
                  </div>
                  {item.location_text ? (
                    <p className="mt-2 text-sm text-muted-foreground">場所: {item.location_text}</p>
                  ) : null}
                  {item.notes ? <p className="mt-2 text-sm">{item.notes}</p> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
