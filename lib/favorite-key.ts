import type { ListingSource } from "./willhaben";

export function favoriteListingKey(
  id: string,
  source: ListingSource,
): string {
  return `${source}:${id}`;
}
