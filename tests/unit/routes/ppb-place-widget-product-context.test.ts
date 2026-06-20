import { readFileSync } from "node:fs";
import { join } from "node:path";

const routeSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
  "utf8"
);
const flowSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
  "utf8"
);

describe("PPB Place Widget Theme Editor product context", () => {
  const selectionStart = flowSource.indexOf("const handlePageSelection = useCallback");
  const selectionEnd = flowSource.indexOf("const syncModalRef", selectionStart);
  const selectionSource = flowSource.slice(selectionStart, selectionEnd);

  it("targets the live bundle parent product handle before stored fallback handle", () => {
    expect(selectionSource).toContain("const pageProductHandle = bundleProduct?.handle ?? bundle.shopifyProductHandle");
    expect(selectionSource).toContain("productHandle: pageProductHandle");
    expect(selectionSource).toContain("template,");
  });

  it("keeps the selected template handle separate from the product preview context", () => {
    expect(selectionSource).toContain("buildProductPageThemeEditorDeepLink({");
    expect(selectionSource).toContain("setSelectedPage(template)");
    expect(selectionSource).toContain("bundleProduct?.handle");
  });

  it("passes the bundle parent product preview URL for draft product Theme Editor context", () => {
    expect(selectionSource).toContain("productPreviewUrl: bundleProduct?.onlineStorePreviewUrl");
  });

  it("assigns the selected product template to the bundle parent product before opening the editor", () => {
    expect(routeSource).toContain('case "assignProductTemplate":');
    expect(selectionSource).toContain("const productTemplateSuffix = resolveProductPageTemplateSuffix(template)");
    expect(selectionSource).toContain('formData.append("intent", "assignProductTemplate")');
    expect(selectionSource).toContain('formData.append("productId", productIdForTemplate)');
    expect(selectionSource).toContain('formData.append("templateSuffix", productTemplateSuffix ?? "")');
    expect(selectionSource.indexOf('await fetch(window.location.href')).toBeGreaterThan(-1);
    expect(selectionSource.indexOf('await fetch(window.location.href')).toBeLessThan(
      selectionSource.indexOf("const themeEditorUrl = buildProductPageThemeEditorDeepLink({"),
    );
  });

});
