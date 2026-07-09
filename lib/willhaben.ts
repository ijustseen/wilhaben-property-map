import {
  isAustrianCountry,
  isAustrianPostcode,
  isInAustria,
} from "@/lib/austria";
import {
  buildMonthlyCostFromAttributes,
  buildMonthlyCostFromListingPrice,
  type MonthlyCostSummary,
} from "@/lib/monthly-cost";

export type { MonthlyCostSummary } from "@/lib/monthly-cost";

export type Listing = {
  id: string;
  title: string;
  price: number | null;
  priceDisplay: string;
  monthlyCost: MonthlyCostSummary | null;
  rooms: number | null;
  area: number | null;
  address: string;
  postcode: string;
  city: string;
  lat: number;
  lng: number;
  url: string;
  imageUrl: string | null;
};

export type SearchFilters = {
  areaId?: string;
  priceFrom?: number;
  priceTo?: number;
  rooms?: number[];
  areaMin?: number;
  areaMax?: number;
  page?: number;
};

export type ListingDetailSection = {
  title: string;
  html: string;
};

export type ListingDetail = {
  id: string;
  title: string;
  description: string;
  descriptionHtml: string;
  price: number | null;
  priceDisplay: string;
  pricePerSqm: string | null;
  rooms: number | null;
  area: number | null;
  floor: string | null;
  propertyType: string | null;
  address: string;
  postcode: string;
  city: string;
  district: string | null;
  lat: number;
  lng: number;
  url: string;
  images: string[];
  teaser: Array<{ value: string; postfix: string | null }>;
  highlights: Array<{ label: string; value: string }>;
  sections: ListingDetailSection[];
  contact: {
    name: string | null;
    company: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
  };
  organisation: {
    name: string | null;
    logoUrl: string | null;
    phone: string | null;
    email: string | null;
  };
  energy: {
    hwb: string | null;
    hwbClass: string | null;
    fgee: string | null;
    fgeeClass: string | null;
  };
  costs: {
    rent: string | null;
    heating: string | null;
    additional: string | null;
    deposit: string | null;
  };
  monthlyCost: MonthlyCostSummary | null;
  availableFrom: string | null;
  publishedDate: string | null;
};

export const EMPTY_FILTERS: SearchFilters = {
  page: 1,
};

/** Linz area used when the postal-code filter is left empty. */
export const APP_DEFAULT_AREA_ID = "4040";

/** @deprecated Use EMPTY_FILTERS for new code */
export const DEFAULT_FILTERS = EMPTY_FILTERS;

const SEARCH_BASE =
  "https://www.willhaben.at/iad/immobilien/mietwohnungen/mietwohnung-angebote";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Accept: "text/html",
  "Accept-Language": "de-AT,de;q=0.9",
};

type WillhabenAttribute = {
  name: string;
  values: string[];
};

type WillhabenAdvert = {
  id: string;
  description: string;
  attributes: { attribute: WillhabenAttribute[] };
  advertImageList?: {
    advertImage?: Array<{ mainImageUrl?: string }>;
  };
  contextLinkList?: {
    contextLink?: Array<{ id: string; uri?: string }>;
  };
};

type WillhabenDetailAdvert = WillhabenAdvert & {
  publishedDate?: string;
  teaserAttributes?: Array<{ value: string; postfix: string | null }>;
  organisationDetails?: {
    orgName?: string;
    orgLogoUrl?: string;
    orgPhone?: string;
    orgEmail?: string;
  };
  advertAddressDetails?: {
    addressLines?: { value?: string[] };
    postCode?: string;
    postalName?: string;
    district?: string;
  };
  advertContactDetails?: {
    contactDetail?: Array<{
      contactDetailField?: Array<{
        description?: string;
        value?: string;
      }>;
    }>;
  };
};

function attrMap(
  advert: WillhabenAdvert | WillhabenDetailAdvert,
): Record<string, string[]> {
  return Object.fromEntries(
    advert.attributes.attribute.map((a) => [a.name, a.values]),
  );
}

function first(values: string[] | undefined): string | undefined {
  return values?.[0];
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseCoordinates(
  raw: string | undefined,
): { lat: number; lng: number } | null {
  if (!raw) return null;
  const [lat, lng] = raw.split(",").map((v) => Number(v.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function shareUrl(advert: WillhabenAdvert): string {
  const links = advert.contextLinkList?.contextLink ?? [];
  return (
    links.find((l) => l.id === "iadShareLink")?.uri ??
    `https://www.willhaben.at/iad/object?adId=${advert.id}`
  );
}

function extractNextData(html: string): unknown {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!match) {
    throw new Error("Could not find listing data on willhaben");
  }
  return JSON.parse(match[1]);
}

function extractSearchMeta(data: unknown): {
  rowsFound: number;
  rowsReturned: number;
  pageRequested: number;
} {
  const pageProps = (data as { props?: { pageProps?: unknown } }).props
    ?.pageProps;
  const searchResult = (pageProps as { searchResult?: Record<string, number> })
    ?.searchResult;
  return {
    rowsFound: searchResult?.rowsFound ?? 0,
    rowsReturned: searchResult?.rowsReturned ?? 0,
    pageRequested: searchResult?.pageRequested ?? 1,
  };
}

function parseListingsFromPage(data: unknown): Listing[] {
  const adverts = extractAdverts(data);
  return adverts
    .map(parseAdvert)
    .filter((listing): listing is Listing => listing !== null);
}

function extractAdverts(data: unknown): WillhabenAdvert[] {
  const pageProps = (data as { props?: { pageProps?: unknown } }).props
    ?.pageProps;
  const searchResult = (pageProps as { searchResult?: unknown })?.searchResult;
  const summaryList = (searchResult as { advertSummaryList?: unknown })
    ?.advertSummaryList;
  const adverts = (summaryList as { advertSummary?: WillhabenAdvert[] })
    ?.advertSummary;
  return adverts ?? [];
}

function extractDetailAdvert(data: unknown): WillhabenDetailAdvert {
  const pageProps = (data as { props?: { pageProps?: unknown } }).props
    ?.pageProps;
  const advert = (pageProps as { advertDetails?: WillhabenDetailAdvert })
    ?.advertDetails;
  if (!advert) {
    throw new Error("Could not find listing details on willhaben");
  }
  return advert;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sectionTitleFromKey(key: string): string {
  const cleaned = key.replace(/^GENERAL_TEXT_ADVERT\//, "");
  return cleaned.replace(/_/g, " ");
}

function isAustrianLocation(
  attrs: Record<string, string[]>,
  coords: { lat: number; lng: number },
  postcode: string,
): boolean {
  const country = first(attrs.COUNTRY);
  if (country && !isAustrianCountry(country)) return false;
  if (postcode && !isAustrianPostcode(postcode)) return false;
  return isInAustria(coords.lat, coords.lng);
}

function parseAdvert(advert: WillhabenAdvert): Listing | null {
  const attrs = attrMap(advert);
  const coords = parseCoordinates(first(attrs.COORDINATES));
  if (!coords) return null;

  const street = first(attrs.ADDRESS) ?? first(attrs["LOCATION/ADDRESS_1"]) ?? "";
  const postcode = first(attrs.POSTCODE) ?? "";
  const city = first(attrs.LOCATION) ?? first(attrs["LOCATION/ADDRESS_2"]) ?? "Linz";

  if (!isAustrianLocation(attrs, coords, postcode)) return null;

  const price = parseNumber(first(attrs.PRICE));
  const operating = parseNumber(first(attrs["RENTAL_PRICE/ADDITIONAL_COST_GROSS"]));
  const heating = parseNumber(first(attrs["RENTAL_PRICE/HEATINGCOSTSGROSS"]));

  return {
    id: advert.id,
    title: first(attrs.HEADING) ?? advert.description,
    price,
    priceDisplay: first(attrs.PRICE_FOR_DISPLAY) ?? "—",
    monthlyCost: buildMonthlyCostFromListingPrice(
      price,
      operating,
      heating,
      first(attrs["RENTAL_PRICE/PRICE_DESCRIPTION"]) ?? "",
    ),
    rooms: parseNumber(first(attrs.NUMBER_OF_ROOMS)),
    area: parseNumber(first(attrs["ESTATE_SIZE/LIVING_AREA"])),
    address: [street, `${postcode} ${city}`.trim()].filter(Boolean).join(", "),
    postcode,
    city,
    lat: coords.lat,
    lng: coords.lng,
    url: shareUrl(advert),
    imageUrl: advert.advertImageList?.advertImage?.[0]?.mainImageUrl ?? null,
  };
}

function parseDetailAdvert(advert: WillhabenDetailAdvert): ListingDetail {
  const attrs = attrMap(advert);
  const coords = parseCoordinates(first(attrs.COORDINATES)) ?? {
    lat: 48.3069,
    lng: 14.2858,
  };

  const addr = advert.advertAddressDetails;
  const street =
    first(attrs["LOCATION/ADDRESS_1"]) ??
    first(attrs.ADDRESS) ??
    addr?.addressLines?.value?.[0] ??
    "";
  const postcode = addr?.postCode ?? first(attrs["CONTACT/ADDRESS_POSTCODE"]) ?? "";
  const city =
    addr?.postalName ??
    first(attrs["LOCATION/ADDRESS_2"]) ??
    first(attrs.LOCATION) ??
    "Linz";

  if (!isAustrianLocation(attrs, coords, postcode)) {
    throw new Error("Listing is outside Austria");
  }

  const images =
    advert.advertImageList?.advertImage
      ?.map((img) => img.mainImageUrl)
      .filter((url): url is string => Boolean(url)) ?? [];

  const sections: ListingDetailSection[] = [];
  for (const [key, values] of Object.entries(attrs)) {
    if (!key.startsWith("GENERAL_TEXT_ADVERT/")) continue;
    const html = values.join("");
    if (!html.trim()) continue;
    sections.push({
      title: sectionTitleFromKey(key),
      html,
    });
  }

  const highlights: Array<{ label: string; value: string }> = [
    { label: "Rooms", value: first(attrs.NUMBER_OF_ROOMS) ?? "—" },
    { label: "Living area", value: first(attrs["ESTATE_SIZE/LIVING_AREA"]) ? `${first(attrs["ESTATE_SIZE/LIVING_AREA"])} m²` : "—" },
    { label: "Floor", value: first(attrs.FLOOR) ?? "—" },
    { label: "Type", value: first(attrs.PROPERTY_TYPE) ?? "—" },
    { label: "Available from", value: first(attrs.AVAILABLE_DATE_FREETEXT) ?? "—" },
    { label: "Heating costs", value: first(attrs["RENTAL_PRICE/HEATINGCOSTSGROSS"]) ? `€ ${first(attrs["RENTAL_PRICE/HEATINGCOSTSGROSS"])}` : "—" },
    { label: "Additional costs", value: first(attrs["RENTAL_PRICE/ADDITIONAL_COST_GROSS"]) ? `€ ${first(attrs["RENTAL_PRICE/ADDITIONAL_COST_GROSS"])}` : "—" },
    { label: "Deposit", value: first(attrs["ADDITIONAL_COST/DEPOSIT"]) ? `€ ${first(attrs["ADDITIONAL_COST/DEPOSIT"])}` : "—" },
  ].filter((item) => item.value !== "—");

  const descriptionHtml = first(attrs.DESCRIPTION) ?? "";
  const description = stripHtml(descriptionHtml);
  const org = advert.organisationDetails;
  const monthlyCost = buildMonthlyCostFromAttributes(attrs, description, sections);

  return {
    id: advert.id,
    title: advert.description,
    description,
    descriptionHtml,
    price: parseNumber(first(attrs.PRICE)),
    priceDisplay: first(attrs.PRICE_FOR_DISPLAY) ?? "—",
    pricePerSqm: first(attrs["PRICE/SQUARE_METER_FOR_DISPLAY_WITH_UNIT"]) ?? null,
    rooms: parseNumber(first(attrs.NUMBER_OF_ROOMS)),
    area: parseNumber(first(attrs["ESTATE_SIZE/LIVING_AREA"])),
    floor: first(attrs.FLOOR) ?? null,
    propertyType: first(attrs.PROPERTY_TYPE) ?? null,
    address: [street, `${postcode} ${city}`.trim()].filter(Boolean).join(", "),
    postcode,
    city,
    district: addr?.district ?? null,
    lat: coords.lat,
    lng: coords.lng,
    url: shareUrl(advert),
    images,
    teaser:
      advert.teaserAttributes?.map((item) => ({
        value: item.value,
        postfix: item.postfix,
      })) ?? [],
    highlights,
    sections,
    contact: {
      name: first(attrs["CONTACT/NAME"]) ?? null,
      company: first(attrs["CONTACT/COMPANY"]) ?? org?.orgName ?? null,
      phone: first(attrs["CONTACT/PHONE"]) ?? org?.orgPhone ?? null,
      email: org?.orgEmail ?? null,
      website: first(attrs["CONTACT/URL"]) ?? null,
      address: [
        first(attrs["CONTACT/ADDRESS_STREET"]),
        first(attrs["CONTACT/ADDRESS_POSTCODE"]),
        first(attrs["CONTACT/ADDRESS_TOWN"]),
      ]
        .filter(Boolean)
        .join(", ") || null,
    },
    organisation: {
      name: org?.orgName ?? null,
      logoUrl: org?.orgLogoUrl ?? null,
      phone: org?.orgPhone ?? null,
      email: org?.orgEmail ?? null,
    },
    energy: {
      hwb: first(attrs.ENERGY_HWB) ?? null,
      hwbClass: first(attrs.ENERGY_HWB_CLASS) ?? null,
      fgee: first(attrs.ENERGY_FGEE) ?? null,
      fgeeClass: first(attrs.ENERGY_FGEE_CLASS) ?? null,
    },
    costs: {
      rent: first(attrs["RENTAL_PRICE/PER_MONTH_FOR_DISPLAY"]) ?? first(attrs.PRICE_FOR_DISPLAY) ?? null,
      heating: first(attrs["RENTAL_PRICE/HEATINGCOSTSGROSS"]) ? `€ ${first(attrs["RENTAL_PRICE/HEATINGCOSTSGROSS"])}` : null,
      additional: first(attrs["RENTAL_PRICE/ADDITIONAL_COST_GROSS"]) ? `€ ${first(attrs["RENTAL_PRICE/ADDITIONAL_COST_GROSS"])}` : null,
      deposit: first(attrs["ADDITIONAL_COST/DEPOSIT"]) ? `€ ${first(attrs["ADDITIONAL_COST/DEPOSIT"])}` : null,
    },
    monthlyCost,
    availableFrom: first(attrs.AVAILABLE_DATE_FREETEXT) ?? null,
    publishedDate: advert.publishedDate ?? null,
  };
}

export function buildSearchUrl(filters: SearchFilters = EMPTY_FILTERS): string {
  const params = new URLSearchParams({
    sfId: "f7861587-a57c-45ed-9e66-d2f4da46741c",
    isNavigation: "true",
    page: String(filters.page ?? 1),
  });

  if (filters.areaId) {
    params.set("areaId", filters.areaId);
  } else {
    params.set("areaId", APP_DEFAULT_AREA_ID);
  }
  if (filters.priceFrom) {
    params.set("PRICE_FROM", String(filters.priceFrom));
  }
  if (filters.priceTo) {
    params.set("PRICE_TO", String(filters.priceTo));
  }
  if (filters.areaMin) {
    params.set("ESTATE_SIZE/LIVING_AREA_FROM", String(filters.areaMin));
  }
  if (filters.areaMax) {
    params.set("ESTATE_SIZE/LIVING_AREA_TO", String(filters.areaMax));
  }

  if (filters.rooms?.length) {
    for (const room of filters.rooms) {
      params.append("NO_OF_ROOMS_BUCKET", `${room}X${room}`);
    }
  }

  return `${SEARCH_BASE}?${params.toString()}`;
}

async function fetchWillhabenHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`willhaben returned status ${response.status}`);
  }

  return response.text();
}

export async function fetchListings(
  filters: SearchFilters = EMPTY_FILTERS,
): Promise<Listing[]> {
  const listings: Listing[] = [];
  let page = filters.page ?? 1;
  const maxPages = 20;

  while (page <= maxPages) {
    const html = await fetchWillhabenHtml(buildSearchUrl({ ...filters, page }));
    const data = extractNextData(html);
    const batch = parseListingsFromPage(data);
    listings.push(...batch);

    const meta = extractSearchMeta(data);
    const fetched = listings.length;
    if (
      batch.length === 0 ||
      fetched >= meta.rowsFound ||
      meta.rowsReturned < 30
    ) {
      break;
    }

    page += 1;
  }

  const seen = new Set<string>();
  const unique = listings.filter((listing) => {
    if (seen.has(listing.id)) return false;
    seen.add(listing.id);
    return true;
  });

  if (!filters.rooms?.length) return unique;

  const allowedRooms = new Set(filters.rooms);
  return unique.filter(
    (listing) =>
      listing.rooms === null || allowedRooms.has(Math.round(listing.rooms)),
  );
}

export async function fetchListingDetail(id: string): Promise<ListingDetail> {
  const html = await fetchWillhabenHtml(
    `https://www.willhaben.at/iad/object?adId=${id}`,
  );
  const data = extractNextData(html);
  return parseDetailAdvert(extractDetailAdvert(data));
}

export function filtersFromSearchParams(
  params: URLSearchParams,
): SearchFilters {
  const roomsParam = params.get("rooms");
  const rooms = roomsParam
    ? roomsParam
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n) && n > 0)
    : undefined;

  return {
    areaId: params.get("areaId") ?? undefined,
    priceFrom: params.get("priceFrom")
      ? Number(params.get("priceFrom"))
      : undefined,
    priceTo: params.get("priceTo")
      ? Number(params.get("priceTo"))
      : undefined,
    areaMin: params.get("areaMin")
      ? Number(params.get("areaMin"))
      : undefined,
    areaMax: params.get("areaMax")
      ? Number(params.get("areaMax"))
      : undefined,
    rooms,
    page: params.get("page") ? Number(params.get("page")) : 1,
  };
}

export function searchParamsFromFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.areaId) params.set("areaId", filters.areaId);
  if (filters.priceFrom) params.set("priceFrom", String(filters.priceFrom));
  if (filters.priceTo) params.set("priceTo", String(filters.priceTo));
  if (filters.areaMin) params.set("areaMin", String(filters.areaMin));
  if (filters.areaMax) params.set("areaMax", String(filters.areaMax));
  if (filters.rooms?.length) params.set("rooms", filters.rooms.join(","));
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return params;
}
