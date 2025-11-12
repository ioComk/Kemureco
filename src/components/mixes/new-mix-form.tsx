"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import type { Database, Flavor } from "@/lib/types";
import { createSupabaseClient } from "@/lib/supabase";

type FlavorOption = Flavor & {
  brand?: { id: number; name: string } | null;
};

type MixInsert = Database["public"]["Tables"]["mixes"]["Insert"];
type MixComponentInsert = Database["public"]["Tables"]["mix_components"]["Insert"];

type ComponentState = {
  flavorId: string;
  ratio: number;
};

type NewMixFormProps = {
  flavors: FlavorOption[];
};

const MIN_COMPONENTS = 1;
const MAX_COMPONENTS = 3;

function createDefaultComponents(count: number): ComponentState[] {
  if (count <= 0) return [];
  const equal = Math.floor(100 / count);
  let remainder = 100 - equal * count;
  return Array.from({ length: count }, (_, index) => ({
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
  return list.map((component, index) => ({
    ...component,
    ratio: equal + (remainder-- > 0 ? 1 : 0)
  }));
}

export function NewMixForm({ flavors }: NewMixFormProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [components, setComponents] = useState<ComponentState[]>(() => createDefaultComponents(2));
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const flavorMap = useMemo(() => {
    const map = new Map<number, FlavorOption>();
    flavors.forEach((flavor) => {
      map.set(flavor.id, flavor);
    });
    return map;
  }, [flavors]);

  const totalRatio = components.reduce((acc, component) => acc + component.ratio, 0);
  const canSubmit =
    totalRatio === 100 &&
    title.trim().length > 0 &&
    components.every((component) => component.flavorId !== "" && component.ratio > 0);

  const handleRatioChange = (index: number, value: number[]) => {
    setComponents((prev) => redistributeRatios(prev, index, value[0] ?? 0));
  };

  const handleFlavorChange = (index: number, flavorId: string) => {
    const next = [...components];
    next[index] = { ...next[index], flavorId };
    setComponents(next);
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
      const next = prev.filter((_, idx) => idx !== index);
      return evenDistribution(next);
    });
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setComponents(createDefaultComponents(2));
  };

  const handleSubmit = () => {
    if (!canSubmit || isPending) return;

    startTransition(async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user) {
        toast({
          title: "サインインが必要です",
          description: "ミックスを保存するには Supabase Auth でサインインしてください。",
          variant: "destructive"
        });
        return;
      }

      const trimmedDescription = description.trim();
      const mixPayload: MixInsert = {
        title: title.trim(),
        description: trimmedDescription ? trimmedDescription : null,
        user_id: authData.user.id
      };

      const { data: mixData, error: mixError } = await supabase
        .from("mixes")
        .insert(mixPayload)
        .select("id")
        .single();

      if (mixError || !mixData) {
        console.error(mixError);
        toast({
          title: "保存に失敗しました",
          description: "ミックスの作成中にエラーが発生しました。",
          variant: "destructive"
        });
        return;
      }

      const payload: MixComponentInsert[] = components.map((component, index) => ({
        mix_id: mixData.id,
        flavor_id: Number(component.flavorId),
        ratio_percent: component.ratio,
        layer_order: index + 1
      }));

      const { error: componentsError } = await supabase.from("mix_components").insert(payload);

      if (componentsError) {
        console.error(componentsError);
        toast({
          title: "構成の保存に失敗しました",
          description: "比率を保存できませんでした。もう一度お試しください。",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "ミックスを保存しました",
        description: "マイミックス一覧に反映されます。"
      });

      resetForm();
      router.refresh();
    });
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>ミックスを作成</CardTitle>
        <CardDescription>タイトル、説明、フレーバーと比率を設定しましょう。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={title}
            placeholder="冬のチョコミント"
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            value={description}
            placeholder="味やセッティングのポイントをメモしましょう"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-base">フレーバー構成</Label>
              <p className="text-xs text-muted-foreground">合計: {totalRatio}%</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddComponent}
                disabled={components.length >= MAX_COMPONENTS}
              >
                フレーバー追加
              </Button>
            </div>
          </div>
          {components.map((component, index) => {
            const flavor = component.flavorId ? flavorMap.get(Number(component.flavorId)) : undefined;
            const disableSlider = components.length === 1;
            return (
              <div key={index} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">フレーバー {index + 1}</p>
                  {components.length > MIN_COMPONENTS ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveComponent(index)}
                    >
                      削除
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-[2fr,1fr] md:items-center">
                  <div className="space-y-2">
                    <Select
                      value={component.flavorId}
                      onValueChange={(value) => handleFlavorChange(index, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="フレーバーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {flavors.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.brand?.name ? `${item.brand.name} / ${item.name}` : item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {flavor?.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {flavor.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>比率 {component.ratio}%</Label>
                    <Slider
                      value={[component.ratio]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => handleRatioChange(index, value)}
                      disabled={disableSlider}
                    />
                    {disableSlider ? (
                      <p className="text-xs text-muted-foreground">単一フレーバーは常に100%になります。</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-sm text-muted-foreground">
            比率の合計が100%になるまで保存ボタンは有効になりません。
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
          {isPending ? "保存中..." : "ミックスを保存"}
        </Button>
      </CardFooter>
    </Card>
  );
}
