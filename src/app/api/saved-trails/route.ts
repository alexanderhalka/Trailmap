import { prisma } from "@/lib/db";
import { requireAuthUserId } from "@/lib/require-auth";
import { toSavedTrailDto } from "@/lib/saved-trail-dto";
import { parseVisibility } from "@/lib/visibility";

const trailSelect = {
  id: true,
  name: true,
  distanceKm: true,
  elevationGainM: true,
  physicalScore: true,
  technicalScore: true,
  exposureScore: true,
} as const;

export async function GET() {
  const userIdOrResponse = await requireAuthUserId();
  if (userIdOrResponse instanceof Response) {
    return userIdOrResponse;
  }

  try {
    const rows = await prisma.savedTrail.findMany({
      where: { userId: userIdOrResponse },
      orderBy: { createdAt: "desc" },
      include: { trail: { select: trailSelect } },
    });

    return Response.json(rows.map(toSavedTrailDto));
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const userIdOrResponse = await requireAuthUserId();
  if (userIdOrResponse instanceof Response) {
    return userIdOrResponse;
  }

  try {
    const body = (await request.json()) as { trailId?: string; visibility?: string };

    if (!body.trailId || typeof body.trailId !== "string") {
      return Response.json({ error: "trailId is required." }, { status: 400 });
    }

    const visibility = parseVisibility(body.visibility) ?? "PRIVATE";

    const trail = await prisma.trail.findUnique({ where: { id: body.trailId } });
    if (!trail) {
      return Response.json({ error: "Trail not found." }, { status: 404 });
    }

    const existing = await prisma.savedTrail.findUnique({
      where: {
        userId_trailId: {
          userId: userIdOrResponse,
          trailId: body.trailId,
        },
      },
    });

    if (existing) {
      return Response.json(
        { error: "This trail is already in your saved list." },
        { status: 409 },
      );
    }

    const saved = await prisma.savedTrail.create({
      data: {
        userId: userIdOrResponse,
        trailId: body.trailId,
        visibility,
      },
      include: { trail: { select: trailSelect } },
    });

    return Response.json(toSavedTrailDto(saved), { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}
