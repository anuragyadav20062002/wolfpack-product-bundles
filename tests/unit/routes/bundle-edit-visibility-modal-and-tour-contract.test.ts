import fs from "node:fs";
import path from "node:path";

const ppbRoutePath = path.join(
  process.cwd(),
  "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"
);
const fpbRoutePath = path.join(
  process.cwd(),
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"
);

const ppbSource = fs.readFileSync(ppbRoutePath, "utf8");
const fpbSource = fs.readFileSync(fpbRoutePath, "utf8");

describe("edit bundle visibility modal contract", () => {
  it("auto-shows the PPB visibility modal from pending edit status, not create mode", () => {
    expect(ppbSource).toContain("const isBundleVisibilityPending = !appEmbedEnabled;");
    expect(ppbSource).toContain('autoShowOnMount: loaderData.configureMode === "edit" && isBundleVisibilityPending');
  });

  it("auto-shows the FPB visibility modal from pending edit status, not create mode", () => {
    expect(fpbSource).toContain("const isBundleVisibilityPending = !(Boolean(bundle.shopifyPageHandle) || upsellWidgetEnabled);");
    expect(fpbSource).toContain('autoShowOnMount: loaderData.configureMode === "edit" && isBundleVisibilityPending');
  });

  it("routes the modal setup action to the Bundle Visibility section in both edit pages", () => {
    expect(ppbSource).toContain('onSetupVisibility: () => setActiveSection("bundle_visibility")');
    expect(fpbSource).toContain('onSetupVisibility: () => setActiveSection("bundle_visibility")');
  });
});

describe("create bundle guided tour contract", () => {
  it("keeps PPB guided tour enabled from first_load loader data", () => {
    expect(ppbSource).toContain("enabled={loaderData.showFirstLoadTour === true}");
  });

  it("keeps FPB guided tour enabled from first_load loader data", () => {
    expect(fpbSource).toContain("enabled={loaderData.showFirstLoadTour === true}");
  });
});
