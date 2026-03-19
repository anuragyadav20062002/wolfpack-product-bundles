/**
 * Tier Config Validator
 *
 * Validates and normalises raw tier configuration input before writing to
 * Bundle.tierConfig in the database. Strips invalid entries and verifies
 * that all linkedBundleIds belong to the requesting shop.
 */

import type { TierConfig, TierConfigEntry } from "../types/tier-config";

const MAX_TIERS = 4;
const MAX_LABEL_LENGTH = 50;

/**
 * Validate and normalise a raw tier config payload.
 *
 * @param raw     - Untrusted input (e.g. JSON.parse result from formData)
 * @param shopId  - The shop domain; used to confirm bundle ownership
 * @param db      - Prisma client (only bundle.findMany is called)
 * @returns       Normalised TierConfig (0–4 entries), never throws
 */
export async function validateTierConfig(
  raw: unknown,
  shopId: string,
  db: { bundle: { findMany: (args: any) => Promise<{ id: string }[]> } }
): Promise<TierConfig> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [];
  }

  // Normalise and pre-filter without DB (label/id presence + length)
  const candidates: TierConfigEntry[] = [];
  for (const item of raw) {
    if (typeof item?.label !== "string" || typeof item?.linkedBundleId !== "string") {
      continue;
    }
    const label = item.label.trim();
    const linkedBundleId = item.linkedBundleId.trim();
    if (label === "" || linkedBundleId === "" || label.length > MAX_LABEL_LENGTH) {
      continue;
    }
    candidates.push({ label, linkedBundleId });
    if (candidates.length >= MAX_TIERS) break;
  }

  if (candidates.length === 0) {
    return [];
  }

  // Verify all linkedBundleIds belong to this shop
  const requestedIds = candidates.map((c) => c.linkedBundleId);
  const validBundles = await db.bundle.findMany({
    where: { id: { in: requestedIds }, shopId },
    select: { id: true },
  });
  const validIds = new Set(validBundles.map((b) => b.id));

  return candidates.filter((c) => validIds.has(c.linkedBundleId));
}
