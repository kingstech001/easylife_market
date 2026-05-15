"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, X, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapAddressPickerProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Fix Leaflet default marker icons (they break with bundlers)
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function MapAddressPicker({
  value,
  onChange,
  placeholder = "Search for your store address...",
}: MapAddressPickerProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<
    [number, number] | null
  >(null);
  const [tempAddress, setTempAddress] = useState("");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isMapOpen || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: selectedCoords
        ? [selectedCoords[0], selectedCoords[1]]
        : [6.45, 7.5], // Default: Enugu, Nigeria (lat, lng)
      zoom: selectedCoords ? 16 : 12,
      zoomControl: false,
    });

    // Street map layer
    const streets = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }
    );

    // Satellite layer (Google) — shows buildings/roads even in unmapped areas
    const satellite = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
      {
        attribution: "&copy; Google",
        maxZoom: 20,
      }
    );

    // Default to satellite for better village coverage
    satellite.addTo(map);

    L.control
      .layers(
        { Street: streets, Satellite: satellite },
        {},
        { position: "topright" }
      )
      .addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    // Place marker if we already have coords
    if (selectedCoords) {
      const marker = L.marker(
        [selectedCoords[0], selectedCoords[1]],
        { icon: markerIcon }
      ).addTo(map);
      markerRef.current = marker;
    }

    // Click on map to place marker
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker([lat, lng]);
      await reverseGeocode(lat, lng);
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapOpen]);

  const placeMarker = useCallback((coords: [number, number]) => {
    const activeMap = mapRef.current;
    if (!activeMap) return;

    markerRef.current?.remove();
    const marker = L.marker(coords, { icon: markerIcon }).addTo(activeMap);
    markerRef.current = marker;
    setSelectedCoords(coords);
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.display_name) {
        setTempAddress(data.display_name);
      }
    } catch {}
  };

  const searchAddress = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const coords: [number, number] = [lat, lng];

    setTempAddress(result.display_name);
    setSelectedCoords(coords);
    setResults([]);
    setQuery(result.display_name);

    if (mapRef.current) {
      mapRef.current.flyTo(coords, 16, { duration: 1.2 });
      placeMarker(coords);
    }
  };

  const handleConfirm = () => {
    if (tempAddress) {
      onChange(tempAddress);
      setIsMapOpen(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        if (mapRef.current) {
          mapRef.current.flyTo(coords, 16, { duration: 1.2 });
          placeMarker(coords);
        }
        await reverseGeocode(coords[0], coords[1]);
      },
      () => {}
    );
  };

  const openMap = () => {
    setTempAddress(value);
    setQuery(value);
    setIsMapOpen(true);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={openMap}
        className={cn(
          "w-full flex items-center gap-3 h-11 sm:h-12 px-3 rounded-xl border text-left text-sm transition-all active:scale-[0.99]",
          value
            ? "border-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-950/10"
            : "border-border/50 hover:border-[#c0a146]/50 bg-background"
        )}
      >
        <MapPin
          className={cn(
            "h-4 w-4 flex-shrink-0",
            value ? "text-emerald-600" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "flex-1 truncate",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {value || placeholder}
        </span>
        <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      </button>

      {/* Fullscreen map modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-sm z-[10001]">
            <div className="flex items-center gap-2 px-3 sm:px-4 h-14">
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="p-1.5 -ml-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search address..."
                  autoFocus
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted/50 border border-border/50 text-sm outline-none focus:border-[#c0a146] transition-colors"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Search results dropdown */}
            {results.length > 0 && (
              <div className="border-t border-border/30 max-h-48 overflow-y-auto">
                {results.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0"
                  >
                    <MapPin className="h-4 w-4 text-[#c0a146] flex-shrink-0" />
                    <span className="text-sm truncate">
                      {result.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 relative z-[10000]">
            <div ref={mapContainerRef} className="absolute inset-0" />

            {/* Locate me button */}
            <button
              type="button"
              onClick={handleLocateMe}
              className="absolute top-3 right-3 h-10 w-10 bg-background border border-border/50 rounded-xl shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-[10001]"
            >
              <Navigation className="h-4 w-4 text-[#c0a146]" />
            </button>
          </div>

          {/* Bottom bar */}
          <div className="flex-shrink-0 border-t border-border/40 bg-background p-3 sm:p-4 space-y-2 z-[10001]">
            {tempAddress && (
              <div className="flex items-start gap-2 px-1">
                <MapPin className="h-4 w-4 text-[#c0a146] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-snug line-clamp-2">
                  {tempAddress}
                </p>
              </div>
            )}
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!tempAddress}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146] text-white font-medium text-sm sm:text-base shadow-lg active:scale-[0.98] transition-all"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Confirm Address
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
