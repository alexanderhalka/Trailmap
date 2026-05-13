import { getTrailById } from "@/lib/trail-queries";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/trails/[id]">,
) {
  try {
    const { id } = await context.params;
    const trail = await getTrailById(id);

    if (!trail) {
      return Response.json({ error: "Trail not found" }, { status: 404 });
    }

    return Response.json(trail);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}
