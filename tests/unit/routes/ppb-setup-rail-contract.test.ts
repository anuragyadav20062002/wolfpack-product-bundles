import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Product Page Bundle setup rail contract", () => {
  it("uses the recovered setup rail list and exposes captured visibility children", () => {
    const helperSource = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ConfigureBundleFlow.helpers.tsx"),
      "utf8",
    ).replace(/\s+/g, " ");
    const flowSource = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
      "utf8",
    ).replace(/\s+/g, " ");

    expect(helperSource).toContain("PRODUCT_PAGE_SETUP_ITEMS");
    expect(helperSource).toContain("export const bundleSetupItems = PRODUCT_PAGE_SETUP_ITEMS");
    expect(helperSource).toContain('{ id: "bundle_widget", label: "Bundle Widget" }');
    expect(helperSource).toContain('{ id: "bundle_embed", label: "Bundle Embed" }');
    expect(flowSource).toContain('activeSection === "subscriptions"');
    expect(flowSource).toContain('data-tour-target="ppb-subscriptions"');
    expect(flowSource).toContain('activeSection === "bundle_embed"');
  });
});
