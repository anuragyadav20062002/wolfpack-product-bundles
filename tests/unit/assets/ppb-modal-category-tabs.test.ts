// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  getModalSoleVariantDisplayTitle,
  ProductPageModalMethods,
} = require('../../../app/assets/widgets/product-page/methods/modal-methods.js');

export {};

describe('PPB modal category tabs', () => {
  it('renders multi-category controls and rerenders the active category', () => {
    const categoryTabs = createElement();
    const renderModalProducts = jest.fn();
    const widget = {
      currentStepIndex: 0,
      activeInpageCategoryIndexes: {},
      selectedBundle: {
        steps: [{
          categories: [
            { name: 'Category 1' },
            { title: 'Category 2 Long Label' },
          ],
        }],
      },
      elements: {
        modal: {
          querySelector: (selector: string) => selector === '.bw-bs-category-tabs'
            ? categoryTabs
            : null,
        },
      },
      renderModalProducts,
      _getInpageCategoryLabel: (_category: unknown, index: number) => index === 0
        ? 'Category 1'
        : 'Category 2 Long Label',
    } as any;
    Object.assign(widget, ProductPageModalMethods);
    widget.renderModalProducts = renderModalProducts;

    widget.renderModalCategoryTabs();

    expect(categoryTabs.hidden).toBe(false);
    expect(categoryTabs.children.map((button: any) => button.textContent)).toEqual([
      'Category 1',
      'Category 2 Long Label',
    ]);
    expect(categoryTabs.children[0].classList.contains('active')).toBe(true);

    categoryTabs.children[1].click();

    expect(widget.activeInpageCategoryIndexes[0]).toBe(1);
    expect(categoryTabs.children[1].classList.contains('active')).toBe(true);
    expect(renderModalProducts).toHaveBeenCalledWith(0);
  });

  it('hides redundant controls for a single-category step', () => {
    const categoryTabs = createElement();
    const widget = {
      currentStepIndex: 0,
      activeInpageCategoryIndexes: {},
      selectedBundle: { steps: [{ categories: [{ name: 'Only category' }] }] },
      elements: { modal: { querySelector: () => categoryTabs } },
    } as any;
    Object.assign(widget, ProductPageModalMethods);

    widget.renderModalCategoryTabs();

    expect(categoryTabs.hidden).toBe(true);
    expect(categoryTabs.children).toHaveLength(0);
  });

  it('filters modal products through the active category contract', () => {
    const step = {
      categories: [
        { name: 'One', displayVariantsAsIndividualProducts: true },
        { name: 'Two', displayVariantsAsIndividualProducts: false },
      ],
    };
    const products = [{ id: 'product-1' }, { id: 'product-2' }];
    const productGrid = { innerHTML: '' };
    const body = { querySelector: () => null };
    const filterProducts = jest.fn(() => []);
    const expandProductsByVariant = jest.fn((items: unknown[]) => items);
    const widget = {
      currentStepIndex: 0,
      activeInpageCategoryIndexes: { 0: 1 },
      selectedBundle: { steps: [step] },
      stepProductData: [products],
      selectedProducts: [{}],
      elements: {
        modal: {
          querySelector: (selector: string) => {
            if (selector === '.product-grid') return productGrid;
            if (selector === '.bw-bs-body') return body;
            return null;
          },
        },
      },
      _filterProductsForInpageCategory: filterProducts,
      expandProductsByVariant,
      config: {},
      _stepFetchFailed: {},
    } as any;
    Object.assign(widget, ProductPageModalMethods);
    widget._filterProductsForInpageCategory = filterProducts;

    widget.renderModalProducts(0);

    expect(filterProducts).toHaveBeenCalledWith(step, products, 0);
    expect(expandProductsByVariant).not.toHaveBeenCalled();
    expect(productGrid.innerHTML).toContain('No products are configured');
  });

  it('expands modal variants when the active category enables individual cards', () => {
    const step = {
      categories: [{ name: 'One', displayVariantsAsIndividualProducts: true }],
    };
    const products = [{ id: 'product-1' }];
    const productGrid = { innerHTML: '' };
    const expandProductsByVariant = jest.fn(() => []);
    const widget = {
      currentStepIndex: 0,
      activeInpageCategoryIndexes: { 0: 0 },
      selectedBundle: { steps: [step] },
      stepProductData: [products],
      selectedProducts: [{}],
      elements: {
        modal: {
          querySelector: (selector: string) => {
            if (selector === '.product-grid') return productGrid;
            if (selector === '.bw-bs-body') return { querySelector: () => null };
            return null;
          },
        },
      },
      _filterProductsForInpageCategory: (_step: unknown, items: unknown[]) => items,
      expandProductsByVariant,
      config: {},
      _stepFetchFailed: {},
    } as any;
    Object.assign(widget, ProductPageModalMethods);
    widget.expandProductsByVariant = expandProductsByVariant;

    widget.renderModalProducts(0);

    expect(expandProductsByVariant).toHaveBeenCalledWith(products);
  });
});

describe('PPB modal mixed-inventory variant identity', () => {
  it('shows the sole named survivor when inventory filtering removed sibling variants', () => {
    expect(getModalSoleVariantDisplayTitle({
      sourceVariantCount: 3,
      variants: [{ title: 'Grapefruit' }],
    })).toBe('Grapefruit');
  });

  it('does not show redundant variant copy for default-only products', () => {
    expect(getModalSoleVariantDisplayTitle({
      sourceVariantCount: 3,
      variants: [{ title: 'Default Title' }],
    })).toBe('');
  });

  it('does not add a survivor label to products that were always single-variant', () => {
    expect(getModalSoleVariantDisplayTitle({
      sourceVariantCount: 1,
      variants: [{ title: 'Grapefruit' }],
    })).toBe('');
  });
});

function createElement() {
  const classes = new Set<string>();
  const element = {
    hidden: false,
    textContent: '',
    children: [] as any[],
    className: '',
    dataset: {} as Record<string, string>,
    classList: {
      add: (...names: string[]) => names.forEach(name => classes.add(name)),
      remove: (...names: string[]) => names.forEach(name => classes.delete(name)),
      toggle: (name: string, force?: boolean) => {
        if (force === true) classes.add(name);
        else if (force === false) classes.delete(name);
        else if (classes.has(name)) classes.delete(name);
        else classes.add(name);
      },
      contains: (name: string) => classes.has(name),
    },
    appendChild(child: any) {
      this.children.push(child);
      return child;
    },
    querySelectorAll(selector: string) {
      return selector === '.bw-bs-category-tab' ? this.children : [];
    },
    addEventListener(_name: string, handler: () => void) {
      this.click = handler;
    },
    click: () => {},
  };
  (element as any).ownerDocument = { createElement: () => createElement() };
  return element;
}
