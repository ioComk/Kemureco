"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import type { Database, Flavor } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Droplets, Plus, ShieldAlert, ThumbsUp, Trash2, Sparkles, Package } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { LocationPlacesCombobox, type PlaceValue } from "@/components/sessions/location-places-combobox";

type MixOption = Pick<Database["public"]["Tables"]["mixes"]["Row"], "id" | "title">;
type FlavorOption = Flavor & { brand?: { id: number; name: string } | null };

type FormState = {
  startedAt: string;
  location: string;
  satisfaction: number;
  notes: string;
};

type ComponentState = {
  flavorId: string;
  grams: number | "";
  mode: "existing" | "custom";
  customName: string;
  customBrand: string;
};

const JP_QUERY_MAP: Array<{ jp: string; en: string }> = [
  { jp: "みんと", en: "mint" },
  { jp: "ミント", en: "mint" },
  { jp: "れもん", en: "lemon" },
  { jp: "レモン", en: "lemon" },
  { jp: "おれんじ", en: "orange" },
  { jp: "オレンジ", en: "orange" },
  { jp: "あっぷる", en: "apple" },
  { jp: "アップル", en: "apple" },
  { jp: "りんご", en: "apple" },
  { jp: "だぶるあっぷる", en: "two apples" },
  { jp: "ダブルアップル", en: "two apples" },
  { jp: "ぐれーぷ", en: "grape" },
  { jp: "グレープ", en: "grape" },
  { jp: "ぶどう", en: "grape" },
  { jp: "ぶるーべりー", en: "blueberry" },
  { jp: "ブルーベリー", en: "blueberry" },
  { jp: "ちぇりー", en: "cherry" },
  { jp: "チェリー", en: "cherry" },
  { jp: "すいか", en: "watermelon" },
  { jp: "スイカ", en: "watermelon" },
  { jp: "めろん", en: "melon" },
  { jp: "メロン", en: "melon" },
  { jp: "ぴーち", en: "peach" },
  { jp: "ピーチ", en: "peach" },
  { jp: "ぱいなっぷる", en: "pineapple" },
  { jp: "パイナップル", en: "pineapple" },
  { jp: "ばにら", en: "vanilla" },
  { jp: "バニラ", en: "vanilla" },
  { jp: "ちょこ", en: "chocolate" },
  { jp: "チョコ", en: "chocolate" },
  { jp: "しとらす", en: "citrus" },
  { jp: "シトラス", en: "citrus" },
  { jp: "らいむ", en: "lime" },
  { jp: "ライム", en: "lime" },
  { jp: "ここなっつ", en: "coconut" },
  { jp: "ココナッツ", en: "coconut" },
  { jp: "すぱいす", en: "spice" },
  { jp: "スパイス", en: "spice" },
  { jp: "でざーと", en: "dessert" },
  { jp: "デザート", en: "dessert" }
];

type MixInsert = Database["public"]["Tables"]["mixes"]["Insert"];

type MixComponentInsert = Database["public"]["Tables"]["mix_components"]["Insert"];

type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];

const toJstDatetimeValue = (date: Date) => {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

const DEFAULT_FORM_STATE: FormState = {
  startedAt: toJstDatetimeValue(new Date()),
  location: "",
  satisfaction: 3,
  notes: ""
};

const MIN_COMPONENTS = 1;
const MAX_COMPONENTS = 4;
const DEFAULT_COMPONENT_GRAMS = 3;

function createDefaultComponents(count: number): ComponentState[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, () => ({
    flavorId: "",
    grams: DEFAULT_COMPONENT_GRAMS,
    mode: "existing",
    customName: "",
    customBrand: ""
  }));
}

const getGramsValue = (grams: ComponentState["grams"]) => (typeof grams === "number" ? grams : 0);

function evenDistribution(list: ComponentState[], totalOverride?: number): ComponentState[] {
  if (list.length === 0) return list;
  const currentTotal = list.reduce((sum, component) => sum + getGramsValue(component.grams), 0);
  const total = totalOverride ?? (currentTotal > 0 ? currentTotal : DEFAULT_COMPONENT_GRAMS * list.length);
  const equal = Math.floor(total / list.length);
  let remainder = total - equal * list.length;
  return list.map((component) => ({
    ...component,
    grams: Math.max(0, equal + (remainder-- > 0 ? 1 : 0))
  }));
}

export function SessionForm() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { user, loading: authLoading } = useAuth();

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [mixColumnAvailable, setMixColumnAvailable] = useState(true);
  const [mixes, setMixes] = useState<MixOption[]>([]);
  const [flavors, setFlavors] = useState<FlavorOption[]>([]);
  const dataFetchedRef = useRef<string | null>(null); // データ取得済みユーザーID
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [locationPlace, setLocationPlace] = useState<PlaceValue | null>(null);
  const [hoverSatisfaction, setHoverSatisfaction] = useState<number | null>(null);
  const [components, setComponents] = useState<ComponentState[]>(() => createDefaultComponents(2));
  const [useCustomRatio, setUseCustomRatio] = useState(false);
  const [flavorModalIndex, setFlavorModalIndex] = useState<number | null>(null);
  const [flavorQuery, setFlavorQuery] = useState("");
  const flavorById = useMemo(() => new Map(flavors.map((flavor) => [String(flavor.id), flavor])), [flavors]);

  // image_pathからSupabase StorageのPublic URLへのマッピングをキャッシュ
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

  useEffect(() => {
    if (authLoading) {
      setAuthUserId(null);
      return;
    }
    const userId = user?.id ?? null;
    setAuthUserId(userId);
    if (userId) {
      // 同じユーザーIDで既に取得済みなら再取得しない
      if (dataFetchedRef.current === userId) return;
      dataFetchedRef.current = userId;
      void fetchMixes();
      void fetchFlavors();
    } else {
      dataFetchedRef.current = null;
      setMixes([]);
      setFlavors([]);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    setFormState((prev) => ({ ...prev, startedAt: toJstDatetimeValue(new Date()) }));
  }, []);

  useEffect(() => {
    const flavorIdsParam = searchParams.get("flavorIds");
    const flavorIdParam = searchParams.get("flavorId");
    if (!flavorIdsParam && !flavorIdParam) return;
    const ids = (flavorIdsParam ? flavorIdsParam.split(",") : [flavorIdParam])
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value): value is string => value.length > 0)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, 4);
    if (ids.length === 0) return;
    setComponents(() => {
      const targetLength = Math.max(1, ids.length);
      const next = createDefaultComponents(targetLength);
      ids.forEach((id, index) => {
        next[index] = { ...next[index], flavorId: String(id), mode: "existing", customName: "", customBrand: "" };
      });
      return next;
    });

    const ensureSelectedFlavors = async () => {
      const missing = ids.filter((id) => !flavorById.has(String(id)));
      if (missing.length === 0) return;
      const { data, error } = await supabase
        .from("flavors")
        .select("id,name,brand_id,created_at,created_by,tags,image_path,brands(id,name,jp_available)")
        .in("id", missing);
      if (error || !data) return;
      type FlavorQuery = Flavor & { brands?: { id: number; name: string; jp_available: boolean } | null };
      const rows = data as FlavorQuery[];
      const mapped = rows.map((row) => ({ ...row, brand: row.brands ?? null, brands: undefined }));
      setFlavors((prev) => {
        const map = new Map(prev.map((flavor) => [flavor.id, flavor]));
        mapped.forEach((flavor) => map.set(flavor.id, flavor));
        return Array.from(map.values());
      });
    };
    void ensureSelectedFlavors();
  }, [searchParams, flavorById, supabase]);

  const fetchMixes = async () => {
    const { data } = await supabase.from("mixes").select("id,title").order("created_at", { ascending: false });
    setMixes(data ?? []);
  };

  const fetchFlavors = async () => {
    // #region agent log
    const startTime = Date.now();
    fetch('http://127.0.0.1:7242/ingest/627f6a83-0837-4204-a620-6f09c7612d3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'session-form.tsx:fetchFlavors:start',message:'フレーバー取得開始',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const { data, error } = await supabase
      .from("flavors")
      .select("id,name,brand_id,created_at,created_by,tags,image_path,brands(id,name,jp_available)")
      .order("created_at", { ascending: false })
      .limit(100);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/627f6a83-0837-4204-a620-6f09c7612d3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'session-form.tsx:fetchFlavors:end',message:'フレーバー取得完了',data:{duration:Date.now()-startTime,count:data?.length??0,hasError:!!error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (error) {
      console.error("fetch flavors error", error);
      return;
    }
    type FlavorQuery = Flavor & { brands?: { id: number; name: string; jp_available: boolean } | null };
    const rows = (data as FlavorQuery[]) ?? [];
    setFlavors(rows.map((row) => ({ ...row, brand: row.brands ?? null, brands: undefined })));
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleComponentChange = (index: number, partial: Partial<ComponentState>) => {
    setComponents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...partial };
      return next;
    });
  };

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
        const haystack = [flavor.name, flavor.brand?.name ?? "", ...(flavor.tags ?? [])].join(" ").toLowerCase();
        return tokenList.some((token) => haystack.includes(token));
      })
      .slice(0, max);
  };


  const filteredFlavors = useMemo(() => {
    const tokenList = getFlavorSearchTokens(flavorQuery);
    if (!tokenList.length) return flavors;
    return flavors.filter((flavor) => {
      const haystack = [flavor.name, flavor.brand?.name ?? "", ...(flavor.tags ?? [])].join(" ").toLowerCase();
      return tokenList.some((token) => haystack.includes(token));
    });
  }, [flavors, flavorQuery]);

  const handleAddComponent = () => {
    setComponents((prev) => {
      if (prev.length >= MAX_COMPONENTS) return prev;
      const next = [
        ...prev,
        {
          flavorId: "",
          grams: DEFAULT_COMPONENT_GRAMS,
          mode: "existing",
          customName: "",
          customBrand: ""
        } satisfies ComponentState
      ];
      return next;
    });
  };

  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => {
      if (prev.length <= MIN_COMPONENTS) return prev;
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
  };

  const totalGrams = components.reduce((sum, c) => sum + getGramsValue(c.grams), 0);
  const canSubmitFlavors =
    components.length > 0 &&
    components.every((c) => (c.mode === "existing" ? c.flavorId !== "" : c.customName.trim().length > 0)) &&
    (!useCustomRatio || (totalGrams > 0 && components.every((c) => getGramsValue(c.grams) > 0))) &&
    !!authUserId;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUserId) {
      toast({ title: "サインインが必要です", description: "記録には Supabase Auth へのサインインが必要です。", variant: "destructive" });
      return;
    }

    const customFlavorNotes = components
      .filter((component) => component.mode === "custom" && component.customName.trim().length > 0)
      .map((component) => {
        const name = component.customName.trim();
        const brand = component.customBrand.trim();
        const grams = getGramsValue(component.grams) > 0 ? ` (${getGramsValue(component.grams)}g)` : "";
        return `${brand ? `${brand} ` : ""}${name}${grams}`;
      });
    const notesPayload = [formState.notes.trim(), customFlavorNotes.length ? `自由入力フレーバー: ${customFlavorNotes.join(", ")}` : ""]
      .filter((value) => value.length > 0)
      .join("\n");

    const basePayload: SessionInsert = {
      user_id: authUserId,
      location_text: (locationPlace?.name ?? formState.location.trim()) || null,
      location_place_id: locationPlace?.placeId ?? null,
      location_name: locationPlace?.name ?? null,
      location_address: locationPlace?.formattedAddress ?? null,
      location_lat: locationPlace?.lat ?? null,
      location_lng: locationPlace?.lng ?? null,
      location_distance_km: locationPlace?.distanceKm ?? null,
      notes: notesPayload || null,
      satisfaction: formState.satisfaction,
      started_at: new Date(formState.startedAt).toISOString(),
      mix_id: null
    };

    startTransition(async () => {
      let mixIdToUse: number | null = null;

      if (mixColumnAvailable && canSubmitFlavors && customFlavorNotes.length === 0) {

        const title = `記録フレーバー ${new Date(formState.startedAt).toLocaleString("ja-JP", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}`;

        const mixPayload: MixInsert = {
          title,
          description: null,
          user_id: authUserId
        };

        const { data: mixData, error: mixError } = await supabase
          .from("mixes")
          .insert(mixPayload)
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

        const deriveRatios = () => {
          if (!useCustomRatio) {
            const equal = Math.floor(100 / components.length);
            let remainder = 100 - equal * components.length;
            return components.map(() => equal + (remainder-- > 0 ? 1 : 0));
          }

          const total = components.reduce((sum, component) => sum + getGramsValue(component.grams), 0);
          const rawRatios = components.map((component) =>
            total > 0 ? (getGramsValue(component.grams) / total) * 100 : 0
          );
          const floored = rawRatios.map((value) => Math.floor(value));
          let remainder = 100 - floored.reduce((sum, value) => sum + value, 0);
          const order = rawRatios
            .map((value, idx) => ({ idx, frac: value - Math.floor(value) }))
            .sort((a, b) => b.frac - a.frac);
          let pointer = 0;
          while (remainder > 0 && order.length > 0) {
            const target = order[pointer % order.length];
            if (target) {
              floored[target.idx] += 1;
            }
            remainder -= 1;
            pointer += 1;
          }
          return floored;
        };

        const ratios = deriveRatios();

        const componentsPayload: MixComponentInsert[] = components
          .filter((c) => c.flavorId !== "" && !isNaN(Number(c.flavorId)))
          .map((component, index) => ({
            mix_id: mixData.id,
            flavor_id: Number(component.flavorId),
            ratio_percent: ratios[index] ?? 0,
            grams: typeof component.grams === "number" ? component.grams : null,
            layer_order: index + 1
          }));

        console.log("mix_components insert payload:", componentsPayload);

        if (componentsPayload.length === 0) {
          console.error("No valid flavor components to insert");
          toast({
            title: "ミックス作成に失敗しました",
            description: "有効なフレーバーが選択されていません。",
            variant: "destructive"
          });
          return;
        }

        const { error: compError } = await supabase.from("mix_components").insert(componentsPayload);
        if (compError) {
          const errorDetail = JSON.stringify(compError, Object.getOwnPropertyNames(compError));
          console.error("insert mix components error", errorDetail, "payload", componentsPayload);
          toast({
            title: "ミックス作成に失敗しました",
            description: compError.message || "フレーバー構成の保存に失敗しました。",
            variant: "destructive"
          });
          return;
        }
      }

      const attemptInsert = async (
        payload: SessionInsert,
        allowRetry: boolean,
        allowMixColumn: boolean
      ): Promise<boolean> => {
        const insertPayload: SessionInsert =
          allowMixColumn && mixColumnAvailable ? { ...payload, mix_id: mixIdToUse ?? null } : { ...payload, mix_id: null };
        const { error } = await supabase.from("sessions").insert(insertPayload);
        if (error) {
          const errorDetail =
            error && typeof error === "object" ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);
          console.error("insert session error", errorDetail, "payload", payload);

          const missingMixColumn =
            typeof error === "object" &&
            error !== null &&
            ("message" in error ? String((error as any).message) : "").includes("mix_id");

          if (allowRetry && mixColumnAvailable && missingMixColumn) {
            setMixColumnAvailable(false);
            return attemptInsert(basePayload, false, false);
          }

          const message = (error as { message?: string; code?: string })?.message ?? "保存に失敗しました";
          toast({
            title: "記録の保存に失敗しました",
            description: message,
            variant: "destructive"
          });
          return false;
        }
        return true;
      };

      const ok = await attemptInsert(basePayload, true, mixColumnAvailable);
      if (!ok) return;

      toast({ title: "記録しました" });
      setFormState({ ...DEFAULT_FORM_STATE, startedAt: toJstDatetimeValue(new Date()) });
      setComponents(createDefaultComponents(2));
      setLocationPlace(null);
      router.push("/sessions");
    });
  };

  return (
    <Card className="mx-auto max-w-4xl border-0 shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Droplets className="h-5 w-5" /> フレーバーを記録
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {mixColumnAvailable ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">フレーバー構成</Label>
                  {useCustomRatio ? <p className="text-xs text-muted-foreground">合計: {totalGrams}g</p> : null}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddComponent} disabled={components.length >= MAX_COMPONENTS}>
                    <Plus className="h-4 w-4" /> 追加
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setComponents(createDefaultComponents(2))}>
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
                      setComponents((prev) => evenDistribution(prev));
                    }
                  }}
                  className="h-4 w-4 accent-primary"
                />
                グラム数を自分で設定する
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                {components.map((component, index) => {
                  const selectedFlavor = component.flavorId ? flavorById.get(component.flavorId) : null;
                  const isSelected = component.mode === "existing" ? !!selectedFlavor : component.customName.trim().length > 0;
                  
                  return (
                  <div 
                    key={index} 
                    className={`relative rounded-xl border p-4 space-y-4 transition-all duration-300 hover:shadow-md ${
                      isSelected 
                        ? "border-foreground/30 bg-gray-100 dark:bg-zinc-800" 
                        : "border-border bg-white dark:bg-zinc-900 hover:border-border/80"
                    }`}
                  >
                    {/* カード番号バッジ */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm transition-colors ${
                          isSelected 
                            ? "bg-foreground text-background" 
                            : "bg-muted-foreground/20 text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">フレーバー #{index + 1}</Label>
                          {isSelected && selectedFlavor && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{selectedFlavor.brand?.name ?? "ブランド未設定"}</p>
                          )}
                        </div>
                      </div>
                      {components.length > MIN_COMPONENTS ? (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveComponent(index)} 
                          aria-label="削除"
                          className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>

                    {/* 選択されたフレーバー表示エリア */}
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

                    {/* モード切替タブ */}
                    <div className="flex rounded-lg bg-muted/50 p-1">
                      <button
                        type="button"
                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          component.mode === "existing" 
                            ? "bg-background shadow-sm text-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => handleComponentChange(index, { mode: "existing" })}
                      >
                        既存から選ぶ
                      </button>
                      <button
                        type="button"
                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          component.mode === "custom" 
                            ? "bg-background shadow-sm text-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => handleComponentChange(index, { mode: "custom" })}
                      >
                        自由入力
                      </button>
                    </div>
                    {component.mode === "existing" ? (
                      <div className="space-y-2">
                        <Dialog
                          open={flavorModalIndex === index}
                          onOpenChange={(open) => {
                            setFlavorModalIndex(open ? index : null);
                            if (!open) {
                              setFlavorQuery("");
                            }
                          }}
                        >
                          <Button
                            type="button"
                            variant={selectedFlavor ? "outline" : "default"}
                            className={`w-full justify-center gap-2 h-11 ${
                              !selectedFlavor 
                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200" 
                                : "border-dashed hover:bg-muted/50"
                            }`}
                            onClick={() => {
                              setFlavorModalIndex(index);
                              setFlavorQuery("");
                            }}
                          >
                            {selectedFlavor ? (
                              <>
                                <span className="text-sm">フレーバーを変更</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                <span>フレーバーを選択</span>
                              </>
                            )}
                          </Button>
                          <DialogContent className="max-w-lg bg-white dark:bg-zinc-900">
                            <DialogHeader>
                              <DialogTitle>既存フレーバーを選択</DialogTitle>
                              <DialogDescription>ブランド名やフレーバー名で絞り込めます。</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                              <Input
                                placeholder="検索 (例: Mint, レモン)"
                                value={flavorQuery}
                                onChange={(event) => setFlavorQuery(event.target.value)}
                              />
                              <div className="max-h-80 overflow-auto rounded-md border border-border bg-white dark:bg-zinc-800">
                                {filteredFlavors.length === 0 ? (
                                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">候補が見つかりませんでした。</p>
                                ) : (
                                  <div className="divide-y divide-border">
                                    {filteredFlavors.map((flavor) => (
                                      <button
                                        key={flavor.id}
                                        type="button"
                                        className="flex w-full items-start gap-3 px-3 py-3 text-left text-sm transition hover:bg-accent/50"
                                        onClick={() => {
                                          handleComponentChange(index, {
                                            flavorId: String(flavor.id),
                                            mode: "existing",
                                            customName: "",
                                            customBrand: ""
                                          });
                                          setFlavorModalIndex(null);
                                          setFlavorQuery("");
                                        }}
                                      >
                                        {flavorImageUrls.get(flavor.id) ? (
                                          <img 
                                            src={flavorImageUrls.get(flavor.id)} 
                                            alt={flavor.name}
                                            className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0 space-y-1">
                                          <p className="font-medium truncate">{flavor.name}</p>
                                          <p className="text-xs text-muted-foreground truncate">{flavor.brand?.name ?? "ブランド未設定"}</p>
                                          {flavor.tags && flavor.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {flavor.tags.slice(0, 5).map((tag) => (
                                                <span
                                                  key={tag}
                                                  className="inline-flex items-center rounded-full bg-muted/80 dark:bg-muted px-2 py-0.5 text-[10px] text-foreground/70"
                                                >
                                                  {tag}
                                                </span>
                                              ))}
                                              {flavor.tags.length > 5 && (
                                                <span className="text-[10px] text-muted-foreground">+{flavor.tags.length - 5}</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
                    ) : (
                      <div className="space-y-3">
                        {/* 自由入力選択時の表示エリア */}
                        {component.customName.trim().length > 0 && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-zinc-800 border border-border">
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <Sparkles className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{component.customName}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {component.customBrand || "ブランド未設定"}
                              </p>
                            </div>
                          </div>
                        )}
                        <Input
                          placeholder="フレーバー名 (例: Unknown Mint)"
                          value={component.customName}
                          onChange={(event) => handleComponentChange(index, { customName: event.target.value })}
                          className="h-11"
                        />
                        {component.customName.trim().length > 0 ? (
                          <div className="rounded-lg border bg-background/90 overflow-hidden">
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
                              💡 もしかして...
                            </div>
                            {(() => {
                              const suggestions = getFlavorSuggestions(component.customName);
                              if (!suggestions.length) {
                                return <p className="px-3 py-4 text-sm text-muted-foreground text-center">候補が見つかりませんでした</p>;
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
                                          customName: "",
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
                                        {flavor.brand?.name ?? "ブランド未設定"}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                      );
                    })()}
                  </div>
                ) : null}
                <Input
                  placeholder="ブランド名 (任意: 例 Unknown Brand)"
                  value={component.customBrand}
                  onChange={(event) => handleComponentChange(index, { customBrand: event.target.value })}
                  className="border-dashed"
                />
              </div>
            )}
          </div>
        );
      })}
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startedAt">日時</Label>
              <DateTimePicker
                id="startedAt"
                value={formState.startedAt}
                onChange={(nextValue) => handleChange("startedAt", nextValue)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">場所</Label>
              <LocationPlacesCombobox
                value={locationPlace}
                onChange={(nextValue) => {
                  setLocationPlace(nextValue);
                  handleChange("location", nextValue?.name ?? "");
                }}
                placeholder="店舗名で検索"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              満足度 <span className="text-sm font-medium">{hoverSatisfaction ?? formState.satisfaction}/5</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((score) => {
                const active = (hoverSatisfaction ?? formState.satisfaction) >= score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleChange("satisfaction", score)}
                    onMouseEnter={() => {
                      setHoverSatisfaction(score);
                      handleChange("satisfaction", score);
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
            <Label htmlFor="notes">メモ</Label>
            <Textarea
              id="notes"
              placeholder="設定や感想をメモ"
              value={formState.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="sticky bottom-0 z-10 flex justify-end border-t bg-background/95 py-4 backdrop-blur">
          <Button
            type="submit"
            disabled={isPending || (mixColumnAvailable && !canSubmitFlavors)}
            className="text-white dark:bg-muted dark:text-white"
          >
            {isPending ? "保存中..." : "記録する"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
