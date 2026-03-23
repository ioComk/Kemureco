"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Brand, Database } from "@/lib/types";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

type FlavorCreateFormProps = {
  brands: Brand[];
};

type FormState = {
  brandMode: "select" | "new";
  selectedBrandId: string;
  newBrandName: string;
  flavorName: string;
  tagsInput: string;
  imageFile: File | null;
};

const INITIAL_STATE: FormState = {
  brandMode: "select",
  selectedBrandId: "",
  newBrandName: "",
  flavorName: "",
  tagsInput: "",
  imageFile: null
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
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      if (authLoading || !user) {
        toast({
          title: "サインインが必要です",
          description: "フレーバーを登録するにはサインインしてください。",
          variant: "destructive"
        });
        return;
      }

      let brandId: number | null = null;
      if (formState.brandMode === "new") {
        const brandValues: Database["public"]["Tables"]["brands"]["Insert"] = {
          name: formState.newBrandName.trim()
        };
        const { data, error } = await supabase
          .from("brands")
          .insert(brandValues)
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

      let imagePath: string | null = null;
      if (formState.imageFile) {
        const file = formState.imageFile;
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
        const mimeByExt: Record<string, string> = {
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          webp: "image/webp"
        };
        const contentType = file.type || mimeByExt[fileExt] || "image/png";
        const normalizedName = formState.flavorName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);
        imagePath = `flavors/${normalizedName || "flavor"}-${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from("flavor-images").upload(imagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType
        });

        if (uploadError) {
          toast({
            title: "画像のアップロードに失敗しました",
            description: uploadError.message,
            variant: "destructive"
          });
          return;
        }
      }

      const { error: flavorError } = await supabase.from("flavors").insert({
        name: formState.flavorName.trim(),
        brand_id: brandId,
        tags: tags.length ? tags : null,
        image_path: imagePath,
        created_by: user.id
      });

      if (flavorError) {
        if (imagePath) {
          await supabase.storage.from("flavor-images").remove([imagePath]);
        }
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
                      {brand.name}
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
            <div className="space-y-2">
              <Label htmlFor="flavor-image">画像（任意）</Label>
              <Input
                id="flavor-image"
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    toast({
                      title: "画像サイズが大きすぎます",
                      description: "5MB以下の画像を選んでください。",
                      variant: "destructive"
                    });
                    event.currentTarget.value = "";
                    handleChange("imageFile", null);
                    return;
                  }
                  handleChange("imageFile", file);
                }}
              />
              <p className="text-xs text-muted-foreground">PNG/JPEG/WEBP、最大5MBまで。</p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="reset"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                setFormState(INITIAL_STATE);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={isPending}
            >
              リセット
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending} aria-busy={isPending} className="w-full sm:w-auto">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  登録中...
                </>
              ) : (
                "フレーバーを登録"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
