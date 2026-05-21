import { prisma } from "@/lib/db";
import { parseRating1to5 } from "@/lib/rating";
import { getAuthUserId, requireAuthUserId } from "@/lib/require-auth";
import { toReviewDto } from "@/lib/review-dto";
import { parseVisibility } from "@/lib/visibility";

const userSelect = { select: { username: true } } as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: trailId } = await context.params;
  const userId = await getAuthUserId();

  try {
    const trail = await prisma.trail.findUnique({ where: { id: trailId } });
    if (!trail) {
      return Response.json({ error: "Trail not found." }, { status: 404 });
    }

    const publicRows = await prisma.review.findMany({
      where: { trailId, visibility: "PUBLIC" },
      orderBy: { updatedAt: "desc" },
      include: { user: userSelect },
    });

    let myReview = null;
    if (userId) {
      const mine = await prisma.review.findUnique({
        where: { userId_trailId: { userId, trailId } },
        include: { user: userSelect },
      });
      if (mine) {
        myReview = toReviewDto(mine, { isOwner: true });
      }
    }

    const publicReviews = publicRows
      .filter((row) => row.userId !== userId)
      .map((row) => toReviewDto(row));

    return Response.json({ publicReviews, myReview });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userIdOrResponse = await requireAuthUserId();
  if (userIdOrResponse instanceof Response) {
    return userIdOrResponse;
  }

  const { id: trailId } = await context.params;

  try {
    const trail = await prisma.trail.findUnique({ where: { id: trailId } });
    if (!trail) {
      return Response.json({ error: "Trail not found." }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const physicalRating = parseRating1to5(body.physicalRating);
    const technicalRating = parseRating1to5(body.technicalRating);
    const exposureRating = parseRating1to5(body.exposureRating);
    const wildlifeRating = parseRating1to5(body.wildlifeRating);
    const overallRating = parseRating1to5(body.overallRating);
    const visibility = parseVisibility(body.visibility) ?? "PRIVATE";
    const textBody = typeof body.body === "string" ? body.body.trim() : "";

    if (
      physicalRating === null ||
      technicalRating === null ||
      exposureRating === null ||
      wildlifeRating === null ||
      overallRating === null
    ) {
      return Response.json(
        { error: "All ratings (physical, technical, exposure, wildlife, overall) must be 1–5." },
        { status: 400 },
      );
    }

    const saved = await prisma.review.upsert({
      where: {
        userId_trailId: { userId: userIdOrResponse, trailId },
      },
      create: {
        userId: userIdOrResponse,
        trailId,
        physicalRating,
        technicalRating,
        exposureRating,
        wildlifeRating,
        overallRating,
        body: textBody || null,
        visibility,
      },
      update: {
        physicalRating,
        technicalRating,
        exposureRating,
        wildlifeRating,
        overallRating,
        body: textBody || null,
        visibility,
      },
      include: { user: userSelect },
    });

    return Response.json(toReviewDto(saved, { isOwner: true }));
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}
