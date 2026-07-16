// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageInpageRenderMethods } = require('../../../app/assets/widgets/product-page/methods/inpage-render-methods.js');

class FakeTarget {
  classList = { toggle: jest.fn() };
  innerHTML = '';
  isConnected = true;
  attributes = new Map<string, string>();

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }
}

describe('PPB in-page empty step loading', () => {
  it('renders a loaded empty step once without starting another product request', async () => {
    const target = new FakeTarget();
    const neverResolves = new Promise<void>(() => {});
    const loadStepProducts = jest.fn()
      .mockResolvedValueOnce(undefined)
      .mockReturnValueOnce(neverResolves);
    const context = {
      stepProductData: [[]],
      selectedBundle: { steps: [{ categories: [{ products: [] }] }] },
      _stepFetchFailed: {},
      _isProductPageCascadeTemplate: () => false,
      _isProductPageGridTemplate: () => true,
      _filterProductsForInpageCategory: (_step: unknown, products: unknown[]) => products,
      expandProductsByVariant: (products: unknown[]) => products,
      activeInpageCategoryIndexes: {},
      _renderInpageStepProducts: ProductPageInpageRenderMethods._renderInpageStepProducts,
      loadStepProducts,
    };

    ProductPageInpageRenderMethods._renderInpageStepProducts.call(context, 0, target);
    await Promise.resolve();
    await Promise.resolve();

    expect(loadStepProducts).toHaveBeenCalledTimes(1);
    expect(target.getAttribute('aria-busy')).toBe('false');
    expect(target.innerHTML).toContain('No products are configured for this step.');
  });
});
