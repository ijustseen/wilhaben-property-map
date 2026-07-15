"use client";

import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import { useFavorites } from "../components/useFavorites";
import type { AuthUser } from "@/lib/auth";
import { MAP_ENTRY_PATH } from "@/lib/universities";

const SOURCE_LABEL = {
  apartments: "Apartment",
  shared: "Shared flat",
  dorms: "Dorm",
} as const;

type FavoritesClientProps = {
  user: AuthUser | null;
};

export default function FavoritesClient({ user }: FavoritesClientProps) {
  const { favorites, ready, toggleFavorite } = useFavorites(Boolean(user));

  return (
    <div className="min-h-svh bg-[var(--background)]">
      <SiteHeader user={user} variant="solid" />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)]">
          Saved places
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Shortlist housing while you compare commute, rent and room mates.
          {user
            ? " Synced to your account."
            : " Stored on this device — sign in to keep them across browsers."}
        </p>

        {!ready ? (
          <p className="mt-10 text-sm text-[var(--muted)]">Loading…</p>
        ) : favorites.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
            <p className="text-[var(--ink)]">No saved listings yet.</p>
            <Link
              href={MAP_ENTRY_PATH}
              className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              Browse the housing map
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {favorites.map((item) => (
              <li
                key={`${item.source}:${item.id}`}
                className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-24 w-28 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-xl bg-[var(--mist)] text-xs text-[var(--muted)]">
                    No photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {SOURCE_LABEL[item.source]}
                  </p>
                  <h2 className="truncate font-semibold text-[var(--ink)]">
                    {item.title}
                  </h2>
                  <p className="truncate text-sm text-[var(--muted)]">
                    {item.address}
                  </p>
                  <p className="mt-1 font-bold text-[var(--ink)]">
                    {item.priceDisplay}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/map/${item.cityId}`}
                      className="text-sm font-semibold text-[var(--link)] hover:underline"
                    >
                      Open on map
                    </Link>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[var(--link)] hover:underline"
                      >
                        Source
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void toggleFavorite(item)}
                      className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
