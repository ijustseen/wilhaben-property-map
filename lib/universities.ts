import { getCity } from "./cities";
import { UNIVERSITY_CATALOG } from "./universities-data";

export type UniversityStatus = "available" | "soon";

export type University = {
  id: string;
  name: string;
  shortName: string;
  cityId: string;
  status: UniversityStatus;
  address: string;
  lat: number;
  lng: number;
  /** Optional campus outline for map overlay */
  campusPolygon?: [number, number][];
  blurb: string;
};

/**
 * Universities drive product entry: pick a uni → housing for its city/region.
 */
export const UNIVERSITIES: University[] = UNIVERSITY_CATALOG;

export function getUniversity(id: string): University | undefined {
  return UNIVERSITIES.find((uni) => uni.id === id);
}

export function getUniversitiesForCity(cityId: string): University[] {
  return UNIVERSITIES.filter((uni) => uni.cityId === cityId);
}

export function getDefaultUniversityForCity(
  cityId: string,
): University | undefined {
  const inCity = getUniversitiesForCity(cityId);
  return (
    inCity.find((uni) => uni.status === "available") ?? inCity[0]
  );
}

export function searchUniversities(query: string): University[] {
  const q = query.trim().toLowerCase();
  if (!q) return UNIVERSITIES;
  return UNIVERSITIES.filter((uni) => {
    const cityName = getCity(uni.cityId)?.name.toLowerCase() ?? "";
    return (
      uni.name.toLowerCase().includes(q) ||
      uni.shortName.toLowerCase().includes(q) ||
      uni.cityId.toLowerCase().includes(q) ||
      cityName.includes(q) ||
      uni.blurb.toLowerCase().includes(q) ||
      uni.address.toLowerCase().includes(q)
    );
  });
}

export function universityMapPath(uni: University): string {
  return `/map/${uni.cityId}?university=${uni.id}`;
}

/** Neutral map entry — empty Austria view with filters open */
export const MAP_ENTRY_PATH = "/map";

export function googleMapsDirectionsToUniversity(
  uni: University,
  fromLat: number,
  fromLng: number,
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${fromLat},${fromLng}`,
    destination: `${uni.lat},${uni.lng}`,
    travelmode: "transit",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function getCampusBounds(
  polygon: [number, number][],
): [[number, number], [number, number]] {
  let latMin = Infinity;
  let latMax = -Infinity;
  let lngMin = Infinity;
  let lngMax = -Infinity;

  for (const [lat, lng] of polygon) {
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
