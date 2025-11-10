import { NewMixForm } from "@/components/mixes/new-mix-form";
import { createSupabaseClient } from "@/lib/supabase";
import type { Brand, Flavor } from "@/lib/types";

type FlavorWithBrand = Flavor & { brand: Brand | null };

export const revalidate = 0;

async function loadFlavors(): Promise<FlavorWithBrand[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("flavors")
    .select("id,name,tags,brand_id,created_at,brands(id,name,jp_available)")
    .limit(50);

  if (error) {
    console.error(error);
    return [];
  }

  type FlavorQuery = Flavor & { brands?: Brand | null };

  return ((data as FlavorQuery[]) ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    tags: item.tags,
    brand_id: item.brand_id,
    created_at: item.created_at,
    brand: item.brands ?? null
  }));
}

export default async function NewMixPage() {
  const flavors = await loadFlavors();

  if (flavors.length === 0) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">ミックスを作成</h1>
        <p className="text-sm text-muted-foreground">
          フレーバーがまだ登録されていません。Supabase の管理画面からフレーバーデータを登録してください。
        </p>
      </div>
    );
  }

  return <NewMixForm flavors={flavors} />;
}
