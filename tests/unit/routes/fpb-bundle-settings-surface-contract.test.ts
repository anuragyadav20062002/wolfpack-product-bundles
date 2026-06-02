import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page Bundle Settings surface contract", () => {
  it("keeps the captured FPB Bundle Settings sections and banner sizes", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
      "utf8",
    );
    const sectionStart = source.indexOf("{/* Pre Selected Product */}");
    const sectionEnd = source.indexOf("{activeSection === \"bundle_widget\"", sectionStart);
    const settingsSection = source.slice(sectionStart, sectionEnd);

    expect(sectionStart).toBeGreaterThan(-1);
    expect(sectionEnd).toBeGreaterThan(sectionStart);
    expect(settingsSection).toContain("Pre Selected Product");
    expect(settingsSection).toContain("Enable Quantity Validation");
    expect(settingsSection).toContain("<s-checkbox");
    expect(settingsSection).toContain("accessibilityLabel=\"Enable quantity validation\"");
    expect(settingsSection).toContain("Product Slots");
    expect(settingsSection).toContain("Slot Icon");
    expect(settingsSection).toContain("Variant Selector");
    expect(settingsSection).toContain("Show Text on + Button");
    expect(settingsSection).toContain("Bundle Cart Title");
    expect(settingsSection).toContain("Bundle Cart Subtitle");
    expect(settingsSection).toContain("Cart line item discount display");
    expect(settingsSection).toContain("Bundle Banner");
    expect(settingsSection).toContain("1900x230");
    expect(settingsSection).toContain("1100x500");
    expect(settingsSection).toContain("Bundle Level CSS");
    expect(settingsSection).toContain("BundleStatusSection");
  });

  it("keeps non-evidenced display controls out of the FPB Bundle Settings section", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
      "utf8",
    );
    const sectionStart = source.indexOf("{/* Pre Selected Product */}");
    const sectionEnd = source.indexOf("{activeSection === \"bundle_widget\"", sectionStart);
    const settingsSection = source.slice(sectionStart, sectionEnd);

    expect(settingsSection).not.toContain("Show product prices");
    expect(settingsSection).not.toContain("Show compare-at prices");
    expect(settingsSection).not.toContain("Allow quantity changes");
  });
});
