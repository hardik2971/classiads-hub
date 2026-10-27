"use client";

import { useApi } from "@/lib/use-api";
import type { Ad } from "@/lib/types";
import { AdCardGrid } from "@/components/ad-card";
import { EmptyState, ErrorState } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/button";

export default function FavoritesPage() {
  const { data, loading, error } = useApi<Ad[]>("/favorites");

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Favorites</h1>
      {loading && <Spinner className="h-7 w-7 text-brand" />}
      {error && <ErrorState message={error} />}
      {data && data.length > 0 ? (
        <AdCardGrid ads={data} />
      ) : (
        !loading && <EmptyState title="No saved items" subtitle="Tap the heart on any listing to save it." icon="❤️" />
      )}
    </div>
  );
}
