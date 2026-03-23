export type Brand = {
  id: number;
  name: string;
};

export type Flavor = {
  id: number;
  brand_id: number;
  name: string;
  name_ja: string | null;
  tags: string[] | null;
  image_path: string | null;
  created_at: string | null;
  created_by: string | null;
  brand?: Brand | null;
};

export type FlavorWithBrand = Flavor & { brand: Brand | null };

export type SessionFlavor = {
  id: number;
  session_id: number;
  flavor_id: number | null;
  custom_flavor_name: string | null;
  custom_brand_name: string | null;
  ratio_percent: number | null;
  grams: number | null;
  layer_order: number;
  created_at: string | null;
};

export type Session = {
  id: number;
  user_id: string;
  started_at: string | null;
  location_text: string | null;
  location_place_id: string | null;
  location_name: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_distance_km: number | null;
  satisfaction: number | null;
  notes: string | null;
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
        Insert: Omit<Flavor, "id" | "created_at" | "brand"> & {
          id?: number;
          created_at?: string | null;
        };
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
      sessions: {
        Row: Session;
        Insert: Omit<Session, "id" | "started_at"> & {
          id?: number;
          started_at?: string | null;
        };
        Update: Partial<Omit<Session, "id">> & { id?: number };
        Relationships: [];
      };
      session_flavors: {
        Row: SessionFlavor;
        Insert: Omit<SessionFlavor, "id" | "created_at"> & {
          id?: number;
          created_at?: string | null;
        };
        Update: Partial<Omit<SessionFlavor, "id">> & { id?: number };
        Relationships: [
          {
            foreignKeyName: "session_flavors_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_flavors_flavor_id_fkey";
            columns: ["flavor_id"];
            referencedRelation: "flavors";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
