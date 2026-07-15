import { NextRequest, NextResponse } from "next/server";
import {
  citySupportsSource,
  getCity,
  getWillhabenSearchBase,
} from "@/lib/cities";
import { fetchDormListings, getDormsSourceUrlForCity } from "@/lib/dorms";
import {
  fetchListings,
  filtersFromSearchParams,
  searchParamsFromFilters,
  type ListingSource,
} from "@/lib/willhaben";
import { fetchWgListings } from "@/lib/wg-gesucht";

function parseSource(value: string | null): ListingSource {
  if (value === "shared") return "shared";
  if (value === "dorms") return "dorms";
  return "apartments";
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const source = parseSource(params.get("source"));
    const cityId = params.get("city") ?? "linz";
    const city = getCity(cityId);

    if (!city || city.status !== "available") {
      return NextResponse.json(
        { error: `City "${cityId}" is not available` },
        { status: 400 },
      );
    }

    if (!citySupportsSource(cityId, source)) {
      return NextResponse.json({
        listings: [],
        count: 0,
        source,
        filters: filtersFromSearchParams(params),
        cityId,
        sourceUrl: null,
        message:
          source === "dorms"
            ? "Dorm catalog is only available in Linz for now."
            : "WG listings are not configured for this city yet.",
      });
    }

    const filters = filtersFromSearchParams(params);

    const listings =
      source === "shared"
        ? await fetchWgListings(filters, cityId)
        : source === "dorms"
          ? fetchDormListings(filters, cityId)
          : await fetchListings(filters, cityId);

    const wg = city.wgGesucht;
    const sourceUrl =
      source === "shared" && wg
        ? `https://www.wg-gesucht.de/wg-zimmer-in-${wg.slug}.${wg.id}.0.1.0.html`
        : source === "dorms"
          ? getDormsSourceUrlForCity(cityId)
          : `${getWillhabenSearchBase(cityId)}?${searchParamsFromFilters(filters)}`;

    return NextResponse.json({
      listings,
      count: listings.length,
      source,
      filters,
      cityId,
      sourceUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
