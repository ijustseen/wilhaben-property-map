declare module "hafas-client" {
  export type HafasClient = {
    nearby: (
      location: {
        type: "location";
        latitude: number;
        longitude: number;
      },
      opt?: Record<string, unknown>,
    ) => Promise<Array<{ id: string; name: string }>>;
    journeys: (
      from: unknown,
      to: unknown,
      opt?: Record<string, unknown>,
    ) => Promise<{ journeys: unknown[] }>;
  };

  export function createClient(
    profile: unknown,
    userAgent: string,
  ): HafasClient;
}

declare module "hafas-client/p/oebb/index.js" {
  export const profile: unknown;
}
