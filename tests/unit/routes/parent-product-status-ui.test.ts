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

const bundleConfigurationStateSource = fs.readFileSync(
  path.join(process.cwd(), "app/hooks/useBundleConfigurationState.ts"),
  "utf8",
);

describe("parent product status configure UI", () => {
  function getOpenProductInAdminSource(source: string): string {
    const start = source.indexOf("const openProductInAdmin = useCallback");
    const end = source.indexOf("}, [shop, shopify", start);
    return source.slice(start, end);
  }

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

  it("revalidates Shopify-backed status after the native product editor workflow", () => {
    expect(fpbRouteSource).toContain("const refreshParentProductStatusFromShopify = useCallback");
    expect(ppbRouteSource).toContain("const refreshParentProductStatusFromShopify = useCallback");
    expect(fpbRouteSource).toContain("document.addEventListener(\"visibilitychange\", revalidateOnVisible)");
    expect(ppbRouteSource).toContain("document.addEventListener(\"visibilitychange\", revalidateOnVisible)");
    expect(fpbRouteSource).toContain("window.addEventListener(\"focus\", revalidateOnReturn, { once: true })");
    expect(ppbRouteSource).toContain("window.addEventListener(\"focus\", revalidateOnReturn, { once: true })");
    expect(fpbRouteSource).toContain("document.removeEventListener(\"visibilitychange\", revalidateOnVisible)");
    expect(ppbRouteSource).toContain("document.removeEventListener(\"visibilitychange\", revalidateOnVisible)");
    expect(fpbRouteSource).toContain("revalidator.revalidate()");
    expect(ppbRouteSource).toContain("revalidator.revalidate()");

    const fpbHelperSource = getOpenProductInAdminSource(fpbRouteSource);
    const ppbHelperSource = getOpenProductInAdminSource(ppbRouteSource);
    expect(fpbHelperSource).toContain("refreshParentProductStatusFromShopify()");
    expect(ppbHelperSource).toContain("refreshParentProductStatusFromShopify()");
  });

  it("syncs local parent product state when Shopify-backed loader data changes", () => {
    expect(bundleConfigurationStateSource).toContain("syncLoadedBundleProductStatus");
    expect(bundleConfigurationStateSource).toContain("setBundleProductRaw(loadedBundleProduct || null)");
    expect(bundleConfigurationStateSource).toContain("setProductStatusRaw(loadedBundleProduct?.status || \"ACTIVE\")");
    expect(bundleConfigurationStateSource).toContain("originalValuesRef.current = {");
    expect(bundleConfigurationStateSource).toContain("productStatus: loadedBundleProduct?.status || \"ACTIVE\"");
  });
});
