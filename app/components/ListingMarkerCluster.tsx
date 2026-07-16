"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { Listing } from "@/lib/willhaben";

type ListingMarkerClusterProps = {
  listings: Listing[];
  selectedId: string | null;
  onSelect: (listing: Listing) => void;
  createIcon: (listing: Listing, selected: boolean) => L.DivIcon;
};

export default function ListingMarkerCluster({
  listings,
  selectedId,
  onSelect,
  createIcon,
}: ListingMarkerClusterProps) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 18,
      iconCreateFunction(cluster) {
        const count = cluster.getChildCount();
        const size = count < 10 ? "small" : count < 50 ? "medium" : "large";
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    const selectedListing = selectedId
      ? listings.find((listing) => listing.id === selectedId)
      : undefined;

    for (const listing of listings) {
      if (listing.id === selectedId) continue;

      const marker = L.marker([listing.lat, listing.lng], {
        icon: createIcon(listing, false),
        zIndexOffset: 0,
        riseOnHover: true,
      });

      marker.on("click", () => onSelect(listing));
      marker.on("mouseover", () => {
        marker.setZIndexOffset(800);
      });
      marker.on("mouseout", () => {
        marker.setZIndexOffset(0);
      });
      clusterGroup.addLayer(marker);
    }

    let selectedMarker: L.Marker | null = null;
    if (selectedListing) {
      selectedMarker = L.marker([selectedListing.lat, selectedListing.lng], {
        icon: createIcon(selectedListing, true),
        zIndexOffset: 2000,
        riseOnHover: true,
      });
      selectedMarker.on("click", () => onSelect(selectedListing));
      map.addLayer(selectedMarker);
    }

    map.addLayer(clusterGroup);

    return () => {
      if (selectedMarker) {
        map.removeLayer(selectedMarker);
      }
      map.removeLayer(clusterGroup);
      clusterGroup.clearLayers();
    };
  }, [listings, selectedId, onSelect, createIcon, map]);

  return null;
}
