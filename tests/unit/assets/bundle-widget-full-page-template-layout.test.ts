import { readFileSync } from "node:fs";
import { join } from "node:path";

function readFullPageWidgetSources() {
  return [
    "app/assets/bundle-widget-full-page.js",
    "app/assets/widgets/full-page/templates/standard-template.js",
    "app/assets/widgets/full-page/templates/classic-template.js",
    "app/assets/widgets/full-page/templates/compact-template.js",
    "app/assets/widgets/full-page/templates/horizontal-template.js",
  ]
    .map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"))
    .join("\n");
}

function readFullPageStyles() {
  return [
    "app/assets/widgets/full-page-css/bundle-widget-full-page.css",
    "app/assets/widgets/full-page-css/templates/side-footer-standard.css",
    "app/assets/widgets/full-page-css/templates/side-footer-classic.css",
    "app/assets/widgets/full-page-css/templates/side-footer-compact.css",
    "app/assets/widgets/full-page-css/templates/side-footer-horizontal.css",
  ]
    .map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"))
    .join("\n");
}

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
    const source = readFullPageWidgetSources();
    const css = readFullPageStyles();
    const storefrontStyles = `${source}\n${css}`;
    const horizontalStaticCss = readFileSync(
      join(process.cwd(), "app/assets/widgets/full-page-css/templates/side-footer-horizontal.css"),
      "utf8",
    );

    expect(source).toContain("ensureHorizontalSidePanelSlotRuntimeStyles()");
    expect(source).toContain("prototype.ensureHorizontalSidePanelSlotRuntimeStyles = function()");
    expect(source).toContain("return;");

    expect(storefrontStyles).toContain("[data-bundle-type=full_page].fpb-h");
    expect(storefrontStyles).toContain("width:min(100vw,1536px)");
    expect(storefrontStyles).toContain(".fpb-h .sidebar-layout-wrapper");
    expect(storefrontStyles).toContain("grid-template-columns:0.65fr 0.35fr");
    expect(storefrontStyles).toContain(".fpb-h .full-page-product-grid");
    expect(storefrontStyles).toContain("container-type:inline-size");
    expect(storefrontStyles).toContain("grid-template-columns:repeat(2,\nminmax(0,\n1fr))");
    expect(storefrontStyles).toContain(".fpb-h .product-card");
    expect(storefrontStyles).toContain("height:156px");
    expect(storefrontStyles).toContain("grid-template-columns:120px minmax(0,1fr)");
    expect(storefrontStyles).toContain("grid-template-rows:62px 0 62px");
    expect(storefrontStyles).toContain(".fpb-h .product-image");
    expect(storefrontStyles).toContain("height:140px");
    expect(storefrontStyles).toContain(".fpb-h .product-image img");
    expect(storefrontStyles).toContain("object-fit:cover");
    expect(horizontalStaticCss).toContain("object-fit:cover");
    expect(horizontalStaticCss).not.toContain("object-fit:contain");
    expect(storefrontStyles).toContain(".fpb-h .product-add-btn");
    expect(storefrontStyles).toContain("width:35px");
    expect(storefrontStyles).toContain("min-width:35px");
    expect(storefrontStyles).toContain("height:35px");
    expect(storefrontStyles).toContain("border-radius:5px");
    expect(storefrontStyles).toContain(".fpb-h .full-page-side-panel");
    expect(storefrontStyles).toContain("min-height:714px");
    expect(storefrontStyles).toContain("@media (max-width:768px)");
    expect(storefrontStyles).toContain(".fpb-h .sidebar-layout-wrapper {\n  display:block");
    expect(storefrontStyles).toContain(".fpb-h .full-page-product-grid {\n  grid-template-columns:1fr");
    expect(storefrontStyles).toContain("grid-template-columns:103.8px minmax(0,1fr)");
    expect(storefrontStyles).toContain("height:136px");
    expect(storefrontStyles).toContain("width:103.8px");
    expect(storefrontStyles).toContain("height:120px");
    expect(storefrontStyles).toContain(".fpb-h .side-panel-product-slot");
    expect(storefrontStyles).toContain("grid-template-columns:75px minmax(0,1fr) auto");
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

  it("keeps static FPB runtime presentation in CSS instead of inline JS styles", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );
    const css = readFullPageStyles();

    expect(source).toContain("fpb-sidebar-tier-cta");
    expect(source).toContain("--fpb-promo-banner-bg-image");
    expect(source).toContain("--fpb-promo-banner-bg-size");
    expect(source).toContain("--fpb-promo-banner-bg-position");
    expect(source).toContain("--fpb-discount-progress-width");

    expect(source).not.toContain("cta.style.cssText = 'width:100%;box-sizing:border-box;background:#000;color:#fff;border:1px solid #000;border-radius:8px;padding:12px 16px;margin:4px 0 12px;text-align:center;font-weight:800;line-height:1.25;'");
    expect(source).not.toContain("banner.style.backgroundImage");
    expect(source).not.toContain("banner.style.backgroundSize");
    expect(source).not.toContain("banner.style.backgroundPosition");
    expect(source).not.toContain("fill.style.width = progressPct + '%';");

    expect(css).toContain(".fpb-sidebar-tier-cta");
    expect(css).toContain("background-image:var(--fpb-promo-banner-bg-image");
    expect(css).toContain("background-size:var(--fpb-promo-banner-bg-size");
    expect(css).toContain("background-position:var(--fpb-promo-banner-bg-position");
    expect(css).toContain("width:var(--fpb-discount-progress-width,0%)");
  });

  it("matches Standard Design DEFAULT side-footer storefront contract", () => {
    const source = readFullPageWidgetSources();
    const css = readFullPageStyles();
    const storefrontStyles = `${source}\n${css}`;

    expect(source).toContain("return 'DEFAULT';");
    expect(source).toContain("if (preset === 'STANDARD') return 'DEFAULT';");
    expect(source).toContain("if (preset === 'DEFAULT_FBP') return 'DEFAULT';");
    expect(source).not.toContain("pricingMethod === 'fixed_amount_off'");
    expect(source).not.toContain("cardElement.querySelector('.product-price-row')?.remove();");

    expect(source).toContain("ensureStandardPresetRuntimeStyles()");
    expect(source).toContain("wpb-fpb-standard-runtime-styles");
    expect(storefrontStyles).toContain('[data-fpb-design-preset=DEFAULT]');
    expect(storefrontStyles).toContain('--standard-card-height:352px');
    expect(storefrontStyles).toContain('--ih:240px');
    expect(storefrontStyles).toContain('--mw:177.5px');
    expect(storefrontStyles).toContain('--mh:264px');
    expect(storefrontStyles).toContain('--mih:150px');
    expect(storefrontStyles).toContain('grid-template-columns:minmax(0,calc(100% - 381.266px)) 366.266px');
    expect(storefrontStyles).toContain('gap:15px;max-width:1455px');
    expect(storefrontStyles).toContain('container-type:inline-size');
    expect(storefrontStyles).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
    expect(storefrontStyles).toContain('gap:var(--cg,15px);margin:0 0 20px;padding:0');
    expect(storefrontStyles).toContain('height:var(--standard-card-height,352px)');
    expect(storefrontStyles).toContain('grid-template-rows:240px 40px 40px');
    expect(storefrontStyles).toContain('@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=DEFAULT] > :is(.bundle-banners,.category-tabs,.sidebar-layout-wrapper){width:100%;margin-left:0;margin-right:0}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .sidebar-layout-wrapper .sidebar-content{padding:0 0 120px!important}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid-container{width:100%;max-width:none}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--cg,15px);justify-content:stretch;margin:0 0 20px;padding:0}');
    expect(storefrontStyles).toContain('grid-template-rows:var(--mih,150px) 42px 40px;gap:8px;padding:8px;border:0;border-radius:10px;box-shadow:none;background:#fff;overflow:visible');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-content-wrapper{grid-row:2 / span 2;display:grid;grid-template-columns:minmax(0,1fr) 35px;grid-template-rows:40px 40px;gap:8px 5px;width:100%;min-width:0;padding:0;overflow:hidden');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-title{grid-row:1;grid-column:1 / -1;width:100%;min-height:40px;height:40px;font-size:16px!important;line-height:22px!important;font-weight:700!important;text-align:left');
    expect(storefrontStyles).toContain('font-weight:700!important;text-align:left;letter-spacing:0!important;margin:0;padding:0;overflow:visible');
    expect(storefrontStyles).toContain('min-height:42px;height:42px;font-size:14px!important;line-height:18px!important;font-weight:700!important;text-align:left;letter-spacing:0!important;margin:0;padding:0;overflow:visible');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-price-row{grid-row:2;grid-column:1;width:100%;height:35px;min-height:35px;margin:0;display:flex;flex-direction:row;gap:5px;align-items:center;justify-content:flex-start;text-align:left');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-variant-badge,.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-spacer,.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-quantity-wrapper{display:none}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card-action{grid-row:2;grid-column:2;width:35px;height:35px;min-height:35px;margin:0;display:flex;align-items:center;justify-content:center');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-add-btn{width:35px;min-width:35px;height:35px;padding:0;border-radius:5px;font-size:0;line-height:1;box-shadow:none');
    expect(storefrontStyles).toContain('min-height:738px');
    expect(storefrontStyles).not.toContain('grid-template-columns:minmax(0,993px) 447px');
    expect(storefrontStyles).not.toContain('grid-template-columns:repeat(3,var(--cw,321px))');
    expect(storefrontStyles).toContain('width:35px');
    expect(storefrontStyles).toContain('height:35px');
    expect(storefrontStyles).toContain('border-radius:5px');
    expect(storefrontStyles).toContain('[data-fpb-card-cta-mode=icon] .sidebar-content .product-add-btn{width:35px;min-width:35px;height:35px;padding:0;border-radius:5px;font-size:0');
    expect(storefrontStyles).toContain('[data-fpb-card-cta-mode=icon] .product-add-btn::before{content:"+"');
    expect(storefrontStyles).toContain('[data-fpb-card-cta-mode=icon] .product-add-btn.added::before{content:"✓"');
    expect(storefrontStyles).not.toContain('grid-template-rows:var(--mih,150px) 23px 40px');

    expect(source).toContain("applyStandardExpandedVariantTitle(cardElement, product)");
    expect(source).toContain("product-card--expanded-variant");
    expect(source).toContain("product-title-main");
    expect(source).toContain("product-title-variant");
    expect(source).toContain("this._resolveText('nextButton', 'Next')");
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .category-tabs{height:50.8px;display:grid;grid-auto-flow:column;grid-auto-columns:max-content;justify-content:flex-start;gap:20px;margin:0 0 20px;padding:0;overflow:visible}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .category-tab{height:50.8px;display:grid;grid-template-columns:max-content;grid-template-rows:30px;align-items:center;padding:10px;border:0;background:transparent;border-radius:0;font-size:16px;line-height:28.8px;font-weight:700}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-category-section-row{width:100%;height:68.8px;display:grid;grid-template-columns:minmax(0,max-content) 20px;align-items:start;justify-content:space-between;padding:14px 0;border:0;background:transparent;border-radius:0;font-size:16px;line-height:28.8px;font-weight:700}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-category-section-row::after{content:"";width:20px;height:20px;display:block;background:currentColor;clip-path:polygon(25% 35%,50% 60%,75% 35%,80% 42%,50% 72%,20% 42%)}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .full-page-side-panel{border:0;border-radius:0}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-title{font-size:25px;line-height:30px;font-weight:700}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-action-container{grid-template-columns:minmax(0,1fr) 157px;gap:5px;margin-top:14px}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-btn-next{width:157px;min-width:157px;height:41px;border-radius:5px;padding:8px;font-size:16px;line-height:22px;font-weight:700}');
    expect(storefrontStyles).toContain('.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray{display:grid;position:sticky;grid-template-columns:360px;grid-template-rows:126.5625px 58px;bottom:0;left:10px;width:370px;height:195.5625px;padding:5px;border-radius:0;box-shadow:none;background:#fff;z-index:9999}');
    expect(storefrontStyles).toContain('.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray .side-panel-discount-message{height:126.5625px;overflow:hidden}');
    expect(storefrontStyles).toContain('.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray .side-panel-btn-next{width:360px;height:38px;border-radius:5px;padding:8px;font-size:14px;line-height:22px;font-weight:700}');
    expect(storefrontStyles).toContain('@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=DEFAULT] .category-tabs{height:49px;gap:20px;margin:0 0 16px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .category-tab{height:49px;font-size:15px;line-height:27px}');
    expect(storefrontStyles).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-category-section-row{height:72.4px;padding:14px 0;font-size:18px;line-height:32.4px}');
  });

  it("matches Standard Design step timeline contract", () => {
    const source = readFullPageWidgetSources();
    const css = readFullPageStyles();
    const storefrontStyles = `${source}\n${css}`;

    expect(source).toContain("createStandardStepTimeline(");
    expect(source).toContain("standard-navigation-items-container");
    expect(source).toContain("standard-navigation-step-img-container");
    expect(source).toContain("standard-steps-progress-bar-container");
    expect(source).toContain("getStandardTimelinePageSize()");
    expect(source).toContain("return window.innerWidth < 768 ? 4 : 5;");
    expect(source).toContain("getStandardTimelineVisibleEntries(timelineEntries, activeEntryIndex)");
    expect(source).toContain("const timelinePageSize = this.getStandardTimelinePageSize();");
    expect(source).toContain("standard-navigation-arrow standard-navigation-arrow--prev");
    expect(source).toContain("standard-navigation-arrow standard-navigation-arrow--next");
    expect(source).toContain("standard-navigation-items-container--paged");
    expect(source).toContain("timeline.classList.toggle('step-timeline--paged', isPaged);");
    expect(source).toContain("timeline-navigation-arrow timeline-navigation-arrow--prev");
    expect(source).toContain("timeline-navigation-arrow timeline-navigation-arrow--next");
    expect(source).toContain("--standard-timeline-count");
    expect(source).toContain("--standard-timeline-visible-count");
    expect(source).toContain("--standard-timeline-width");
    expect(source).toContain("--standard-timeline-progress-left");
    expect(source).toContain("--standard-timeline-progress-width");
    expect(source).toContain("--standard-timeline-progress-fill");

    expect(storefrontStyles).toContain(".step-timeline--standard");
    expect(storefrontStyles).toContain(".step-timeline--paged");
    expect(storefrontStyles).toContain(".timeline-navigation-arrow");
    expect(storefrontStyles).toContain(".timeline-navigation-arrow--prev");
    expect(storefrontStyles).toContain(".timeline-navigation-arrow--next");
    expect(storefrontStyles).toContain("grid-template-columns:repeat(var(--standard-timeline-count,2),minmax(0,1fr))");
    expect(storefrontStyles).toContain(".standard-navigation-arrow{position:absolute;top:10px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;border:0;background:#fff;color:#000;z-index:3;cursor:pointer;padding:0}");
    expect(storefrontStyles).toContain(".standard-navigation-arrow--prev{left:-12px}");
    expect(storefrontStyles).toContain(".standard-navigation-arrow--next{right:-12px}");
    expect(storefrontStyles).toContain("grid-template-rows:40px 36.8px");
    expect(storefrontStyles).toContain("width:var(--standard-timeline-width,60%)");
    expect(storefrontStyles).toContain("height:76.8px");
    expect(storefrontStyles).toContain("top:17px");
    expect(storefrontStyles).toContain("height:6px");
    expect(storefrontStyles).toContain("background:#ccc");
    expect(storefrontStyles).toContain("background:#1e1e1e");
    expect(storefrontStyles).toContain("border:4px solid #000");
    expect(storefrontStyles).toContain("border:2px solid #d4d5d6");
    expect(storefrontStyles).toContain("isolation:isolate");
    expect(storefrontStyles).toContain("z-index:2");
    expect(storefrontStyles).toContain("filter:none!important;opacity:1!important");
    expect(storefrontStyles).toContain("background:#fff");
    expect(storefrontStyles).toContain("pointer-events:none");
    expect(storefrontStyles).toContain("font-size:16px");
    expect(storefrontStyles).toContain("line-height:28.8px");
    expect(storefrontStyles).toContain("font-size:12px");
    expect(storefrontStyles).toContain("line-height:21.6px");
  });

  it("matches Standard Design discount progress modes", () => {
    const source = readFullPageWidgetSources();
    const css = readFullPageStyles();
    const storefrontStyles = `${source}\n${css}`;

    expect(source).toContain("fpb-dp-simple");
    expect(source).toContain("fpb-dp-step_based");
    expect(source).toContain("renderStepBasedDiscountProgress(progressPct, milestones, isReached, placement)");

    expect(storefrontStyles).toContain("--fpb-discount-track-empty:#C1E7C5");
    expect(storefrontStyles).toContain("--fpb-discount-track-filled:#15A524");
    expect(storefrontStyles).toContain(".fpb-dp-simple .fpb-dp-track");
    expect(storefrontStyles).toContain(".fpb-dp-step_based .fpb-dp-track");
    expect(storefrontStyles).toContain("height:6px");
    expect(storefrontStyles).toContain("background:var(--fpb-discount-track-empty,#C1E7C5)");
    expect(storefrontStyles).toContain("background:var(--fpb-discount-track-filled,#15A524)");
    expect(storefrontStyles).toContain("min-width:0");
    expect(storefrontStyles).not.toContain(".fpb-dp-sidebar .fpb-dp-fill {\n  background:#B7E5BD");
  });

  it("matches Standard Design empty sidebar and timeline interaction contract", () => {
    const source = readFullPageWidgetSources();
    const css = readFullPageStyles();
    const storefrontStyles = `${source}\n${css}`;

    expect(source).toContain("const isStandardDesktopSidebar = this._isStandardDesktopSidebar(panel);");
    expect(source).toContain("if (isStandardDesktopSidebar || allSelectedProducts.length > 0)");
    expect(source).toContain("this._renderStandardSidebarEmptySlots(productsContainer)");
    expect(source).toContain("? `${allSelectedProducts.length} item(s)`");
    expect(source).toContain("if (!isStandardDesktopSidebar && tierCta)");
    expect(source).toContain("if (!isStandardDesktopSidebar && boxSelection)");
    expect(source).toContain("if (!isStandardDesktopSidebar) this._renderFreeGiftSection(panel);");
    expect(source).toContain("if (!isStandardDesktopSidebar && (conditionless ? !hasSelection : (isLastStep ? !this.areBundleConditionsMet() : !canProceed)))");
    expect(source).toContain("ToastManager.show('Please meet the quantity conditions for the current step before proceeding.')");

    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .full-page-side-panel,.layout-sidebar[data-fpb-design-preset=DEFAULT] .full-page-side-panel{border:1px solid #e3e3e3;border-radius:10px;grid-template-columns:324.266px;grid-template-rows:55px 158.969px 298.797px 70px;min-height:639.766px;height:639.766px;max-height:none;top:80px}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-header{display:grid;grid-template-columns:minmax(0,1fr) 82.9375px;grid-template-rows:55px;gap:8px;margin:0;grid-row:1;grid-column:1}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-clear-btn{display:grid;grid-template-columns:22px 32.9375px;grid-template-rows:25.1875px;gap:0;width:82.9375px;height:35.1875px;padding:5px 14px;border:0;border-radius:5px;background:#fdecea;color:#d13d54}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-discount-message{grid-row:2;grid-column:1;margin:0;padding:5px 0 0;font-size:16px;font-weight:700;line-height:28.8px;text-align:left;color:#000}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-discount-progress.fpb-dp-sidebar{grid-row:2;grid-column:1;align-self:end}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-item-count{grid-row:3;grid-column:1;align-self:start;font-size:16px;font-weight:400;line-height:28.8px;color:#000;margin:0}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-products{grid-row:3;grid-column:1;align-self:start;display:grid;grid-template-columns:314.266px;grid-template-rows:75px 170px;gap:15px;width:324.266px;height:260px;min-height:260px;max-height:260px;padding:0 10px 0 0;margin:38.797px 0 0;overflow:hidden}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-product-row{display:grid;grid-template-columns:75px 158.328px 62.9375px;grid-template-rows:75px;gap:9px;padding:0;border:0;background:transparent}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-slot{display:grid;grid-template-columns:75px 168.656px 50.6094px;grid-template-rows:75px;gap:10px;height:75px;animation:none}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-slot:nth-child(2){height:170px}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-thumb{width:75px;height:75px;border:2px dashed #a6a3a3;border-radius:5px;background:#e1e1e1}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-action-container{grid-row:4;grid-column:1;grid-template-columns:162.125px 162.141px;grid-template-rows:44px;gap:0;margin:10px 0 0;padding:15px 0 0;align-items:start}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-btn-next:disabled{opacity:1;cursor:pointer}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-sidebar-tier-cta,.layout-sidebar[data-fpb-design-preset=DEFAULT] .box-selection-container,.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-free-gift,.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-addon-message{display:none!important}");
  });

  it("matches Classic Design CLASSIC side-footer storefront contract", () => {
    const source = readFullPageWidgetSources();
    const css = readFullPageStyles();
    const storefrontStyles = `${source}\n${css}`;

    expect(source).toContain("ensureClassicPresetRuntimeStyles()");
    expect(source).toContain("wpb-fpb-classic-runtime-styles");
    expect(source).toContain("this.getFullPageDesignPreset(bundle) === 'CLASSIC'");
    expect(source).toContain("preset === 'DEFAULT' || preset === 'CLASSIC'");
    expect(source).toContain("this.getFullPageDesignPreset() === 'DEFAULT' || this.getFullPageDesignPreset() === 'CLASSIC'");
    expect(source).toContain("sheet.classList.add('fpb-mobile-classic-footer');");
    expect(source).not.toContain("pricingMethod === 'fixed_amount_off'");

    expect(storefrontStyles).toContain("[data-fpb-design-preset=CLASSIC]");
    expect(storefrontStyles).toContain("grid-template-columns:0.6897fr 0.3103fr");
    expect(storefrontStyles).toContain("grid-template-columns:repeat(4,minmax(0,1fr))");
    expect(storefrontStyles).toContain("container-type:inline-size");
    expect(storefrontStyles).toContain("width:95%");
    expect(storefrontStyles).toContain("--classic-card-height-extra:104px");
    expect(storefrontStyles).toContain("--classic-image-height-extra:12px");
    expect(storefrontStyles).toContain("height:calc((100cqw - 45px)/4 + var(--classic-card-height-extra,104px))");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-content-wrapper{grid-row:2 / span 2;display:grid;grid-template-columns:minmax(0,1fr) 35px;grid-template-rows:49px 35px;gap:8px 5px;width:100%;min-width:0;padding:0;overflow:hidden;align-items:start}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-card-action{grid-row:2;grid-column:2;width:35px;height:35px;min-height:35px;margin:0;display:flex;align-items:center;justify-content:center;align-self:start;justify-self:end}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-add-btn{width:35px;min-width:35px;height:35px;padding:0;border-radius:5px;font-size:0;line-height:1;box-shadow:none;align-self:center;justify-self:center}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .product-add-btn::before{content:\"+\";font-size:16px;font-weight:700;line-height:1}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC] .category-tabs{display:flex;justify-content:center;gap:8px;height:40.8px;margin:0 0 20px;padding:0;overflow:visible}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-products{grid-row:3;grid-column:1;align-self:start;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:75px 170px;gap:15px;width:100%;height:260px;min-height:260px;max-height:260px;padding:0 10px 0 0;margin:38.797px 0 0;overflow:hidden}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-info{display:grid;grid-template-rows:20px 28.8px;gap:0;align-self:start;min-width:0;height:75px;overflow:hidden}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-action{display:grid;place-items:center;width:62.9375px;height:75px}");
    expect(storefrontStyles).toContain("@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=CLASSIC] > :is(.bundle-banners,.category-tabs,.sidebar-layout-wrapper){width:100%;margin-left:0;margin-right:0}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC] .sidebar-layout-wrapper .sidebar-content{padding:0 0 120px!important}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid-container{width:100%;max-width:none}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{grid-template-columns:repeat(2,minmax(0,177.5px));gap:15px;justify-content:center;margin:0 0 20px;padding:0;overflow:visible}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{width:177.5px;min-width:0;max-width:177.5px;height:263px;min-height:263px;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:150px 41px 40px;gap:8px;padding:8px;border:0;border-radius:10px;box-shadow:none;background:#fff;overflow:visible}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-content-wrapper{grid-row:2 / span 2;display:grid;grid-template-columns:minmax(0,1fr) 35px;grid-template-rows:41px 35px;gap:8px 5px;width:100%;min-width:0;padding:0;overflow:hidden;align-items:start}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-title{grid-row:1;grid-column:1 / -1;width:100%;min-height:41px;height:41px;font-size:12px!important;line-height:normal!important;font-weight:400!important;text-align:left;letter-spacing:0!important;margin:0;padding:0;overflow:visible}");
    expect(storefrontStyles).toContain(".layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-card-action{grid-row:2;grid-column:2;position:static;right:auto;bottom:auto;width:35px;height:35px;min-height:35px;margin:0;display:flex;align-items:center;justify-content:center;align-self:start;justify-self:end}");
    expect(storefrontStyles).toContain(".fpb-mobile-summary-tray.fpb-mobile-classic-footer.fpb-mobile-summary-tray-expanded{grid-template-rows:126.5625px 234.906px;height:361.46875px}");
    expect(storefrontStyles).toContain(".fpb-mobile-classic-footer .fpb-mobile-summary-products-section{display:grid;position:relative;grid-template-columns:360px;grid-template-rows:168.906px 38px;width:360px;height:234.906px;padding:10px 0;gap:8px;background:#fff;box-sizing:border-box}");
    expect(storefrontStyles).toContain(".fpb-mobile-classic-footer .fpb-mobile-summary-bundle-items{display:grid;grid-template-columns:360px;grid-template-rows:54px 104.906px;width:360px;height:168.906px}");
    expect(storefrontStyles).toContain("border-radius:99px");
  });

  it("matches Compact Design COMPACT side-footer storefront contract", () => {
    const source = readFullPageWidgetSources();
    const css = readFullPageStyles();
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
    expect(storefrontStyles).toContain("--compact-mobile-card-height:245px");
    expect(storefrontStyles).toContain("--compact-mobile-image-height:150px");
    expect(storefrontStyles).toContain("height:calc((100cqw - 30px)/3 + var(--compact-card-height-extra,104px))");
    expect(storefrontStyles).toContain("height:calc((100cqw - 30px)/3 - var(--compact-image-height-extra,12px))");
    expect(storefrontStyles).toContain("grid-template-columns:repeat(2,minmax(0,177.5px))");
    expect(storefrontStyles).toContain("height:245px");
    expect(storefrontStyles).toContain("width:35px");
    expect(storefrontStyles).toContain("height:35px");
  });
});
