"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Session } from "@/lib/types";
import type { MixOption, SessionItem } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function HomeSessionsCalendar() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
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
    startedAt: string;
    satisfaction: number;
    location: string;
    notes: string;
    mixId: string;
  }>({ startedAt: "", satisfaction: 3, location: "", notes: "", mixId: "" });
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatDateInput = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISO = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISO;
  };

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
          void fetchMixes(userId);
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
        void fetchMixes(nextUserId);
      } else {
        setSessions([]);
        setMixes([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const filtered = sessions.filter((session) => {
      if (!session.started_at) return false;
      return session.started_at.slice(0, 10) === selectedDate;
    });
    setSelectedSessions(filtered);
  }, [selectedDate, sessions]);

  useEffect(() => {
    if (!dialogOpen) {
      setEditingId(null);
      setEditingForm({ startedAt: "", satisfaction: 3, location: "", notes: "", mixId: "" });
    }
  }, [dialogOpen]);

  const fetchSessions = async (userId: string) => {
    try {
      const baseSelect =
        "id, started_at, satisfaction, user_id, location_text, notes" + (mixColumnAvailable ? ", mix_id" : "");
      const { data, error } = await supabase
        .from("sessions")
        .select(baseSelect)
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

      if (error) {
        throw error;
      }

      const rows: Session[] = Array.isArray(data) ? ((data as unknown) as Session[]) : [];

      const mixIds = mixColumnAvailable
        ? rows
            .map((row) => row.mix_id)
            .filter((id): id is number => typeof id === "number")
        : [];
      const uniqueMixIds = Array.from(new Set(mixIds));

      let mixMap = new Map<
        number,
        { id: number; title: string; components: { flavorId: number; flavorName: string; brandName?: string | null; ratioPercent?: number | null }[] }
      >();

      if (uniqueMixIds.length > 0) {
        try {
          const { data: mixData, error: mixError } = await supabase
            .from("mixes")
            .select(
              "id,title,mix_components:mix_components(flavor_id,ratio_percent,layer_order,flavors(name,brands(name)))"
            )
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
                components:
                  (Array.isArray(mix.mix_components) ? mix.mix_components : [])?.map((component) => ({
                    flavorId: component.flavor_id,
                    flavorName: component.flavors?.name ?? "不明なフレーバー",
                    brandName: component.flavors?.brands?.name ?? null,
                    ratioPercent: component.ratio_percent ?? null
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
        err && typeof err === "object" ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err);
      console.error("fetchSessions error", errorDetail);
      const message =
        (err as { message?: string; code?: string; hint?: string })?.message ??
        (err as { error_description?: string })?.error_description ??
        "不明なエラーが発生しました";
      toast({ title: "記録の取得に失敗しました", description: message, variant: "destructive" });
    }
  };

  const fetchMixes = async (userId: string) => {
    if (!mixColumnAvailable) return;
    const { data, error } = await supabase
      .from("mixes")
      .select("id,title")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("mix fetch failed", error);
      return;
    }

    const rows: MixOption[] = Array.isArray(data) ? ((data as unknown) as MixOption[]) : [];
    setMixes(rows);
  };

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date?: Date }[] = [];
    for (let i = 0; i < startWeekDay; i += 1) cells.push({ date: undefined });
    for (let day = 1; day <= daysInMonth; day += 1) cells.push({ date: new Date(year, month, day) });
    while (cells.length % 7 !== 0) cells.push({ date: undefined });
    return cells;
  }, [currentMonth]);

  const handleSelectDate = (date: Date | undefined, daySessions: SessionItem[]) => {
    if (!date || daySessions.length === 0) return;
    const key = date.toISOString().slice(0, 10);
    setSelectedDate(key);
    setSelectedSessions(daySessions);
    setEditingId(null);
    setEditingForm({ startedAt: "", satisfaction: 3, location: "", notes: "", mixId: "" });
    setDialogOpen(true);
  };

  const startEdit = (session: SessionItem) => {
    setEditingId(session.id);
    setEditingForm({
      startedAt: formatDateInput(session.started_at),
      satisfaction: session.satisfaction ?? 3,
      location: session.location_text ?? "",
      notes: session.notes ?? "",
      mixId: session.mix_id ? String(session.mix_id) : ""
    });
  };

  const handleEditChange = <K extends keyof typeof editingForm>(key: K, value: (typeof editingForm)[K]) => {
    setEditingForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async (sessionId: number) => {
    if (!sessionState.userId) return;
    setSavingId(sessionId);

    const parsedDate = editingForm.startedAt ? new Date(editingForm.startedAt) : null;
    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      toast({ title: "開始日時が不正です", description: "日時を正しく入力してください", variant: "destructive" });
      setSavingId(null);
      return;
    }

    const startedAt = parsedDate ? parsedDate.toISOString() : null;
    const payload: Record<string, unknown> = {
      started_at: startedAt,
      satisfaction: editingForm.satisfaction,
      location_text: editingForm.location.trim() || null,
      notes: editingForm.notes.trim() || null
    };
    if (mixColumnAvailable) {
      payload.mix_id = editingForm.mixId ? Number(editingForm.mixId) : null;
    }

    const { error } = await supabase.from("sessions").update(payload).eq("id", sessionId);
    setSavingId(null);

    if (error) {
      toast({
        title: "更新に失敗しました",
        description: error.message ?? "もう一度お試しください",
        variant: "destructive"
      });
      return;
    }

    toast({ title: "更新しました" });
    setEditingId(null);
    await fetchSessions(sessionState.userId);
  };

  const handleDelete = async (sessionId: number) => {
    if (!sessionState.userId) return;
    setDeletingId(sessionId);
    const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
    setDeletingId(null);

    if (error) {
      toast({
        title: "削除に失敗しました",
        description: error.message ?? "時間をおいて再試行してください",
        variant: "destructive"
      });
      return;
    }

    toast({ title: "削除しました" });
    if (editingId === sessionId) {
      setEditingId(null);
    }
    await fetchSessions(sessionState.userId);
  };

  const buildShareText = (session: SessionItem) => {
    const date = session.started_at
      ? new Date(session.started_at).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
      : "日時不明";
    const mixTitle = session.mix?.title ?? "ミックス未選択";
    const satisfaction = session.satisfaction ? `${session.satisfaction}/5` : "-/5";
    const flavors =
      session.mix?.components && session.mix.components.length > 0
        ? session.mix.components
            .map((component) => {
              const ratio = component.ratioPercent != null ? ` ${component.ratioPercent}%` : "";
              return `${component.brandName ? `${component.brandName} ` : ""}${component.flavorName}${ratio}`;
            })
            .join(" / ")
        : null;
    const lines = [
      "シーシャ記録をつけました",
      `${date} ｜ 満足度 ${satisfaction}`,
      `ミックス: ${mixTitle}`,
      flavors ? `フレーバー: ${flavors}` : null,
      session.notes ? `メモ: ${session.notes}` : null,
      "#Kemureco #シーシャ"
    ].filter(Boolean);

    return lines.join("\n");
  };

  const buildShareUrl = (session: SessionItem) => {
    const text = buildShareText(session);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = origin ? `${origin}/` : "";
    return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  };

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionItem[]>();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    sessions.forEach((session) => {
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      if (date < monthStart || date > monthEnd) return;
      const key = date.toISOString().slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(session);
      map.set(key, arr);
    });
    return map;
  }, [sessions, currentMonth]);

  return (
    <>
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>最近の記録カレンダー</CardTitle>
          <CardDescription>ログイン中のユーザーのセッションを月別に表示します。</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ButtonControls
            onPrev={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            onNext={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            label={`${currentMonth.getFullYear()}年 ${currentMonth.getMonth() + 1}月`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessionState.userId ? null : (
          <p className="text-sm text-muted-foreground">サインインするとカレンダーに記録が表示されます。</p>
        )}
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
          {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
            <div key={w} className="font-medium">
              {w}
            </div>
          ))}
          {calendarCells.map((cell, idx) => {
            const date = cell.date;
            const key = date ? date.toISOString().slice(0, 10) : `blank-${idx}`;
            const daySessions = date ? sessionsByDate.get(key) ?? [] : [];
            return (
              <div
                key={key}
                className={`h-20 rounded-md border bg-background p-2 text-left ${daySessions.length > 0 ? "border-primary/50" : ""}`}
                onClick={() => handleSelectDate(date, daySessions)}
                role={daySessions.length > 0 ? "button" : undefined}
                tabIndex={daySessions.length > 0 ? 0 : -1}
              >
                {date ? <p className="text-xs font-medium">{date.getDate()}</p> : null}
                {daySessions.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {daySessions.length} 件
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {daySessions.slice(0, 3).map((session) => (
                        <span key={session.id} className="text-[10px] text-muted-foreground">
                          {session.satisfaction ? `満足度 ${session.satisfaction}` : "記録"}
                        </span>
                      ))}
                      {daySessions.length > 3 ? (
                        <span className="text-[10px] text-muted-foreground">他 {daySessions.length - 3} 件</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
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
                {editingId === session.id ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">編集モード</p>
                      <Badge variant="secondary" className="text-xs">
                        ID {session.id}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`started-at-${session.id}`}>開始日時</Label>
                      <Input
                        id={`started-at-${session.id}`}
                        type="datetime-local"
                        value={editingForm.startedAt}
                        onChange={(event) => handleEditChange("startedAt", event.target.value)}
                      />
                    </div>
                    {mixColumnAvailable ? (
                      <div className="space-y-2">
                        <Label htmlFor={`mix-${session.id}`}>ミックス</Label>
                        <select
                          id={`mix-${session.id}`}
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
                      <Label>満足度 {editingForm.satisfaction}/5</Label>
                      <Slider
                        value={[editingForm.satisfaction]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={(value) => handleEditChange("satisfaction", value[0] ?? editingForm.satisfaction)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`location-${session.id}`}>場所</Label>
                      <Input
                        id={`location-${session.id}`}
                        placeholder="自宅 / ラウンジ名など"
                        value={editingForm.location}
                        onChange={(event) => handleEditChange("location", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`notes-${session.id}`}>メモ</Label>
                      <Textarea
                        id={`notes-${session.id}`}
                        placeholder="設定や感想をメモ"
                        value={editingForm.notes}
                        onChange={(event) => handleEditChange("notes", event.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} disabled={savingId === session.id}>
                        キャンセル
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(session.id)}
                        disabled={savingId === session.id}
                      >
                        {savingId === session.id ? "更新中..." : "更新する"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{session.mix?.title ?? "ミックス未選択"}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.started_at
                            ? new Date(session.started_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
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
                              {component.ratioPercent != null ? ` (${component.ratioPercent}%)` : ""}
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
                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => startEdit(session)}>
                        編集
                      </Button>
                      <Button variant="secondary" size="sm" asChild>
                        <a
                          href={buildShareUrl(session)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Xに投稿
                        </a>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                      >
                        {deletingId === session.id ? "削除中..." : "削除"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

function ButtonControls({ onPrev, onNext, label }: { onPrev: () => void; onNext: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        className="rounded-md border px-2 py-1 text-muted-foreground transition hover:bg-accent"
        onClick={onPrev}
        aria-label="前の月"
      >
        ←
      </button>
      <span className="font-medium">{label}</span>
      <button
        type="button"
        className="rounded-md border px-2 py-1 text-muted-foreground transition hover:bg-accent"
        onClick={onNext}
        aria-label="次の月"
      >
        →
      </button>
    </div>
  );
}
