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

  it("matches Horizontal Design HORIZONTAL side-footer storefront contract", () => {
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

    expect(source).toContain("ensureHorizontalSidePanelSlotRuntimeStyles()");
    expect(source).toContain("wpb-fpb-horizontal-slots-runtime-styles");
    expect(source).toContain("this.getFullPageDesignPreset() !== 'HORIZONTAL'");

    expect(storefrontStyles).toContain("[data-fpb-design-preset=HORIZONTAL]");
    expect(storefrontStyles).toContain("[data-bundle-type=full_page][data-fpb-design-preset=HORIZONTAL]{width:min(100vw,1536px);max-width:1536px;margin-left:calc(50% - min(50vw,768px));padding:10px;box-sizing:border-box}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=HORIZONTAL] .sidebar-layout-wrapper{display:grid;grid-template-columns:0.65fr 0.35fr;gap:15px;max-width:1455px;padding:0;align-items:start}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=HORIZONTAL] .sidebar-content .full-page-product-grid{container-type:inline-size;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin:12px 0 20px;padding:0;overflow:visible}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=HORIZONTAL] .sidebar-content .product-card{width:100%;min-width:0;max-width:none;height:156px;min-height:156px;display:grid;grid-template-columns:0.281fr minmax(0,0.719fr);grid-template-rows:62px 0 62px;");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=HORIZONTAL] .sidebar-content .product-image{grid-column:1;grid-row:1 / span 3;width:100%;height:140px;min-height:140px;");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=HORIZONTAL] .sidebar-content .product-add-btn{width:35px;min-width:35px;height:35px;padding:0;border-radius:5px;justify-self:end;align-self:end}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=HORIZONTAL] .full-page-side-panel{width:100%;flex:initial;min-height:738px;margin-top:115px;padding:20px;");
    expect(storefrontStyles).toContain("@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=HORIZONTAL] .sidebar-layout-wrapper{display:block;padding:0}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=HORIZONTAL] .sidebar-content .full-page-product-grid{grid-template-columns:1fr;gap:15px}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=HORIZONTAL] .sidebar-content .product-card{height:136px;min-height:136px;grid-template-columns:103.8px minmax(0,1fr);grid-template-rows:52px 0 52px;");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=HORIZONTAL] .sidebar-content .product-image{width:103.8px;height:120px;min-height:120px}");
    expect(storefrontStyles).toContain(".side-panel-product-slot{width:70px;height:70px;flex:0 0 70px");
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
