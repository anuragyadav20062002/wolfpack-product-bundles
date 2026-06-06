import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("PPB Bundle Visibility overview copy", () => {
  it("uses captured Widget and Embed descriptions on the overview cards", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
      "utf8",
    );

    const bundleWidgetIndex = source.indexOf("<h4 className={productPageBundleStyles.visibilitySetupTitle}>Bundle Widget</h4>");
    const bundleEmbedIndex = source.indexOf("<h4 className={productPageBundleStyles.visibilitySetupTitle}>Bundle Embed</h4>");
    const deeperWidgetIndex = source.indexOf("<h3 className={productPageBundleStyles.visibilityPanelTitle}>Product Page Bundle Upsell Widgets</h3>");
    const widgetOverview = source.slice(bundleWidgetIndex, deeperWidgetIndex);
    const embedOverview = source.slice(bundleEmbedIndex, deeperWidgetIndex);

    expect(widgetOverview).toContain("This will display an upsell block or button on the product pages of your choice.");
    expect(widgetOverview).not.toContain("Add a bundle button to specific product pages.");
    expect(embedOverview).toContain("Directly embed the Bundle Builder block on product pages so customers can curate bundles there.");
    expect(embedOverview).not.toContain("Embed the full bundle builder directly on a product page.");
  });
});
