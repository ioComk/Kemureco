"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import type { Session } from "@/lib/types";
import type { MixOption, SessionItem } from "@/components/sessions/types";
import { SessionOverviewCard } from "@/components/sessions/session-overview-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";

export function SessionsDashboard() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [sessionState, setSessionState] = useState<{ loading: boolean; userId?: string }>({ loading: true });
  const [mixColumnAvailable, setMixColumnAvailable] = useState(true);
  const [mixes, setMixes] = useState<MixOption[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<SessionItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<{
    mixId: string;
    startedAt: string;
    location: string;
    satisfaction: number;
    notes: string;
  }>({ mixId: "", startedAt: "", location: "", satisfaction: 3, notes: "" });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) {
      setSessionState({ loading: true, userId: undefined });
      return;
    }
    const userId = user?.id;
    setSessionState({ loading: false, userId });
    if (userId) {
      void fetchMixes();
      void fetchSessions(userId);
    } else {
      setSessions([]);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!selectedDate) return;
    const filtered = sessions.filter((session) => {
      if (!session.started_at) return false;
      return session.started_at.slice(0, 10) === selectedDate;
    });
    setSelectedSessions(filtered);
  }, [selectedDate, sessions]);

  const fetchMixes = async () => {
    const { data } = await supabase.from("mixes").select("id,title").order("created_at", { ascending: false });
    setMixes(data ?? []);
  };

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
          // ミックス詳細が取れなくてもセッション自体は表示できるようにする
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

  const startEdit = (item: SessionItem) => {
    setEditingId(item.id);
    setEditingForm({
      mixId: item.mix_id ? String(item.mix_id) : "",
      startedAt: item.started_at ? new Date(item.started_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      location: item.location_text ?? "",
      satisfaction: item.satisfaction ?? 3,
      notes: item.notes ?? ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleEditChange = <K extends keyof typeof editingForm>(key: K, value: (typeof editingForm)[K]) => {
    setEditingForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async (sessionId: number) => {
    if (!sessionState.userId || editingId !== sessionId) return;
    const basePayload = {
      location_text: editingForm.location.trim() || null,
      notes: editingForm.notes.trim() || null,
      satisfaction: editingForm.satisfaction,
      started_at: new Date(editingForm.startedAt).toISOString()
    };
    const fullPayload = mixColumnAvailable
      ? { ...basePayload, mix_id: editingForm.mixId ? Number(editingForm.mixId) : null }
      : basePayload;

    startTransition(async () => {
      const attemptUpdate = async (payload: Record<string, unknown>, allowRetry: boolean): Promise<boolean> => {
        const { error } = await supabase.from("sessions").update(payload).eq("id", sessionId);
        if (error) {
          const errorDetail =
            error && typeof error === "object" ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);
          console.error("update session error", errorDetail, "payload", payload);

          const missingMixColumn =
            typeof error === "object" &&
            error !== null &&
            ("message" in error ? String((error as any).message) : "").includes("mix_id");

          if (allowRetry && mixColumnAvailable && missingMixColumn) {
            setMixColumnAvailable(false);
            return attemptUpdate(basePayload, false);
          }

          const message = (error as { message?: string; code?: string })?.message ?? "更新に失敗しました";
          toast({ title: "記録の更新に失敗しました", description: message, variant: "destructive" });
          return false;
        }
        return true;
      };

      const ok = await attemptUpdate(fullPayload, true);
      if (!ok) return;

      toast({ title: "更新しました" });
      setEditingId(null);
      if (sessionState.userId) {
        void fetchSessions(sessionState.userId);
      }
    });
  };

  const handleDelete = async (sessionId: number) => {
    if (!sessionState.userId) return;
    setDeletingId(sessionId);
    const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
    setDeletingId(null);

    if (error) {
      const errorDetail =
        error && typeof error === "object" ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);
      console.error("delete session error", errorDetail);
      const message = (error as { message?: string; code?: string })?.message ?? "削除に失敗しました";
      toast({ title: "記録の削除に失敗しました", description: message, variant: "destructive" });
      return;
    }

    toast({ title: "削除しました" });
    if (sessionState.userId) {
      void fetchSessions(sessionState.userId);
    }
  };

  const calendarSessions = useMemo(() => {
    const map = new Map<string, SessionItem[]>();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    sessions.forEach((session) => {
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      if (date < monthStart || date > monthEnd) return;
      const key = date.toISOString().slice(0, 10);
      const current = map.get(key) ?? [];
      current.push(session);
      map.set(key, current);
    });

    return map;
  }, [sessions, currentMonth]);

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date?: Date }[] = [];

    for (let i = 0; i < startWeekDay; i += 1) {
      cells.push({ date: undefined });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day) });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: undefined });
    }

    return cells;
  }, [currentMonth]);

  const handleSelectDate = (date: Date | undefined, daySessions: SessionItem[]) => {
    if (!date || daySessions.length === 0) return;
    const key = date.toISOString().slice(0, 10);
    setSelectedDate(key);
    setSelectedSessions(daySessions);
    setDialogOpen(true);
  };

  if (sessionState.loading) {
    return <p className="text-sm text-muted-foreground">認証状態を確認しています...</p>;
  }

  if (!sessionState.userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>記録にはサインインが必要です</CardTitle>
          <CardDescription>記録の確認・編集・削除にはサインインが必要です。</CardDescription>
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
    <>
    <div className="space-y-6">
      <SessionOverviewCard sessions={sessions} />

      <Card className="border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">カレンダー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl bg-card/80 p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between text-sm font-semibold text-foreground/80">
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                aria-label="前の月"
              >
                ←
              </button>
              <p className="text-sm font-semibold tracking-wide">
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </p>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                aria-label="次の月"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/70">
              {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2 text-center">
              {calendarCells.map((cell, index) => {
                const date = cell.date;
                const key = date ? date.toISOString().slice(0, 10) : `blank-${index}`;
                const daySessions = date ? calendarSessions.get(key) ?? [] : [];
                const hasSessions = daySessions.length > 0;
                const highlightAlpha = Math.min(0.25 + daySessions.length * 0.18, 0.85);
                const highlightStyle = hasSessions
                  ? { backgroundColor: `rgba(56, 189, 248, ${highlightAlpha})` }
                  : undefined;
                return (
                  <div
                    key={key}
                    className="flex h-10 items-center justify-center"
                    onClick={() => handleSelectDate(date, daySessions)}
                    role={hasSessions ? "button" : undefined}
                    tabIndex={hasSessions ? 0 : -1}
                  >
                    {date ? (
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                          hasSessions
                            ? "border-transparent text-white"
                            : "border-transparent text-muted-foreground"
                        }`}
                        style={highlightStyle}
                      >
                        {date.getDate()}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>記録一覧</CardTitle>
          <CardDescription>登録は別ページから行います。このページでは記録の確認・編集・削除のみ行えます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? null : (
            <div className="space-y-3">
              {sessions.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">編集モード</p>
                          <p className="text-xs text-muted-foreground">
                            {item.started_at
                              ? new Date(item.started_at).toLocaleString("ja-JP", {
                                  dateStyle: "medium",
                                  timeStyle: "short"
                                })
                              : "日時不明"}
                          </p>
                        </div>
                        <Badge variant="secondary">ID {item.id}</Badge>
                      </div>
                      {mixColumnAvailable ? (
                        <div className="space-y-2">
                          <Label htmlFor={`mix-${item.id}`}>ミックス</Label>
                          <select
                            id={`mix-${item.id}`}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={editingForm.mixId}
                            onChange={(event) => handleEditChange("mixId", event.target.value)}
                          >
                            <option value="">選択しない</option>
                            {mixes.map((mix) => (
                              <option key={mix.id} value={mix.id}>
                                {mix.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        <Label htmlFor={`startedAt-${item.id}`}>開始時間</Label>
                        <Input
                          id={`startedAt-${item.id}`}
                          type="datetime-local"
                          value={editingForm.startedAt}
                          onChange={(event) => handleEditChange("startedAt", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`location-${item.id}`}>場所</Label>
                        <Input
                          id={`location-${item.id}`}
                          placeholder="自宅 / ラウンジ名など"
                          value={editingForm.location}
                          onChange={(event) => handleEditChange("location", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>満足度 {editingForm.satisfaction}/5</Label>
                        <Slider
                          value={[editingForm.satisfaction]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(value) => handleEditChange("satisfaction", value[0] ?? 3)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`notes-${item.id}`}>メモ</Label>
                        <Textarea
                          id={`notes-${item.id}`}
                          placeholder="設定や感想をメモ"
                          value={editingForm.notes}
                          onChange={(event) => handleEditChange("notes", event.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={cancelEdit} disabled={isPending}>
                          キャンセル
                        </Button>
                        <Button type="button" onClick={() => handleUpdate(item.id)} disabled={isPending}>
                          {isPending ? "更新中..." : "更新する"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.mix?.title ? item.mix.title : "ミックス未選択"}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.started_at
                              ? new Date(item.started_at).toLocaleString("ja-JP", {
                                  dateStyle: "medium",
                                  timeStyle: "short"
                                })
                              : "日時不明"}
                          </p>
                        </div>
                        <Badge variant="secondary">満足度 {item.satisfaction ?? 0}/5</Badge>
                      </div>
                      {item.location_text ? (
                        <p className="text-sm text-muted-foreground">場所: {item.location_text}</p>
                      ) : null}
                      {item.notes ? <p className="text-sm">{item.notes}</p> : null}
                      {item.mix?.components && item.mix.components.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          使用フレーバー:{" "}
                          {item.mix.components
                            .filter((component) => !!component.flavorName)
                            .map((component) =>
                              component.brandName ? `${component.brandName} ${component.flavorName}` : component.flavorName
                            )
                            .join(", ")}
                        </p>
                      ) : null}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}>
                          編集
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? "削除中..." : "削除"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedDate ? new Date(selectedDate).toLocaleDateString("ja-JP") : "記録"}</DialogTitle>
          </DialogHeader>
          {selectedSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">この日に記録はありません。</p>
          ) : (
            <div className="space-y-3">
              {selectedSessions.map((session) => (
                <div key={session.id} className="rounded-md border p-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{session.mix?.title ?? "ミックス未選択"}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.started_at
                            ? new Date(session.started_at).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "時間不明"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        満足度 {session.satisfaction ?? "-"} / 5
                      </Badge>
                    </div>
                    {session.mix?.components && session.mix.components.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] text-muted-foreground">使用フレーバー</p>
                        <div className="flex flex-wrap gap-2">
                          {session.mix.components.map((component) => (
                            <Badge key={`${session.id}-${component.flavorId}`} variant="outline" className="text-[11px]">
                              {component.brandName ? `${component.brandName} ` : ""}
                              {component.flavorName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {session.location_text ? (
                      <p className="mt-2 text-sm text-muted-foreground">場所: {session.location_text}</p>
                    ) : null}
                    {session.notes ? <p className="mt-2 whitespace-pre-wrap text-sm">{session.notes}</p> : null}
                    <p className="mt-2 text-[11px] text-muted-foreground">記録ID: {session.id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
