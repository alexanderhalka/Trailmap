import type { AccessMode, TravelLegs } from "@/lib/types";

/** Pick timing/save mode from which legs the user allows (prefer transit, then walk, then car). */
export function defaultAccessModeForLegs(legs: TravelLegs): AccessMode {
  if (legs.useTransit) return "transit";
  if (legs.useWalk) return "walking";
  return "car";
}
