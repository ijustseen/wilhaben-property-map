import { JKU_CAMPUS_POLYGON } from "./jku-campus-polygon";

export const JKU_LINZ = {
  name: "JKU Linz",
  shortName: "JKU",
  address: "Altenberger Straße 69, 4040 Linz",
  lat: 48.3384,
  lng: 14.3212,
} as const;

export { JKU_CAMPUS_POLYGON };

export function getJkuCampusBounds(): [[number, number], [number, number]] {
  let latMin = Infinity;
  let latMax = -Infinity;
  let lngMin = Infinity;
  let lngMax = -Infinity;

  for (const [lat, lng] of JKU_CAMPUS_POLYGON) {
    latMin = Math.min(latMin, lat);
    latMax = Math.max(latMax, lat);
    lngMin = Math.min(lngMin, lng);
    lngMax = Math.max(lngMax, lng);
  }

  return [
    [latMin, lngMin],
    [latMax, lngMax],
  ];
}

export function googleMapsDirectionsUrl(
  fromLat: number,
  fromLng: number,
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${fromLat},${fromLng}`,
    destination: `${JKU_LINZ.lat},${JKU_LINZ.lng}`,
    travelmode: "transit",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function googleMapsWalkingUrl(
  fromLat: number,
  fromLng: number,
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${fromLat},${fromLng}`,
    destination: `${JKU_LINZ.lat},${JKU_LINZ.lng}`,
    travelmode: "walking",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
