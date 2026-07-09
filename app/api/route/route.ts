import { NextRequest, NextResponse } from "next/server";
import { JKU_LINZ } from "@/lib/jku";
import { fetchWalkingRouteToJku } from "@/lib/routing";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 },
    );
  }

  try {
    const route = await fetchWalkingRouteToJku(
      lat,
      lng,
      JKU_LINZ.lat,
      JKU_LINZ.lng,
    );
    return NextResponse.json({ route, destination: JKU_LINZ });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
