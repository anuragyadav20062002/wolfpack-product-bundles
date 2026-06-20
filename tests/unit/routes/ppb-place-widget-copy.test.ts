import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Product Page Place Widget copy", () => {
  it("uses the captured EB top-card action text without extra glyphs", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
      "utf8",
    );

    expect(source).toContain("Take your bundle live");
    expect(source).toContain("Place on theme");
    expect(source).toContain("Place Widget");
    expect(source).not.toContain("Place Widget ↗");
  });
});
