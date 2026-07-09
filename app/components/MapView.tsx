"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/lib/willhaben";

const RentalMap = dynamic(() => import("./RentalMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 text-zinc-500">
      Loading map…
    </div>
  ),
});

type MapViewProps = {
  listings: Listing[];
  selectedId: string | null;
  onSelect: (listing: Listing) => void;
};

export default function MapView({
  listings,
  selectedId,
  onSelect,
}: MapViewProps) {
  return (
    <RentalMap
      listings={listings}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}
