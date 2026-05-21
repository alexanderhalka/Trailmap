export function parseRating1to5(value: unknown): number | null {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
      return parsed;
    }
    return null;
  }
  if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5) {
    return value;
  }
  return null;
}
