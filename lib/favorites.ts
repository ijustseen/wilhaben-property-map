import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
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

type FavoriteRow = {
  listing_id: string;
  source: string;
  city_id: string;
  title: string;
  price_display: string | null;
  address: string | null;
  url: string | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FAVORITES_FILE = path.join(DATA_DIR, "favorites.json");

function useDatabase(): boolean {
  return isSupabaseAdminConfigured();
}

function rowToFavorite(row: FavoriteRow): FavoriteItem {
  return {
    id: row.listing_id,
    source: row.source as ListingSource,
    cityId: row.city_id,
    title: row.title,
    priceDisplay: row.price_display ?? "",
    address: row.address ?? "",
    url: row.url ?? "",
    imageUrl: row.image_url,
    lat: row.lat,
    lng: row.lng,
    savedAt: row.created_at,
  };
}

function favoriteToRow(
  userId: string,
  item: FavoriteItem,
): Omit<FavoriteRow, "created_at"> & { user_id: string; created_at: string } {
  return {
    user_id: userId,
    listing_id: item.id,
    source: item.source,
    city_id: item.cityId,
    title: item.title,
    price_display: item.priceDisplay,
    address: item.address,
    url: item.url,
    image_url: item.imageUrl,
    lat: item.lat,
    lng: item.lng,
    created_at: item.savedAt,
  };
}

async function readJsonStore(): Promise<FavoritesStore> {
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

async function writeJsonStore(store: FavoritesStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(store, null, 2), "utf8");
}

function favoriteKey(item: Pick<FavoriteItem, "id" | "source">): string {
  return `${item.source}:${item.id}`;
}

async function listFavoritesDb(userId: string): Promise<FavoriteItem[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("app_favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as FavoriteRow[]).map(rowToFavorite);
}

export async function listFavorites(userId: string): Promise<FavoriteItem[]> {
  if (useDatabase()) return listFavoritesDb(userId);
  const store = await readJsonStore();
  return store.byUser[userId] ?? [];
}

export async function addFavorite(
  userId: string,
  item: FavoriteItem,
): Promise<FavoriteItem[]> {
  if (useDatabase()) {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("Database not configured");
    const { error } = await admin.from("app_favorites").upsert(
      favoriteToRow(userId, item),
      { onConflict: "user_id,listing_id,source" },
    );
    if (error) throw new Error(error.message);
    return listFavoritesDb(userId);
  }

  const store = await readJsonStore();
  const current = store.byUser[userId] ?? [];
  const key = favoriteKey(item);
  const next = [
    item,
    ...current.filter((fav) => favoriteKey(fav) !== key),
  ].slice(0, 200);
  store.byUser[userId] = next;
  await writeJsonStore(store);
  return next;
}

export async function removeFavorite(
  userId: string,
  id: string,
  source: ListingSource,
): Promise<FavoriteItem[]> {
  if (useDatabase()) {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("Database not configured");
    const { error } = await admin
      .from("app_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", id)
      .eq("source", source);
    if (error) throw new Error(error.message);
    return listFavoritesDb(userId);
  }

  const store = await readJsonStore();
  const current = store.byUser[userId] ?? [];
  const next = current.filter(
    (fav) => !(fav.id === id && fav.source === source),
  );
  store.byUser[userId] = next;
  await writeJsonStore(store);
  return next;
}
