// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  fullPageSearchCategoryMethods,
} = require('../../../app/assets/widgets/full-page/methods/search-category-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  fullPageProductGridMethods,
} = require('../../../app/assets/widgets/full-page/methods/product-grid-methods.js');

describe('Full Page widget category hydration behavior', () => {
  const getStepCategoryTabEntries = fullPageSearchCategoryMethods.getStepCategoryTabEntries;
  const shouldDisplayVariantsAsIndividualForProductGrid =
    fullPageSearchCategoryMethods.shouldDisplayVariantsAsIndividualForProductGrid;
  const expandProductsByVariant = fullPageProductGridMethods.expandProductsByVariant;

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

  it('inherits the FPB step-level variant display flag for category tabs', () => {
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
});
