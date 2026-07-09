"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { AUSTRIA_BOUNDS, isInAustria } from "@/lib/austria";
import { JKU_CAMPUS_POLYGON, JKU_LINZ } from "@/lib/jku";
import type { TransitJourney } from "@/lib/transit";
import type { Listing } from "@/lib/willhaben";
import "leaflet/dist/leaflet.css";

const LINZ_CENTER: [number, number] = [48.3069, 14.2858];

const AUSTRIA_MAP_BOUNDS: L.LatLngBoundsExpression = [
  [AUSTRIA_BOUNDS.latMin, AUSTRIA_BOUNDS.lngMin],
  [AUSTRIA_BOUNDS.latMax, AUSTRIA_BOUNDS.lngMax],
];

function createListingIcon(selected: boolean) {
  if (selected) {
    return L.divIcon({
      className: "",
      html: `<div style="position:relative;width:28px;height:28px;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:rgba(0,102,204,0.25);
          animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:18px;height:18px;
          background:#0066cc;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
        "></div>
      </div>
      <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;
      background:#e11d48;
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const jkuIcon = L.divIcon({
  className: "",
  html: `<div style="
    display:flex;align-items:center;justify-content:center;
    width:32px;height:32px;
    background:#1d4ed8;
    border:3px solid white;
    border-radius:8px;
    color:white;font-size:10px;font-weight:700;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
    letter-spacing:-0.02em;
  ">JKU</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function campusBounds(): L.LatLngBounds {
  return L.latLngBounds(JKU_CAMPUS_POLYGON);
}

function MapViewport({
  listings,
  selectedId,
  routeGeometry,
}: {
  listings: Listing[];
  selectedId: string | null;
  routeGeometry: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = campusBounds();
    const selected = selectedId
      ? listings.find((item) => item.id === selectedId)
      : null;

    if (selected) {
      bounds.extend([selected.lat, selected.lng]);
      for (const point of routeGeometry) {
        bounds.extend(point);
      }
      map.fitBounds(bounds, {
        padding: [56, 56],
        maxZoom: 15,
        animate: true,
      });
      return;
    }

    for (const listing of listings) {
      bounds.extend([listing.lat, listing.lng]);
    }

    if (listings.length > 0) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    } else {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    }
  }, [listings, selectedId, routeGeometry, map]);

  return null;
}

type RentalMapProps = {
  listings: Listing[];
  selectedId: string | null;
  onSelect: (listing: Listing) => void;
};

export default function RentalMap({
  listings,
  selectedId,
  onSelect,
}: RentalMapProps) {
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);

  const withCoords = useMemo(
    () =>
      listings.filter(
        (l) =>
          Number.isFinite(l.lat) &&
          Number.isFinite(l.lng) &&
          isInAustria(l.lat, l.lng),
      ),
    [listings],
  );

  const selected = withCoords.find((l) => l.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) {
      setRouteGeometry([]);
      return;
    }

    let cancelled = false;

    fetch(`/api/transit?lat=${selected.lat}&lng=${selected.lng}`)
      .then((res) => res.json())
      .then((data: { journey?: TransitJourney }) => {
        if (!cancelled && data.journey?.geometry) {
          setRouteGeometry(data.journey.geometry);
        }
      })
      .catch(() => {
        if (!cancelled) setRouteGeometry([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  return (
    <MapContainer
      center={LINZ_CENTER}
      zoom={13}
      minZoom={7}
      maxBounds={AUSTRIA_MAP_BOUNDS}
      maxBoundsViscosity={1}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport
        listings={withCoords}
        selectedId={selectedId}
        routeGeometry={routeGeometry}
      />

      <Polygon
        positions={JKU_CAMPUS_POLYGON}
        pathOptions={{
          color: "#1d4ed8",
          weight: 2.5,
          fillColor: "#3b82f6",
          fillOpacity: 0.18,
        }}
      >
        <Tooltip sticky direction="top" opacity={0.95}>
          <span className="text-sm font-medium">{JKU_LINZ.name} campus</span>
        </Tooltip>
      </Polygon>

      <Marker position={[JKU_LINZ.lat, JKU_LINZ.lng]} icon={jkuIcon} zIndexOffset={1000}>
        <Tooltip direction="top" offset={[0, -16]} opacity={1}>
          <span className="text-sm font-medium">{JKU_LINZ.name}</span>
        </Tooltip>
      </Marker>

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

      {withCoords.map((listing) => {
        const isSelected = listing.id === selectedId;
        return (
          <Marker
            key={listing.id}
            position={[listing.lat, listing.lng]}
            icon={createListingIcon(isSelected)}
            zIndexOffset={isSelected ? 500 : 0}
            eventHandlers={{
              click: () => onSelect(listing),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              opacity={0.95}
              className="listing-tooltip"
            >
              <div className="text-sm">
                <p className="listing-tooltip-title">{listing.title}</p>
                {listing.monthlyCost ? (
                  <>
                    <p className="mt-1 font-semibold text-emerald-700">
                      {listing.monthlyCost.totalDisplay} / month
                    </p>
                    <p className="text-xs text-zinc-500">
                      Base rent {listing.priceDisplay}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 font-semibold text-zinc-900">
                    {listing.priceDisplay}
                  </p>
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
