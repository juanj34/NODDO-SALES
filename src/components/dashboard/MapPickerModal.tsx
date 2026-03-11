"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, MapPin, Check, Search, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n";

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

interface GeocodingResult {
  place_name: string;
  center: [number, number]; // [lng, lat]
}

// Inject mapbox CSS via <link> tag — bundler CSS imports can fail silently
const MAPBOX_CSS_ID = "mapbox-gl-css-link";
function ensureMapboxCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById(MAPBOX_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = MAPBOX_CSS_ID;
  link.rel = "stylesheet";
  link.href =
    "https://api.mapbox.com/mapbox-gl-js/v3.9.6/mapbox-gl.css";
  document.head.appendChild(link);
}

function createPickerMarkerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = "position:relative;width:40px;height:40px;cursor:pointer;";
  // Outer pulse ring
  const ring = document.createElement("div");
  ring.style.cssText =
    "position:absolute;inset:-8px;border-radius:50%;border:2.5px solid rgba(0,112,243,0.4);animation:picker-pulse 2s ease-out infinite;";
  el.appendChild(ring);
  // Inner dot
  const dot = document.createElement("div");
  dot.style.cssText =
    "width:40px;height:40px;background:#0070F3;border-radius:50%;border:3.5px solid white;box-shadow:0 0 0 5px rgba(0,112,243,0.3),0 4px 12px rgba(0,0,0,0.6);";
  el.appendChild(dot);
  return el;
}

export function MapPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialLat,
  initialLng,
}: MapPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [selectedLat, setSelectedLat] = useState<number | null>(initialLat ?? null);
  const [selectedLng, setSelectedLng] = useState<number | null>(initialLng ?? null);
  const [address, setAddress] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const { t, locale } = useTranslation("editor");

  // Refs for callbacks — set once inside init, used by search & click
  const reverseGeocodeRef = useRef<(lat: number, lng: number) => void>(() => {});
  const placeMarkerRef = useRef<(lng: number, lat: number) => void>(() => {});

  reverseGeocodeRef.current = useCallback(
    async (lat: number, lng: number) => {
      if (!token) return;
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=${locale}&limit=1`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.features?.length > 0) {
            setAddress(data.features[0].place_name || "");
          }
        }
      } catch {
        // silent
      }
    },
    [token, locale]
  );

  // Forward geocoding search
  const searchPlaces = useCallback(
    async (query: string) => {
      if (!token || query.length < 3) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&language=${locale}&limit=5&country=co`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.features || []);
        }
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    },
    [token, locale]
  );

  // Debounced search
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPlaces(value), 300);
  };

  const selectSearchResult = (result: GeocodingResult) => {
    const [lng, lat] = result.center;
    placeMarkerRef.current(lng, lat);
    setAddress(result.place_name);
    setSearchQuery("");
    setSearchResults([]);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
  };

  // Initialize map with dynamic import
  useEffect(() => {
    if (!isOpen || !token) return;

    let cancelled = false;
    let map: mapboxgl.Map | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const init = async () => {
      ensureMapboxCSS();

      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;

      const container = mapContainerRef.current;
      if (!container) return;

      // Wait for container to have real dimensions
      await new Promise<void>((resolve) => {
        let attempts = 0;
        const check = () => {
          if (cancelled) { resolve(); return; }
          const rect = container.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            resolve();
          } else if (attempts < 50) {
            attempts++;
            requestAnimationFrame(check);
          } else {
            resolve();
          }
        };
        check();
      });

      if (cancelled || !mapContainerRef.current) return;

      mapboxgl.accessToken = token;

      const center: [number, number] =
        initialLng && initialLat ? [initialLng, initialLat] : [-74.3, 4.57];
      const zoom = initialLat && initialLng ? 14 : 6;

      try {
        map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom,
          failIfMajorPerformanceCaveat: false,
        });

        mapRef.current = map;

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        // ── Marker placement — uses mapboxgl directly from closure ──
        placeMarkerRef.current = (lng: number, lat: number) => {
          if (!map) return;
          setSelectedLat(Math.round(lat * 1_000_000) / 1_000_000);
          setSelectedLng(Math.round(lng * 1_000_000) / 1_000_000);

          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
          } else {
            markerRef.current = new mapboxgl.Marker({
              element: createPickerMarkerElement(),
              anchor: "center",
            })
              .setLngLat([lng, lat])
              .addTo(map);
          }

          reverseGeocodeRef.current(lat, lng);
        };

        map.once("load", () => {
          if (cancelled || !map) return;
          map.resize();
          setMapReady(true);

          if (initialLat && initialLng) {
            markerRef.current = new mapboxgl.Marker({
              element: createPickerMarkerElement(),
              anchor: "center",
            })
              .setLngLat([initialLng, initialLat])
              .addTo(map);
            reverseGeocodeRef.current(initialLat, initialLng);
          }
        });

        map.on("click", (e) => {
          if (cancelled) return;
          placeMarkerRef.current(e.lngLat.lng, e.lngLat.lat);
        });

        map.on("error", (e) => {
          console.warn("Mapbox error:", e.error?.message || e);
        });

        // Aggressive resize — handles late layout computations
        const resizeDelays = [100, 300, 600, 1000];
        for (const delay of resizeDelays) {
          const t = setTimeout(() => {
            if (!cancelled && map) {
              map.resize();
            }
          }, delay);
          timers.push(t);
        }
      } catch (err) {
        console.error("Failed to initialize Mapbox:", err);
        if (!cancelled) setMapError(true);
      }
    };

    init();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapRef.current = null;
      placeMarkerRef.current = () => {};
      setMapReady(false);
      setMapError(false);
      setSearchQuery("");
      setSearchResults([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedLat !== null && selectedLng !== null) {
      onSelect(selectedLat, selectedLng, address || undefined);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
    >
      <div
        className="w-full max-w-4xl h-[80vh] bg-[#141414] rounded-2xl border border-white/10 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with search — z-10 ensures clicks don't pass through to the map */}
        <div className="flex-shrink-0 relative z-10 flex items-center gap-3 px-5 py-3 border-b border-white/5">
          <MapPin size={16} className="text-[#0070F3] shrink-0" />
          <div className="flex-1 relative">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={t("mapPicker.searchPlaceholder")}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50 focus:ring-1 focus:ring-[#0070F3]/20 transition-colors"
              />
              {searching && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 animate-spin"
                />
              )}
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden z-10 shadow-2xl">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-start gap-2.5"
                  >
                    <MapPin size={13} className="text-[#0070F3] shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{result.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Map container */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div
            ref={mapContainerRef}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {/* Loading overlay */}
          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#141414]">
              <div className="flex items-center gap-2">
                {mapError ? (
                  <p className="text-red-400/70 text-sm">
                    {t("mapPicker.mapError")}
                  </p>
                ) : (
                  <>
                    <Loader2 size={16} className="text-[#0070F3] animate-spin" />
                    <p className="text-white/40 text-sm">{t("mapPicker.loadingMap")}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with coordinates — z-10 ensures clicks don't pass through to the map */}
        <div className="flex-shrink-0 relative z-10 flex items-center justify-between px-5 py-3 border-t border-white/5 bg-[#0f0f0f]">
          <div className="flex-1 min-w-0">
            {selectedLat !== null && selectedLng !== null ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>
                    Lat:{" "}
                    <span className="text-white/80 font-mono">
                      {selectedLat}
                    </span>
                  </span>
                  <span>
                    Lng:{" "}
                    <span className="text-white/80 font-mono">
                      {selectedLng}
                    </span>
                  </span>
                </div>
                {address && (
                  <p className="text-xs text-white/40 truncate">{address}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-white/30">
                {t("mapPicker.searchOrClickHint")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-white/50 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-colors"
            >
              {t("mapPicker.cancel")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedLat === null || selectedLng === null}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0070F3] text-black rounded-lg text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              {t("mapPicker.confirmLocation")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
