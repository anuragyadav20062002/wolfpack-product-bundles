import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
  "utf8"
);

describe("PPB Place Widget Theme Editor product context", () => {
  const handlerStart = source.indexOf("const handlePageSelection = useCallback");
  const handlerEnd = source.indexOf("  // Sync Bundle modal ref", handlerStart);
  const handlerSource = source.slice(handlerStart, handlerEnd);

  it("targets the live bundle parent product handle before stored fallback handle", () => {
    expect(handlerSource).toContain("const pageProductHandle = bundleProduct?.handle ?? bundle.shopifyProductHandle");
    expect(handlerSource).toContain("productHandle: pageProductHandle");
    expect(handlerSource).toContain("template,");
  });

  it("keeps the selected template handle separate from the product preview context", () => {
    expect(handlerSource).toContain("buildProductPageThemeEditorDeepLink({");
    expect(handlerSource).toContain("setSelectedPage(template)");
    expect(handlerSource).toContain("bundleProduct?.handle");
  });
});
