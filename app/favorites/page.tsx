import { getCurrentUser } from "@/lib/auth";
import FavoritesClient from "./FavoritesClient";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  return <FavoritesClient user={user} />;
}
