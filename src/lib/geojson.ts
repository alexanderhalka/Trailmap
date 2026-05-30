export type LineStringGeoJson = {
  type: "LineString";
  coordinates: [number, number][];
};

export type RouteGeoJson = LineStringGeoJson;

/** GeoJSON uses [lng, lat]; Leaflet uses [lat, lng]. */
export function geoJsonToLeafletPositions(
  coordinates: [number, number][],
): [number, number][] {
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

export function parseRouteGeoJson(value: unknown): RouteGeoJson | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  if (record.type === "Feature" && record.geometry) {
    return parseRouteGeoJson(record.geometry);
  }

  if (record.type !== "LineString" || !Array.isArray(record.coordinates)) {
    return undefined;
  }

  const coordinates: [number, number][] = [];
  for (const point of record.coordinates) {
    if (!Array.isArray(point) || point.length < 2) {
      return undefined;
    }
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return undefined;
    }
    coordinates.push([lng, lat]);
  }

  if (coordinates.length < 2) {
    return undefined;
  }

  return { type: "LineString", coordinates };
}

export function boundsFromLeafletPositions(
  positions: [number, number][],
): [[number, number], [number, number]] | null {
  if (positions.length === 0) {
    return null;
  }

  let minLat = positions[0][0];
  let maxLat = positions[0][0];
  let minLng = positions[0][1];
  let maxLng = positions[0][1];

  for (const [lat, lng] of positions) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}
