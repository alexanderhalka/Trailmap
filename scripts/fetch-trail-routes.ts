/**
 * Fetch hiking route geometry from OpenStreetMap (Overpass API) for each seed trail.
 * Writes public/trails/{id}.geojson — run before db:seed.
 *
 * Usage: npm run trails:fetch-routes [-- --force]
 */

import fs from "fs";
import path from "path";
import { seedTrailRows } from "../src/lib/seed-trails";

const OUT_DIR = path.join(process.cwd(), "public", "trails");
const FORCE = process.argv.includes("--force");

type LatLng = { lat: number; lon: number };

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  tags?: Record<string, string>;
  members?: { type: string; ref: number; role: string }[];
  geometry?: LatLng[];
};

type OverpassResponse = { elements: OverpassElement[] };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(value: string): Set<string> {
  return new Set(
    normalizeName(value)
      .split(" ")
      .filter((t) => t.length > 2 && !["trail", "peak", "mountain", "lake", "the"].includes(t)),
  );
}

function nameSimilarity(trailName: string, osmName: string | undefined): number {
  if (!osmName) return 0;
  const a = normalizeName(trailName);
  const b = normalizeName(osmName);
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const tokensA = nameTokens(trailName);
  const tokensB = nameTokens(osmName);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }
  return overlap / Math.max(tokensA.size, tokensB.size);
}

function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function polylineLengthKm(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i += 1) {
    total += haversineKm(
      { lat: coords[i - 1][1], lon: coords[i - 1][0] },
      { lat: coords[i][1], lon: coords[i][0] },
    );
  }
  return total;
}

function minDistanceToPointKm(coords: [number, number][], lat: number, lng: number): number {
  let min = Infinity;
  for (const [lon, pointLat] of coords) {
    min = Math.min(min, haversineKm({ lat, lon: lng }, { lat: pointLat, lon }));
  }
  return min;
}

function appendCoords(target: [number, number][], next: [number, number][]) {
  if (next.length === 0) return;
  if (target.length === 0) {
    target.push(...next);
    return;
  }
  const last = target[target.length - 1];
  const first = next[0];
  if (last[0] === first[0] && last[1] === first[1]) {
    target.push(...next.slice(1));
  } else {
    target.push(...next);
  }
}

function wayToCoords(way: OverpassElement): [number, number][] {
  if (!way.geometry || way.geometry.length < 2) return [];
  return way.geometry.map((p) => [p.lon, p.lat]);
}

function relationToCoords(
  relation: OverpassElement,
  elements: OverpassElement[],
): [number, number][] {
  const wayMap = new Map<number, [number, number][]>();
  for (const el of elements) {
    if (el.type === "way") {
      const coords = wayToCoords(el);
      if (coords.length >= 2) {
        wayMap.set(el.id, coords);
      }
    }
  }

  const coords: [number, number][] = [];
  for (const member of relation.members ?? []) {
    if (member.type !== "way") continue;
    const wayCoords = wayMap.get(member.ref);
    if (wayCoords) appendCoords(coords, wayCoords);
  }
  return coords;
}

function osmDisplayName(tags: Record<string, string> | undefined): string | undefined {
  if (!tags) return undefined;
  return tags.name ?? tags.ref ?? tags["official_name"] ?? tags["alt_name"];
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function queryOverpass(lat: number, lng: number): Promise<OverpassResponse> {
  const query = `[out:json][timeout:90];
(
  relation(around:10000,${lat},${lng})["route"="hiking"];
  way(around:3500,${lat},${lng})["highway"~"path|footway|bridleway|track|steps"]["access"!~"private|no"];
);
out geom;`;

  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json",
            "User-Agent": "TrailMap/0.1 (local dev; contact: local)",
          },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (response.status === 504 && attempt === 0) {
          await sleep(3000);
          continue;
        }

        if (!response.ok) {
          lastError = new Error(`Overpass HTTP ${response.status} from ${endpoint}`);
          break;
        }

        return (await response.json()) as OverpassResponse;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  throw lastError ?? new Error("Overpass request failed");
}

function pickBestRoute(
  trail: (typeof seedTrailRows)[number],
  elements: OverpassElement[],
): { coordinates: [number, number][]; osmRelationId?: string; source: string } | null {
  const relations = elements.filter((el) => el.type === "relation");
  const ways = elements.filter((el) => el.type === "way");

  type Candidate = {
    coordinates: [number, number][];
    score: number;
    osmRelationId?: string;
    source: string;
  };

  const candidates: Candidate[] = [];

  for (const relation of relations) {
    const coords = relationToCoords(relation, elements);
    if (coords.length < 2) continue;

    const lengthKm = polylineLengthKm(coords);
    const distKm = minDistanceToPointKm(coords, trail.lat, trail.lng);
    const nameScore = Math.max(
      nameSimilarity(trail.name, osmDisplayName(relation.tags)),
      ...((relation.members ?? [])
        .filter((m) => m.type === "way")
        .map((m) => {
          const way = ways.find((w) => w.id === m.ref);
          return nameSimilarity(trail.name, osmDisplayName(way?.tags));
        })),
    );

    const lengthTarget = trail.distanceKm;
    const lengthScore =
      lengthKm >= lengthTarget * 0.25 && lengthKm <= lengthTarget * 2.5
        ? 1 - Math.min(1, Math.abs(lengthKm - lengthTarget) / lengthTarget)
        : 0.2;

    const distScore = distKm <= 1.5 ? 1 - distKm / 1.5 : Math.max(0, 0.3 - distKm / 10);

    const score = nameScore * 3 + lengthScore * 2 + distScore * 2 + Math.min(lengthKm / 20, 0.5);

    candidates.push({
      coordinates: coords,
      score,
      osmRelationId: String(relation.id),
      source: `relation ${relation.id}`,
    });
  }

  for (const way of ways) {
    const coords = wayToCoords(way);
    if (coords.length < 2) continue;

    const lengthKm = polylineLengthKm(coords);
    if (lengthKm < 0.4) continue;

    const distKm = minDistanceToPointKm(coords, trail.lat, trail.lng);
    if (distKm > 2) continue;

    const nameScore = nameSimilarity(trail.name, osmDisplayName(way.tags));
    const lengthTarget = trail.distanceKm;
    const lengthScore =
      lengthKm >= lengthTarget * 0.2 && lengthKm <= lengthTarget * 1.8
        ? 1 - Math.min(1, Math.abs(lengthKm - lengthTarget) / lengthTarget)
        : 0.15;

    const distScore = distKm <= 1 ? 1 - distKm : 0.2;
    const score = nameScore * 2.5 + lengthScore * 2 + distScore * 2 + Math.min(lengthKm / 15, 0.4);

    candidates.push({
      coordinates: coords,
      score,
      source: `way ${way.id}`,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const minScore = trail.distanceKm < 3 ? 0.9 : 1.2;
  if (!best || best.score < minScore) {
    return null;
  }

  return {
    coordinates: best.coordinates,
    osmRelationId: best.osmRelationId,
    source: best.source,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const trail of seedTrailRows) {
    const outPath = path.join(OUT_DIR, `${trail.id}.geojson`);
    if (fs.existsSync(outPath) && !FORCE) {
      console.log(`skip ${trail.id} (file exists)`);
      skipped += 1;
      continue;
    }

    console.log(`fetch ${trail.id} — ${trail.name}…`);
    try {
      const data = await queryOverpass(trail.lat, trail.lng);
      const picked = pickBestRoute(trail, data.elements);

      if (!picked) {
        console.warn(`  no suitable OSM route for ${trail.id}`);
        failed += 1;
        await sleep(1200);
        continue;
      }

      const feature = {
        type: "Feature",
        properties: {
          trailId: trail.id,
          trailName: trail.name,
          source: picked.source,
          osmRelationId: picked.osmRelationId ?? null,
        },
        geometry: {
          type: "LineString",
          coordinates: picked.coordinates,
        },
      };

      fs.writeFileSync(outPath, `${JSON.stringify(feature, null, 2)}\n`, "utf8");
      console.log(`  wrote ${picked.coordinates.length} points (${picked.source})`);
      ok += 1;
    } catch (error) {
      console.error(`  error for ${trail.id}:`, error);
      failed += 1;
    }

    await sleep(1500);
  }

  console.log(`\nDone: ${ok} written, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main();
