import fs from "node:fs";
import path from "node:path";

const runtimeModulePath = path.join(process.cwd(), "app/lib/settings-controls-runtime.ts");

const controlsPayload = {
  "Show Compare At Price": "Checked",
  "Hide Irrelevant variant images": "Checked",
  "Track inventory on Add To Cart (in beta)": "Checked",
  "Redirect Collection Page 'Quick Add' to Bundle": "Checked",
  "Cart Messaging": "Checked",
  "Bundle Items": "",
  "Original Bundle Price": "Checked",
  "Discount Display": "Checked",
  "Discount format": "Percentage only (Eg: \"You save 19%\")",
  "Checkout Settings": "Redirect to Checkout",
  "Execute Script": "window.__fpbDone = true;",
  "Custom Font": "Inter",
  "Custom CSS for bundle builder pages": ".gbbBundle-HTML .builder { color: red; }",
  "Custom CSS for bundle dummy product page": ".gbbBundle-HTML .dummy { color: blue; }",
  "Custom CSS for theme pages": ".gbbBundle-HTML .theme { color: green; }",
  "Enable Custom Theme Integration Script": "Checked",
  "Custom Theme Integration Script": "window.__themeIntegrated = true;",
  "Enable Cart Integration": "Checked",
  "Cart Item Selectors": ".cart-item",
  "Cart Item Remove Parent Selectors": ".cart-row",
  "Cart Item Remove Selectors": ".cart-remove",
  "Cart Item Quantity Button Selectors": ".qty-btn",
  "Custom Cart Integration Script": "window.__cartIntegrated = true;",
  "Enable Judge Me Integration": "Checked",
  "Public token": "judge-token",
  "Background Color": "#fefefe",
  "Logo": "https://cdn.example.com/logo.png",
  "Hide Out Of Stock Products": "Checked",
  "Add bundle to cart after the last step is completed": "Checked",
  "Display empty state boxes based on bundle condition": "",
  "Hide Step Titles in completed state": "Checked",
  "Add to cart when product card is clicked": "",
  "Redirect Settings": "Redirect to Cart",
  "Custom CSS for Mix And Match Bundles": ".gbbMixBundle { color: purple; }",
  "Execute Custom Script": "window.__ppbCustom = true;",
  "Side cart selector": ".side-cart",
  "Side cart section ID": "cart-drawer",
  "Cart page items selector": ".cart-items",
  "Cart page items section ID": "main-cart-items",
  "Side cart open button selector": ".open-cart",
  "Product page price selector": ".price",
};

describe("Settings Controls runtime mapping", () => {
  it("provides a dedicated runtime mapper module", () => {
    expect(fs.existsSync(runtimeModulePath)).toBe(true);
  });

  it("maps EB Landing Page and Product Page controls into scoped runtime data", async () => {
    const { buildSettingsControlsRuntime } = await import("../../../app/lib/settings-controls-runtime");

    const runtime = buildSettingsControlsRuntime(controlsPayload);

    expect(runtime.settingsControls.landingPage).toMatchObject({
      showCompareAtPrice: true,
      hideIrrelevantVariantImages: true,
      trackInventoryOnAddToCart: true,
      redirectCollectionQuickAddToBundle: true,
      checkout: {
        action: "checkout",
        executeScript: "window.__fpbDone = true;",
      },
      font: {
        customFont: "Inter",
      },
      css: {
        bundleBuilderPages: ".gbbBundle-HTML .builder { color: red; }",
        bundleDummyProductPage: ".gbbBundle-HTML .dummy { color: blue; }",
        themePages: ".gbbBundle-HTML .theme { color: green; }",
      },
      integrations: {
        customThemeScriptEnabled: true,
        customThemeIntegrationScript: "window.__themeIntegrated = true;",
        cartIntegrationEnabled: true,
        judgeMeEnabled: true,
        judgeMePublicToken: "judge-token",
      },
      videoPlayerPage: {
        backgroundColor: "#fefefe",
        logoUrl: "https://cdn.example.com/logo.png",
      },
    });

    expect(runtime.settingsControls.productPage).toMatchObject({
      hideOutOfStockProducts: true,
      trackInventoryOnAddToCart: true,
      addBundleToCartAfterLastStepCompleted: true,
      displayEmptyStateBoxesBasedOnBundleCondition: false,
      hideStepTitlesInCompletedState: true,
      addToCartWhenProductCardClicked: false,
      redirectCollectionQuickAddToBundle: true,
      redirect: {
        action: "cart",
        executeScript: "window.__fpbDone = true;",
      },
      css: {
        mixAndMatchBundles: ".gbbMixBundle { color: purple; }",
        themePages: ".gbbBundle-HTML .theme { color: green; }",
      },
      scripts: {
        executeCustomScript: "window.__ppbCustom = true;",
      },
      selectors: {
        sideCart: ".side-cart",
        sideCartSectionId: "cart-drawer",
        cartPageItems: ".cart-items",
        cartPageItemsSectionId: "main-cart-items",
        sideCartOpenButton: ".open-cart",
        productPagePrice: ".price",
      },
    });
  });

  it("keeps CSS scopes separate while returning per-bundle CSS strings", async () => {
    const { buildSettingsControlsRuntime } = await import("../../../app/lib/settings-controls-runtime");

    const runtime = buildSettingsControlsRuntime(controlsPayload);

    expect(runtime.fullPageCustomCss).toContain(".builder");
    expect(runtime.fullPageCustomCss).toContain(".dummy");
    expect(runtime.fullPageCustomCss).toContain(".theme");
    expect(runtime.fullPageCustomCss).not.toContain(".gbbMixBundle");
    expect(runtime.productPageCustomCss).toContain(".gbbMixBundle");
    expect(runtime.productPageCustomCss).toContain(".theme");
    expect(runtime.productPageCustomCss).not.toContain(".builder");
    expect(runtime.productPageCustomCss).not.toContain(".dummy");
  });

  it("keeps existing cart line messaging runtime compatibility", async () => {
    const { buildSettingsControlsRuntime } = await import("../../../app/lib/settings-controls-runtime");

    const runtime = buildSettingsControlsRuntime(controlsPayload);

    expect(runtime.bundleCartLineMessaging).toEqual({
      isEnabled: true,
      showBundleContains: false,
      showOriginalPrice: true,
      discountDisplay: {
        isEnabled: true,
        format: "percentage_only",
      },
    });
  });
});
