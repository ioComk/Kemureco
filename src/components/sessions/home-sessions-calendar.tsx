"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Session } from "@/lib/types";
import type { SessionItem } from "./types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth/auth-provider";
import { Ellipsis, ExternalLink, MapPin, Package, Pencil, Plus, Share2, Sparkles, ThumbsUp, Trash2 } from "lucide-react";
import { LocationPlacesCombobox, type PlaceValue, getGoogleMapsLink } from "@/components/sessions/location-places-combobox";
import Link from "next/link";
import { JP_QUERY_MAP } from "@/lib/flavor-constants";
import { fetchSessionFlavorsMap } from "@/lib/session-service";

type EditComponentState = {
  flavorId: string;
  grams: number | "";
  mode: "existing" | "custom";
  customName: string;
  customBrand: string;
};

const MIN_COMPONENTS = 1;
const MAX_COMPONENTS = 4;
const DEFAULT_COMPONENT_GRAMS = 3;

const getGramsValue = (grams: EditComponentState["grams"]) => (typeof grams === "number" ? grams : 0);

const createDefaultComponents = (count: number): EditComponentState[] => {
  if (count <= 0) return [];
  return Array.from({ length: count }, () => ({
    flavorId: "",
    grams: DEFAULT_COMPONENT_GRAMS,
    mode: "existing",
    customName: "",
    customBrand: ""
  }));
};

const evenDistribution = (list: EditComponentState[], totalOverride?: number): EditComponentState[] => {
  if (list.length === 0) return list;
  const currentTotal = list.reduce((sum, component) => sum + getGramsValue(component.grams), 0);
  const total = totalOverride ?? (currentTotal > 0 ? currentTotal : DEFAULT_COMPONENT_GRAMS * list.length);
  const equal = Math.floor(total / list.length);
  let remainder = total - equal * list.length;
  return list.map((component) => ({
    ...component,
    grams: Math.max(0, equal + (remainder-- > 0 ? 1 : 0))
  }));
};

export function HomeSessionsCalendar() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [sessionState, setSessionState] = useState<{ loading: boolean; userId?: string }>({ loading: true });
  const [flavors, setFlavors] = useState<Array<{ id: number; name: string; brandName?: string | null; image_path?: string | null; tags?: string[] | null }>>([]);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
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
  const [editingComponents, setEditingComponents] = useState<EditComponentState[]>([]);
  const [useCustomRatio, setUseCustomRatio] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<{
    startedAt: string;
    satisfaction: number;
    location: string;
    notes: string;
  }>({ startedAt: "", satisfaction: 3, location: "", notes: "" });
  const [hoverSatisfaction, setHoverSatisfaction] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    const flavorsText =
      session.session_flavors && session.session_flavors.length > 0
        ? session.session_flavors.map((sf) => {
            const brand = sf.brandName ? ` (${sf.brandName})` : "";
            const gramsText = sf.grams && sf.grams > 0 ? ` ${sf.grams}g` : "";
            return `- ${sf.flavorName}${brand}${gramsText}`;
          })
        : [];

    const lines = [
      date,
      "フレーバー:",
      ...(flavorsText.length ? flavorsText : ["- 記録なし"]),
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
    return { count, avgSatisfaction, timeRange };
  }, [selectedSessions]);

  const totalEditingGrams = useMemo(
    () => editingComponents.reduce((sum, component) => sum + getGramsValue(component.grams), 0),
    [editingComponents]
  );

  const flavorById = useMemo(
    () => new Map(flavors.map((flavor) => [String(flavor.id), flavor])),
    [flavors]
  );

  const flavorImageUrls = useMemo(() => {
    const map = new Map<number, string>();
    flavors.forEach((flavor) => {
      if (!flavor.image_path) return;
      const { data } = supabase.storage.from("flavor-images").getPublicUrl(flavor.image_path);
      if (data.publicUrl) {
        map.set(flavor.id, data.publicUrl);
      }
    });
    return map;
  }, [flavors, supabase]);

  const getFlavorSearchTokens = (query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const tokens = new Set([normalized]);
    JP_QUERY_MAP.forEach(({ jp, en }) => {
      if (normalized.includes(jp)) {
        tokens.add(en);
      }
    });
    return Array.from(tokens);
  };

  const getFlavorSuggestions = (query: string, max = 6) => {
    const tokenList = getFlavorSearchTokens(query);
    if (!tokenList.length) return [];
    return flavors
      .filter((flavor) => {
        const haystack = [flavor.name, flavor.brandName ?? "", ...(flavor.tags ?? [])].join(" ").toLowerCase();
        return tokenList.some((token) => haystack.includes(token));
      })
      .slice(0, max);
  };

  const getBrandSuggestions = (query: string, max = 6) => {
    const tokenList = getFlavorSearchTokens(query);
    if (!tokenList.length) return [];
    return brands
      .filter((brand) => {
        const haystack = brand.name.toLowerCase();
        return tokenList.some((token) => haystack.includes(token));
      })
      .slice(0, max);
  };

  const dayFlavors = useMemo(() => {
    const items = new Map<string, { name: string; imageUrl: string | null }>();
    selectedSessions.forEach((session) => {
      session.session_flavors?.forEach((sf) => {
        if (!sf.flavorName) return;
        const key = sf.flavorId ? `flavor-${sf.flavorId}` : `custom-${sf.flavorName}`;
        if (!items.has(key)) {
          items.set(key, { name: sf.flavorName, imageUrl: sf.imageUrl ?? null });
        }
      });
    });
    return Array.from(items.values());
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
      void fetchBrands();
    } else {
      setSessions([]);
      setFlavors([]);
      setBrands([]);
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
      setUseCustomRatio(false);
      setHoverSatisfaction(null);
      setOpenMenuId(null);
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    }
  }, [dialogOpen]);

  const fetchSessions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, started_at, satisfaction, user_id, location_text, location_place_id, location_name, location_address, location_lat, location_lng, location_distance_km, notes")
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

      if (error) {
        throw error;
      }

      const rows: Session[] = Array.isArray(data) ? ((data as unknown) as Session[]) : [];
      const sessionIds = rows.map((row) => row.id);
      const sessionFlavorsMap = await fetchSessionFlavorsMap(supabase, sessionIds);

      const normalized: SessionItem[] = rows.map((item) => ({
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
        session_flavors: sessionFlavorsMap.get(item.id) ?? []
      }));

      setSessions(normalized);
    } catch (err) {
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
      .select("id,name,brands(name),image_path,tags")
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
        brandName: row.brands?.name ?? null,
        image_path: row.image_path ?? null,
        tags: row.tags ?? null
      }))
    );
  };

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from("brands")
      .select("id,name")
      .order("name", { ascending: true });
    if (error) {
      console.error("fetch brands error", error);
      return;
    }
    setBrands(data ?? []);
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
    setUseCustomRatio(false);
    setHoverSatisfaction(null);
    setDialogOpen(true);
  };

  const startEdit = (session: SessionItem) => {
    setEditingId(session.id);
    setHoverSatisfaction(null);
    const existingComponents: EditComponentState[] = session.session_flavors?.length
      ? session.session_flavors.map((sf) => ({
          flavorId: sf.flavorId ? String(sf.flavorId) : "",
          grams: typeof sf.grams === "number" ? sf.grams : DEFAULT_COMPONENT_GRAMS,
          mode: sf.flavorId ? "existing" : "custom",
          customName: sf.customFlavorName ?? "",
          customBrand: sf.customBrandName ?? ""
        }))
      : [];
    const nextComponents = existingComponents.length > 0 ? existingComponents : createDefaultComponents(MIN_COMPONENTS);

    setEditingForm({
      startedAt: formatDateInput(session.started_at),
      satisfaction: session.satisfaction ?? 3,
      location: session.location_name ?? session.location_text ?? "",
      notes: session.notes ?? ""
    });
    setEditingComponents(nextComponents);
    setUseCustomRatio(false);
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
  };

  const handleEditChange = <K extends keyof typeof editingForm>(key: K, value: (typeof editingForm)[K]) => {
    setEditingForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleComponentChange = (index: number, updates: Partial<EditComponentState>) => {
    setEditingComponents((prev) => {
      const next = [...prev];
      const current = next[index] ?? createDefaultComponents(1)[0];
      next[index] = { ...current, ...updates };
      return next;
    });
  };

  const handleAddComponent = () => {
    setEditingComponents((prev) =>
      prev.length >= MAX_COMPONENTS ? prev : [...prev, ...createDefaultComponents(1)]
    );
  };

  const handleRemoveComponent = (index: number) => {
    setEditingComponents((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdate = async (sessionId: number) => {
    if (!sessionState.userId) return;
    const hasInvalidComponent = editingComponents.some((component) =>
      component.mode === "existing" ? !component.flavorId : component.customName.trim().length === 0
    );
    if (editingComponents.length > 0 && hasInvalidComponent) {
      toast({ title: "フレーバーを入力してください", variant: "destructive" });
      return;
    }
    if (useCustomRatio && editingComponents.some((component) => getGramsValue(component.grams) <= 0)) {
      toast({ title: "グラム数を入力してください", variant: "destructive" });
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

    // セッション更新
    const { error: sessionError } = await supabase.from("sessions").update(payload).eq("id", sessionId);
    if (sessionError) {
      setSavingId(null);
      toast({
        title: "更新に失敗しました",
        description: sessionError.message ?? "もう一度お試しください",
        variant: "destructive"
      });
      return;
    }

    // session_flavors更新
    const { error: deleteError } = await supabase.from("session_flavors").delete().eq("session_id", sessionId);
    if (deleteError) {
      setSavingId(null);
      toast({
        title: "フレーバー更新に失敗しました",
        description: deleteError.message,
        variant: "destructive"
      });
      return;
    }

    if (editingComponents.length > 0) {
      const ratios = (() => {
        if (!useCustomRatio) {
          const equal = Math.floor(100 / editingComponents.length);
          let remainder = 100 - equal * editingComponents.length;
          return editingComponents.map(() => equal + (remainder-- > 0 ? 1 : 0));
        }
        const total = editingComponents.reduce((sum, component) => sum + getGramsValue(component.grams), 0);
        const rawRatios = editingComponents.map((component) =>
          total > 0 ? (getGramsValue(component.grams) / total) * 100 : 0
        );
        let remaining = 100;
        return rawRatios.map((ratio, index) => {
          if (index === rawRatios.length - 1) return Math.max(0, remaining);
          const rounded = Math.max(0, Math.round(ratio));
          remaining -= rounded;
          return rounded;
        });
      })();

      const sessionFlavorsPayload = editingComponents.map((component, index) => ({
        session_id: sessionId,
        flavor_id: component.mode === "existing" && component.flavorId ? Number(component.flavorId) : null,
        custom_flavor_name: component.mode === "custom" ? component.customName.trim() || null : null,
        custom_brand_name: component.mode === "custom" ? component.customBrand.trim() || null : null,
        ratio_percent: ratios[index] ?? 0,
        grams: useCustomRatio ? getGramsValue(component.grams) : null,
        layer_order: index + 1
      }));

      const { error: insertError } = await supabase.from("session_flavors").insert(sessionFlavorsPayload);
      if (insertError) {
        setSavingId(null);
        toast({
          title: "フレーバー更新に失敗しました",
          description: insertError.message,
          variant: "destructive"
        });
        return;
      }
    }

    setSavingId(null);
    toast({ title: "更新しました" });
    setEditingId(null);
    setHoverSatisfaction(null);
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
      setHoverSatisfaction(null);
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
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-amber-50/90 via-background to-background/70 p-0 shadow-xl sm:rounded-3xl dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950">
          <DialogHeader className="sr-only">
            <DialogTitle>セッション詳細</DialogTitle>
          </DialogHeader>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 pt-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">SESSION DETAIL</p>
                <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
                  {formatDayHeader(selectedDate) || "日付未選択"}
                </h3>
                {daySummary.timeRange ? <p className="text-xs text-muted-foreground">{daySummary.timeRange}</p> : null}
              </div>
            </div>
            </div>
            <ScrollArea className="flex-1 min-h-0 px-4 pb-6 sm:px-6">
            <div className="space-y-4">
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
                <CardContent className="space-y-2 p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">使用フレーバー</p>
                  {dayFlavors.length > 0 ? (
                    <TooltipProvider>
                      <div className="flex flex-wrap items-center gap-2">
                        {dayFlavors.map((flavor) => (
                          <Tooltip key={flavor.name}>
                            <TooltipTrigger asChild>
                              <div className="h-10 w-10 overflow-hidden rounded-full border border-border/60 bg-muted/50 shadow-sm">
                                {flavor.imageUrl ? (
                                  <img
                                    src={flavor.imageUrl}
                                    alt={flavor.name}
                                    className="h-full w-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{flavor.name}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  ) : (
                    <p className="text-sm text-muted-foreground">未設定</p>
                  )}
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
                <div className="flex h-full flex-col gap-4">
                  <div className="space-y-4">
                    {selectedSessions.map((item) => {
                      const sessionFlavors = item.session_flavors ?? [];
                      const memoPreview = item.notes ? item.notes.split("\n")[0]?.slice(0, 60) : "";

                      return (
                        <Card key={item.id} className="relative rounded-3xl border border-border/60 bg-background/80 shadow-sm">
                          {editingId === item.id ? (
                            <>
                              <CardHeader className="px-5 pb-3 pt-4">
                                <CardTitle className="text-base">編集モード</CardTitle>
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
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label className="text-base">フレーバー構成</Label>
                                      {useCustomRatio ? (
                                        <p className="text-xs text-muted-foreground">合計: {totalEditingGrams}g</p>
                                      ) : null}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddComponent}
                                        disabled={editingComponents.length >= MAX_COMPONENTS}
                                      >
                                        追加
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingComponents(createDefaultComponents(1));
                                          setUseCustomRatio(false);
                                        }}
                                      >
                                        リセット
                                      </Button>
                                    </div>
                                  </div>
                                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input
                                      type="checkbox"
                                      checked={useCustomRatio}
                                      onChange={(event) => {
                                        const next = event.target.checked;
                                        setUseCustomRatio(next);
                                        if (next) {
                                          setEditingComponents((prev) => evenDistribution(prev));
                                        }
                                      }}
                                      className="h-4 w-4 accent-primary"
                                    />
                                    グラム数を自分で設定する
                                  </label>
                                  <div className="grid gap-3">
                                    {editingComponents.map((component, index) => {
                                      const selectedFlavor =
                                        component.mode === "existing" ? flavorById.get(component.flavorId) ?? null : null;
                                      const isSelected =
                                        component.mode === "existing"
                                          ? !!selectedFlavor
                                          : component.customName.trim().length > 0;

                                      return (
                                        <div
                                          key={`edit-flavor-${item.id}-${index}`}
                                          className={`rounded-xl border p-4 space-y-3 transition-all ${
                                            isSelected
                                              ? "border-foreground/30 bg-gray-100 dark:bg-zinc-800"
                                              : "border-border bg-white dark:bg-zinc-900"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                              <div
                                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                                  isSelected
                                                    ? "bg-foreground text-background"
                                                    : "bg-muted-foreground/20 text-muted-foreground"
                                                }`}
                                              >
                                                {index + 1}
                                              </div>
                                              <div>
                                                <Label className="text-sm font-semibold">フレーバー #{index + 1}</Label>
                                                {selectedFlavor?.brandName ? (
                                                  <p className="text-xs text-muted-foreground">{selectedFlavor.brandName}</p>
                                                ) : null}
                                              </div>
                                            </div>
                                            {editingComponents.length > MIN_COMPONENTS ? (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveComponent(index)}
                                              >
                                                削除
                                              </Button>
                                            ) : null}
                                          </div>
                                          {isSelected && component.mode === "existing" && selectedFlavor && (
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-zinc-800 border border-border">
                                              {flavorImageUrls.get(selectedFlavor.id) ? (
                                                <img
                                                  src={flavorImageUrls.get(selectedFlavor.id)}
                                                  alt={selectedFlavor.name}
                                                  className="h-12 w-12 rounded-lg object-cover"
                                                  loading="lazy"
                                                />
                                              ) : (
                                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                                  <Package className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{selectedFlavor.name}</p>
                                                {useCustomRatio && (
                                                  <p className="text-sm text-muted-foreground">{getGramsValue(component.grams)}g</p>
                                                )}
                                              </div>
                                              <Sparkles className="h-4 w-4 text-muted-foreground/50" />
                                            </div>
                                          )}

                                          {useCustomRatio && getGramsValue(component.grams) <= 0 ? (
                                            <p className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">0gのフレーバーは保存できません。</p>
                                          ) : null}

                                          <div className="space-y-3">
                                            <Input
                                              placeholder="フレーバー名を入力 (例: ミント)"
                                              value={component.customName}
                                              onChange={(event) => {
                                                handleComponentChange(index, {
                                                  customName: event.target.value,
                                                  flavorId: "",
                                                  mode: "custom"
                                                });
                                              }}
                                              className="h-11"
                                            />

                                            {component.customName.trim().length > 0 ? (
                                              <div className="rounded-lg border bg-background/90 overflow-hidden">
                                                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
                                                  {(() => {
                                                    const suggestions = getFlavorSuggestions(component.customName);
                                                    return suggestions.length > 0 ? "既存のフレーバーから選択" : "新しいフレーバーとして記録します";
                                                  })()}
                                                </div>
                                                {(() => {
                                                  const suggestions = getFlavorSuggestions(component.customName);
                                                  if (!suggestions.length) {
                                                    return (
                                                      <div className="px-3 py-4 space-y-2">
                                                        <p className="text-sm text-muted-foreground text-center">
                                                          「{component.customName}」として記録されます
                                                        </p>
                                                        {!component.customBrand && (
                                                          <p className="text-xs text-muted-foreground text-center">
                                                            必要に応じて下のブランド名も入力してください
                                                          </p>
                                                        )}
                                                      </div>
                                                    );
                                                  }
                                                  return (
                                                    <div className="max-h-40 overflow-auto divide-y">
                                                      {suggestions.map((flavor) => (
                                                        <button
                                                          key={flavor.id}
                                                          type="button"
                                                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent/50 transition-colors"
                                                          onClick={() =>
                                                            handleComponentChange(index, {
                                                              flavorId: String(flavor.id),
                                                              mode: "existing",
                                                              customName: flavor.name,
                                                              customBrand: ""
                                                            })
                                                          }
                                                        >
                                                          {flavorImageUrls.get(flavor.id) ? (
                                                            <img src={flavorImageUrls.get(flavor.id)} alt="" className="h-8 w-8 rounded object-cover" loading="lazy" />
                                                          ) : (
                                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                              <Package className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                          )}
                                                          <span className="flex-1 truncate font-medium">{flavor.name}</span>
                                                          <span className="text-xs text-muted-foreground">
                                                            {flavor.brandName ?? "ブランド未設定"}
                                                          </span>
                                                        </button>
                                                      ))}
                                                    </div>
                                                  );
                                                })()}
                                              </div>
                                            ) : null}

                                            {component.mode === "custom" && (
                                              <>
                                                <Input
                                                  placeholder="ブランド名 (任意: 例 オリジナル)"
                                                  value={component.customBrand}
                                                  onChange={(event) => handleComponentChange(index, { customBrand: event.target.value })}
                                                  className="border-dashed"
                                                />

                                                {component.customBrand.trim().length > 0 && (() => {
                                                  const brandSuggestions = getBrandSuggestions(component.customBrand);
                                                  if (brandSuggestions.length === 0) return null;
                                                  return (
                                                    <div className="rounded-lg border bg-background/90 overflow-hidden">
                                                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
                                                        既存のブランドから選択
                                                      </div>
                                                      <div className="max-h-32 overflow-auto divide-y">
                                                        {brandSuggestions.map((brand) => (
                                                          <button
                                                            key={brand.id}
                                                            type="button"
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors"
                                                            onClick={() => handleComponentChange(index, { customBrand: brand.name })}
                                                          >
                                                            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                            <span className="flex-1 truncate font-medium">{brand.name}</span>
                                                          </button>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  );
                                                })()}
                                              </>
                                            )}

                                            {useCustomRatio && (
                                              <div className="flex items-center gap-2 mt-2">
                                                <Label className="text-xs text-muted-foreground whitespace-nowrap">グラム数:</Label>
                                                <div className="flex items-center gap-1 rounded-lg border bg-background px-3 py-1.5 shadow-sm">
                                                  <Input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    value={component.grams === "" ? "" : component.grams}
                                                    onChange={(event) => {
                                                      const raw = event.target.value;
                                                      if (raw === "") {
                                                        handleComponentChange(index, { grams: "" });
                                                        return;
                                                      }
                                                      const nextValue = Number(raw);
                                                      handleComponentChange(index, {
                                                        grams: Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0
                                                      });
                                                    }}
                                                    className="h-7 w-16 border-0 p-0 text-center font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                                                  />
                                                  <span className="text-sm text-muted-foreground font-medium">g</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    満足度 <span className="text-sm font-medium">{hoverSatisfaction ?? editingForm.satisfaction}/5</span>
                                  </Label>
                                  <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5].map((score) => {
                                      const active = (hoverSatisfaction ?? editingForm.satisfaction) >= score;
                                      return (
                                        <button
                                          key={`${item.id}-edit-score-${score}`}
                                          type="button"
                                          onClick={() => handleEditChange("satisfaction", score)}
                                          onMouseEnter={() => {
                                            setHoverSatisfaction(score);
                                            handleEditChange("satisfaction", score);
                                          }}
                                          onMouseLeave={() => setHoverSatisfaction(null)}
                                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                                            active
                                              ? "border-amber-500 bg-amber-500/20 text-amber-500 dark:border-amber-400 dark:bg-amber-400/20 dark:text-amber-400"
                                              : "border-gray-300 dark:border-gray-600 bg-transparent text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500"
                                          }`}
                                          aria-label={`満足度 ${score}`}
                                        >
                                          <ThumbsUp className="h-5 w-5" />
                                        </button>
                                      );
                                    })}
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingId(null);
                                    setHoverSatisfaction(null);
                                  }}
                                  disabled={savingId === item.id}
                                >
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
                                {sessionFlavors.length > 0 ? (
                                  <div className="space-y-2">
                                    <p className="text-[11px] text-muted-foreground">フレーバー</p>
                                    <div className="flex flex-wrap gap-2">
                                      {sessionFlavors.map((sf, sfIndex) => (
                                        <div
                                          key={`${item.id}-flavor-${sf.id ?? sfIndex}`}
                                          className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-2 py-1 text-[11px] text-muted-foreground"
                                        >
                                          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-muted">
                                            {sf.imageUrl ? (
                                              <img
                                                src={sf.imageUrl}
                                                alt={sf.flavorName}
                                                className="h-full w-full object-cover"
                                                onError={(event) => {
                                                  event.currentTarget.style.display = "none";
                                                }}
                                              />
                                            ) : null}
                                          </span>
                                          <div className="flex flex-col">
                                            <span className="text-foreground">{sf.flavorName}</span>
                                            {sf.brandName ? (
                                              <span className="text-[10px] text-muted-foreground">{sf.brandName}</span>
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
                                  <p className="text-sm text-foreground">{memoPreview}{(item.notes?.length ?? 0) > 60 ? "…" : ""}</p>
                                ) : null}
                              </CardContent>
                            </>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                  <Card className="sticky bottom-0 z-20 border-0 bg-background/95 backdrop-blur">
                    <CardContent className="p-4">
                      <Button asChild className="w-full gap-2 rounded-full">
                        <Link href="/sessions/new">
                          <Plus className="h-4 w-4" />
                          この日に記録を追加
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              </div>
            </div>
            </ScrollArea>
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
