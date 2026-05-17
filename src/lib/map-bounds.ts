import { DEFAULT_BASE_LAT, DEFAULT_BASE_LNG } from "@/lib/coords";

export type MapPoint = { lat: number; lng: number };

export function collectMapPoints(
  trails: { lat: number; lng: number }[],
  base: MapPoint | null,
): MapPoint[] {
  const points: MapPoint[] = trails.map((t) => ({ lat: t.lat, lng: t.lng }));
  if (base) {
    points.push(base);
  }
  return points;
}

export function defaultMapCenter(): MapPoint {
  return { lat: DEFAULT_BASE_LAT, lng: DEFAULT_BASE_LNG };
}
