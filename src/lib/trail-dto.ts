import type { Trail as TrailRecord } from "@/generated/prisma/client";
import { parseRouteGeoJson } from "@/lib/geojson";
import type { AccessMode, RouteType, Trail } from "@/lib/types";

export function trailToDto(row: TrailRecord): Trail {
  const route = parseRouteGeoJson(row.routeGeoJson ?? undefined);

  return {
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    region: row.region,
    distanceKm: row.distanceKm,
    elevationGainM: row.elevationGainM,
    maxAltitudeM: row.maxAltitudeM ?? undefined,
    routeType: row.routeType as RouteType,
    physicalScore: row.physicalScore,
    technicalScore: row.technicalScore,
    exposureScore: row.exposureScore,
    generalRating: row.generalRating ?? undefined,
    wildlifeRating: row.wildlifeRating ?? undefined,
    accessWalking: row.accessWalking,
    accessTransit: row.accessTransit,
    accessCar: row.accessCar,
    transitNotes: row.transitNotes ?? undefined,
    route,
  };
}

export function isAccessMode(value: string): value is AccessMode {
  return value === "car" || value === "transit" || value === "walking";
}
