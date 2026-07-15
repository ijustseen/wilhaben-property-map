"use client";

import { useCallback, useEffect, useState } from "react";
import type { FavoriteItem } from "@/lib/favorites";
import type { ListingSource } from "@/lib/willhaben";

const STORAGE_KEY = "wohnkarte_favorites_v1";

function readLocal(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items: FavoriteItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function keyOf(id: string, source: ListingSource) {
  return `${source}:${id}`;
}

export function useFavorites(loggedIn: boolean) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (loggedIn) {
        try {
          const local = readLocal();
          const response = await fetch("/api/favorites");
          const data = await response.json();
          let server: FavoriteItem[] = data.favorites ?? [];

          // Merge device favorites into the account once after login.
          if (local.length > 0) {
            for (const item of local) {
              const exists = server.some(
                (fav) => fav.id === item.id && fav.source === item.source,
              );
              if (exists) continue;
              const post = await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
              });
              if (post.ok) {
                const body = await post.json();
                server = body.favorites ?? server;
              }
            }
            writeLocal([]);
          }

          if (!cancelled) setFavorites(server);
        } catch {
          if (!cancelled) setFavorites(readLocal());
        }
      } else if (!cancelled) {
        setFavorites(readLocal());
      }
      if (!cancelled) setReady(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  const isFavorite = useCallback(
    (id: string, source: ListingSource) =>
      favorites.some((item) => item.id === id && item.source === source),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (item: Omit<FavoriteItem, "savedAt">) => {
      const exists = favorites.some(
        (fav) => fav.id === item.id && fav.source === item.source,
      );

      if (loggedIn) {
        if (exists) {
          const response = await fetch(
            `/api/favorites?id=${encodeURIComponent(item.id)}&source=${item.source}`,
            { method: "DELETE" },
          );
          const data = await response.json();
          if (response.ok) setFavorites(data.favorites ?? []);
          return;
        }

        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        const data = await response.json();
        if (response.ok) {
          setFavorites(data.favorites ?? []);
        } else {
          // Fallback local if API fails
          const next = [
            { ...item, savedAt: new Date().toISOString() },
            ...favorites.filter(
              (fav) => keyOf(fav.id, fav.source) !== keyOf(item.id, item.source),
            ),
          ];
          writeLocal(next);
          setFavorites(next);
        }
        return;
      }

      const next = exists
        ? favorites.filter(
            (fav) => !(fav.id === item.id && fav.source === item.source),
          )
        : [
            { ...item, savedAt: new Date().toISOString() },
            ...favorites.filter(
              (fav) => keyOf(fav.id, fav.source) !== keyOf(item.id, item.source),
            ),
          ];
      writeLocal(next);
      setFavorites(next);
    },
    [favorites, loggedIn],
  );

  return { favorites, ready, isFavorite, toggleFavorite };
}
