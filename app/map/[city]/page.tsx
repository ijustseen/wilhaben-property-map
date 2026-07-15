import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import AppShell from "../../components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getCity } from "@/lib/cities";
import { mapStateFromCitySearchParams } from "@/lib/map-search";
import {
  getUniversity,
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

export default async function CityMapPage({ params, searchParams }: PageProps) {
  const { city: cityId } = await params;
  const resolvedSearchParams = await searchParams;
  const universityParam =
    typeof resolvedSearchParams.university === "string"
      ? resolvedSearchParams.university
      : undefined;
  const { filters, source } = mapStateFromCitySearchParams(resolvedSearchParams);
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
    <AppShell
      initialListings={[]}
      initialFilters={filters}
      initialSource={source}
      locale={locale}
      city={city}
      university={university}
      user={user}
      loadListingsOnMount
    />
  );
}
