import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Storefront template modularization contract", () => {
  it("composes full-page template method modules through the widget entry", () => {
    const fullPageSource = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );
    const buildScript = readFileSync(
      join(process.cwd(), "scripts/build-widget-bundles.js"),
      "utf8",
    );

    expect(fullPageSource).toContain("import { standardTemplateMethods }");
    expect(fullPageSource).toContain("import { classicTemplateMethods }");
    expect(fullPageSource).toContain("import { compactTemplateMethods }");
    expect(fullPageSource).toContain("import { horizontalTemplateMethods }");
    expect(fullPageSource).toContain("standardTemplateMethods,");
    expect(fullPageSource).toContain("classicTemplateMethods,");
    expect(fullPageSource).toContain("compactTemplateMethods,");
    expect(fullPageSource).toContain("horizontalTemplateMethods,");
    expect(fullPageSource).not.toContain("installStandardTemplate(");
    expect(fullPageSource).not.toContain("installClassicTemplate(");
    expect(fullPageSource).not.toContain("installCompactTemplate(");
    expect(fullPageSource).not.toContain("installHorizontalTemplate(");

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

  it("keeps full-page template modules free of runtime style-tag injection and prototype attachment", () => {
    const modules = [
      ["standard-template.js", "standardTemplateMethods"],
      ["classic-template.js", "classicTemplateMethods"],
      ["compact-template.js", "compactTemplateMethods"],
      ["horizontal-template.js", "horizontalTemplateMethods"],
    ];

    for (const [fileName, methodsName] of modules) {
      const source = readFileSync(
        join(process.cwd(), "app/assets/widgets/full-page/templates", fileName),
        "utf8",
      );

      expect(source).toContain(`export const ${methodsName} =`);
      expect(source).not.toContain("attachFullPageTemplateMethods");
      expect(source).not.toContain("install");
      expect(source).not.toContain("document.createElement('style')");
      expect(source).not.toContain("document.head.appendChild(style);");
    }
  });

  it("moves Standard preset runtime styles out of the installer module", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/widgets/full-page/templates/standard-template.js"),
      "utf8",
    );

    expect(source).toContain("export const standardTemplateMethods =");
    expect(source).not.toContain("attachFullPageTemplateMethods");
    expect(source).toContain("ensureStandardPresetRuntimeStyles()");
    expect(source).not.toContain("wpb-fpb-standard-runtime-styles");
    expect(source).not.toContain("document.head.appendChild(style);");
  });

  it("moves Classic preset runtime styles out of the installer module", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/widgets/full-page/templates/classic-template.js"),
      "utf8",
    );

    expect(source).toContain("export const classicTemplateMethods =");
    expect(source).not.toContain("attachFullPageTemplateMethods");
    expect(source).toContain("ensureClassicPresetRuntimeStyles()");
    expect(source).not.toContain("wpb-fpb-classic-runtime-styles");
    expect(source).not.toContain("document.head.appendChild(style);");
  });

  it("moves Compact preset runtime styles out of the installer module", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/widgets/full-page/templates/compact-template.js"),
      "utf8",
    );

    expect(source).toContain("export const compactTemplateMethods =");
    expect(source).not.toContain("attachFullPageTemplateMethods");
    expect(source).toContain("ensureCompactPresetRuntimeStyles()");
    expect(source).not.toContain("wpb-fpb-compact-runtime-styles");
    expect(source).not.toContain("document.head.appendChild(style);");
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
    const cssMinifier = readFileSync(
      join(process.cwd(), "scripts/minify-assets/css-minifier.js"),
      "utf8",
    );
    const minifierTargets = readFileSync(
      join(process.cwd(), "scripts/minify-assets/targets.js"),
      "utf8",
    );
    const fullPageLiquid = readFileSync(
      join(process.cwd(), "extensions/bundle-builder/blocks/bundle-full-page.liquid"),
      "utf8",
    );
    const appEmbedLiquid = readFileSync(
      join(process.cwd(), "extensions/bundle-builder/blocks/bundle-app-embed.liquid"),
      "utf8",
    );
    const productPageLiquid = readFileSync(
      join(process.cwd(), "extensions/bundle-builder/blocks/bundle-product-page.liquid"),
      "utf8",
    );
    const fullPageWidget = [
      "app/assets/bundle-widget-full-page.js",
      ...readdirSync(join(process.cwd(), "app/assets/widgets/full-page/methods"))
        .filter((file) => file.endsWith(".js"))
        .sort()
        .map((file) => `app/assets/widgets/full-page/methods/${file}`),
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8")).join("\n");
    const productPageWidget = [
      "app/assets/bundle-widget-product-page.js",
      ...readdirSync(join(process.cwd(), "app/assets/widgets/product-page/methods"))
        .filter((file) => file.endsWith(".js"))
        .sort()
        .map((file) => `app/assets/widgets/product-page/methods/${file}`),
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8")).join("\n");

    expect(fullPageCss).not.toContain('@import "./templates/side-footer-standard.css";');
    expect(fullPageCss).not.toContain('@import "./templates/side-footer-classic.css";');
    expect(fullPageCss).not.toContain('@import "./templates/side-footer-compact.css";');
    expect(fullPageCss).not.toContain('@import "./templates/side-footer-horizontal.css";');

    expect(productPageCss).not.toContain('@import "./templates/inpage-cascade.css";');
    expect(productPageCss).not.toContain('@import "./templates/inpage-cognive.css";');
    expect(productPageCss).not.toContain('@import "./templates/modal-slots.css";');

    expect(cssMinifier).toContain("function resolveCssImports(");
    expect(minifier).toContain("minifyCSS(resolveCssImports(sourcePath, original))");
    expect(minifierTargets).toContain("bundle-widget-full-page-standard.css");
    expect(minifierTargets).toContain("bundle-widget-full-page-classic.css");
    expect(minifierTargets).toContain("bundle-widget-full-page-compact.css");
    expect(minifierTargets).toContain("bundle-widget-full-page-horizontal.css");
    expect(minifierTargets).toContain("bundle-widget-product-page-cascade.css");
    expect(minifierTargets).toContain("bundle-widget-product-page-cognive.css");
    expect(minifierTargets).toContain("bundle-widget-product-page-modal.css");

    for (const liquid of [fullPageLiquid, appEmbedLiquid]) {
      expect(liquid).toContain("window.__WOLFPACK_FPB_TEMPLATE_CSS_URLS__");
      expect(liquid).toContain("bundle-widget-full-page-standard.css");
      expect(liquid).toContain("bundle-widget-full-page-classic.css");
      expect(liquid).toContain("bundle-widget-full-page-compact.css");
      expect(liquid).toContain("bundle-widget-full-page-horizontal.css");
    }

    expect(fullPageWidget).toContain("ensureFullPageTemplateStylesheet(preset)");
    expect(fullPageWidget).toContain("this.ensureFullPageTemplateStylesheet(fullPageDesignPreset)");
    expect(productPageLiquid).toContain("window.__WOLFPACK_PPB_TEMPLATE_CSS_URLS__");
    expect(productPageLiquid).toContain("bundle-widget-product-page-cascade.css");
    expect(productPageLiquid).toContain("bundle-widget-product-page-cognive.css");
    expect(productPageLiquid).toContain("bundle-widget-product-page-modal.css");
    expect(productPageWidget).toContain("ensureProductPageTemplateStylesheet(templateType, designPreset)");
    expect(productPageWidget).toContain("this.ensureProductPageTemplateStylesheet(templateType, designPreset)");
  });
});
