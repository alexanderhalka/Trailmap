"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useState } from "react";
import { ReviewRatingsDisplay } from "@/components/review-ratings-display";
import { VisibilityPicker } from "@/components/visibility-picker";
import type { TrailReview, TrailReviewsPayload, Visibility } from "@/lib/types";
import { visibilityLabel } from "@/lib/visibility";

type TrailReviewsSectionProps = {
  trailId: string;
  isLoggedIn: boolean;
};

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
      {label}: {value}
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function TrailReviewsSection({ trailId, isLoggedIn }: TrailReviewsSectionProps) {
  const [publicReviews, setPublicReviews] = useState<TrailReview[]>([]);
  const [myReview, setMyReview] = useState<TrailReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [physicalRating, setPhysicalRating] = useState(3);
  const [technicalRating, setTechnicalRating] = useState(3);
  const [exposureRating, setExposureRating] = useState(3);
  const [wildlifeRating, setWildlifeRating] = useState(3);
  const [overallRating, setOverallRating] = useState(4);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/trails/${trailId}/reviews`);
    if (!response.ok) {
      const resBody = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(resBody?.error ?? "Could not load reviews.");
      setLoading(false);
      return;
    }

    const data = (await response.json()) as TrailReviewsPayload;
    setPublicReviews(data.publicReviews);
    setMyReview(data.myReview);

    if (data.myReview) {
      setPhysicalRating(data.myReview.physicalRating);
      setTechnicalRating(data.myReview.technicalRating);
      setExposureRating(data.myReview.exposureRating);
      setWildlifeRating(data.myReview.wildlifeRating);
      setOverallRating(data.myReview.overallRating);
      setBody(data.myReview.body ?? "");
      setVisibility(data.myReview.visibility);
    }

    setLoading(false);
  }, [trailId]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  async function saveReview() {
    if (!isLoggedIn) {
      setStatus("Sign in to post a review.");
      return;
    }

    setBusy(true);
    setStatus(null);

    const response = await fetch(`/api/trails/${trailId}/reviews`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        physicalRating,
        technicalRating,
        exposureRating,
        wildlifeRating,
        overallRating,
        body,
        visibility,
      }),
    });

    if (response.status === 401) {
      setStatus("Sign in to post a review.");
      setBusy(false);
      return;
    }

    if (!response.ok) {
      const resBody = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(resBody?.error ?? "Could not save review.");
      setBusy(false);
      return;
    }

    setStatus("Review saved.");
    setBusy(false);
    void load();
  }

  async function deleteReview() {
    if (!myReview) return;

    setBusy(true);
    setStatus(null);

    const response = await fetch(`/api/reviews/${myReview.id}`, { method: "DELETE" });
    if (!response.ok && response.status !== 204) {
      setStatus("Could not delete review.");
      setBusy(false);
      return;
    }

    setMyReview(null);
    setBody("");
    setVisibility("PRIVATE");
    setStatus("Review deleted.");
    setBusy(false);
    void load();
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900">
      <header className="space-y-1">
        <h2 className="font-semibold text-zinc-950">Reviews</h2>
        <p className="text-xs text-zinc-600">
          Rate physical difficulty, technical terrain, exposure, wildlife, and overall experience.
          Choose private or public visibility.
        </p>
      </header>

      {loading ? <p className="text-sm text-zinc-800">Loading reviews…</p> : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {!loading && !error && isLoggedIn ? (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
          <h3 className="text-sm font-semibold text-zinc-950">
            {myReview ? "Edit your review" : "Write a review"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <RatingSlider
              label="Physical difficulty"
              value={physicalRating}
              onChange={setPhysicalRating}
            />
            <RatingSlider
              label="Technical difficulty"
              value={technicalRating}
              onChange={setTechnicalRating}
            />
            <RatingSlider label="Exposure" value={exposureRating} onChange={setExposureRating} />
            <RatingSlider label="Wildlife" value={wildlifeRating} onChange={setWildlifeRating} />
            <RatingSlider
              label="Overall trail"
              value={overallRating}
              onChange={setOverallRating}
            />
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
            Notes (optional)
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              placeholder="Conditions, tips, crowding…"
            />
          </label>
          <VisibilityPicker
            name="review-visibility"
            value={visibility}
            onChange={setVisibility}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveReview()}
              disabled={busy}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : myReview ? "Update review" : "Post review"}
            </button>
            {myReview ? (
              <button
                type="button"
                onClick={() => void deleteReview()}
                disabled={busy}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50"
              >
                Delete review
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!loading && !error && !isLoggedIn ? (
        <p className="text-sm text-zinc-800">
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>{" "}
          to rate this trail.
        </p>
      ) : null}

      {status ? <p className="text-sm font-medium text-zinc-800">{status}</p> : null}

      {myReview ? (
        <article className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
          <p className="text-sm font-semibold text-zinc-950">
            Your review · {visibilityLabel(myReview.visibility)}
          </p>
          <ReviewRatingsDisplay review={myReview} />
          {myReview.body ? <p className="mt-2 text-sm text-zinc-800">{myReview.body}</p> : null}
        </article>
      ) : null}

      {publicReviews.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-950">Public reviews</h3>
          {publicReviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-zinc-100 p-3">
              <Link
                href={`/users/${encodeURIComponent(review.username)}`}
                className="text-sm font-semibold text-zinc-950 hover:underline"
              >
                {review.username}
              </Link>
              <ReviewRatingsDisplay review={review} />
              {review.body ? <p className="mt-2 text-sm text-zinc-800">{review.body}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        !loading &&
        !error && (
          <p className="text-sm text-zinc-700">No public reviews yet for this trail.</p>
        )
      )}
    </section>
  );
}
