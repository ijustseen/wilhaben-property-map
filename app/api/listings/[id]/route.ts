import { NextRequest, NextResponse } from "next/server";
import { fetchDormDetail } from "@/lib/dorms";
import { fetchListingDetail } from "@/lib/willhaben";
import { fetchWgListingDetail } from "@/lib/wg-gesucht";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const source = request.nextUrl.searchParams.get("source");
    const url = request.nextUrl.searchParams.get("url");

    const detail =
      source === "shared"
        ? await fetchWgListingDetail(id, url)
        : source === "dorms"
          ? fetchDormDetail(id)
          : await fetchListingDetail(id);

    return NextResponse.json({ detail });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
