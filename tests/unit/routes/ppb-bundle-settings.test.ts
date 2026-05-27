/**
 * Unit tests — parsePPBBundleSettings
 *
 * Spec: test-spec/ppb-bundle-settings.spec.md
 * Issue: [ppb-edit-bundle-flow-1]
 */

import { parsePPBBundleSettings } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const routeSource = readFileSync(
  join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);
const stylesSource = readFileSync(
  join(process.cwd(), "app/styles/routes/product-page-bundle-configure.module.css"),
  "utf8",
);

jest.mock("../../../app/lib/css-sanitizer", () => ({
  processCss: jest.fn((css: string) => ({
    sanitizedCss: css.replace(/<script/gi, ""),
    isValid: true,
    warnings: [],
    syntaxErrors: [],
  })),
}));

function makeForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("parsePPBBundleSettings", () => {
  it("returns correct defaults when form has no bundle settings fields", () => {
    const result = parsePPBBundleSettings(makeForm({}));
    expect(result.preSelectedProductVariantId).toBeNull();
    expect(result.maxQtyPerProduct).toBeNull();
    expect(result.productSlotsEnabled).toBe(false);
    expect(result.productSlotIconUrl).toBeNull();
    expect(result.variantSelectorEnabled).toBe(true);
    expect(result.showTextOnAddButton).toBe(false);
    expect(result.bundleCartTitle).toBeNull();
    expect(result.bundleCartSubtitle).toBeNull();
    expect(result.bundleBannerDesktopUrl).toBeNull();
    expect(result.bundleBannerMobileUrl).toBeNull();
    expect(result.bundleLevelCss).toBeNull();
    expect(result.defaultProductsData).toEqual({});
    expect(result.validateQuantityPerProduct).toEqual({ isEnabled: false, allowedQuantity: 1 });
    expect(result.individualSellingPlanSelection).toEqual({ isEnabled: false, showFor: "ALL_PRODUCTS" });
    expect(result.bundleTextConfig).toBeNull();
  });

  it("parses variantSelectorEnabled defaults to true when missing", () => {
    const result = parsePPBBundleSettings(makeForm({}));
    expect(result.variantSelectorEnabled).toBe(true);
  });

  it("parses variantSelectorEnabled=false correctly", () => {
    const result = parsePPBBundleSettings(makeForm({ variantSelectorEnabled: "false" }));
    expect(result.variantSelectorEnabled).toBe(false);
  });

  it("parses preSelectedProductVariantId", () => {
    const result = parsePPBBundleSettings(makeForm({
      preSelectedProductVariantId: "gid://shopify/ProductVariant/456",
    }));
    expect(result.preSelectedProductVariantId).toBe("gid://shopify/ProductVariant/456");
  });

  it("returns null for preSelectedProductVariantId when empty", () => {
    const result = parsePPBBundleSettings(makeForm({ preSelectedProductVariantId: "" }));
    expect(result.preSelectedProductVariantId).toBeNull();
  });

  it("parses maxQtyPerProduct as integer", () => {
    const result = parsePPBBundleSettings(makeForm({ maxQtyPerProduct: "3" }));
    expect(result.maxQtyPerProduct).toBe(3);
  });

  it("returns null for maxQtyPerProduct when blank", () => {
    const result = parsePPBBundleSettings(makeForm({ maxQtyPerProduct: "" }));
    expect(result.maxQtyPerProduct).toBeNull();
  });

  it("parses productSlotsEnabled and productSlotIconUrl", () => {
    const result = parsePPBBundleSettings(makeForm({
      productSlotsEnabled: "true",
      productSlotIconUrl: "https://cdn.shopify.com/icon.png",
    }));
    expect(result.productSlotsEnabled).toBe(true);
    expect(result.productSlotIconUrl).toBe("https://cdn.shopify.com/icon.png");
  });

  it("returns null for productSlotIconUrl when empty", () => {
    const result = parsePPBBundleSettings(makeForm({ productSlotIconUrl: "" }));
    expect(result.productSlotIconUrl).toBeNull();
  });

  it("passes bundleLevelCss through processCss sanitizer", () => {
    const { processCss } = require("../../../app/lib/css-sanitizer");
    const result = parsePPBBundleSettings(makeForm({
      bundleLevelCss: ".bundle { color: red; }",
    }));
    expect(processCss).toHaveBeenCalledWith(".bundle { color: red; }");
    expect(result.bundleLevelCss).toBe(".bundle { color: red; }");
  });

  it("strips malicious CSS via sanitizer", () => {
    const result = parsePPBBundleSettings(makeForm({
      bundleLevelCss: "<script>alert(1)</script>.bundle{}",
    }));
    expect(result.bundleLevelCss).not.toContain("<script");
  });

  it("returns null for bundleLevelCss when empty", () => {
    const result = parsePPBBundleSettings(makeForm({ bundleLevelCss: "" }));
    expect(result.bundleLevelCss).toBeNull();
  });

  it("parses bundle cart title and subtitle", () => {
    const result = parsePPBBundleSettings(makeForm({
      bundleCartTitle: "My Bundle",
      bundleCartSubtitle: "Review items",
    }));
    expect(result.bundleCartTitle).toBe("My Bundle");
    expect(result.bundleCartSubtitle).toBe("Review items");
  });

  it("returns null for empty cart title and subtitle", () => {
    const result = parsePPBBundleSettings(makeForm({
      bundleCartTitle: "",
      bundleCartSubtitle: "",
    }));
    expect(result.bundleCartTitle).toBeNull();
    expect(result.bundleCartSubtitle).toBeNull();
  });

  it("parses bundle banner URLs", () => {
    const result = parsePPBBundleSettings(makeForm({
      bundleBannerDesktopUrl: "https://cdn.shopify.com/desktop.jpg",
      bundleBannerMobileUrl: "https://cdn.shopify.com/mobile.jpg",
    }));
    expect(result.bundleBannerDesktopUrl).toBe("https://cdn.shopify.com/desktop.jpg");
    expect(result.bundleBannerMobileUrl).toBe("https://cdn.shopify.com/mobile.jpg");
  });

  it("parses direct default products contract", () => {
    const defaultProductsData = {
      isDefaultProductsEnabled: true,
      defaultProductsTitle: "Preselected audit products",
      products: [
        {
          productId: "8322625700036",
          graphqlId: "gid://shopify/Product/8322625700036",
          handle: "18k-bloom-earrings",
          variants: [
            {
              variantId: "45038876459204",
              variantGraphqlId: "gid://shopify/ProductVariant/45038876459204",
              inventoryQuantity: 13,
              price: "579.00",
            },
          ],
          hasOnlyDefaultVariant: true,
          images: [
            {
              originalSrc: "https://cdn.shopify.com/s/files/1/0697/9574/1892/files/18k-rose-diamond-earrings.jpg",
            },
          ],
          title: "18k Bloom Earrings",
          requiredQuantity: 1,
        },
      ],
    };

    const result = parsePPBBundleSettings(makeForm({
      defaultProductsData: JSON.stringify(defaultProductsData),
    }));

    expect(result.defaultProductsData).toEqual(defaultProductsData);
  });

  it("parses direct quantity validation and selling-plan contracts", () => {
    const validateQuantityPerProduct = { isEnabled: true, allowedQuantity: 1 };
    const individualSellingPlanSelection = { isEnabled: false, showFor: "ALL_PRODUCTS" };

    const result = parsePPBBundleSettings(makeForm({
      validateQuantityPerProduct: JSON.stringify(validateQuantityPerProduct),
      individualSellingPlanSelection: JSON.stringify(individualSellingPlanSelection),
    }));

    expect(result.validateQuantityPerProduct).toEqual(validateQuantityPerProduct);
    expect(result.individualSellingPlanSelection).toEqual(individualSellingPlanSelection);
  });

  it("parses direct bundle summary text contract", () => {
    const bundleTextConfig = {
      bundleSummary: {
        title: "Your Bundle",
        subTitle: "Review your bundle",
      },
    };

    const result = parsePPBBundleSettings(makeForm({
      bundleTextConfig: JSON.stringify(bundleTextConfig),
    }));

    expect(result.bundleTextConfig).toEqual(bundleTextConfig);
  });
});

describe("Product Page Bundle Settings Admin layout contract", () => {
  it("places Bundle Settings toggles inline beside their headings", () => {
    expect(routeSource).toContain("productPageBundleStyles.settingTitleRow");
    expect(routeSource).toContain("productPageBundleStyles.settingTitle");
    expect(stylesSource).toContain(".settingTitleRow");
    expect(stylesSource).toContain("align-items: center;");
    expect(stylesSource).not.toContain("settingTitleRow h3");
  });

  it("matches the captured Pre Selected Product disabled-state controls", () => {
    expect(routeSource).not.toContain("Choose products that should be added to bundle by default");
    expect(routeSource).not.toContain("These products will be added to user");
    expect(routeSource).not.toContain("openMultiLanguageModal(\"Pre Selected Product\"");
    expect(routeSource).not.toContain("Not set");
    expect(routeSource).toContain("disabled={!defaultProductsEnabled || undefined}");
    expect(routeSource).toContain("productPageBundleStyles.defaultProductsPickerGroup");
    expect(stylesSource).toContain("margin-top: -8px;");
  });

  it("uses direct defaultProductsData state instead of mutating step products", () => {
    expect(routeSource).toContain("setDefaultProductsData");
    expect(routeSource).toContain("buildDefaultProductEntryFromPicker");
    expect(routeSource).not.toContain('stepsState.updateStepField(settingsStep.id, "StepProduct", defaultProducts)');
    expect(routeSource).not.toContain('stepsState.updateStepField(settingsStep.id, "isDefault", defaultProducts.length > 0)');
  });
});
