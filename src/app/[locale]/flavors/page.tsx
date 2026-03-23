import { Suspense } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Brand, FlavorWithBrand } from "@/lib/types";
import { FlavorsExplorer } from "@/components/flavors/flavors-explorer";
import { getTranslations } from "next-intl/server";

export const revalidate = 0;
export const runtime = "edge";

async function loadFlavors(): Promise<FlavorWithBrand[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("flavors")
    .select("id,name,tags,image_path,brand_id,created_at,created_by,brands(id,name)")
    .limit(500);

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
    brand?: string;
    sort?: string;
  }>;
};

export default async function FlavorsPage({ searchParams }: PageProps) {
  const t = await getTranslations("flavorsExplorer");
  const resolvedParams = (await searchParams) ?? {};
  const [query = "", tag = "", brand = "", sort = "name"] = [
    resolvedParams.q ?? "",
    resolvedParams.tag ?? "",
    resolvedParams.brand ?? "",
    resolvedParams.sort ?? "name"
  ];
  const initialTags = tag
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const flavors = await loadFlavors();

  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">{t("loading")}</p>}>
        <FlavorsExplorer
          flavors={flavors}
          initialQuery={query}
          initialTags={initialTags}
          initialBrand={brand}
          initialSort={sort}
          totalCount={flavors.length}
        />
      </Suspense>
    </div>
  );
}
