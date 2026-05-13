import { listTrailsFiltered } from "@/lib/trail-queries";
import { parseTravelLegsFromSearchParams } from "@/lib/travel-legs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const legs = parseTravelLegsFromSearchParams(searchParams);
    const maxPhysical = Number(searchParams.get("maxPhysical") ?? "5");
    const maxTechnical = Number(searchParams.get("maxTechnical") ?? "5");
    const maxExposure = Number(searchParams.get("maxExposure") ?? "5");

    const trails = await listTrailsFiltered({
      legs,
      maxPhysical,
      maxTechnical,
      maxExposure,
    });

    return Response.json(trails);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}
