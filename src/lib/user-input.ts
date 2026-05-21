export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateUsername(username: string): string | null {
  const value = normalizeUsername(username);
  if (value.length < 2) {
    return "Username must be at least 2 characters.";
  }
  if (value.length > 32) {
    return "Username must be at most 32 characters.";
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return "Username may only use letters, numbers, underscores, and hyphens.";
  }
  return null;
}
