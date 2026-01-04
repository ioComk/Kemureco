"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import type { Session } from "@/lib/types";
import type { SessionItem } from "@/components/sessions/types";
import { SessionOverviewCard } from "@/components/sessions/session-overview-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { ExternalLink, Trash2 } from "lucide-react";
import { HomeSessionsCalendar } from "@/components/sessions/home-sessions-calendar";
import { LocationPlacesCombobox, type PlaceValue, getGoogleMapsLink } from "@/components/sessions/location-places-combobox";

export function SessionsDashboard() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [sessionState, setSessionState] = useState<{ loading: boolean; userId?: string }>({ loading: true });
  const [mixColumnAvailable, setMixColumnAvailable] = useState(true);
  const [flavors, setFlavors] = useState<Array<{ id: number; name: string; brandName?: string | null }>>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLocationPlace, setEditingLocationPlace] = useState<PlaceValue | null>(null);
  const [editingComponents, setEditingComponents] = useState<Array<{ flavorId: string }>>([]);
  const [editingForm, setEditingForm] = useState<{
    startedAt: string;
    location: string;
    satisfaction: number;
    notes: string;
  }>({ startedAt: "", location: "", satisfaction: 3, notes: "" });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const maxComponents = 4;

  useEffect(() => {
    if (authLoading) {
      setSessionState({ loading: true, userId: undefined });
      return;
    }
    const userId = user?.id;
    setSessionState({ loading: false, userId });
    if (userId) {
      void fetchFlavors();
      void fetchSessions(userId);
    } else {
      setSessions([]);
    }
  }, [authLoading, user?.id]);


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

  const fetchSessions = async (userId: string) => {
    try {
      const baseSelect =
        "id, started_at, location_text, location_place_id, location_name, location_address, location_lat, location_lng, location_distance_km, satisfaction, notes" +
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
      startedAt: item.started_at ? new Date(item.started_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      location: item.location_name ?? item.location_text ?? "",
      satisfaction: item.satisfaction ?? 3,
      notes: item.notes ?? ""
    });
    setEditingLocationPlace(
      item.location_place_id || item.location_name || item.location_address
        ? {
            placeId: item.location_place_id ?? "",
            name: item.location_name ?? item.location_text ?? "",
            formattedAddress: item.location_address ?? "",
            lat: item.location_lat ?? null,
            lng: item.location_lng ?? null,
            distanceKm: item.location_distance_km ?? null
          }
        : null
    );
    setEditingComponents(
      item.mix?.components?.length
        ? item.mix.components.map((component) => ({ flavorId: String(component.flavorId) }))
        : []
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingComponents([]);
    setEditingLocationPlace(null);
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
    if (!sessionState.userId || editingId !== sessionId) return;
    if (mixColumnAvailable && editingComponents.length > 0 && editingComponents.some((component) => !component.flavorId)) {
      toast({ title: "フレーバーを選択してください", variant: "destructive" });
      return;
    }

    const basePayload = {
      location_text: (editingLocationPlace?.name ?? editingForm.location.trim()) || null,
      location_place_id: editingLocationPlace?.placeId ?? null,
      location_name: editingLocationPlace?.name ?? null,
      location_address: editingLocationPlace?.formattedAddress ?? null,
      location_lat: editingLocationPlace?.lat ?? null,
      location_lng: editingLocationPlace?.lng ?? null,
      location_distance_km: editingLocationPlace?.distanceKm ?? null,
      notes: editingForm.notes.trim() || null,
      satisfaction: editingForm.satisfaction,
      started_at: new Date(editingForm.startedAt).toISOString()
    };
    const sessionItem = sessions.find((item) => item.id === sessionId);

    startTransition(async () => {
      let mixIdToUse: number | null = mixColumnAvailable ? sessionItem?.mix_id ?? null : null;
      if (mixColumnAvailable) {
        const flavorIds = editingComponents.map((component) => Number(component.flavorId)).filter((id) => id > 0);
        if (flavorIds.length > 0) {
          const canUpdateExisting = sessionItem?.mix?.title?.startsWith("記録フレーバー");
          if (!canUpdateExisting) {
            mixIdToUse = null;
          }
          if (!mixIdToUse) {
            const userId = sessionState.userId;
            if (!userId) {
              toast({
                title: "ユーザー情報の取得に失敗しました",
                description: "再読み込み後にもう一度お試しください。",
                variant: "destructive"
              });
              return;
            }
            const title = `記録フレーバー ${new Date(editingForm.startedAt).toLocaleString("ja-JP", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}`;
            const { data: mixData, error: mixError } = await supabase
              .from("mixes")
              .insert({ title, description: null, user_id: userId })
              .select("id")
              .single();
            if (mixError || !mixData) {
              console.error("insert mix error", mixError);
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
              console.error("delete mix components error", deleteError);
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
              console.error("insert mix components error", compError);
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
      }

      const fullPayload = mixColumnAvailable ? { ...basePayload, mix_id: mixIdToUse } : basePayload;
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

      <HomeSessionsCalendar />

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
                      {item.location_name || item.location_text ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>場所: {item.location_name ?? item.location_text}</span>
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
                                <span className="text-xs">地図</span>
                              </a>
                            ) : null;
                          })()}
                        </div>
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
                          {deletingId === item.id ? "削除中..." : <Trash2 className="h-4 w-4" />}
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
    </>
  );
}
