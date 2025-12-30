"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import type { Database, Flavor } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Droplets, Plus, ShieldAlert, ThumbsUp, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { DateTimePicker } from "@/components/ui/date-time-picker";

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
  grams: number;
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

function evenDistribution(list: ComponentState[], totalOverride?: number): ComponentState[] {
  if (list.length === 0) return list;
  const currentTotal = list.reduce((sum, component) => sum + component.grams, 0);
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
  const [isPending, startTransition] = useTransition();
  const { user, loading: authLoading } = useAuth();

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [mixColumnAvailable, setMixColumnAvailable] = useState(true);
  const [mixes, setMixes] = useState<MixOption[]>([]);
  const [flavors, setFlavors] = useState<FlavorOption[]>([]);
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [hoverSatisfaction, setHoverSatisfaction] = useState<number | null>(null);
  const [components, setComponents] = useState<ComponentState[]>(() => createDefaultComponents(2));
  const [useCustomRatio, setUseCustomRatio] = useState(false);
  const [flavorModalIndex, setFlavorModalIndex] = useState<number | null>(null);
  const [flavorQuery, setFlavorQuery] = useState("");

  useEffect(() => {
    if (authLoading) {
      setAuthUserId(null);
      return;
    }
    const userId = user?.id ?? null;
    setAuthUserId(userId);
    if (userId) {
      void fetchMixes();
      void fetchFlavors();
    } else {
      setMixes([]);
      setFlavors([]);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    setFormState((prev) => ({ ...prev, startedAt: toJstDatetimeValue(new Date()) }));
  }, []);

  const fetchMixes = async () => {
    const { data } = await supabase.from("mixes").select("id,title").order("created_at", { ascending: false });
    setMixes(data ?? []);
  };

  const fetchFlavors = async () => {
    const { data, error } = await supabase
      .from("flavors")
      .select("id,name,brand_id,created_at,created_by,tags,image_path,brands(id,name,jp_available)")
      .order("created_at", { ascending: false })
      .limit(100);
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

  const flavorById = useMemo(() => new Map(flavors.map((flavor) => [String(flavor.id), flavor])), [flavors]);

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

  const totalGrams = components.reduce((sum, c) => sum + c.grams, 0);
  const canSubmitFlavors =
    components.length > 0 &&
    components.every((c) => (c.mode === "existing" ? c.flavorId !== "" : c.customName.trim().length > 0)) &&
    (!useCustomRatio || (totalGrams > 0 && components.every((c) => c.grams > 0))) &&
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
        const grams = component.grams > 0 ? ` (${component.grams}g)` : "";
        return `${brand ? `${brand} ` : ""}${name}${grams}`;
      });
    const notesPayload = [formState.notes.trim(), customFlavorNotes.length ? `自由入力フレーバー: ${customFlavorNotes.join(", ")}` : ""]
      .filter((value) => value.length > 0)
      .join("\n");

    const basePayload: SessionInsert = {
      user_id: authUserId,
      location_text: formState.location.trim() || null,
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

          const total = components.reduce((sum, component) => sum + component.grams, 0);
          const rawRatios = components.map((component) => (total > 0 ? (component.grams / total) * 100 : 0));
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

        const componentsPayload: MixComponentInsert[] = components.map((component, index) => ({
          mix_id: mixData.id,
          flavor_id: Number(component.flavorId),
          ratio_percent: ratios[index] ?? 0,
          layer_order: index + 1
        }));

        const { error: compError } = await supabase.from("mix_components").insert(componentsPayload);
        if (compError) {
          console.error("insert mix components error", compError);
          toast({
            title: "ミックス作成に失敗しました",
            description: "フレーバー構成の保存に失敗しました。",
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
                {components.map((component, index) => (
                  <div key={index} className="rounded-md border p-3 space-y-3 bg-muted/40">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm">フレーバー #{index + 1}</Label>
                      {components.length > MIN_COMPONENTS ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveComponent(index)} aria-label="削除">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={component.mode === "existing" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleComponentChange(index, { mode: "existing" })}
                      >
                        既存から選ぶ
                      </Button>
                      <Button
                        type="button"
                        variant={component.mode === "custom" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleComponentChange(index, { mode: "custom" })}
                      >
                        自由入力
                      </Button>
                    </div>
                    {component.mode === "existing" ? (
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
                          variant="outline"
                          className="w-full justify-between text-left"
                          onClick={() => {
                            setFlavorModalIndex(index);
                            setFlavorQuery("");
                          }}
                        >
                          <span className="truncate">
                            {component.flavorId
                              ? (() => {
                                  const selected = flavorById.get(component.flavorId);
                                  if (!selected) return "フレーバーを選択";
                                  return selected.brand?.name ? `${selected.brand.name} / ${selected.name}` : selected.name;
                                })()
                              : "フレーバーを選択"}
                          </span>
                          <span className="text-xs text-muted-foreground">変更</span>
                        </Button>
                        <DialogContent className="max-w-lg">
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
                            <div className="max-h-72 overflow-auto rounded-md border">
                              {filteredFlavors.length === 0 ? (
                                <p className="px-3 py-6 text-center text-sm text-muted-foreground">候補が見つかりませんでした。</p>
                              ) : (
                                <div className="divide-y">
                                  {filteredFlavors.map((flavor) => (
                                    <button
                                      key={flavor.id}
                                      type="button"
                                      className="flex w-full items-center justify-between px-3 py-3 text-left text-sm transition hover:bg-accent"
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
                                      <span>{flavor.name}</span>
                                      <span className="text-xs text-muted-foreground">{flavor.brand?.name ?? "ブランド未設定"}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          placeholder="フレーバー名 (例: Unknown Mint)"
                          value={component.customName}
                          onChange={(event) => handleComponentChange(index, { customName: event.target.value })}
                        />
                        {component.customName.trim().length > 0 ? (
                          <div className="rounded-md border bg-background">
                            <div className="px-3 py-2 text-xs font-medium text-muted-foreground">サジェスト</div>
                            {(() => {
                              const suggestions = getFlavorSuggestions(component.customName);
                              if (!suggestions.length) {
                                return <p className="px-3 pb-3 text-sm text-muted-foreground">候補が見つかりませんでした。</p>;
                              }
                              return (
                                <div className="max-h-40 overflow-auto">
                                  {suggestions.map((flavor) => (
                                    <button
                                      key={flavor.id}
                                      type="button"
                                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                                      onClick={() =>
                                        handleComponentChange(index, {
                                          customName: flavor.name,
                                          customBrand: flavor.brand?.name ?? ""
                                        })
                                      }
                                    >
                                      <span>{flavor.name}</span>
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
                        />
                      </div>
                    )}
                    {useCustomRatio ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">グラム数</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={component.grams}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            handleComponentChange(index, { grams: Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0 });
                          }}
                        />
                        {component.grams <= 0 ? (
                          <p className="text-xs text-destructive">0gのフレーバーは保存できません。</p>
                        ) : null}
                      </div>
                    ) : (
                      null
                    )}
                  </div>
                ))}
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
              <Input
                id="location"
                placeholder="自宅 / ラウンジ名など"
                value={formState.location}
                onChange={(event) => handleChange("location", event.target.value)}
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
                    onMouseEnter={() => setHoverSatisfaction(score)}
                    onMouseLeave={() => setHoverSatisfaction(null)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                      active ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground"
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
          <Button type="submit" disabled={isPending || (mixColumnAvailable && !canSubmitFlavors)} className="text-black">
            {isPending ? "保存中..." : "記録する"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
