"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";

interface DeliveryLocationMapProps {
  lat: number;
  lng: number;
  label?: string;
}

export function DeliveryLocationMap({ lat, lng, label }: DeliveryLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let map: L.Map | null = null;

    const initMap = async () => {
      const leaflet = (await import("leaflet")).default;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const markerIcon = leaflet.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      map = leaflet.map(mapContainerRef.current!, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      const streets = leaflet.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        },
      );

      const satellite = leaflet.tileLayer(
        "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
        {
          attribution: "&copy; Google",
          maxZoom: 20,
        },
      );

      satellite.addTo(map);
      leaflet.control
        .layers({ Street: streets, Satellite: satellite }, {}, { position: "topright" })
        .addTo(map);
      leaflet.control.zoom({ position: "bottomright" }).addTo(map);

      const marker = leaflet.marker([lat, lng], { icon: markerIcon }).addTo(map);
      marker.bindPopup(label || "Delivery location");

      mapRef.current = map;
      setTimeout(() => map?.invalidateSize(), 100);
    };

    initMap();

    return () => {
      map?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, label]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted">
      <div ref={mapContainerRef} className="h-64 w-full sm:h-72" />
    </div>
  );
}
