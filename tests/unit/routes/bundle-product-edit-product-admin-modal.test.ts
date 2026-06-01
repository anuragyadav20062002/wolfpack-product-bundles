import { readFileSync } from "node:fs";
import { join } from "node:path";

const ppbRouteSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
  "utf8"
);

const fpbRouteSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
  "utf8"
);

describe("Bundle Product Edit Product admin navigation", () => {
  function getOpenProductInAdminSource(source: string): string {
    const start = source.indexOf("const openProductInAdmin = useCallback");
    const end = source.indexOf("}, [shop, shopify]);", start);
    return source.slice(start, end);
  }

  it.each([
    ["PPB", ppbRouteSource],
    ["FPB", fpbRouteSource],
  ])("%s uses App Bridge Product editor intent before Admin URL fallback", (_bundleType, source) => {
    const helperSource = getOpenProductInAdminSource(source);

    expect(helperSource).toContain('intentsApi.invoke("edit:shopify/Product"');
    expect(helperSource).toContain('type: "shopify/Product"');
    expect(helperSource).toContain("value: productGid");
    expect(helperSource).toContain(["`gid://shopify/Product/", "{productId}`"].join("$"));
    expect(helperSource).toContain("shopify.navigate(adminProductUrl);");
    expect(helperSource).toContain('window.open(adminProductUrl, "_blank")');
    expect(helperSource).not.toContain("trycloudflare.com");
    expect(helperSource).not.toContain('window.location.hostname.includes');
  });
});
