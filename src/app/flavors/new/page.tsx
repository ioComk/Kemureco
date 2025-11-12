import { createSupabaseClient } from "@/lib/supabase";
import type { Brand } from "@/lib/types";
import { FlavorCreateForm } from "@/components/flavors/flavor-create-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 0;
export const runtime = "edge";

async function loadBrands(): Promise<Brand[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("brands").select("id,name,jp_available").order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch brands", error);
    return [];
  }

  return data ?? [];
}

export default async function NewFlavorPage() {
  const brands = await loadBrands();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>フレーバー登録</CardTitle>
          <CardDescription>既存ブランド選択または新しいブランドを追加してフレーバーを登録します。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          登録はサインイン済みユーザーのみ可能です。新しいブランドがない場合は「新規ブランドを追加」を利用してください。
        </CardContent>
      </Card>
      <FlavorCreateForm brands={brands} />
    </div>
  );
}
