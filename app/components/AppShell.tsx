"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth";
import type { City } from "@/lib/cities";
import type { AppLocale } from "@/lib/locale";
import { BRAND_NAME } from "@/lib/brand";
import { mapCitySearchPath } from "@/lib/map-search";
import { MAP_ENTRY_PATH, type University } from "@/lib/universities";
import {
  type Listing,
  type ListingDetail,
  type ListingSource,
  type SearchFilters,
  searchParamsFromFilters,
} from "@/lib/willhaben";
import type { MapLayerId } from "@/lib/map-layers";
import FiltersPanel from "./FiltersPanel";
import ListingDetailPanel from "./ListingDetailPanel";
import MapView from "./MapView";
import { useFavorites } from "./useFavorites";

type AppShellProps = {
  initialListings: Listing[];
  initialFilters: SearchFilters;
  initialSource: ListingSource;
  locale: AppLocale;
  city: City;
  university: University | null;
  user: AuthUser | null;
  initialFiltersOpen?: boolean;
  loadListingsOnMount?: boolean;
};

const SOURCE_LABEL: Record<ListingSource, string> = {
  apartments: "Apartments",
  shared: "Shared flats",
  dorms: "Dorms",
};

export default function AppShell({
  initialListings,
  initialFilters,
  initialSource,
  locale,
  city: initialCity,
  university: initialUniversity,
  user,
  initialFiltersOpen = false,
  loadListingsOnMount = false,
}: AppShellProps) {
  const router = useRouter();
  const city = initialCity;
  const isOverview = city.id === "austria";
  const [university, setUniversity] = useState(initialUniversity);
  const [source, setSource] = useState<ListingSource>(initialSource);
  const [listings, setListings] = useState(initialListings);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(initialFiltersOpen);
  const [loadingListings, setLoadingListings] = useState(loadListingsOnMount);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayerId>("streets");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const { favorites, isFavorite, toggleFavorite } = useFavorites(Boolean(user));

  const loadListings = useCallback(
    async (
      nextFilters: SearchFilters,
      nextSource: ListingSource,
      nextCityId: string,
    ) => {
      setLoadingListings(true);
      setListingsError(null);

      try {
        const params = searchParamsFromFilters(nextFilters);
        params.set("source", nextSource);
        params.set("city", nextCityId);
        const response = await fetch(`/api/listings?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load listings");
        }
        setListings(data.listings);
        setFilters(nextFilters);
        setSource(nextSource);
        setSelectedId(null);
        setDetail(null);
      } catch (e) {
        setListingsError(
          e instanceof Error ? e.message : "Failed to load listings",
        );
      } finally {
        setLoadingListings(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!loadListingsOnMount || isOverview) return;
    void loadListings(initialFilters, initialSource, city.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only city bootstrap
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtersOpen]);

  const loadDetail = useCallback(async (listing: Listing) => {
    setSelectedId(listing.id);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const params = new URLSearchParams({ source: listing.source });
      if (listing.source === "shared" && listing.url) {
        params.set("url", listing.url);
      }
      const response = await fetch(
        `/api/listings/${listing.id}?${params.toString()}`,
      );
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

  function handleApply(
    nextFilters: SearchFilters,
    nextSource: ListingSource,
    nextUniversity: University,
  ) {
    if (nextUniversity.status === "soon") {
      if (!isOverview) {
        void loadListings(nextFilters, nextSource, city.id);
      }
      return;
    }

    const path = mapCitySearchPath(nextUniversity, nextFilters, nextSource);

    if (isOverview || nextUniversity.cityId !== city.id) {
      router.push(path);
      return;
    }

    setUniversity(nextUniversity);
    router.replace(path, { scroll: false });
    void loadListings(nextFilters, nextSource, city.id);
  }

  const activeFilterCount = [
    filters.areaId,
    filters.priceFrom,
    filters.priceTo,
    filters.areaMin,
    filters.areaMax,
    filters.rooms?.length,
  ].filter(Boolean).length;

  const searchSummary = [
    SOURCE_LABEL[source],
    filters.priceTo ? `to €${filters.priceTo}` : null,
    filters.areaId ? `PLZ ${filters.areaId}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const listingsCountLabel =
    loadingListings
      ? "Updating…"
      : listingsError
        ? "Error"
        : isOverview && listings.length === 0
          ? "No listings yet"
          : `${listings.length.toLocaleString("de-AT")} listings`;

  return (
    <div className="flex h-screen flex-col bg-[var(--background)]">
      <header
        className={`map-chrome z-20 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur${filtersOpen ? " map-chrome--filters-open" : ""}`}
      >
        <div className="map-chrome-inner">
          <Link href="/" className="map-chrome-brand" title="Home">
            {BRAND_NAME}
          </Link>

          <div
            className={`map-search-host${filtersOpen ? " map-search-host--open" : ""}`}
          >
            <div
              className={`map-search-shell${filtersOpen ? " map-search-shell--open" : ""}`}
            >
              <div
                role={filtersOpen ? undefined : "button"}
                tabIndex={filtersOpen ? -1 : 0}
                onClick={filtersOpen ? undefined : () => setFiltersOpen(true)}
                onKeyDown={
                  filtersOpen
                    ? undefined
                    : (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setFiltersOpen(true);
                        }
                      }
                }
                className={`map-search${filtersOpen ? " map-search--open" : ""}`}
                aria-label={
                  filtersOpen ? "Search and filters" : "Open search and filters"
                }
                aria-expanded={filtersOpen}
              >
                <span className="map-search-icon" aria-hidden>
                  ⌕
                </span>
                <span className="map-search-text">
                  <span className="map-search-title">
                    {university ? (
                      <>
                        {university.shortName}
                        <span className="map-search-sep">·</span>
                        {city.name}
                      </>
                    ) : isOverview ? (
                      "Austria"
                    ) : (
                      city.name
                    )}
                  </span>
                  <span className="map-search-sub">
                    {isOverview
                      ? "Choose university and filters"
                      : university
                        ? searchSummary || "Add rent, rooms or housing type"
                        : "Choose a university to see campus on the map"}
                  </span>
                </span>
                <span className="map-search-count" aria-live="polite">
                  {listingsCountLabel}
                </span>
                {filtersOpen ? (
                  <button
                    type="button"
                    className="map-search-filter-icon"
                    aria-label="Close filters"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiltersOpen(false);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <span className="map-search-filter-icon" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7h16M7 12h10M10 17h4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                )}
                {activeFilterCount > 0 && (
                  <span className="map-search-badge">{activeFilterCount}</span>
                )}
              </div>

              <div
                className="map-search-expand"
                aria-hidden={!filtersOpen}
              >
                <div className="map-search-expand-inner">
                  {filtersOpen && (
                    <FiltersPanel
                      variant="embedded"
                      open={filtersOpen}
                      filters={filters}
                      source={source}
                      university={university}
                      postcodeHint={city.postcodeHint}
                      listingsCountLabel={listingsCountLabel}
                      onClose={() => setFiltersOpen(false)}
                      onApply={handleApply}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="map-chrome-actions">
            <Link href="/favorites" className="map-chrome-icon-btn" title="Saved">
              Saved
              {favorites.length > 0 ? (
                <span className="map-chrome-dot">{favorites.length}</span>
              ) : null}
            </Link>
            <Link
              href={user ? "/profile" : `/login?next=${MAP_ENTRY_PATH}`}
              className="map-chrome-avatar"
              title={user ? user.name : "Log in"}
            >
              {user ? user.name.slice(0, 1).toUpperCase() : "↑"}
            </Link>
          </div>
        </div>
        {listingsError && (
          <p className="map-chrome-error">{listingsError}</p>
        )}
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <MapView
            listings={listings}
            selectedId={selectedId}
            loading={loadingListings}
            mapLayer={mapLayer}
            city={city}
            university={university}
            onMapLayerChange={setMapLayer}
            onSelect={loadDetail}
          />
        </div>

        <div
          className={`absolute inset-y-0 right-0 z-[1000] flex w-full shadow-2xl transition-transform duration-300 ease-out lg:w-[45%] ${
            selectedId
              ? "translate-x-0"
              : "pointer-events-none translate-x-full"
          }`}
        >
          {selectedId && university && (
            <ListingDetailPanel
              detail={detail}
              loading={detailLoading}
              error={detailError}
              locale={locale}
              university={university}
              favorited={
                detail ? isFavorite(detail.id, detail.source) : false
              }
              onToggleFavorite={() => {
                if (!detail) return;
                void toggleFavorite({
                  id: detail.id,
                  source: detail.source,
                  cityId: city.id,
                  title: detail.title,
                  priceDisplay: detail.priceDisplay,
                  address: detail.address,
                  url: detail.url,
                  imageUrl: detail.images[0] ?? null,
                  lat: detail.lat,
                  lng: detail.lng,
                });
              }}
              onClose={closeDetail}
            />
          )}
        </div>
      </main>

      {filtersOpen && (
        <button
          type="button"
          className="map-filters-backdrop"
          aria-label="Close filters"
          onClick={() => setFiltersOpen(false)}
        />
      )}
    </div>
  );
}
