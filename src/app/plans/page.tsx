"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TripPlan } from "@/lib/types";

export default function PlansPage() {
  const [plans, setPlans] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/trip-plans");
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Could not load plans.");
        setPlans([]);
        setLoading(false);
        return;
      }
      const data = (await response.json()) as TripPlan[];
      setPlans(data);
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6 text-zinc-900">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-950">Saved Trip Plans</h1>
        <Link href="/" className="text-sm font-medium text-zinc-800 underline">
          Back to search
        </Link>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {loading ? <p className="text-sm font-medium text-zinc-800">Loading plans...</p> : null}

      {!loading && !error && plans.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800">
          No plans saved yet.
        </p>
      ) : null}

      {plans.map((plan) => (
        <article key={plan.id} className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900">
          <h2 className="font-semibold text-zinc-950">{plan.title}</h2>
          <p className="text-sm text-zinc-800">{plan.trail?.name ?? plan.trailId}</p>
          <p className="text-sm text-zinc-800">
            Base: {plan.baseLocationName} • travel: {plan.mode}
          </p>
          <p className="text-xs text-zinc-700">
            Created: {new Date(plan.createdAt).toLocaleString()}
          </p>
        </article>
      ))}
    </main>
  );
}
