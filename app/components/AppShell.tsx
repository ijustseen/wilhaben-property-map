"use client";

import { useCallback, useState } from "react";
import type { AppLocale } from "@/lib/locale";
import {
  EMPTY_FILTERS,
  type Listing,
  type ListingDetail,
  type SearchFilters,
  searchParamsFromFilters,
} from "@/lib/willhaben";
import FiltersPanel from "./FiltersPanel";
import ListingDetailPanel from "./ListingDetailPanel";
import MapView from "./MapView";

type AppShellProps = {
  initialListings: Listing[];
  initialFilters: SearchFilters;
  locale: AppLocale;
};

export default function AppShell({
  initialListings,
  initialFilters,
  locale,
}: AppShellProps) {
  const [listings, setListings] = useState(initialListings);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadListings = useCallback(async (nextFilters: SearchFilters) => {
    setLoadingListings(true);
    setListingsError(null);

    try {
      const params = searchParamsFromFilters(nextFilters);
      const response = await fetch(`/api/listings?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load listings");
      }
      setListings(data.listings);
      setFilters(nextFilters);
      setSelectedId(null);
      setDetail(null);
    } catch (e) {
      setListingsError(
        e instanceof Error ? e.message : "Failed to load listings",
      );
    } finally {
      setLoadingListings(false);
    }
  }, []);

  const loadDetail = useCallback(async (listing: Listing) => {
    setSelectedId(listing.id);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/listings/${listing.id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load listing");
      }
      setDetail(data.detail);
    } catch (e) {
      setDetail(null);
      setDetailError(
        e instanceof Error ? e.message : "Failed to load listing",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  function closeDetail() {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
  }

  const activeFilterCount = [
    filters.areaId,
    filters.priceFrom,
    filters.priceTo,
    filters.areaMin,
    filters.areaMax,
    filters.rooms?.length,
  ].filter(Boolean).length;

  return (
    <div className="flex h-screen flex-col bg-zinc-50">
      <header className="z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Linz Rentals Map
            </h1>
            <p className="text-sm text-zinc-500">
              Student rentals near JKU
              {filters.areaId
                ? ` · PLZ ${filters.areaId}`
                : " · Linz (4040)"}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#78b41e] px-2 py-0.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {loadingListings ? (
              <span className="text-zinc-500">Updating…</span>
            ) : listingsError ? (
              <span className="text-red-600">{listingsError}</span>
            ) : (
              <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700">
                {listings.length} listings
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <MapView
            listings={listings}
            selectedId={selectedId}
            onSelect={loadDetail}
          />
        </div>

        <div
          className={`absolute inset-y-0 right-0 z-[1000] flex w-full shadow-2xl lg:w-[45%] transition-transform duration-300 ease-out ${
            selectedId ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
        >
          {selectedId && (
            <ListingDetailPanel
              detail={detail}
              loading={detailLoading}
              error={detailError}
              locale={locale}
              onClose={closeDetail}
            />
          )}
        </div>
      </main>

      <FiltersPanel
        open={filtersOpen}
        filters={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={loadListings}
      />
    </div>
  );
}
