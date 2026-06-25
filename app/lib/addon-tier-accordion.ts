export type AddonTierAccordionIndex = number | null;

export function getNextAddonTierAccordionIndex(
  currentIndex: AddonTierAccordionIndex,
  clickedIndex: number,
): AddonTierAccordionIndex {
  return currentIndex === clickedIndex ? null : clickedIndex;
}

export function normalizeAddonTierAccordionIndex(
  currentIndex: AddonTierAccordionIndex,
  tierCount: number,
): AddonTierAccordionIndex {
  if (currentIndex === null) return null;
  if (tierCount <= 0) return null;
  if (currentIndex < tierCount) return currentIndex;
  return Math.max(0, tierCount - 1);
}

export function deleteAddonTierAtIndex<T>(tiers: T[], deleteIndex: number): T[] {
  if (tiers.length <= 1) return tiers;
  if (deleteIndex < 0 || deleteIndex >= tiers.length) return tiers;
  return tiers.filter((_, index) => index !== deleteIndex);
}
