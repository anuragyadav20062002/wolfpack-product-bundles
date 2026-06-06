import fs from "node:fs";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "app/assets/bundle-widget-full-page.js");

describe("FPB box selection quantity validation runtime contract", () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(sourcePath, "utf8");
  });

  it("uses EB-style exact active box quantity validation", () => {
    expect(source).toContain("getBoxSelectionValidationState");
    expect(source).toContain("boxSelection?.validateBoxSelectionQuantity === true");
    expect(source).toContain("Number(totalQuantity || 0) === Number(activeRule.boxQuantity || 0)");
  });

  it("gates all FPB add-to-cart CTA paths with box selection validation", () => {
    expect(source).toContain("canCheckoutWithBoxSelection");
    expect(source).toContain("if (!this.canCheckoutWithBoxSelection())");
    expect(source.match(/this\.canCheckoutWithBoxSelection\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
  });
});
