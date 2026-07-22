export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  fullPageSearchCategoryMethods,
} = require('../../../app/assets/widgets/full-page/methods/search-category-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  fullPageProductGridMethods,
} = require('../../../app/assets/widgets/full-page/methods/product-grid-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  fullPageModalProductMethods,
} = require('../../../app/assets/widgets/full-page/methods/modal-product-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  fullPageProductProcessingMethods,
} = require('../../../app/assets/widgets/full-page/methods/product-processing-methods.js');

describe('Full Page widget category hydration behavior', () => {
  const getStepCategoryTabEntries = fullPageSearchCategoryMethods.getStepCategoryTabEntries;
  const shouldDisplayVariantsAsIndividualForProductGrid =
    fullPageSearchCategoryMethods.shouldDisplayVariantsAsIndividualForProductGrid;
  const expandProductsByVariant = fullPageProductGridMethods.expandProductsByVariant;
  const orderProductsForActiveCategory = fullPageProductGridMethods.orderProductsForActiveCategory;
  const getNoProductsAvailableMessage = fullPageProductGridMethods.getNoProductsAvailableMessage;
  const mergeCategoryProductVariantAvailability =
    fullPageProductProcessingMethods.mergeCategoryProductVariantAvailability;

  function categoryContext() {
    return {
      getStepCategoryTabEntries,
    };
  }

  it('keeps category entries for direct products and collections', () => {
    const entries = getStepCategoryTabEntries({
      categories: [
        {
          categoryId: 'cat-manual',
          title: 'Manual',
          products: [{ id: 'gid://shopify/Product/1' }],
          collectionsSelectedData: [],
        },
        {
          categoryId: 'cat-collection',
          title: 'Collection',
          products: [],
          collections: [{ handle: 'automated-collection' }],
        },
      ],
    });

    expect(entries).toEqual([
      {
        id: 'cat-manual',
        title: 'Manual',
        handles: [],
        productIds: ['gid://shopify/Product/1'],
        displayVariantsAsIndividualProducts: false,
        displayVariantsAsSwatches: false,
      },
      {
        id: 'cat-collection',
        title: 'Collection',
        handles: ['automated-collection'],
        productIds: [],
        displayVariantsAsIndividualProducts: false,
        displayVariantsAsSwatches: false,
      },
    ]);
  });

  it('keeps a named empty category available for storefront navigation', () => {
    const entries = getStepCategoryTabEntries({
      categories: [
        {
          categoryId: 'cat-empty',
          title: 'Empty Category',
          products: [],
          selectedProducts: [],
          collectionsSelectedData: [],
        },
      ],
    });

    expect(entries).toEqual([
      {
        id: 'cat-empty',
        title: 'Empty Category',
        handles: [],
        productIds: [],
        displayVariantsAsIndividualProducts: false,
        displayVariantsAsSwatches: false,
      },
    ]);
  });

  it('uses the saved FPB step-level variant display flag for category tabs', () => {
    const step = {
      displayVariantsAsIndividual: true,
      categories: [
        {
          categoryId: 'cat-collection',
          title: 'Collection',
          displayVariantsAsIndividualProducts: false,
          collections: [{ handle: 'automated-collection' }],
        },
      ],
    };
    const activeCategory = getStepCategoryTabEntries(step)[0];

    expect(
      shouldDisplayVariantsAsIndividualForProductGrid.call(
        categoryContext(),
        step,
        activeCategory,
      ),
    ).toBe(true);
  });

  it('expands category tab products only when the active category display flag is on', () => {
    const step = {
      displayVariantsAsIndividual: false,
      categories: [
        {
          categoryId: 'cat-collection',
          title: 'Collection',
          displayVariantsAsIndividualProducts: true,
          collections: [{ handle: 'automated-collection' }],
        },
      ],
    };
    const activeCategory = getStepCategoryTabEntries(step)[0];

    expect(
      shouldDisplayVariantsAsIndividualForProductGrid.call(
        categoryContext(),
        step,
        activeCategory,
      ),
    ).toBe(true);
  });

  it('keeps category tabs unexpanded when both category and step flags are off', () => {
    const step = {
      displayVariantsAsIndividual: false,
      categories: [
        {
          categoryId: 'cat-collection',
          title: 'Collection',
          displayVariantsAsIndividualProducts: false,
          collections: [{ handle: 'automated-collection' }],
        },
      ],
    };
    const activeCategory = getStepCategoryTabEntries(step)[0];

    expect(
      shouldDisplayVariantsAsIndividualForProductGrid.call(
        categoryContext(),
        step,
        activeCategory,
      ),
    ).toBe(false);
  });

  it('expands multi-variant collection products into selectable variant cards', () => {
    const expanded = expandProductsByVariant([
      {
        id: 'gid://shopify/Product/1',
        title: 'Yellow Sofa',
        imageUrl: 'product.jpg',
        variants: [
          {
            id: 'gid://shopify/ProductVariant/11',
            title: '2 Seater',
            price: '99.99',
            compareAtPrice: '150.00',
            available: true,
          },
          {
            id: 'gid://shopify/ProductVariant/12',
            title: '3 seater',
            price: '169.99',
            available: true,
          },
        ],
      },
    ], true);

    expect(expanded).toMatchObject([
      {
        id: 'gid://shopify/ProductVariant/11',
        title: 'Yellow Sofa',
        variantTitle: '2 Seater',
        price: 9999,
        compareAtPrice: 15000,
        variantId: 'gid://shopify/ProductVariant/11',
        parentProductId: 'gid://shopify/Product/1',
        variants: null,
      },
      {
        id: 'gid://shopify/ProductVariant/12',
        title: 'Yellow Sofa',
        variantTitle: '3 seater',
        price: 16999,
        variantId: 'gid://shopify/ProductVariant/12',
        parentProductId: 'gid://shopify/Product/1',
        variants: null,
      },
    ]);
  });

  it('orders active category products before collection products', () => {
    const products = [
      { id: 'gid://shopify/Product/10', title: 'Other category product' },
      { id: 'gid://shopify/Product/30', title: 'Collection second' },
      { id: 'gid://shopify/Product/20', title: 'Collection first' },
      { id: 'gid://shopify/Product/2', title: 'Manual second' },
      { id: 'gid://shopify/Product/1', title: 'Manual first' },
    ];
    const activeCategory = {
      productIds: ['gid://shopify/Product/1', 'gid://shopify/Product/2'],
      handles: ['automated-collection'],
    };
    const context = {
      extractId: (value: string) => value.match(/(\d+)$/)?.[1] ?? value,
      stepCollectionProductIds: {
        '0:automated-collection': ['gid://shopify/Product/20', 'gid://shopify/Product/30'],
      },
    };

    const ordered = orderProductsForActiveCategory.call(context, products, activeCategory, 0);

    expect(ordered.map((product: { title: string }) => product.title)).toEqual([
      'Manual first',
      'Manual second',
      'Collection first',
      'Collection second',
    ]);
  });

  it('renders the empty state for an active category with no product sources', () => {
    const previousDocument = (global as any).document;
    const grid = {
      className: '',
      innerHTML: '',
      children: [] as any[],
      appendChild(child: any) {
        this.children.push(child);
      },
    };
    (global as any).document = {
      createElement: () => grid,
    };

    const emptyCategory = {
      id: 'cat-empty',
      title: 'Empty Category',
      handles: [],
      productIds: [],
    };
    const context: any = {
      selectedBundle: { steps: [{ categories: [{ categoryId: 'cat-empty', title: 'Empty Category' }] }] },
      stepProductData: [[{ id: 'gid://shopify/Product/1', title: 'Other category product' }]],
      selectedProducts: [{}],
      stepCollectionProductIds: {},
      activeCollectionId: 'cat-empty',
      searchQuery: '',
      extractId: (value: string) => value.match(/(\d+)$/)?.[1] ?? value,
      getActiveStepCategoryEntry: () => emptyCategory,
      shouldDisplayVariantsAsIndividualForProductGrid: () => false,
      expandProductsByVariant: (products: any[]) => products,
      orderProductsForActiveCategory,
      getNoProductsAvailableMessage: () => 'No Products Available',
      createProductCard: () => ({ classList: { add: jest.fn() } }),
    };

    try {
      const result = fullPageProductGridMethods.createFullPageProductGrid.call(context, 0);

      expect(result.innerHTML).toContain('No Products Available');
      expect(result.children).toHaveLength(0);
    } finally {
      (global as any).document = previousDocument;
    }
  });

  it('uses category product variant availability for duplicate grouped step products', () => {
    const merged = mergeCategoryProductVariantAvailability([
      {
        id: 'gid://shopify/Product/1',
        title: 'Fragrance Candle',
        variants: [
          { id: '11', title: 'Cherry', available: true },
          { id: '12', title: 'Peach', available: true },
        ],
      },
    ], {
      categories: [{
        products: [{
          id: 'gid://shopify/Product/1',
          title: 'Fragrance Candle',
          variants: [
            { id: 'gid://shopify/ProductVariant/11', title: 'Cherry', available: true },
            { id: 'gid://shopify/ProductVariant/12', title: 'Peach', available: false },
          ],
        }],
      }],
    });

    expect(merged[0].variants).toEqual([
      expect.objectContaining({ id: '11', available: true }),
      expect.objectContaining({ id: '12', available: false }),
    ]);
  });

  it('hydrates incomplete products from a mixed enriched step payload', async () => {
    const previousWindow = (global as any).window;
    const previousFetch = (global as any).fetch;
    (global as any).window = {
      Shopify: { shop: 'test.myshopify.com', country: 'US' },
      location: { host: 'test.myshopify.com' },
    };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [{
          id: 'gid://shopify/Product/2',
          title: 'Fetched product',
          imageUrl: 'https://cdn.example.test/fetched.jpg',
          price: '42.00',
          variants: [{
            id: 'gid://shopify/ProductVariant/22',
            title: 'Default Title',
            price: '42.00',
            available: true,
          }],
        }],
      }),
    });

    const context: any = {
      selectedBundle: {
        steps: [{
          products: [
            {
              id: 'gid://shopify/Product/1',
              title: 'Cached product',
              featuredImage: { url: 'https://cdn.example.test/cached.jpg' },
              price: 1999,
              variants: [{
                id: 'gid://shopify/ProductVariant/11',
                title: 'Default Title',
                price: 1999,
                available: true,
              }],
            },
            {
              id: 'gid://shopify/Product/2',
              title: 'Incomplete product',
              featuredImage: { url: 'https://cdn.example.test/incomplete.jpg' },
              price: 0,
              variants: [],
            },
          ],
        }],
      },
      stepProductData: [[]],
      stepCollectionProductIds: {},
      selectedProducts: [{}],
      resolveStorefrontApiBase: () => '/apps/product-bundles',
      collectStepProductIds: fullPageSearchCategoryMethods.collectStepProductIds,
      collectStepCollectionHandles: () => [],
      shouldExpandStepProductsDuringLoad: () => false,
      extractId: (id: string) => String(id || '').split('/').pop(),
      isVariantSelectableForInventory: () => true,
      isInventoryTrackingOnAddToCartEnabled: () => false,
      getFirstAvailableVariant: fullPageProductProcessingMethods.getFirstAvailableVariant,
      processProductsForStep: fullPageProductProcessingMethods.processProductsForStep,
      enrichMissingProductDescriptions: async (products: any[]) => products,
      mergeCategoryProductVariantAvailability:
        fullPageProductProcessingMethods.mergeCategoryProductVariantAvailability,
      _mergeDirectDefaultProductsIntoStep: (_stepIndex: number, products: any[]) => products,
    };

    try {
      await fullPageProductProcessingMethods.loadStepProducts.call(context, 0);

      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.stringContaining('gid%3A%2F%2Fshopify%2FProduct%2F2'),
      );
      expect(context.stepProductData[0]).toEqual([
        expect.objectContaining({ id: '1', price: 1999 }),
        expect.objectContaining({ id: '2', price: 4200 }),
      ]);
    } finally {
      (global as any).window = previousWindow;
      (global as any).fetch = previousFetch;
    }
  });

  it('resolves empty-product copy from FPB runtime language settings', () => {
    const overridden = getNoProductsAvailableMessage.call({
      _resolveText: (key: string, fallback: string) => (
        key === 'noProductsAvailable' ? 'Nothing available' : fallback
      ),
    });
    const defaulted = getNoProductsAvailableMessage.call({
      _resolveText: (_key: string, fallback: string) => fallback,
    });

    expect(overridden).toBe('Nothing available');
    expect(defaulted).toBe('No Products Available');
  });

  it('uses the same empty-product copy in modal product rendering', () => {
    const productGrid = { innerHTML: '' };
    const context = {
      stepProductData: [[]],
      selectedProducts: [{}],
      selectedBundle: { steps: [{}] },
      elements: {
        modal: {
          querySelector: (selector: string) => (
            selector === '.product-grid' ? productGrid : null
          ),
        },
      },
      _shouldRenderProductSlots: () => false,
      getNoProductsAvailableMessage: () => 'Nothing available',
    };

    fullPageModalProductMethods.renderModalProducts.call(context, 0);

    expect(productGrid.innerHTML).toContain('Nothing available');
    expect(productGrid.innerHTML).not.toContain(
      'No products available for this step.',
    );
  });
});
