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

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function readProductPageWidgetSources() {
  const methodFiles = readdirSync(join(process.cwd(), 'app/assets/widgets/product-page/methods'))
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => `app/assets/widgets/product-page/methods/${file}`);

  return [
    'app/assets/bundle-widget-product-page.js',
    'app/assets/widgets/product-page/templates/modal-slot-template.js',
    'app/assets/widgets/product-page/templates/cascade-template.js',
    'app/assets/widgets/product-page/templates/cognive-template.js',
    ...methodFiles,
  ]
    .map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8'))
    .join('\n');
}

function readFullPageWidgetSources() {
  const methodFiles = readdirSync(join(process.cwd(), 'app/assets/widgets/full-page/methods'))
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => `app/assets/widgets/full-page/methods/${file}`);

  return [
    'app/assets/bundle-widget-full-page.js',
    ...methodFiles,
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
  /** true when marker payload is present and requires API hydration */
  needsFetch: boolean;
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
      if (
        singleBundle &&
        typeof singleBundle === 'object' &&
        singleBundle.v === 2 &&
        singleBundle.type === 'product_page' &&
        typeof singleBundle.id === 'string' &&
        singleBundle.id.trim() !== ''
      ) {
        return { bundleData: null, shouldHide: false, isThemeEditor: false, needsFetch: true };
      }

      // Full-object payloads are no longer accepted from DOM.
    } catch {
      // invalid JSON — treat as absent
    }
  }

  if (!bundleData || Object.keys(bundleData).length === 0) {
    const isThemeEditor = shopifyDesignMode;
    const bundleIdFromDataset = dataset.bundleId;
    if (isThemeEditor && bundleIdFromDataset) {
      return { bundleData: null, shouldHide: false, isThemeEditor: true, needsFetch: false };
    }
    return { bundleData: null, shouldHide: true, isThemeEditor: false, needsFetch: false };
  }

  return { bundleData, shouldHide: false, isThemeEditor: false, needsFetch: false };
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
    expect(result.needsFetch).toBe(false);
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

describe('parseBundleConfigDataset — marker bootstrap path', () => {
  const validBundle = {
    id: 'cmnrv4f1m0000a63geuvef3f5',
    name: 'Hello',
    steps: [{ id: 's1', name: 'Step 1' }],
    pricing: null,
  };

  it('does not accept legacy full-object payloads from DOM', () => {
    const result = parseBundleConfigDataset(
      { bundleConfig: JSON.stringify(validBundle) },
      false
    );
    expect(result.shouldHide).toBe(true);
    expect(result.bundleData).toBeNull();
    expect(result.needsFetch).toBe(false);
  });

  it('accepts bootstrap marker config and marks fetch requirement', () => {
    const result = parseBundleConfigDataset(
      { bundleConfig: JSON.stringify({ v: 2, type: 'product_page', bundleType: 'product_page', id: 'cmpvppb123' }) },
      false
    );
    expect(result.shouldHide).toBe(false);
    expect(result.bundleData).toBeNull();
    expect(result.needsFetch).toBe(true);
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

describe('Product Page bundle cart add transport contract', () => {
  it('submits PPB cart adds as EB-style multipart fields to /cart/add', () => {
    const source = readProductPageWidgetSources();
    const cartSubmitSource = readFileSync(
      join(process.cwd(), 'app/assets/widgets/shared/engine/cart-submit.js'),
      'utf8',
    );

    expect(source).toContain("fetch('/cart/add',");
    expect(source).toContain('buildProductPageCartFormData(cartItems');
    expect(cartSubmitSource).toContain('new FormData()');
    const indexToken = ['$', '{index}'].join('');
    expect(cartSubmitSource).toContain(`items[${indexToken}][id]`);
    expect(cartSubmitSource).toContain(`items[${indexToken}][quantity]`);
    expect(cartSubmitSource).toContain(`items[${indexToken}][properties][Box]`);
    expect(cartSubmitSource).toContain(`items[${indexToken}][properties][_wolfpackProductBundle:OfferId]`);
    expect(cartSubmitSource).toContain(`items[${indexToken}][properties][_wolfpackProductBundle:prodQty]`);
    expect(cartSubmitSource).toContain(`items[${indexToken}][properties][_bundleName]`);
    expect(source).toContain("const properties = {};");
    expect(source).not.toContain("'_bundle_name': this.selectedBundle.name");
    expect(source).not.toContain("'_step_index'");
    expect(source).not.toContain("fetch('/cart/add.js', {");
  });

  it('keeps FPB cart adds on JSON /cart/add.js', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("fetch('/cart/add.js',");
    expect(source).toContain("'Content-Type': 'application/json'");
    expect(source).toContain('JSON.stringify({ items })');
  });

  it('syncs EB-style bundle_details cart metafields for PPB and FPB through the signed app proxy', () => {
    const ppbSource = readProductPageWidgetSources();
    const fpbSource = readFullPageWidgetSources();

    [ppbSource, fpbSource].forEach((source) => {
      expect(source).toContain("fetch('/apps/product-bundles/api/cart-bundle-details'");
      expect(source).toContain("if (data?.ok !== true)");
      expect(source).toContain("fetch('/cart.js?app=wolfpackProductBundles'");
      expect(source).toContain('Failed to sync bundle_details cart metafield');
      expect(source).not.toContain('query GetCartMetafield');
      expect(source).not.toContain('cartMetafieldsSet');
      expect(source).not.toContain('fetch(`/api/${version}/graphql.json`');
    });

    expect(readFileSync(join(process.cwd(), 'app/assets/widgets/shared/engine/cart-submit.js'), 'utf8')).toContain('bundleDetailsKey: `${offerId}_${sessionKey}`');
    expect(ppbSource).toContain('await this.syncBundleDetailsCartMetafield(cartContext.bundleDetailsKey, cartContext.sourceProperties)');
    expect(fpbSource).toContain('await this.syncBundleDetailsCartMetafield(`${offerId}_${sessionKey}`, sourceProperties)');
  });
});
