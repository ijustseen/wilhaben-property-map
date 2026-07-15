import { citySupportsSource } from "@/lib/cities";
import {
  cityIdForDorm,
  findCatalogDorm,
  getCatalogDorms,
  getDormsSourceUrl,
} from "@/lib/dorms-catalog";
import type { DormRecord } from "@/lib/dorms-types";
import type { Listing, ListingDetail, SearchFilters } from "@/lib/willhaben";

export type { DormRecord } from "@/lib/dorms-types";

export const DORMS_SOURCE_URL =
  "https://www.jku.at/campus/wohnen/studierendenheime/";

/**
 * All Studierendenheime in Linz from the official JKU housing page:
 * https://www.jku.at/campus/wohnen/studierendenheime/
 * — "Rund um den Campus" (4040) + "In und rund um Linz" (4020).
 * Hagenberg is excluded (outside Linz).
 */
export const LINZ_DORMS: DormRecord[] = [
  // --- Around JKU campus (4040) ---
  {
    id: "dorm-kepler",
    name: "Johannes Kepler Heim",
    address: "Altenberger Straße 74",
    postcode: "4040",
    city: "Linz",
    lat: 48.33705,
    lng: 14.32459,
    priceFrom: 280,
    priceTo: 450,
    rooms: 1,
    url: "https://www.jku.at/campus/wohnen/studierendenheime/",
    provider: "Johannes Kepler Heim",
    note: "JKU campus-area dormitory on Altenberger Straße.",
  },
  {
    id: "dorm-barbara",
    name: "WIST Barbara",
    address: "Johann-Wilhelm-Klein-Straße 70–72",
    postcode: "4040",
    city: "Linz",
    lat: 48.33649,
    lng: 14.31262,
    priceFrom: 280,
    priceTo: 420,
    rooms: 1,
    url: "https://wistooe.at/",
    provider: "WIST OÖ",
    note: "WIST dorm close to JKU campus.",
  },
  {
    id: "dorm-jaegerstaetter",
    name: "Studierendenheim Franz Jägerstätter (KHG Heim)",
    address: "Mengerstraße 23",
    postcode: "4040",
    city: "Linz",
    lat: 48.33566,
    lng: 14.31721,
    priceFrom: 300,
    priceTo: 450,
    rooms: 1,
    url: "https://www.dioezese-linz.at/institution/807510/wohnen/studierendenheime",
    provider: "KHG Linz",
    note: "Very close to JKU. International community focus.",
  },
  {
    id: "dorm-raab",
    name: 'Internationales Studentenzentrum "Julius Raab"',
    address: "Julius-Raab-Straße 10",
    postcode: "4040",
    city: "Linz",
    lat: 48.33126,
    lng: 14.32375,
    priceFrom: 280,
    priceTo: 430,
    rooms: 1,
    url: "https://www.studentenwerk.at/linz/",
    provider: "OÖ Studentenwerk",
    note: "~5 min walk to JKU. Large residence (~800 places).",
  },
  {
    id: "dorm-bonhoeffer",
    name: "Evangelisches Studentenheim Dietrich Bonhoeffer",
    address: "Julius-Raab-Straße 1–3",
    postcode: "4040",
    city: "Linz",
    lat: 48.32902,
    lng: 14.32223,
    priceFrom: 280,
    priceTo: 420,
    rooms: 1,
    url: "https://www.evang-heim-linz.at/",
    provider: "Evangelisches Studentenheim",
    note: "Near JKU / Urfahr. Single rooms with shared kitchens.",
  },
  {
    id: "dorm-neueheimat",
    name: 'Studentenzentrum "Neue Heimat Oberösterreich"',
    address: "Freistädterstraße 317",
    postcode: "4040",
    city: "Linz",
    lat: 48.32926,
    lng: 14.32114,
    priceFrom: 270,
    priceTo: 400,
    rooms: 1,
    url: "https://www.jku.at/campus/wohnen/studierendenheime/",
    provider: "Neue Heimat OÖ",
    note: "Campus-area student centre on Freistädterstraße.",
  },
  {
    id: "dorm-pulvermuehl",
    name: "Studentenheim Akademikerhilfe Pulvermühlstraße",
    address: "Pulvermühlstraße 41",
    postcode: "4040",
    city: "Linz",
    lat: 48.33212,
    lng: 14.30144,
    priceFrom: 320,
    priceTo: 480,
    rooms: 1,
    url: "https://www.akademikerhilfe.at/de/pulvermuehlstrasse/13",
    provider: "Akademikerhilfe",
    note: "Quiet Urfahr location; bus/bike to JKU.",
  },
  {
    id: "dorm-codomo",
    name: "Codomo Living (Peuerbachstraße)",
    address: "Peuerbachstraße 28",
    postcode: "4040",
    city: "Linz",
    lat: 48.31585,
    lng: 14.28616,
    priceFrom: 450,
    priceTo: 700,
    rooms: 1,
    url: "https://www.codomo.at/",
    provider: "Codomo Living",
    note: "Modern studios at Peuerbachstraße (listed by JKU; formerly Milestone).",
  },
  {
    id: "dorm-petrinum",
    name: "Studierendenheim Petrinum",
    address: "Petrinumstraße 12",
    postcode: "4040",
    city: "Linz",
    lat: 48.31997,
    lng: 14.27634,
    priceFrom: 280,
    priceTo: 400,
    rooms: 1,
    url: "https://www.dioezese-linz.at/",
    provider: "Petrinum",
    note: "International student dormitory in Urfahr.",
  },
  {
    id: "dorm-stuwo",
    name: "STUWO Linz",
    address: "Altenberger Straße 9",
    postcode: "4040",
    city: "Linz",
    lat: 48.33177,
    lng: 14.31721,
    priceFrom: 350,
    priceTo: 520,
    rooms: 1,
    url: "https://www.stuwo.at/studentenheime/linz/",
    provider: "STUWO",
    note: "Directly by JKU (south entrance). Studios and rooms; utilities usually included.",
  },
  // --- Elsewhere in Linz (mainly 4020) ---
  {
    id: "dorm-johanna",
    name: "WIST Johanna",
    address: "Kaisergasse 31",
    postcode: "4020",
    city: "Linz",
    lat: 48.30884,
    lng: 14.29581,
    priceFrom: 280,
    priceTo: 420,
    rooms: 1,
    url: "https://wistooe.at/haus-johanna/",
    provider: "WIST OÖ",
    note: "City-centre WIST dormitory (Haus Johanna).",
  },
  {
    id: "dorm-ernst",
    name: "WIST Ernst",
    address: "Prunerstraße 3a",
    postcode: "4020",
    city: "Linz",
    lat: 48.30698,
    lng: 14.29194,
    priceFrom: 280,
    priceTo: 400,
    rooms: 1,
    url: "https://wistooe.at/haus-ernst/",
    provider: "WIST OÖ",
    note: "Central Linz WIST dormitory (Haus Ernst).",
  },
  {
    id: "dorm-bruno",
    name: "WIST Bruno",
    address: "Garnisonstraße 15",
    postcode: "4020",
    city: "Linz",
    lat: 48.30233,
    lng: 14.31011,
    priceFrom: 280,
    priceTo: 420,
    rooms: 1,
    url: "https://wistooe.at/haus-bruno/",
    provider: "WIST OÖ",
    note: "City-side WIST dormitory (Haus Bruno).",
  },
  {
    id: "dorm-salesianum",
    name: "Studentenheim Salesianum",
    address: "Salesianumweg 5",
    postcode: "4020",
    city: "Linz",
    lat: 48.29685,
    lng: 14.27231,
    priceFrom: 280,
    priceTo: 410,
    rooms: 1,
    url: "https://www.dioezese-linz.at/",
    provider: "Salesianum",
    note: "Student residence on Salesianumweg.",
  },
  {
    id: "dorm-europahaus",
    name: "Studentenheim Europahaus",
    address: "Ziegeleistraße 78a",
    postcode: "4020",
    city: "Linz",
    lat: 48.29245,
    lng: 14.27357,
    priceFrom: 270,
    priceTo: 390,
    rooms: 1,
    url: "https://www.ooe-heimbauverein.at/",
    provider: "OÖ Heimbauverein",
    note: "Southwest Linz dormitory (Europahaus).",
  },
  {
    id: "dorm-guterhirte",
    name: "Junges Wohnen Guter Hirte",
    address: "Baumbachstraße 28",
    postcode: "4020",
    city: "Linz",
    lat: 48.30075,
    lng: 14.28245,
    priceFrom: 250,
    priceTo: 380,
    rooms: 1,
    url: "https://www.jku.at/campus/wohnen/studierendenheime/",
    provider: "Guter Hirte",
    note: "Schüler- und Studentenheim in central Linz.",
  },
  {
    id: "dorm-notburga",
    name: "Notburga Haus",
    address: "Karl-Wiser-Straße 11",
    postcode: "4020",
    city: "Linz",
    lat: 48.29596,
    lng: 14.28816,
    priceFrom: 250,
    priceTo: 380,
    rooms: 1,
    url: "https://www.jku.at/campus/wohnen/studierendenheime/",
    provider: "Notburga Haus",
    note: "Student residence on Karl-Wiser-Straße.",
  },
  {
    id: "dorm-kolping",
    name: "Kolpinghaus Linz",
    address: "Gesellenhausstraße 1–7",
    postcode: "4020",
    city: "Linz",
    lat: 48.29857,
    lng: 14.28927,
    priceFrom: 260,
    priceTo: 400,
    rooms: 1,
    url: "https://www.kolping-ooe.at/",
    provider: "Kolping",
    note: "Kolping residence near the city centre.",
  },
  {
    id: "dorm-froschberg",
    name: "Haus Froschberg 7",
    address: "Froschberg 7",
    postcode: "4020",
    city: "Linz",
    lat: 48.28978,
    lng: 14.28243,
    priceFrom: 270,
    priceTo: 390,
    rooms: 1,
    url: "https://www.ooe-heimbauverein.at/",
    provider: "OÖ Heimbauverein",
    note: "Froschberg residential home.",
  },
  {
    id: "dorm-gruenner",
    name: "Dr. Karl Grünner Haus",
    address: "Kaisergasse 33",
    postcode: "4020",
    city: "Linz",
    lat: 48.3092,
    lng: 14.29636,
    priceFrom: 280,
    priceTo: 400,
    rooms: 1,
    url: "https://www.ooe-heimbauverein.at/",
    provider: "OÖ Heimbauverein",
    note: "Next to WIST Johanna on Kaisergasse.",
  },
];

function dormsForCity(cityId: string): DormRecord[] {
  if (cityId === "linz") return LINZ_DORMS;
  return getCatalogDorms(cityId);
}

export function getDormsSourceUrlForCity(cityId: string): string {
  if (cityId === "linz") return DORMS_SOURCE_URL;
  return getDormsSourceUrl(cityId);
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function priceDisplay(dorm: DormRecord): string {
  if (dorm.priceFrom == null) return "—";
  if (dorm.priceTo != null && dorm.priceTo !== dorm.priceFrom) {
    return `${formatEuro(dorm.priceFrom)}–${formatEuro(dorm.priceTo)}`;
  }
  return formatEuro(dorm.priceFrom);
}

function matchesFilters(dorm: DormRecord, filters: SearchFilters): boolean {
  if (filters.areaId && dorm.postcode !== filters.areaId) return false;
  const price = dorm.priceFrom;
  if (filters.priceFrom != null && price != null && price < filters.priceFrom) {
    return false;
  }
  if (filters.priceTo != null && price != null && price > filters.priceTo) {
    return false;
  }
  if (filters.rooms?.length && dorm.rooms != null) {
    if (!filters.rooms.includes(dorm.rooms)) return false;
  }
  return true;
}

function toListing(dorm: DormRecord): Listing {
  const price = dorm.priceFrom;
  return {
    id: dorm.id,
    source: "dorms",
    title: dorm.name,
    price,
    priceDisplay: priceDisplay(dorm),
    monthlyCost: null,
    rooms: dorm.rooms,
    area: null,
    address: `${dorm.address}, ${dorm.postcode} ${dorm.city}`,
    postcode: dorm.postcode,
    city: dorm.city,
    lat: dorm.lat,
    lng: dorm.lng,
    url: dorm.url,
    imageUrl: null,
  };
}

export function fetchDormListings(
  filters: SearchFilters = {},
  cityId = "linz",
): Listing[] {
  if (!citySupportsSource(cityId, "dorms")) {
    return [];
  }

  return dormsForCity(cityId)
    .filter((dorm) => matchesFilters(dorm, filters))
    .map(toListing);
}

export function fetchDormDetail(id: string): ListingDetail {
  const dorm =
    LINZ_DORMS.find((item) => item.id === id) ?? findCatalogDorm(id);
  if (!dorm) {
    throw new Error("Dormitory not found");
  }

  const price = dorm.priceFrom;
  const listingPrice = priceDisplay(dorm);
  const sourceUrl = getDormsSourceUrlForCity(cityIdForDorm(dorm));

  return {
    id: dorm.id,
    source: "dorms",
    title: dorm.name,
    description: `${dorm.note}\n\nProvider: ${dorm.provider}.\nTypical monthly rent: ${listingPrice} (check the provider for current availability and exact pricing).`,
    descriptionHtml: `<p>${dorm.note}</p><p><strong>Provider:</strong> ${dorm.provider}</p><p>Typical monthly rent: ${listingPrice}. Availability and exact prices change — apply on the provider website.</p><p>Source: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${dorm.provider}</a>.</p>`,
    price,
    priceDisplay: listingPrice,
    pricePerSqm: null,
    rooms: dorm.rooms,
    area: null,
    floor: null,
    propertyType: "Studentenheim",
    address: `${dorm.address}, ${dorm.postcode} ${dorm.city}`,
    postcode: dorm.postcode,
    city: dorm.city,
    district: null,
    lat: dorm.lat,
    lng: dorm.lng,
    url: dorm.url,
    images: [],
    teaser: [
      { value: "Dorm", postfix: null },
      ...(dorm.priceFrom
        ? [{ value: `from ${formatEuro(dorm.priceFrom)}`, postfix: null }]
        : []),
    ],
    highlights: [
      { label: "Provider", value: dorm.provider },
      { label: "Typical rent", value: listingPrice },
      { label: "Postal code", value: dorm.postcode },
    ],
    sections: [
      {
        title: "About this dormitory",
        html: `<p>${dorm.note}</p><p>Curated student housing directory — not a live vacancy feed. Open the provider site to apply.</p>`,
      },
    ],
    contact: {
      name: dorm.provider,
      company: dorm.provider,
      phone: null,
      email: null,
      website: dorm.url,
      address: `${dorm.address}, ${dorm.postcode} ${dorm.city}`,
    },
    organisation: {
      name: dorm.provider,
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
      rent: listingPrice,
      heating: null,
      additional: null,
      deposit: null,
    },
    monthlyCost: null,
    availableFrom: null,
    publishedDate: null,
  };
}
