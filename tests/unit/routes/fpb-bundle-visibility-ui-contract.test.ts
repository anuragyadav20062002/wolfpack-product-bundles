import fs from "node:fs";
import path from "node:path";

const routeSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);
const stylesSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/styles/routes/full-page-bundle-configure.module.css",
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

  it("uses a custom visibility overview shell with setup cards and the bundle link row", () => {
    expect(routeSource).toContain("fullPageBundleStyles.visibilityOverviewCard");
    expect(routeSource).toContain("fullPageBundleStyles.visibilityGuideAction");
    expect(routeSource).toContain("Quick Setup Guide");
    expect(routeSource).toContain("fullPageBundleStyles.visibilitySetupPanel");
    expect(routeSource).toContain("Your Bundle Link");
    expect(routeSource).toContain("Set up Bundle Widget");
    expect(stylesSource).toContain(".visibilityOverviewCard");
    expect(stylesSource).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(stylesSource).toContain(".visibilityGuideAction");
    expect(stylesSource).toContain("background: #111111;");
  });

  it("uses custom Widget cards with inline title toggles and placement CTA", () => {
    expect(routeSource).toContain("fullPageBundleStyles.visibilityPanel");
    expect(routeSource).toContain("fullPageBundleStyles.visibilityTitleSwitchRow");
    expect(routeSource).toContain("fullPageBundleStyles.visibilityPreviewFrame");
    expect(routeSource).toContain("fullPageBundleStyles.visibilitySettingsGrid");
    expect(routeSource).toContain("fullPageBundleStyles.visibilityPlacementCard");
    expect(routeSource).toContain("Embed Upsell");
    expect(stylesSource).toContain(".visibilityPanel");
    expect(stylesSource).toContain(".visibilityTitleSwitchRow");
    expect(stylesSource).toContain(".visibilityPlacementCard");
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
