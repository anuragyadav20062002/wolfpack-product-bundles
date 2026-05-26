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
    const css = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page-css/bundle-widget.css'),
      'utf8',
    );

    expect(source).toContain('_isProductPageModalSlotTemplate');
    expect(source).toContain('_markProductPageTemplate');
    expect(source).toContain('this.elements.stepsContainer.dataset.ppbTemplateType');
    expect(source).toContain('this.elements.stepsContainer.dataset.ppbDesignPreset');
    expect(source).toContain('bw-ppb-modal-slot-section');
    expect(source).toContain('bw-ppb-modal-slot-title');
    expect(source).toContain('bw-ppb-modal-slot-grid');
    expect(source).toContain("title.textContent = step.pageTitle || step.name || '';");
    expect(source).toContain('const slotNumber = instanceIndex + 1;');
    expect(source).toMatch(/Product \$\{slotNumber\}/);
    expect(source).toContain('_createDynamicCheckoutVisual');
    expect(source).toContain('bw-ppb-dynamic-checkout-visual');
    expect(source).toContain('Buy it now');

    expect(css).toContain('.bundle-steps[data-ppb-template-type="PDP_MODAL"]');
    expect(css).toContain('.bw-ppb-modal-slot-grid');
    expect(css).toContain('width:345px');
    expect(css).toContain('max-width:345px');
    expect(css).toContain('grid-template-columns:repeat(3,104.328px)');
    expect(css).toContain('.bw-ppb-modal-slot-grid .bw-slot-card--empty');
    expect(css).toContain('border:2px dashed #111111');
    expect(css).toContain('.bw-ppb-dynamic-checkout-visual');
    expect(css).toContain('background:#111111');
    expect(css).toContain('width:360px');
    expect(css).toContain('grid-template-columns:repeat(3,110.66px)');
  });
});
