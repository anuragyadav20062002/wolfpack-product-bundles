import {
  deleteAddonTierAtIndex,
  getNextAddonTierAccordionIndex,
  normalizeAddonTierAccordionIndex,
} from "../../../app/lib/addon-tier-accordion";

describe("addon tier accordion state", () => {
  it("collapses the active tier when its header is clicked", () => {
    expect(getNextAddonTierAccordionIndex(0, 0)).toBeNull();
  });

  it("expands the clicked tier when another tier is active", () => {
    expect(getNextAddonTierAccordionIndex(0, 1)).toBe(1);
  });

  it("expands the clicked tier when all tiers are collapsed", () => {
    expect(getNextAddonTierAccordionIndex(null, 1)).toBe(1);
  });

  it("clamps an active tier when the tier count shrinks", () => {
    expect(normalizeAddonTierAccordionIndex(2, 2)).toBe(1);
  });

  it("preserves collapsed state when the tier count changes", () => {
    expect(normalizeAddonTierAccordionIndex(null, 2)).toBeNull();
  });

  it("deletes the requested tier from a multi-tier list", () => {
    const tiers = [{ id: "tier-1" }, { id: "tier-2" }, { id: "tier-3" }];

    expect(deleteAddonTierAtIndex(tiers, 1)).toEqual([
      { id: "tier-1" },
      { id: "tier-3" },
    ]);
  });

  it("keeps the only tier when delete is requested", () => {
    const tiers = [{ id: "tier-1" }];

    expect(deleteAddonTierAtIndex(tiers, 0)).toEqual([{ id: "tier-1" }]);
  });
});
