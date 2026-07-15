export type MapLayerId = "streets" | "satellite" | "topo";

export const MAP_LAYER_OPTIONS: Array<{ id: MapLayerId; label: string }> = [
  { id: "streets", label: "Streets" },
  { id: "satellite", label: "Satellite" },
  { id: "topo", label: "Terrain" },
];
