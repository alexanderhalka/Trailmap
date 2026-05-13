export async function POST(request: Request) {
  const body = (await request.json()) as { query?: string };

  if (!body.query || body.query.trim().length < 2) {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", body.query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "TrailMap/1.0",
    },
  });

  if (!response.ok) {
    return Response.json({ error: "Geocode service unavailable" }, { status: 502 });
  }

  const results = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  const top = results[0];

  if (!top) {
    return Response.json({ error: "Location not found" }, { status: 404 });
  }

  return Response.json({
    name: top.display_name,
    lat: Number(top.lat),
    lng: Number(top.lon),
  });
}
