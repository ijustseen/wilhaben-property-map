import { NextRequest, NextResponse } from "next/server";
import { fetchWalkingRouteToJku } from "@/lib/routing";
import { getUniversity } from "@/lib/universities";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const universityId = request.nextUrl.searchParams.get("university");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 },
    );
  }

  const uni = universityId
    ? getUniversity(universityId)
    : getUniversity("jku");

  if (!uni) {
    return NextResponse.json({ error: "Unknown university" }, { status: 400 });
  }

  try {
    const route = await fetchWalkingRouteToJku(lat, lng, uni.lat, uni.lng);
    return NextResponse.json({
      route,
      destination: {
        id: uni.id,
        name: uni.name,
        shortName: uni.shortName,
        lat: uni.lat,
        lng: uni.lng,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
