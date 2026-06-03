import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page widget template layout contract", () => {
  it("passes product GID context through to widget configuration", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("currentProductGid: window.currentProductGid");
    expect(source).toContain("currentProductId: window.currentProductId");
    expect(source).toContain("currentProductCollections: window.currentProductCollections");
  });

  it("uses the side-footer layout when the saved FPB template is side-footer", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("resolveFullPageLayout()");
    expect(source).toContain("bundle?.bundleDesignTemplate === 'FBP_SIDE_FOOTER'");
    expect(source).toContain("return 'footer_side';");
    expect(source).toContain("const layout = this.resolveFullPageLayout();");
  });

  it("marks side-footer storefront DOM with the saved FPB design preset", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("getFullPageDesignPreset()");
    expect(source).toContain(
      "const fullPageDesignPreset = this.getFullPageDesignPreset();",
    );
    expect(source).toContain(
      "this.elements.stepsContainer.dataset.fpbDesignPreset = fullPageDesignPreset;",
    );
  });

  it("includes horizontal preset CSS for the evidenced FPB card and layout rules", () => {
    const css = readFileSync(
      join(
        process.cwd(),
        "app/assets/widgets/full-page-css/bundle-widget-full-page.css",
      ),
      "utf8",
    );

    expect(css).toContain('.layout-sidebar[data-fpb-design-preset="HORIZONTAL"]');
    expect(css).toContain("grid-template-columns:0.65fr 0.35fr");
    expect(css).toContain("grid-template-columns:repeat(2,");
    expect(css).toContain("grid-template-columns:minmax(120px,0.3fr) minmax(0,0.7fr)");
    expect(css).toContain("grid-template-columns:1fr");
  });

  it("renders FPB product-card add buttons with the evidenced text label", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );
    const componentGenerator = readFileSync(
      join(process.cwd(), "app/assets/widgets/shared/component-generator.js"),
      "utf8",
    );

    expect(source).toContain("getProductAddButtonText()");
    expect(source).toContain(": this.getProductAddButtonText()");
    expect(source).toContain("addButton.textContent = this.getProductAddButtonText();");
    expect(source).toContain("addButtonText: this.getProductAddButtonText()");
    expect(componentGenerator).toContain("const addButtonText = options.addButtonText || '+';");
    expect(componentGenerator).toContain("${this.escapeHtml(addButtonText)}");
  });

  it("includes compact horizontal mobile card CSS with rectangular card CTAs", () => {
    const css = readFileSync(
      join(
        process.cwd(),
        "app/assets/widgets/full-page-css/bundle-widget-full-page.css",
      ),
      "utf8",
    );

    expect(css).toContain(".layout-sidebar .product-add-btn");
    expect(css).toContain("height:36px");
    expect(css).toContain("border-radius:5px");
    expect(css).toContain("box-shadow:none");
    expect(css).toContain('.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .sidebar-content .product-add-btn');
    expect(css).toContain("grid-template-columns:112px minmax(0,1fr)");
    expect(css).toContain("min-height:112px");
    expect(css).toContain("height:100px");
  });

  it("matches EB Standard Design DEFAULT side-footer storefront contract", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );
    const css = readFileSync(
      join(
        process.cwd(),
        "app/assets/widgets/full-page-css/bundle-widget-full-page.css",
      ),
      "utf8",
    );
    const storefrontStyles = `${source}\n${css}`;

    expect(source).toContain("return 'DEFAULT';");
    expect(source).toContain("if (preset === 'STANDARD') return 'DEFAULT';");
    expect(source).not.toContain("pricingMethod === 'fixed_amount_off'");
    expect(source).not.toContain("cardElement.querySelector('.product-price-row')?.remove();");

    expect(source).toContain("ensureStandardPresetRuntimeStyles()");
    expect(source).toContain("wpb-fpb-standard-runtime-styles");
    expect(storefrontStyles).toContain('[data-fpb-design-preset=DEFAULT]');
    expect(storefrontStyles).toContain('--cw:321px');
    expect(storefrontStyles).toContain('--ch:352px');
    expect(storefrontStyles).toContain('--iw:305px');
    expect(storefrontStyles).toContain('--ih:240px');
    expect(storefrontStyles).toContain('--mw:177.5px');
    expect(storefrontStyles).toContain('--mh:264px');
    expect(storefrontStyles).toContain('--mih:150px');
    expect(storefrontStyles).toContain('grid-template-columns:minmax(0,993px) 447px');
    expect(storefrontStyles).toContain('grid-template-columns:repeat(3,var(--cw,321px))');
    expect(storefrontStyles).toContain('width:35px');
    expect(storefrontStyles).toContain('height:35px');
    expect(storefrontStyles).toContain('border-radius:5px');
  });

  it("matches EB Classic Design CLASSIC side-footer storefront contract", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );
    const css = readFileSync(
      join(
        process.cwd(),
        "app/assets/widgets/full-page-css/bundle-widget-full-page.css",
      ),
      "utf8",
    );
    const storefrontStyles = `${source}\n${css}`;

    expect(source).toContain("ensureClassicPresetRuntimeStyles()");
    expect(source).toContain("wpb-fpb-classic-runtime-styles");
    expect(source).toContain("this.getFullPageDesignPreset(bundle) === 'CLASSIC'");
    expect(source).not.toContain("pricingMethod === 'fixed_amount_off'");

    expect(storefrontStyles).toContain("[data-fpb-design-preset=CLASSIC]");
    expect(storefrontStyles).toContain("grid-template-columns:0.6897fr 0.3103fr");
    expect(storefrontStyles).toContain("grid-template-columns:repeat(4,minmax(0,1fr))");
    expect(storefrontStyles).toContain("container-type:inline-size");
    expect(storefrontStyles).toContain("width:95%");
    expect(storefrontStyles).toContain("--classic-card-height-extra:104px");
    expect(storefrontStyles).toContain("--classic-image-height-extra:12px");
    expect(storefrontStyles).toContain("height:calc((100cqw - 45px)/4 + var(--classic-card-height-extra,104px))");
    expect(storefrontStyles).toContain("grid-template-columns:repeat(2,minmax(0,177.5px))");
    expect(storefrontStyles).toContain("height:263px");
    expect(storefrontStyles).toContain("border-radius:99px");
  });

  it("matches EB Compact Design COMPACT side-footer storefront contract", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );
    const css = readFileSync(
      join(
        process.cwd(),
        "app/assets/widgets/full-page-css/bundle-widget-full-page.css",
      ),
      "utf8",
    );
    const storefrontStyles = `${source}\n${css}`;

    expect(source).toContain("ensureCompactPresetRuntimeStyles()");
    expect(source).toContain("wpb-fpb-compact-runtime-styles");
    expect(source).toContain("this.getFullPageDesignPreset(bundle) === 'COMPACT'");
    expect(source).toContain("preset === 'COMPACT'");

    expect(storefrontStyles).toContain("[data-fpb-design-preset=COMPACT]");
    expect(storefrontStyles).toContain("grid-template-columns:0.6fr 0.4fr");
    expect(storefrontStyles).toContain("gap:30px");
    expect(storefrontStyles).toContain("grid-template-columns:repeat(3,minmax(0,1fr))");
    expect(storefrontStyles).toContain("container-type:inline-size");
    expect(storefrontStyles).toContain("--compact-card-height-extra:104px");
    expect(storefrontStyles).toContain("--compact-image-height-extra:12px");
    expect(storefrontStyles).toContain("height:min(352px,calc((100cqw - 30px)/3 + var(--compact-card-height-extra,104px)))");
    expect(storefrontStyles).toContain("height:min(240px,calc((100cqw - 30px)/3 - var(--compact-image-height-extra,12px)))");
    expect(storefrontStyles).toContain("grid-template-columns:repeat(2,minmax(0,177.5px))");
    expect(storefrontStyles).toContain("height:263px");
    expect(storefrontStyles).toContain("width:35px");
    expect(storefrontStyles).toContain("height:35px");
  });
});
