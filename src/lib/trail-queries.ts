import { prisma } from "@/lib/db";
import { trailToDto } from "@/lib/trail-dto";
import type { TravelLegs } from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";

export async function getTrailById(id: string) {
  const row = await prisma.trail.findUnique({ where: { id } });
  return row ? trailToDto(row) : null;
}

export async function listTrailsFiltered(input: {
  legs: TravelLegs;
  maxPhysical: number;
  maxTechnical: number;
  maxExposure: number;
}) {
  const where: Prisma.TrailWhereInput = {
    physicalScore: { lte: input.maxPhysical },
    technicalScore: { lte: input.maxTechnical },
    exposureScore: { lte: input.maxExposure },
  };

  const or: Prisma.TrailWhereInput[] = [];
  if (input.legs.useWalk) or.push({ accessWalking: true });
  if (input.legs.useTransit) or.push({ accessTransit: true });
  if (input.legs.useCar) or.push({ accessCar: true });

  if (or.length > 0) {
    where.OR = or;
  }

  const rows = await prisma.trail.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return rows.map(trailToDto);
}
