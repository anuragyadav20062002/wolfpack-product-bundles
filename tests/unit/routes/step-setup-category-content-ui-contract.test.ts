import fs from "node:fs";
import path from "node:path";

const productPageRouteSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);

function getCategoryBodySource() {
  const start = productPageRouteSource.indexOf("categoryAccordionBody");
  expect(start).toBeGreaterThan(-1);
  const end = productPageRouteSource.indexOf("Add Category", start);
  expect(end).toBeGreaterThan(start);
  return productPageRouteSource.slice(start, end);
}

describe("Product Page Step Setup category content contract", () => {
  it("renders the screenshot category input, helper, language action, and tabs in order", () => {
    const body = getCategoryBodySource();
    const categoryInput = body.indexOf('aria-label="Category name"');
    const storefrontHelper = body.indexOf("Will be visible on the storefront");
    const categoryLanguageAction = body.indexOf("openStepCategoryMultiLanguageModal(step.id, catIndex)");
    const tabRow = body.indexOf("productPageBundleStyles.tabRow");

    expect(categoryInput).toBeGreaterThan(-1);
    expect(storefrontHelper).toBeGreaterThan(categoryInput);
    expect(categoryLanguageAction).toBeGreaterThan(categoryInput);
    expect(body).not.toContain('aria-label="Category title"');
    expect(tabRow).toBeGreaterThan(storefrontHelper);
    expect(body).toContain("title: e.target.value");
  });

  it("does not render the variant-display checkbox inside the category accordion body", () => {
    const body = getCategoryBodySource();
    const variantCheckbox = body.indexOf('label="Display variants as individual products"');

    expect(variantCheckbox).toBe(-1);
  });

  it("creates new categories with a direct title field", () => {
    const addCategoryStart = productPageRouteSource.indexOf("products: [],\n                                          collections: [],");
    expect(addCategoryStart).toBeGreaterThan(-1);

    const addCategoryBlock = productPageRouteSource.slice(addCategoryStart - 140, addCategoryStart + 360);

    expect(addCategoryBlock).toContain('title: ""');
  });
});
