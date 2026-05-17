"use client";

import Link from "next/link";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { collectMapPoints, type MapPoint } from "@/lib/map-bounds";
import type { Trail } from "@/lib/types";
import "leaflet/dist/leaflet.css";

const BANFF_CENTER: [number, number] = [51.1784, -115.5708];
const DEFAULT_ZOOM = 10;

const trailMarkerStyle = {
  color: "#14532d",
  fillColor: "#16a34a",
  fillOpacity: 0.92,
  weight: 2,
};

const baseMarkerStyle = {
  color: "#1e3a8a",
  fillColor: "#2563eb",
  fillOpacity: 0.95,
  weight: 2,
};

type TrailsMapProps = {
  trails: Trail[];
  base: MapPoint | null;
  getDetailHref: (trailId: string) => string;
};

function FitMapView({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const pointsKey = useMemo(
    () => points.map((p) => `${p.lat},${p.lng}`).join("|"),
    [points],
  );

  useEffect(() => {
    if (points.length === 0) {
      map.setView(BANFF_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 11);
      return;
    }
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [map, points, pointsKey]);

  return null;
}

export function TrailsMap({ trails, base, getDetailHref }: TrailsMapProps) {
  const points = useMemo(() => collectMapPoints(trails, base), [trails, base]);
  const center = useMemo(() => {
    if (base) return [base.lat, base.lng] as [number, number];
    if (trails.length > 0) return [trails[0].lat, trails[0].lng] as [number, number];
    return BANFF_CENTER;
  }, [base, trails]);

  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Map</h2>
        <p className="text-xs text-zinc-600">
          Green = trailhead · Blue = your base
        </p>
      </div>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="z-0 h-[min(42vh,28rem)] w-full rounded-xl border border-zinc-200 bg-zinc-200"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMapView points={points} />
        {base ? (
          <CircleMarker
            center={[base.lat, base.lng]}
            radius={10}
            pathOptions={baseMarkerStyle}
          >
            <Popup>
              <span className="font-medium">Your base</span>
            </Popup>
          </CircleMarker>
        ) : null}
        {trails.map((trail) => (
          <CircleMarker
            key={trail.id}
            center={[trail.lat, trail.lng]}
            radius={8}
            pathOptions={trailMarkerStyle}
          >
            <Popup>
              <div>
                <p className="mb-1 font-medium text-zinc-900">{trail.name}</p>
                <p className="mb-2 text-xs text-zinc-700">
                  {trail.distanceKm} km · {trail.elevationGainM} m gain
                </p>
                <Link
                  href={getDetailHref(trail.id)}
                  className="text-sm font-medium text-blue-700 underline"
                >
                  View details
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </section>
  );
}
