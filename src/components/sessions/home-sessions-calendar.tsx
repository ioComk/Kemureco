"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Session } from "@/lib/types";
import type { SessionItem } from "./types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAuth } from "@/components/auth/auth-provider";
import { MapPin, MoreHorizontal, Pencil, Share2, ThumbsUp, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

export function HomeSessionsCalendar() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [sessionState, setSessionState] = useState<{ loading: boolean; userId?: string }>({ loading: true });
  const [mixColumnAvailable, setMixColumnAvailable] = useState(true);
  const [flavors, setFlavors] = useState<Array<{ id: number; name: string; brandName?: string | null }>>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<SessionItem[]>([]);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingComponents, setEditingComponents] = useState<Array<{ flavorId: string }>>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<{
    startedAt: string;
    satisfaction: number;
    location: string;
    notes: string;
  }>({ startedAt: "", satisfaction: 3, location: "", notes: "" });
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const maxComponents = 4;
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const chartColors = ["#f59e0b", "#34d399", "#60a5fa", "#f472b6", "#f97316"];

  const toLocalDateKey = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateInput = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISO = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISO;
  };

  const formatSessionDateLabel = (value?: string | Date | null) => {
    if (!value) return "";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  const buildMixChartData = (
    components: { flavorName: string; brandName?: string | null; ratioPercent?: number | null }[] | undefined
  ) => {
    if (!components || components.length === 0) {
      return { items: [], stackedData: { label: "配合" }, keys: [] as string[] };
    }
    const ratios = components.map((component) => component.ratioPercent ?? 0);
    const total = ratios.reduce((sum, value) => sum + value, 0);
    const resolvedRatios =
      total > 0
        ? ratios
        : ratios.map((_, index) => {
            const equal = Math.floor(100 / ratios.length);
            const remainder = 100 - equal * ratios.length;
            return equal + (index < remainder ? 1 : 0);
          });

    const items = components.map((component, index) => ({
      key: `flavor${index}`,
      name: `${component.brandName ? `${component.brandName} ` : ""}${component.flavorName}`,
      ratio: resolvedRatios[index] ?? 0,
      fill: chartColors[index % chartColors.length]
    }));
    const stackedData = items.reduce<Record<string, number | string>>(
      (acc, item) => {
        acc[item.key] = item.ratio;
        return acc;
      },
      { label: "配合" }
    );

    return { items, stackedData, keys: items.map((item) => item.key) };
  };

  useEffect(() => {
    if (authLoading) {
      setSessionState({ loading: true, userId: undefined });
      return;
    }
    const userId = user?.id;
    setSessionState({ loading: false, userId });
    if (userId) {
      void fetchSessions(userId);
      void fetchFlavors();
    } else {
      setSessions([]);
      setFlavors([]);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!selectedDate) return;
    const filtered = sessions.filter((session) => {
      if (!session.started_at) return false;
      return toLocalDateKey(new Date(session.started_at)) === selectedDate;
    });
    setSelectedSessions(filtered);
  }, [selectedDate, sessions]);

  useEffect(() => {
    if (!dialogOpen) {
      setEditingId(null);
      setEditingForm({ startedAt: "", satisfaction: 3, location: "", notes: "" });
      setEditingComponents([]);
      setSelectedSessionIndex(0);
      setOpenMenuId(null);
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (selectedSessionIndex >= selectedSessions.length) {
      setSelectedSessionIndex(0);
    }
  }, [selectedSessionIndex, selectedSessions.length]);

  useEffect(() => {
    if (!carouselApi) return;
    const handleSelect = () => {
      const nextIndex = carouselApi.selectedScrollSnap();
      setSelectedSessionIndex(nextIndex);
      setEditingId(null);
      setEditingForm({ startedAt: "", satisfaction: 3, location: "", notes: "" });
      setEditingComponents([]);
    };
    handleSelect();
    carouselApi.on("select", handleSelect);
    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.scrollTo(0, true);
    setSelectedSessionIndex(0);
  }, [carouselApi, selectedSessions]);

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

  const fetchFlavors = async () => {
    const { data, error } = await supabase
      .from("flavors")
      .select("id,name,brands(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("fetch flavors error", error);
      return;
    }
    const rows = Array.isArray(data) ? data : [];
    setFlavors(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        brandName: row.brands?.name ?? null
      }))
    );
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
    const key = toLocalDateKey(date);
    setSelectedDate(key);
    setSelectedSessions(daySessions);
    setSelectedSessionIndex(0);
    setEditingId(null);
    setEditingForm({ startedAt: "", satisfaction: 3, location: "", notes: "" });
    setEditingComponents([]);
    setDialogOpen(true);
  };

  const startEdit = (session: SessionItem) => {
    setEditingId(session.id);
    setEditingForm({
      startedAt: formatDateInput(session.started_at),
      satisfaction: session.satisfaction ?? 3,
      location: session.location_text ?? "",
      notes: session.notes ?? ""
    });
    setEditingComponents(
      session.mix?.components?.length
        ? session.mix.components.map((component) => ({ flavorId: String(component.flavorId) }))
        : []
    );
  };

  const handleEditChange = <K extends keyof typeof editingForm>(key: K, value: (typeof editingForm)[K]) => {
    setEditingForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleComponentChange = (index: number, flavorId: string) => {
    setEditingComponents((prev) => {
      const next = [...prev];
      next[index] = { flavorId };
      return next;
    });
  };

  const handleAddComponent = () => {
    setEditingComponents((prev) => (prev.length >= maxComponents ? prev : [...prev, { flavorId: "" }]));
  };

  const handleRemoveComponent = (index: number) => {
    setEditingComponents((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdate = async (sessionId: number) => {
    if (!sessionState.userId) return;
    if (mixColumnAvailable && editingComponents.length > 0 && editingComponents.some((component) => !component.flavorId)) {
      toast({ title: "フレーバーを選択してください", variant: "destructive" });
      return;
    }
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
      const sessionItem = sessions.find((session) => session.id === sessionId);
      const flavorIds = editingComponents.map((component) => Number(component.flavorId)).filter((id) => id > 0);
      let mixIdToUse: number | null = sessionItem?.mix_id ?? null;

      if (flavorIds.length > 0) {
        const canUpdateExisting = sessionItem?.mix?.title?.startsWith("記録フレーバー");
        if (!canUpdateExisting) {
          mixIdToUse = null;
        }
        if (!mixIdToUse) {
          const dateLabel = formatSessionDateLabel(parsedDate ?? editingForm.startedAt);
          const title = dateLabel || "記録";
          const { data: mixData, error: mixError } = await supabase
            .from("mixes")
            .insert({ title, description: null, user_id: sessionState.userId })
            .select("id")
            .single();
          if (mixError || !mixData) {
            setSavingId(null);
            toast({
              title: "ミックス作成に失敗しました",
              description: "フレーバー構成の保存に失敗しました。",
              variant: "destructive"
            });
            return;
          }
          mixIdToUse = mixData.id;
        }

        if (mixIdToUse) {
          const { error: deleteError } = await supabase.from("mix_components").delete().eq("mix_id", mixIdToUse);
          if (deleteError) {
            setSavingId(null);
            toast({
              title: "フレーバー更新に失敗しました",
              description: deleteError.message,
              variant: "destructive"
            });
            return;
          }

          const equal = Math.floor(100 / flavorIds.length);
          let remainder = 100 - equal * flavorIds.length;
          const ratios = flavorIds.map(() => equal + (remainder-- > 0 ? 1 : 0));
          const componentsPayload = flavorIds.map((flavorId, index) => ({
            mix_id: mixIdToUse,
            flavor_id: flavorId,
            ratio_percent: ratios[index] ?? 0,
            layer_order: index + 1
          }));

          const { error: compError } = await supabase.from("mix_components").insert(componentsPayload);
          if (compError) {
            setSavingId(null);
            toast({
              title: "フレーバー更新に失敗しました",
              description: compError.message,
              variant: "destructive"
            });
            return;
          }
        }
      } else {
        mixIdToUse = null;
      }

      payload.mix_id = mixIdToUse;
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
    const nextMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    sessions.forEach((session) => {
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      if (date < monthStart || date >= nextMonthStart) return;
      const key = toLocalDateKey(date);
      const arr = map.get(key) ?? [];
      arr.push(session);
      map.set(key, arr);
    });
    return map;
  }, [sessions, currentMonth]);


  return (
    <>
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-2">
          {/* <CardTitle className="text-sm font-medium text-muted-foreground">最近の記録カレンダー</CardTitle> */}
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionState.userId ? null : (
            <p className="text-sm text-muted-foreground">サインインするとカレンダーに記録が表示されます。</p>
          )}
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
              {calendarCells.map((cell, idx) => {
                const date = cell.date;
                const key = date ? toLocalDateKey(date) : `blank-${idx}`;
                const daySessions = date ? sessionsByDate.get(key) ?? [] : [];
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl bg-background dark:bg-neutral-900">
          <DialogHeader className="sr-only">
            <DialogTitle>記録</DialogTitle>
          </DialogHeader>
          {selectedSessions.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">この日に記録はありません。</p>
            </>
          ) : (
            <div className="space-y-2">
              <Carousel setApi={setCarouselApi} className="w-full">
                <CarouselContent>
                  {selectedSessions.map((item) => {
                    const chartData = buildMixChartData(item.mix?.components);

                    return (
                      <CarouselItem key={item.id}>
                      <Card className="w-full border-0 shadow-none rounded-2xl bg-background dark:bg-neutral-900">
                        {editingId === item.id ? (
                          <>
                            <CardHeader className="px-5 pb-3 pt-4">
                              <CardTitle className="text-base">編集モード</CardTitle>
                              <CardDescription>
                                <span className="sr-only">{item.id}</span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor={`started-at-${item.id}`}>開始日時</Label>
                                <Input
                                  id={`started-at-${item.id}`}
                                  type="datetime-local"
                                  value={editingForm.startedAt}
                                  onChange={(event) => handleEditChange("startedAt", event.target.value)}
                                />
                              </div>
                              {mixColumnAvailable ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label>フレーバー</Label>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={handleAddComponent}
                                      disabled={editingComponents.length >= maxComponents}
                                    >
                                      追加
                                    </Button>
                                  </div>
                                  {editingComponents.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">フレーバー未設定</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {editingComponents.map((component, index) => (
                                        <div key={`edit-flavor-${item.id}-${index}`} className="flex items-center gap-2">
                                          <select
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={component.flavorId}
                                            onChange={(event) => handleComponentChange(index, event.target.value)}
                                          >
                                            <option value="">フレーバーを選択</option>
                                            {flavors.map((flavor) => (
                                              <option key={flavor.id} value={flavor.id}>
                                                {flavor.brandName ? `${flavor.brandName} ` : ""}
                                                {flavor.name}
                                              </option>
                                            ))}
                                          </select>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveComponent(index)}
                                          >
                                            削除
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            <div className="space-y-2">
                              <Label>満足度</Label>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((score) => (
                                  <button
                                    key={`${item.id}-edit-score-${score}`}
                                    type="button"
                                    onClick={() => handleEditChange("satisfaction", score)}
                                    className="rounded-full"
                                    aria-label={`満足度 ${score}`}
                                  >
                                    <ThumbsUp
                                      className={`h-4 w-4 ${
                                        editingForm.satisfaction >= score
                                          ? score <= 2
                                            ? "text-primary/70 dark:text-white/70"
                                            : score <= 4
                                              ? "text-primary/85 dark:text-white/85"
                                              : "text-primary dark:text-white"
                                          : "text-muted-foreground/40 dark:text-white/25"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
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
                                <Label htmlFor={`notes-${item.id}`}>メモ</Label>
                                <Textarea
                                  id={`notes-${item.id}`}
                                  placeholder="設定や感想をメモ"
                                  value={editingForm.notes}
                                  onChange={(event) => handleEditChange("notes", event.target.value)}
                                  rows={3}
                                />
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => setEditingId(null)} disabled={savingId === item.id}>
                                キャンセル
                              </Button>
                              <Button size="sm" onClick={() => handleUpdate(item.id)} disabled={savingId === item.id}>
                                {savingId === item.id ? "更新中..." : "更新する"}
                              </Button>
                            </CardFooter>
                          </>
                        ) : (
                          <>
                            <CardHeader className="px-5 pb-3 pt-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    {item.started_at ? formatSessionDateLabel(item.started_at) : "日付不明"}
                                    {item.started_at
                                      ? ` ・ ${new Date(item.started_at).toLocaleTimeString("ja-JP", {
                                          hour: "2-digit",
                                          minute: "2-digit"
                                        })}`
                                      : ""}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((score) => (
                                      <ThumbsUp
                                        key={`${item.id}-score-${score}`}
                                        className={`h-3.5 w-3.5 ${
                                          (item.satisfaction ?? 0) >= score
                                            ? score <= 2
                                              ? "text-primary/70 dark:text-white/70"
                                              : score <= 4
                                                ? "text-primary/85 dark:text-white/85"
                                                : "text-primary dark:text-white"
                                            : "text-muted-foreground/40 dark:text-white/25"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    {item.location_text ? (
                                      <span className="text-foreground/80">{item.location_text}</span>
                                    ) : (
                                      <span>未設定</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Popover
                                    open={openMenuId === item.id}
                                    onOpenChange={(open) => setOpenMenuId(open ? item.id : null)}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" aria-label="メニュー">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-40 p-1">
                                      <div className="flex flex-col">
                                        <Button
                                          variant="ghost"
                                          className="justify-start gap-2"
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            startEdit(item);
                                          }}
                                        >
                                          <Pencil className="h-4 w-4" />
                                          編集
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          className="justify-start gap-2 text-destructive hover:text-destructive"
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            setPendingDeleteId(item.id);
                                            setDeleteDialogOpen(true);
                                          }}
                                          disabled={deletingId === item.id}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          削除
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 px-5 pb-4 pt-0">
                              {item.mix?.components && item.mix.components.length > 0 ? (
                                <div className="space-y-2">
                                  <p className="text-[11px] text-muted-foreground">フレーバー配合</p>
                                  <ChartContainer className="w-full" style={{ height: 56 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={[chartData.stackedData]} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis
                                          type="category"
                                          dataKey="label"
                                          tickLine={false}
                                          axisLine={false}
                                          width={0}
                                          tick={false}
                                        />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent valueSuffix="%" />} />
                                        {chartData.keys.map((key, index) => {
                                          const isFirst = index === 0;
                                          const isLast = index === chartData.keys.length - 1;
                                          const radius = isFirst
                                            ? [6, 0, 0, 6]
                                            : isLast
                                              ? [0, 6, 6, 0]
                                              : 0;
                                          const fill = chartData.items[index]?.fill;
                                          const name = chartData.items[index]?.name;
                                          return (
                                            <Bar
                                              key={`${item.id}-${key}`}
                                              dataKey={key}
                                              stackId="mix"
                                              radius={radius}
                                              barSize={12}
                                              fill={fill}
                                              name={name}
                                            />
                                          );
                                        })}
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </ChartContainer>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                    {chartData.items.map((entry) => (
                                      <div key={`${item.id}-legend-${entry.key}`} className="flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                                        <span>{entry.name}</span>
                                        <span>{entry.ratio}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">フレーバー未設定</p>
                              )}
                              {item.notes ? <p className="whitespace-pre-wrap text-sm">{item.notes}</p> : null}
                            </CardContent>
                            <CardFooter className="flex justify-end px-5 pb-4 pt-0">
                              <Button size="sm" asChild className="gap-2">
                                <a href={buildShareUrl(item)} target="_blank" rel="noreferrer">
                                  <Share2 className="h-4 w-4" />
                                  Xに投稿
                                </a>
                              </Button>
                            </CardFooter>
                          </>
                        )}
                      </Card>
                    </CarouselItem>
                  );
                })}
                </CarouselContent>
                {selectedSessions.length > 1 ? (
                  <>
                    <CarouselPrevious className="absolute left-[-4rem] top-1/2 -translate-y-1/2 rounded-full" />
                    <CarouselNext className="absolute right-[-4rem] top-1/2 -translate-y-1/2 rounded-full" />
                  </>
                ) : null}
              </Carousel>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>削除してもよろしいですか？</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPendingDeleteId(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDeleteId == null) return;
                handleDelete(pendingDeleteId);
                setDeleteDialogOpen(false);
                setPendingDeleteId(null);
              }}
              disabled={pendingDeleteId == null || deletingId === pendingDeleteId}
            >
              {deletingId === pendingDeleteId ? "削除中..." : "削除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
