export type CityStatus = "available" | "soon";

export type WgGesuchtCity = {
  id: number;
  slug: string;
};

export type City = {
  id: string;
  name: string;
  country: string;
  status: CityStatus;
  blurb: string;
  highlight: string;
  center: { lat: number; lng: number };
  defaultZoom: number;
  /** willhaben path segment after /mietwohnungen/ */
  willhabenPath: string;
  /** wg-gesucht city listing, if supported */
  wgGesucht?: WgGesuchtCity;
  /** Curated student dorm catalog per city */
  hasDorms?: boolean;
  /** Hint PLZ values shown in filters */
  postcodeHint?: string;
};

export const CITIES: City[] = [
  {
    id: "linz",
    name: "Linz",
    country: "Austria",
    status: "available",
    blurb: "Student rentals across Linz and the surrounding area.",
    highlight: "willhaben · wg-gesucht · dorms",
    center: { lat: 48.3069, lng: 14.2858 },
    defaultZoom: 13,
    willhabenPath: "oberoesterreich/linz",
    wgGesucht: { id: 330, slug: "Linz" },
    hasDorms: true,
    postcodeHint: "4020 / 4040",
  },
  {
    id: "vienna",
    name: "Vienna",
    country: "Austria",
    status: "available",
    blurb: "Apartments and WGs for Vienna universities.",
    highlight: "willhaben · wg-gesucht",
    center: { lat: 48.2082, lng: 16.3738 },
    defaultZoom: 12,
    willhabenPath: "wien",
    wgGesucht: { id: 163, slug: "Wien" },
    hasDorms: true,
    postcodeHint: "1010–1230",
  },
  {
    id: "graz",
    name: "Graz",
    country: "Austria",
    status: "available",
    blurb: "Housing around Graz campuses and the city centre.",
    highlight: "willhaben · wg-gesucht",
    center: { lat: 47.0707, lng: 15.4395 },
    defaultZoom: 13,
    willhabenPath: "steiermark/graz",
    wgGesucht: { id: 160, slug: "Graz" },
    hasDorms: true,
    postcodeHint: "8010 / 8020",
  },
  {
    id: "innsbruck",
    name: "Innsbruck",
    country: "Austria",
    status: "available",
    blurb: "Alpine student city — flats and WGs near campus.",
    highlight: "willhaben · wg-gesucht",
    center: { lat: 47.2692, lng: 11.4041 },
    defaultZoom: 13,
    willhabenPath: "tirol/innsbruck",
    wgGesucht: { id: 161, slug: "Innsbruck" },
    hasDorms: true,
    postcodeHint: "6020",
  },
  {
    id: "salzburg",
    name: "Salzburg",
    country: "Austria",
    status: "available",
    blurb: "Student housing for PLUS and FH Salzburg.",
    highlight: "willhaben · wg-gesucht",
    center: { lat: 47.8095, lng: 13.055 },
    defaultZoom: 13,
    willhabenPath: "salzburg/salzburg-stadt",
    wgGesucht: { id: 162, slug: "Salzburg" },
    hasDorms: true,
    postcodeHint: "5020",
  },
  {
    id: "klagenfurt",
    name: "Klagenfurt",
    country: "Austria",
    status: "available",
    blurb: "Rentals for AAU and Klagenfurt student life.",
    highlight: "willhaben",
    center: { lat: 46.6247, lng: 14.3058 },
    defaultZoom: 13,
    willhabenPath: "kaernten/klagenfurt",
    hasDorms: true,
    postcodeHint: "9020",
  },
  {
    id: "leoben",
    name: "Leoben",
    country: "Austria",
    status: "available",
    blurb: "Montanuniversität and local student rentals.",
    highlight: "willhaben",
    center: { lat: 47.3835, lng: 15.0919 },
    defaultZoom: 14,
    willhabenPath: "steiermark/leoben",
    hasDorms: true,
    postcodeHint: "8700",
  },
  {
    id: "st-poelten",
    name: "St. Pölten",
    country: "Austria",
    status: "available",
    blurb: "FH St. Pölten and NÖ student housing.",
    highlight: "willhaben",
    center: { lat: 48.2047, lng: 15.6256 },
    defaultZoom: 14,
    willhabenPath: "niederoesterreich/sankt-poelten",
    hasDorms: true,
    postcodeHint: "3100",
  },
  {
    id: "wels",
    name: "Wels",
    country: "Austria",
    status: "available",
    blurb: "FH OÖ campus and Wels city rentals.",
    highlight: "willhaben",
    center: { lat: 48.1575, lng: 14.0289 },
    defaultZoom: 14,
    willhabenPath: "oberoesterreich/wels",
    hasDorms: true,
    postcodeHint: "4600",
  },
  {
    id: "krems",
    name: "Krems",
    country: "Austria",
    status: "available",
    blurb: "IMC, Danube University and Krems housing.",
    highlight: "willhaben",
    center: { lat: 48.4092, lng: 15.6142 },
    defaultZoom: 14,
    willhabenPath: "niederoesterreich/krems-an-der-donau",
    hasDorms: true,
    postcodeHint: "3500",
  },
];

const WILLHABEN_BASE =
  "https://www.willhaben.at/iad/immobilien/mietwohnungen";

export function getCity(id: string): City | undefined {
  return CITIES.find((city) => city.id === id);
}

export function getWillhabenSearchBase(cityId: string): string {
  const city = getCity(cityId);
  if (!city) {
    return `${WILLHABEN_BASE}/mietwohnung-angebote`;
  }
  return `${WILLHABEN_BASE}/${city.willhabenPath}`;
}

export function citySupportsSource(
  cityId: string,
  source: "apartments" | "shared" | "dorms",
): boolean {
  const city = getCity(cityId);
  if (!city || city.status !== "available") return false;
  if (source === "apartments") return true;
  if (source === "shared") return Boolean(city.wgGesucht);
  if (source === "dorms") return true;
  return false;
}

export function searchCities(query: string): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITIES;
  return CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(q) ||
      city.id.toLowerCase().includes(q) ||
      city.country.toLowerCase().includes(q),
  );
}
