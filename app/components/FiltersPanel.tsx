"use client";

import { useEffect, useState } from "react";
import { EMPTY_FILTERS, type SearchFilters } from "@/lib/willhaben";

type FiltersPanelProps = {
  open: boolean;
  filters: SearchFilters;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
};

const ROOM_OPTIONS = [1, 2, 3, 4, 5];

export default function FiltersPanel({
  open,
  filters,
  onClose,
  onApply,
}: FiltersPanelProps) {
  const [draft, setDraft] = useState<SearchFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  if (!open) return null;

  function toggleRoom(room: number) {
    setDraft((current) => {
      const rooms = new Set(current.rooms ?? []);
      if (rooms.has(room)) rooms.delete(room);
      else rooms.add(room);
      return { ...current, rooms: Array.from(rooms).sort() };
    });
  }

  function handleApply() {
    onApply({
      ...draft,
      areaId: draft.areaId?.trim() || undefined,
      rooms: draft.rooms?.length ? draft.rooms : undefined,
    });
    onClose();
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[5000] flex">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close filters"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
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
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="e.g. 4040"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Min rent (€)
              </label>
              <input
                type="number"
                min={0}
                value={draft.priceFrom ?? ""}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    priceFrom: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Max rent (€)
              </label>
              <input
                type="number"
                min={0}
                value={draft.priceTo ?? ""}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    priceTo: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Any"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Min area (m²)
              </label>
              <input
                type="number"
                min={0}
                value={draft.areaMin ?? ""}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    areaMin: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Max area (m²)
              </label>
              <input
                type="number"
                min={0}
                value={draft.areaMax ?? ""}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    areaMax: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Any"
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-zinc-700">Rooms</p>
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
                        ? "bg-[#78b41e] text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    {room}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-zinc-200 px-5 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-lg bg-[#78b41e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6aa019]"
          >
            Apply filters
          </button>
        </div>
      </aside>
    </div>
  );
}
