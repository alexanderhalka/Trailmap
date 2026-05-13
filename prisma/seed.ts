import "dotenv/config";

import { prisma } from "../src/lib/db";
import { computePhysicalScore, seedTrailRows } from "../src/lib/seed-trails";

async function main() {
  for (const row of seedTrailRows) {
    const physicalScore = computePhysicalScore(row.distanceKm, row.elevationGainM);
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
