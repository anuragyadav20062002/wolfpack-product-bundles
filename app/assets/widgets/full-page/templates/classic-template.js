export function installClassicTemplate(BundleWidgetFullPage) {
  const prototype = BundleWidgetFullPage.prototype;

  prototype.ensureClassicPresetRuntimeStyles = function() {
    if (this.getFullPageDesignPreset() !== 'CLASSIC') return;
    if (document.getElementById('wpb-fpb-classic-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'wpb-fpb-classic-runtime-styles';

    const baseStyles = `
      [data-bundle-type="full_page"][data-fpb-design-preset="CLASSIC"] {
        width: min(100vw, 1536px);
        max-width: 1536px;
        margin-left: calc(50% - min(50vw, 768px));
        padding: 10px;
        box-sizing: border-box;
        background: var(--bundle-full-page-bg-color);
      }

      [data-fpb-design-preset="CLASSIC"] {
        --classic-grid-gap: 15px;
        --classic-card-radius: 10px;
        --classic-card-padding: 8px;
        --classic-card-gap: 8px;

        --classic-desktop-card-image-extra: 12px;
        --classic-desktop-icon-card-extra: 104px;
        --classic-desktop-text-card-extra: 152px;

        --classic-mobile-card-width: 177.5px;
        --classic-mobile-icon-card-height: 263px;
        --classic-mobile-text-card-height: 300px;
        --classic-mobile-image-height: 150px;

        --classic-icon-button-size: 35px;
        --classic-text-button-height: 38px;
        --classic-sidebar-slot-size: 75px;
      }
    `;

    const desktopStyles = `
      @media (min-width: 1024px) {
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-layout-wrapper {
          display: grid;
          grid-template-columns: 0.6897fr 0.3103fr;
          gap: var(--classic-grid-gap);
          max-width: 1455px;
          padding: 0;
          align-items: start;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content {
          padding: 0 0 120px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .bundle-banners {
          width: 100%;
          margin: 0 0 18px;
          border-radius: var(--bundle-promo-banner-radius);
          overflow: hidden;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .bundle-banner-image {
          display: block;
          width: 100%;
          height: auto;
          object-fit: cover;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-step-category-title {
          font-size: 16px;
          line-height: 29px;
          margin: 0 0 10px;
          color: var(--bundle-full-page-title-color, currentColor);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .category-tabs {
          display: flex;
          justify-content: center;
          gap: 8px;
          height: 40.8px;
          margin: 0 0 20px;
          padding: 0;
          overflow: visible;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .category-tab {
          height: 40.8px;
          display: grid;
          align-items: center;
          padding: 4px 22px;
          border-radius: 99px;
          border-color: var(--bundle-tabs-border-color, var(--bundle-global-primary-button, currentColor));
          background: var(--bundle-tabs-inactive-bg-color, var(--bundle-full-page-bg-color));
          color: var(--bundle-tabs-inactive-text-color, var(--bundle-global-primary-text, currentColor));
          font-size: 16px;
          line-height: 28.8px;
          font-weight: 700;
          box-shadow: none;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .category-tab.active {
          background: var(--bundle-tabs-active-bg-color, var(--bundle-global-primary-button, currentColor));
          color: var(--bundle-tabs-active-text-color, var(--bundle-button-text-color, var(--bundle-full-page-bg-color)));
          border-color: var(--bundle-tabs-active-bg-color, var(--bundle-global-primary-button, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .category-tab::after,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .category-tab .tab-indicator {
          display: none;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .full-page-product-grid-container {
          width: 95%;
          max-width: none;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .full-page-product-grid {
          container-type: inline-size;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--classic-grid-gap);
          margin: 0 0 20px;
          padding: 0;
          overflow: visible;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-card {
          width: 100%;
          min-width: 0;
          max-width: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: var(--classic-card-gap);
          padding: var(--classic-card-padding);
          border-radius: var(--classic-card-radius);
          border: 1px solid var(--bundle-product-card-border-color, var(--bundle-side-panel-product-border, currentColor));
          box-shadow: none;
          background: var(--bundle-product-card-bg, var(--bundle-side-panel-product-bg, var(--bundle-full-page-bg-color)));
          color: var(--bundle-product-card-font-color, var(--bundle-global-primary-text, currentColor));
          overflow: hidden;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-card.selected {
          border-color: var(--bundle-product-card-selected-border-color, var(--bundle-global-primary-button, currentColor));
          box-shadow: none;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .selected-overlay {
          display: none !important;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-image {
          width: 100%;
          min-width: 0;
          aspect-ratio: auto;
          margin: 0;
          border-radius: var(--bundle-full-page-product-image-border-radius, calc(var(--classic-card-radius) - 2px));
          border: 0;
          background: var(--bundle-full-page-product-image-bg, var(--bundle-product-card-bg, var(--bundle-full-page-bg-color)));
          overflow: hidden;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-image img {
          width: 100%;
          height: 100%;
          object-fit: var(--bundle-product-card-image-fit, contain);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-content-wrapper {
          width: 100%;
          min-width: 0;
          padding: 0;
          overflow: hidden;
          align-items: start;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-title {
          width: 100%;
          margin: 0;
          padding: 0;
          color: var(--bundle-product-card-font-color, var(--bundle-global-primary-text, currentColor));
          font-size: 16px !important;
          line-height: 22px !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
          overflow: hidden;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-price-row {
          width: 100%;
          height: 35px;
          min-height: 35px;
          margin: 0;
          display: flex;
          flex-direction: row;
          gap: 5px;
          align-items: center;
          overflow: hidden;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-price {
          color: var(--bundle-product-final-price-color, var(--bundle-global-primary-text, currentColor));
          font-size: 16px !important;
          font-weight: 700 !important;
          line-height: 35px !important;
          letter-spacing: 0 !important;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-price-strike {
          color: var(--bundle-product-strike-price-color, var(--bundle-side-panel-text-color, currentColor));
          font-size: 14px !important;
          line-height: 35px !important;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-variant-badge,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-spacer,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-quantity-wrapper {
          display: none !important;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-add-btn {
          box-shadow: none;
          background: var(--bundle-add-btn-color, var(--bundle-global-primary-button, currentColor));
          color: var(--bundle-button-text-color, var(--bundle-global-button-text, var(--bundle-full-page-bg-color)));
          border: 0;
          font-family: inherit;
          cursor: pointer;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .inline-quantity-controls {
          box-shadow: none;
          background: transparent;
          overflow: visible;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .inline-qty-btn {
          background: var(--bundle-inline-qty-bg, var(--bundle-add-btn-color, var(--bundle-global-primary-button, currentColor)));
          color: var(--bundle-inline-qty-text, var(--bundle-button-text-color, var(--bundle-full-page-bg-color)));
          border: 0;
          box-shadow: none;
          font-family: inherit;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .inline-qty-display,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .inline-quantity-display-only {
          color: var(--bundle-product-card-font-color, var(--bundle-global-primary-text, currentColor));
          font-family: inherit;
          font-weight: 700;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-card {
          height: calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 + var(--classic-desktop-icon-card-extra));
          min-height: calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 + var(--classic-desktop-icon-card-extra));
          grid-template-rows:
            calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 - var(--classic-desktop-card-image-extra))
            92px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-image {
          height: calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 - var(--classic-desktop-card-image-extra));
          min-height: calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 - var(--classic-desktop-card-image-extra));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-content-wrapper {
          display: grid;
          grid-template-columns: minmax(0, 1fr) var(--classic-icon-button-size);
          grid-template-rows: 49px var(--classic-icon-button-size);
          gap: 8px 5px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-title {
          grid-row: 1;
          grid-column: 1 / -1;
          height: 49px;
          min-height: 49px;
          text-align: left;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-price-row {
          grid-row: 2;
          grid-column: 1;
          justify-content: flex-start;
          text-align: left;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-card-action {
          grid-row: 2;
          grid-column: 2;
          width: var(--classic-icon-button-size);
          height: var(--classic-icon-button-size);
          min-height: var(--classic-icon-button-size);
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: start;
          justify-self: end;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-add-btn {
          width: var(--classic-icon-button-size);
          min-width: var(--classic-icon-button-size);
          height: var(--classic-icon-button-size);
          padding: 0;
          border-radius: var(--bundle-add-btn-radius, 5px);
          font-size: 0;
          line-height: 1;
          align-self: center;
          justify-self: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-add-btn::before {
          content: "+";
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-add-btn.added::before {
          content: "✓";
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-card-action.has-selected-quantity-badge {
          grid-column: 1 / -1;
          width: 100%;
          justify-self: stretch;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-selected-action-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) var(--classic-icon-button-size);
          gap: 5px;
          align-items: center;
          width: 100%;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .inline-quantity-display-only {
          display: grid;
          place-items: center;
          width: var(--classic-icon-button-size);
          height: var(--classic-icon-button-size);
          border-radius: var(--bundle-add-btn-radius, 5px);
          background: var(--bundle-add-btn-color, var(--bundle-global-primary-button, currentColor));
          color: var(--bundle-button-text-color, var(--bundle-full-page-bg-color));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-card {
          height: calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 + var(--classic-desktop-text-card-extra));
          min-height: calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 + var(--classic-desktop-text-card-extra));
          grid-template-rows:
            calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 - var(--classic-desktop-card-image-extra))
            138px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-image {
          height: calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 - var(--classic-desktop-card-image-extra));
          min-height: calc((100cqw - (var(--classic-grid-gap) * 3)) / 4 - var(--classic-desktop-card-image-extra));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-content-wrapper {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: 49px 35px var(--classic-text-button-height);
          gap: 8px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-title {
          grid-row: 1;
          height: 49px;
          min-height: 49px;
          text-align: center;
          align-content: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-price-row {
          grid-row: 2;
          justify-content: center;
          text-align: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-card-action {
          grid-row: 3;
          width: 100%;
          height: var(--classic-text-button-height);
          min-height: var(--classic-text-button-height);
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-add-btn {
          width: 100%;
          height: var(--classic-text-button-height);
          min-width: 0;
          padding: 0 16px;
          border-radius: var(--bundle-button-border-radius, 99px);
          font-size: 16px;
          line-height: var(--classic-text-button-height);
          font-weight: 700;
          text-align: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .inline-quantity-controls {
          width: 100%;
          height: var(--classic-text-button-height);
          border-radius: 0;
          display: grid;
          grid-template-columns: var(--classic-text-button-height) minmax(0, 1fr) var(--classic-text-button-height);
          gap: 8px;
          align-items: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .inline-qty-btn {
          width: var(--classic-text-button-height);
          height: var(--classic-text-button-height);
          border-radius: var(--bundle-add-btn-radius, 5px);
          font-size: 22px;
          line-height: 1;
          font-weight: 700;
          padding: 0;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .inline-qty-display {
          min-width: 0;
          padding: 0;
          font-size: 18px;
          line-height: var(--classic-text-button-height);
          text-align: center;
        }
      }
    `;

    const sidebarStyles = `
      @media (min-width: 1024px) {
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .full-page-side-panel {
          width: 100%;
          flex: initial;
          min-height: 609px;
          height: auto;
          max-height: none;
          margin-top: 0;
          padding: 20px;
          border: 1px solid var(--bundle-side-panel-border, currentColor);
          border-radius: var(--bundle-side-panel-btn-radius, 10px);
          background: var(--bundle-side-panel-bg, var(--bundle-full-page-bg-color));
          color: var(--bundle-side-panel-text-color, var(--bundle-global-primary-text, currentColor));
          top: 80px;
          box-sizing: border-box;
          box-shadow: none;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto;
          gap: 8px;
          margin: 0;
          align-items: start;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-header-copy {
          display: grid;
          grid-template-rows: auto auto;
          gap: 5px;
          min-width: 0;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-title {
          font-size: 20px;
          line-height: 30px;
          font-weight: 700;
          color: var(--bundle-side-panel-title-color, var(--bundle-global-primary-text, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-subtitle {
          font-size: 14px;
          line-height: 20px;
          margin: 0;
          color: var(--bundle-side-panel-text-color, var(--bundle-global-primary-text, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-clear-btn {
          display: grid;
          grid-template-columns: 22px max-content;
          grid-template-rows: 25.1875px;
          gap: 4px;
          min-width: 82.9375px;
          height: 35.1875px;
          padding: 5px 14px;
          border: 0;
          border-radius: var(--bundle-side-panel-btn-radius, 5px);
          background: var(--bundle-side-panel-clear-bg, color-mix(in srgb, var(--bundle-side-panel-clear-color, var(--bundle-global-primary-button, currentColor)) 12%, transparent));
          color: var(--bundle-side-panel-clear-color, var(--bundle-global-primary-button, currentColor));
          align-items: center;
          justify-content: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-box-selection-wrapper {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin: 16px 0 20px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-box-selection-option {
          min-height: 62px;
          border: 1px solid var(--bundle-sidebar-button-bg, var(--bundle-global-primary-button, currentColor));
          border-radius: var(--bundle-side-panel-btn-radius, 6px);
          background: var(--bundle-side-panel-product-bg, var(--bundle-full-page-bg-color));
          color: var(--bundle-sidebar-button-bg, var(--bundle-global-primary-button, currentColor));
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 4px;
          padding: 8px;
          text-align: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-box-selection-option-active {
          background: var(--bundle-sidebar-button-bg, var(--bundle-global-primary-button, currentColor));
          color: var(--bundle-sidebar-button-text, var(--bundle-button-text-color, var(--bundle-full-page-bg-color)));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-box-selection-title {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-box-selection-subtext {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.2;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-discount-message {
          margin: 0;
          padding: 5px 0 0;
          background: transparent;
          color: var(--bundle-side-panel-discount-color, var(--bundle-global-primary-text, currentColor));
          font-size: 16px;
          font-weight: 700;
          line-height: 28.8px;
          text-align: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-discount-progress.fpb-dp-sidebar {
          margin: 8px 0 0;
          padding: 0;
          background: transparent;
          color: var(--bundle-side-panel-text-color, currentColor);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-dp-sidebar .fpb-dp-track {
          height: 8px;
          background: var(--fpb-discount-track-empty, var(--bundle-side-panel-product-border, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-dp-sidebar .fpb-dp-fill {
          background: var(--fpb-discount-track-filled, var(--bundle-global-primary-button, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-item-count {
          font-size: 16px;
          font-weight: 400;
          line-height: 28.8px;
          color: var(--bundle-side-panel-text-color, var(--bundle-global-primary-text, currentColor));
          margin: 18px 0 10px;
          padding: 0;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .classic-sidebar-slots {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 10px 0 34px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .classic-sidebar-slot {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: var(--bundle-side-panel-btn-radius, 5px);
          display: grid;
          place-items: center;
          background: var(--bundle-side-panel-product-bg, var(--bundle-full-page-bg-color));
          color: var(--bundle-side-panel-product-title-color, var(--bundle-global-primary-text, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .classic-sidebar-slot--filled {
          border: 1px solid var(--bundle-side-panel-product-border, currentColor);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .classic-sidebar-slot--filled img {
          width: 100%;
          height: 100%;
          object-fit: var(--bundle-product-card-image-fit, contain);
          padding: 6px;
          box-sizing: border-box;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .classic-sidebar-slot--empty {
          border: 1.5px dashed var(--bundle-global-primary-button, currentColor);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .classic-sidebar-slot--empty span {
          color: var(--bundle-global-primary-text, currentColor);
          font-size: 32px;
          line-height: 1;
          font-weight: 700;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .classic-sidebar-slot-remove {
          position: absolute;
          top: -9px;
          right: -9px;
          width: 22px;
          height: 22px;
          border: 0;
          border-radius: 50%;
          padding: 0;
          display: grid;
          place-items: center;
          background: var(--bundle-side-panel-remove-hover, var(--bundle-side-panel-remove-color, currentColor));
          color: var(--bundle-button-text-color, var(--bundle-full-page-bg-color));
          font-size: 16px;
          line-height: 1;
          font-weight: 700;
          cursor: pointer;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-products {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 15px;
          width: 100%;
          max-height: 260px;
          padding: 0 10px 0 0;
          margin: 10px 0 24px;
          overflow: hidden;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-product-row {
          display: grid;
          grid-template-columns: var(--classic-sidebar-slot-size) minmax(0, 1fr) 62.9375px;
          grid-template-rows: var(--classic-sidebar-slot-size);
          gap: 9px;
          padding: 0;
          border: 0;
          background: transparent;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-product-img-wrap,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-product-img {
          width: var(--classic-sidebar-slot-size);
          height: var(--classic-sidebar-slot-size);
          border-radius: var(--bundle-side-panel-btn-radius, 5px);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-product-img {
          object-fit: var(--bundle-product-card-image-fit, cover);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-product-info {
          display: grid;
          grid-template-rows: 20px 28.8px;
          gap: 0;
          align-self: start;
          min-width: 0;
          height: var(--classic-sidebar-slot-size);
          overflow: hidden;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-product-title {
          display: block;
          width: 100%;
          height: 20px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--bundle-side-panel-product-title-color, var(--bundle-global-primary-text, currentColor));
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-product-price {
          display: block;
          color: var(--bundle-side-panel-product-price-color, var(--bundle-global-primary-text, currentColor));
          font-size: 16px;
          font-weight: 700;
          line-height: 28.8px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-product-action {
          display: grid;
          place-items: center;
          width: 62.9375px;
          height: var(--classic-sidebar-slot-size);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-product-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--bundle-side-panel-remove-color, var(--bundle-global-primary-text, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-skeleton-slot {
          display: grid;
          grid-template-columns: var(--classic-sidebar-slot-size) minmax(0, 1fr) 50.6094px;
          grid-template-rows: var(--classic-sidebar-slot-size);
          gap: 10px;
          height: var(--classic-sidebar-slot-size);
          animation: none;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-skeleton-thumb {
          width: var(--classic-sidebar-slot-size);
          height: var(--classic-sidebar-slot-size);
          border: 1.5px dashed currentColor;
          border-radius: var(--bundle-side-panel-btn-radius, 5px);
          background: transparent;
          color: var(--bundle-side-panel-next-bg, var(--bundle-global-primary-button, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-skeleton-lines {
          height: 48px;
          gap: 5px;
          align-self: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-skeleton-line,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-skeleton-remove {
          background: var(--bundle-skeleton-base-bg, currentColor);
          border-radius: var(--bundle-side-panel-btn-radius, 10px);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-skeleton-slot .line-name {
          width: 134.922px;
          height: 14px;
          padding: 7px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-skeleton-slot .line-variant {
          width: 101.188px;
          height: 12px;
          padding: 6px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-skeleton-slot .line-price {
          width: 42.1562px;
          height: 12px;
          padding: 6px;
          flex: initial;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-skeleton-remove {
          width: 50.6094px;
          height: 20px;
          padding: 10px;
          align-self: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-action-container {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 181.969px;
          grid-template-rows: auto;
          gap: 12px;
          margin: 10px 0 0;
          padding: 15px 0 0;
          border-top: 1px solid var(--bundle-side-panel-divider-color, var(--bundle-side-panel-border, currentColor));
          align-items: end;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-total {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: auto auto;
          gap: 8px;
          align-items: center;
          justify-content: start;
          padding: 0;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-total-label {
          font-size: 14px;
          font-weight: 700;
          line-height: normal;
          color: var(--bundle-side-panel-total-label-color, var(--bundle-global-primary-text, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-total-prices {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-total-original {
          color: var(--bundle-side-panel-total-original-color, var(--bundle-side-panel-text-color, currentColor));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-total-final {
          color: var(--bundle-side-panel-total-final-color, var(--bundle-global-primary-text, currentColor));
          font-size: 16px;
          font-weight: 700;
          line-height: 18px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-nav {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: 44px;
          gap: 5px;
          margin: 0;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-btn-next {
          width: 100%;
          min-width: 0;
          height: 41px;
          padding: 8px;
          border: 0;
          border-radius: var(--bundle-side-panel-btn-radius, 5px);
          background: var(--bundle-side-panel-next-bg, var(--bundle-global-primary-button, currentColor));
          color: var(--bundle-side-panel-next-color, var(--bundle-button-text-color, var(--bundle-full-page-bg-color)));
          font-size: 16px;
          font-weight: 700;
          line-height: 25px;
          opacity: 1;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-btn-next:disabled {
          opacity: 1;
          cursor: pointer;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .fpb-sidebar-tier-cta,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-free-gift,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .side-panel-addon-message {
          display: none !important;
        }
      }
    `;

    const mobileStyles = `
      @media (max-width: 767px) {
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] > :is(.bundle-banners, .category-tabs, .sidebar-layout-wrapper) {
          width: 100%;
          margin-left: 0;
          margin-right: 0;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-layout-wrapper .sidebar-content {
          padding: 0 0 120px !important;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .full-page-product-grid-container {
          width: 100%;
          max-width: none;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .full-page-product-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, var(--classic-mobile-card-width)));
          gap: var(--classic-grid-gap);
          justify-content: center;
          margin: 0 0 20px;
          padding: 0;
          overflow: visible;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-card {
          width: var(--classic-mobile-card-width);
          min-width: 0;
          max-width: var(--classic-mobile-card-width);
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: var(--classic-card-gap);
          padding: var(--classic-card-padding);
          border: 1px solid var(--bundle-product-card-border-color, var(--bundle-side-panel-product-border, currentColor));
          border-radius: var(--classic-card-radius);
          box-shadow: none;
          background: var(--bundle-product-card-bg, var(--bundle-full-page-bg-color));
          color: var(--bundle-product-card-font-color, var(--bundle-global-primary-text, currentColor));
          overflow: visible;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-card.selected {
          border-color: var(--bundle-product-card-selected-border-color, var(--bundle-global-primary-button, currentColor));
          box-shadow: none;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .selected-overlay {
          display: none !important;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-image {
          width: 100%;
          min-width: 0;
          height: var(--classic-mobile-image-height);
          min-height: var(--classic-mobile-image-height);
          aspect-ratio: auto;
          margin: 0;
          border-radius: var(--bundle-full-page-product-image-border-radius, calc(var(--classic-card-radius) - 2px));
          border: 0;
          background: var(--bundle-full-page-product-image-bg, var(--bundle-product-card-bg, var(--bundle-full-page-bg-color)));
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-image img {
          width: 100%;
          height: 100%;
          object-fit: var(--bundle-product-card-image-fit, contain);
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-content-wrapper {
          width: 100%;
          min-width: 0;
          padding: 0;
          overflow: hidden;
          align-items: start;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-title {
          width: 100%;
          margin: 0;
          padding: 0;
          color: var(--bundle-product-card-font-color, var(--bundle-global-primary-text, currentColor));
          font-size: 12px !important;
          line-height: normal !important;
          font-weight: 400 !important;
          letter-spacing: 0 !important;
          overflow: visible;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-price-row {
          width: 100%;
          height: 35px;
          min-height: 35px;
          margin: 0;
          display: flex;
          flex-direction: row;
          gap: 5px;
          align-items: center;
          overflow: hidden;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-price {
          color: var(--bundle-product-final-price-color, var(--bundle-global-primary-text, currentColor));
          font-size: 14px !important;
          font-weight: 700 !important;
          line-height: 35px !important;
          letter-spacing: 0 !important;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-price-strike {
          color: var(--bundle-product-strike-price-color, var(--bundle-side-panel-text-color, currentColor));
          font-size: 12px !important;
          line-height: 35px !important;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-variant-badge,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-spacer,
        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-quantity-wrapper {
          display: none !important;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"] .sidebar-content .product-add-btn {
          box-shadow: none;
          background: var(--bundle-add-btn-color, var(--bundle-global-primary-button, currentColor));
          color: var(--bundle-button-text-color, var(--bundle-full-page-bg-color));
          border: 0;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-card {
          height: var(--classic-mobile-icon-card-height);
          min-height: var(--classic-mobile-icon-card-height);
          grid-template-rows: var(--classic-mobile-image-height) 89px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-content-wrapper {
          display: grid;
          grid-template-columns: minmax(0, 1fr) var(--classic-icon-button-size);
          grid-template-rows: 41px var(--classic-icon-button-size);
          gap: 8px 5px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-title {
          grid-row: 1;
          grid-column: 1 / -1;
          height: 41px;
          min-height: 41px;
          text-align: left;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-price-row {
          grid-row: 2;
          grid-column: 1;
          justify-content: flex-start;
          text-align: left;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-card-action {
          grid-row: 2;
          grid-column: 2;
          position: static;
          right: auto;
          bottom: auto;
          width: var(--classic-icon-button-size);
          height: var(--classic-icon-button-size);
          min-height: var(--classic-icon-button-size);
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: start;
          justify-self: end;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .sidebar-content .product-add-btn {
          width: var(--classic-icon-button-size);
          min-width: var(--classic-icon-button-size);
          height: var(--classic-icon-button-size);
          padding: 0;
          border-radius: var(--bundle-add-btn-radius, 5px);
          font-size: 0;
          line-height: 1;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .product-add-btn::before {
          content: "+";
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="icon"] .product-add-btn.added::before {
          content: "✓";
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-card {
          height: var(--classic-mobile-text-card-height);
          min-height: var(--classic-mobile-text-card-height);
          grid-template-rows: var(--classic-mobile-image-height) 126px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-content-wrapper {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: 41px 35px var(--classic-text-button-height);
          gap: 8px;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-title {
          grid-row: 1;
          height: 41px;
          min-height: 41px;
          text-align: center;
          align-content: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-price-row {
          grid-row: 2;
          justify-content: center;
          text-align: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-card-action {
          grid-row: 3;
          width: 100%;
          height: var(--classic-text-button-height);
          min-height: var(--classic-text-button-height);
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .product-add-btn {
          width: 100%;
          min-width: 0;
          height: var(--classic-text-button-height);
          padding: 0 14px;
          border-radius: var(--bundle-button-border-radius, 99px);
          font-size: 14px;
          line-height: var(--classic-text-button-height);
          font-weight: 700;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .inline-quantity-controls {
          width: 100%;
          height: var(--classic-text-button-height);
          background: transparent;
          box-shadow: none;
          border-radius: 0;
          display: grid;
          grid-template-columns: var(--classic-text-button-height) minmax(0, 1fr) var(--classic-text-button-height);
          gap: 8px;
          align-items: center;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .inline-qty-btn {
          width: var(--classic-text-button-height);
          height: var(--classic-text-button-height);
          border-radius: var(--bundle-add-btn-radius, 5px);
          background: var(--bundle-inline-qty-bg, var(--bundle-add-btn-color, var(--bundle-global-primary-button, currentColor)));
          color: var(--bundle-inline-qty-text, var(--bundle-button-text-color, var(--bundle-full-page-bg-color)));
          border: 0;
          font-size: 22px;
          line-height: 1;
          font-weight: 700;
          padding: 0;
        }

        .layout-sidebar[data-fpb-design-preset="CLASSIC"][data-fpb-card-cta-mode="text"] .sidebar-content .inline-qty-display {
          color: var(--bundle-product-card-font-color, var(--bundle-global-primary-text, currentColor));
          min-width: 0;
          padding: 0;
          font-size: 18px;
          line-height: var(--classic-text-button-height);
          text-align: center;
          font-weight: 700;
        }

        .fpb-mobile-summary-tray.fpb-mobile-classic-footer.fpb-mobile-summary-tray-expanded {
          grid-template-rows: 126.5625px 234.906px;
          height: 361.46875px;
        }

        .fpb-mobile-classic-footer .fpb-mobile-summary-products-section {
          display: grid;
          position: relative;
          grid-template-columns: 360px;
          grid-template-rows: 168.906px 38px;
          width: 360px;
          height: 234.906px;
          padding: 10px 0;
          gap: 8px;
          background: var(--bundle-side-panel-bg, var(--bundle-full-page-bg-color));
          box-sizing: border-box;
        }

        .fpb-mobile-classic-footer .fpb-mobile-summary-bundle-items {
          display: grid;
          grid-template-columns: 360px;
          grid-template-rows: 54px 104.906px;
          width: 360px;
          height: 168.906px;
        }

        .fpb-mobile-classic-footer .fpb-mobile-summary-products-list {
          display: grid;
          grid-template-columns: 360px;
          grid-template-rows: 65px 65px;
          gap: 10px;
          width: 360px;
          height: 104.906px;
          padding: 5px 0 0;
          overflow: auto;
          box-sizing: border-box;
        }

        .fpb-mobile-classic-footer .fpb-mobile-summary-empty-product-card {
          display: grid;
          grid-template-columns: 65px 211.531px 63.4688px;
          grid-template-rows: 65px;
          gap: 10px;
          width: 360px;
          height: 65px;
        }
      }
    `;

    style.textContent = baseStyles + desktopStyles + sidebarStyles + mobileStyles;
    document.head.appendChild(style);
  };
}