"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { loadStoredBase, saveStoredBase, type StoredResolvedBase } from "@/lib/base-storage";
import { formatRouteType } from "@/lib/route-label";
import { formatTrailAccessModes } from "@/lib/trail-access";
import { defaultAccessModeForLegs } from "@/lib/travel-defaults";
import { travelLegsToSearchParams } from "@/lib/travel-legs";
import type { Trail, TravelLegs } from "@/lib/types";
import { TrailsMapPanel } from "@/components/trails-map-panel";

export function HomeSearch() {
  const [baseLocation, setBaseLocation] = useState("Banff town centre");
  const [resolved, setResolved] = useState<StoredResolvedBase | null>(null);
  const [geocodeStatus, setGeocodeStatus] = useState<"idle" | "loading" | "error">("idle");
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [legs, setLegs] = useState<TravelLegs>({
    useWalk: true,
    useTransit: true,
    useCar: true,
  });
  const [maxPhysical, setMaxPhysical] = useState(5);
  const [maxTechnical, setMaxTechnical] = useState(5);
  const [maxExposure, setMaxExposure] = useState(5);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadStoredBase();
    startTransition(() => {
      if (stored) {
        setBaseLocation(stored.query);
        setResolved(stored);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = travelLegsToSearchParams(legs);
        params.set("maxPhysical", String(maxPhysical));
        params.set("maxTechnical", String(maxTechnical));
        params.set("maxExposure", String(maxExposure));

        const response = await fetch(`/api/trails?${params.toString()}`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? "Could not load trails.");
          setTrails([]);
          return;
        }

        const data = (await response.json()) as Trail[];
        if (controller.signal.aborted) return;
        setTrails(data);
        setSelectedTrailId(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const isAbort =
          err instanceof DOMException
            ? err.name === "AbortError"
            : err instanceof Error && err.name === "AbortError";
        if (isAbort) return;
        setError("Could not load trails.");
        setTrails([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => controller.abort();
  }, [legs, maxPhysical, maxTechnical, maxExposure]);

  async function setBaseFromGeocode() {
    const query = baseLocation.trim();
    if (query.length < 2) {
      setGeocodeStatus("error");
      setGeocodeMessage("Enter at least 2 characters.");
      return;
    }

    setGeocodeStatus("loading");
    setGeocodeMessage(null);

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const body = (await response.json()) as {
        error?: string;
        name?: string;
        lat?: number;
        lng?: number;
      };

      if (!response.ok) {
        setGeocodeStatus("error");
        setGeocodeMessage(body.error ?? "Could not find that place.");
        setResolved(null);
        return;
      }

      if (
        typeof body.lat !== "number" ||
        typeof body.lng !== "number" ||
        typeof body.name !== "string"
      ) {
        setGeocodeStatus("error");
        setGeocodeMessage("Unexpected response from geocoder.");
        return;
      }

      const next: StoredResolvedBase = {
        query,
        displayName: body.name,
        lat: body.lat,
        lng: body.lng,
      };
      setResolved(next);
      saveStoredBase(next);
      setGeocodeStatus("idle");
      setGeocodeMessage("Base location saved.");
    } catch {
      setGeocodeStatus("error");
      setGeocodeMessage("Network error — try again.");
      setResolved(null);
    }
  }

  function onBaseInputChange(value: string) {
    setBaseLocation(value);
    if (resolved && value.trim() !== resolved.query) {
      setResolved(null);
      setGeocodeMessage(null);
    }
  }

  const detailMode = defaultAccessModeForLegs(legs);

  const fixHref = (id: string) => {
    const qs = new URLSearchParams();
    const label = resolved?.displayName ?? (baseLocation.trim() || "Base");
    qs.set("base", label);
    qs.set("mode", detailMode);
    if (resolved) {
      qs.set("baseLat", String(resolved.lat));
      qs.set("baseLng", String(resolved.lng));
    }
    return `/trails/${id}?${qs.toString()}`;
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 text-zinc-900">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-zinc-950">Find trails</h1>
        <p className="text-sm text-zinc-700">
          Banff and Canmore area trails. Set your base, tick how you might reach a trailhead, then
          filter by difficulty and exposure.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-2 text-zinc-900">
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
            Base location (hotel, address, neighbourhood)
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500"
              value={baseLocation}
              onChange={(event) => onBaseInputChange(event.target.value)}
              placeholder="e.g. Banff town centre"
              disabled={!hydrated}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={setBaseFromGeocode}
              disabled={geocodeStatus === "loading" || !hydrated}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {geocodeStatus === "loading" ? "Looking up…" : "Set as my base"}
            </button>
            {resolved ? (
              <span className="text-xs text-zinc-700">
                Using: {resolved.displayName.slice(0, 80)}
                {resolved.displayName.length > 80 ? "…" : ""}
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-900">
                Without “Set as my base”, trail timing uses a default Banff centre pin.
              </span>
            )}
          </div>
          {geocodeMessage ? (
            <p
              className={`text-sm ${geocodeStatus === "error" ? "text-red-700" : "text-emerald-800"}`}
            >
              {geocodeMessage}
            </p>
          ) : null}
        </div>

        <fieldset className="flex flex-col gap-2 md:col-span-2">
          <legend className="text-sm font-medium text-zinc-800">
            Ways you might reach the trailhead
          </legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-900">
              <input
                type="checkbox"
                checked={legs.useWalk}
                onChange={(e) => setLegs((prev) => ({ ...prev, useWalk: e.target.checked }))}
                className="size-4 rounded border-zinc-400"
              />
              Walk
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-900">
              <input
                type="checkbox"
                checked={legs.useTransit}
                onChange={(e) => setLegs((prev) => ({ ...prev, useTransit: e.target.checked }))}
                className="size-4 rounded border-zinc-400"
              />
              Transit
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-900">
              <input
                type="checkbox"
                checked={legs.useCar}
                onChange={(e) => setLegs((prev) => ({ ...prev, useCar: e.target.checked }))}
                className="size-4 rounded border-zinc-400"
              />
              Car
            </label>
          </div>
        </fieldset>
        <ScoreSlider label="Physical max" value={maxPhysical} onChange={setMaxPhysical} />
        <ScoreSlider label="Technical max" value={maxTechnical} onChange={setMaxTechnical} />
        <div className="md:col-span-2">
          <ScoreSlider
            label="Exposure max (1 = least exposed, 5 = most exposed)"
            value={maxExposure}
            onChange={setMaxExposure}
          />
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {hydrated && !error ? (
        <TrailsMapPanel
          trails={trails}
          base={resolved ? { lat: resolved.lat, lng: resolved.lng } : null}
          getDetailHref={fixHref}
          selectedTrailId={selectedTrailId}
          onSelectTrail={setSelectedTrailId}
        />
      ) : null}

      <section className="grid gap-3">
        {loading ? (
          <p className="text-sm font-medium text-zinc-800">Loading trails...</p>
        ) : (
          trails.map((trail) => (
            <article
              key={trail.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedTrailId(trail.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedTrailId(trail.id);
                }
              }}
              className={`rounded-xl border bg-white p-4 shadow-sm text-zinc-900 cursor-pointer transition-colors ${
                selectedTrailId === trail.id
                  ? "border-emerald-500 ring-2 ring-emerald-200"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950">{trail.name}</h2>
                  <p className="text-sm text-zinc-800">
                    {trail.distanceKm} km · {trail.elevationGainM} m gain · {formatRouteType(trail.routeType)}
                  </p>
                  <p className="text-sm font-medium text-zinc-900">{formatTrailAccessModes(trail)}</p>
                </div>
                <Link
                  href={fixHref(trail.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  View details
                </Link>
              </div>
              <p className="mt-2 text-sm text-zinc-800">
                Scores: physical {trail.physicalScore}/5 • technical {trail.technicalScore}/5 •
                exposure {trail.exposureScore}/5
              </p>
            </article>
          ))
        )}
        {!loading && trails.length === 0 && !error ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800 space-y-2">
            <p className="font-semibold text-zinc-950">No trails to show.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Raise <strong>Physical</strong>, <strong>Technical</strong>, and{" "}
                <strong>Exposure</strong> toward 5 — stricter caps hide more trails.
              </li>
              <li>
                Turn on at least one of <strong>Walk</strong>, <strong>Transit</strong>, or{" "}
                <strong>Car</strong>. If all three are off, the app turns them all back on.
              </li>
              <li>
                Ensure the database is set up:{" "}
                <code className="rounded bg-zinc-100 px-1">npm run db:push</code> and{" "}
                <code className="rounded bg-zinc-100 px-1">npm run db:seed</code> (Postgres running).
              </li>
            </ul>
          </div>
        ) : null}
      </section>

      <Link
        href="/plans"
        className="self-start rounded-md border border-zinc-400 bg-white px-3 py-2 text-sm font-medium text-zinc-900"
      >
        View saved trails
      </Link>
    </main>
  );
}

function ScoreSlider({
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
