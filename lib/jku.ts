/**
 * @deprecated Prefer `@/lib/universities`. Kept for short migration of polygon import paths.
 */
export { JKU_CAMPUS_POLYGON } from "./jku-campus-polygon";
export {
  getUniversity,
  googleMapsDirectionsToUniversity as googleMapsDirectionsUrl,
} from "./universities";

/** @deprecated Use getUniversity("jku") */
export const JKU_LINZ = {
  name: "Johannes Kepler University",
  shortName: "JKU",
  address: "Altenberger Straße 69, 4040 Linz",
  lat: 48.3384,
  lng: 14.3212,
} as const;
