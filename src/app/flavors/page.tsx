import { Suspense } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Brand, FlavorWithBrand } from "@/lib/types";
import { FlavorsExplorer } from "@/components/flavors/flavors-explorer";
import { Skeleton } from "@/components/ui/skeleton";

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

  const flavorsSkeleton = (
    <div className="space-y-6" aria-label="フレーバーを読み込み中" aria-busy="true">
      <div className="sticky top-16 z-40 space-y-4 border-b bg-background/95 pb-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(1,minmax(0,1fr))] sm:[grid-template-columns:repeat(4,minmax(0,1fr))]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Suspense fallback={flavorsSkeleton}>
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
