import fs from "node:fs";
import path from "node:path";

const productPageRouteSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);

const fullPageRouteSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);

describe("Product Page Step Setup category variant-display contract", () => {
  it("renders one variant checkbox outside the category accordion body and writes all categories", () => {
    const checkboxStart = productPageRouteSource.indexOf('label="Display variants as individual products"');
    expect(checkboxStart).toBeGreaterThan(-1);
    const categoryBodyStart = productPageRouteSource.indexOf("categoryAccordionBody");
    const categoryBodyEnd = productPageRouteSource.indexOf("{/* ── Rules Configuration card ── */", categoryBodyStart);
    expect(checkboxStart).toBeGreaterThan(categoryBodyStart);
    expect(checkboxStart).toBeLessThan(categoryBodyEnd);

    const checkboxBlock = productPageRouteSource.slice(checkboxStart, checkboxStart + 700);

    expect(checkboxBlock).toContain("displayVariantsAsIndividualProducts");
    expect(checkboxBlock).toContain("displayVariantsForAllCategories");
    expect(checkboxBlock).toContain("displayVariantsAsIndividualProducts: checked");
    expect(checkboxBlock).not.toContain("displayVariantsAsIndividual:");
  });

  it("creates new categories with explicit direct variant flags", () => {
    const addCategoryStart = productPageRouteSource.indexOf("products: [],\n                                          collections: [],");
    expect(addCategoryStart).toBeGreaterThan(-1);

    const addCategoryBlock = productPageRouteSource.slice(addCategoryStart, addCategoryStart + 320);

    expect(addCategoryBlock).toContain("displayVariantsAsIndividualProducts: displayVariantsForAllCategories");
    expect(addCategoryBlock).toContain("displayVariantsAsSwatches: false");
  });
});

describe("Full Page Step Setup step variant-display contract", () => {
  it("renders the variant checkbox outside the category accordion with the canonical displayVariantsAsIndividual field", () => {
    const checkboxStart = fullPageRouteSource.indexOf('label="Display variants as individual products"');
    expect(checkboxStart).toBeGreaterThan(-1);
    const categoryBodyStart = fullPageRouteSource.indexOf("categoryAccordionBody");
    const categoryBodyEnd = fullPageRouteSource.indexOf("{/* ── Rules Configuration card ── */", categoryBodyStart);
    expect(checkboxStart).toBeGreaterThan(categoryBodyStart);
    expect(checkboxStart).toBeLessThan(categoryBodyEnd);

    const checkboxBlock = fullPageRouteSource.slice(checkboxStart, checkboxStart + 520);

    expect(checkboxBlock).toContain("checked={step.displayVariantsAsIndividual ?? undefined}");
    expect(checkboxBlock).not.toContain("displayVariantsAsIndividualProducts");
  });

  it("writes variant selector changes back to displayVariantsAsIndividual only", () => {
    const checkboxStart = fullPageRouteSource.indexOf('label="Display variants as individual products"');
    expect(checkboxStart).toBeGreaterThan(-1);

    const checkboxBlock = fullPageRouteSource.slice(checkboxStart, checkboxStart + 420);

    expect(checkboxBlock).toContain('stepsState.updateStepField(step.id, "displayVariantsAsIndividual", checked);');
    expect(checkboxBlock).not.toContain("stepsState.updateStepField(step.id, \"displayVariantsAsIndividualProducts\"");
  });
});
