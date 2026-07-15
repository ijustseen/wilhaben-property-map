import type { University } from "./universities";
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

export function mapStateFromCitySearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): { filters: SearchFilters; source: ListingSource } {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "university" || value == null) continue;
    params.set(key, Array.isArray(value) ? value[0] : value);
  }

  const sourceRaw = params.get("source");
  params.delete("source");
  const source = LISTING_SOURCES.has(sourceRaw as ListingSource)
    ? (sourceRaw as ListingSource)
    : "apartments";

  return {
    filters: filtersFromSearchParams(params),
    source,
  };
}
