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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userIdOrResponse = await requireAuthUserId();
  if (userIdOrResponse instanceof Response) {
    return userIdOrResponse;
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as { visibility?: string };
    const visibility = parseVisibility(body.visibility);
    if (!visibility) {
      return Response.json({ error: "visibility must be PRIVATE or PUBLIC." }, { status: 400 });
    }

    const existing = await prisma.savedTrail.findFirst({
      where: { id, userId: userIdOrResponse },
    });

    if (!existing) {
      return Response.json({ error: "Saved trail not found." }, { status: 404 });
    }

    const saved = await prisma.savedTrail.update({
      where: { id },
      data: { visibility },
      include: { trail: { select: trailSelect } },
    });

    return Response.json(toSavedTrailDto(saved));
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userIdOrResponse = await requireAuthUserId();
  if (userIdOrResponse instanceof Response) {
    return userIdOrResponse;
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.savedTrail.findFirst({
      where: { id, userId: userIdOrResponse },
    });

    if (!existing) {
      return Response.json({ error: "Saved trail not found." }, { status: 404 });
    }

    await prisma.savedTrail.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}
