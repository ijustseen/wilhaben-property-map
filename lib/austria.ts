// Approximate bounding box for Austria (mainland)
export const AUSTRIA_BOUNDS = {
  latMin: 46.35,
  latMax: 49.05,
  lngMin: 9.5,
  lngMax: 17.2,
} as const;

export function isInAustria(lat: number, lng: number): boolean {
  return (
    lat >= AUSTRIA_BOUNDS.latMin &&
    lat <= AUSTRIA_BOUNDS.latMax &&
    lng >= AUSTRIA_BOUNDS.lngMin &&
    lng <= AUSTRIA_BOUNDS.lngMax
  );
}

export function isAustrianPostcode(postcode: string): boolean {
  const code = postcode.trim();
  if (!/^\d{4}$/.test(code)) return false;
  const n = Number(code);
  return n >= 1000 && n <= 9999;
}

export function isAustrianCountry(country: string | undefined): boolean {
  if (!country) return true;
  const normalized = country.trim().toLowerCase();
  return (
    normalized === "österreich" ||
    normalized === "oesterreich" ||
    normalized === "austria" ||
    normalized === "at"
  );
}
