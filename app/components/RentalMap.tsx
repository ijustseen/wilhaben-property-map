"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Listing } from "@/lib/willhaben";
import { AUSTRIA_BOUNDS } from "@/lib/austria";
import type { City } from "@/lib/cities";
import type { TransitJourney } from "@/lib/transit";
import type { MapLayerId } from "@/lib/map-layers";
import type { University } from "@/lib/universities";
import ListingMarkerCluster from "./ListingMarkerCluster";

const AUSTRIA_MAP_BOUNDS: L.LatLngBoundsExpression = [
  [AUSTRIA_BOUNDS.latMin, AUSTRIA_BOUNDS.lngMin],
  [AUSTRIA_BOUNDS.latMax, AUSTRIA_BOUNDS.lngMax],
];

const MAP_LAYERS: Record<
  MapLayerId,
  { name: string; url: string; attribution: string; maxZoom?: number }
> = {
  streets: {
    name: "Streets",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  topo: {
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
};

type RentalMapProps = {
  listings: Listing[];
  selectedId: string | null;
  mapLayer: MapLayerId;
  city: City;
  university: University | null;
  onSelect: (listing: Listing) => void;
};

function formatEuro(value: number) {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createListingIcon(listing: Listing, selected: boolean) {
  const kind = listing.source;
  const priceLabel = listing.price ? formatEuro(listing.price) : "·";
  const title = escapeHtml(listing.title);
  const meta =
    listing.source === "shared"
      ? "Shared flat · usually all-in"
      : listing.source === "dorms"
        ? "Dorm · usually all-in"
        : listing.monthlyCost
          ? `Est. ${escapeHtml(listing.monthlyCost.totalDisplay)}`
          : "Apartment";

  return L.divIcon({
    className: "listing-marker-root",
    iconSize: [220, 120],
    iconAnchor: [110, 120],
    html: `<div class="listing-pin ${selected ? "listing-pin-selected" : ""} listing-pin-${kind}">
      <div class="listing-pin-card">
        <div class="listing-pin-compact">${priceLabel}</div>
        <div class="listing-pin-expand">
          <p class="listing-pin-title">${title}</p>
          <p class="listing-pin-meta">${meta}</p>
          <p class="listing-pin-price-lg">${priceLabel}</p>
        </div>
      </div>
      <span class="listing-pin-caret" aria-hidden="true"></span>
    </div>`,
  });
}

function createCampusIcon(label: string) {
  const safe = escapeHtml(label);
  return L.divIcon({
    className: "",
    iconSize: [52, 44],
    iconAnchor: [26, 44],
    html: `<div class="campus-pin">${safe}</div>`,
  });
}

function MapViewport({
  listings,
  selectedId,
  routeGeometry,
  university,
  city,
}: {
  listings: Listing[];
  selectedId: string | null;
  routeGeometry: [number, number][];
  university: University | null;
  city: City;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (!university) {
      if (city.id === "austria") {
        map.fitBounds(AUSTRIA_MAP_BOUNDS, {
          padding: [32, 32],
          maxZoom: 8,
          animate: false,
        });
      } else {
        map.flyTo([city.center.lat, city.center.lng], city.defaultZoom, {
          duration: 0.7,
        });
      }
      return;
    }

    map.flyTo([university.lat, university.lng], Math.max(city.defaultZoom, 14), {
      duration: 0.7,
    });
  }, [
    university,
    university?.id,
    university?.lat,
    university?.lng,
    city.id,
    city.center.lat,
    city.center.lng,
    city.defaultZoom,
    map,
  ]);

  useEffect(() => {
    if (routeGeometry.length > 1) {
      map.fitBounds(L.latLngBounds(routeGeometry), {
        padding: [56, 56],
        maxZoom: 15,
        animate: true,
      });
      return;
    }

    const selected = listings.find((l) => l.id === selectedId);
    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), {
        duration: 0.6,
      });
    }
  }, [listings, map, routeGeometry, selectedId]);

  return null;
}

export default function RentalMap({
  listings,
  selectedId,
  mapLayer,
  city,
  university,
  onSelect,
}: RentalMapProps) {
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const withCoords = useMemo(
    () =>
      listings.filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng)),
    [listings],
  );
  const selected = listings.find((l) => l.id === selectedId) ?? null;
  const layer = MAP_LAYERS[mapLayer];
  const createIcon = useMemo(() => createListingIcon, []);
  const campusIcon = useMemo(
    () => (university ? createCampusIcon(university.shortName) : null),
    [university],
  );

  useEffect(() => {
    if (!selected || !university) {
      setRouteGeometry([]);
      return;
    }

    let cancelled = false;
    const { lat, lng } = selected;
    fetch(
      `/api/transit?lat=${lat}&lng=${lng}&university=${encodeURIComponent(university.id)}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { journey?: TransitJourney } | null) => {
        if (!cancelled && data?.journey?.geometry) {
          setRouteGeometry(data.journey.geometry);
        }
      })
      .catch(() => {
        if (!cancelled) setRouteGeometry([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, university?.id]);

  return (
    <MapContainer
      center={[city.center.lat, city.center.lng]}
      zoom={city.defaultZoom}
      minZoom={7}
      maxBounds={AUSTRIA_MAP_BOUNDS}
      maxBoundsViscosity={1}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        key={mapLayer}
        attribution={layer.attribution}
        url={layer.url}
        maxZoom={layer.maxZoom ?? 19}
      />
      <MapViewport
        listings={withCoords}
        selectedId={selectedId}
        routeGeometry={routeGeometry}
        university={university}
        city={city}
      />

      {university?.campusPolygon && university.campusPolygon.length > 2 && (
        <Polygon
          key={`${university.id}-poly`}
          positions={university.campusPolygon}
          pathOptions={{
            color: "#1d4ed8",
            weight: 2.5,
            fillColor: "#3b82f6",
            fillOpacity: 0.18,
          }}
        >
          <Tooltip sticky direction="top" opacity={0.95}>
            <span className="text-sm font-medium">
              {university.shortName} campus
            </span>
          </Tooltip>
        </Polygon>
      )}

      {university && campusIcon && (
        <Marker
          key={`${university.id}-marker`}
          position={[university.lat, university.lng]}
          icon={campusIcon}
          zIndexOffset={1000}
        >
          <Tooltip direction="top" offset={[0, -16]} opacity={1}>
            <span className="text-sm font-medium">{university.name}</span>
          </Tooltip>
        </Marker>
      )}

      {routeGeometry.length > 1 && (
        <Polyline
          positions={routeGeometry}
          pathOptions={{
            color: "#2563eb",
            weight: 4,
            opacity: 0.85,
            dashArray: "8 6",
          }}
        />
      )}

      <ListingMarkerCluster
        listings={withCoords}
        selectedId={selectedId}
        onSelect={onSelect}
        createIcon={createIcon}
      />
    </MapContainer>
  );
}

export type { MapLayerId };
export { MAP_LAYERS };
