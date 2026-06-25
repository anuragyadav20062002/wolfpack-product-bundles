// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductCardFooterMethods } = require('../../../app/assets/widgets/full-page/methods/product-card-footer-methods.js');

class FakeClassList {
  private classes: Set<string>;

  constructor(initial = '') {
    this.classes = new Set(initial.split(/\s+/).filter(Boolean));
  }

  contains(name: string) {
    return this.classes.has(name);
  }
}

class FakeButton {
  classList: FakeClassList;
  dataset: Record<string, string>;

  constructor(className: string, productId: string) {
    this.classList = new FakeClassList(className);
    this.dataset = { productId };
  }

  closest(selector: string) {
    return selector === '.inline-qty-btn' ? this : null;
  }
}

class FakeCard {
  private listeners: Record<string, Array<(event: any) => void>> = {};

  addEventListener(eventName: string, listener: (event: any) => void) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(listener);
  }

  dispatchClick(target: FakeButton) {
    const event = {
      target,
      stopPropagation: jest.fn(),
    };
    this.listeners.click[0](event);
    return event;
  }
}

function attachQuantityListener({
  selectedProducts,
  updates,
}: {
  selectedProducts: Array<Record<string, number>>;
  updates: Array<[number, string, number]>;
}) {
  const card = new FakeCard();
  const staleProduct = { id: 'product-1', variantId: 'variant-stale' };

  fullPageProductCardFooterMethods.attachProductCardListeners.call({
    selectedBundle: { steps: [{}] },
    selectedProducts,
    getVariantAvailable: () => ({ available: null, outOfStock: false }),
    updateProductSelection: (stepIndex: number, productId: string, quantity: number) => {
      updates.push([stepIndex, productId, quantity]);
    },
  }, card, staleProduct, 0);

  return card;
}

describe('FPB Standard product-card quantity selector', () => {
  it('decrements using the clicked quantity control product id instead of a stale product object variant id', () => {
    const updates: Array<[number, string, number]> = [];
    const card = attachQuantityListener({
      selectedProducts: [{ 'variant-clicked': 2 }],
      updates,
    });

    const event = card.dispatchClick(new FakeButton('inline-qty-btn qty-decrease', 'variant-clicked'));

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(updates).toEqual([[0, 'variant-clicked', 1]]);
  });

  it('increments using the clicked quantity control product id instead of a stale product object variant id', () => {
    const updates: Array<[number, string, number]> = [];
    const card = attachQuantityListener({
      selectedProducts: [{ 'variant-clicked': 2 }],
      updates,
    });

    card.dispatchClick(new FakeButton('inline-qty-btn qty-increase', 'variant-clicked'));

    expect(updates).toEqual([[0, 'variant-clicked', 3]]);
  });
});
