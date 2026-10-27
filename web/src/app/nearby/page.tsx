"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import type { Ad } from "@/lib/types";
import { AdCardGrid } from "@/components/ad-card";
import { Button } from "@/components/ui/button";
import { Container, EmptyState } from "@/components/ui/misc";

const RADII = [5, 10, 25, 50, 100, 250];

export default function NearbyPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(25);
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Your browser can't share its location.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Location permission was denied. Allow location access to see ads near you.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 15000 },
    );
  }, []);

  useEffect(() => locate(), [locate]);

  useEffect(() => {
    if (!coords) return;
    setAds(null);
    clientApi<Ad[]>("/ads/nearby", { query: { latitude: coords.lat, longitude: coords.lng, radius, per_page: 40 } })
      .then((r) => setAds(r.data))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load nearby ads."));
  }, [coords, radius]);

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ads near you</h1>
          <p className="text-sm text-muted">{coords ? `Within ${radius} km of your location` : "Share your location to find listings close by."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RADII.map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${radius === r ? "border-brand bg-brand text-white" : "border-border bg-card hover:border-brand/40"}`}
            >
              {r} km
            </button>
          ))}
          <Button onClick={locate} loading={locating}>
            📍 Update location
          </Button>
        </div>
      </div>

      {error && <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {coords && !ads && !error && <p className="py-10 text-center text-muted">Finding listings near you…</p>}
      {ads && ads.length > 0 && <AdCardGrid ads={ads} />}
      {ads && ads.length === 0 && <EmptyState title="Nothing nearby yet" subtitle="Try a wider radius." icon="📍" />}
    </Container>
  );
}
