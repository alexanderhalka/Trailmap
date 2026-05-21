export type Visibility = "PRIVATE" | "PUBLIC";

export function parseVisibility(value: unknown): Visibility | null {
  if (value === "PRIVATE" || value === "PUBLIC") {
    return value;
  }
  return null;
}

export function visibilityLabel(value: Visibility): string {
  return value === "PUBLIC" ? "Public" : "Private";
}
