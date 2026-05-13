import { AccessMode, Trail } from "@/lib/types";

const speedByModeKmh: Record<AccessMode, number> = {
  walking: 5,
  transit: 22,
  car: 55,
};

const trailMovingSpeedKmh = 4.2;

export function estimateTripHours(
  baseLat: number,
  baseLng: number,
  trail: Trail,
  mode: AccessMode,
) {
  const dx = (baseLat - trail.lat) * 111;
  const dy = (baseLng - trail.lng) * 78;
  const straightKm = Math.sqrt(dx * dx + dy * dy);
  const multiplier = mode === "car" ? 1.35 : 1.5;
  const oneWayTravelHours = (straightKm * multiplier) / speedByModeKmh[mode];

  const hikeHours = trail.distanceKm / trailMovingSpeedKmh + trail.elevationGainM / 500;

  return {
    goHours: Number(oneWayTravelHours.toFixed(1)),
    hikeHours: Number(hikeHours.toFixed(1)),
    returnHours: Number(oneWayTravelHours.toFixed(1)),
    totalHours: Number((oneWayTravelHours * 2 + hikeHours).toFixed(1)),
  };
}
