"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, Home } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import type { City } from "@/lib/cities";
import type { AppLocale } from "@/lib/locale";
import { BRAND_NAME } from "@/lib/brand";
import type { FavoriteItem } from "@/lib/favorites";
import { favoriteListingKey } from "@/lib/favorite-key";
import { mapCitySearchPath, type FocusListing } from "@/lib/map-search";
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
import HeaderBurgerMenu, { type BurgerNavItem } from "./HeaderBurgerMenu";
import ListingDetailPanel from "./ListingDetailPanel";
import MapView from "./MapView";
import { useCompactHeader } from "./useCompactHeader";
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
  initialFocusListing?: FocusListing | null;
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
  initialFocusListing = null,
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
  const compactHeader = useCompactHeader();

  const fetchListingDetail = useCallback(
    async (id: string, listingSource: ListingSource, url?: string) => {
      setSelectedId(id);
      setDetailLoading(true);
      setDetailError(null);

      try {
        const params = new URLSearchParams({ source: listingSource });
        if (listingSource === "shared" && url) {
          params.set("url", url);
        }
        const response = await fetch(
          `/api/listings/${id}?${params.toString()}`,
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
    },
    [],
  );

  const loadListings = useCallback(
    async (
      nextFilters: SearchFilters,
      nextSource: ListingSource,
      nextCityId: string,
      options?: { keepSelection?: boolean },
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
        if (!options?.keepSelection) {
          setSelectedId(null);
          setDetail(null);
        }
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

    let cancelled = false;

    async function bootstrap() {
      setLoadingListings(true);
      setListingsError(null);

      try {
        const params = searchParamsFromFilters(initialFilters);
        params.set("source", initialSource);
        params.set("city", city.id);
        const response = await fetch(`/api/listings?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load listings");
        }
        if (cancelled) return;

        setListings(data.listings);
        setFilters(initialFilters);
        setSource(initialSource);

        if (initialFocusListing && !cancelled) {
          const match = (data.listings as Listing[]).find(
            (listing) =>
              listing.id === initialFocusListing.id &&
              listing.source === initialFocusListing.source,
          );

          if (match) {
            await fetchListingDetail(match.id, match.source, match.url);
          } else {
            await fetchListingDetail(
              initialFocusListing.id,
              initialFocusListing.source,
              initialFocusListing.url,
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          setListingsError(
            e instanceof Error ? e.message : "Failed to load listings",
          );
        }
      } finally {
        if (!cancelled) setLoadingListings(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only bootstrap
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtersOpen]);

  useEffect(() => {
    if (!filtersOpen || !compactHeader) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [filtersOpen, compactHeader]);

  const filtersEmbeddedOpen = filtersOpen && !compactHeader;

  const loadDetail = useCallback(
    async (listing: Listing) => {
      await fetchListingDetail(listing.id, listing.source, listing.url);
    },
    [fetchListingDetail],
  );

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

  const mapFlyToCoords = useMemo(() => {
    if (!selectedId || !detail) return null;
    if (listings.some((listing) => listing.id === selectedId)) return null;
    if (!Number.isFinite(detail.lat) || !Number.isFinite(detail.lng)) {
      return null;
    }
    return { lat: detail.lat, lng: detail.lng };
  }, [selectedId, detail, listings]);

  const mapListings = useMemo(() => {
    if (!selectedId || !detail) return listings;
    if (
      listings.some(
        (listing) =>
          listing.id === selectedId && listing.source === detail.source,
      )
    ) {
      return listings;
    }
    if (!Number.isFinite(detail.lat) || !Number.isFinite(detail.lng)) {
      return listings;
    }

    return [
      ...listings,
      {
        id: detail.id,
        source: detail.source,
        title: detail.title,
        price: detail.price,
        priceDisplay: detail.priceDisplay,
        monthlyCost: null,
        rooms: detail.rooms,
        area: detail.area,
        address: detail.address,
        postcode: detail.postcode,
        city: detail.city,
        lat: detail.lat,
        lng: detail.lng,
        url: detail.url,
        imageUrl: detail.images[0] ?? null,
      },
    ];
  }, [listings, selectedId, detail]);

  const detailOpen = Boolean(selectedId && university);

  const listingsCountLabel =
    loadingListings
      ? "Updating…"
      : listingsError
        ? "Error"
        : isOverview && listings.length === 0
          ? "No listings yet"
          : `${listings.length.toLocaleString("de-AT")} listings`;

  const mapMenuItems = useMemo(() => {
    const mapPath = university
      ? `/map/${city.id}?university=${university.id}`
      : `/map/${city.id}`;
    const loginHref = `/login?next=${encodeURIComponent(mapPath)}`;
    const items: BurgerNavItem[] = [
      {
        type: "link" as const,
        href: "/",
        label: "Home",
        icon: <Home className="header-burger-item-icon" strokeWidth={2} aria-hidden />,
      },
      {
        type: "link" as const,
        href: "/favorites",
        label: "Saved listings",
        badge: favorites.length,
        icon: <Heart className="header-burger-item-icon" strokeWidth={2} aria-hidden />,
      },
    ];
    if (user) {
      items.push({
        type: "link" as const,
        href: "/profile",
        label: user.name.split(" ")[0],
      });
    } else {
      items.push({ type: "link" as const, href: loginHref, label: "Log in" });
      items.push({ type: "link" as const, href: "/register", label: "Sign up" });
    }
    return items;
  }, [city.id, favorites.length, university, user]);

  const favoriteKeys = useMemo(
    () =>
      new Set(
        favorites.map((item) => favoriteListingKey(item.id, item.source)),
      ),
    [favorites],
  );

  const handleFavoriteSelect = useCallback(
    (item: FavoriteItem) => {
      void fetchListingDetail(item.id, item.source, item.url);
    },
    [fetchListingDetail],
  );

  return (
    <div className="map-app-shell flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      <header
        className={`map-chrome z-20 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur${filtersEmbeddedOpen ? " map-chrome--filters-open" : ""}`}
      >
        <div className="map-chrome-inner">
          <Link href="/" className="map-chrome-brand" title={BRAND_NAME}>
            <span className="map-chrome-brand-full">{BRAND_NAME}</span>
            <span className="map-chrome-brand-short">StudiWohn</span>
          </Link>

          <div
            className={`map-search-host${filtersEmbeddedOpen ? " map-search-host--open" : ""}`}
          >
            <div
              className={`map-search-shell${filtersEmbeddedOpen ? " map-search-shell--open" : ""}`}
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
                className={`map-search${filtersEmbeddedOpen ? " map-search--open" : ""}`}
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
                aria-hidden={!filtersEmbeddedOpen}
              >
                <div className="map-search-expand-inner">
                  {filtersEmbeddedOpen && (
                    <FiltersPanel
                      variant="embedded"
                      open={filtersEmbeddedOpen}
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

          {compactHeader ? (
            <div className="map-chrome-menu">
              <HeaderBurgerMenu variant="map" items={mapMenuItems} />
            </div>
          ) : (
            <div className="map-chrome-actions">
              <Link
                href="/favorites"
                className="map-chrome-icon-btn map-chrome-icon-btn--saved"
                title="Saved listings"
              >
                <Heart
                  className="map-chrome-saved-icon"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="map-chrome-saved-label">Saved</span>
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
          )}
        </div>
        {listingsError && (
          <p className="map-chrome-error">{listingsError}</p>
        )}
      </header>

      <main
        className={`map-workspace min-h-0 flex-1 overflow-hidden${detailOpen ? " map-workspace--detail-open" : ""}`}
      >
        <div className="map-workspace-map">
          <MapView
            listings={mapListings}
            selectedId={selectedId}
            flyToCoords={mapFlyToCoords}
            layoutSplit={detailOpen}
            loading={loadingListings}
            mapLayer={mapLayer}
            city={city}
            university={university}
            favorites={favorites}
            favoriteKeys={favoriteKeys}
            onMapLayerChange={setMapLayer}
            onSelect={loadDetail}
            onFavoriteSelect={handleFavoriteSelect}
          />
        </div>

        <div
          className="map-workspace-detail"
          aria-hidden={!detailOpen}
        >
          {detailOpen && university && (
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

      {filtersEmbeddedOpen && (
        <button
          type="button"
          className="map-filters-backdrop"
          aria-label="Close filters"
          onClick={() => setFiltersOpen(false)}
        />
      )}

      {filtersOpen && compactHeader && (
        <FiltersPanel
          variant="modal"
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
  );
}
