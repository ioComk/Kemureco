export type Brand = {
  id: number;
  name: string;
  jp_available: boolean;
};

export type Flavor = {
  id: number;
  brand_id: number;
  name: string;
  tags: string[] | null;
  created_at: string | null;
  brand?: Brand | null;
};

export type FlavorWithBrand = Flavor & { brand: Brand | null };

export type Mix = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string | null;
};

export type MixComponent = {
  mix_id: number;
  flavor_id: number;
  ratio_percent: number;
  layer_order: number;
};

export type Session = {
  id: number;
  user_id: string;
  started_at: string | null;
  location_text: string | null;
};

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: Brand;
        Insert: Omit<Brand, "id"> & { id?: number };
        Update: Partial<Omit<Brand, "id">> & { id?: number };
        Relationships: [];
      };
      flavors: {
        Row: Flavor;
        Insert: Omit<Flavor, "id" | "created_at" | "brand"> & { id?: number; created_at?: string | null };
        Update: Partial<Omit<Flavor, "id" | "brand">> & { id?: number };
        Relationships: [
          {
            foreignKeyName: "flavors_brand_id_fkey";
            columns: ["brand_id"];
            referencedRelation: "brands";
            referencedColumns: ["id"];
          }
        ];
      };
      mixes: {
        Row: Mix;
        Insert: Omit<Mix, "id" | "created_at"> & { id?: number; created_at?: string | null };
        Update: Partial<Omit<Mix, "id">> & { id?: number };
        Relationships: [];
      };
      mix_components: {
        Row: MixComponent;
        Insert: MixComponent;
        Update: Partial<MixComponent>;
        Relationships: [
          {
            foreignKeyName: "mix_components_mix_id_fkey";
            columns: ["mix_id"];
            referencedRelation: "mixes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mix_components_flavor_id_fkey";
            columns: ["flavor_id"];
            referencedRelation: "flavors";
            referencedColumns: ["id"];
          }
        ];
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, "id" | "started_at"> & { id?: number; started_at?: string | null };
        Update: Partial<Omit<Session, "id">> & { id?: number };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
