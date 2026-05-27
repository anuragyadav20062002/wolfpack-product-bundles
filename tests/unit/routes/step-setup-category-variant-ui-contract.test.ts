import fs from "node:fs";
import path from "node:path";

const productPageRouteSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);

describe("Product Page Step Setup category variant-display contract", () => {
  it("wires the category checkbox to the direct per-category variant flag", () => {
    const checkboxStart = productPageRouteSource.indexOf('label="Display variants as individual products"');
    expect(checkboxStart).toBeGreaterThan(-1);

    const checkboxBlock = productPageRouteSource.slice(checkboxStart, checkboxStart + 700);

    expect(checkboxBlock).toContain("displayVariantsAsIndividualProducts");
    expect(checkboxBlock).toContain("cat.displayVariantsAsIndividualProducts === true");
    expect(checkboxBlock).toContain("displayVariantsAsIndividualProducts: (e.target as HTMLInputElement).checked");
    expect(checkboxBlock).not.toContain("displayVariantsAsIndividual:");
  });

  it("creates new categories with explicit direct variant flags", () => {
    const addCategoryStart = productPageRouteSource.indexOf("products: [],\n                                          collections: [],");
    expect(addCategoryStart).toBeGreaterThan(-1);

    const addCategoryBlock = productPageRouteSource.slice(addCategoryStart, addCategoryStart + 320);

    expect(addCategoryBlock).toContain("displayVariantsAsIndividualProducts: false");
    expect(addCategoryBlock).toContain("displayVariantsAsSwatches: false");
  });
});
