import type { Visibility } from "@/lib/visibility";
import type { TrailReview } from "@/lib/types";

type ReviewRow = {
  id: string;
  trailId: string;
  physicalRating: number;
  technicalRating: number;
  exposureRating: number;
  wildlifeRating: number;
  overallRating: number;
  body: string | null;
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
  user: { username: string };
};

export function toReviewDto(row: ReviewRow, options?: { isOwner?: boolean }): TrailReview {
  return {
    id: row.id,
    trailId: row.trailId,
    username: row.user.username,
    physicalRating: row.physicalRating,
    technicalRating: row.technicalRating,
    exposureRating: row.exposureRating,
    wildlifeRating: row.wildlifeRating,
    overallRating: row.overallRating,
    body: row.body ?? undefined,
    visibility: row.visibility,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isOwner: options?.isOwner ?? false,
  };
}
