const STORAGE_KEY = "trailmap_base_v1";

export type StoredResolvedBase = {
  query: string;
  displayName: string;
  lat: number;
  lng: number;
};

export function loadStoredBase(): StoredResolvedBase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredResolvedBase;
    if (
      typeof data.query !== "string" ||
      typeof data.displayName !== "string" ||
      typeof data.lat !== "number" ||
      typeof data.lng !== "number" ||
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveStoredBase(data: StoredResolvedBase): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}
