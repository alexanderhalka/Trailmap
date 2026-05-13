/** How the user gets from base to trailhead (timing + saved plans). */
export type AccessMode = "car" | "transit" | "walking";

/** Which ways you are willing to reach the trailhead (list filter; trail matches if it supports any checked leg). */
export interface TravelLegs {
  useWalk: boolean;
  useTransit: boolean;
  useCar: boolean;
}

export type RouteType = "out_and_back" | "loop" | "point_to_point";

export interface Trail {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
  distanceKm: number;
  elevationGainM: number;
  maxAltitudeM?: number;
  routeType: RouteType;
  physicalScore: number;
  technicalScore: number;
  /** 1 = flat / no drop-offs; 5 = scrambling / climbing / via-ferrata class (curated). */
  exposureScore: number;
  generalRating?: number;
  wildlifeRating?: number;
  accessWalking: boolean;
  accessTransit: boolean;
  accessCar: boolean;
  transitNotes?: string;
}

export interface TripPlan {
  id: string;
  title: string;
  baseLocationName: string;
  baseLat: number;
  baseLng: number;
  trailId: string;
  mode: AccessMode;
  notes?: string;
  createdAt: string;
  trail?: { id: string; name: string };
}
