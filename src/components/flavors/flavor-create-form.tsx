"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/lib/types";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FlavorCreateFormProps = {
  brands: Brand[];
};

type FormState = {
  brandMode: "select" | "new";
  selectedBrandId: string;
  newBrandName: string;
  newBrandJpAvailable: boolean;
  flavorName: string;
  tagsInput: string;
};

const INITIAL_STATE: FormState = {
  brandMode: "select",
  selectedBrandId: "",
  newBrandName: "",
  newBrandJpAvailable: true,
  flavorName: "",
  tagsInput: ""
};

export function FlavorCreateForm({ brands }: FlavorCreateFormProps) {
  const [formState, setFormState] = useState<FormState>(() => ({
    ...INITIAL_STATE,
    selectedBrandId: brands[0] ? String(brands[0].id) : ""
  }));
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    !!formState.flavorName.trim() &&
    (formState.brandMode === "new"
      ? formState.newBrandName.trim().length > 0
      : formState.selectedBrandId.trim().length > 0);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isPending) return;

    startTransition(async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        toast({
          title: "サインインが必要です",
          description: "フレーバーを登録するにはサインインしてください。",
          variant: "destructive"
        });
        return;
      }

      let brandId: number | null = null;
      if (formState.brandMode === "new") {
        const { data, error } = await supabase
          .from("brands")
          .insert({
            name: formState.newBrandName.trim(),
            jp_available: formState.newBrandJpAvailable
          })
          .select("id")
          .single();

        if (error || !data) {
          toast({
            title: "ブランド登録に失敗しました",
            description: error?.message ?? "ブランドIDが取得できませんでした。",
            variant: "destructive"
          });
          return;
        }
        brandId = data.id;
      } else {
        brandId = Number(formState.selectedBrandId);
      }

      const tags = formState.tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error: flavorError } = await supabase.from("flavors").insert({
        name: formState.flavorName.trim(),
        brand_id: brandId,
        tags: tags.length ? tags : null
      });

      if (flavorError) {
        toast({
          title: "フレーバー登録に失敗しました",
          description: flavorError.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "フレーバーを登録しました",
        description: `${formState.flavorName.trim()} を追加しました。`
      });

      setFormState({
        ...INITIAL_STATE,
        selectedBrandId: brands[0] ? String(brands[0].id) : ""
      });
      router.refresh();
    });
  };

  return (
    <Card>
      <CardContent className="space-y-6 py-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">ブランドの選択</Label>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <Button
                  type="button"
                  size="sm"
                  variant={formState.brandMode === "select" ? "default" : "outline"}
                  onClick={() => handleChange("brandMode", "select")}
                >
                  既存ブランドから選ぶ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formState.brandMode === "new" ? "default" : "outline"}
                  onClick={() => handleChange("brandMode", "new")}
                >
                  新規ブランドを追加
                </Button>
              </div>
            </div>
            {formState.brandMode === "select" ? (
              <div className="space-y-2">
                <Label htmlFor="brand-select">ブランド</Label>
                <select
                  id="brand-select"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formState.selectedBrandId}
                  onChange={(event) => handleChange("selectedBrandId", event.target.value)}
                >
                  <option value="" disabled>
                    ブランドを選択してください
                  </option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} {brand.jp_available ? "(国内)" : "(海外)"}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4 rounded-md border p-4">
                <div className="space-y-2">
                  <Label htmlFor="new-brand-name">ブランド名</Label>
                  <Input
                    id="new-brand-name"
                    placeholder="例: Trifecta"
                    value={formState.newBrandName}
                    onChange={(event) => handleChange("newBrandName", event.target.value)}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    id="new-brand-jp"
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={formState.newBrandJpAvailable}
                    onChange={(event) => handleChange("newBrandJpAvailable", event.target.checked)}
                  />
                  <span>国内入手可</span>
                </label>
              </div>
            )}
          </div>
          <div className="h-px bg-border" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flavor-name">フレーバー名</Label>
              <Input
                id="flavor-name"
                placeholder="例: Lemon Muffin"
                value={formState.flavorName}
                onChange={(event) => handleChange("flavorName", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flavor-tags">タグ（カンマ区切り）</Label>
              <Input
                id="flavor-tags"
                placeholder="mint,dessert"
                value={formState.tagsInput}
                onChange={(event) => handleChange("tagsInput", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">例: mint,fresh,sweet</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="reset" variant="ghost" onClick={() => setFormState(INITIAL_STATE)} disabled={isPending}>
              リセット
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending ? "登録中..." : "フレーバーを登録"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
