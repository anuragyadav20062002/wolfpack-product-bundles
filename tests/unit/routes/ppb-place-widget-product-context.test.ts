import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readPpbConfigureRouteFamilySource } from "./ppb-configure-route-source";

const routeSource = readFileSync(
  join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
  "utf8",
);
const flowSource = readPpbConfigureRouteFamilySource();
const normalizedFlowSource = flowSource.replace(/\s+/g, " ");

describe("PPB Place Widget Theme Editor product context", () => {
  const selectionStart = flowSource.indexOf(
    "const handlePageSelection = useCallback",
  );
  const selectionSource = flowSource.slice(selectionStart);
  const normalizedSelectionSource = normalizedFlowSource.slice(
    normalizedFlowSource.indexOf("const handlePageSelection = useCallback"),
  );

  it("targets the live bundle parent product handle before stored fallback handle", () => {
    expect(selectionSource).toContain("const pageProductHandle =");
    expect(selectionSource).toContain(
      "base.bundleProduct?.handle ?? base.bundle.shopifyProductHandle",
    );
    expect(selectionSource).toContain("productHandle: pageProductHandle");
    expect(selectionSource).toContain("template,");
  });

  it("keeps the selected template handle separate from the product preview context", () => {
    expect(selectionSource).toContain("buildProductPageThemeEditorDeepLink({");
    expect(selectionSource).toContain("setSelectedPage(template)");
    expect(selectionSource).toContain("base.bundleProduct?.handle");
  });

  it("passes the bundle parent product preview URL for draft product Theme Editor context", () => {
    expect(selectionSource).toContain(
      "productPreviewUrl: base.bundleProduct?.onlineStorePreviewUrl",
    );
  });

  it("assigns the selected product template to the bundle parent product before opening the editor", () => {
    expect(routeSource).toContain('case "assignProductTemplate":');
    expect(normalizedSelectionSource).toContain(
      "const productTemplateSuffix = resolveProductPageTemplateSuffix(template)",
    );
    expect(selectionSource).toContain(
      'formData.append("intent", "assignProductTemplate")',
    );
    expect(selectionSource).toContain(
      'formData.append("productId", productIdForTemplate)',
    );
    expect(selectionSource).toContain(
      'formData.append("templateSuffix", productTemplateSuffix ?? "")',
    );
    expect(
      normalizedSelectionSource.indexOf("await fetch(window.location.href"),
    ).toBeGreaterThan(-1);
    expect(
      normalizedSelectionSource.indexOf("await fetch(window.location.href"),
    ).toBeLessThan(
      normalizedSelectionSource.indexOf(
        "const themeEditorUrl = buildProductPageThemeEditorDeepLink({",
      ),
    );
  });
});
