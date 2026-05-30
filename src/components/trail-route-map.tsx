"use client";

import { TrailsMapPanel } from "@/components/trails-map-panel";
import type { Trail } from "@/lib/types";

type TrailRouteMapProps = {
  trail: Trail;
  getDetailHref: (trailId: string) => string;
};

export function TrailRouteMap({ trail, getDetailHref }: TrailRouteMapProps) {
  return (
    <TrailsMapPanel
      trails={[trail]}
      base={null}
      getDetailHref={getDetailHref}
      initialSelectedTrailId={trail.id}
      tall
    />
  );
}
