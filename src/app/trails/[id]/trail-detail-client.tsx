"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatRouteType } from "@/lib/route-label";
import { formatTrailAccessModes } from "@/lib/trail-access";
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
};

export function TrailDetailClient({
  trail,
  baseLocationName,
  baseLat,
  baseLng,
  mode,
  usingDefaultBase,
}: Props) {
  const [status, setStatus] = useState<string>("");

  const estimate = useMemo(
    () => estimateTripHours(baseLat, baseLng, trail, mode),
    [baseLat, baseLng, mode, trail],
  );

  async function savePlan() {
    setStatus("Saving...");
    const response = await fetch("/api/trip-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${trail.name} day hike`,
        baseLocationName,
        baseLat,
        baseLng,
        trailId: trail.id,
        mode,
      }),
    });

    setStatus(response.ok ? "Saved. View it in Saved Plans." : "Save failed.");
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
        <p className="text-sm font-medium text-zinc-800">
          {formatTrailAccessModes(trail)}
        </p>
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
        <p className="mt-1 text-base font-semibold text-zinc-950">Total day: {estimate.totalHours} hours</p>
      </section>

      <button
        type="button"
        onClick={savePlan}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
      >
        Save trip plan
      </button>
      {status ? <p className="text-sm font-medium text-zinc-800">{status}</p> : null}

      <Link href="/plans" className="text-sm font-medium text-zinc-800 underline">
        Open saved plans
      </Link>
    </main>
  );
}
