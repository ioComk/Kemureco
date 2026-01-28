import type { Session } from "@/lib/types";

export type SessionFlavorInfo = {
  id: number;
  flavorId: number | null;
  flavorName: string;
  brandName?: string | null;
  imageUrl?: string | null;
  grams?: number | null;
  ratioPercent?: number | null;
  customFlavorName?: string | null;
  customBrandName?: string | null;
  layerOrder: number;
};

export type SessionItem = Session & {
  session_flavors?: SessionFlavorInfo[];
};
