import "dotenv/config";
import fs from "fs";

import { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/db";
import { computePhysicalScore, seedTrailRows } from "../src/lib/seed-trails";
import { loadTrailRouteFromFile, trailRouteFilePath } from "../src/lib/trail-route-files";

function loadOsmRelationId(trailId: string): string | null {
  const filePath = trailRouteFilePath(trailId);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
      properties?: { osmRelationId?: string | null };
    };
    const id = raw.properties?.osmRelationId;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

async function main() {
  for (const row of seedTrailRows) {
    const physicalScore = computePhysicalScore(row.distanceKm, row.elevationGainM);
    const routeGeoJson = loadTrailRouteFromFile(row.id);
    const osmRelationId = loadOsmRelationId(row.id);

    const routeFields = routeGeoJson
      ? {
          routeGeoJson: routeGeoJson as unknown as Prisma.InputJsonValue,
          osmRelationId,
        }
      : {
          routeGeoJson: Prisma.DbNull,
          osmRelationId: null,
        };

    await prisma.trail.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        name: row.name,
        lat: row.lat,
        lng: row.lng,
        region: row.region,
        distanceKm: row.distanceKm,
        elevationGainM: row.elevationGainM,
        maxAltitudeM: row.maxAltitudeM ?? null,
        routeType: row.routeType,
        physicalScore,
        technicalScore: row.technicalScore,
        exposureScore: row.exposureScore,
        generalRating: row.generalRating ?? null,
        wildlifeRating: row.wildlifeRating ?? null,
        accessWalking: row.accessWalking,
        accessTransit: row.accessTransit,
        accessCar: row.accessCar,
        transitNotes: row.transitNotes ?? null,
        ...routeFields,
      },
      update: {
        name: row.name,
        lat: row.lat,
        lng: row.lng,
        region: row.region,
        distanceKm: row.distanceKm,
        elevationGainM: row.elevationGainM,
        maxAltitudeM: row.maxAltitudeM ?? null,
        routeType: row.routeType,
        physicalScore,
        technicalScore: row.technicalScore,
        exposureScore: row.exposureScore,
        generalRating: row.generalRating ?? null,
        wildlifeRating: row.wildlifeRating ?? null,
        accessWalking: row.accessWalking,
        accessTransit: row.accessTransit,
        accessCar: row.accessCar,
        transitNotes: row.transitNotes ?? null,
        ...routeFields,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
