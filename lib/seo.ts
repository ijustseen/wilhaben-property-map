import type { Metadata } from "next";
import { BRAND_NAME, BRAND_TAGLINE } from "./brand";
import { CITIES, type City } from "./cities";
import { siteUrl } from "./legal";
import type { University } from "./universities";
import { UNIVERSITIES } from "./universities";

const CORE_SEO_KEYWORDS = [
  "student accommodation Austria",
  "accommodation for students Austria",
  "student housing Austria",
  "student apartments Austria",
  "shared flats for students Austria",
  "WG room Austria",
  "shared flat Austria",
  "university housing map",
  "student dorm Austria",
  "willhaben student apartments",
  "WG gesucht students",
  "housing for international students Austria",
  "rent for students Austria",
  "semester accommodation Austria",
] as const;

function citySeoKeywords(city: City): string[] {
  const name = city.name;
  return [
    `accommodation for students ${name}`,
    `student accommodation ${name}`,
    `apartments for students ${name}`,
    `shared flats for students ${name}`,
    `student housing ${name}`,
    `WG room ${name}`,
  ];
}

function universitySeoKeywords(uni: University, city: City): string[] {
  const name = city.name;
  return [
    `apartments for ${uni.shortName} students`,
    `${uni.shortName} student accommodation`,
    `accommodation for ${uni.shortName} students`,
    `shared flats for ${uni.shortName} students`,
    `student housing ${uni.shortName}`,
    `accommodation for students ${name}`,
    `apartments for students ${name}`,
    `shared flats for students ${name}`,
    uni.name,
  ];
}

/** Merged keyword list for root layout metadata. */
export function buildGlobalSeoKeywords(): string[] {
  const keywords = new Set<string>(CORE_SEO_KEYWORDS);
  for (const city of CITIES.filter((entry) => entry.status === "available")) {
    for (const phrase of citySeoKeywords(city)) {
      keywords.add(phrase);
    }
  }
  for (const uni of UNIVERSITIES.filter((entry) => entry.status === "available")) {
    const city = CITIES.find((entry) => entry.id === uni.cityId);
    if (!city) continue;
    for (const phrase of universitySeoKeywords(uni, city)) {
      keywords.add(phrase);
    }
  }
  return [...keywords];
}

export const SEO_KEYWORDS = buildGlobalSeoKeywords();

/** Default social preview — replace with a 1200×630 PNG when available. */
export const DEFAULT_OG_IMAGE = "/map-preview.svg";

export function absoluteUrl(path = "/"): string {
  const base = siteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
  titleAbsolute = false,
  keywords,
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  titleAbsolute?: boolean;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(path);
  const displayTitle = titleAbsolute ? title : `${title} · ${BRAND_NAME}`;

  return {
    title: titleAbsolute ? { absolute: title } : title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    openGraph: {
      type: "website",
      locale: "en_AT",
      url,
      siteName: BRAND_NAME,
      title: displayTitle,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          alt: `${BRAND_NAME} — student housing map`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${BRAND_NAME} — Student accommodation maps in Austria`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "Free student accommodation map for Austria: apartments, shared flats (WG) and dorms near every major university. Find housing in Linz, Vienna, Graz, Innsbruck and more.",
  keywords: [...SEO_KEYWORDS],
  applicationName: BRAND_NAME,
  category: "real estate",
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl(),
  },
  openGraph: {
    type: "website",
    locale: "en_AT",
    url: siteUrl(),
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Student housing maps in Austria`,
    description: BRAND_TAGLINE,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        alt: `${BRAND_NAME} — student housing map of Austrian university cities`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Student housing maps in Austria`,
    description: BRAND_TAGLINE,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
};

export function homePageMetadata(): Metadata {
  return pageMetadata({
    title: "Student accommodation in Austria — apartments, WGs & dorms",
    description:
      "Accommodation for students across Austria: apartments for JKU, TU Wien, Uni Graz and every major campus. Shared flats, WGs and dorms on an interactive map with commute times to university.",
    path: "/",
    keywords: [
      "accommodation for students",
      "accommodation for students Austria",
      "student accommodation Austria",
      "apartments for students",
      "shared flats for students",
    ],
  });
}

export function mapEntryMetadata(): Metadata {
  return pageMetadata({
    title: "Student housing map — choose your university in Austria",
    description:
      "Interactive accommodation map for students in Austria. Filter apartments, shared flats (WG) and dorms by university, rent and rooms — Linz, Vienna, Graz, Salzburg, Innsbruck and more.",
    path: "/map",
    keywords: [
      "student housing map Austria",
      "university accommodation map",
      "accommodation for students Austria",
    ],
  });
}

export function cityMapMetadata(city: City, university?: University | null): Metadata {
  if (university) {
    const cityName = city.name;
    return pageMetadata({
      title: `${university.shortName} student accommodation — apartments & shared flats, ${cityName}`,
      description: `Apartments for ${university.shortName} students and accommodation near ${university.name} in ${cityName}, Austria. Browse shared flats (WG), dorms and rentals on a map — compare rent and commute to campus.`,
      path: `/map/${city.id}?university=${university.id}`,
      keywords: universitySeoKeywords(university, city),
    });
  }

  return pageMetadata({
    title: `Accommodation for students in ${city.name}, Austria`,
    description: `Student accommodation in ${city.name}: apartments, shared flats for students and dorms. ${city.blurb} Interactive map with filters for rent, rooms and housing type.`,
    path: `/map/${city.id}`,
    keywords: citySeoKeywords(city),
  });
}

export function buildHomeJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: BRAND_NAME,
        description: BRAND_TAGLINE,
        inLanguage: "en",
        publisher: { "@id": `${url}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${url}/map?{search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: BRAND_NAME,
        url,
        logo: absoluteUrl("/icon.png"),
        description: BRAND_TAGLINE,
      },
      {
        "@type": "WebApplication",
        "@id": `${url}/#app`,
        name: BRAND_NAME,
        url,
        applicationCategory: "RealEstateApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
        description: BRAND_TAGLINE,
      },
    ],
  };
}

export function buildCityMapJsonLd(city: City, university?: University | null) {
  const url = university
    ? absoluteUrl(`/map/${city.id}?university=${university.id}`)
    : absoluteUrl(`/map/${city.id}`);

  const items = [
    { name: "Home", item: siteUrl() },
    { name: "Map", item: absoluteUrl("/map") },
    { name: city.name, item: absoluteUrl(`/map/${city.id}`) },
  ];
  if (university) {
    items.push({ name: university.shortName, item: url });
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}/#webpage`,
        url,
        name: university
          ? `${university.shortName} student accommodation — ${city.name}, Austria`
          : `Accommodation for students — ${city.name}, Austria`,
        description: university
          ? `Apartments for ${university.shortName} students, shared flats and dorms in ${city.name}. ${university.blurb}`
          : `Student accommodation in ${city.name}: apartments, shared flats and dorms. ${city.blurb}`,
        isPartOf: { "@id": `${siteUrl()}/#website` },
        about: {
          "@type": "Place",
          name: city.name,
          address: {
            "@type": "PostalAddress",
            addressCountry: "AT",
            addressLocality: city.name,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: items.map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: entry.name,
          item: entry.item,
        })),
      },
    ],
  };
}

export function getSitemapEntries(): Array<{
  url: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}> {
  const now = new Date();
  const entries: Array<{
    url: string;
    lastModified: Date;
    changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority: number;
  }> = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/map"), lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: absoluteUrl("/impressum"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  for (const city of CITIES.filter((c) => c.status === "available")) {
    entries.push({
      url: absoluteUrl(`/map/${city.id}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  for (const uni of UNIVERSITIES.filter((u) => u.status === "available")) {
    entries.push({
      url: absoluteUrl(`/map/${uni.cityId}?university=${uni.id}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    });
  }

  return entries;
}
