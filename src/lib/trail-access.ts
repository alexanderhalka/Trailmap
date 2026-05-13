import type { Trail } from "@/lib/types";

/** Single line: only modes that apply, e.g. `walk / transit / car` or `transit / car`. */
export function formatTrailAccessModes(trail: Trail): string {
  const parts: string[] = [];
  if (trail.accessWalking) parts.push("walk");
  if (trail.accessTransit) parts.push("transit");
  if (trail.accessCar) parts.push("car");
  return parts.length > 0 ? parts.join(" / ") : "—";
}
