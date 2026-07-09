import { NextRequest, NextResponse } from "next/server";
import {
  fetchListings,
  filtersFromSearchParams,
  searchParamsFromFilters,
} from "@/lib/willhaben";

export async function GET(request: NextRequest) {
  try {
    const filters = filtersFromSearchParams(request.nextUrl.searchParams);
    const listings = await fetchListings(filters);
    return NextResponse.json({
      listings,
      count: listings.length,
      filters,
      sourceUrl: `https://www.willhaben.at/iad/immobilien/mietwohnungen/mietwohnung-angebote?${searchParamsFromFilters(filters)}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
