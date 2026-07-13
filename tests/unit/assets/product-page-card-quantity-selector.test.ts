export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageSelectionMethods } = require('../../../app/assets/widgets/product-page/methods/selection-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageModalMethods } = require('../../../app/assets/widgets/product-page/methods/modal-methods.js');

class FakeClassList {
  private classes: Set<string>;

  constructor(initial = '') {
    this.classes = new Set(initial.split(/\s+/).filter(Boolean));
  }

  add(...names: string[]) {
    names.forEach(name => this.classes.add(name));
  }

  remove(...names: string[]) {
    names.forEach(name => this.classes.delete(name));
  }

  contains(name: string) {
    return this.classes.has(name);
  }

  toString() {
    return Array.from(this.classes).join(' ');
  }
}

class FakeElement {
  attributes = new Map<string, string>();
  children: FakeElement[] = [];
  classList: FakeClassList;
  dataset: Record<string, string> = {};
  disabled = false;
  parentElement: FakeElement | null = null;
  removed = false;
  style: Record<string, string> = {};
  textContent = '';
  listeners: Record<string, Array<(event: any) => void>> = {};

  constructor(public tagName = 'div', public className = '') {
    this.classList = new FakeClassList(className);
  }

  appendChild(child: FakeElement) {
    child.parentElement = this;
    this.children.push(child);
  }

  addEventListener(eventName: string, listener: (event: any) => void) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(listener);
  }

  cloneNode() {
    return this;
  }

  remove() {
    this.removed = true;
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(child => child !== this);
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  querySelector(selector: string): FakeElement | null {
    if (this.matches(selector)) return this;

    for (const child of this.children) {
      const match = child.querySelector(selector);
      if (match) return match;
    }

    return null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const matches: FakeElement[] = [];
    if (this.matches(selector)) matches.push(this);

    this.children.forEach(child => {
      matches.push(...child.querySelectorAll(selector));
    });

    return matches;
  }

  matches(selector: string): boolean {
    if (selector.startsWith('.')) {
      return this.classList.contains(selector.slice(1));
    }

    const dataProductId = selector.match(/^\[data-product-id="(.+)"\]$/);
    if (dataProductId) {
      return this.dataset.productId === dataProductId[1];
    }

    return false;
  }
}

function createSharedProductCard() {
  const scope = new FakeElement('div');
  const card = new FakeElement('div', 'bw-product-card');
  card.dataset.productId = 'variant-1';

  const action = new FakeElement('div', 'bw-product-card__action product-card-action');
  const addButton = new FakeElement('button', 'bw-product-card__add-button product-add-btn');
  addButton.dataset.productId = 'variant-1';
  addButton.textContent = 'Add +';
  action.appendChild(addButton);
  card.appendChild(action);
  scope.appendChild(card);

  return { scope, card, action, addButton };
}

describe('PPB shared card quantity selector state', () => {
  const originalDocument = global.document;

  afterEach(() => {
    global.document = originalDocument;
  });

  it('replaces the add button with inline quantity controls when a shared card is selected', () => {
    const { scope, card, action, addButton } = createSharedProductCard();
    global.document = {
      createElement(tagName: string) {
        return new FakeElement(tagName);
      },
    } as unknown as Document;

    ProductPageSelectionMethods.updateProductQuantityDisplay.call({
      container: scope,
      elements: {
        modal: {
          classList: { contains: () => false },
        },
      },
      selectedBundle: {},
      _resolveText: (_key: string, fallback: string) => fallback,
      getVariantAvailable: () => ({ available: null, outOfStock: false }),
    }, 0, 'variant-1', 2);

    const quantityControls = action.querySelector('.inline-quantity-controls');
    const quantityDisplay = action.querySelector('.inline-qty-display');

    expect(addButton.removed).toBe(true);
    expect(quantityControls).not.toBeNull();
    expect(quantityDisplay?.textContent).toBe('2');
    expect(card.classList.contains('bw-product-card--selected')).toBe(true);
  });

  it('delegates inline quantity button clicks to the quantity update path', () => {
    const productGrid = new FakeElement('div');
    const parent = {
      replaceChild: jest.fn(),
    };
    (productGrid as any).parentNode = parent;
    const updates: Array<[number, string, number]> = [];

    ProductPageModalMethods.attachProductEventHandlers.call({
      selectedBundle: { steps: [{}] },
      stepProductData: [[]],
      findProductBySelectionKey: () => null,
      getSelectedQuantity: () => 1,
      updateProductSelection: (stepIndex: number, productId: string, quantity: number) => {
        updates.push([stepIndex, productId, quantity]);
      },
    }, productGrid, 0);

    const increaseButton = new FakeElement('button', 'inline-qty-btn qty-increase');
    increaseButton.dataset.productId = 'variant-1';
    const clickEvent = {
      target: increaseButton,
      stopPropagation: jest.fn(),
    };

    productGrid.listeners.click[0](clickEvent);

    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    expect(updates).toEqual([[0, 'variant-1', 2]]);
  });
});
