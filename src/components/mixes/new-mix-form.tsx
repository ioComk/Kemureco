"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseClient } from "@/lib/supabase";
import type { Flavor } from "@/lib/types";

type FlavorOption = Flavor & {
  brand?: { id: number; name: string } | null;
};

type ComponentState = {
  flavorId: string;
  ratio: number;
};

type NewMixFormProps = {
  flavors: FlavorOption[];
};

const DEFAULT_COMPONENTS: ComponentState[] = [
  { flavorId: "", ratio: 40 },
  { flavorId: "", ratio: 30 },
  { flavorId: "", ratio: 30 },
];

export function NewMixForm({ flavors }: NewMixFormProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [components, setComponents] = useState<ComponentState[]>(() =>
    DEFAULT_COMPONENTS.map((component) => ({ ...component })),
  );
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

  const totalRatio = components.reduce(
    (acc, component) => acc + component.ratio,
    0,
  );
  const canSubmit =
    totalRatio === 100 &&
    title.trim().length > 0 &&
    components.every(
      (component) => component.flavorId !== "" && component.ratio > 0,
    );

  const handleRatioChange = (index: number, value: number[]) => {
    const next = [...components];
    next[index] = { ...next[index], ratio: value[0] ?? 0 };
    setComponents(next);
  };

  const handleFlavorChange = (index: number, flavorId: string) => {
    const next = [...components];
    next[index] = { ...next[index], flavorId };
    setComponents(next);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setComponents(DEFAULT_COMPONENTS.map((component) => ({ ...component })));
  };

  const handleSubmit = () => {
    if (!canSubmit || isPending) return;

    startTransition(async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData?.user) {
        toast({
          title: "サインインが必要です",
          description:
            "ミックスを保存するには Supabase Auth でサインインしてください。",
          variant: "destructive",
        });
        return;
      }

      const { data: mixData, error: mixError } = await supabase
        .from("mixes")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          user_id: authData.user.id,
        })
        .select("id")
        .single();

      if (mixError || !mixData) {
        console.error(mixError);
        toast({
          title: "保存に失敗しました",
          description: "ミックスの作成中にエラーが発生しました。",
          variant: "destructive",
        });
        return;
      }

      const payload = components.map((component, index) => ({
        mix_id: mixData.id,
        flavor_id: Number(component.flavorId),
        ratio_percent: component.ratio,
        layer_order: index + 1,
      }));

      const { error: componentsError } = await supabase
        .from("mix_components")
        .insert(payload);

      if (componentsError) {
        console.error(componentsError);
        toast({
          title: "構成の保存に失敗しました",
          description: "比率を保存できませんでした。もう一度お試しください。",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "ミックスを保存しました",
        description: "マイミックス一覧に反映されます。",
      });

      resetForm();
      router.refresh();
    });
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>ミックスを作成</CardTitle>
        <CardDescription>
          タイトル、説明、フレーバーと比率を設定しましょう。
        </CardDescription>
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
          <div className="flex items-center justify-between">
            <Label className="text-base">フレーバー構成</Label>
            <span className="text-sm text-muted-foreground">
              合計: {totalRatio}%
            </span>
          </div>
          {components.map((component, index) => {
            const flavor = component.flavorId
              ? flavorMap.get(Number(component.flavorId))
              : undefined;
            return (
              <div key={index} className="space-y-3 rounded-lg border p-4">
                <div className="grid gap-4 md:grid-cols-[2fr,1fr] md:items-center">
                  <div className="space-y-2">
                    <Label>フレーバー {index + 1}</Label>
                    <Select
                      value={component.flavorId}
                      onValueChange={(value) =>
                        handleFlavorChange(index, value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="フレーバーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {flavors.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.brand?.name
                              ? `${item.brand.name} / ${item.name}`
                              : item.name}
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
                    />
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
