"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

/** Callers often pass Number("") / Number(undefined); only real numbers count as a position. */
const isCoord = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

/** OpenStreetMap picker: click / drag the marker to set coordinates. */
export function MapPicker({ lat, lng, onChange, height = 380 }: { lat?: number | null; lng?: number | null; onChange: (lat: number, lng: number) => void; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      const icon = L.icon({
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      const has = isCoord(lat) && isCoord(lng);
      const start: [number, number] = has ? [lat!, lng!] : [23.2419, 69.6669];
      map.current = L.map(el.current).setView(start, has ? 14 : 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map.current);
      marker.current = L.marker(start, { draggable: true, icon }).addTo(map.current);
      marker.current.on("dragend", () => {
        const p = marker.current.getLatLng();
        cb.current(Number(p.lat.toFixed(7)), Number(p.lng.toFixed(7)));
      });
      map.current.on("click", (e: any) => {
        marker.current.setLatLng(e.latlng);
        cb.current(Number(e.latlng.lat.toFixed(7)), Number(e.latlng.lng.toFixed(7)));
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (map.current && marker.current && isCoord(lat) && isCoord(lng)) {
      marker.current.setLatLng([lat, lng]);
      map.current.setView([lat, lng], Math.max(map.current.getZoom(), 12));
    }
  }, [lat, lng]);

  useEffect(() => () => map.current?.remove(), []);

  return <div ref={el} className="z-0 overflow-hidden rounded-xl border border-line" style={{ height }} />;
}
