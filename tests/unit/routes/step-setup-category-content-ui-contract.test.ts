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
  const end = productPageRouteSource.indexOf("{/* ── Rules Configuration card ── */", start);
  expect(end).toBeGreaterThan(start);
  return productPageRouteSource.slice(start, end);
}

describe("Product Page Step Setup category content contract", () => {
  it("renders Category Name, category language, Category Title, and tabs in the captured order", () => {
    const body = getCategoryBodySource();
    const categoryNameLabel = body.indexOf("Category Name");
    const categoryLanguageAction = body.indexOf("openStepCategoryMultiLanguageModal(step.id, catIndex)");
    const categoryTitleLabel = body.indexOf("Category Title");
    const categoryTitleInput = body.indexOf('aria-label="Category title"');
    const tabRow = body.indexOf("productPageBundleStyles.tabRow");

    expect(categoryNameLabel).toBeGreaterThan(-1);
    expect(categoryLanguageAction).toBeGreaterThan(categoryNameLabel);
    expect(categoryTitleLabel).toBeGreaterThan(categoryLanguageAction);
    expect(categoryTitleInput).toBeGreaterThan(categoryTitleLabel);
    expect(tabRow).toBeGreaterThan(categoryTitleInput);
    expect(body).toContain("title: e.target.value");
  });

  it("renders the variant-display checkbox after product and collection selection controls", () => {
    const body = getCategoryBodySource();
    const tabRow = body.indexOf("productPageBundleStyles.tabRow");
    const addProducts = body.indexOf("Add Products");
    const addCollections = body.indexOf("Add Collections");
    const variantCheckbox = body.indexOf('label="Display variants as individual products"');

    expect(variantCheckbox).toBeGreaterThan(addProducts);
    expect(variantCheckbox).toBeGreaterThan(addCollections);
    expect(variantCheckbox).toBeGreaterThan(tabRow);
  });

  it("creates new categories with a direct title field", () => {
    const addCategoryStart = productPageRouteSource.indexOf("products: [],\n                                          collections: [],");
    expect(addCategoryStart).toBeGreaterThan(-1);

    const addCategoryBlock = productPageRouteSource.slice(addCategoryStart - 140, addCategoryStart + 360);

    expect(addCategoryBlock).toContain('title: ""');
  });
});
