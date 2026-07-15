import { promises as fs } from "fs";
import path from "path";
import type { ListingSource } from "@/lib/willhaben";

export type FavoriteItem = {
  id: string;
  source: ListingSource;
  cityId: string;
  title: string;
  priceDisplay: string;
  address: string;
  url: string;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  savedAt: string;
};

type FavoritesStore = {
  byUser: Record<string, FavoriteItem[]>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FAVORITES_FILE = path.join(DATA_DIR, "favorites.json");

async function readStore(): Promise<FavoritesStore> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(FAVORITES_FILE, "utf8");
    const parsed = JSON.parse(raw) as FavoritesStore;
    if (!parsed.byUser || typeof parsed.byUser !== "object") {
      return { byUser: {} };
    }
    return parsed;
  } catch {
    const empty: FavoritesStore = { byUser: {} };
    await fs.writeFile(FAVORITES_FILE, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

async function writeStore(store: FavoritesStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(store, null, 2), "utf8");
}

function favoriteKey(item: Pick<FavoriteItem, "id" | "source">): string {
  return `${item.source}:${item.id}`;
}

export async function listFavorites(userId: string): Promise<FavoriteItem[]> {
  const store = await readStore();
  return store.byUser[userId] ?? [];
}

export async function addFavorite(
  userId: string,
  item: FavoriteItem,
): Promise<FavoriteItem[]> {
  const store = await readStore();
  const current = store.byUser[userId] ?? [];
  const key = favoriteKey(item);
  const next = [
    item,
    ...current.filter((fav) => favoriteKey(fav) !== key),
  ].slice(0, 200);
  store.byUser[userId] = next;
  await writeStore(store);
  return next;
}

export async function removeFavorite(
  userId: string,
  id: string,
  source: ListingSource,
): Promise<FavoriteItem[]> {
  const store = await readStore();
  const current = store.byUser[userId] ?? [];
  const next = current.filter(
    (fav) => !(fav.id === id && fav.source === source),
  );
  store.byUser[userId] = next;
  await writeStore(store);
  return next;
}
