import type { Metadata } from "next";
import { BRAND_NAME, BRAND_TAGLINE } from "./brand";
import { CITIES, type City } from "./cities";
import { siteUrl } from "./legal";
import type { University } from "./universities";
import { UNIVERSITIES } from "./universities";

export const SEO_KEYWORDS = [
  "student housing Austria",
  "student apartments Austria",
  "WG room Austria",
  "shared flat Austria",
  "university housing map",
  "willhaben student apartments",
  "WG gesucht",
  "student dorm Austria",
  "Linz student housing",
  "Vienna student housing",
  "Graz student housing",
  "Innsbruck student housing",
  "JKU housing",
  "TU Wien housing",
] as const;

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
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  titleAbsolute?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const displayTitle = titleAbsolute ? title : `${title} · ${BRAND_NAME}`;

  return {
    title: titleAbsolute ? { absolute: title } : title,
    description,
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
    default: `${BRAND_NAME} — Student housing maps in Austria`,
    template: `%s · ${BRAND_NAME}`,
  },
  description: BRAND_TAGLINE,
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
    title: "Student housing maps for Austrian universities",
    description:
      "Pick your university and explore apartments, shared flats (WG) and dorms on an interactive map. Compare rent, location and commute to campus in Linz, Vienna, Graz, Innsbruck and more.",
    path: "/",
  });
}

export function mapEntryMetadata(): Metadata {
  return pageMetadata({
    title: "Housing map — choose a university",
    description:
      "Open the interactive student housing map for Austria. Filter by university, rent, rooms and housing type — apartments, WGs and dorms.",
    path: "/map",
  });
}

export function cityMapMetadata(city: City, university?: University | null): Metadata {
  if (university) {
    const cityName = city.name;
    return pageMetadata({
      title: `${university.shortName} student housing — ${cityName}`,
      description: `Find apartments, WG rooms and dorms near ${university.name} in ${cityName}, Austria. ${university.blurb} Browse listings on a map with commute times to campus.`,
      path: `/map/${city.id}?university=${university.id}`,
    });
  }

  return pageMetadata({
    title: `Student housing map — ${city.name}, Austria`,
    description: `${city.blurb} Browse ${city.highlight} listings on an interactive map. Filter by rent, rooms and housing type for students in ${city.name}.`,
    path: `/map/${city.id}`,
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
          ? `${university.shortName} student housing — ${city.name}`
          : `Student housing — ${city.name}, Austria`,
        description: university?.blurb ?? city.blurb,
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
