/**
 * Unit Tests — bundle-widget-product-page.js initialization guard
 *
 * Tests the two changes made to fix "Bundle Widget Error" on non-bundle PDPs:
 *  1. loadBundleData() hides the container and returns early instead of throwing
 *     when no valid bundle config is found.
 *  2. init() guards on !this.bundleData immediately after loadBundleData() returns.
 *
 * Pattern: extract the pure decision logic from the widget and test it in isolation,
 * matching the existing bundle-bottom-sheet.test.ts approach.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readProductPageStyles() {
  return [
    'app/assets/widgets/product-page-css/bundle-widget.css',
    'app/assets/widgets/product-page-css/templates/inpage-cascade.css',
    'app/assets/widgets/product-page-css/templates/inpage-cognive.css',
    'app/assets/widgets/product-page-css/templates/modal-slots.css',
  ]
    .map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8'))
    .join('\n');
}

// ============================================================
// Types mirroring bundle-widget-product-page.js
// ============================================================

interface MockDataset {
  bundleConfig?: string;
  bundleId?: string;
  initialized?: string;
  [key: string]: string | undefined;
}

interface ParseResult {
  /** null → no valid bundle found; object → keyed by bundle id */
  bundleData: Record<string, any> | null;
  /** true → hide container; false → proceed with init */
  shouldHide: boolean;
  /** true → show theme-editor preview instead of hiding */
  isThemeEditor: boolean;
}

// ============================================================
// Pure logic extracted from loadBundleData()
// (must stay in sync with app/assets/bundle-widget-product-page.js)
// ============================================================

/**
 * Parses dataset.bundleConfig and determines what action to take.
 * Direct copy of the decision branch in BundleWidget.loadBundleData().
 */
function parseBundleConfigDataset(
  dataset: MockDataset,
  shopifyDesignMode: boolean
): ParseResult {
  let bundleData: Record<string, any> | null = null;

  const configValue = dataset.bundleConfig;
  if (
    configValue &&
    configValue.trim() !== '' &&
    configValue !== 'null' &&
    configValue !== 'undefined'
  ) {
    try {
      const singleBundle = JSON.parse(configValue);
      if (singleBundle && typeof singleBundle === 'object' && singleBundle.id) {
        bundleData = { [singleBundle.id]: singleBundle };
      }
    } catch {
      // invalid JSON — treat as absent
    }
  }

  if (!bundleData || Object.keys(bundleData).length === 0) {
    const isThemeEditor = shopifyDesignMode;
    const bundleIdFromDataset = dataset.bundleId;
    if (isThemeEditor && bundleIdFromDataset) {
      return { bundleData: null, shouldHide: false, isThemeEditor: true };
    }
    return { bundleData: null, shouldHide: true, isThemeEditor: false };
  }

  return { bundleData, shouldHide: false, isThemeEditor: false };
}

/**
 * Simulates the init() early-return guard added after loadBundleData().
 * Returns true when init should abort (container hidden, no further setup).
 */
function shouldInitAbort(bundleData: Record<string, any> | null): boolean {
  return !bundleData;
}

/**
 * Resolves the base URL used by Product Page bundle product/collection hydration.
 * Direct copy of the decision branch in BundleWidget.resolveStorefrontApiBase().
 */
function resolveProductPageStorefrontApiBase(
  appUrl: string | null | undefined,
  locationOrigin: string,
  locationHost: string,
  shopDomain = ''
): string {
  let appHost = '';
  if (appUrl) {
    try {
      appHost = new URL(appUrl).host;
    } catch {
      appHost = '';
    }
  }

  if (shopDomain && appHost !== locationHost) {
    return '/apps/product-bundles';
  }

  return appUrl || locationOrigin;
}

// ============================================================
// Tests
// ============================================================

describe('parseBundleConfigDataset — non-bundle product pages', () => {
  it('hides container when data-bundle-config is absent', () => {
    const result = parseBundleConfigDataset({}, false);
    expect(result.shouldHide).toBe(true);
    expect(result.bundleData).toBeNull();
  });

  it('hides container when data-bundle-config is empty string', () => {
    const result = parseBundleConfigDataset({ bundleConfig: '' }, false);
    expect(result.shouldHide).toBe(true);
    expect(result.bundleData).toBeNull();
  });

  it('hides container when data-bundle-config is the string "null"', () => {
    const result = parseBundleConfigDataset({ bundleConfig: 'null' }, false);
    expect(result.shouldHide).toBe(true);
    expect(result.bundleData).toBeNull();
  });

  it('hides container when data-bundle-config is the string "undefined"', () => {
    const result = parseBundleConfigDataset({ bundleConfig: 'undefined' }, false);
    expect(result.shouldHide).toBe(true);
    expect(result.bundleData).toBeNull();
  });

  it('hides container when data-bundle-config is invalid JSON', () => {
    const result = parseBundleConfigDataset({ bundleConfig: '{broken json' }, false);
    expect(result.shouldHide).toBe(true);
    expect(result.bundleData).toBeNull();
  });

  it('hides container when parsed bundle JSON has no id field', () => {
    const result = parseBundleConfigDataset(
      { bundleConfig: JSON.stringify({ name: 'No ID Bundle', steps: [] }) },
      false
    );
    expect(result.shouldHide).toBe(true);
    expect(result.bundleData).toBeNull();
  });

  it('hides container when parsed value is not an object (e.g. a number)', () => {
    const result = parseBundleConfigDataset({ bundleConfig: '42' }, false);
    expect(result.shouldHide).toBe(true);
    expect(result.bundleData).toBeNull();
  });
});

describe('parseBundleConfigDataset — valid bundle product pages', () => {
  const validBundle = {
    id: 'cmnrv4f1m0000a63geuvef3f5',
    name: 'Hello',
    steps: [{ id: 's1', name: 'Step 1' }],
    pricing: null,
  };

  it('returns bundleData keyed by bundle id when config is valid', () => {
    const result = parseBundleConfigDataset(
      { bundleConfig: JSON.stringify(validBundle) },
      false
    );
    expect(result.shouldHide).toBe(false);
    expect(result.bundleData).not.toBeNull();
    expect(result.bundleData![validBundle.id]).toMatchObject({ id: validBundle.id, name: 'Hello' });
  });

  it('does not hide container when valid bundle config is present', () => {
    const result = parseBundleConfigDataset(
      { bundleConfig: JSON.stringify(validBundle) },
      false
    );
    expect(result.shouldHide).toBe(false);
  });

  it('preserves full bundle structure including steps', () => {
    const result = parseBundleConfigDataset(
      { bundleConfig: JSON.stringify(validBundle) },
      false
    );
    expect(result.bundleData![validBundle.id].steps).toHaveLength(1);
  });
});

describe('parseBundleConfigDataset — theme editor mode', () => {
  it('signals theme-editor preview (not hide) when Shopify.designMode is true and bundleId is set', () => {
    const result = parseBundleConfigDataset(
      { bundleId: 'bundle-abc123' },
      true /* designMode */
    );
    expect(result.isThemeEditor).toBe(true);
    expect(result.shouldHide).toBe(false);
    expect(result.bundleData).toBeNull();
  });

  it('hides even in theme editor when bundleId dataset is absent', () => {
    const result = parseBundleConfigDataset({}, true);
    expect(result.isThemeEditor).toBe(false);
    expect(result.shouldHide).toBe(true);
  });
});

describe('shouldInitAbort — init() early-return guard', () => {
  it('aborts init when bundleData is null (no bundle on this page)', () => {
    expect(shouldInitAbort(null)).toBe(true);
  });

  it('aborts init when bundleData is undefined (loadBundleData returned early)', () => {
    expect(shouldInitAbort(undefined as any)).toBe(true);
  });

  it('proceeds with init when bundleData is populated', () => {
    const bundleData = { 'bundle-123': { id: 'bundle-123', name: 'Test' } };
    expect(shouldInitAbort(bundleData)).toBe(false);
  });

  it('proceeds with init when bundleData has multiple bundles', () => {
    const bundleData = {
      'bundle-1': { id: 'bundle-1', name: 'A' },
      'bundle-2': { id: 'bundle-2', name: 'B' },
    };
    expect(shouldInitAbort(bundleData)).toBe(false);
  });
});

describe('resolveProductPageStorefrontApiBase — storefront hydration URLs', () => {
  it('uses the Shopify app proxy on storefront pages even when the app URL metafield is stale', () => {
    const result = resolveProductPageStorefrontApiBase(
      'https://stale-preview.example',
      'https://agent-5sfidg3m.myshopify.com',
      'agent-5sfidg3m.myshopify.com',
      'agent-5sfidg3m.myshopify.com'
    );

    expect(result).toBe('/apps/product-bundles');
  });

  it('keeps the app origin for non-Shopify preview pages with no app URL override', () => {
    const result = resolveProductPageStorefrontApiBase(
      null,
      'https://preview.example',
      'preview.example'
    );

    expect(result).toBe('https://preview.example');
  });

  it('keeps the configured app URL for non-Shopify preview pages', () => {
    const result = resolveProductPageStorefrontApiBase(
      'https://current-preview.example',
      'https://preview.example',
      'preview.example'
    );

    expect(result).toBe('https://current-preview.example');
  });
});

describe('Product Page widget product-form placement contract', () => {
  it('relocates the widget container after the product add-to-cart form before rendering', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );

    expect(source).toContain('_relocateContainerToProductForm');
    expect(source).toContain('form[action*="/cart/add"]');
    expect(source).toContain("insertAdjacentElement('afterend', this.container)");
    expect(source).toContain('bundle-widget-container--product-form-mounted');
  });
});

describe('Product Page widget native product price contract', () => {
  it('hides the native product price in the product form scope before rendering PPB controls', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );

    expect(source).toContain('_hideNativeProductPrice');
    expect(source.indexOf('this._relocateContainerToProductForm();')).toBeLessThan(
      source.indexOf('this._hideNativeProductPrice();'),
    );
    expect(source.indexOf('this._hideNativeProductPrice();')).toBeLessThan(
      source.indexOf('this.setupDOMElements();'),
    );
    expect(source).toContain('.product__info-container');
    expect(source).toContain('[id^="ProductInformation-"]');
    expect(source).toContain('.product-details');
    expect(source).toContain('[id^="price-"]');
    expect(source).toContain('.price.price--large');
    expect(source).toContain('wpb-native-product-price--hidden');
    expect(source).toContain('data-wpb-native-product-price-hidden');
    expect(source).toContain("style.setProperty('display', 'none', 'important')");
  });
});

describe('Product Page modal-slot visual contract', () => {
  it('renders modal-slot empty states with section titles, product slot labels, and the reference-matched button stack', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const modalSlotTemplate = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/modal-slot-template.js'),
      'utf8',
    );
    const css = readProductPageStyles();

    expect(modalSlotTemplate).toContain('_isProductPageModalSlotTemplate');
    expect(source).toContain('_markProductPageTemplate');
    expect(source).toContain('this.elements.stepsContainer.dataset.ppbTemplateType');
    expect(source).toContain('this.elements.stepsContainer.dataset.ppbDesignPreset');
    expect(modalSlotTemplate).toContain('bw-ppb-modal-slot-section');
    expect(modalSlotTemplate).toContain('bw-ppb-modal-slot-title');
    expect(modalSlotTemplate).toContain('bw-ppb-modal-slot-grid');
    expect(modalSlotTemplate).toContain("title.textContent = step.pageTitle || step.name || '';");
    expect(modalSlotTemplate).toContain('const slotNumber = instanceIndex + 1;');
    expect(modalSlotTemplate).toMatch(/Product \$\{slotNumber\}/);
    expect(source).toContain('_createDynamicCheckoutVisual');
    expect(source).toContain('bw-ppb-dynamic-checkout-visual');
    expect(source).toContain('Buy it now');

    expect(css).toContain('.bundle-steps[data-ppb-template-type="PDP_MODAL"]');
    expect(css).toContain('.bw-ppb-modal-slot-grid');
    expect(css).toContain('#bundle-builder-app[data-ppb-template-type="PDP_MODAL"]');
    expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
    expect(css).toContain('.bw-ppb-modal-slot-grid .bw-slot-card--empty');
    expect(css).toContain('border:2px dashed #111111');
    expect(css).toContain('#bundle-builder-app[data-ppb-template-type="PDP_MODAL"] .bundle-includes:empty');
    expect(css).toContain('.bw-ppb-dynamic-checkout-visual');
    expect(css).toContain('background:#111111');
    expect(css).toContain('width:100%');
    expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
  });

  it('drives EB modal slot orientation from consumed JSON instead of the template label alone', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const modalSlotTemplate = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/modal-slot-template.js'),
      'utf8',
    );
    const css = readProductPageStyles();

    expect(modalSlotTemplate).toContain('_usesVerticalModalSlotLayout');
    expect(modalSlotTemplate).toContain('renderFilledSlotsAsHorizontalStacked');
    expect(source).toContain('this.container.dataset.ppbSlotOrientation');
    expect(source).toContain('this.elements.stepsContainer.dataset.ppbSlotOrientation');
    expect(source).not.toContain('_isProductPageSimplifiedTemplate');
    expect(css).toContain('data-ppb-slot-orientation="vertical"');
  });

  it('loads PPB Horizontal Slots template code from a dedicated source module before Cascade and widget initialization', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const buildScript = readFileSync(
      join(process.cwd(), 'scripts/build-widget-bundles.js'),
      'utf8',
    );
    const modalSlotTemplate = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/modal-slot-template.js'),
      'utf8',
    );
    const css = readProductPageStyles();

    expect(buildScript).toContain("app/assets/widgets/product-page/templates/modal-slot-template.js");
    expect(buildScript.indexOf("app/assets/widgets/product-page/templates/modal-slot-template.js")).toBeLessThan(
      buildScript.indexOf("app/assets/widgets/product-page/templates/cascade-template.js"),
    );
    expect(source).toContain("import { installModalSlotTemplate } from './widgets/product-page/templates/modal-slot-template.js';");
    expect(source).toContain('installModalSlotTemplate(BundleWidgetProductPage);');
    expect(source.indexOf('installModalSlotTemplate(BundleWidgetProductPage);')).toBeLessThan(
      source.indexOf('installCascadeTemplate(BundleWidgetProductPage);'),
    );
    expect(source.indexOf('installModalSlotTemplate(BundleWidgetProductPage);')).toBeLessThan(
      source.indexOf('initializeProductPageWidget();'),
    );
    expect(source).not.toContain('  _createModalSlotStepSection(step) {');
    expect(source).not.toContain('  createEmptyStateCard(step, stepIndex, instanceIndex = 0) {');

    expect(modalSlotTemplate).toContain('export function installModalSlotTemplate(BundleWidgetProductPage)');
    expect(modalSlotTemplate).toContain('prototype._createModalSlotStepSection = function');
    expect(modalSlotTemplate).toContain('prototype.createEmptyStateCard = function');
    expect(modalSlotTemplate).toContain('prototype._appendSlotIcon = function');

    expect(css).toContain('#bundle-builder-app[data-ppb-template-type="PDP_MODAL"][data-ppb-design-preset="MODAL"][data-ppb-slot-orientation="horizontal"]');
    expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
    expect(css).toContain('grid-template-columns:minmax(0,76.923%)');
    expect(css).toContain('width:100%');
    expect(css).toContain('height:200px');
    expect(css).toContain('min-height:200px');
    expect(css).toContain('aspect-ratio:1');
    expect(css).toContain('background:#ff9790');
    expect(css).toContain('border:2px dashed #000000');
  });

  it('renders PPB Vertical Slots with EB SIMPLIFIED storefront row styling', () => {
    const modalSlotTemplate = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/modal-slot-template.js'),
      'utf8',
    );
    const css = readProductPageStyles();

    const verticalStart = css.indexOf('#bundle-builder-app[data-ppb-template-type="PDP_MODAL"][data-ppb-design-preset="SIMPLIFIED"][data-ppb-slot-orientation="vertical"] .bundle-steps');
    const horizontalStart = css.indexOf('#bundle-builder-app[data-ppb-template-type="PDP_MODAL"][data-ppb-design-preset="MODAL"][data-ppb-slot-orientation="horizontal"]', verticalStart);
    const verticalCss = css.slice(verticalStart, horizontalStart);

    expect(verticalStart).toBeGreaterThan(-1);
    expect(horizontalStart).toBeGreaterThan(verticalStart);
    expect(modalSlotTemplate).toContain("this._getProductPageDesignPreset() === 'SIMPLIFIED'");
    expect(modalSlotTemplate).toContain("label.textContent = isModalSlotTemplate ? `Product ${slotNumber}`");

    expect(verticalCss).toContain('width:100%');
    expect(verticalCss).toContain('max-width:100%');
    expect(verticalCss).toContain('gap:26px');
    expect(verticalCss).toContain('height:104px');
    expect(verticalCss).toContain('min-height:104px');
    expect(verticalCss).toContain('border:2px dashed #000000');
    expect(verticalCss).toContain('border-radius:10px');
    expect(verticalCss).toContain('grid-template-columns:minmax(0, 1fr) 80px');
    expect(verticalCss).toContain('padding:10px');
    expect(verticalCss).toContain('width:80px');
    expect(verticalCss).toContain('height:80px');
    expect(verticalCss).toContain('object-fit:contain');
    expect(verticalCss).toContain('font-size:16px');
    expect(verticalCss).toContain('color:#3e3e3e');
    expect(verticalCss).toContain('background:#000000 !important');
    expect(verticalCss).toContain('opacity:0.5');
    expect(verticalCss).toContain('font-weight:500');
    expect(verticalCss).toContain('@media (max-width:480px)');
    expect(verticalCss).toContain('font-size:10px');
  });

  it('keeps PPB Product List and Horizontal Slots container responsive on wider storefront placements', () => {
    const css = readProductPageStyles();

    const cascadeCss = css.slice(
      css.indexOf('#bundle-builder-app[data-ppb-template-type="PDP_INPAGE"][data-ppb-design-preset="CASCADE"] .bundle-steps'),
      css.indexOf('#bundle-builder-app[data-ppb-template-type="PDP_INPAGE"][data-ppb-design-preset="COGNIVE"] .bw-ppb-inpage-step-grid'),
    );
    const modalStart = css.indexOf('#bundle-builder-app[data-ppb-template-type="PDP_MODAL"] {');
    const modalCss = css.slice(modalStart);

    expect(cascadeCss).not.toContain('max-width:345px');
    expect(cascadeCss).toContain('max-width:none');
    expect(cascadeCss).toContain('width:100%');

    expect(modalCss).not.toContain('width:345px');
    expect(modalCss).not.toContain('max-width:345px');
    expect(modalCss).not.toContain('width:360px');
    expect(modalCss).not.toContain('max-width:calc(100vw - 30px)');
    expect(modalCss).toContain('width:100%');
    expect(modalCss).toContain('max-width:100%');
    expect(modalCss).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
  });

  it('renders only one quantity increase button in PPB in-page product cards', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const inpageRenderer = source.slice(
      source.indexOf('_renderInpageStepProducts'),
      source.indexOf('    this.attachProductEventHandlers(target, stepIndex);'),
    );

    const increaseButtonMatches = inpageRenderer.match(/class="qty-btn qty-increase"/g) ?? [];
    expect(increaseButtonMatches).toHaveLength(1);
  });

  it('renders EB-style PPB in-page category tabs from the consumed step categories', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const css = readProductPageStyles();

    expect(source).toContain('_createInpageCategoryTabs');
    expect(source).toContain('Array.isArray(step?.categories) ? step.categories : []');
    expect(source).toContain('this.activeInpageCategoryIndexes[stepIndex]');
    expect(source).toContain('bw-ppb-inpage-category-tab');
    expect(source).toContain('_getInpageCategoryLabel');
    const expectedCategoryFallback = [
      'category?.title || category?.name || `Category $',
      '{categoryIndex + 1}`',
    ].join('');
    expect(source).toContain(expectedCategoryFallback);
    expect(source).toContain('_filterProductsForInpageCategory');
    expect(source).toContain('_getCategoryProductIds');
    expect(source).toContain('categoryProductIds.has(productId)');

    expect(css).toContain('.bw-ppb-inpage-category-tabs');
    expect(css).toContain('.bw-ppb-inpage-category-tab.active');
    expect(css).toContain('background:#111111');
    expect(css).toContain('color:#ffffff');
  });

  it('renders the PPB Product List template with EB-style cascade rows and footer controls', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const css = readProductPageStyles();
    const cascadeTemplate = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/cascade-template.js'),
      'utf8',
    );

    expect(cascadeTemplate).toContain('_isProductPageCascadeTemplate');
    expect(cascadeTemplate).toContain('_renderCascadeFooter');
    expect(cascadeTemplate).toContain('_getSelectedProductEntries');
    expect(source).toContain('bw-ppb-cascade-product-list');
    expect(source).toContain('bw-ppb-cascade-product-row');
    expect(source).toContain('gbbMixPageWrapper');
    expect(source).toContain('gbbMixProductPageWrapperV2');
    expect(source).toContain('gbbMixCascadeProductWrapper');
    expect(source).toContain('gbbMixCascadeProductLeftSection');
    expect(source).toContain('gbbMixCascadeProductRightSection');
    expect(source).toContain('gbbMixCascadeAddBtn');
    expect(cascadeTemplate).toContain('bw-ppb-cascade-selected-toggle');
    expect(cascadeTemplate).toContain('gbbMixCascadeFooterWrapper');
    expect(cascadeTemplate).toContain('gbbMixCascadeSelectedItemsInCartWrappper');
    expect(cascadeTemplate).toContain('gbbMixCascadeCartDrawerContainer');
    expect(cascadeTemplate).toContain('viewBundleItems');
    expect(source).toContain('const showQuantitySelector = !this._usesCompactInpageProductCards()');

    expect(css).toContain('.bw-ppb-cascade-footer');
    expect(css).toContain('.bw-ppb-cascade-selected-toggle');
    expect(css).toContain('.bw-ppb-cascade-product-row');
    expect(css).toContain('grid-template-columns:minmax(0,1fr) 90px');
    expect(css).toContain('.gbbMixCascadeProductLeftSection');
    expect(css).toContain('.gbbMixCascadeFooterWrapper--cartDrawerUI');
    expect(css).toContain('.gbbMixCascadeSelectedItemsInCartWrappper');
    expect(css).toContain('#bundle-builder-app[data-ppb-template-type="PDP_INPAGE"][data-ppb-design-preset="CASCADE"] .bw-ppb-dynamic-checkout-visual');
    expect(css).toContain('border-radius:10px');
    expect(css).toContain('background:#111111');
  });

  it('keeps static PPB runtime presentation in CSS instead of inline JS styles', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const modalSlotTemplate = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/modal-slot-template.js'),
      'utf8',
    );
    const css = readProductPageStyles();

    expect(source).toContain('bw-default-products__line');
    expect(source).toContain('bw-ppb-discount-progress__fill');
    expect(source).toContain('bw-qty-pill--active');
    expect(source).toContain('bw-gift-message__textarea');
    expect(modalSlotTemplate).toContain('bw-slot-card__plus-icon');
    expect(modalSlotTemplate).toContain('bw-slot-card__slot-icon-img');
    expect(modalSlotTemplate).toContain('bw-ppb-primary-cta--modal-vertical');

    expect(source).not.toContain("el.style.cssText = 'display:block;margin:0 0 14px;'");
    expect(source).not.toContain("title.style.cssText = 'font-size:14px;font-weight:700;margin:0 0 10px;color:#1a1a1a;'");
    expect(source).not.toContain("list.style.cssText = 'display:flex;flex-direction:column;gap:8px;'");
    expect(source).not.toContain("el.style.cssText = 'margin: 10px 0; padding: 10px 0;'");
    expect(source).not.toContain('msgEl.style.cssText');
    expect(source).not.toContain("track.style.cssText = 'height:6px;background:#e1e3e5;border-radius:3px;overflow:hidden;'");
    expect(source).not.toContain('pill.style.cssText');
    expect(source).not.toContain("p.style.border = '2px solid #e1e3e5'");
    expect(source).not.toContain("el.style.cssText = 'display:block;margin:14px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e1e3e5;'");
    expect(source).not.toContain('fromInput.style.cssText');
    expect(source).not.toContain('textarea.style.cssText');
    expect(modalSlotTemplate).not.toContain("button.style.backgroundColor = '#000000'");
    expect(modalSlotTemplate).not.toContain('iconWrapper.style.cssText = `');
    expect(modalSlotTemplate).not.toContain('slotIconImg.style.cssText');

    expect(css).toContain('.bw-default-products__line');
    expect(css).toContain('.bw-ppb-discount-progress__fill');
    expect(css).toContain('.bw-qty-pill--active');
    expect(css).toContain('.bw-gift-message__textarea');
    expect(css).toContain('.bw-slot-card__plus-icon');
    expect(css).toContain('.bw-slot-card__slot-icon-img');
    expect(css).toContain('.bw-ppb-primary-cta--modal-vertical');
  });

  it('loads PPB Product List template code from a dedicated source module before widget initialization', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const buildScript = readFileSync(
      join(process.cwd(), 'scripts/build-widget-bundles.js'),
      'utf8',
    );
    const cascadeTemplate = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/cascade-template.js'),
      'utf8',
    );

    expect(buildScript).toContain('const PRODUCT_PAGE_MODULES = [');
    expect(buildScript).toContain("app/assets/widgets/product-page/templates/cascade-template.js");
    const productPageBuildFunction = buildScript.slice(
      buildScript.indexOf('function buildProductPageBundle()'),
    );
    expect(productPageBuildFunction.indexOf('${productPageModulesCode}')).toBeLessThan(
      productPageBuildFunction.indexOf('${processedWidget}'),
    );

    expect(source).toContain("import { installCascadeTemplate } from './widgets/product-page/templates/cascade-template.js';");
    expect(source).toContain('installCascadeTemplate(BundleWidgetProductPage);');
    expect(source.indexOf('installCascadeTemplate(BundleWidgetProductPage);')).toBeLessThan(
      source.indexOf('initializeProductPageWidget();'),
    );
    expect(source).not.toContain('  _renderCascadeFooter(el) {');

    expect(cascadeTemplate).toContain('export function installCascadeTemplate(BundleWidgetProductPage)');
    expect(cascadeTemplate).toContain('prototype._renderCascadeFooter = function');
    expect(cascadeTemplate).toContain('prototype._isProductPageCascadeTemplate = function');
  });

  it('renders the PPB Product Grid template from a dedicated COGNIVE module with EB-style responsive cards', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const buildScript = readFileSync(
      join(process.cwd(), 'scripts/build-widget-bundles.js'),
      'utf8',
    );
    const css = readProductPageStyles();
    const cogniveTemplate = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/cognive-template.js'),
      'utf8',
    );

    expect(buildScript).toContain("app/assets/widgets/product-page/templates/cognive-template.js");
    expect(source).toContain("import { installCogniveTemplate } from './widgets/product-page/templates/cognive-template.js';");
    expect(source).toContain('installCogniveTemplate(BundleWidgetProductPage);');
    expect(source.indexOf('installCascadeTemplate(BundleWidgetProductPage);')).toBeLessThan(
      source.indexOf('installCogniveTemplate(BundleWidgetProductPage);'),
    );
    expect(source.indexOf('installCogniveTemplate(BundleWidgetProductPage);')).toBeLessThan(
      source.indexOf('initializeProductPageWidget();'),
    );

    expect(cogniveTemplate).toContain('export function installCogniveTemplate(BundleWidgetProductPage)');
    expect(cogniveTemplate).toContain('prototype._isProductPageGridTemplate = function');
    expect(cogniveTemplate).toContain("this._getProductPageDesignPreset() === 'COGNIVE'");
    expect(cogniveTemplate).toContain('prototype._renderCogniveFooter = function');
    expect(cogniveTemplate).toContain('this._renderCascadeFooter(el);');
    expect(source).toContain('this._isProductPageGridTemplate()');
    expect(source).toContain('this._renderCogniveFooter(el);');
    expect(source).toContain("target.classList.toggle('bw-ppb-cognive-product-grid', this._isProductPageGridTemplate())");
    expect(source).toContain('const showQuantitySelector = !this._usesCompactInpageProductCards()');

    expect(css).toContain('#bundle-builder-app[data-ppb-template-type="PDP_INPAGE"][data-ppb-design-preset="COGNIVE"] .bw-ppb-inpage-step-grid');
    expect(css).toContain('grid-template-columns:repeat(3, minmax(0, 1fr))');
    expect(css).toContain('gap:15px');
    expect(css).toContain('padding:0 8px 15px');
    expect(css).toContain('.bw-ppb-cognive-product-grid .product-card');
    expect(css).toContain('gap:10px');
    expect(css).toContain('.bw-ppb-cognive-product-grid .product-image');
    expect(css).toContain('aspect-ratio:1');
    expect(css).toContain('.bw-ppb-cognive-product-grid .product-add-btn');
    expect(css).toContain('height:32px');
  });

  it('renders PPB discount tier pills from rule-id display DTOs', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );

    expect(source).toContain('getProductPageTierPillContent(rule, index, qtyOpts)');
    expect(source).toContain('getProductPageTierPillContent(rule, index, qtyOpts) {');
    expect(source).toContain('bundleQuantityOptions.optionsByRuleId || {}');
    expect(source).toContain('pricing.messages?.tierTextByRuleId || {}');
    expect(source).toContain('optionsByRuleId[ruleId] || tierTextByRuleId[ruleId]');
    expect(source).toContain('qtyOpts?.labels?.[index]');
    expect(source).toContain('CurrencyManager.convertAndFormat(discountValue, currencyInfo)');
  });
});

describe('Product Page bundle cart add transport contract', () => {
  it('submits PPB cart adds as EB-style multipart fields to /cart/add', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );

    expect(source).toContain("fetch('/cart/add',");
    expect(source).toContain('new FormData()');
    const indexToken = ['$', '{index}'].join('');
    expect(source).toContain(`items[${indexToken}][id]`);
    expect(source).toContain(`items[${indexToken}][quantity]`);
    expect(source).toContain(`items[${indexToken}][properties][Box]`);
    expect(source).toContain(`items[${indexToken}][properties][_easyBundle:OfferId]`);
    expect(source).toContain(`items[${indexToken}][properties][_easyBundle:prodQty]`);
    expect(source).toContain(`items[${indexToken}][properties][_bundleName]`);
    expect(source).toContain("const properties = {};");
    expect(source).not.toContain("'_bundle_name': this.selectedBundle.name");
    expect(source).not.toContain("'_step_index'");
    expect(source).not.toContain("fetch('/cart/add.js', {");
  });

  it('keeps FPB cart adds on JSON /cart/add.js', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-full-page.js'),
      'utf8',
    );

    expect(source).toContain("fetch('/cart/add.js',");
    expect(source).toContain("'Content-Type': 'application/json'");
    expect(source).toContain('JSON.stringify({ items })');
  });

  it('syncs EB-style bundle_details cart metafields for PPB and FPB through the signed app proxy', () => {
    const ppbSource = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );
    const fpbSource = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-full-page.js'),
      'utf8',
    );

    [ppbSource, fpbSource].forEach((source) => {
      expect(source).toContain("fetch('/apps/product-bundles/api/cart-bundle-details'");
      expect(source).toContain("if (data?.ok !== true)");
      expect(source).toContain("fetch('/cart.js?app=wolfpackProductBundles'");
      expect(source).toContain('Failed to sync bundle_details cart metafield');
      expect(source).not.toContain('query GetCartMetafield');
      expect(source).not.toContain('cartMetafieldsSet');
      expect(source).not.toContain('fetch(`/api/${version}/graphql.json`');
    });

    expect(ppbSource).toContain('bundleDetailsKey: `${offerId}_${sessionKey}`');
    expect(ppbSource).toContain('await this.syncBundleDetailsCartMetafield(cartContext.bundleDetailsKey, cartContext.sourceProperties)');
    expect(fpbSource).toContain('await this.syncBundleDetailsCartMetafield(`${offerId}_${sessionKey}`, sourceProperties)');
  });
});
