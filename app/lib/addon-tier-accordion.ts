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
