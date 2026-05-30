"use client";

import Link from "next/link";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  boundsFromLeafletPositions,
  geoJsonToLeafletPositions,
} from "@/lib/geojson";
import { collectMapPoints, type MapPoint } from "@/lib/map-bounds";
import type { Trail } from "@/lib/types";
import "leaflet/dist/leaflet.css";

const BANFF_CENTER: [number, number] = [51.1784, -115.5708];
const DEFAULT_ZOOM = 10;

const trailheadStyle = {
  color: "#14532d",
  fillColor: "#16a34a",
  fillOpacity: 0.95,
  weight: 2,
};

const trailheadSelectedStyle = {
  color: "#052e16",
  fillColor: "#15803d",
  fillOpacity: 1,
  weight: 3,
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
  selectedTrailId?: string | null;
  onSelectTrail?: (trailId: string | null) => void;
  /** Taller map on trail detail page */
  tall?: boolean;
  /** When set, fit bounds to this trail on load */
  initialSelectedTrailId?: string | null;
};

function MapClickClear({ onClear }: { onClear: () => void }) {
  useMapEvents({
    click: () => onClear(),
  });
  return null;
}

function FitMapView({
  points,
  selectedTrailId,
  trails,
}: {
  points: MapPoint[];
  selectedTrailId: string | null;
  trails: Trail[];
}) {
  const map = useMap();
  const pointsKey = useMemo(
    () => points.map((p) => `${p.lat},${p.lng}`).join("|"),
    [points],
  );

  useEffect(() => {
    if (selectedTrailId) {
      const trail = trails.find((t) => t.id === selectedTrailId);
      if (trail?.route?.coordinates) {
        const positions = geoJsonToLeafletPositions(trail.route.coordinates);
        const bounds = boundsFromLeafletPositions(positions);
        if (bounds) {
          map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14 });
          return;
        }
      }
    }

    if (points.length === 0) {
      map.setView(BANFF_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12);
      return;
    }
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [map, points, pointsKey, selectedTrailId, trails]);

  return null;
}

function trailPositions(trail: Trail): [number, number][] | null {
  if (!trail.route?.coordinates?.length) return null;
  return geoJsonToLeafletPositions(trail.route.coordinates);
}

export function TrailsMap({
  trails,
  base,
  getDetailHref,
  selectedTrailId: selectedTrailIdProp = null,
  onSelectTrail,
  tall = false,
  initialSelectedTrailId = null,
}: TrailsMapProps) {
  const selectedTrailId = selectedTrailIdProp ?? initialSelectedTrailId ?? null;
  const points = useMemo(() => collectMapPoints(trails, base), [trails, base]);
  const center = useMemo(() => {
    if (base) return [base.lat, base.lng] as [number, number];
    if (trails.length > 0) return [trails[0].lat, trails[0].lng] as [number, number];
    return BANFF_CENTER;
  }, [base, trails]);

  const heightClass = tall ? "h-[min(50vh,32rem)]" : "h-[min(42vh,28rem)]";

  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Map</h2>
        <p className="text-xs text-zinc-600">
          Click a trailhead to highlight the route · Routes from OpenStreetMap · © OSM contributors
        </p>
      </div>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className={`z-0 w-full rounded-xl border border-zinc-200 bg-zinc-200 ${heightClass}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onSelectTrail ? <MapClickClear onClear={() => onSelectTrail(null)} /> : null}
        <FitMapView points={points} selectedTrailId={selectedTrailId} trails={trails} />

        {trails.map((trail) => {
          const positions = trailPositions(trail);
          if (!positions) return null;
          const isSelected = selectedTrailId === trail.id;
          const dimmed = selectedTrailId !== null && !isSelected;

          return (
            <Polyline
              key={`route-${trail.id}`}
              positions={positions}
              pathOptions={{
                color: isSelected ? "#15803d" : "#64748b",
                weight: isSelected ? 5 : 2,
                opacity: dimmed ? 0.25 : isSelected ? 0.95 : 0.55,
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e.originalEvent);
                  onSelectTrail?.(trail.id);
                },
              }}
            />
          );
        })}

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

        {trails.map((trail) => {
          const isSelected = selectedTrailId === trail.id;
          return (
            <CircleMarker
              key={trail.id}
              center={[trail.lat, trail.lng]}
              radius={isSelected ? 9 : 7}
              pathOptions={isSelected ? trailheadSelectedStyle : trailheadStyle}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e.originalEvent);
                  onSelectTrail?.(trail.id);
                },
              }}
            >
              <Popup>
                <div>
                  <p className="mb-1 font-medium text-zinc-900">{trail.name}</p>
                  <p className="mb-2 text-xs text-zinc-700">
                    {trail.distanceKm} km · {trail.elevationGainM} m gain
                    {trail.route ? "" : " · route unavailable"}
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
          );
        })}
      </MapContainer>
    </section>
  );
}
