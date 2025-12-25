import { Suspense } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Brand, FlavorWithBrand } from "@/lib/types";
import { FlavorsExplorer } from "@/components/flavors/flavors-explorer";

export const revalidate = 0;
export const runtime = "edge";

async function loadFlavors(): Promise<FlavorWithBrand[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("flavors")
    .select("id,name,tags,image_path,brand_id,created_at,created_by,brands(id,name,jp_available)")
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
  searchParams?: Promise<{
    q?: string;
    tag?: string;
    sort?: string;
  }>;
};

export default async function FlavorsPage({ searchParams }: PageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const [query = "", tag = "", sort = "name"] = [
    resolvedParams.q ?? "",
    resolvedParams.tag ?? "",
    resolvedParams.sort ?? "name"
  ];

  const flavors = await loadFlavors();

  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading flavors...</p>}>
        <FlavorsExplorer
          flavors={flavors}
          initialQuery={query}
          initialTag={tag}
          initialSort={sort}
          totalCount={flavors.length}
        />
      </Suspense>
    </div>
  );
}
