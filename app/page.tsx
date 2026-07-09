import { cookies, headers } from "next/headers";
import AppShell from "./components/AppShell";
import { EMPTY_FILTERS, fetchListings, type Listing } from "@/lib/willhaben";
import {
  LOCALE_COOKIE,
  detectLocale,
  isAppLocale,
  type AppLocale,
} from "@/lib/locale";

export const revalidate = 3600;

async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie && isAppLocale(fromCookie)) {
    return fromCookie;
  }

  const headerStore = await headers();
  return detectLocale(headerStore.get("accept-language"));
}

export default async function Home() {
  const locale = await getLocale();
  let listings: Listing[] = [];

  try {
    listings = await fetchListings(EMPTY_FILTERS);
  } catch {
    listings = [];
  }

  return (
    <AppShell
      initialListings={listings}
      initialFilters={EMPTY_FILTERS}
      locale={locale}
    />
  );
}
