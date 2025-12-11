"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import type { Database, Flavor } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Droplets, Plus, ShieldAlert, ThumbsUp, Trash2 } from "lucide-react";

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
  ratio: number;
};

type MixInsert = Database["public"]["Tables"]["mixes"]["Insert"];

type MixComponentInsert = Database["public"]["Tables"]["mix_components"]["Insert"];

type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];

const DEFAULT_FORM_STATE: FormState = {
  startedAt: new Date().toISOString().slice(0, 16),
  location: "",
  satisfaction: 3,
  notes: ""
};

const MIN_COMPONENTS = 1;
const MAX_COMPONENTS = 3;

function createDefaultComponents(count: number): ComponentState[] {
  if (count <= 0) return [];
  const equal = Math.floor(100 / count);
  let remainder = 100 - equal * count;
  return Array.from({ length: count }, () => ({
    flavorId: "",
    ratio: equal + (remainder-- > 0 ? 1 : 0)
  }));
}

function redistributeRatios(prev: ComponentState[], targetIndex: number, rawValue: number): ComponentState[] {
  if (prev.length === 0) return prev;
  const clampedValue = Math.min(100, Math.max(0, Math.round(rawValue)));
  const next = prev.map((component, idx) =>
    idx === targetIndex ? { ...component, ratio: clampedValue } : { ...component }
  );

  if (next.length === 1) {
    next[0].ratio = 100;
    return next;
  }

  const otherIndices = next.map((_, idx) => idx).filter((idx) => idx !== targetIndex);
  let remaining = Math.max(0, 100 - clampedValue);
  const prevOthersTotal = otherIndices.reduce((sum, idx) => sum + prev[idx].ratio, 0);

  let distributed = 0;
  otherIndices.forEach((idx) => {
    let newRatio: number;
    if (prevOthersTotal === 0) {
      newRatio = Math.floor(remaining / otherIndices.length);
    } else {
      newRatio = Math.max(0, Math.round((prev[idx].ratio / prevOthersTotal) * remaining));
    }
    next[idx].ratio = newRatio;
    distributed += newRatio;
  });

  let diff = remaining - distributed;
  let adjustPointer = 0;
  while (diff !== 0 && otherIndices.length > 0) {
    const idx = otherIndices[adjustPointer % otherIndices.length];
    const proposed = next[idx].ratio + Math.sign(diff);
    if (proposed >= 0) {
      next[idx].ratio = proposed;
      diff -= Math.sign(diff);
    }
    adjustPointer++;
  }

  const total = next.reduce((sum, component) => sum + component.ratio, 0);
  if (total !== 100 && next.length > 0) {
    next[next.length - 1].ratio = Math.max(0, next[next.length - 1].ratio + (100 - total));
  }

  return next;
}

function evenDistribution(list: ComponentState[]): ComponentState[] {
  if (list.length === 0) return list;
  const equal = Math.floor(100 / list.length);
  let remainder = 100 - equal * list.length;
  return list.map((component) => ({
    ...component,
    ratio: equal + (remainder-- > 0 ? 1 : 0)
  }));
}

export function SessionForm() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [mixColumnAvailable, setMixColumnAvailable] = useState(true);
  const [mixes, setMixes] = useState<MixOption[]>([]);
  const [flavors, setFlavors] = useState<FlavorOption[]>([]);
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [components, setComponents] = useState<ComponentState[]>(() => createDefaultComponents(2));

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const userId = data.user?.id ?? null;
        setAuthUserId(userId);
        if (userId) {
          void fetchMixes();
          void fetchFlavors();
        }
      })
      .catch(() => {
        if (!mounted) return;
        setAuthUserId(null);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      setAuthUserId(userId);
      if (userId) {
        void fetchMixes();
        void fetchFlavors();
      } else {
        setMixes([]);
        setFlavors([]);
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

  const fetchFlavors = async () => {
    const { data, error } = await supabase
      .from("flavors")
      .select("id,name,brand_id,created_at,tags,brands(id,name,jp_available)")
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

  const handleAddComponent = () => {
    setComponents((prev) => {
      if (prev.length >= MAX_COMPONENTS) return prev;
      const next = [...prev, { flavorId: "", ratio: 0 }];
      return evenDistribution(next);
    });
  };

  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => {
      if (prev.length <= MIN_COMPONENTS) return prev;
      const next = prev.filter((_, i) => i !== index);
      return evenDistribution(next);
    });
  };

  const totalRatio = components.reduce((sum, c) => sum + c.ratio, 0);
  const canSubmitFlavors =
    components.length > 0 &&
    totalRatio === 100 &&
    components.every((c) => c.flavorId !== "" && c.ratio > 0) &&
    !!authUserId;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUserId) {
      toast({ title: "サインインが必要です", description: "記録には Supabase Auth へのサインインが必要です。", variant: "destructive" });
      return;
    }

    const basePayload: SessionInsert = {
      user_id: authUserId,
      location_text: formState.location.trim() || null,
      notes: formState.notes.trim() || null,
      satisfaction: formState.satisfaction,
      started_at: new Date(formState.startedAt).toISOString(),
      mix_id: null
    };

    startTransition(async () => {
      let mixIdToUse: number | null = null;

      if (mixColumnAvailable && canSubmitFlavors) {
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

        const componentsPayload: MixComponentInsert[] = components.map((component, index) => ({
          mix_id: mixData.id,
          flavor_id: Number(component.flavorId),
          ratio_percent: component.ratio,
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
      setFormState({ ...DEFAULT_FORM_STATE, startedAt: new Date().toISOString().slice(0, 16) });
      setComponents(createDefaultComponents(2));
      router.push("/sessions");
    });
  };

  return (
    <Card className="max-w-4xl">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Droplets className="h-5 w-5" /> フレーバーを記録
        </CardTitle>
        <CardDescription>フレーバー構成と時間・満足度・場所・メモを入力して保存します。</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {mixColumnAvailable ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">フレーバー構成</Label>
                  <p className="text-xs text-muted-foreground">合計: {totalRatio}%</p>
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
              <div className="grid gap-4 md:grid-cols-2">
                {components.map((component, index) => (
                  <div key={index} className="rounded-md border p-3 space-y-3 bg-muted/40">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm">フレーバー #{index + 1}</Label>
                      {components.length > MIN_COMPONENTS ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveComponent(index)}>
                          <Trash2 className="h-4 w-4" /> 削除
                        </Button>
                      ) : null}
                    </div>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={component.flavorId}
                      onChange={(event) => handleComponentChange(index, { flavorId: event.target.value })}
                    >
                      <option value="">フレーバーを選択</option>
                      {flavors.map((flavor) => (
                        <option key={flavor.id} value={flavor.id}>
                          {flavor.brand?.name ? `${flavor.brand.name} / ${flavor.name}` : flavor.name}
                        </option>
                      ))}
                    </select>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">比率 {component.ratio}%</Label>
                      <Slider
                        value={[component.ratio]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => setComponents((prev) => redistributeRatios(prev, index, value[0] ?? 0))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              満足度 <span className="text-sm font-medium">{formState.satisfaction}/5</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((score) => {
                const active = formState.satisfaction >= score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleChange("satisfaction", score)}
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
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isPending || (mixColumnAvailable && !canSubmitFlavors)}>
            {isPending ? "保存中..." : "記録する"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
