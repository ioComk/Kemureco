"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Loader2, MapPin, X, PenLine, History } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { createSupabaseClient } from "@/lib/supabase";

type MapboxSuggestion = {
  mapbox_id: string;
  name: string;
  name_preferred?: string;
  full_address?: string;
  place_formatted?: string;
  distance?: number;
};

type PlaceSuggestion = {
  placeId: string;
  primary: string;
  secondary: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
};

export type PlaceValue = {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
};

type LocationPlacesComboboxProps = {
  value: PlaceValue | null;
  onChange: (value: PlaceValue | null) => void;
  className?: string;
  placeholder?: string;
};

const RESULT_LIMIT = 10;
const DEBOUNCE_MS = 300;

// シーシャ店に関連するPOIカテゴリ
const SHISHA_POI_CATEGORIES = [
  "bar",
  "cafe", 
  "restaurant",
  "lounge",
  "nightclub",
  "hookah_lounge",
  "smoking_lounge",
  "tea_house"
].join(",");

const toKm = (meters: number) => Math.round((meters / 1000) * 10) / 10;

// セッショントークンを生成（UUIDv4風）
const generateSessionToken = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 履歴からの場所データ型
type HistoryPlace = {
  name: string;
  placeId: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export function LocationPlacesCombobox({ value, onChange, className, placeholder = "シーシャ店を検索" }: LocationPlacesComboboxProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const apiKey = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [historyPlaces, setHistoryPlaces] = useState<HistoryPlace[]>([]);
  const [error, setError] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false); // 検索が完了したかどうか
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sessionToken, setSessionToken] = useState<string>(generateSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userClosedRef = useRef<boolean>(false);
  const historyFetchedRef = useRef<boolean>(false); // 履歴取得済みフラグ

  // 過去のセッションから場所を取得
  useEffect(() => {
    // 既に取得済みなら再取得しない
    if (historyFetchedRef.current) return;
    historyFetchedRef.current = true;

    const fetchHistoryPlaces = async () => {
      // #region agent log
      const startTime = Date.now();
      fetch('http://127.0.0.1:7242/ingest/627f6a83-0837-4204-a620-6f09c7612d3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-places-combobox.tsx:fetchHistoryPlaces:start',message:'履歴取得開始',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("sessions")
        .select("location_name, location_place_id, location_address, location_lat, location_lng")
        .eq("user_id", user.id)
        .not("location_name", "is", null)
        .order("started_at", { ascending: false });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/627f6a83-0837-4204-a620-6f09c7612d3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-places-combobox.tsx:fetchHistoryPlaces:end',message:'履歴取得完了',data:{duration:Date.now()-startTime,count:data?.length??0,hasError:!!error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (error) {
        console.error("[Supabase] 履歴取得エラー:", error);
        return;
      }

      if (data) {
        // ユニークな場所名のみ抽出（最新の記録を優先）
        const uniquePlaces = new Map<string, HistoryPlace>();
        for (const session of data) {
          if (session.location_name && !uniquePlaces.has(session.location_name)) {
            uniquePlaces.set(session.location_name, {
              name: session.location_name,
              placeId: session.location_place_id,
              address: session.location_address,
              lat: session.location_lat,
              lng: session.location_lng,
            });
          }
        }
        setHistoryPlaces(Array.from(uniquePlaces.values()));
      }
    };

    fetchHistoryPlaces();
  }, [supabase]);

  // 値が変更されたらクエリを更新
  useEffect(() => {
    if (!value) {
      setQuery("");
    } else {
      setQuery(value.name);
    }
  }, [value]);

  // 現在地取得
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        // デフォルト: 東京駅
        setCurrentLocation({ lat: 35.6812, lng: 139.7671 });
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  // Mapbox Searchbox API - Suggest
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      // #region agent log
      const startTime = Date.now();
      fetch('http://127.0.0.1:7242/ingest/627f6a83-0837-4204-a620-6f09c7612d3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-places-combobox.tsx:fetchSuggestions:start',message:'Mapbox検索開始',data:{query:searchQuery,hasApiKey:!!apiKey},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (!searchQuery.trim() || !apiKey) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const proximity = currentLocation
          ? `${currentLocation.lng},${currentLocation.lat}`
          : "139.7671,35.6812";

        // シーシャ関連のキーワードが含まれているかチェック
        const shishaKeywords = ["シーシャ", "shisha", "hookah", "水タバコ", "フッカ", "チルイン", "chilin"];
        const hasShishaKeyword = shishaKeywords.some(kw => 
          searchQuery.toLowerCase().includes(kw.toLowerCase())
        );

        const url = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
        url.searchParams.set("q", searchQuery);
        url.searchParams.set("access_token", apiKey);
        url.searchParams.set("session_token", sessionToken);
        url.searchParams.set("language", "ja");
        url.searchParams.set("country", "JP");
        url.searchParams.set("limit", String(RESULT_LIMIT));
        url.searchParams.set("proximity", proximity);
        // POIに特化（店舗のみ表示）
        url.searchParams.set("types", "poi");
        
        // シーシャ関連キーワードがない場合のみカテゴリフィルタリング
        // シーシャと入力している場合はフィルタなしで検索（店名で見つかる）
        if (!hasShishaKeyword) {
          url.searchParams.set("poi_category", SHISHA_POI_CATEGORIES);
        }

        let response = await fetch(url.toString());
        let data = await response.json();

        // カテゴリフィルタで結果が少ない場合、フィルタなしで再検索
        if (response.ok && (!data.suggestions || data.suggestions.length < 3) && !hasShishaKeyword) {
          const fallbackUrl = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
          fallbackUrl.searchParams.set("q", searchQuery);
          fallbackUrl.searchParams.set("access_token", apiKey);
          fallbackUrl.searchParams.set("session_token", sessionToken);
          fallbackUrl.searchParams.set("language", "ja");
          fallbackUrl.searchParams.set("country", "JP");
          fallbackUrl.searchParams.set("limit", String(RESULT_LIMIT));
          fallbackUrl.searchParams.set("proximity", proximity);
          fallbackUrl.searchParams.set("types", "poi");
          
          response = await fetch(fallbackUrl.toString());
          data = await response.json();
        }

        if (response.ok && data.suggestions) {
          const mapped: PlaceSuggestion[] = data.suggestions.map((s: MapboxSuggestion) => ({
            placeId: s.mapbox_id,
            primary: s.name_preferred || s.name,
            secondary: s.full_address || s.place_formatted || "",
            lat: null, // Suggest APIでは座標が返らないため、Retrieve時に取得
            lng: null,
            distanceKm: s.distance !== undefined ? toKm(s.distance) : null
          }));
          setSuggestions(mapped);
        } else {
          console.error("[Mapbox API] Suggest エラー:", data);
          setSuggestions([]);
          setError(true);
        }
      } catch (err) {
        console.error("[Mapbox API] Suggest 呼び出しエラー:", err);
        setSuggestions([]);
        setError(true);
      } finally {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/627f6a83-0837-4204-a620-6f09c7612d3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-places-combobox.tsx:fetchSuggestions:end',message:'Mapbox検索完了',data:{duration:Date.now()-startTime,query:searchQuery},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setLoading(false);
        setSearchCompleted(true);
      }
    },
    [apiKey, sessionToken, currentLocation]
  );

  // デバウンス付きサジェスト取得
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setSuggestions([]);
      setError(false);
      setSearchCompleted(false);
      return;
    }

    // 検索開始時にリセット
    setSearchCompleted(false);

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // 入力があると自動的にPopoverを開く
  useEffect(() => {
    if (query.trim() && !open && !userClosedRef.current) {
      setOpen(true);
      userClosedRef.current = false;
    }
  }, [query, open]);

  // Mapbox Searchbox API - Retrieve（詳細取得）
  const retrievePlace = useCallback(
    async (suggestion: PlaceSuggestion): Promise<PlaceValue | null> => {
      if (!apiKey) return null;

      try {
        const url = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.placeId}`);
        url.searchParams.set("access_token", apiKey);
        url.searchParams.set("session_token", sessionToken);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (response.ok && data.features && data.features.length > 0) {
          const feature = data.features[0];
          const coords = feature.geometry?.coordinates;
          const lat = coords ? coords[1] : null;
          const lng = coords ? coords[0] : null;

          let distanceKm: number | null = null;
          if (currentLocation && lat !== null && lng !== null) {
            const R = 6371;
            const dLat = ((lat - currentLocation.lat) * Math.PI) / 180;
            const dLng = ((lng - currentLocation.lng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((currentLocation.lat * Math.PI) / 180) *
                Math.cos((lat * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distanceKm = Math.round(R * c * 10) / 10;
          }

          return {
            placeId: suggestion.placeId,
            name: feature.properties.name || suggestion.primary,
            formattedAddress: feature.properties.full_address || feature.properties.place_formatted || suggestion.secondary,
            lat,
            lng,
            distanceKm
          };
        }
      } catch (err) {
        console.error("[Mapbox API] Retrieve エラー:", err);
      }

      // 取得できなかった場合は基本情報のみ返す
      return {
        placeId: suggestion.placeId,
        name: suggestion.primary,
        formattedAddress: suggestion.secondary,
        lat: null,
        lng: null,
        distanceKm: suggestion.distanceKm
      };
    },
    [apiKey, sessionToken, currentLocation]
  );

  const handleSelect = async (suggestion: PlaceSuggestion) => {
    setLoading(true);
    const place = await retrievePlace(suggestion);
    if (place) {
      onChange(place);
      setQuery(place.name);
    }
    userClosedRef.current = true;
    setOpen(false);
    setSuggestions([]);
    // 新しいセッショントークンを生成
    setSessionToken(generateSessionToken());
    setLoading(false);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    onChange(null);
    setSessionToken(generateSessionToken());
    userClosedRef.current = false;
  };

  // 手動入力で登録（Mapboxで見つからない場合）
  const handleManualInput = () => {
    if (!query.trim()) return;
    
    const manualPlace: PlaceValue = {
      placeId: `manual-${Date.now()}`,
      name: query.trim(),
      formattedAddress: "",
      lat: null,
      lng: null,
      distanceKm: null
    };
    
    onChange(manualPlace);
    userClosedRef.current = true;
    setOpen(false);
    setSuggestions([]);
    setSessionToken(generateSessionToken());
  };

  // 履歴から選択
  const handleSelectHistory = (historyPlace: HistoryPlace) => {
    const place: PlaceValue = {
      placeId: historyPlace.placeId ?? `history-${Date.now()}`,
      name: historyPlace.name,
      formattedAddress: historyPlace.address ?? "",
      lat: historyPlace.lat,
      lng: historyPlace.lng,
      distanceKm: null,
    };
    onChange(place);
    setQuery(place.name);
    userClosedRef.current = true;
    setOpen(false);
    setSuggestions([]);
    setSessionToken(generateSessionToken());
  };

  // クエリに一致する履歴の場所をフィルタリング
  const filteredHistoryPlaces = useMemo(() => {
    if (!query.trim()) return historyPlaces.slice(0, 5); // クエリがない場合は最近5件表示
    const lowerQuery = query.toLowerCase();
    return historyPlaces.filter(
      (place) => place.name.toLowerCase().includes(lowerQuery)
    );
  }, [query, historyPlaces]);

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          userClosedRef.current = true;
        } else {
          userClosedRef.current = false;
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className={cn("truncate", !query && "text-muted-foreground")}>
            {query || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {query ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleClear();
                }}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={4} avoidCollisions={false} className="w-[--radix-popover-trigger-width] p-0 max-h-[300px] overflow-y-auto bg-popover border border-border shadow-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={(value) => setQuery(value)}
            placeholder="シーシャ店名で検索..."
            autoFocus
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : !apiKey ? (
              <div className="px-3 py-6 space-y-2 text-center text-sm">
                <div className="font-medium text-destructive">
                  Mapbox APIキーが設定されていません
                </div>
                <div className="text-xs text-muted-foreground">
                  .env.local ファイルに NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN を設定し、開発サーバーを再起動してください。
                </div>
              </div>
            ) : error && !query.trim() ? (
              <div className="px-3 py-6 space-y-2 text-center text-sm">
                <div className="font-medium text-destructive">
                  Mapbox APIの呼び出しに失敗しました
                </div>
                <div className="text-xs text-muted-foreground">
                  ブラウザのコンソールでエラー詳細を確認してください。
                </div>
              </div>
            ) : (
              <>
                {/* 履歴からの候補（クエリが空、または一致するものがある場合） */}
                {filteredHistoryPlaces.length > 0 && (
                  <CommandGroup heading={<span className="flex items-center gap-1.5"><History className="h-3 w-3" />履歴</span>}>
                    {filteredHistoryPlaces.map((historyPlace) => (
                      <CommandItem
                        key={`history-${historyPlace.name}`}
                        onSelect={() => handleSelectHistory(historyPlace)}
                        value={`history-${historyPlace.name}`}
                      >
                        <div className="flex w-full items-center gap-2">
                          <div className="space-y-0.5">
                            <div className="text-sm">{historyPlace.name}</div>
                            {historyPlace.address ? (
                              <div className="text-xs text-muted-foreground line-clamp-1">{historyPlace.address}</div>
                            ) : null}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {/* ローディング中 */}
                {loading && (
                  <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                    検索中...
                  </div>
                )}
                {/* 検索完了後、結果が0件の場合（履歴もない場合のみ） */}
                {!loading && searchCompleted && suggestions.length === 0 && filteredHistoryPlaces.length === 0 && query.trim() && (
                  <div className="p-2">
                    <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                      「{query}」は見つかりませんでした
                    </div>
                  </div>
                )}
                {/* Mapbox検索結果 */}
                {suggestions.length > 0 && (
                  <CommandGroup heading={query.trim() ? "検索結果" : undefined}>
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.placeId}
                        onSelect={() => handleSelect(suggestion)}
                        value={suggestion.placeId}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-sm">
                              {suggestion.primary}
                              {suggestion.distanceKm != null ? `（${suggestion.distanceKm}km）` : ""}
                            </div>
                            {suggestion.secondary ? (
                              <div className="text-xs text-muted-foreground line-clamp-2">{suggestion.secondary}</div>
                            ) : null}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {/* 手動入力オプション（検索完了後、クエリがある場合に常に表示） */}
                {!loading && searchCompleted && query.trim() && (
                  <div className="border-t p-2">
                    <CommandItem
                      onSelect={handleManualInput}
                      value="manual-input"
                      className="cursor-pointer"
                    >
                      <div className="flex w-full items-center gap-2">
                        <PenLine className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">「{query}」で登録する</div>
                          <div className="text-xs text-muted-foreground">
                            手動入力（住所・地図連携なし）
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  </div>
                )}
                {/* 初期状態 */}
                {!loading && !searchCompleted && !query.trim() && (
                  <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                    場所名を入力してください
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Google Mapsリンク生成ユーティリティ（店名または座標でPOI検索）
export function getGoogleMapsLink(
  lat: number | null,
  lng: number | null,
  placeName?: string | null,
  address?: string | null
): string | null {
  const baseUrl = "https://www.google.com/maps/search/?api=1";
  
  // 店名がある場合は店名で検索（手動入力でもリンク生成可能）
  if (placeName) {
    const searchQuery = address
      ? `${placeName} ${address}`
      : placeName;
    return `${baseUrl}&query=${encodeURIComponent(searchQuery)}`;
  }
  
  // 座標がある場合は座標で検索
  if (lat !== null && lng !== null) {
    return `${baseUrl}&query=${lat},${lng}`;
  }
  
  // 店名も座標もない場合はリンクなし
  return null;
}
