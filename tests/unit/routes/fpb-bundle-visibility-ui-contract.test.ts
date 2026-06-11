import fs from "node:fs";
import path from "node:path";

const routeSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);

describe("full-page Bundle Visibility Admin direct contract", () => {
  it("builds bundleUpsellConfig from current Widget controls before save", () => {
    expect(routeSource).toContain("function buildBundleUpsellConfig()");
    expect(routeSource).toContain("savedBundleUpsellConfig?.widgetConfiguration");
    expect(routeSource).toContain("widgetConfiguration");
    expect(routeSource).toContain('type: "OFFER_WIDGET"');
    expect(routeSource).toContain("displayConfiguration: buildVisibilityDisplayConfiguration(");
    expect(routeSource).toContain("upsellWidgetDisplayOn");
    expect(routeSource).toContain('formData.append("bundleUpsellConfig", JSON.stringify(buildBundleUpsellConfig()))');
  });

  it("hydrates Widget controls from the direct saved config", () => {
    expect(routeSource).toContain("setUpsellWidgetTitle");
    expect(routeSource).toContain("setUpsellWidgetDescription");
    expect(routeSource).toContain("setUpsellWidgetButtonText");
    expect(routeSource).toContain("setUpsellWidgetImageUrl");
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

  it("compacts App Bridge picker selections before persisting visibility config", () => {
    const displayBuilderSource = routeSource.slice(
      routeSource.indexOf("function buildVisibilityDisplayConfiguration"),
      routeSource.indexOf("function getVisibilityResourceId"),
    );
    expect(routeSource).toContain("compactVisibilityProductReference");
    expect(routeSource).toContain("compactVisibilityCollectionReference");
    expect(routeSource).toContain("selectedProducts: displayOn === \"specific_products\" ? selectedProducts.map((product) => compactVisibilityProductReference(product)) : []");
    expect(routeSource).toContain("collectionsSelectedData: displayOn === \"specific_collections\" ? collectionsSelectedData.map((collection) => compactVisibilityCollectionReference(collection)) : []");
    expect(displayBuilderSource).not.toContain("...product,");
    expect(displayBuilderSource).not.toContain("...collection,");
  });
});
