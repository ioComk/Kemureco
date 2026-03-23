import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import type { SessionFlavorInfo } from "@/components/sessions/types";

/**
 * session_flavors を sessionIds でまとめて取得し、Map<sessionId, SessionFlavorInfo[]> を返す。
 * sessions-dashboard, home-session-overview, home-sessions-calendar で共通利用。
 */
export async function fetchSessionFlavorsMap(
  supabase: SupabaseClient<Database>,
  sessionIds: number[]
): Promise<Map<number, SessionFlavorInfo[]>> {
  const map = new Map<number, SessionFlavorInfo[]>();
  if (sessionIds.length === 0) return map;

  const { data, error } = await supabase
    .from("session_flavors")
    .select("id, session_id, flavor_id, custom_flavor_name, custom_brand_name, ratio_percent, grams, layer_order, flavors(name, image_path, brands(name))")
    .in("session_id", sessionIds)
    .order("layer_order", { ascending: true });

  if (error) {
    console.warn("session_flavors fetch error", error);
    return map;
  }

  for (const sf of data ?? []) {
    const sessionId = sf.session_id;
    const flavorInfo: SessionFlavorInfo = {
      id: sf.id,
      flavorId: sf.flavor_id,
      flavorName: sf.flavors?.name ?? sf.custom_flavor_name ?? "不明なフレーバー",
      brandName: sf.flavors?.brands?.name ?? sf.custom_brand_name ?? null,
      imageUrl: sf.flavors?.image_path
        ? supabase.storage.from("flavor-images").getPublicUrl(sf.flavors.image_path).data.publicUrl
        : null,
      grams: sf.grams ?? null,
      ratioPercent: sf.ratio_percent ?? null,
      customFlavorName: sf.custom_flavor_name,
      customBrandName: sf.custom_brand_name,
      layerOrder: sf.layer_order
    };
    const existing = map.get(sessionId) ?? [];
    existing.push(flavorInfo);
    map.set(sessionId, existing);
  }

  return map;
}
