import fs from "node:fs";
import path from "node:path";

const routes = {
  fpb: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"
  ),
  ppb: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"
  ),
};

const sources = Object.fromEntries(
  Object.entries(routes).map(([name, filePath]) => [name, fs.readFileSync(filePath, "utf8")])
);
const discountMethodOptionsSource = fs.readFileSync(
  path.join(process.cwd(), "app/constants/bundle.ts"),
  "utf8"
);
const ppbStylesSource = fs.readFileSync(
  path.join(process.cwd(), "app/styles/routes/product-page-bundle-configure.module.css"),
  "utf8"
);

describe("shared Discount Type live copy and order", () => {
  it("renders Fixed Amount Off first and uses the confirmed Buy X, get Y label", () => {
    const fixedAmount = discountMethodOptionsSource.indexOf('{ label: "Fixed Amount Off"');
    const percentage = discountMethodOptionsSource.indexOf('{ label: "Percentage Off"');
    const fixedBundle = discountMethodOptionsSource.indexOf('{ label: "Fixed Bundle Price"');
    const buyXGetY = discountMethodOptionsSource.indexOf('{ label: "Buy X, get Y"');

    expect(fixedAmount).toBeGreaterThan(-1);
    expect(percentage).toBeGreaterThan(fixedAmount);
    expect(fixedBundle).toBeGreaterThan(percentage);
    expect(buyXGetY).toBeGreaterThan(fixedBundle);
  });
});

describe.each(Object.entries(sources))("%s Discount & Pricing live UI contract", (_name, source) => {
  it("renders the exact progress mode labels without Simple Bar message fields", () => {
    expect(source).toContain('<s-choice value="simple">Simple Bar</s-choice>');
    expect(source).toContain('<s-choice value="step_based">Step-Based Bar</s-choice>');
    expect(source).not.toContain('label="Progress Text"');
    expect(source).not.toContain('label="Success Text"');
  });

  it("renders the exact Buy X, get Y options and information notice", () => {
    expect(source).toContain('<s-option value="percentage">% off</s-option>');
    expect(source).toContain('<s-option value="fixed_amount">₹ off</s-option>');
    expect(source).toContain("The lowest priced items");
    expect(source).toContain("The latest added items");
    expect(source).toContain(
      "Discount messaging displays the Total Quantity to Claim Offer (Buy + Get) to ensure customers add their rewards to the cart"
    );
  });

  it("replaces rules with one default rule when discount type changes", () => {
    expect(source).toContain("createNewPricingRule(nextDiscountType)");
    expect(source).toContain("pricingState.setDiscountRules([nextRule])");
  });

  it("resets stale success-message state and renders method-specific defaults when discount type changes", () => {
    expect(source).toContain('setGlobalSuccessMessage("")');
    expect(source).toContain("setSuccessMessageByLocale({})");
    expect(source).toContain("getDefaultDiscountRuleSuccessMessage(pricingState.discountType)");
  });

  it("keeps success-message state in the save callback dependencies", () => {
    const handleSaveStart = source.indexOf("const handleSave = useCallback");
    const depsStart = source.indexOf("  }, [", handleSaveStart);
    const depsEnd = source.indexOf("  ]);", depsStart);
    const deps = source.slice(depsStart, depsEnd);

    expect(deps).toContain("globalSuccessMessage");
    expect(deps).toContain("successMessageByLocale");
  });

  it("implements the translated box-label modal contract", () => {
    expect(source).toContain("bundleQuantityMultiLangModalRef");
    expect(source).toContain('id="discount-bundle-quantity-language-modal"');
    expect(source).toContain('heading="Customize Text for Multiple Languages"');
    expect(source).toContain('label="Select Language"');
    expect(source).toContain('label="Box Label"');
    expect(source).toContain('label="Box Subtext"');
    expect(source).toContain("Save and close");
  });

  it("implements the close-only Variables modal with discount tokens", () => {
    expect(source).toContain('id="discount-variables-modal"');
    expect(source).toContain('heading="Variables"');
    expect(source).toContain("isDiscountVariablesModalOpen");
    expect(source).toContain("setIsDiscountVariablesModalOpen(true)");
    expect(source).toContain("useModalHideListener(discountVariablesModalRef");
    expect(source).toContain("{{discountConditionDiff}}");
    expect(source).toContain("{{discountUnit}}");
    expect(source).toContain("{{discountValue}}");
    expect(source).toContain("{{discountValueUnit}}");
    expect(source).toContain("{{discountedItems}}");
  });

  it("uses styling/state hooks for the live rule header and inactive display options", () => {
    expect(source).toContain("discountRuleHeader");
    expect(source).toContain("displayOptionsInactive");
  });

  it("orders display options as quantity, progress, then messaging", () => {
    const quantity = source.indexOf(">Bundle Quantity Options</p>");
    const progress = source.indexOf(">Progress Bar</p>");
    const messaging = source.indexOf(">Discount Messaging</p>");

    expect(quantity).toBeGreaterThan(-1);
    expect(progress).toBeGreaterThan(quantity);
    expect(messaging).toBeGreaterThan(progress);
  });
});

describe("product-page Discount & Pricing Admin layout contract", () => {
  it("uses the Shopify app title row plus the evidence-backed configure header", () => {
    expect(sources.ppb).toContain("productPageBundleStyles.canvasHeader");
    expect(sources.ppb).toContain("Configure Bundle Flow");
    expect(sources.ppb).toContain("Readiness Score");
    expect(sources.ppb).toContain("Preview Bundle");
    expect(sources.ppb).not.toContain("<ui-title-bar");
    expect(sources.ppb).not.toContain("<AppEmbedBanner");
    expect(sources.ppb).not.toContain("productPageBundleStyles.appHeader");
    expect(sources.ppb).not.toContain("Product Bundle Builder");
  });

  it("uses dedicated wrappers for the Buy X, get Y rule body and reward controls row", () => {
    expect(sources.ppb).toContain("productPageBundleStyles.bxyRuleBody");
    expect(sources.ppb).toContain("productPageBundleStyles.bxyRewardGrid");
  });

  it("keeps the Product Page configure canvas left-aligned and wide enough for the evidence-backed two-column shell", () => {
    expect(ppbStylesSource).toContain("max-width: 994px;");
    expect(ppbStylesSource).toContain("margin: 0;");
    expect(ppbStylesSource).not.toContain("margin: 0 auto;");
    expect(ppbStylesSource).toContain("margin: 22px 0 35px;");
    expect(ppbStylesSource).toContain("flex: 0 0 310px;");
    expect(ppbStylesSource).toContain("min-width: 310px;");
  });

  it("lays out Buy X, get Y reward controls as a three-column row on desktop", () => {
    expect(ppbStylesSource).toContain(".bxyRewardGrid");
    expect(ppbStylesSource).toContain("grid-template-columns: minmax(140px, 1fr) minmax(160px, 1fr) minmax(220px, 1.25fr);");
  });

  it("does not keep unused internal app-header styles in the evidence-backed configure shell", () => {
    expect(ppbStylesSource).not.toContain(".appHeader");
    expect(ppbStylesSource).not.toContain(".appBrandBadge");
    expect(ppbStylesSource).not.toContain(".appHeaderMenu");
  });
});
