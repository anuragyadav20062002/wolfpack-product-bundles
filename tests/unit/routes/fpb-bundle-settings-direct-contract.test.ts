import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page Bundle Settings direct contract", () => {
  it("submits Bundle Cart title and subtitle through bundleTextConfig", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
      "utf8",
    );

    expect(source).toContain('formData.append("bundleTextConfig"');
    expect(source).toContain("bundleSummary");
    expect(source).toContain("textOverrides.yourBundle");
    expect(source).toContain("textOverrides.reviewBundle");
  });

  it("does not render non-evidenced WPB-only display controls in Bundle Settings", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
      "utf8",
    );

    expect(source).not.toContain("Show product prices");
    expect(source).not.toContain("Show compare-at prices");
    expect(source).not.toContain("Allow quantity changes");
  });
});
