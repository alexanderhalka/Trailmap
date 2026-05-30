import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewRatingsDisplay } from "@/components/review-ratings-display";
import { getUserProfileByUsername } from "@/lib/user-profile";
import { visibilityLabel } from "@/lib/visibility";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getUserProfileByUsername(decodeURIComponent(username));

  if (!profile) {
    notFound();
  }

  const memberDate = new Date(profile.memberSince).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 text-zinc-900">
      <Link href="/" className="text-sm font-medium text-zinc-800 underline">
        Back to search
      </Link>

      <header className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-950">{profile.username}</h1>
        <p className="text-sm text-zinc-700">Member since {memberDate}</p>
        {profile.isOwner ? (
          <p className="text-sm font-medium text-emerald-900">This is your profile.</p>
        ) : null}
        <dl className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-800">
          <div>
            <dt className="font-medium text-zinc-950">Trails reviewed</dt>
            <dd>{profile.trailsDone.length}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-950">Reviews shown</dt>
            <dd>{profile.reviews.length}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-950">Saved trails shown</dt>
            <dd>{profile.savedTrails.length}</dd>
          </div>
          {profile.isOwner && profile.privateReviewCount !== undefined ? (
            <div>
              <dt className="font-medium text-zinc-950">Private reviews</dt>
              <dd>{profile.privateReviewCount}</dd>
            </div>
          ) : null}
          {profile.isOwner && profile.privateSavedCount !== undefined ? (
            <div>
              <dt className="font-medium text-zinc-950">Private saves</dt>
              <dd>{profile.privateSavedCount}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-950">Trails done</h2>
        <p className="text-xs text-zinc-600">
          Trails this user has reviewed (one review per trail).
        </p>
        {profile.trailsDone.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800">
            No reviewed trails to show
            {profile.isOwner ? " yet." : " publicly."}
          </p>
        ) : (
          <ul className="grid gap-2">
            {profile.trailsDone.map((trail) => (
              <li key={trail.id}>
                <Link
                  href={`/trails/${trail.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm hover:bg-zinc-50"
                >
                  <span className="font-semibold text-zinc-950">{trail.name}</span>
                  <span className="mt-1 block text-zinc-700">
                    {trail.distanceKm} km · {trail.elevationGainM} m gain
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-950">Reviews</h2>
        {profile.reviews.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800">
            No reviews to show
            {profile.isOwner ? " yet." : " publicly."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/trails/${review.trail.id}`}
                    className="font-semibold text-zinc-950 hover:underline"
                  >
                    {review.trail.name}
                  </Link>
                  <span className="text-xs font-medium text-zinc-600">
                    {visibilityLabel(review.visibility)}
                  </span>
                </div>
                <ReviewRatingsDisplay review={review} />
                {review.body ? (
                  <p className="mt-2 text-sm text-zinc-800">{review.body}</p>
                ) : null}
                <p className="mt-2 text-xs text-zinc-600">
                  Updated {new Date(review.updatedAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-950">Saved trails</h2>
        {profile.savedTrails.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800">
            No saved trails to show
            {profile.isOwner ? " yet." : " publicly."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.savedTrails.map((row) => (
              <article
                key={row.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/trails/${row.trail.id}`}
                    className="font-semibold text-zinc-950 hover:underline"
                  >
                    {row.trail.name}
                  </Link>
                  <span className="text-xs font-medium text-zinc-600">
                    {visibilityLabel(row.visibility)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-800">
                  {row.trail.distanceKm} km · {row.trail.elevationGainM} m gain
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
