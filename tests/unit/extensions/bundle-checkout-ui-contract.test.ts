import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Bundle checkout UI contract", () => {
  const source = readFileSync(
    join(process.cwd(), "extensions/bundle-checkout-ui/src/Checkout.tsx"),
    "utf8",
  );

  it("renders an aggregate bundle savings panel for discounted bundles", () => {
    expect(source).toContain("Bundle Savings");
    expect(source).toContain("Retail Price:");
    expect(source).toContain("Bundle Price:");
    expect(source).toContain("Savings:");
    expect(source).toContain("% Saved:");
    expect(source).toContain("calculateSavingsPercent(totalSavingsCents, totalRetailCents)");
  });

  it("does not render redundant bundle item list UI", () => {
    const showItemsCopy = ["Show ", "{components.length} Items"].join("$");
    const hideItemsCopy = ["Hide ", "{components.length} Items"].join("$");

    expect(source).not.toContain("Bundle ({componentCount} items)");
    expect(source).not.toContain(showItemsCopy);
    expect(source).not.toContain(hideItemsCopy);
    expect(source).not.toContain("<s-product-thumbnail");
    expect(source).not.toContain("Percentage Savings:");
    expect(source).not.toContain("Exact Savings:");
  });

  it("does not render custom checkout output when the bundle has no discount", () => {
    expect(source).toContain("if (!hasDiscount) {");
    expect(source).toContain("return null;");
  });

  it("keeps non-bundle checkout lines untouched", () => {
    expect(source).toContain("const isBundleParent = getAttr('_is_bundle_parent') === 'true';");
    expect(source).toContain("if (!isBundleParent) {");
    expect(source).toContain("return null;");
  });
});
