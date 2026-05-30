"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { startTransition, useCallback, useEffect, useState } from "react";
import { VisibilityPicker } from "@/components/visibility-picker";
import type { SavedTrail, Visibility } from "@/lib/types";
import { visibilityLabel } from "@/lib/visibility";

function SavedTrailsList() {
  const [saved, setSaved] = useState<SavedTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/saved-trails");
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not load saved trails.");
      setSaved([]);
      setLoading(false);
      return;
    }

    const data = (await response.json()) as SavedTrail[];
    setSaved(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  async function removeSaved(id: string) {
    setRemovingId(id);
    setError(null);

    const response = await fetch(`/api/saved-trails/${id}`, { method: "DELETE" });
    if (!response.ok && response.status !== 204) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not remove trail.");
      setRemovingId(null);
      return;
    }

    setSaved((prev) => prev.filter((row) => row.id !== id));
    setRemovingId(null);
  }

  async function updateVisibility(id: string, visibility: Visibility) {
    setUpdatingId(id);
    setError(null);

    const response = await fetch(`/api/saved-trails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not update visibility.");
      setUpdatingId(null);
      return;
    }

    const updated = (await response.json()) as SavedTrail;
    setSaved((prev) => prev.map((row) => (row.id === id ? updated : row)));
    setUpdatingId(null);
  }

  if (loading) {
    return <p className="text-sm font-medium text-zinc-800">Loading saved trails…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>
    );
  }

  if (saved.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800">
        No saved trails yet. Open a trail and click <strong>Save trail</strong>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-600">
        Private saves are only visible on your profile to you. Public saves appear on your user
        page for others.
      </p>
      {saved.map((row) => (
        <article
          key={row.id}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-zinc-950">
                <Link href={`/trails/${row.trail.id}`} className="hover:underline">
                  {row.trail.name}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-zinc-800">
                {row.trail.distanceKm} km · {row.trail.elevationGainM} m gain
              </p>
              <p className="mt-1 text-sm text-zinc-800">
                Physical {row.trail.physicalScore}/5 · Technical {row.trail.technicalScore}/5 ·
                Exposure {row.trail.exposureScore}/5
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-700">
                List visibility: {visibilityLabel(row.visibility)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void removeSaved(row.id)}
              disabled={removingId === row.id}
              className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
            >
              {removingId === row.id ? "Removing…" : "Remove"}
            </button>
          </div>
          <VisibilityPicker
            name={`saved-visibility-${row.id}`}
            value={row.visibility}
            onChange={(v) => void updateVisibility(row.id, v)}
            disabled={updatingId === row.id}
          />
        </article>
      ))}
    </div>
  );
}

export default function PlansPage() {
  const { status } = useSession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6 text-zinc-900">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-950">Saved trails</h1>
        <Link href="/" className="text-sm font-medium text-zinc-800 underline">
          Back to search
        </Link>
      </header>

      {status === "loading" ? (
        <p className="text-sm font-medium text-zinc-800">Checking sign-in…</p>
      ) : null}

      {status === "unauthenticated" ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800">
          <Link href="/login" className="font-medium text-zinc-950 underline">
            Sign in
          </Link>{" "}
          to save trails and see your list here.
        </p>
      ) : null}

      {status === "authenticated" ? <SavedTrailsList /> : null}
    </main>
  );
}
