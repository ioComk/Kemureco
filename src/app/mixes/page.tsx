import Link from "next/link";
import { Suspense } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Brand, Flavor } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MixesDashboard } from "@/components/mixes/mixes-dashboard";
import { NewMixForm } from "@/components/mixes/new-mix-form";

type FlavorOption = Flavor & { brand: Brand | null };

export const revalidate = 0;
export const runtime = "edge";

async function loadFlavors(): Promise<FlavorOption[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("flavors")
    .select("id,name,tags,image_path,brand_id,created_at,created_by,brands(id,name,jp_available)")
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
          <CardTitle>フレーバー登録</CardTitle>
          <CardDescription>フレーバーを登録し、ミックスを作成・管理できます。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/flavors">登録済みフレーバーを見る</Link>
          </Button>
        </CardContent>
      </Card>

      <div id="new-mix" className="scroll-m-20 space-y-3">
        {flavors.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>フレーバーを登録</CardTitle>
              <CardDescription>フレーバーがまだ登録されていません。</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Supabase の管理画面からフレーバーデータを登録した後、再読み込みしてください。
              </p>
            </CardContent>
          </Card>
        ) : (
          <NewMixForm flavors={flavors} />
        )}
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <MixesDashboard flavors={flavors} />
      </Suspense>
    </div>
  );
}
