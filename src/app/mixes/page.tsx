import Link from "next/link";
import { Suspense } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Brand, Flavor } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MixesDashboard } from "@/components/mixes/mixes-dashboard";

type FlavorOption = Flavor & { brand: Brand | null };

export const revalidate = 0;
export const runtime = "edge";

async function loadFlavors(): Promise<FlavorOption[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("flavors")
    .select("id,name,tags,brand_id,created_at,brands(id,name,jp_available)")
    .limit(100);

  if (error) {
    console.error("Failed to fetch flavors", error);
    return [];
  }

  type FlavorQuery = Flavor & { brands?: Brand | null };

  return ((data as FlavorQuery[]) ?? []).map((item) => ({
    ...item,
    brand: item.brands ?? null
  }));
}

export default async function MixesPage() {
  const flavors = await loadFlavors();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>マイミックス</CardTitle>
          <CardDescription>作成済みのミックスを一覧・編集・削除できます。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild size="sm">
            <Link href="/mixes/new">新しくミックスを作成</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/flavors">フレーバー一覧を見る</Link>
          </Button>
        </CardContent>
      </Card>
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <MixesDashboard flavors={flavors} />
      </Suspense>
    </div>
  );
}
