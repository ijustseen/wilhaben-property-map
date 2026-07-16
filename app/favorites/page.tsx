import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import FavoritesClient from "./FavoritesClient";

export const metadata: Metadata = pageMetadata({
  title: "Saved places",
  description: "Your saved student housing listings on StudiWohnkarte.",
  path: "/favorites",
  noIndex: true,
});

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  return <FavoritesClient user={user} />;
}
