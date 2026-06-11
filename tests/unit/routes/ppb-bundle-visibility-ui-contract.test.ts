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

  it("wires Widget product and collection targeting through App Bridge resource pickers", () => {
    expect(routeSource).toContain("setUpsellWidgetSelectedProducts");
    expect(routeSource).toContain("setUpsellWidgetSpecificProductPages");
    expect(routeSource).toContain("setUpsellWidgetCollectionsSelectedData");
    expect(routeSource).toContain("setUpsellWidgetSpecificCollectionPages");
    expect(routeSource).toContain('openVisibilityProductPicker("widget")');
    expect(routeSource).toContain('openVisibilityCollectionPicker("widget")');
    expect(routeSource).toContain('type: "product"');
    expect(routeSource).toContain('type: "collection"');
    expect(routeSource).toContain('action: "select"');
    expect(routeSource).toContain("normalizeVisibilityProductForDisplayConfiguration");
    expect(routeSource).toContain("normalizeVisibilityCollectionForDisplayConfiguration");
  });

  it("wires Embed product and collection targeting through the same direct displayConfiguration contract", () => {
    expect(routeSource).toContain("setBundleEmbedSelectedProducts");
    expect(routeSource).toContain("setBundleEmbedSpecificProductPages");
    expect(routeSource).toContain("setBundleEmbedCollectionsSelectedData");
    expect(routeSource).toContain("setBundleEmbedSpecificCollectionPages");
    expect(routeSource).toContain('openVisibilityProductPicker("embed")');
    expect(routeSource).toContain('openVisibilityCollectionPicker("embed")');
    expect(routeSource).toContain("buildVisibilityDisplayConfiguration(bundleEmbedDisplayOn, bundleEmbedSelectedProducts, bundleEmbedSpecificProductPages, bundleEmbedCollectionsSelectedData, bundleEmbedSpecificCollectionPages)");
  });

  it("compacts App Bridge picker selections before persisting visibility config", () => {
    expect(routeSource).toContain("compactVisibilityProductReference");
    expect(routeSource).toContain("compactVisibilityCollectionReference");
    expect(routeSource).toContain("selectedProducts: displayOn === \"specific_products\" ? selectedProducts.map((product) => compactVisibilityProductReference(product)) : []");
    expect(routeSource).toContain("collectionsSelectedData: displayOn === \"specific_collections\" ? collectionsSelectedData.map((collection) => compactVisibilityCollectionReference(collection)) : []");
    expect(routeSource).not.toContain("...product,");
    expect(routeSource).not.toContain("...collection,");
  });
});
