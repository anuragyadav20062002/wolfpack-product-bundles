/**
 * Normalize a raw condition value from form data into a number, preserving 0.
 *
 * The historical inline form was `value ? parseInt(value) || null : null` which
 * silently dropped `conditionValue: 0` to null because `0 || null` evaluates to
 * null. Use this helper instead.
 */
export function parseConditionValue(raw: unknown): number | null {
  if (raw == null) return null;
  const str = typeof raw === "string" ? raw.trim() : String(raw);
  if (str === "") return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}
