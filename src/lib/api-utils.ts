/**
 * Pick allowed fields from a request body.
 * Uses `!== undefined` so that `null` values pass through (important for clearing fields).
 */
export function pick(
  body: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const f of fields) {
    if (body[f] !== undefined) result[f] = body[f];
  }
  return result;
}
