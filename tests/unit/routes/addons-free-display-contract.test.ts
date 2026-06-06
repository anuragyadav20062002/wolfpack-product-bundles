import fs from "node:fs";
import path from "node:path";

const handlerSources = {
  fullPage: fs.readFileSync(
    path.join(
      process.cwd(),
      "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts",
    ),
    "utf8",
  ),
  productPage: fs.readFileSync(
    path.join(
      process.cwd(),
      "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts",
    ),
    "utf8",
  ),
};

const sharedSources = {
  pricingCalculator: fs.readFileSync(
    path.join(process.cwd(), "app/assets/widgets/shared/pricing-calculator.js"),
    "utf8",
  ),
};

describe.each(Object.entries(handlerSources))("%s handler source — addonDisplayFree strictness contract", (_bundleType, source) => {
  it("persists add-on free display as strict true/false", () => {
    expect(source).toContain("addonDisplayFree: step.addonDisplayFree === true");
    expect(source).not.toContain("step.addonDisplayFree !== false");
  });
});

describe("Widget shared pricing calculator — add-on free-gift skip contract", () => {
  it("skips only strict free add-on gift steps from totals", () => {
    expect(sharedSources.pricingCalculator).toContain("steps?.[stepIndex]?.isFreeGift && steps?.[stepIndex]?.addonDisplayFree === true");
    expect(sharedSources.pricingCalculator).not.toContain("addonDisplayFree !== false");
  });
});
