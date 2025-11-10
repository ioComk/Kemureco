import { Suspense } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Brand, FlavorWithBrand } from "@/lib/types";
import { FlavorsExplorer } from "@/components/flavors/flavors-explorer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 0;
export const runtime = "edge";

async function loadFlavors(): Promise<FlavorWithBrand[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("flavors")
    .select("id,name,tags,brand_id,created_at,brands(id,name,jp_available)")
    .limit(200);

  if (error) {
    console.error("Failed to fetch flavors", error);
    return [];
  }

  type FlavorQuery = FlavorWithBrand & { brands?: Brand | null };

  return ((data as FlavorQuery[]) ?? []).map((item) => ({
    ...item,
    brand: item.brands ?? null
  }));
}

type PageProps = {
  searchParams?: {
    q?: string;
    tag?: string;
    sort?: string;
  };
};

export default async function FlavorsPage({ searchParams }: PageProps) {
  const [query = "", tag = "", sort = "name"] = [
    searchParams?.q ?? "",
    searchParams?.tag ?? "",
    searchParams?.sort ?? "name"
  ];

  const flavors = await loadFlavors();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>フレーバーライブラリ</CardTitle>
          <CardDescription>
            ブランドやタグで絞り込んで、次のミックス候補を探しましょう。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{flavors.length}</Badge>
            <span>件のフレーバーが登録されています。</span>
            <span>検索状態はURLパラメータとして保存されます。</span>
          </div>
        </CardContent>
      </Card>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading flavors...</p>}>
        <FlavorsExplorer
          flavors={flavors}
          initialQuery={query}
          initialTag={tag}
          initialSort={sort}
        />
      </Suspense>
    </div>
  );
}
