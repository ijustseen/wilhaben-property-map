import { cookies, headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "../../components/AppShell";
import JsonLd from "../../components/JsonLd";
import { getCurrentUser } from "@/lib/auth";
import { getCity } from "@/lib/cities";
import { mapStateFromCitySearchParams } from "@/lib/map-search";
import { buildCityMapJsonLd, cityMapMetadata } from "@/lib/seo";
import {
  getUniversity,
  getDefaultUniversityForCity,
  getUniversitiesForCity,
} from "@/lib/universities";
import {
  LOCALE_COOKIE,
  detectLocale,
  isAppLocale,
  type AppLocale,
} from "@/lib/locale";

type PageProps = {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie && isAppLocale(fromCookie)) {
    return fromCookie;
  }

  const headerStore = await headers();
  return detectLocale(headerStore.get("accept-language"));
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { city: cityId } = await params;
  const resolvedSearchParams = await searchParams;
  const city = getCity(cityId);
  if (!city || city.status !== "available") {
    return {};
  }

  const universityParam =
    typeof resolvedSearchParams.university === "string"
      ? resolvedSearchParams.university
      : undefined;
  const university = universityParam
    ? getUniversity(universityParam)
    : undefined;

  return cityMapMetadata(
    city,
    university &&
      university.cityId === city.id &&
      university.status === "available"
      ? university
      : null,
  );
}

export default async function CityMapPage({ params, searchParams }: PageProps) {
  const { city: cityId } = await params;
  const resolvedSearchParams = await searchParams;
  const universityParam =
    typeof resolvedSearchParams.university === "string"
      ? resolvedSearchParams.university
      : undefined;
  const { filters, source, focusListing } =
    mapStateFromCitySearchParams(resolvedSearchParams);
  const city = getCity(cityId);
  if (!city || city.status !== "available") {
    notFound();
  }

  const requested = universityParam
    ? getUniversity(universityParam)
    : focusListing
      ? getDefaultUniversityForCity(city.id)
      : undefined;
  const university =
    requested && requested.cityId === city.id && requested.status === "available"
      ? requested
      : null;

  if (universityParam && !university) {
    notFound();
  }

  if (
    getUniversitiesForCity(city.id).every((u) => u.status !== "available")
  ) {
    notFound();
  }

  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);

  return (
    <>
      <JsonLd data={buildCityMapJsonLd(city, university)} />
      <AppShell
        initialListings={[]}
        initialFilters={filters}
        initialSource={source}
        locale={locale}
        city={city}
        university={university}
        user={user}
        loadListingsOnMount
        initialFocusListing={focusListing}
      />
    </>
  );
}
