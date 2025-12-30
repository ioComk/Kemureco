"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Brand, FlavorWithBrand } from "@/lib/types";
import { createSupabaseClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LayoutGrid, List } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-provider";

type SortOption = "name" | "brand" | "popular";
type ViewMode = "grid" | "list";
type GroupOption = "none" | "brand";

const JP_QUERY_MAP: Array<{ jp: string; en: string }> = [
  { jp: "たんじあ", en: "tangiers" },
  { jp: "タンジア", en: "tangiers" },
  { jp: "とりふぇくた", en: "trifecta" },
  { jp: "トリフェクタ", en: "trifecta" },
  { jp: "ふまり", en: "fumari" },
  { jp: "フマリ", en: "fumari" },
  { jp: "あるふぁーへる", en: "al fakher" },
  { jp: "アルファーヘル", en: "al fakher" },
  { jp: "あずあ", en: "azure" },
  { jp: "アズア", en: "azure" },
  { jp: "せるべとり", en: "serbetli" },
  { jp: "セルベトリ", en: "serbetli" },
  { jp: "ふーかいん", en: "hookain" },
  { jp: "フーカイン", en: "hookain" },
  { jp: "すたーばず", en: "starbuzz" },
  { jp: "スターバズ", en: "starbuzz" },
  { jp: "あだりや", en: "adalya" },
  { jp: "アダリヤ", en: "adalya" },
  { jp: "あぐりー", en: "ugly" },
  { jp: "アグリー", en: "ugly" },
  { jp: "くっきーず", en: "cookies" },
  { jp: "クッキーズ", en: "cookies" },
  { jp: "えたーなるすもーく", en: "eternal smoke" },
  { jp: "エターナルスモーク", en: "eternal smoke" },
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

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "名前順" },
  { value: "brand", label: "ブランド順" },
  { value: "popular", label: "人気順" }
];

type FlavorsExplorerProps = {
  flavors: FlavorWithBrand[];
  initialQuery: string;
  initialTag: string;
  initialBrand: string;
  initialSort: string;
  totalCount: number;
};

export function FlavorsExplorer({
  flavors,
  initialQuery,
  initialTag,
  initialBrand,
  initialSort,
  totalCount
}: FlavorsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [, startTransition] = useTransition();

  const [items, setItems] = useState<FlavorWithBrand[]>(flavors);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [activeBrand, setActiveBrand] = useState(initialBrand);
  const [sort, setSort] = useState<SortOption>(
    SORT_OPTIONS.some((option) => option.value === initialSort) ? (initialSort as SortOption) : "name"
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [group, setGroup] = useState<GroupOption>("none");
  const [userId, setUserId] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editFlavor, setEditFlavor] = useState<FlavorWithBrand | null>(null);
  const [editForm, setEditForm] = useState({ name: "", brandId: "", tags: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [previewFlavor, setPreviewFlavor] = useState<FlavorWithBrand | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveTag(initialTag);
  }, [initialTag]);

  useEffect(() => {
    setActiveBrand(initialBrand);
  }, [initialBrand]);

  useEffect(() => {
    if (SORT_OPTIONS.some((option) => option.value === initialSort)) {
      setSort(initialSort as SortOption);
    }
  }, [initialSort]);

  useEffect(() => {
    setItems(flavors);
  }, [flavors]);

  useEffect(() => {
    if (authLoading) {
      setUserId(null);
      return;
    }
    setUserId(user?.id ?? null);
  }, [authLoading, user?.id]);

  const isAdmin = user?.app_metadata?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    if (brands.length > 0) return;
    const fetchBrands = async () => {
      const { data, error } = await supabase.from("brands").select("id,name,jp_available").order("name");
      if (error) {
        console.warn("brands fetch failed", error);
        return;
      }
      setBrands((data as Brand[]) ?? []);
    };
    void fetchBrands();
  }, [brands.length, isAdmin, supabase]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((flavor) => {
      flavor.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b, "ja"));
  }, [items]);

  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    items.forEach((flavor) => {
      if (flavor.brand?.name) {
        brandsSet.add(flavor.brand.name);
      }
    });
    return Array.from(brandsSet).sort((a, b) => a.localeCompare(b, "ja"));
  }, [items]);

  const updateSearchParam = useCallback(
    (key: "q" | "tag" | "brand" | "sort", value?: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (value && value.length > 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const queryString = params.toString();
      const target = (queryString ? `${pathname}?${queryString}` : pathname) as Route;
      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition]
  );

  useEffect(() => {
    if (isComposing) return;
    const handle = setTimeout(() => {
      const normalized = deferredQuery.trim();
      updateSearchParam("q", normalized || undefined);
    }, 300);

    return () => clearTimeout(handle);
  }, [deferredQuery, isComposing, updateSearchParam]);

  const handleSortChange = (value: string) => {
    const next = SORT_OPTIONS.some((option) => option.value === value) ? (value as SortOption) : "name";
    setSort(next);
    updateSearchParam("sort", next === "name" ? undefined : next);
  };

  const handleTagToggle = (tag: string) => {
    const nextTag = activeTag === tag ? "" : tag;
    setActiveTag(nextTag);
    updateSearchParam("tag", nextTag || undefined);
  };

  const handleBrandToggle = (brand: string) => {
    const nextBrand = activeBrand === brand ? "" : brand;
    setActiveBrand(nextBrand);
    updateSearchParam("brand", nextBrand || undefined);
  };

  const imageUrls = useMemo(() => {
    const map = new Map<number, string>();
    items.forEach((flavor) => {
      if (!flavor.image_path) return;
      const { data } = supabase.storage.from("flavor-images").getPublicUrl(flavor.image_path);
      if (data.publicUrl) {
        map.set(flavor.id, data.publicUrl);
      }
    });
    return map;
  }, [items, supabase]);

  const filteredFlavors = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const normalizedTag = activeTag.trim().toLowerCase();
    const normalizedBrand = activeBrand.trim().toLowerCase();
    const queryTokens = new Set([normalizedQuery]);
    JP_QUERY_MAP.forEach(({ jp, en }) => {
      if (normalizedQuery && normalizedQuery.includes(jp)) {
        queryTokens.add(en);
      }
    });
    const tokens = Array.from(queryTokens).filter((token) => token.length > 0);

    const filtered = items.filter((flavor) => {
      const haystack = [flavor.name, flavor.brand?.name ?? "", ...(flavor.tags ?? [])].join(" ").toLowerCase();
      const matchesQuery = tokens.length > 0 ? tokens.some((token) => haystack.includes(token)) : true;
      const matchesTag = normalizedTag
        ? flavor.tags?.some((tag) => tag.toLowerCase() === normalizedTag)
        : true;
      const matchesBrand = normalizedBrand
        ? flavor.brand?.name?.toLowerCase() === normalizedBrand
        : true;
      return matchesQuery && matchesTag && matchesBrand;
    });

    const scoreByPopularity = (flavor: FlavorWithBrand) => {
      const base = flavor.brand?.jp_available ? 10 : 0;
      const tagScore = flavor.tags?.length ?? 0;
      const freshness = flavor.created_at ? new Date(flavor.created_at).getTime() / 1_000_000_000 : 0;
      return base + tagScore + freshness;
    };

    return [...filtered].sort((a, b) => {
      if (sort === "brand") {
        const brandComparison = (a.brand?.name ?? "").localeCompare(b.brand?.name ?? "", "ja");
        if (brandComparison !== 0) return brandComparison;
      }

      if (sort === "popular") {
        const diff = scoreByPopularity(b) - scoreByPopularity(a);
        if (diff !== 0) return diff;
      }

      return a.name.localeCompare(b.name, "ja");
    });
  }, [activeBrand, activeTag, items, query, sort]);

  const groupedFlavors = useMemo(() => {
    if (group !== "brand") return [];
    const grouped = new Map<string, FlavorWithBrand[]>();
    filteredFlavors.forEach((flavor) => {
      const key = flavor.brand?.name ?? "ブランド未設定";
      const list = grouped.get(key);
      if (list) {
        list.push(flavor);
      } else {
        grouped.set(key, [flavor]);
      }
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b, "ja"));
  }, [filteredFlavors, group]);

  const canDeleteFlavor = (flavor: FlavorWithBrand) =>
    (!!userId && flavor.created_by === userId) || (isAdmin && !flavor.created_by);
  const canEditFlavor = (flavor: FlavorWithBrand) => isAdmin && !flavor.created_by;

  const handleDeleteFlavor = async (flavor: FlavorWithBrand) => {
    if (!canDeleteFlavor(flavor)) return;
    const confirmed = window.confirm(`${flavor.name} を削除しますか？`);
    if (!confirmed) return;
    const { error } = await supabase.from("flavors").delete().eq("id", flavor.id);
    if (error) {
      toast({
        title: "削除に失敗しました",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== flavor.id));
    toast({ title: "フレーバーを削除しました" });
  };

  const handleOpenEdit = (flavor: FlavorWithBrand) => {
    if (!canEditFlavor(flavor)) return;
    setEditFlavor(flavor);
    setEditForm({
      name: flavor.name ?? "",
      brandId: flavor.brand_id ? String(flavor.brand_id) : "",
      tags: flavor.tags?.join(", ") ?? ""
    });
    setEditOpen(true);
  };

  const handleEditChange = <K extends keyof typeof editForm>(key: K, value: (typeof editForm)[K]) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdateFlavor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editFlavor || !canEditFlavor(editFlavor)) return;
    if (isSaving) return;

    const name = editForm.name.trim();
    const brandId = Number(editForm.brandId);
    if (!name || !Number.isFinite(brandId)) {
      toast({
        title: "入力を確認してください",
        description: "フレーバー名とブランドを入力してください。",
        variant: "destructive"
      });
      return;
    }

    const tags = editForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    setIsSaving(true);
    const { error } = await supabase
      .from("flavors")
      .update({
        name,
        brand_id: brandId,
        tags: tags.length ? tags : null
      })
      .eq("id", editFlavor.id);
    setIsSaving(false);

    if (error) {
      toast({
        title: "更新に失敗しました",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    const nextBrand = brands.find((brand) => brand.id === brandId) ?? editFlavor.brand ?? null;
    setItems((prev) =>
      prev.map((item) =>
        item.id === editFlavor.id
          ? { ...item, name, brand_id: brandId, tags: tags.length ? tags : null, brand: nextBrand }
          : item
      )
    );
    toast({ title: "フレーバーを更新しました" });
    setEditOpen(false);
  };

  const renderFlavorGridCard = (flavor: FlavorWithBrand) => {
    const imageUrl = imageUrls.get(flavor.id);
    return (
      <div
        key={flavor.id}
        className="space-y-3 rounded-lg border p-4 transition hover:border-primary/40 hover:shadow-sm"
        role="button"
        tabIndex={0}
        onClick={() => setPreviewFlavor(flavor)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setPreviewFlavor(flavor);
          }
        }}
      >
        {imageUrl ? (
          <div className="flex h-40 items-center justify-center overflow-hidden rounded-md bg-muted/10">
            <img
              src={imageUrl}
              alt={`${flavor.name} の画像`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-md bg-muted/30 text-xs text-muted-foreground">
            画像なし
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{flavor.brand?.name ?? "ブランド未設定"}</p>
            <p className="text-lg font-semibold">{flavor.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {canEditFlavor(flavor) ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenEdit(flavor);
                }}
              >
                編集
              </Button>
            ) : null}
            {canDeleteFlavor(flavor) ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteFlavor(flavor);
                }}
              >
                削除
              </Button>
            ) : null}
          </div>
        </div>
        {flavor.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {flavor.tags.map((tag) => (
              <Badge key={`${flavor.id}-${tag}`} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">タグ情報はまだありません。</p>
        )}
      </div>
    );
  };

  const renderFlavorListCard = (flavor: FlavorWithBrand) => {
    const imageUrl = imageUrls.get(flavor.id);
    return (
      <div
        key={flavor.id}
        className="flex flex-col gap-4 rounded-lg border p-4 transition hover:border-primary/40 hover:shadow-sm md:flex-row"
        role="button"
        tabIndex={0}
        onClick={() => setPreviewFlavor(flavor)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setPreviewFlavor(flavor);
          }
        }}
      >
        {imageUrl ? (
          <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-md bg-muted/10 md:w-40">
            <img
              src={imageUrl}
              alt={`${flavor.name} の画像`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-28 w-full items-center justify-center rounded-md bg-muted/30 text-xs text-muted-foreground md:w-40">
            画像なし
          </div>
        )}
        <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{flavor.brand?.name ?? "ブランド未設定"}</p>
            <p className="text-lg font-semibold">{flavor.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {canEditFlavor(flavor) ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenEdit(flavor);
                }}
              >
                編集
              </Button>
            ) : null}
            {canDeleteFlavor(flavor) ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteFlavor(flavor);
                }}
              >
                削除
              </Button>
            ) : null}
          </div>
        </div>
          {flavor.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {flavor.tags.map((tag) => (
                <Badge key={`${flavor.id}-${tag}`} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">タグ情報はまだありません。</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="space-y-1">
              <CardTitle>フレーバーライブラリ</CardTitle>
              <CardDescription>ブランドやタグで絞り込んで、次のミックス候補を探しましょう。</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{totalCount}</Badge>
              <span>件のフレーバーが登録されています。</span>
              <span>検索状態はURLパラメータとして保存されます。</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="表示切り替え">
            <Button
              type="button"
              size="icon"
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">グリッド</span>
              </Button>
              <Button
                type="button"
                size="icon"
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
              >
                <List className="h-4 w-4" />
                <span className="sr-only">リスト</span>
              </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="flavor-search">フレーバー名またはブランド名</Label>
              <Input
                id="flavor-search"
                placeholder="例: ミント / Trifecta"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(event) => {
                  setIsComposing(false);
                  setQuery(event.currentTarget.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flavor-sort">並び替え</Label>
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger id="flavor-sort">
                  <SelectValue placeholder="並び替えを選択" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Group by</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={group === "none" ? "default" : "outline"}
                onClick={() => setGroup("none")}
              >
                None
              </Button>
              <Button
                type="button"
                size="sm"
                variant={group === "brand" ? "default" : "outline"}
                onClick={() => setGroup("brand")}
              >
                Brand
              </Button>
            </div>
          </div>
          {availableBrands.length ? (
            <div className="space-y-2">
              <Label>メーカーで絞り込み</Label>
              <div className="flex flex-wrap gap-2">
                {availableBrands.map((brand) => (
                  <Button
                    key={brand}
                    type="button"
                    size="sm"
                    variant={activeBrand === brand ? "default" : "outline"}
                    onClick={() => handleBrandToggle(brand)}
                  >
                    {brand}
                  </Button>
                ))}
                {activeBrand ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => handleBrandToggle("")}>
                    クリア
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
          {availableTags.length ? (
            <div className="space-y-2">
              <Label>タグで絞り込み</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    size="sm"
                    variant={activeTag === tag ? "default" : "outline"}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Button>
                ))}
                {activeTag ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => handleTagToggle("")}>
                    クリア
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {filteredFlavors.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            条件に一致するフレーバーが見つかりませんでした。検索条件を調整してください。
          </CardContent>
        </Card>
      ) : group === "brand" ? (
        <div className="space-y-8">
          {groupedFlavors.map(([brandName, brandFlavors]) => (
            <div key={brandName} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{brandName}</h3>
                <Badge variant="secondary">{brandFlavors.length}</Badge>
              </div>
              {viewMode === "grid" ? (
                <div className="grid gap-4 [grid-template-columns:repeat(1,minmax(0,1fr))] sm:[grid-template-columns:repeat(4,minmax(0,1fr))]">
                  {brandFlavors.map((flavor) => renderFlavorGridCard(flavor))}
                </div>
              ) : (
                <div className="space-y-4">
                  {brandFlavors.map((flavor) => renderFlavorListCard(flavor))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 [grid-template-columns:repeat(1,minmax(0,1fr))] sm:[grid-template-columns:repeat(4,minmax(0,1fr))]">
          {filteredFlavors.map((flavor) => renderFlavorGridCard(flavor))}
        </div>
      ) : (
        <div className="space-y-4">{filteredFlavors.map((flavor) => renderFlavorListCard(flavor))}</div>
      )}

      <Dialog open={Boolean(previewFlavor)} onOpenChange={(open) => (open ? null : setPreviewFlavor(null))}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{previewFlavor?.name ?? ""}</DialogTitle>
            <DialogDescription>{previewFlavor?.brand?.name ?? "ブランド未設定"}</DialogDescription>
          </DialogHeader>
          {previewFlavor?.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {previewFlavor.tags.map((tag) => (
                <Badge key={`preview-${previewFlavor.id}-${tag}`} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">タグ情報はまだありません。</p>
          )}
          {previewFlavor ? (
            imageUrls.get(previewFlavor.id) ? (
              <div className="flex items-center justify-center rounded-lg bg-muted/10 p-4">
                <img
                  src={imageUrls.get(previewFlavor.id)}
                  alt={`${previewFlavor.name} の画像`}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
                画像なし
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フレーバーを編集</DialogTitle>
            <DialogDescription>既存フレーバーの名称やブランド、タグを更新します。</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateFlavor}>
            <div className="space-y-2">
              <Label htmlFor="edit-flavor-name">フレーバー名</Label>
              <Input
                id="edit-flavor-name"
                value={editForm.name}
                onChange={(event) => handleEditChange("name", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-flavor-brand">ブランド</Label>
              <select
                id="edit-flavor-brand"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editForm.brandId}
                onChange={(event) => handleEditChange("brandId", event.target.value)}
                required
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
            <div className="space-y-2">
              <Label htmlFor="edit-flavor-tags">タグ</Label>
              <Input
                id="edit-flavor-tags"
                value={editForm.tags}
                onChange={(event) => handleEditChange("tags", event.target.value)}
                placeholder="例: フルーツ, ミント"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={isSaving}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "更新中..." : "更新する"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
