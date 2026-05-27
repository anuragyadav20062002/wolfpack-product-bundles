import fs from "node:fs";
import path from "node:path";

const routeSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);

describe("product-page Bundle Visibility Admin direct contract", () => {
  it("builds bundleUpsellConfig from current Widget and Embed controls before save", () => {
    expect(routeSource).toContain("function buildBundleUpsellConfig()");
    expect(routeSource).toContain("widgetConfiguration");
    expect(routeSource).toContain("upsellConfiguration");
    expect(routeSource).toContain('type: "OFFER_WIDGET"');
    expect(routeSource).toContain("buildVisibilityDisplayConfiguration(upsellWidgetDisplayOn");
    expect(routeSource).toContain("buildVisibilityDisplayConfiguration(bundleEmbedDisplayOn");
    expect(routeSource).toContain('formData.append("bundleUpsellConfig", JSON.stringify(buildBundleUpsellConfig()))');
  });

  it("does not resubmit the previously loaded bundleUpsellConfig object", () => {
    expect(routeSource).not.toContain(
      'formData.append("bundleUpsellConfig", (bundle as any).bundleUpsellConfig ? JSON.stringify((bundle as any).bundleUpsellConfig) : "")',
    );
  });

  it("hydrates Widget and Embed controls from the direct saved config", () => {
    expect(routeSource).toContain("savedBundleUpsellConfig?.widgetConfiguration");
    expect(routeSource).toContain("savedBundleUpsellConfig?.upsellConfiguration");
    expect(routeSource).toContain("setUpsellWidgetTitle");
    expect(routeSource).toContain("setBundleEmbedTitle");
  });
});
