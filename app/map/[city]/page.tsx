import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import AppShell from "../../components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getCity } from "@/lib/cities";
import {
  getDefaultUniversityForCity,
  getUniversity,
  getUniversitiesForCity,
} from "@/lib/universities";
import { EMPTY_FILTERS, fetchListings, type Listing } from "@/lib/willhaben";
import {
  LOCALE_COOKIE,
  detectLocale,
  isAppLocale,
  type AppLocale,
} from "@/lib/locale";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ university?: string }>;
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

export default async function CityMapPage({ params, searchParams }: PageProps) {
  const { city: cityId } = await params;
  const { university: universityParam } = await searchParams;
  const city = getCity(cityId);
  if (!city || city.status !== "available") {
    notFound();
  }

  const requested = universityParam
    ? getUniversity(universityParam)
    : undefined;
  const university =
    requested && requested.cityId === city.id && requested.status === "available"
      ? requested
      : getDefaultUniversityForCity(city.id);

  if (!university) {
    notFound();
  }

  // Ensure at least one live uni exists for this city
  if (
    getUniversitiesForCity(city.id).every((u) => u.status !== "available")
  ) {
    notFound();
  }

  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);
  let listings: Listing[] = [];

  try {
    listings = await fetchListings(EMPTY_FILTERS, cityId);
  } catch {
    listings = [];
  }

  return (
    <AppShell
      initialListings={listings}
      initialFilters={EMPTY_FILTERS}
      initialSource="apartments"
      locale={locale}
      city={city}
      university={university}
      user={user}
    />
  );
}
