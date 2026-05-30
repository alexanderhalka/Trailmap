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
  route?: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

export type Visibility = "PRIVATE" | "PUBLIC";

export interface SavedTrail {
  id: string;
  trailId: string;
  visibility: Visibility;
  createdAt: string;
  trail: {
    id: string;
    name: string;
    distanceKm: number;
    elevationGainM: number;
    physicalScore: number;
    technicalScore: number;
    exposureScore: number;
  };
}

export interface TrailReview {
  id: string;
  trailId: string;
  username: string;
  physicalRating: number;
  technicalRating: number;
  exposureRating: number;
  wildlifeRating: number;
  overallRating: number;
  body?: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}

export interface TrailReviewsPayload {
  publicReviews: TrailReview[];
  myReview: TrailReview | null;
}

export interface TrailSummary {
  id: string;
  name: string;
  distanceKm: number;
  elevationGainM: number;
  physicalScore?: number;
  technicalScore?: number;
  exposureScore?: number;
}

export interface TrailReviewWithTrail extends TrailReview {
  trail: TrailSummary;
}

export interface UserProfile {
  username: string;
  memberSince: string;
  isOwner: boolean;
  trailsDone: Pick<TrailSummary, "id" | "name" | "distanceKm" | "elevationGainM">[];
  reviews: TrailReviewWithTrail[];
  savedTrails: SavedTrail[];
  privateReviewCount?: number;
  privateSavedCount?: number;
}
