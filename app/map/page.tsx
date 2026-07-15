import { cookies, headers } from "next/headers";
import AppShell from "../components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getAustriaOverviewCity } from "@/lib/cities";
import { EMPTY_FILTERS } from "@/lib/willhaben";
import {
  LOCALE_COOKIE,
  detectLocale,
  isAppLocale,
  type AppLocale,
} from "@/lib/locale";

async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie && isAppLocale(fromCookie)) {
    return fromCookie;
  }

  const headerStore = await headers();
  return detectLocale(headerStore.get("accept-language"));
}

export default async function MapEntryPage() {
  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);

  return (
    <AppShell
      initialListings={[]}
      initialFilters={EMPTY_FILTERS}
      initialSource="apartments"
      locale={locale}
      city={getAustriaOverviewCity()}
      university={null}
      user={user}
      initialFiltersOpen
    />
  );
}
