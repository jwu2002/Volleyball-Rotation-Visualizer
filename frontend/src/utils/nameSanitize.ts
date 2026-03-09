/** Max length for rotation/config and lineup names (must match backend). */
export const MAX_NAME_LENGTH = 200;

/** Strip, remove control characters, and truncate to MAX_NAME_LENGTH. */
export function sanitizeName(name: string): string {
  const stripped = name.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (stripped.length <= MAX_NAME_LENGTH) return stripped;
  return stripped.slice(0, MAX_NAME_LENGTH);
}
