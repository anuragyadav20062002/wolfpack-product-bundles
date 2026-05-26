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

    expect(source).toContain('_renderDiscountProgress({ placement: "sidebar" })');
    expect(source).toContain("fpb-discount-step-subtitle-list");
    expect(source).toContain('placement === "sidebar"');
    expect(css).toContain(".fpb-discount-progress.fpb-dp-sidebar");
    expect(css).toContain(".fpb-dp-sidebar .fpb-discount-step-subtitle-list");
    expect(css).toContain(".fpb-dp-sidebar .fpb-discount-step:only-child");
    expect(css).toContain("background:transparent");
    expect(css).toContain(".layout-sidebar .side-panel-discount-message");
    expect(css).toContain(".fpb-mobile-bottom-sheet .side-panel-discount-message");
    expect(css).toContain(".fpb-dp-sidebar .fpb-dp-track");
    expect(css).toMatch(
      /\.layout-sidebar \.side-panel-discount-message,\s*\.fpb-mobile-bottom-sheet \.side-panel-discount-message \{[^}]*color:#111111;/,
    );
    expect(css).toMatch(
      /\.fpb-dp-sidebar \.fpb-dp-track \{[^}]*background:#B7E5BD;/,
    );
  });

  it("renders the Standard mobile side-footer summary as a measured sticky footer", () => {
    const source = widgetSource();
    const css = widgetStyles();

    expect(source).toContain("usesCompactMobileSummaryTray");
    expect(source).toContain("fpb-mobile-summary-tray");
    expect(source).toContain("_populateCompactMobileSummaryTray(sheet);");
    expect(source).toContain("fpb-mobile-summary-count-badge");
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
    expect(css).toMatch(
      /\.fpb-mobile-bottom-sheet\.fpb-mobile-summary-tray \.side-panel-discount-message \{[^}]*margin:0;[^}]*padding:5px 0 0;[^}]*font-size:15px;[^}]*font-weight:400;[^}]*line-height:27px;/,
    );
    expect(css).toMatch(
      /\.fpb-mobile-summary-tray \.fpb-discount-progress\.fpb-dp-sidebar \{[^}]*width:310px;[^}]*height:96px;[^}]*margin:0;/,
    );
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
    const css = widgetStyles();

    expect(source).toContain("resolveFullPageCardCtaMode");
    expect(source).toContain("fpbCardCtaMode");
    expect(source).toContain("fixed_amount_off");
    expect(source).toContain("usesSelectedQuantityBadge()");
    expect(source).toContain("const renderSelectedQuantityBadge = currentQuantity > 0 && this.usesSelectedQuantityBadge();");
    expect(source).toContain("product-selected-action-row");
    expect(source).toContain("inline-quantity-display-only");
    expect(source).toContain("if (this.usesSelectedQuantityBadge()) {");
    expect(source).toContain("this.renderModalProducts(stepIndex);");
    expect(css).toContain('@media (max-width:767px)');
    expect(css).toMatch(
      /@media \(min-width:1024px\) \{[\s\S]*?\.layout-sidebar\[data-fpb-design-preset="DEFAULT"\]\[data-fpb-card-cta-mode="icon"\] \.sidebar-content \.full-page-product-grid \{[^}]*grid-template-columns:repeat\(4,\s*182px\);[^}]*gap:15px;[^}]*justify-content:flex-start;/,
    );
    expect(css).toMatch(
      /@media \(min-width:1024px\) \{[\s\S]*?\.layout-sidebar\[data-fpb-design-preset="DEFAULT"\]\[data-fpb-card-cta-mode="icon"\] \.sidebar-content \.product-card \{[^}]*width:182px;[^}]*height:286px;[^}]*padding:8px;[^}]*border:0;[^}]*border-radius:10px;[^}]*box-shadow:none;/,
    );
    expect(css).toMatch(
      /@media \(min-width:1024px\) \{[\s\S]*?\.layout-sidebar\[data-fpb-design-preset="DEFAULT"\]\[data-fpb-card-cta-mode="icon"\] \.sidebar-content \.product-image \{[^}]*width:166px;[^}]*height:166px;/,
    );
    expect(css).toContain('.layout-sidebar[data-fpb-design-preset="DEFAULT"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-image');
    expect(css).toContain('.layout-sidebar[data-fpb-design-preset="DEFAULT"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-add-btn::before');
    expect(css).toMatch(
      /\.layout-sidebar \.sidebar-layout-wrapper \.sidebar-content \{[^}]*padding:20px 2px 120px;?/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset="DEFAULT"\]\[data-fpb-card-cta-mode="icon"\] \.sidebar-content \.full-page-product-grid \{[^}]*gap:15px;[^}]*padding:0;?/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset="DEFAULT"\]\[data-fpb-card-cta-mode="icon"\] \.sidebar-content \.product-card \{[^}]*min-height:263px;[^}]*height:263px;[^}]*padding:8px;[^}]*border-radius:10px;/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset="DEFAULT"\]\[data-fpb-card-cta-mode="icon"\] \.sidebar-content \.product-image \{[^}]*width:100%;[^}]*height:150px;/,
    );
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset="DEFAULT"\]\[data-fpb-card-cta-mode="icon"\] \.sidebar-content \.product-card-action \{[^}]*position:absolute;[^}]*width:28px;[^}]*height:28px;/,
    );
    expect(css).toContain(".product-selected-action-row");
    expect(css).toContain(".inline-quantity-display-only");
    expect(css).toMatch(
      /\.layout-sidebar\[data-fpb-design-preset="DEFAULT"\]\[data-fpb-card-cta-mode="icon"\] \.sidebar-content \.product-add-btn \{[^}]*width:28px;[^}]*height:28px;[^}]*font-size:0;/,
    );
  });

  it("uses measured Standard desktop side-panel density", () => {
    const css = widgetStyles();

    expect(css).toMatch(
      /@media \(min-width:1024px\) \{[\s\S]*?\.layout-sidebar\[data-fpb-design-preset="DEFAULT"\]\[data-fpb-card-cta-mode="icon"\] \.full-page-side-panel \{[^}]*width:366px;[^}]*flex:0 0 366px;[^}]*min-height:681px;[^}]*margin-top:115px;[^}]*border:0;[^}]*border-radius:10px;[^}]*padding:20px;[^}]*gap:5px;[^}]*grid-template-columns:326px/,
    );
  });

  it("uses reference-style category pill tabs for fixed-amount Standard storefronts", () => {
    const css = widgetStyles();

    expect(css).toMatch(
      /\.category-tabs \{[^}]*gap:8px;[^}]*margin:20px auto 20px;[^}]*padding:0;?/,
    );
    expect(css).toMatch(
      /\.category-tab \{[^}]*padding:4px 14px;[^}]*min-width:auto;[^}]*border:2px solid #000000;[^}]*border-radius:99px;/,
    );
    expect(css).toMatch(
      /\.category-tab \{[^}]*background:#FFFFFF;[^}]*text-transform:none;[^}]*box-shadow:none;?/,
    );
    expect(css).toMatch(
      /\.category-tab\.active \{[^}]*background:#000000;[^}]*color:#F6F6F6;[^}]*box-shadow:none;?/,
    );
    expect(css).toMatch(
      /@media \(max-width:768px\) \{[\s\S]*?\.category-tabs \{[^}]*justify-content:flex-start;[^}]*flex-wrap:nowrap;[^}]*gap:8px;/,
    );
  });
});
