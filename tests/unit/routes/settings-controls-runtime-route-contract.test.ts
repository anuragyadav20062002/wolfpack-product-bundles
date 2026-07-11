import fs from "node:fs";
import path from "node:path";

const settingsRouteSource = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.settings.tsx"),
  "utf8",
);
const controlsApiPath = path.join(process.cwd(), "app/routes/api/api.controls-settings.$shopDomain.tsx");

describe("Settings Controls runtime route contract", () => {
  it("saves Controls through the shared runtime mapper for both bundle types", () => {
    expect(settingsRouteSource).toContain("buildSettingsControlsRuntime");
    expect(settingsRouteSource).toContain("SETTINGS_CONTROLS_BUNDLE_TYPES");
    expect(settingsRouteSource).toContain("settingsControls: controlsRuntime.settingsControls");
    expect(settingsRouteSource).toContain("bundleType === BundleType.FULL_PAGE");
    expect(settingsRouteSource).toContain("controlsRuntime.fullPageCustomCss");
    expect(settingsRouteSource).toContain("controlsRuntime.productPageCustomCss");
    expect(settingsRouteSource).toContain("CartTransformService.syncCartLineMessagingSettings");
    expect(settingsRouteSource).toContain("controlsRuntime.bundleCartLineMessaging");
  });

  it("exposes a storefront-readable Controls settings endpoint", () => {
    expect(fs.existsSync(controlsApiPath)).toBe(true);
    const controlsApiSource = fs.readFileSync(controlsApiPath, "utf8");
    expect(controlsApiSource).toContain("settingsControls");
    expect(controlsApiSource).toContain("activeControls");
    expect(controlsApiSource).toContain("bundleType");
  });
});
