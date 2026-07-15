import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
  type FavoriteItem,
} from "@/lib/favorites";
import type { ListingSource } from "@/lib/willhaben";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ favorites: [], authRequired: true });
  }
  const favorites = await listFavorites(user.id);
  return NextResponse.json({ favorites });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Log in to sync favorites" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<FavoriteItem>;
    if (!body.id || !body.source || !body.title || !body.priceDisplay) {
      return NextResponse.json({ error: "Incomplete favorite" }, { status: 400 });
    }

    const item: FavoriteItem = {
      id: String(body.id),
      source: body.source as ListingSource,
      cityId: body.cityId ?? "linz",
      title: String(body.title),
      priceDisplay: String(body.priceDisplay),
      address: String(body.address ?? ""),
      url: String(body.url ?? ""),
      imageUrl: body.imageUrl ?? null,
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      savedAt: new Date().toISOString(),
    };

    const favorites = await addFavorite(user.id, item);
    return NextResponse.json({ favorites });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save favorite";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Log in to sync favorites" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  const source = request.nextUrl.searchParams.get("source") as ListingSource | null;
  if (!id || !source) {
    return NextResponse.json({ error: "Missing id/source" }, { status: 400 });
  }

  const favorites = await removeFavorite(user.id, id, source);
  return NextResponse.json({ favorites });
}
