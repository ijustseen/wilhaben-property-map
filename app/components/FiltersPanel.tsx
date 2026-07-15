"use client";

import { useEffect, useMemo, useState } from "react";
import { citySupportsSource, getCity } from "@/lib/cities";
import {
  searchUniversities,
  UNIVERSITIES,
  type University,
} from "@/lib/universities";
import {
  EMPTY_FILTERS,
  type ListingSource,
  type SearchFilters,
} from "@/lib/willhaben";

type FiltersPanelProps = {
  open: boolean;
  filters: SearchFilters;
  source: ListingSource;
  university: University | null;
  postcodeHint?: string;
  listingsCountLabel: string;
  onClose: () => void;
  onApply: (
    filters: SearchFilters,
    source: ListingSource,
    university: University,
  ) => void;
};

const ROOM_OPTIONS = [1, 2, 3, 4, 5];

const SOURCES: Array<{ id: ListingSource; label: string; hint: string }> = [
  { id: "apartments", label: "Apartments", hint: "willhaben flats" },
  { id: "shared", label: "Shared flats", hint: "WG rooms" },
  { id: "dorms", label: "Dorms", hint: "Studentenheime" },
];

export default function FiltersPanel({
  open,
  filters,
  source,
  university,
  postcodeHint,
  listingsCountLabel,
  onClose,
  onApply,
}: FiltersPanelProps) {
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const [draftSource, setDraftSource] = useState<ListingSource>(source);
  const [draftUniversity, setDraftUniversity] = useState<University | null>(
    university,
  );
  const [uniQuery, setUniQuery] = useState("");
  const [uniFocused, setUniFocused] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(filters);
      setDraftSource(source);
      setDraftUniversity(university);
      setUniQuery("");
      setUniFocused(false);
    }
  }, [open, filters, source, university]);

  const uniMatches = useMemo(() => {
    const q = uniQuery.trim();
    const available = UNIVERSITIES.filter((u) => u.status === "available");
    if (!q) return available;
    return searchUniversities(q)
      .filter((u) => u.status === "available")
      .slice(0, 8);
  }, [uniQuery]);

  if (!open) return null;

  const draftCity = draftUniversity ? getCity(draftUniversity.cityId) : null;

  function toggleRoom(room: number) {
    setDraft((current) => {
      const rooms = new Set(current.rooms ?? []);
      if (rooms.has(room)) rooms.delete(room);
      else rooms.add(room);
      return { ...current, rooms: Array.from(rooms).sort() };
    });
  }

  function handleApply() {
    if (!draftUniversity) return;
    onApply(
      {
        ...draft,
        areaId: draft.areaId?.trim() || undefined,
        rooms: draft.rooms?.length ? draft.rooms : undefined,
      },
      draftSource,
      draftUniversity,
    );
    onClose();
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS);
    setDraftSource("apartments");
    setDraftUniversity(university);
    setUniQuery("");
    if (university) {
      onApply(EMPTY_FILTERS, "apartments", university);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[5000] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close filters"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        <div className="filters-panel-head">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Search</h2>
            <p className="text-xs text-[var(--muted)]">
              University, housing type and rent
            </p>
          </div>
          <p className="filters-panel-count" aria-live="polite">
            {listingsCountLabel}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--mist)]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
              University
            </label>
            <div className="relative">
              <input
                type="search"
                value={
                  uniFocused
                    ? uniQuery
                    : draftUniversity
                      ? `${draftUniversity.shortName} · ${draftCity?.name ?? ""}`
                      : ""
                }
                placeholder="Choose a university…"
                onFocus={(e) => {
                  setUniFocused(true);
                  setUniQuery("");
                  // Select-all feel: empty field ready to type
                  requestAnimationFrame(() => e.target.select());
                }}
                onBlur={() => {
                  window.setTimeout(() => setUniFocused(false), 150);
                }}
                onChange={(e) => setUniQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
                aria-label="Search university"
                autoComplete="off"
              />
            </div>

            {(uniFocused || uniQuery) && (
              <ul className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                {uniMatches.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-[var(--muted)]">
                    No universities found
                  </li>
                ) : (
                  uniMatches.map((uni) => {
                    const city = getCity(uni.cityId);
                    const active = draftUniversity?.id === uni.id;
                    return (
                      <li key={uni.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setDraftUniversity(uni);
                            setUniQuery("");
                            setUniFocused(false);
                          }}
                          className={`flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-[var(--mist)] ${
                            active ? "bg-[var(--accent-soft)]" : ""
                          }`}
                        >
                          <span>
                            <span className="block font-semibold text-[var(--ink)]">
                              {uni.name}
                            </span>
                            <span className="block text-xs text-[var(--muted)]">
                              {uni.shortName} · {city?.name}
                              {uni.status === "soon" ? " · coming soon" : ""}
                            </span>
                          </span>
                          {active && (
                            <span className="text-xs font-bold text-[var(--accent-strong)]">
                              Selected
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            )}

            {draftUniversity?.status === "soon" && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                {draftUniversity.shortName} isn&apos;t live yet — apply will keep
                your current city map if needed.
              </p>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-[var(--ink)]">
              Housing type
            </p>
            <div className="space-y-2">
              {SOURCES.map((item) => {
                const supported = draftUniversity
                  ? citySupportsSource(draftUniversity.cityId, item.id)
                  : false;
                const active = draftSource === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!supported}
                    onClick={() => supported && setDraftSource(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      !supported
                        ? "cursor-not-allowed border-[var(--line)] opacity-45"
                        : active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--line)] hover:bg-[var(--mist)]"
                    }`}
                  >
                    <span>
                      <span className="block font-semibold text-[var(--ink)]">
                        {item.label}
                      </span>
                      <span className="block text-xs text-[var(--muted)]">
                        {supported
                          ? item.hint
                          : item.id === "dorms"
                            ? "No dorm catalog for this city"
                            : "Not available in this city yet"}
                      </span>
                    </span>
                    {active && (
                      <span className="text-xs font-bold text-[var(--accent-strong)]">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
              Postal code
            </label>
            <input
              type="text"
              value={draft.areaId ?? ""}
              onChange={(e) =>
                setDraft((current) => ({
                  ...current,
                  areaId: e.target.value || undefined,
                }))
              }
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
              placeholder={
                (postcodeHint ?? draftCity?.postcodeHint)
                  ? `Optional · e.g. ${postcodeHint ?? draftCity?.postcodeHint}`
                  : "Optional postal code"
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
                Min rent (€)
              </label>
              <input
                type="number"
                min={0}
                value={draft.priceFrom ?? ""}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    priceFrom: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
                Max rent (€)
              </label>
              <input
                type="number"
                min={0}
                value={draft.priceTo ?? ""}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    priceTo: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                placeholder="Any"
              />
            </div>
          </div>

          {draftSource !== "dorms" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
                  Min area (m²)
                </label>
                <input
                  type="number"
                  min={0}
                  value={draft.areaMin ?? ""}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      areaMin: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                  placeholder="Any"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
                  Max area (m²)
                </label>
                <input
                  type="number"
                  min={0}
                  value={draft.areaMax ?? ""}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      areaMax: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                  placeholder="Any"
                />
              </div>
            </div>
          )}

          <div>
            <p className="mb-3 text-sm font-medium text-[var(--ink)]">
              {draftSource === "shared"
                ? "Flatshare size"
                : draftSource === "dorms"
                  ? "Room type"
                  : "Rooms"}
            </p>
            <div className="flex flex-wrap gap-2">
              {ROOM_OPTIONS.map((room) => {
                const active = draft.rooms?.includes(room);
                return (
                  <button
                    key={room}
                    type="button"
                    onClick={() => toggleRoom(room)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--mist)] text-[var(--ink)] hover:bg-[var(--line)]"
                    }`}
                  >
                    {draftSource === "shared"
                      ? `${room}er WG`
                      : draftSource === "dorms"
                        ? room === 1
                          ? "Single"
                          : `${room}`
                        : room}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[var(--line)] px-5 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--mist)]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!draftUniversity}
            className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Show results
          </button>
        </div>
      </aside>
    </div>
  );
}
