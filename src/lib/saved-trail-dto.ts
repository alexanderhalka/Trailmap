import type { SavedTrail } from "@/lib/types";

import type { Visibility } from "@/lib/visibility";

type SavedTrailRow = {
  id: string;
  trailId: string;
  visibility: Visibility;
  createdAt: Date;
  trail: {
    id: string;
    name: string;
    distanceKm: number;
    elevationGainM: number;
    physicalScore: number;
    technicalScore: number;
    exposureScore: number;
  };
};

export function toSavedTrailDto(row: SavedTrailRow): SavedTrail {
  return {
    id: row.id,
    trailId: row.trailId,
    visibility: row.visibility,
    createdAt: row.createdAt.toISOString(),
    trail: row.trail,
  };
}
