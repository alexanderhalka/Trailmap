"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatRouteType } from "@/lib/route-label";
import { formatTrailAccessModes } from "@/lib/trail-access";
import { TrailReviewsSection } from "@/components/trail-reviews-section";
import { estimateTripHours } from "@/lib/trip-estimate";
import type { AccessMode, Trail } from "@/lib/types";

type Props = {
  trail: Trail;
  baseLocationName: string;
  baseLat: number;
  baseLng: number;
  mode: AccessMode;
  /** True when URL had no valid baseLat/baseLng — estimates use a default Banff pin. */
  usingDefaultBase: boolean;
  isLoggedIn: boolean;
  isSaved: boolean;
  savedRowId: string | null;
};

export function TrailDetailClient({
  trail,
  baseLocationName,
  baseLat,
  baseLng,
  mode,
  usingDefaultBase,
  isLoggedIn,
  isSaved: initialIsSaved,
  savedRowId: initialSavedRowId,
}: Props) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [savedRowId, setSavedRowId] = useState(initialSavedRowId);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const estimate = useMemo(
    () => estimateTripHours(baseLat, baseLng, trail, mode),
    [baseLat, baseLng, mode, trail],
  );

  async function toggleSaved() {
    if (!isLoggedIn) {
      setStatus("Sign in to save trails.");
      return;
    }

    setBusy(true);
    setStatus("");

    if (isSaved) {
      if (!savedRowId) {
        setIsSaved(false);
        setBusy(false);
        return;
      }

      const deleteResponse = await fetch(`/api/saved-trails/${savedRowId}`, {
        method: "DELETE",
      });
      if (!deleteResponse.ok && deleteResponse.status !== 204) {
        setStatus("Could not remove from saved trails.");
        setBusy(false);
        return;
      }

      setIsSaved(false);
      setSavedRowId(null);
      setStatus("Removed from saved trails.");
      setBusy(false);
      router.refresh();
      return;
    }

    const response = await fetch("/api/saved-trails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trailId: trail.id }),
    });

    if (response.status === 401) {
      setStatus("Sign in to save trails.");
      setBusy(false);
      return;
    }

    if (response.status === 409) {
      setIsSaved(true);
      setStatus("Already in your saved trails.");
      setBusy(false);
      return;
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(body?.error ?? "Save failed.");
      setBusy(false);
      return;
    }

    const body = (await response.json()) as { id: string };
    setIsSaved(true);
    setSavedRowId(body.id);
    setStatus("Saved. View it in Saved trails.");
    setBusy(false);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-6 text-zinc-900">
      <Link href="/" className="text-sm font-medium text-zinc-800 underline">
        Back to search
      </Link>

      {usingDefaultBase ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          Travel times use a default centre pin (Banff). On the home page, enter your stay and
          click <strong>Set as my base</strong> so timing matches where you actually are.
        </p>
      ) : null}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-950">{trail.name}</h1>
        <p className="text-sm font-medium text-zinc-800">{formatTrailAccessModes(trail)}</p>
        <p className="text-sm text-zinc-800">
          {trail.distanceKm} km · {trail.elevationGainM} m gain · {formatRouteType(trail.routeType)}
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900">
        <h2 className="font-semibold text-zinc-950">Difficulty profile</h2>
        <p className="mt-2 text-sm text-zinc-800">
          Physical {trail.physicalScore}/5 • Technical {trail.technicalScore}/5 • Exposure{" "}
          {trail.exposureScore}/5
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Exposure is rated 1 (least) to 5 (most exposed terrain), from trail metadata.
        </p>
        <p className="mt-2 text-sm text-zinc-800">{trail.transitNotes}</p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900">
        <h2 className="font-semibold text-zinc-950">Estimated day timing</h2>
        <p className="mt-2 text-sm text-zinc-800">
          Base: {baseLocationName} • travel:{" "}
          {mode === "car" ? "Car" : mode === "transit" ? "Public transit" : "Walking"}
        </p>
        <p className="mt-1 text-sm text-zinc-800">
          Go {estimate.goHours}h • Hike {estimate.hikeHours}h • Return {estimate.returnHours}h
        </p>
        <p className="mt-1 text-base font-semibold text-zinc-950">
          Total day: {estimate.totalHours} hours
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Rough estimate from your current base — not stored when you save this trail.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void toggleSaved()}
          disabled={busy}
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? "Please wait…" : isSaved ? "Saved — remove" : "Save trail"}
        </button>
        {!isLoggedIn ? (
          <Link href="/login" className="text-sm font-medium text-zinc-800 underline">
            Sign in to save
          </Link>
        ) : null}
        {isSaved ? (
          <Link href="/plans" className="text-sm font-medium text-zinc-800 underline">
            Open saved trails
          </Link>
        ) : null}
      </div>
      {status ? <p className="text-sm font-medium text-zinc-800">{status}</p> : null}

      <TrailReviewsSection trailId={trail.id} isLoggedIn={isLoggedIn} />
    </main>
  );
}
