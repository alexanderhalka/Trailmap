import fs from "fs";
import path from "path";
import { parseRouteGeoJson, type RouteGeoJson } from "@/lib/geojson";

export function trailRouteFilePath(trailId: string): string {
  return path.join(process.cwd(), "public", "trails", `${trailId}.geojson`);
}

export function loadTrailRouteFromFile(trailId: string): RouteGeoJson | null {
  const filePath = trailRouteFilePath(trailId);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    return parseRouteGeoJson(raw) ?? null;
  } catch {
    return null;
  }
}
