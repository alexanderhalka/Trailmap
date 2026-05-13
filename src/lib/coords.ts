/** Default map pin used only when no valid coordinates are in the URL. */
export const DEFAULT_BASE_LAT = 51.1784;
export const DEFAULT_BASE_LNG = -115.5708;

export function parseLatLngParams(
  latStr: string | undefined,
  lngStr: string | undefined,
): { lat: number; lng: number } | null {
  if (latStr === undefined || lngStr === undefined) return null;
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
