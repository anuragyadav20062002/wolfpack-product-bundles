import fs from "node:fs";
import path from "node:path";

const routePaths = {
  fullPage: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
  ),
  productPage: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
};

const routeSources = Object.fromEntries(
  Object.entries(routePaths).map(([bundleType, filePath]) => [bundleType, fs.readFileSync(filePath, "utf8")]),
);

const sharedCategoryStyles = fs.readFileSync(
  path.join(process.cwd(), "app/styles/routes/bundle-configure-shared.module.css"),
  "utf8",
);
const fullPageStyles = fs.readFileSync(
  path.join(process.cwd(), "app/styles/routes/full-page-bundle-configure.module.css"),
  "utf8",
);
const productPageStyles = fs.readFileSync(
  path.join(process.cwd(), "app/styles/routes/product-page-bundle-configure.module.css"),
  "utf8",
);
const combinedCategoryStyles = `${sharedCategoryStyles}\n${fullPageStyles}\n${productPageStyles}`;

function categoryBodySource(source: string) {
  const start = source.indexOf("categoryAccordionBody");
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf("{/* ── Rules Configuration card ── */", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe.each(Object.entries(routeSources))("%s EB category accordion parity", (_bundleType, source) => {
  it("renders the screenshot category input row and tabs in the locked order", () => {
    const body = categoryBodySource(source);
    const categoryInput = body.indexOf('aria-label="Category name"');
    const storefrontHelper = body.indexOf("Will be visible on the storefront");
    const categoryLanguageAction = body.indexOf("openStepCategoryMultiLanguageModal(step.id, catIndex)");
    const productsTab = body.indexOf("Products");
    const collectionsTab = body.indexOf("Collections");

    expect(categoryInput).toBeGreaterThan(-1);
    expect(storefrontHelper).toBeGreaterThan(categoryInput);
    expect(categoryLanguageAction).toBeGreaterThan(categoryInput);
    expect(body).not.toContain('aria-label="Category title"');
    expect(productsTab).toBeGreaterThan(storefrontHelper);
    expect(collectionsTab).toBeGreaterThan(productsTab);
  });

  it("keeps category rules in the Rules Configuration card, not inside the accordion body", () => {
    const body = categoryBodySource(source);
    const rulesCard = source.slice(source.indexOf("{/* ── Rules Configuration card ── */"));

    expect(body).not.toContain("categoryRuleInlinePanel");
    expect(body).not.toContain("Create Rules based on amount or quantity of products added on this category.");
    expect(body).not.toContain("Note: Rules are only valid on this category");
    expect(rulesCard).toContain("Create Rules based on amount or quantity of products added on this category.");
    expect(rulesCard).toContain("addCategoryConditionRule(step.id, catIndex)");
    expect(rulesCard).toContain("updateCategoryConditionRule(step.id, catIndex, ruleId, \"condition\"");
    expect(rulesCard).toContain("updateCategoryAutoNextRule(step.id, catIndex");
  });

  it("does not use invalid plain Polaris button variants in the category accordion body", () => {
    const body = categoryBodySource(source);

    expect(body).not.toContain('variant="plain"');
    expect(body).not.toContain('gap="small-400"');
    expect(body).not.toContain('gap="small-100"');
  });
});

describe.each(Object.entries(routeSources))("%s category picker helper copy", (_bundleType, source) => {
  it("renders exact helper copy above product and collection picker buttons", () => {
    const body = categoryBodySource(source);
    const productsCopy = body.indexOf("Products selected here will be displayed on this step");
    const addProducts = body.indexOf("Add Products");
    const collectionsCopy = body.indexOf("Collections selected here will be displayed on this step");
    const addCollections = body.indexOf("Add Collections");

    expect(productsCopy).toBeGreaterThan(-1);
    expect(addProducts).toBeGreaterThan(productsCopy);
    expect(collectionsCopy).toBeGreaterThan(-1);
    expect(addCollections).toBeGreaterThan(collectionsCopy);
  });
});

describe("shared screenshot category accordion styles", () => {
  it("locks the visible category accordion shape from the screenshot", () => {
    expect(sharedCategoryStyles).toContain("grid-template-columns: 18px minmax(0, 1fr) auto 28px");
    expect(sharedCategoryStyles).toContain("border-radius: 10px");
    expect(sharedCategoryStyles).toContain(".categoryFieldLabel");
    expect(sharedCategoryStyles).toContain("position: absolute");
    expect(combinedCategoryStyles).toContain("grid-template-columns: minmax(0, 1fr) auto");
    expect(combinedCategoryStyles).toContain("border-bottom: 2px solid #303030");
    expect(combinedCategoryStyles).toContain("border-radius: 999px");
    expect(combinedCategoryStyles).toContain("background: #303030");
    expect(sharedCategoryStyles).toContain("min-height: 28px");
    expect(sharedCategoryStyles).toContain("border-color: #d9d9d9");
    expect(sharedCategoryStyles).toContain(".categoryPickerHelp");
    expect(sharedCategoryStyles).toContain("height: 36px");
    expect(sharedCategoryStyles).toContain("min-height: 36px");
    expect(combinedCategoryStyles).toContain("width: 100%");
  });
});

describe.each(Object.entries(routeSources))("%s Add Category and variant checkbox layout", (_bundleType, source) => {
  it("keeps a full-width Add Category button followed by a divider and variant checkbox", () => {
    const categoryCard = categoryBodySource(source);
    const addCategory = categoryCard.indexOf("Add Category");
    const divider = categoryCard.indexOf("<s-divider", addCategory);
    const variantCheckbox = categoryCard.indexOf('label="Display variants as individual products"', divider);

    expect(addCategory).toBeGreaterThan(-1);
    expect(divider).toBeGreaterThan(addCategory);
    expect(variantCheckbox).toBeGreaterThan(divider);
  });
});

describe("Product Page category rules visibility", () => {
  it("renders category rules from Rules Configuration when categories exist", () => {
    const body = categoryBodySource(routeSources.productPage);
    const rulesCard = routeSources.productPage.slice(routeSources.productPage.indexOf("{/* ── Rules Configuration card ── */"));

    expect(routeSources.productPage).toContain("const categoryRulesAvailable = stepCategories.length > 0;");
    expect(body).not.toContain("categoryRuleInlinePanel");
    expect(rulesCard).toContain("addCategoryConditionRule(step.id, catIndex)");
  });
});
