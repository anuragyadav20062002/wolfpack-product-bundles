import { readProductPageWidgetSources } from './widget-source-helpers';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageSelectionDataMethods } = require('../../../app/assets/widgets/product-page/methods/selection-data-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { shouldDisableProductPageVariantOption } = require('../../../app/assets/widgets/product-page/methods/modal-methods.js');
/**
 * Unit Tests — Product Page widget product normalization
 *
 * Pattern: pure logic mirrors the browser widget's processProductsForStep()
 * branch so storefront hydration regressions can be tested without loading the
 * full IIFE bundle in Jest.
 */

interface StorefrontVariant {
  id: string;
  title: string;
  price?: string;
  compareAtPrice?: string | null;
  available?: boolean;
  quantityAvailable?: number | null;
  currentlyNotInStock?: boolean;
  image?: { src?: string } | null;
}

interface StorefrontProduct {
  id: string;
  title: string;
  imageUrl?: string;
  variants?: StorefrontVariant[];
  options?: Array<string | { name: string }>;
  images?: Array<{ src?: string }>;
  description?: string;
}

interface WidgetStep {
  displayVariantsAsIndividual?: boolean;
}

function extractId(idString: string | null | undefined): string | null {
  if (!idString) return null;
  const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
  if (gidMatch) return gidMatch[1];
  return idString.toString().split('/').pop() ?? null;
}

function processProductPageProductsForStep(products: StorefrontProduct[], step: WidgetStep): any[] {
  const normalizeVariant = (variant: StorefrontVariant) => ({
    id: extractId(variant.id),
    title: variant.title,
    price: parseFloat(variant.price || '0') * 100,
    compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) * 100 : null,
    available: variant.available === true,
    quantityAvailable: typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
    currentlyNotInStock: variant.currentlyNotInStock === true,
    image: variant.image || null,
  });

  return products.flatMap<any>(product => {
    if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
      const processedVariants = (product.variants || []).map(normalizeVariant);
      const processedOptions = (product.options || []).map(option => (
        typeof option === 'string' ? option : option.name
      ));

      return product.variants
        .filter(variant => variant.available === true)
        .map(variant => ({
          id: extractId(variant.id),
          title: `${product.title} - ${variant.title}`,
          imageUrl: variant?.image?.src || product.imageUrl || 'placeholder',
          price: parseFloat(variant.price || '0') * 100,
          compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) * 100 : null,
          variantId: extractId(variant.id),
          available: variant.available === true,
          parentProductId: extractId(product.id),
          parentTitle: product.title,
          variants: processedVariants,
          options: processedOptions,
        }));
    }

    const defaultVariant = product.variants?.find(variant => variant.available === true) || product.variants?.[0];

    if (defaultVariant && defaultVariant.available !== true) {
      return [];
    }

    const processedVariants = (product.variants || []).map(normalizeVariant);
    const processedOptions = (product.options || []).map(option => (
      typeof option === 'string' ? option : option.name
    ));

    return [{
      id: extractId(product.id),
      title: product.title,
      imageUrl: defaultVariant?.image?.src || product.imageUrl || 'placeholder',
      price: defaultVariant ? parseFloat(defaultVariant.price || '0') * 100 : 0,
      compareAtPrice: defaultVariant?.compareAtPrice ? parseFloat(defaultVariant.compareAtPrice) * 100 : null,
      variantId: extractId(defaultVariant?.id || product.id),
      available: defaultVariant?.available === true,
      quantityAvailable: typeof defaultVariant?.quantityAvailable === 'number' ? defaultVariant.quantityAvailable : null,
      currentlyNotInStock: defaultVariant?.currentlyNotInStock === true,
      variants: processedVariants,
      options: processedOptions,
      images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
      description: product.description || '',
    }];
  });
}

describe('processProductPageProductsForStep', () => {
  it('uses the first available variant for parent product cards when the first variant is unavailable', () => {
    const products = processProductPageProductsForStep([
      {
        id: 'gid://shopify/Product/9427287703811',
        title: 'Armor Matte Case',
        imageUrl: 'https://cdn.example/product.jpg',
        variants: [
          {
            id: 'gid://shopify/ProductVariant/111',
            title: 'Sold out',
            price: '123.0',
            available: false,
          },
          {
            id: 'gid://shopify/ProductVariant/222',
            title: 'Available',
            price: '125.0',
            compareAtPrice: '150.0',
            available: true,
            quantityAvailable: 4,
            currentlyNotInStock: false,
            image: { src: 'https://cdn.example/variant.jpg' },
          },
        ],
        options: [{ name: 'Color' }],
      },
    ], { displayVariantsAsIndividual: false });

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '9427287703811',
      title: 'Armor Matte Case',
      variantId: '222',
      imageUrl: 'https://cdn.example/variant.jpg',
      price: 12500,
      compareAtPrice: 15000,
      available: true,
      quantityAvailable: 4,
      currentlyNotInStock: false,
    });
  });
});

describe('Product Page widget quantity-validation contract', () => {
  it('uses the shared per-product quantity gate in render and state update paths', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('ConditionValidator.getAllowedQuantityPerProduct');
    expect(source).toContain('ConditionValidator.canUpdateProductQuantity');
  });
});

describe('Product Page widget product-level inventory tracking', () => {
  function makeSelectionContext(trackInventoryOnAddToCart: boolean) {
    return {
      stepProductData: [[{
        variantId: 'variant-1',
        available: true,
        quantityAvailable: 0,
        currentlyNotInStock: false,
      }]],
      _getProductPageControls: () => ({ trackInventoryOnAddToCart }),
      normalizeSelectionKey: (value: string) => value,
      findProductBySelectionKey(products: any[], selectionKey: string) {
        return products.find(product => product.variantId === selectionKey) || null;
      },
    };
  }

  it('blocks tracked zero-stock variants when inventory tracking is enabled', () => {
    const state = ProductPageSelectionDataMethods.getVariantAvailable.call(
      makeSelectionContext(true),
      0,
      'variant-1',
    );

    expect(state).toEqual({ available: 0, outOfStock: true, acceptsBackorder: false });
  });

  it('keeps tracked zero-stock variants unbounded when inventory tracking is disabled', () => {
    const state = ProductPageSelectionDataMethods.getVariantAvailable.call(
      makeSelectionContext(false),
      0,
      'variant-1',
    );

    expect(state).toEqual({ available: null, outOfStock: false, acceptsBackorder: false });
  });

  it('does not clamp positive stock quantities when inventory tracking is disabled', () => {
    const context = makeSelectionContext(false);
    context.stepProductData[0][0].quantityAvailable = 2;

    const state = ProductPageSelectionDataMethods.getVariantAvailable.call(
      context,
      0,
      'variant-1',
    );

    expect(state).toEqual({ available: null, outOfStock: false, acceptsBackorder: false });
  });

  it('does not disable a zero-stock variant option when inventory tracking is disabled', () => {
    expect(shouldDisableProductPageVariantOption({
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: false,
    }, false)).toBe(false);
  });

  it('disables a zero-stock variant option when inventory tracking is enabled', () => {
    expect(shouldDisableProductPageVariantOption({
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: false,
    }, true)).toBe(true);
  });

  it('keeps backorderable zero-stock variant options enabled when inventory tracking is enabled', () => {
    expect(shouldDisableProductPageVariantOption({
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: true,
    }, true)).toBe(false);
  });
});

describe('Product Page widget direct default-products contract', () => {
  it('reads direct defaultProductsData and renders the preselected summary branch', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('_initDirectDefaultProducts');
    expect(source).toContain('_renderDirectDefaultProducts');
    expect(source).toContain('this.selectedBundle?.defaultProductsData');
  });

  it('does not mark direct defaults unavailable from zero inventory alone', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('variant?.availableForSale === false || variant?.available === false');
    expect(source).not.toContain('const available = inventoryQuantity === null || inventoryQuantity > 0;');
  });
});

describe('Product Page widget category hydration contract', () => {
  it('hydrates products and collections from step.categories', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('collectStepProductIds(step)');
    expect(source).toContain('collectStepCollectionHandles(step)');
    expect(source).toContain('category.collectionsSelectedData');
  });
});

describe('Product Page widget selection-key normalization contract', () => {
  it('uses a shared selection-key normalizer for update paths', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('normalizeSelectionKey(variantId)');
    expect(source).toContain('getSelectedQuantity(stepIndex, selectionKey);');
    expect(source).toContain('this.setSelectedQuantity(stepIndex, selectionKey, quantity);');
    expect(source).toContain('this.setSelectedQuantity(stepIndex, normalizedVariantId, 0);');
    expect(source).toContain('const normalized = this.normalizeSelectionKey(variantId);');
    expect(source).toContain('if (Object.prototype.hasOwnProperty.call(selectedProducts, normalized))');
  });

  it('normalizes the default variant key before seeding default-step selections', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('const normalizedDefaultVariantId = this.normalizeSelectionKey(step.defaultVariantId);');
    expect(source).toContain('if (normalizedDefaultVariantId) {');
    expect(source).toContain('this.setSelectedQuantity(i, normalizedDefaultVariantId, 1);');
    expect(source).not.toContain('this.setSelectedQuantity(i, step.defaultVariantId');
    expect(source).not.toContain('this.setSelectedQuantity(i, step.defaultVariantId, 1)');
  });

  it('reads direct default variant quantities through normalized lookup in the summary renderer', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('this._renderDirectDefaultProducts()');
    expect(source).toContain('const quantity = this.getSelectedQuantity(0, product.variantId)');
    expect(source).toContain('this.setSelectedQuantity(0, product.variantId, product.defaultRequiredQuantity || 1);');
  });

  it('keeps default-product guard checks normalized in removeProductFromSelection', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('if (step?.isDefault && this.normalizeSelectionKey(step.defaultVariantId) === normalizedVariantId) return;');
    expect(source).toContain('const currentQuantity = this.getSelectedQuantity(stepIndex, normalizedVariantId);');
    expect(source).toContain('this.setSelectedQuantity(stepIndex, normalizedVariantId, currentQuantity - 1);');
    expect(source).not.toContain('step?.isDefault && step.defaultVariantId === normalizedVariantId');
    expect(source).not.toContain('this.setSelectedQuantity(stepIndex, step.defaultVariantId');
  });

  it('normalizes selection IDs when matching selected products for summary/cart payload paths', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('findProductBySelectionKey(productsInStep, normalizedVariantId);');
    expect(source).toContain('findProductBySelectionKey(products, variantId);');
    expect(source).toContain('getVariantAvailable(stepIndex, variantId) {');
    expect(source).toContain('findProductBySelectionKey(products, variantId);');
  });
});
