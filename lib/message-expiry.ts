// A reserved integer keeps the existing D1 schema and protects these rows during a rollback.
export const NO_EXPIRY = Number.MAX_SAFE_INTEGER;

export function hasExpired(expiresAt: number, now = Date.now()): boolean {
  return expiresAt !== NO_EXPIRY && expiresAt <= now;
}
