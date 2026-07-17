"use client";

import dynamic from "next/dynamic";
import type { City } from "@/lib/cities";
import { MAP_LAYER_OPTIONS, type MapLayerId } from "@/lib/map-layers";
import type { FavoriteItem } from "@/lib/favorites";
import type { Listing } from "@/lib/willhaben";
import type { University } from "@/lib/universities";

const RentalMap = dynamic(() => import("./RentalMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[var(--mist)] text-[var(--muted)]">
      Loading map…
    </div>
  ),
});

type MapViewProps = {
  listings: Listing[];
  selectedId: string | null;
  flyToCoords?: { lat: number; lng: number } | null;
  layoutSplit?: boolean;
  loading?: boolean;
  mapLayer: MapLayerId;
  city: City;
  university: University | null;
  favorites?: FavoriteItem[];
  favoriteKeys?: Set<string>;
  onMapLayerChange: (layer: MapLayerId) => void;
  onSelect: (listing: Listing) => void;
  onFavoriteSelect?: (item: FavoriteItem) => void;
};

export default function MapView({
  listings,
  selectedId,
  flyToCoords = null,
  layoutSplit = false,
  loading = false,
  mapLayer,
  city,
  university,
  favorites = [],
  favoriteKeys,
  onMapLayerChange,
  onSelect,
  onFavoriteSelect,
}: MapViewProps) {
  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full">
        <RentalMap
          listings={listings}
          selectedId={selectedId}
          flyToCoords={flyToCoords}
          layoutSplit={layoutSplit}
          mapLayer={mapLayer}
          city={city}
          university={university}
          favorites={favorites}
          favoriteKeys={favoriteKeys}
          onSelect={onSelect}
          onFavoriteSelect={onFavoriteSelect}
        />
      </div>

      <div className="pointer-events-auto absolute bottom-6 left-3 z-[450] flex flex-col gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 p-1 shadow-lg backdrop-blur sm:left-4">
        {MAP_LAYER_OPTIONS.map((option) => {
          const active = mapLayer === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onMapLayerChange(option.id)}
              className={`rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                active
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--ink)] hover:bg-[var(--mist)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[var(--surface)]/40 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--ink)] shadow-lg">
            Loading listings…
          </div>
        </div>
      )}
    </div>
  );
}
