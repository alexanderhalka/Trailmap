"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/lib/map-bounds";
import type { Trail } from "@/lib/types";

const TrailsMap = dynamic(
  () => import("@/components/trails-map").then((mod) => mod.TrailsMap),
  {
    ssr: false,
    loading: () => (
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">Map</h2>
        <div className="flex h-[min(42vh,28rem)] w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-200 text-sm text-zinc-700">
          Loading map…
        </div>
      </section>
    ),
  },
);

type TrailsMapPanelProps = {
  trails: Trail[];
  base: MapPoint | null;
  getDetailHref: (trailId: string) => string;
};

export function TrailsMapPanel(props: TrailsMapPanelProps) {
  return <TrailsMap {...props} />;
}
