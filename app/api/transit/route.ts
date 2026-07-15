import { NextRequest, NextResponse } from "next/server";
import { fetchTransitJourneyToCampus } from "@/lib/transit";
import { getUniversity } from "@/lib/universities";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const universityId = request.nextUrl.searchParams.get("university");
  const toLat = Number(request.nextUrl.searchParams.get("toLat"));
  const toLng = Number(request.nextUrl.searchParams.get("toLng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 },
    );
  }

  const uni = universityId ? getUniversity(universityId) : undefined;
  const destination = uni
    ? { lat: uni.lat, lng: uni.lng }
    : Number.isFinite(toLat) && Number.isFinite(toLng)
      ? { lat: toLat, lng: toLng }
      : null;

  if (!destination) {
    return NextResponse.json(
      { error: "university or toLat/toLng is required" },
      { status: 400 },
    );
  }

  try {
    const journey = await fetchTransitJourneyToCampus(lat, lng, destination);
    return NextResponse.json({
      journey,
      destination: uni
        ? { id: uni.id, name: uni.name, shortName: uni.shortName, ...destination }
        : destination,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
