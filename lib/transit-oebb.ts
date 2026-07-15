import { createClient, type HafasClient } from "hafas-client";
import { profile as oebbProfile } from "hafas-client/p/oebb/index.js";
import type { TransitJourney, TransitLeg } from "./transit";

type OebbLeg = {
  origin: { name: string; location?: { latitude: number; longitude: number } };
  destination: {
    name: string;
    location?: { latitude: number; longitude: number };
  };
  departure: string;
  arrival: string;
  walking?: boolean;
  direction?: string;
  line?: {
    name?: string;
    mode?: string;
    product?: string;
    fahrtNr?: string;
  };
};

type OebbJourney = {
  legs: OebbLeg[];
};

let oebbClient: HafasClient | null = null;

function getOebbClient(): HafasClient {
  if (!oebbClient) {
    oebbClient = createClient(
      oebbProfile,
      "StudiWohnkarte (https://studiwohnkarte.intruct.com)",
    );
  }
  return oebbClient;
}

function legDurationMinutes(leg: Pick<OebbLeg, "departure" | "arrival">): number {
  const start = new Date(leg.departure).getTime();
  const end = new Date(leg.arrival).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 1;
  }
  return Math.max(1, Math.round((end - start) / 60_000));
}

function mapOebbLeg(leg: OebbLeg): TransitLeg {
  if (leg.walking) {
    return {
      type: "walk",
      durationMinutes: legDurationMinutes(leg),
      from: leg.origin.name,
      to: leg.destination.name,
    };
  }

  const mode = leg.line?.mode ?? leg.line?.product ?? "transit";
  const type: TransitLeg["type"] =
    mode === "bus" ? "bus" : mode === "tram" ? "tram" : "transit";

  return {
    type,
    durationMinutes: legDurationMinutes(leg),
    from: leg.origin.name,
    to: leg.destination.name,
    line: leg.line?.fahrtNr,
    lineLabel: leg.line?.name ?? leg.line?.product,
    direction: leg.direction,
  };
}

function geometryFromJourney(
  journey: OebbJourney,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): [number, number][] {
  const geometry: [number, number][] = [[fromLat, fromLng]];

  for (const leg of journey.legs) {
    const dest = leg.destination.location;
    if (dest && Number.isFinite(dest.latitude) && Number.isFinite(dest.longitude)) {
      geometry.push([dest.latitude, dest.longitude]);
    }
  }

  const last = geometry[geometry.length - 1];
  if (!last || last[0] !== toLat || last[1] !== toLng) {
    geometry.push([toLat, toLng]);
  }

  return geometry;
}

export async function fetchOebbTransitJourney(
  fromLat: number,
  fromLng: number,
  destination: { lat: number; lng: number },
): Promise<TransitJourney> {
  const client = getOebbClient();
  const location = (latitude: number, longitude: number) => ({
    type: "location" as const,
    latitude,
    longitude,
  });

  const [nearFrom, nearTo] = await Promise.all([
    client.nearby(location(fromLat, fromLng), {
      distance: 1200,
      results: 1,
      language: "en",
    }),
    client.nearby(location(destination.lat, destination.lng), {
      distance: 1200,
      results: 1,
      language: "en",
    }),
  ]);

  const fromStop = nearFrom[0];
  const toStop = nearTo[0];
  if (!fromStop || !toStop) {
    throw new Error("No nearby public transport stops found");
  }

  const { journeys } = await client.journeys(fromStop, toStop, {
    results: 1,
    polylines: true,
    language: "en",
    walkingSpeed: "normal",
  });

  const journey = journeys?.[0] as OebbJourney | undefined;
  if (!journey?.legs?.length) {
    throw new Error("No public transport route found");
  }

  const legs = journey.legs.map(mapOebbLeg);
  const totalMinutes = legs.reduce((sum, leg) => sum + leg.durationMinutes, 0);
  const geometry = geometryFromJourney(
    journey,
    fromLat,
    fromLng,
    destination.lat,
    destination.lng,
  );

  return { totalMinutes, legs, geometry };
}
