export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageDomMethods } = require('../../../app/assets/widgets/product-page/methods/dom-methods.js');

class MockElement {
  children: MockElement[] = [];
  dataset: Record<string, string> = {};
  parentElement: MockElement | null = null;
  nextElementSibling: MockElement | null = null;
  classNames = new Set<string>();
  selectorMatches = new Set<string>();

  classList = {
    add: (value: string) => {
      this.classNames.add(value);
    },
    contains: (value: string) => this.classNames.has(value),
  };

  constructor(selectors: string[] = []) {
    selectors.forEach((selector) => this.selectorMatches.add(selector));
  }

  contains(element: MockElement): boolean {
    if (element === this) return true;
    return this.children.some((child) => child.contains(element));
  }

  insertAdjacentElement(position: string, element: MockElement): void {
    if (position !== 'afterend') return;
    this.nextElementSibling = element;
    element.parentElement = this.parentElement;
  }

  closest(): MockElement | null {
    return this.parentElement;
  }
}

function createMockDocument(productForm: MockElement | null) {
  return {
    querySelector: (selector: string) => (
      productForm?.selectorMatches.has(selector) ? productForm : null
    ),
  };
}

describe('ProductPageDomMethods product-form placement', () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    });
  });

  it('moves the PPB container beside the native product form before bootstrap loading paints', () => {
    const productForm = new MockElement(['form[action*="/cart/add"]']);
    const container = new MockElement();
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: createMockDocument(productForm),
    });

    ProductPageDomMethods._relocateContainerToProductForm.call({
      ...ProductPageDomMethods,
      container,
    });

    expect(productForm.nextElementSibling).toBe(container);
    expect(container.dataset.mountedAfterProductForm).toBe('true');
    expect(container.classList.contains('bundle-widget-container--product-form-mounted')).toBe(true);
  });

  it('leaves placement unchanged when the product form is not available yet', () => {
    const container = new MockElement();
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: createMockDocument(null),
    });

    ProductPageDomMethods._relocateContainerToProductForm.call({
      ...ProductPageDomMethods,
      container,
    });

    expect(container.dataset.mountedAfterProductForm).toBeUndefined();
  });
});
