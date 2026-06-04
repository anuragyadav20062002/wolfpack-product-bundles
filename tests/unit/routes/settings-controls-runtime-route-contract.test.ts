import fs from "node:fs";
import path from "node:path";

const settingsRouteSource = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.settings.tsx"),
  "utf8",
);
const controlsApiPath = path.join(process.cwd(), "app/routes/api/api.controls-settings.$shopDomain.tsx");
const ppbWidgetSource = fs.readFileSync(
  path.join(process.cwd(), "app/assets/bundle-widget-product-page.js"),
  "utf8",
);
const fpbWidgetSource = fs.readFileSync(
  path.join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
  "utf8",
);

describe("Settings Controls runtime route contract", () => {
  it("saves Controls through the shared runtime mapper for both bundle types", () => {
    expect(settingsRouteSource).toContain("buildSettingsControlsRuntime");
    expect(settingsRouteSource).toContain("SETTINGS_CONTROLS_BUNDLE_TYPES");
    expect(settingsRouteSource).toContain("settingsControls: controlsRuntime.settingsControls");
    expect(settingsRouteSource).toContain("bundleType === BundleType.FULL_PAGE");
    expect(settingsRouteSource).toContain("controlsRuntime.fullPageCustomCss");
    expect(settingsRouteSource).toContain("controlsRuntime.productPageCustomCss");
  });

  it("exposes a storefront-readable Controls settings endpoint", () => {
    expect(fs.existsSync(controlsApiPath)).toBe(true);
    const controlsApiSource = fs.readFileSync(controlsApiPath, "utf8");
    expect(controlsApiSource).toContain("settingsControls");
    expect(controlsApiSource).toContain("activeControls");
    expect(controlsApiSource).toContain("bundleType");
  });
});

describe("Settings Controls storefront widget contract", () => {
  it("wires Product Page Controls into PPB widget behavior", () => {
    expect(ppbWidgetSource).toContain("loadControlsSettings");
    expect(ppbWidgetSource).toContain("controls-settings");
    expect(ppbWidgetSource).toContain("_getProductPageControls");
    expect(ppbWidgetSource).toContain("addToCartWhenProductCardClicked");
    expect(ppbWidgetSource).toContain("addBundleToCartAfterLastStepCompleted");
    expect(ppbWidgetSource).toContain("_handlePostAddToCartAction");
    expect(ppbWidgetSource).toContain("_runControlsScript");
  });

  it("wires Landing Page Controls into FPB widget behavior", () => {
    expect(fpbWidgetSource).toContain("loadControlsSettings");
    expect(fpbWidgetSource).toContain("controls-settings");
    expect(fpbWidgetSource).toContain("_getLandingPageControls");
    expect(fpbWidgetSource).toContain("_handlePostAddToCartAction");
    expect(fpbWidgetSource).toContain("_runControlsScript");
  });
});
