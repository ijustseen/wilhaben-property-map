export type RouteStep = {
  instruction: string;
  distance: string;
  duration: string;
};

export type RouteToJku = {
  distanceMeters: number;
  distanceLabel: string;
  durationSeconds: number;
  durationLabel: string;
  geometry: [number, number][];
  steps: RouteStep[];
};

type OsrmResponse = {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { coordinates: [number, number][] };
    legs?: Array<{
      steps?: Array<{
        distance: number;
        duration: number;
        name: string;
        maneuver: { type: string; modifier?: string; location: [number, number] };
      }>;
    }>;
  }>;
};

const WALKING_SPEED_MPS = 5 / 3.6; // 5 km/h

function estimateWalkingDuration(distanceMeters: number): number {
  return distanceMeters / WALKING_SPEED_MPS;
}

function normalizeWalkingDuration(
  distanceMeters: number,
  durationSeconds: number,
): number {
  const impliedSpeed = distanceMeters / Math.max(durationSeconds, 1);
  if (impliedSpeed > 2.5) {
    return estimateWalkingDuration(distanceMeters);
  }
  return durationSeconds;
}
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

function maneuverLabel(type: string, modifier?: string, name?: string): string {
  const street = name ? ` onto ${name}` : "";
  switch (type) {
    case "depart":
      return `Head${modifier ? ` ${modifier}` : ""}${street}`;
    case "arrive":
      return "Arrive at JKU Linz";
    case "turn":
      return `Turn ${modifier ?? ""}${street}`.trim();
    case "continue":
      return `Continue${street}`;
    case "roundabout":
      return `Take the roundabout${street}`;
    default:
      return `${type}${modifier ? ` ${modifier}` : ""}${street}`.trim();
  }
}

export async function fetchWalkingRouteToJku(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<RouteToJku> {
  const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) {
    throw new Error(`Routing service returned ${response.status}`);
  }

  const data = (await response.json()) as OsrmResponse;
  const route = data.routes?.[0];
  if (!route) {
    throw new Error("No walking route found");
  }

  const durationSeconds = normalizeWalkingDuration(
    route.distance,
    route.duration,
  );

  const geometry =
    route.geometry?.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]) ??
    [];

  const steps: RouteStep[] =
    route.legs?.[0]?.steps?.map((step) => {
      const stepDuration = normalizeWalkingDuration(
        step.distance,
        step.duration,
      );
      return {
        instruction: maneuverLabel(
          step.maneuver.type,
          step.maneuver.modifier,
          step.name,
        ),
        distance: formatDistance(step.distance),
        duration: formatDuration(stepDuration),
      };
    }) ?? [];

  return {
    distanceMeters: route.distance,
    distanceLabel: formatDistance(route.distance),
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
    geometry,
    steps,
  };
}
