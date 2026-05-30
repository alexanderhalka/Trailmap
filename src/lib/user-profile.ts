import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { toReviewDto } from "@/lib/review-dto";
import { toSavedTrailDto } from "@/lib/saved-trail-dto";
import type { UserProfile } from "@/lib/types";

const trailSummarySelect = {
  id: true,
  name: true,
  distanceKm: true,
  elevationGainM: true,
  physicalScore: true,
  technicalScore: true,
  exposureScore: true,
} as const;

const userSelect = { select: { username: true } } as const;

export async function getViewerUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const viewerUserId = await getViewerUserId();
  const isOwner = viewerUserId === user.id;

  const reviewVisibilityFilter = isOwner ? undefined : ({ visibility: "PUBLIC" as const });

  const [reviews, savedTrails, privateReviewCount, privateSavedCount] = await Promise.all([
    prisma.review.findMany({
      where: {
        userId: user.id,
        ...reviewVisibilityFilter,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user: userSelect,
        trail: { select: trailSummarySelect },
      },
    }),
    prisma.savedTrail.findMany({
      where: {
        userId: user.id,
        ...(isOwner ? {} : { visibility: "PUBLIC" }),
      },
      orderBy: { createdAt: "desc" },
      include: { trail: { select: trailSummarySelect } },
    }),
    isOwner
      ? prisma.review.count({ where: { userId: user.id, visibility: "PRIVATE" } })
      : Promise.resolve(0),
    isOwner
      ? prisma.savedTrail.count({ where: { userId: user.id, visibility: "PRIVATE" } })
      : Promise.resolve(0),
  ]);

  const trailsDone = Array.from(
    new Map(
      reviews.map((row) => [
        row.trail.id,
        {
          id: row.trail.id,
          name: row.trail.name,
          distanceKm: row.trail.distanceKm,
          elevationGainM: row.trail.elevationGainM,
        },
      ]),
    ).values(),
  );

  return {
    username: user.username,
    memberSince: user.createdAt.toISOString(),
    isOwner,
    trailsDone,
    reviews: reviews.map((row) => ({
      ...toReviewDto(row, { isOwner }),
      trail: row.trail,
    })),
    savedTrails: savedTrails.map(toSavedTrailDto),
    privateReviewCount: isOwner ? privateReviewCount : undefined,
    privateSavedCount: isOwner ? privateSavedCount : undefined,
  };
}
