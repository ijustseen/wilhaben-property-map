import type { FavoriteItem } from "./favorites";
import type { University } from "./universities";
import { getDefaultUniversityForCity } from "./universities";
import {
  EMPTY_FILTERS,
  filtersFromSearchParams,
  searchParamsFromFilters,
  type ListingSource,
  type SearchFilters,
} from "./willhaben";

const LISTING_SOURCES = new Set<ListingSource>([
  "apartments",
  "shared",
  "dorms",
]);

export type FocusListing = {
  id: string;
  source: ListingSource;
  url?: string;
};

const MAP_QUERY_KEYS = new Set([
  "university",
  "listing",
  "listingUrl",
  "source",
]);

export function mapCitySearchPath(
  uni: University,
  filters: SearchFilters = EMPTY_FILTERS,
  source: ListingSource = "apartments",
): string {
  const params = new URLSearchParams({ university: uni.id });
  if (source !== "apartments") {
    params.set("source", source);
  }
  const filterParams = searchParamsFromFilters(filters);
  for (const [key, value] of filterParams) {
    params.set(key, value);
  }
  return `/map/${uni.cityId}?${params.toString()}`;
}

export function mapFavoriteListingPath(item: FavoriteItem): string {
  const params = new URLSearchParams({ listing: item.id });
  if (item.source !== "apartments") {
    params.set("source", item.source);
  }
  if (item.source === "shared" && item.url) {
    params.set("listingUrl", item.url);
  }
  const uni = getDefaultUniversityForCity(item.cityId);
  if (uni) {
    params.set("university", uni.id);
  }
  return `/map/${item.cityId}?${params.toString()}`;
}

export function mapStateFromCitySearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): {
  filters: SearchFilters;
  source: ListingSource;
  focusListing: FocusListing | null;
} {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (MAP_QUERY_KEYS.has(key) || value == null) continue;
    params.set(key, Array.isArray(value) ? value[0] : value);
  }

  const sourceRaw =
    typeof searchParams.source === "string"
      ? searchParams.source
      : params.get("source");
  params.delete("source");
  const source = LISTING_SOURCES.has(sourceRaw as ListingSource)
    ? (sourceRaw as ListingSource)
    : "apartments";

  const listingId =
    typeof searchParams.listing === "string" ? searchParams.listing : null;
  const listingUrl =
    typeof searchParams.listingUrl === "string"
      ? searchParams.listingUrl
      : undefined;

  const focusListing = listingId
    ? { id: listingId, source, url: listingUrl }
    : null;

  return {
    filters: filtersFromSearchParams(params),
    source,
    focusListing,
  };
}
