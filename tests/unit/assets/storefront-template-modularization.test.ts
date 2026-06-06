import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Storefront template modularization contract", () => {
  it("installs full-page template modules using the product-page template pattern", () => {
    const fullPageSource = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );
    const buildScript = readFileSync(
      join(process.cwd(), "scripts/build-widget-bundles.js"),
      "utf8",
    );

    expect(fullPageSource).toContain("installStandardTemplate(BundleWidgetFullPage);");
    expect(fullPageSource).toContain("installClassicTemplate(BundleWidgetFullPage);");
    expect(fullPageSource).toContain("installCompactTemplate(BundleWidgetFullPage);");
    expect(fullPageSource).toContain("installHorizontalTemplate(BundleWidgetFullPage);");

    expect(fullPageSource).not.toContain("ensureStandardPresetRuntimeStyles() {");
    expect(fullPageSource).not.toContain("ensureClassicPresetRuntimeStyles() {");
    expect(fullPageSource).not.toContain("ensureCompactPresetRuntimeStyles() {");
    expect(fullPageSource).not.toContain("ensureHorizontalSidePanelSlotRuntimeStyles() {");

    expect(buildScript).toContain("const FULL_PAGE_MODULES = [");
    expect(buildScript).toContain("app/assets/widgets/full-page/templates/standard-template.js");
    expect(buildScript).toContain("app/assets/widgets/full-page/templates/classic-template.js");
    expect(buildScript).toContain("app/assets/widgets/full-page/templates/compact-template.js");
    expect(buildScript).toContain("app/assets/widgets/full-page/templates/horizontal-template.js");
    expect(buildScript).toContain("const fullPageModulesCode = readFullPageModules();");
    expect(buildScript.indexOf("${fullPageModulesCode}")).toBeLessThan(
      buildScript.indexOf("${processedWidget}"),
    );
  });

  it("keeps full-page template runtime style contracts in dedicated modules", () => {
    const modules = [
      ["standard-template.js", "installStandardTemplate", "wpb-fpb-standard-runtime-styles"],
      ["classic-template.js", "installClassicTemplate", "wpb-fpb-classic-runtime-styles"],
      ["compact-template.js", "installCompactTemplate", "wpb-fpb-compact-runtime-styles"],
      ["horizontal-template.js", "installHorizontalTemplate", "wpb-fpb-horizontal-slots-runtime-styles"],
    ];

    for (const [fileName, installer, styleId] of modules) {
      const source = readFileSync(
        join(process.cwd(), "app/assets/widgets/full-page/templates", fileName),
        "utf8",
      );

      expect(source).toContain(`export function ${installer}(BundleWidgetFullPage)`);
      expect(source).toContain("const prototype = BundleWidgetFullPage.prototype;");
      expect(source).toContain(styleId);
      expect(source).toContain("document.head.appendChild(style);");
    }
  });

  it("uses modular source CSS entries for full-page and product-page templates", () => {
    const fullPageCss = readFileSync(
      join(process.cwd(), "app/assets/widgets/full-page-css/bundle-widget-full-page.css"),
      "utf8",
    );
    const productPageCss = readFileSync(
      join(process.cwd(), "app/assets/widgets/product-page-css/bundle-widget.css"),
      "utf8",
    );
    const minifier = readFileSync(
      join(process.cwd(), "scripts/minify-assets.js"),
      "utf8",
    );

    expect(fullPageCss).toContain('@import "./templates/side-footer-standard.css";');
    expect(fullPageCss).toContain('@import "./templates/side-footer-classic.css";');
    expect(fullPageCss).toContain('@import "./templates/side-footer-compact.css";');
    expect(fullPageCss).toContain('@import "./templates/side-footer-horizontal.css";');

    expect(productPageCss).toContain('@import "./templates/inpage-cascade.css";');
    expect(productPageCss).toContain('@import "./templates/inpage-cognive.css";');
    expect(productPageCss).toContain('@import "./templates/modal-slots.css";');

    expect(minifier).toContain("function resolveCssImports(");
    expect(minifier).toContain("minifyCSS(resolveCssImports(sourcePath, original))");
  });
});
