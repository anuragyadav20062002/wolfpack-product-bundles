import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Product Page Bundle Settings surface contract", () => {
  it("keeps the captured PPB Bundle Settings sections and excludes FPB-only cart title fields", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
      "utf8",
    );
    const sectionStart = source.indexOf("{/* Pre Selected Product */}");
    const sectionEnd = source.indexOf("{activeSection === \"subscriptions\"", sectionStart);
    const settingsSection = source.slice(sectionStart, sectionEnd);

    expect(sectionStart).toBeGreaterThan(-1);
    expect(sectionEnd).toBeGreaterThan(sectionStart);
    expect(settingsSection).toContain("Pre Selected Product");
    expect(settingsSection).toContain("Default products title");
    expect(settingsSection).toContain("Choose default products");
    expect(settingsSection).toContain("Browse Products");
    expect(settingsSection).toContain("Enable Quantity Validation");
    expect(settingsSection).toContain("Maximum allowed quantity per product");
    expect(settingsSection).toContain("Pre-order &amp; Subscription Integration");
    expect(settingsSection).toContain("Cart line item discount display");
    expect(settingsSection).toContain("Use app defaults");
    expect(settingsSection).toContain("Customize for this bundle");
    expect(settingsSection).toContain("Bundle Level CSS");
    expect(settingsSection).toContain("BundleStatusSection");
    expect(settingsSection).not.toContain("Bundle Cart Title");
    expect(settingsSection).not.toContain("Bundle Cart Subtitle");
  });
});
