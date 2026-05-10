/**
 * Unit Tests: PricingDisplay.showDiscountProgressBar
 *
 * Covers the three touch-points in pricing.ts:
 *   1. PricingDisplay type includes showDiscountProgressBar
 *   2. validatePricingConfiguration rejects missing / non-boolean showDiscountProgressBar
 *   3. createEmptyPricingConfig defaults showDiscountProgressBar to false
 */

import {
  validatePricingConfiguration,
  createEmptyPricingConfig,
} from "../../../app/types/pricing";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeValidConfig(displayOverrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    method: "percentage_off",
    rules: [],
    display: {
      showFooter: true,
      showDiscountProgressBar: false,
      ...displayOverrides,
    },
    messages: {
      progress: "Add {conditionText} to get {discountText}",
      qualified: "Congratulations!",
      showInCart: true,
    },
  };
}

// ---------------------------------------------------------------------------
// createEmptyPricingConfig — default value
// ---------------------------------------------------------------------------

describe("createEmptyPricingConfig", () => {
  it("defaults showDiscountProgressBar to false", () => {
    const config = createEmptyPricingConfig();
    expect(config.display.showDiscountProgressBar).toBe(false);
  });

  it("includes showDiscountProgressBar in display object", () => {
    const config = createEmptyPricingConfig();
    expect("showDiscountProgressBar" in config.display).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validatePricingConfiguration — showDiscountProgressBar checks
// ---------------------------------------------------------------------------

describe("validatePricingConfiguration — showDiscountProgressBar", () => {
  it("accepts true", () => {
    expect(validatePricingConfiguration(makeValidConfig({ showDiscountProgressBar: true }))).toBe(true);
  });

  it("accepts false", () => {
    expect(validatePricingConfiguration(makeValidConfig({ showDiscountProgressBar: false }))).toBe(true);
  });

  it("rejects missing showDiscountProgressBar", () => {
    const config = makeValidConfig();
    delete (config.display as any).showDiscountProgressBar;
    expect(validatePricingConfiguration(config)).toBe(false);
  });

  it("rejects string value", () => {
    expect(validatePricingConfiguration(makeValidConfig({ showDiscountProgressBar: "true" }))).toBe(false);
  });

  it("rejects null value", () => {
    expect(validatePricingConfiguration(makeValidConfig({ showDiscountProgressBar: null }))).toBe(false);
  });
});
