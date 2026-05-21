import type { TrailReview } from "@/lib/types";

export function ReviewRatingsDisplay({ review }: { review: TrailReview }) {
  return (
    <p className="text-sm text-zinc-800">
      Physical {review.physicalRating}/5 · Technical {review.technicalRating}/5 · Exposure{" "}
      {review.exposureRating}/5 · Wildlife {review.wildlifeRating}/5 · Overall{" "}
      {review.overallRating}/5
    </p>
  );
}
