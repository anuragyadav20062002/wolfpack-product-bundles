import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(filePath: string) {
  return readFileSync(join(process.cwd(), filePath), "utf8");
}

function readFullPageWidgetSources() {
  const methodFiles = readdirSync(join(process.cwd(), "app/assets/widgets/full-page/methods"))
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => `app/assets/widgets/full-page/methods/${file}`);

  return [
    "app/assets/bundle-widget-full-page.js",
    "app/assets/widgets/full-page/templates/standard.config.js",
    "app/assets/widgets/full-page/templates/standard-template.js",
    "app/assets/widgets/full-page/templates/classic.config.js",
    "app/assets/widgets/full-page/templates/classic-template.js",
    "app/assets/widgets/full-page/templates/compact.config.js",
    "app/assets/widgets/full-page/templates/compact-template.js",
    "app/assets/widgets/full-page/templates/horizontal.config.js",
    "app/assets/widgets/full-page/templates/horizontal-template.js",
    ...methodFiles,
  ]
    .map(readSource)
    .join("\n");
}

describe("Full Page widget functional template contracts", () => {
  it("passes product GID context through to widget configuration", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("currentProductGid: window.currentProductGid");
    expect(source).toContain("currentProductId: window.currentProductId");
    expect(source).toContain("currentProductCollections: window.currentProductCollections");
  });

  it("resolves FPB side-footer template and preset markers from saved bundle data", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("getFullPageTemplate(bundle = this.selectedBundle)");
    expect(source).toContain("return 'FBP_SIDE_FOOTER';");
    expect(source).toContain("getFullPageDesignPreset(bundle = this.selectedBundle)");
    expect(source).toContain("if (preset === 'STANDARD') return 'DEFAULT';");
    expect(source).toContain("if (preset === 'DEFAULT_FBP') return 'DEFAULT';");
    expect(source).toContain("this.elements.stepsContainer.dataset.fpbDesignPreset = fullPageDesignPreset;");
  });

  it("loads only the active FPB template stylesheet instead of inlining template CSS", () => {
    const source = readFullPageWidgetSources();
    const sectionLiquid = readSource("extensions/bundle-builder/blocks/bundle-full-page.liquid");
    const appEmbedLiquid = readSource("extensions/bundle-builder/blocks/bundle-app-embed.liquid");

    expect(source).toContain("ensureFullPageTemplateStylesheet(preset)");
    expect(source).toContain("window.__WOLFPACK_FPB_TEMPLATE_CSS_URLS__");
    expect(source).toContain("this.ensureFullPageTemplateStylesheet(fullPageDesignPreset)");
    expect(source).toContain("link.dataset.wpbFpbTemplateCss = templateKey;");

    for (const liquid of [sectionLiquid, appEmbedLiquid]) {
      expect(liquid).toContain("window.__WOLFPACK_FPB_TEMPLATE_CSS_URLS__");
      expect(liquid).toContain("bundle-widget-full-page-standard.css");
      expect(liquid).toContain("bundle-widget-full-page-classic.css");
      expect(liquid).toContain("bundle-widget-full-page-compact.css");
      expect(liquid).toContain("bundle-widget-full-page-horizontal.css");
    }
  });

  it("keeps FPB template modules free of runtime style-tag injection", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("standardTemplateMethods,");
    expect(source).toContain("classicTemplateMethods,");
    expect(source).toContain("compactTemplateMethods,");
    expect(source).toContain("horizontalTemplateMethods,");
    expect(source).not.toContain("installStandardTemplate(");
    expect(source).not.toContain("installClassicTemplate(");
    expect(source).not.toContain("installCompactTemplate(");
    expect(source).not.toContain("installHorizontalTemplate(");

    expect(source).not.toContain("wpb-fpb-standard-runtime-styles");
    expect(source).not.toContain("wpb-fpb-classic-runtime-styles");
    expect(source).not.toContain("wpb-fpb-compact-runtime-styles");
    expect(source).not.toContain("wpb-fpb-horizontal-runtime-styles");
    expect(source).not.toContain("document.createElement('style')");
    expect(source).not.toContain("document.head.appendChild(style);");
  });

  it("keeps product-card add button text flowing through the shared renderer", () => {
    const source = readFullPageWidgetSources();
    const componentGenerator = readSource("app/assets/widgets/shared/component-generator.js");

    expect(source).toContain("getProductAddButtonText()");
    expect(source).toContain(": this.getProductAddButtonText()");
    expect(source).toContain("addButton.textContent = this.getProductAddButtonText();");
    expect(source).toContain("addButtonText: this.getProductAddButtonText()");
    expect(componentGenerator).toContain("const addButtonText = options.addButtonText || '+';");
    expect(componentGenerator).toContain("${this.escapeHtml(addButtonText)}");
  });

  it("keeps Standard timeline pagination behavior wired without runtime CSS injection", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("getStandardTimelinePageSize()");
    expect(source).toContain("return window.innerWidth < 768 ? 4 : 5;");
    expect(source).toContain("getStandardTimelineVisibleEntries(timelineEntries, activeEntryIndex)");
    expect(source).toContain("timeline.classList.toggle('step-timeline--paged', isPaged);");
    expect(source).toContain("timeline-navigation-arrow timeline-navigation-arrow--prev");
    expect(source).toContain("timeline-navigation-arrow timeline-navigation-arrow--next");
    expect(source).toContain("ensureTimelinePagingStyles()");
    expect(source).toMatch(/ensureTimelinePagingStyles\(\)\s*{\s*return true;\s*}/);
    expect(source).not.toContain("wpb-fpb-timeline-paging-styles");
  });

  it("preserves storefront-critical Standard sidebar gating and validation behavior", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("const isStandardDesktopSidebar = this._isStandardDesktopSidebar(panel);");
    expect(source).toContain("if (isStandardDesktopSidebar || allSelectedProducts.length > 0)");
    expect(source).toContain("this._renderStandardSidebarEmptySlots(productsContainer)");
    expect(source).toContain("if ((isClassicDesktopSidebar || !isStandardDesktopSidebar) && boxSelection)");
    expect(source).toContain("if (!isClassicDesktopSidebar && !isStandardDesktopSidebar) this._renderFreeGiftSection(panel);");
    expect(source).toContain("if (!isStandardDesktopSidebar && !isClassicDesktopSidebar && tierCta)");
    expect(source).toContain("ToastManager.show('Please meet the quantity conditions for the current step before proceeding.')");
  });

  it("preserves template-specific shared primitive routing", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("renderClassicSidebarSlots(");
    expect(source).toContain("classic-sidebar-slots bw-selected-slots--classic-sidebar");
    expect(source).toContain("import { renderSharedProductCard }");
    expect(source).toContain("htmlString = renderSharedProductCard(");
    expect(source).toContain("FPB_STANDARD_TEMPLATE_CONFIG");
    expect(source).toContain("FPB_CLASSIC_TEMPLATE_CONFIG");
    expect(source).toContain("FPB_COMPACT_TEMPLATE_CONFIG");
    expect(source).toContain("FPB_HORIZONTAL_TEMPLATE_CONFIG");
  });

  it("preserves Horizontal product title and slot data behavior", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("getSummaryProductVariantDisplay(item)");
    expect(source).toContain("getParentTitleFromDisplayTitle(item.title)");
    expect(source).toContain("getSummaryVariantFromDisplayTitle(normalizedTitle)");
    expect(source).toContain("const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');");
    expect(source).toContain("const emptyStateIcon = emptyStateIconUrl");
    expect(source).toContain("if (this._shouldRenderProductSlots()) {");
    expect(source).toContain("const requiredSlots = Math.max(");
    expect(source).toContain("const emptySlots = Math.max(0, requiredSlots - allSelectedProducts.length)");
  });
});
