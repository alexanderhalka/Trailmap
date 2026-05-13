import type { TravelLegs } from "@/lib/types";

function isTruthyParam(v: string | null): boolean {
  return v === "1" || v === "true" || v === "yes";
}

/** If no leg params and no legacy travel, show all trails (all three modes allowed). */
const ALL_LEGS: TravelLegs = { useWalk: true, useTransit: true, useCar: true };

function legacyTravelToLegs(travel: string | null): TravelLegs | null {
  if (!travel) return null;
  const t = travel === "no_car" ? "transit_or_walk" : travel;
  switch (t) {
    case "all":
      return ALL_LEGS;
    case "transit_or_walk":
      return { useWalk: true, useTransit: true, useCar: false };
    case "transit":
      return { useWalk: false, useTransit: true, useCar: false };
    case "walking":
      return { useWalk: true, useTransit: false, useCar: false };
    case "car":
      return { useWalk: false, useTransit: false, useCar: true };
    default:
      return null;
  }
}

/**
 * Parse `walk`, `transit`, `car` query params (`1` / `true` = on).
 * If any of those keys are present, they win. Otherwise fall back to legacy `travel=` / `mode=`.
 * If nothing matches, all three on. If all explicit zeros, treat as all on.
 */
export function parseTravelLegsFromSearchParams(searchParams: URLSearchParams): TravelLegs {
  const hasLegParam =
    searchParams.has("walk") ||
    searchParams.has("transit") ||
    searchParams.has("car");

  if (hasLegParam) {
    const useWalk = isTruthyParam(searchParams.get("walk"));
    const useTransit = isTruthyParam(searchParams.get("transit"));
    const useCar = isTruthyParam(searchParams.get("car"));
    if (!useWalk && !useTransit && !useCar) {
      return ALL_LEGS;
    }
    return { useWalk, useTransit, useCar };
  }

  const travel = searchParams.get("travel") ?? searchParams.get("mode");
  const fromLegacy = legacyTravelToLegs(travel);
  return fromLegacy ?? ALL_LEGS;
}

export function travelLegsToSearchParams(legs: TravelLegs): URLSearchParams {
  const p = new URLSearchParams();
  p.set("walk", legs.useWalk ? "1" : "0");
  p.set("transit", legs.useTransit ? "1" : "0");
  p.set("car", legs.useCar ? "1" : "0");
  return p;
}
