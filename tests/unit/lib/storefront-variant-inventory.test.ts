import { describe, expect, it } from "@jest/globals";

import { normalizeStorefrontQuantityAvailable } from "../../../app/lib/storefront-variant-inventory";

describe("normalizeStorefrontQuantityAvailable", () => {
  it("treats sellable zero-quantity variants as unbounded inventory", () => {
    expect(
      normalizeStorefrontQuantityAvailable({
        availableForSale: true,
        quantityAvailable: 0,
        currentlyNotInStock: false,
      }),
    ).toBeNull();
  });

  it("keeps true unavailable zero-quantity variants bounded at zero", () => {
    expect(
      normalizeStorefrontQuantityAvailable({
        availableForSale: false,
        quantityAvailable: 0,
        currentlyNotInStock: false,
      }),
    ).toBe(0);
  });

  it("preserves positive quantity values", () => {
    expect(
      normalizeStorefrontQuantityAvailable({
        availableForSale: true,
        quantityAvailable: 7,
        currentlyNotInStock: false,
      }),
    ).toBe(7);
  });
});
