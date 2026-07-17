"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { FavoriteItem } from "@/lib/favorites";
import { favoriteListingKey } from "@/lib/favorite-key";

const HEART_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5 3.5 3.5 7-2.5 4.5-9.5 9-9.5 9Z"/></svg>`;

function createFavoriteIcon() {
  return L.divIcon({
    className: "favorite-marker-root",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div class="favorite-map-marker">${HEART_SVG}</div>`,
  });
}

type FavoriteMapMarkersProps = {
  favorites: FavoriteItem[];
  cityId: string;
  visibleListingKeys: Set<string>;
  onSelect: (item: FavoriteItem) => void;
};

export default function FavoriteMapMarkers({
  favorites,
  cityId,
  visibleListingKeys,
  onSelect,
}: FavoriteMapMarkersProps) {
  const map = useMap();

  useEffect(() => {
    const icon = createFavoriteIcon();
    const markers: L.Marker[] = [];

    for (const item of favorites) {
      if (item.cityId !== cityId) continue;
      if (item.lat == null || item.lng == null) continue;
      if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) continue;
      if (visibleListingKeys.has(favoriteListingKey(item.id, item.source))) {
        continue;
      }

      const marker = L.marker([item.lat, item.lng], {
        icon,
        zIndexOffset: 1500,
      });
      marker.on("click", () => onSelect(item));
      marker.addTo(map);
      markers.push(marker);
    }

    return () => {
      for (const marker of markers) {
        map.removeLayer(marker);
      }
    };
  }, [favorites, cityId, visibleListingKeys, onSelect, map]);

  return null;
}
