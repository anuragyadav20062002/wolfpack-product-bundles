import fs from "node:fs";
import path from "node:path";

const fpbRouteSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);

const ppbRouteSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);

describe("parent product status configure UI", () => {
  it("renders parent product status through the shared Shopify status presenter", () => {
    expect(fpbRouteSource).toContain("getParentProductStatusUi");
    expect(ppbRouteSource).toContain("getParentProductStatusUi");
    expect(fpbRouteSource).toContain("parentProductStatusUi.label");
    expect(ppbRouteSource).toContain("parentProductStatusUi.label");
  });

  it("does not gate the unlisted banner by treating every non-active status as unlisted", () => {
    expect(fpbRouteSource).not.toContain('toLowerCase() !== "active" && (\n          <UnlistedBundleBanner');
    expect(ppbRouteSource).not.toContain('toLowerCase() !== "active" && (\n          <UnlistedBundleBanner');
    expect(fpbRouteSource).toContain("parentProductStatusUi.showUnlistedBanner");
    expect(ppbRouteSource).toContain("parentProductStatusUi.showUnlistedBanner");
  });
});
