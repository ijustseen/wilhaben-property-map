import { citySupportsSource, getCity } from "@/lib/cities";
import { isInAustria } from "@/lib/austria";
import type {
  Listing,
  ListingDetail,
  ListingDetailSection,
  SearchFilters,
} from "@/lib/willhaben";

const MAX_PAGES = 8;
const DETAIL_CONCURRENCY = 8;

function wgListBase(cityId: string): string | null {
  const city = getCity(cityId);
  if (!city?.wgGesucht) return null;
  const { id, slug } = city.wgGesucht;
  return `https://www.wg-gesucht.de/wg-zimmer-in-${slug}.${id}.0.1`;
}

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html",
  "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
  Referer: "https://www.wg-gesucht.de/",
};

type WgListItem = {
  id: string;
  title: string;
  url: string;
  price: number | null;
  rooms: number | null;
  area: number | null;
  street: string;
  district: string;
  postcode: string;
  city: string;
  imageUrl: string | null;
  availableFrom: string | null;
  description: string;
};

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&euro;/g, "€");
}

function stripTags(html: string): string {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function parseEuro(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const cleaned = String(value).replace(/[^\d,.-]/g, "").replace(",", ".");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

function formatEuro(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseJsonLdList(html: string): Array<Record<string, unknown>> {
  const scripts = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];

  for (const match of scripts) {
    const raw = match[1].trim();
    try {
      let depth = 0;
      let end = -1;
      for (let i = 0; i < raw.length; i += 1) {
        const ch = raw[i];
        if (ch === "[" || ch === "{") depth += 1;
        if (ch === "]" || ch === "}") {
          depth -= 1;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
      if (end < 0) continue;
      const data = JSON.parse(raw.slice(0, end)) as unknown;
      if (!Array.isArray(data)) continue;
      const collection = data.find(
        (item) =>
          item &&
          typeof item === "object" &&
          (item as { "@type"?: string })["@type"] === "CollectionPage",
      ) as
        | {
            mainEntity?: {
              itemListElement?: Array<{ item?: Record<string, unknown> }>;
            };
          }
        | undefined;
      const elements = collection?.mainEntity?.itemListElement;
      if (elements?.length) {
        return elements
          .map((entry) => entry.item)
          .filter((item): item is Record<string, unknown> => Boolean(item));
      }
    } catch {
      // try next script block
    }
  }

  return [];
}

function extractCardMeta(html: string): Map<string, { area: number | null; rooms: number | null; availableFrom: string | null }> {
  const meta = new Map<
    string,
    { area: number | null; rooms: number | null; availableFrom: string | null }
  >();
  const cards = [
    ...html.matchAll(
      /id="liste-details-ad-(\d+)"[\s\S]*?(?=id="liste-details-ad-|\z)/g,
    ),
  ];

  for (const card of cards) {
    const id = card[1];
    const text = stripTags(card[0]);
    const areaMatch = text.match(/(\d+(?:[.,]\d+)?)\s*m²/);
    const roomsMatch = text.match(/(\d+)\s*er\s*WG/i);
    const availableMatch = text.match(/Verfügbar:\s*([0-9.]+)/i);
    meta.set(id, {
      area: areaMatch ? Number(areaMatch[1].replace(",", ".")) : null,
      rooms: roomsMatch ? Number(roomsMatch[1]) : null,
      availableFrom: availableMatch?.[1] ?? null,
    });
  }

  return meta;
}

function parseListPage(html: string): WgListItem[] {
  const items = parseJsonLdList(html);
  const cardMeta = extractCardMeta(html);
  const listings: WgListItem[] = [];

  for (const item of items) {
    const url = String(item.url ?? "");
    const idMatch = url.match(/\.(\d+)\.html/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const address =
      (
        item.mainEntity as
          | { address?: Record<string, string> }
          | undefined
      )?.address ?? {};
    const price = parseEuro(
      (item.offers as { price?: string } | undefined)?.price,
    );
    const meta = cardMeta.get(id);
    const roomsFromDesc =
      meta?.rooms ??
      (() => {
        const match = String(item.description ?? "").match(/(\d+)\s*er\s*WG/i);
        return match ? Number(match[1]) : null;
      })();

    listings.push({
      id,
      title: String(item.name ?? "Shared room"),
      url: url.startsWith("http") ? url : `https://www.wg-gesucht.de${url}`,
      price,
      rooms: roomsFromDesc,
      area: meta?.area ?? null,
      street: address.streetAddress ?? "",
      district: address.addressRegion ?? "",
      postcode: address.postalCode ?? "",
      city: address.addressLocality ?? "Linz",
      imageUrl: typeof item.image === "string" ? item.image : null,
      availableFrom: meta?.availableFrom ?? null,
      description: String(item.description ?? "").trim(),
    });
  }

  return listings;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`wg-gesucht returned status ${response.status}`);
  }
  return response.text();
}

function extractMarker(html: string): { lat: number; lng: number } | null {
  const match = html.match(
    /markers:\s*\[\s*\{\s*"lat"\s*:\s*([-\d.]+)\s*,\s*"lng"\s*:\s*([-\d.]+)/,
  );
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function extractDetailImages(html: string): string[] {
  const urls = [
    ...html.matchAll(
      /https:\/\/img\.wg-gesucht\.de\/media\/[^"'\s]+\.(?:large|big)\.(?:JPEG|JPG|PNG|jpeg|jpg|png)/g,
    ),
  ].map((m) => m[0]);
  return [...new Set(urls)];
}

function extractDescription(html: string): string {
  const match = html.match(
    /id="ad_description_text"[\s\S]*?<div id="freitext_0"[^>]*>([\s\S]*?)<\/div>/,
  );
  if (!match) return "";
  return stripTags(match[1]);
}

function extractDescriptionHtml(html: string): string {
  const match = html.match(
    /id="ad_description_text"[\s\S]*?<div id="freitext_0"[^>]*>([\s\S]*?)<\/div>/,
  );
  return match?.[1]?.trim() ?? "";
}

async function geocodeAddress(
  street: string,
  postcode: string,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = [street, postcode, city, "Austria"].filter(Boolean).join(", ");
  if (!query.trim()) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "at");
  url.searchParams.set("q", query);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "LinzRentalsMap/1.0 (student project)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (!isInAustria(lat, lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

async function resolveCoords(
  item: WgListItem,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const detailHtml = await fetchHtml(item.url);
    if (!detailHtml.includes("cuba.html") && !detailHtml.includes(">Überprüfung<")) {
      const marker = extractMarker(detailHtml);
      if (marker && isInAustria(marker.lat, marker.lng)) return marker;
    }
  } catch {
    // fall through to geocoding
  }

  return geocodeAddress(item.street, item.postcode, item.city);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

function matchesFilters(listing: Listing, filters: SearchFilters): boolean {
  if (filters.areaId && listing.postcode && listing.postcode !== filters.areaId) {
    return false;
  }
  if (
    filters.priceFrom != null &&
    listing.price != null &&
    listing.price < filters.priceFrom
  ) {
    return false;
  }
  if (
    filters.priceTo != null &&
    listing.price != null &&
    listing.price > filters.priceTo
  ) {
    return false;
  }
  if (
    filters.areaMin != null &&
    listing.area != null &&
    listing.area < filters.areaMin
  ) {
    return false;
  }
  if (
    filters.areaMax != null &&
    listing.area != null &&
    listing.area > filters.areaMax
  ) {
    return false;
  }
  if (filters.rooms?.length) {
    const allowed = new Set(filters.rooms);
    if (listing.rooms != null && !allowed.has(Math.round(listing.rooms))) {
      return false;
    }
  }
  return true;
}

function toListing(
  item: WgListItem,
  coords: { lat: number; lng: number },
): Listing {
  const address = [
    item.street,
    `${item.postcode} ${item.city}`.trim(),
    item.district,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: item.id,
    source: "shared",
    title: item.title,
    price: item.price,
    priceDisplay: formatEuro(item.price),
    monthlyCost: null,
    rooms: item.rooms,
    area: item.area,
    address,
    postcode: item.postcode,
    city: item.city,
    lat: coords.lat,
    lng: coords.lng,
    url: item.url,
    imageUrl: item.imageUrl,
  };
}

export async function fetchWgListings(
  filters: SearchFilters = {},
  cityId = "linz",
): Promise<Listing[]> {
  if (!citySupportsSource(cityId, "shared")) {
    return [];
  }

  const listBase = wgListBase(cityId);
  if (!listBase) return [];

  const cityName = getCity(cityId)?.name ?? "Linz";
  const collected: WgListItem[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const html = await fetchHtml(`${listBase}.${page}.html`);
    const batch = parseListPage(html);
    if (batch.length === 0) break;

    for (const item of batch) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      collected.push(item);
    }

    if (batch.length < 20) break;
  }

  const withCoords = await mapWithConcurrency(
    collected,
    DETAIL_CONCURRENCY,
    async (item) => {
      const marker = await resolveCoords(item);
      if (!marker) return null;
      return toListing(item, marker);
    },
  );

  return withCoords
    .filter((listing): listing is Listing => listing !== null)
    .filter((listing) => matchesFilters(listing, filters));
}

export async function fetchWgListingDetail(
  id: string,
  preferredUrl?: string | null,
): Promise<ListingDetail> {
  const candidates = [
    preferredUrl,
    `https://www.wg-gesucht.de/wg-zimmer-in-Linz.${id}.html`,
    `https://www.wg-gesucht.de/${id}.html`,
  ].filter((value, index, arr): value is string =>
    Boolean(value) && arr.indexOf(value) === index,
  );

  let html = "";
  let url = candidates[0];
  let marker: { lat: number; lng: number } | null = null;

  for (const candidate of candidates) {
    try {
      html = await fetchHtml(candidate);
      if (html.includes("cuba.html") || html.includes(">Überprüfung<")) {
        continue;
      }
      marker = extractMarker(html);
      if (marker) {
        url = candidate;
        break;
      }
      // Keep HTML if it looks like a listing page even without marker.
      if (html.includes("ad_description_text")) {
        url = candidate;
        break;
      }
    } catch {
      // try next candidate
    }
  }

  if (!html || html.includes("cuba.html") || html.includes(">Überprüfung<")) {
    throw new Error("Could not find listing details on wg-gesucht");
  }

  const locationText =
    html.match(/(\d{4})\s+Linz(?:\s+([A-Za-zÄÖÜäöüß\- ]+))?/i) ?? null;
  const postcode = locationText?.[1] ?? "";
  const district = locationText?.[2]?.trim() ?? null;

  const streetMatch = html.match(/streetAddress"\s*:\s*"([^"]+)"/);
  const street = streetMatch ? decodeHtml(streetMatch[1]) : "";

  if (!marker || !isInAustria(marker.lat, marker.lng)) {
    marker = await geocodeAddress(street, postcode, "Linz");
  }

  if (!marker || !isInAustria(marker.lat, marker.lng)) {
    throw new Error("Listing location is missing or outside Austria");
  }

  const canonical =
    html.match(
      /<link rel="canonical" href="(https:\/\/www\.wg-gesucht\.de\/[^"]+)"/i,
    )?.[1] ?? url;

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = decodeHtml(
    titleMatch?.[1]?.replace(/\s*-\s*WG.*/i, "").trim() ?? "Shared room",
  );
  const description = extractDescription(html);
  const descriptionHtml = extractDescriptionHtml(html);
  const images = extractDetailImages(html);

  const priceFromFacts =
    html.match(
      /key_fact_detail[^>]*>\s*Gesamtmiete[\s\S]*?key_fact_value[^>]*>\s*([\d.,]+)\s*(?:&euro;|€)/i,
    )?.[1] ??
    html.match(
      /key_fact_detail[^>]*>\s*(?:Miete|Rent)[\s\S]*?key_fact_value[^>]*>\s*([\d.,]+)\s*(?:&euro;|€)/i,
    )?.[1];
  const price = parseEuro(
    priceFromFacts ??
      html.match(
        /"price"\s*:\s*"([\d.,]+)"/,
      )?.[1] ??
      null,
  );
  const plain = stripTags(html);
  const areaFromFacts = html.match(
    /key_fact_detail[^>]*>\s*Zimmergröße[\s\S]*?key_fact_value[^>]*>\s*([\d.,]+)\s*m/i,
  )?.[1];
  const areaMatch = areaFromFacts
    ? [null, areaFromFacts]
    : plain.match(/(\d+(?:[.,]\d+)?)\s*m²/);
  const area = areaMatch ? Number(String(areaMatch[1]).replace(",", ".")) : null;
  const roomsMatch = plain.match(/(\d+)\s*er\s*WG/i);
  const rooms = roomsMatch ? Number(roomsMatch[1]) : null;
  const availableMatch = plain.match(
    /(?:Verfügbar|frei ab|available)[:\s]*([0-9.]{8,10}|[0-9]{2}\.[0-9]{2}\.[0-9]{4})/i,
  );

  const address = [street, `${postcode} Linz`.trim(), district]
    .filter(Boolean)
    .join(", ");

  const sections: ListingDetailSection[] = [];
  if (descriptionHtml) {
    sections.push({ title: "Description", html: descriptionHtml });
  }

  const highlights = [
    {
      label: "Type",
      value: rooms ? `${rooms}-person flatshare` : "Shared room",
    },
    { label: "Room size", value: area ? `${area} m²` : "—" },
    { label: "Available from", value: availableMatch?.[1] ?? "—" },
    { label: "District", value: district ?? "—" },
  ].filter((item) => item.value !== "—");

  const smallImage = html.match(
    /https:\/\/img\.wg-gesucht\.de\/media\/[^"'\s]+\.small\.(?:JPEG|JPG|PNG|jpeg|jpg|png)/,
  )?.[0];

  return {
    id,
    source: "shared",
    title,
    description,
    descriptionHtml,
    price,
    priceDisplay: formatEuro(price),
    pricePerSqm: null,
    rooms,
    area,
    floor: null,
    propertyType: "WG-Zimmer",
    address,
    postcode,
    city: "Linz",
    district,
    lat: marker.lat,
    lng: marker.lng,
    url: canonical,
    images: images.length ? images : smallImage ? [smallImage] : [],
    teaser: [
      ...(rooms ? [{ value: `${rooms}er WG`, postfix: null as string | null }] : []),
      ...(area ? [{ value: String(area), postfix: "m²" }] : []),
    ],
    highlights,
    sections,
    contact: {
      name: null,
      company: null,
      phone: null,
      email: null,
      website: null,
      address: null,
    },
    organisation: {
      name: "WG-Gesucht.de",
      logoUrl: null,
      phone: null,
      email: null,
    },
    energy: {
      hwb: null,
      hwbClass: null,
      fgee: null,
      fgeeClass: null,
    },
    costs: {
      rent: formatEuro(price),
      heating: null,
      additional: null,
      deposit: null,
    },
    monthlyCost: null,
    availableFrom: availableMatch?.[1] ?? null,
    publishedDate: null,
  };
}
