import { readFileSync } from "node:fs";
import { join } from "node:path";

const widgetSource = () =>
  readFileSync(
    join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
    "utf8",
  );

const widgetStyles = () =>
  readFileSync(
    join(
      process.cwd(),
      "app/assets/widgets/full-page-css/bundle-widget-full-page.css",
    ),
    "utf8",
  );

const standardTemplateSource = () =>
  readFileSync(
    join(process.cwd(), "app/assets/widgets/full-page/templates/standard-template.js"),
    "utf8",
  );

describe("Full Page widget discount display contract", () => {
  it("renders direct box-selection options before discount messaging", () => {
    const source = widgetSource();

    expect(source).toContain("renderBoxSelectionOptions(");
    expect(source).toContain("this.selectedBundle?.boxSelection");
    expect(source).toContain("fpb-box-selection-wrapper");
    expect(source).toContain("fpb-box-selection-option-active");
    expect(source).toContain("panel.appendChild(boxSelection);");
    const boxSelectionAppendIndex = source.indexOf("panel.appendChild(boxSelection);");
    expect(boxSelectionAppendIndex).toBeLessThan(
      source.indexOf("side-panel-discount-message", boxSelectionAppendIndex),
    );
  });

  it("renders step-based progress title and subtext markers", () => {
    const source = widgetSource();

    expect(source).toContain("getDiscountProgressMilestones(");
    expect(source).toContain("fpb-discount-step-title");
    expect(source).toContain("fpb-discount-step-subtitle");
    expect(source).toContain("tierTextByRuleId");
    expect(source).toContain("tierSubtext");
  });

  it("renders EB-style promo discount tier badges from pricing rules", () => {
    const source = widgetSource();
    const css = widgetStyles();

    expect(source).toContain("createPromoDiscountTierBadges(");
    expect(source).toContain("promo-discount-tier-row");
    expect(source).toContain("promo-discount-tier-badge");
    expect(source).toContain("formatPromoDiscountTierLabel(");
    expect(source).toContain("pricing?.messages?.tierTextByRuleId");
    expect(source).toContain('style="${rowStyle}"');
    expect(source).toContain('style="${badgeStyle}"');
    expect(css).toContain(".promo-banner.has-discount .promo-banner-note");
  });

  it("uses EB-style sidebar tier labels for the primary add-to-cart CTA", () => {
    const source = widgetSource();

    expect(source).toContain("getSidebarTierCtaContent(");
    expect(source).toContain("const sidebarTierCtaContent = (conditionless || isLastStep)");
    expect(source).toContain("side-panel-btn-tier-label");
    expect(source).toContain("side-panel-btn-tier-subtext");
    expect(source).toContain("nextBtn.innerHTML = sidebarTierCtaContent");
    expect(source).toContain("const nextStepLabel = this.getFullPageDesignPreset() === 'DEFAULT'");
    expect(source).toContain("nextBtn.textContent = (conditionless || isLastStep) ? 'Add to Cart' : nextStepLabel;");
  });

  it("includes styles for box options and step progress labels", () => {
    const css = widgetStyles();

    expect(css).toContain(".fpb-box-selection-wrapper");
    expect(css).toContain(".fpb-box-selection-option-active");
    expect(css).toContain(".fpb-discount-step-title");
    expect(css).toContain(".fpb-discount-step-subtitle");
  });

  it("uses sidebar-specific structure and styles for step progress", () => {
    const source = widgetSource();
    const css = widgetStyles();
    const standardSource = standardTemplateSource();

    expect(source).toContain('placement: "sidebar"');
    expect(source).toContain("fpb-discount-step-subtitle-list");
    expect(source).toContain('placement === "sidebar"');
    expect(css).toContain(".fpb-discount-progress.fpb-dp-sidebar");
    expect(css).toContain(".fpb-dp-sidebar .fpb-discount-step-subtitle-list");
    expect(css).toContain(".fpb-dp-sidebar .fpb-discount-step:only-child");
    expect(css).toContain("background:transparent");
    expect(standardSource).toContain(".layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-discount-message");
    expect(css).toContain(".fpb-mobile-bottom-sheet.fpb-mobile-summary-tray .side-panel-discount-message");
    expect(css).toContain(".fpb-dp-sidebar .fpb-dp-track");
    expect(standardSource).toContain("color:#000");
    expect(css).toMatch(
      /\.fpb-dp-sidebar \.fpb-dp-track \{[^}]*background:var\(--fpb-discount-track-empty,#C1E7C5\);/,
    );
  });

  it("renders the Standard mobile side-footer summary as a measured sticky footer", () => {
    const source = widgetSource();
    const css = widgetStyles();
    const standardSource = standardTemplateSource();

    expect(source).toContain("usesCompactMobileSummaryTray");
    expect(source).toContain("fpb-mobile-summary-tray");
    expect(source).toContain("_populateCompactMobileSummaryTray(sheet);");
    expect(source).toContain("fpb-mobile-summary-count-badge");
    expect(source).toContain("fpb-mobile-summary-discount-text");
    expect(source).toContain("const shouldShowProgressBar = this.config.showDiscountProgressBar || usesCompactMobileSummaryTray;");
    expect(source).toContain("discountBlock.appendChild(progressBar);");
    expect(source).toContain("fpb-mobile-summary-action-label");
    expect(source).toContain("fpb-mobile-summary-action-price");
    expect(source).toContain("sheet.classList.add('is-open');");
    expect(source).toContain("this._createMobileSummaryActionButton(");
    expect(source).toContain("hasUpcomingAddonStep");
    expect(css).toContain(".fpb-mobile-summary-tray");
    expect(css).toMatch(
      /\.fpb-mobile-summary-tray \{[^}]*display:grid;[^}]*grid-template-columns:360px;[^}]*bottom:0;[^}]*left:10px;[^}]*width:370px;[^}]*height:196px;/,
    );
    expect(css).toMatch(
      /\.fpb-mobile-summary-tray \{[^}]*gap:0;[^}]*box-shadow:none;[^}]*padding:5px;/,
    );
    expect(css).toMatch(
      /\.fpb-mobile-summary-count-badge \{[^}]*position:absolute;[^}]*top:-12px;[^}]*left:50%;[^}]*height:25px;[^}]*border-radius:10px;[^}]*background:#000000;/,
    );
    expect(standardSource).toContain(".fpb-mobile-summary-count-badge::before");
    expect(standardSource).toContain(".fpb-mobile-bottom-sheet.fpb-mobile-summary-tray .side-panel-discount-message{height:126.5625px;overflow:hidden}");
    expect(standardSource).toContain(".fpb-mobile-summary-discount-text{display:flex;align-items:center;justify-content:center;width:360px;min-height:25.2px;margin:0;padding:0;color:#000;font-size:14px;font-weight:700;line-height:25.2px;text-align:center}");
    expect(css).toMatch(
      /\.fpb-mobile-summary-tray \.fpb-discount-progress\.fpb-dp-sidebar \{[^}]*width:310px;[^}]*height:96px;[^}]*margin:0;/,
    );
    expect(standardSource).toContain(".fpb-mobile-summary-tray .fpb-dp-sidebar.fpb-dp-step_based");
    expect(standardSource).toContain("grid-template-rows:33.1953px 12px 51.1875px");
    expect(standardSource).toContain(".fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-title");
    expect(standardSource).toContain(".fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-subtitle");
    expect(css).toMatch(
      /\.fpb-mobile-bottom-sheet\.fpb-mobile-summary-tray \.side-panel-nav \{[^}]*display:grid;[^}]*height:58px;[^}]*margin:0;[^}]*padding:10px 0;[^}]*box-sizing:border-box/,
    );
    expect(css).toMatch(
      /\.fpb-mobile-bottom-sheet\.fpb-mobile-summary-tray \.side-panel-btn-next \{[^}]*display:grid;[^}]*grid-template-columns:max-content 5px max-content;[^}]*justify-content:center;[^}]*align-items:normal;[^}]*gap:8px;[^}]*width:360px;[^}]*height:38px;/,
    );
    expect(css).toMatch(
      /\.fpb-mobile-bottom-sheet\.fpb-mobile-summary-tray \.side-panel-btn-next \{[^}]*background:#000000;[^}]*color:#FFFFFF;[^}]*font-size:14px;[^}]*line-height:22px;/,
    );
  });

  it("uses measured selected Standard product card density with quantity badges", () => {
    const source = widgetSource();
    const css = `${widgetStyles()}\n${standardTemplateSource()}`;

    expect(source).toContain("resolveFullPageCardCtaMode");
    expect(source).toContain("fpbCardCtaMode");
    expect(css).toContain("data-fpb-design-preset=DEFAULT");
    expect(source).toContain("usesSelectedQuantityBadge()");
    expect(source).toContain("const renderSelectedQuantityBadge = currentQuantity > 0 && this.usesSelectedQuantityBadge();");
    expect(source).toContain("product-selected-action-row");
    expect(source).toContain("inline-quantity-display-only");
    expect(source).toContain("if (this.usesSelectedQuantityBadge()) {");
    expect(source).toContain("this.renderModalProducts(stepIndex);");
    expect(css).toContain('@media (max-width:767px)');
    expect(css).toMatch(
      /@media\(min-width:1024px\)\{[\s\S]*?\.layout-sidebar\[data-fpb-design-preset=DEFAULT\]\[data-fpb-card-cta-mode=icon\] \.sidebar-content \.full-page-product-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\);[^}]*gap:var\(--cg,15px\);/,
    );
    expect(css).toMatch(
      /@media\(min-width:1024px\)\{[\s\S]*?\.layout-sidebar\[data-fpb-design-preset=DEFAULT\]\[data-fpb-card-cta-mode=icon\] \.sidebar-content \.product-card\{[^}]*height:var\(--standard-card-height,352px\);[^}]*padding:8px;[^}]*border:0;[^}]*border-radius:10px;[^}]*box-shadow:none;/,
    );
    expect(css).toMatch(
      /@media\(min-width:1024px\)\{[\s\S]*?\.layout-sidebar\[data-fpb-design-preset=DEFAULT\]\[data-fpb-card-cta-mode=icon\] \.sidebar-content \.product-image\{[^}]*height:var\(--ih,240px\);/,
    );
    expect(css).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-image');
    expect(css).toContain('.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .product-add-btn::before');
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\] \.sidebar-content\{[^}]*padding:0 0 120px;?/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\]\[data-fpb-card-cta-mode=icon\] \.sidebar-content \.full-page-product-grid\{[^}]*gap:var\(--cg,15px\);[^}]*padding:0;?/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\]\[data-fpb-card-cta-mode=icon\] \.sidebar-content \.product-card\{[^}]*min-height:var\(--mh,264px\);[^}]*height:var\(--mh,264px\);[^}]*padding:8px;[^}]*border-radius:10px;/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\]\[data-fpb-card-cta-mode=icon\] \.sidebar-content \.product-image\{[^}]*height:var\(--mih,150px\);[^}]*width:100%;/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\]\[data-fpb-card-cta-mode=icon\] \.sidebar-content \.product-card-action\{[^}]*width:35px;[^}]*height:35px;/,
    );
    expect(source).toContain("product-selected-action-row");
    expect(source).toContain("inline-quantity-display-only");
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\]\[data-fpb-card-cta-mode=icon\] \.sidebar-content \.product-add-btn\{[^}]*width:35px;[^}]*height:35px;[^}]*font-size:0;/,
    );
  });

  it("uses measured Standard desktop side-panel density", () => {
    const css = standardTemplateSource();

    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\]\[data-fpb-card-cta-mode=icon\] \.full-page-side-panel,\s*\.layout-sidebar\[data-fpb-design-preset=DEFAULT\] \.full-page-side-panel\{[^}]*border:1px solid #e3e3e3;[^}]*border-radius:10px;[^}]*grid-template-columns:324\.266px;[^}]*min-height:639\.766px;[^}]*height:639\.766px;[^}]*top:80px/,
    );
  });

  it("uses reference-style category pill tabs for fixed-amount Standard storefronts", () => {
    const css = standardTemplateSource();

    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\] \.category-tabs\{[^}]*grid-auto-flow:column;[^}]*gap:20px;[^}]*margin:0 0 20px;[^}]*padding:0;?/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\] \.category-tab\{[^}]*height:50\.8px;[^}]*padding:10px;[^}]*border:0;[^}]*background:transparent;[^}]*border-radius:0;/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\] \.category-tab::after\{[^}]*display:none;?/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset=DEFAULT\] \.fpb-category-section-row\{[^}]*height:68\.8px;[^}]*padding:14px 0;[^}]*background:transparent;[^}]*border-radius:0;/,
    );
    expect(css).toMatch(
      /@media\(max-width:767px\)\{[\s\S]*?\.layout-sidebar\[data-fpb-design-preset=DEFAULT\] \.category-tabs\{[^}]*height:49px;[^}]*gap:20px;[^}]*margin:0 0 16px/,
    );
  });
});
