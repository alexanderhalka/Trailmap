import { prisma } from "@/lib/db";
import { isAccessMode } from "@/lib/trail-dto";
import type { AccessMode } from "@/lib/types";

export async function GET() {
  try {
    const rows = await prisma.tripPlan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        trail: { select: { id: true, name: true } },
      },
    });

    return Response.json(
      rows.map((row) => ({
        id: row.id,
        title: row.title,
        baseLocationName: row.baseLocationName,
        baseLat: row.baseLat,
        baseLng: row.baseLng,
        trailId: row.trailId,
        mode: row.mode as AccessMode,
        notes: row.notes ?? undefined,
        createdAt: row.createdAt.toISOString(),
        trail: row.trail,
      })),
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      baseLocationName?: string;
      baseLat?: number;
      baseLng?: number;
      trailId?: string;
      mode?: AccessMode;
      notes?: string;
    };

    if (
      !body.title ||
      !body.baseLocationName ||
      typeof body.baseLat !== "number" ||
      typeof body.baseLng !== "number" ||
      !body.trailId ||
      !body.mode ||
      !isAccessMode(body.mode)
    ) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const trail = await prisma.trail.findUnique({ where: { id: body.trailId } });
    if (!trail) {
      return Response.json({ error: "Trail not found" }, { status: 404 });
    }

    const plan = await prisma.tripPlan.create({
      data: {
        title: body.title,
        baseLocationName: body.baseLocationName,
        baseLat: body.baseLat,
        baseLng: body.baseLng,
        trailId: body.trailId,
        mode: body.mode,
        notes: body.notes ?? null,
      },
    });

    return Response.json(
      {
        id: plan.id,
        title: plan.title,
        baseLocationName: plan.baseLocationName,
        baseLat: plan.baseLat,
        baseLng: plan.baseLng,
        trailId: plan.trailId,
        mode: plan.mode as AccessMode,
        notes: plan.notes ?? undefined,
        createdAt: plan.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}
