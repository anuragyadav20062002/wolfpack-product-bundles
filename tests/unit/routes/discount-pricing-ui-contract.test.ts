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
