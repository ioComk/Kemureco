"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Session } from "@/lib/types";
import type { SessionItem } from "./types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth/auth-provider";
import { Ellipsis, ExternalLink, MapPin, Pencil, Plus, Share2, ThumbsUp, Trash2 } from "lucide-react";
import { LocationPlacesCombobox, type PlaceValue, getGoogleMapsLink } from "@/components/sessions/location-places-combobox";
import Link from "next/link";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLocationPlace, setEditingLocationPlace] = useState<PlaceValue | null>(null);
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

  const parseDateKey = (value?: string | null) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map((item) => Number(item));
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const formatDayHeader = (value?: string | null) => {
    const date = parseDateKey(value);
    if (!date) return "";
    return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
  };

  const formatTimeLabel = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };


  const buildShareText = (session: SessionItem) => {
    const date = session.started_at
      ? new Date(session.started_at).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
      : "日時不明";
    const flavors =
      session.mix?.components && session.mix.components.length > 0
        ? session.mix.components.map((component) => {
            const brand = component.brandName ? ` (${component.brandName})` : "";
            const gramsValue =
              typeof (component as { grams?: number | null }).grams === "number"
                ? (component as { grams?: number | null }).grams
                : null;
            const gramsText = gramsValue && gramsValue > 0 ? ` ${gramsValue}g` : "";
            return `- ${component.flavorName}${brand}${gramsText}`;
          })
        : [];

    const lines = [
      date,
      "フレーバー:",
      ...(flavors.length ? flavors : ["- 記録なし"]),
      "#Kemureco #Sisha"
    ];

    return lines.join("\n");
  };

  const buildShareUrl = (session: SessionItem) => {
    const text = buildShareText(session);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = origin ? `${origin}/` : "";
    return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  };

  const handleCopyShare = async (session: SessionItem) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast({ title: "コピーできませんでした", description: "ブラウザの設定をご確認ください。", variant: "destructive" });
      return;
    }
    const text = buildShareText(session);
    const origin = window.location.origin;
    const url = origin ? `${origin}/` : "";
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast({ title: "リンクをコピーしました" });
    } catch (error) {
      console.error("copy share error", error);
      toast({ title: "コピーに失敗しました", description: "もう一度お試しください。", variant: "destructive" });
    }
  };

  const daySummary = useMemo(() => {
    const count = selectedSessions.length;
    const satisfactionValues = selectedSessions
      .map((session) => session.satisfaction ?? 0)
      .filter((value) => value > 0);
    const avgSatisfaction =
      satisfactionValues.length > 0
        ? satisfactionValues.reduce((sum, value) => sum + value, 0) / satisfactionValues.length
        : null;
    let totalGrams = 0;
    let hasGrams = false;
    selectedSessions.forEach((session) => {
      session.mix?.components?.forEach((component) => {
        if (typeof component.grams === "number" && component.grams > 0) {
          totalGrams += component.grams;
          hasGrams = true;
        }
      });
    });
    const times = selectedSessions
      .map((session) => (session.started_at ? new Date(session.started_at) : null))
      .filter((value): value is Date => !!value && !Number.isNaN(value.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    const timeRange =
      times.length > 0
        ? `${times[0].toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}〜${times[
            times.length - 1
          ].toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
        : "";
    return { count, avgSatisfaction, totalGrams, hasGrams, timeRange };
  }, [selectedSessions]);

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
      setEditingLocationPlace(null);
      setOpenMenuId(null);
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    }
  }, [dialogOpen]);

  const fetchSessions = async (userId: string) => {
    try {
      const baseSelect =
        "id, started_at, satisfaction, user_id, location_text, location_place_id, location_name, location_address, location_lat, location_lng, location_distance_km, notes" +
        (mixColumnAvailable ? ", mix_id" : "");
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
        {
          id: number;
          title: string;
          components: {
            flavorId: number;
            flavorName: string;
            brandName?: string | null;
            imageUrl?: string | null;
            ratioPercent?: number | null;
          }[];
        }
      >();

      if (uniqueMixIds.length > 0) {
        try {
          const { data: mixData, error: mixError } = await supabase
            .from("mixes")
            .select(
              "id,title,mix_components:mix_components(flavor_id,ratio_percent,grams,layer_order,flavors(name,image_path,brands(name)))"
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
                    imageUrl: component.flavors?.image_path
                      ? supabase.storage.from("flavor-images").getPublicUrl(component.flavors.image_path).data.publicUrl
                      : null,
                    grams: component.grams ?? null,
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
          location_place_id: item.location_place_id ?? null,
          location_name: item.location_name ?? null,
          location_address: item.location_address ?? null,
          location_lat: item.location_lat ?? null,
          location_lng: item.location_lng ?? null,
          location_distance_km: item.location_distance_km ?? null,
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
    if (!date) return;
    const key = toLocalDateKey(date);
    setSelectedDate(key);
    setSelectedSessions(daySessions);
    setEditingId(null);
    setEditingForm({ startedAt: "", satisfaction: 3, location: "", notes: "" });
    setEditingComponents([]);
    setEditingLocationPlace(null);
    setDialogOpen(true);
  };

  const startEdit = (session: SessionItem) => {
    setEditingId(session.id);
    setEditingForm({
      startedAt: formatDateInput(session.started_at),
      satisfaction: session.satisfaction ?? 3,
      location: session.location_name ?? session.location_text ?? "",
      notes: session.notes ?? ""
    });
    setEditingLocationPlace(
      session.location_place_id || session.location_name || session.location_address
        ? {
            placeId: session.location_place_id ?? "",
            name: session.location_name ?? session.location_text ?? "",
            formattedAddress: session.location_address ?? "",
            lat: session.location_lat ?? null,
            lng: session.location_lng ?? null,
            distanceKm: session.location_distance_km ?? null
          }
        : null
    );
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
      location_text: (editingLocationPlace?.name ?? editingForm.location.trim()) || null,
      location_place_id: editingLocationPlace?.placeId ?? null,
      location_name: editingLocationPlace?.name ?? null,
      location_address: editingLocationPlace?.formattedAddress ?? null,
      location_lat: editingLocationPlace?.lat ?? null,
      location_lng: editingLocationPlace?.lng ?? null,
      location_distance_km: editingLocationPlace?.distanceKm ?? null,
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

        if (mixIdToUse != null) {
          const mixId = mixIdToUse;
          const { error: deleteError } = await supabase.from("mix_components").delete().eq("mix_id", mixId);
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
            mix_id: mixId,
            flavor_id: flavorId,
            ratio_percent: ratios[index] ?? 0,
            grams: null,
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
                const isClickable = !!date;
                const highlightAlpha = Math.min(0.25 + daySessions.length * 0.18, 0.85);
                const highlightStyle = hasSessions
                  ? { backgroundColor: `rgba(56, 189, 248, ${highlightAlpha})` }
                  : undefined;
                return (
                  <div
                    key={key}
                    className="flex h-10 items-center justify-center"
                    onClick={() => handleSelectDate(date, daySessions)}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : -1}
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
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-amber-50/90 via-background to-background/70 p-4 shadow-xl sm:rounded-3xl sm:p-6 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950">
          <DialogHeader className="sr-only">
            <DialogTitle>セッション詳細</DialogTitle>
          </DialogHeader>
          <div className="flex h-full flex-col gap-4 sm:gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">SESSION DETAIL</p>
                <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
                  {formatDayHeader(selectedDate) || "日付未選択"}
                </h3>
                {daySummary.timeRange ? <p className="text-xs text-muted-foreground">{daySummary.timeRange}</p> : null}
              </div>
              <Popover open={openMenuId === -1} onOpenChange={(open) => setOpenMenuId(open ? -1 : null)}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="メニュー" className="self-end sm:self-auto">
                    <Ellipsis className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-44 p-1">
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      className="justify-start gap-2"
                      onClick={() => {
                        setOpenMenuId(null);
                        const target = selectedSessions[0];
                        if (target) startEdit(target);
                      }}
                      disabled={selectedSessions.length === 0}
                    >
                      <Pencil className="h-4 w-4" />
                      編集
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start gap-2 text-destructive hover:text-destructive"
                      onClick={() => {
                        setOpenMenuId(null);
                        const target = selectedSessions[0];
                        if (!target) return;
                        setPendingDeleteId(target.id);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={selectedSessions.length === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                      削除
                    </Button>
                  </div>
                </PopoverContent>
                </Popover>
              </div>
            <div className="grid gap-3 sm:grid-cols-3 grid-cols-2">
              <Card className="rounded-3xl border border-border/60 bg-background/80 shadow-sm">
                <CardContent className="space-y-1 p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">記録件数</p>
                  <p className="text-2xl font-semibold text-foreground">{daySummary.count}件</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border border-border/60 bg-background/80 shadow-sm">
                <CardContent className="space-y-1 p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">平均満足度</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold text-foreground">
                      {daySummary.avgSatisfaction ? daySummary.avgSatisfaction.toFixed(1) : "—"}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <ThumbsUp
                          key={`summary-score-${score}`}
                          className={`h-3.5 w-3.5 ${
                            (daySummary.avgSatisfaction ?? 0) >= score
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
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border border-border/60 bg-background/80 shadow-sm">
                <CardContent className="space-y-1 p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">合計グラム</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {daySummary.hasGrams ? `${Math.round(daySummary.totalGrams)}g` : "未入力"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 overflow-hidden">
              {selectedSessions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/70 bg-background/70 p-6 text-center">
                  <p className="text-sm text-muted-foreground">この日の記録はまだありません。</p>
                  <Button asChild className="mt-4 gap-2 rounded-full px-5" variant="outline">
                    <Link href="/sessions/new">
                      <Plus className="h-4 w-4" />
                      記録を追加する
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_260px] h-full">
                  <ScrollArea className="max-h-[44vh] pr-1 sm:max-h-[60vh] sm:pr-2">
                  <div className="space-y-4">
                    {selectedSessions.map((item) => {
                      const mixItems = item.mix?.components ?? [];
                      const memoPreview = item.notes ? item.notes.split("\n")[0]?.slice(0, 60) : "";

                      return (
                        <Card key={item.id} className="relative rounded-3xl border border-border/60 bg-background/80 shadow-sm">
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
                                  <LocationPlacesCombobox
                                    value={editingLocationPlace}
                                    onChange={(nextValue) => {
                                      setEditingLocationPlace(nextValue);
                                      handleEditChange("location", nextValue?.name ?? "");
                                    }}
                                    placeholder="店舗名で検索"
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
                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                      {item.started_at ? formatSessionDateLabel(item.started_at) : "日付不明"}
                                      {item.started_at ? ` ・ ${formatTimeLabel(item.started_at)}` : ""}
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
                                      {item.location_name || item.location_text ? (
                                        <>
                                          <span className="text-foreground/80">{item.location_name ?? item.location_text}</span>
                                          {(() => {
                                            const mapLink = getGoogleMapsLink(
                                              item.location_lat,
                                              item.location_lng,
                                              item.location_name ?? item.location_text,
                                              item.location_address
                                            );
                                            return mapLink ? (
                                              <a
                                                href={mapLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-primary hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            ) : null;
                                          })()}
                                        </>
                                      ) : (
                                        <span>未設定</span>
                                      )}
                                    </div>
                                </div>
                              </CardHeader>
                              <div className="absolute right-4 top-4">
                                <Popover
                                  open={openMenuId === item.id}
                                  onOpenChange={(open) => setOpenMenuId(open ? item.id : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="メニュー">
                                      <Ellipsis className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-44 p-1">
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
                                        className="justify-start gap-2"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          window.open(buildShareUrl(item), "_blank", "noopener,noreferrer");
                                        }}
                                      >
                                        <Share2 className="h-4 w-4" />
                                        Xに投稿
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        className="justify-start gap-2"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          void handleCopyShare(item);
                                        }}
                                      >
                                        <Share2 className="h-4 w-4" />
                                        リンクをコピー
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
                              <CardContent className="space-y-3 px-5 pb-4 pt-0">
                                {item.mix?.components && item.mix.components.length > 0 ? (
                                  <div className="space-y-2">
                                    <p className="text-[11px] text-muted-foreground">フレーバー</p>
                                    <div className="flex flex-wrap gap-2">
                                      {mixItems.map((component) => (
                                        <div
                                          key={`${item.id}-flavor-${component.flavorId}`}
                                          className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-2 py-1 text-[11px] text-muted-foreground"
                                        >
                                          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-muted">
                                            {component.imageUrl ? (
                                              <img
                                                src={component.imageUrl}
                                                alt={component.flavorName}
                                                className="h-full w-full object-cover"
                                                onError={(event) => {
                                                  event.currentTarget.style.display = "none";
                                                }}
                                              />
                                            ) : null}
                                          </span>
                                          <div className="flex flex-col">
                                            <span className="text-foreground">{component.flavorName}</span>
                                            {component.brandName ? (
                                              <span className="text-[10px] text-muted-foreground">{component.brandName}</span>
                                            ) : null}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">フレーバー未設定</p>
                                )}
                                {memoPreview ? (
                                  <p className="text-sm text-foreground">{memoPreview}{item.notes && item.notes.length > 60 ? "…" : ""}</p>
                                ) : null}
                              </CardContent>
                            </>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                  </ScrollArea>
                  <div className="space-y-3">
                    <Card className="rounded-3xl border border-border/60 bg-background/80 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">この日のメモ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedSessions.some((session) => session.notes) ? (
                          selectedSessions
                            .filter((session) => session.notes)
                            .map((session) => (
                              <div key={`note-${session.id}`} className="space-y-1 border-b border-border/40 pb-2 last:border-none last:pb-0">
                                <p className="text-xs text-muted-foreground">{formatTimeLabel(session.started_at)}</p>
                                <p className="text-sm text-foreground">{session.notes}</p>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-muted-foreground">メモはまだありません。</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="rounded-3xl border border-border/60 bg-background/80 shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <p className="text-xs text-muted-foreground">次のアクション</p>
                        <Button asChild className="w-full gap-2 rounded-full">
                          <Link href="/sessions/new">
                            <Plus className="h-4 w-4" />
                            この日に記録を追加
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
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
