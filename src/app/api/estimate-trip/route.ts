import { getTrailById } from "@/lib/trail-queries";
import { estimateTripHours } from "@/lib/trip-estimate";
import { isAccessMode } from "@/lib/trail-dto";
import type { AccessMode } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      baseLat?: number;
      baseLng?: number;
      trailId?: string;
      mode?: AccessMode;
    };

    if (
      typeof body.baseLat !== "number" ||
      typeof body.baseLng !== "number" ||
      !body.trailId ||
      !body.mode ||
      !isAccessMode(body.mode)
    ) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const trail = await getTrailById(body.trailId);
    if (!trail) {
      return Response.json({ error: "Trail not found" }, { status: 404 });
    }

    return Response.json(
      estimateTripHours(body.baseLat, body.baseLng, trail, body.mode),
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}
