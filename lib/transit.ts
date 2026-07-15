import type { University } from "./universities";

const EFA_BASE = "https://www.linzag.at/static/XSLT_TRIP_REQUEST2";

export type TransitLeg = {
  type: "walk" | "tram" | "bus" | "transit";
  durationMinutes: number;
  from: string;
  to: string;
  line?: string;
  lineLabel?: string;
  direction?: string;
};

export type TransitJourney = {
  totalMinutes: number;
  legs: TransitLeg[];
  geometry: [number, number][];
};

type EfaLocation = {
  disassembledName?: string;
  name?: string;
};

type EfaLeg = {
  duration: number;
  origin: EfaLocation;
  destination: EfaLocation;
  transportation: {
    number?: string;
    name?: string;
    direction?: string;
    description?: string;
    product: {
      class: number;
      name: string;
    };
  };
  coords?: [number, number][];
};

type EfaTripResponse = {
  journeys?: Array<{
    legs: EfaLeg[];
  }>;
  systemMessages?: Array<{ type: string; text: string }>;
};

function efaCoordToLatLng(coord: [number, number]): [number, number] {
  return [coord[0] / 1_000_000, coord[1] / 1_000_000];
}

function placeName(location: EfaLocation): string {
  return location.disassembledName ?? location.name ?? "Stop";
}

function minutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

function legType(productClass: number): TransitLeg["type"] {
  if (productClass === 100) return "walk";
  if (productClass === 4) return "tram";
  if (productClass === 5 || productClass === 17) return "bus";
  return "transit";
}

function lineLabel(leg: EfaLeg): string {
  const transport = leg.transportation;
  const type = legType(transport.product.class);
  const number = transport.number ?? transport.name ?? transport.product.name;

  if (type === "tram") return `Tram ${number}`;
  if (type === "bus") return `Bus ${number}`;
  return transport.product.name;
}

function parseLeg(leg: EfaLeg): TransitLeg {
  const type = legType(leg.transportation.product.class);
  const from = placeName(leg.origin);
  const to = placeName(leg.destination);

  return {
    type,
    durationMinutes: minutes(leg.duration),
    from,
    to,
    line: leg.transportation.number,
    lineLabel: type === "walk" ? undefined : lineLabel(leg),
    direction: leg.transportation.description ?? leg.transportation.direction,
  };
}

function legDescription(leg: TransitLeg): string {
  if (leg.type === "walk") {
    return `${leg.durationMinutes} min walk to ${leg.to}`;
  }

  const vehicle = leg.lineLabel ?? "Public transport";
  return `${vehicle} to ${leg.to} (${leg.durationMinutes} min)`;
}

export function formatTransitSteps(legs: TransitLeg[]): string[] {
  return legs.map(legDescription);
}

export async function fetchTransitJourneyToCampus(
  fromLat: number,
  fromLng: number,
  destination: Pick<University, "lat" | "lng">,
): Promise<TransitJourney> {
  const params = new URLSearchParams({
    outputFormat: "rapidJSON",
    coordOutputFormat: "WGS84",
    type_origin: "coord",
    name_origin: `${fromLng}:${fromLat}:WGS84`,
    type_destination: "coord",
    name_destination: `${destination.lng}:${destination.lat}:WGS84`,
    useProxFootSearch: "1",
    ptOptionsActive: "1",
    itOptionsActive: "1",
    calcNumberOfTrips: "1",
    language: "en",
    useRealtime: "1",
  });

  const response = await fetch(`${EFA_BASE}?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Transit service returned ${response.status}`);
  }

  const data = (await response.json()) as EfaTripResponse;
  const journey = data.journeys?.[0];

  if (!journey?.legs?.length) {
    const message =
      data.systemMessages?.map((item) => item.text).filter(Boolean).join(", ") ||
      "No public transport route found";
    throw new Error(message);
  }

  const legs = journey.legs.map(parseLeg);
  const geometry: [number, number][] = [];

  for (const leg of journey.legs) {
    for (const coord of leg.coords ?? []) {
      geometry.push(efaCoordToLatLng(coord));
    }
  }

  const totalMinutes = legs.reduce((sum, leg) => sum + leg.durationMinutes, 0);

  return { totalMinutes, legs, geometry };
}

/** @deprecated Use fetchTransitJourneyToCampus */
export async function fetchTransitJourneyToJku(
  fromLat: number,
  fromLng: number,
): Promise<TransitJourney> {
  return fetchTransitJourneyToCampus(fromLat, fromLng, {
    lat: 48.3384,
    lng: 14.3212,
  });
}
