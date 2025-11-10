"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FlavorWithBrand } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SortOption = "name" | "brand" | "popular";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "名前順" },
  { value: "brand", label: "ブランド順" },
  { value: "popular", label: "人気順" }
];

type FlavorsExplorerProps = {
  flavors: FlavorWithBrand[];
  initialQuery: string;
  initialTag: string;
  initialSort: string;
};

export function FlavorsExplorer({ flavors, initialQuery, initialTag, initialSort }: FlavorsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [sort, setSort] = useState<SortOption>(
    SORT_OPTIONS.some((option) => option.value === initialSort) ? (initialSort as SortOption) : "name"
  );

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveTag(initialTag);
  }, [initialTag]);

  useEffect(() => {
    if (SORT_OPTIONS.some((option) => option.value === initialSort)) {
      setSort(initialSort as SortOption);
    }
  }, [initialSort]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    flavors.forEach((flavor) => {
      flavor.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b, "ja"));
  }, [flavors]);

  const updateSearchParam = useCallback(
    (key: "q" | "tag" | "sort", value?: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (value && value.length > 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const queryString = params.toString();
      const target = (queryString ? `${pathname}?${queryString}` : pathname) as Route;
      router.replace(target, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      const normalized = query.trim();
      updateSearchParam("q", normalized || undefined);
    }, 300);

    return () => clearTimeout(handle);
  }, [query, updateSearchParam]);

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

  const filteredFlavors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedTag = activeTag.trim().toLowerCase();

    const filtered = flavors.filter((flavor) => {
      const haystack = `${flavor.name} ${flavor.brand?.name ?? ""}`.toLowerCase();
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true;
      const matchesTag = normalizedTag
        ? flavor.tags?.some((tag) => tag.toLowerCase() === normalizedTag)
        : true;
      return matchesQuery && matchesTag;
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
  }, [activeTag, flavors, query, sort]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
          <CardDescription>ブランド／タグ／名前で素早く絞り込めます。</CardDescription>
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredFlavors.map((flavor) => (
            <div key={flavor.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{flavor.brand?.name ?? "ブランド未設定"}</p>
                  <p className="text-lg font-semibold">{flavor.name}</p>
                </div>
                {flavor.brand?.jp_available ? <Badge variant="secondary">国内取扱</Badge> : null}
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
          ))}
        </div>
      )}
    </div>
  );
}
