import { NextRequest, NextResponse } from "next/server";
import { fetchListingDetail } from "@/lib/willhaben";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const detail = await fetchListingDetail(id);
    return NextResponse.json({ detail });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
