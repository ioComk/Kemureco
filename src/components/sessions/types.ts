import type { Database, Session } from "@/lib/types";

export type MixOption = Pick<Database["public"]["Tables"]["mixes"]["Row"], "id" | "title">;

export type MixComponentInfo = {
  flavorId: number;
  flavorName: string;
  brandName?: string | null;
  ratioPercent?: number | null;
};

export type SessionItem = Session & {
  mix?: (MixOption & { components?: MixComponentInfo[] }) | null;
};
