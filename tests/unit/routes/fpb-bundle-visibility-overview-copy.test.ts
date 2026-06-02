import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("FPB Bundle Visibility overview copy", () => {
  it("uses the captured Bundle Widget description on the overview card", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
      "utf8",
    );

    const overviewStart = source.indexOf("Want more placement options?");
    const widgetSetupIndex = source.indexOf("Set up Bundle Widget", overviewStart);
    const overviewSection = source.slice(overviewStart, widgetSetupIndex);

    expect(overviewStart).toBeGreaterThan(-1);
    expect(widgetSetupIndex).toBeGreaterThan(overviewStart);
    expect(overviewSection).toContain("This will display an upsell block or button on the product pages of your choice.");
    expect(overviewSection).not.toContain("Add a bundle button to specific product pages.");
  });
});
