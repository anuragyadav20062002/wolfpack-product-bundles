import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Product Page Bundle setup rail contract", () => {
  it("uses the recovered setup rail list and exposes captured visibility children", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
      "utf8",
    );

    expect(source).toContain("PRODUCT_PAGE_SETUP_ITEMS");
    expect(source).toContain("const bundleSetupItems = PRODUCT_PAGE_SETUP_ITEMS");
    expect(source).toContain('{ id: "bundle_widget", label: "Bundle Widget" }');
    expect(source).toContain('{ id: "bundle_embed",  label: "Bundle Embed"  }');
    expect(source).toContain('activeSection === "subscriptions"');
    expect(source).toContain('data-tour-target="ppb-subscriptions"');
    expect(source).toContain('activeSection === "bundle_embed"');
  });
});
