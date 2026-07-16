export {};

(globalThis as any).window = {
  Shopify: { currency: { active: 'USD', format: '$ {{amount}}' } },
  shopMoneyFormat: '$ {{amount}}',
};
(globalThis as any).getComputedStyle = () => ({ getPropertyValue: () => '' });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { modalSlotTemplateMethods } = require('../../../app/assets/widgets/product-page/templates/modal-slot-template.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageInpageRenderMethods } = require('../../../app/assets/widgets/product-page/methods/inpage-render-methods.js');

describe('PPB modal slot keyboard access', () => {
  let originalDocument: Document | undefined;

  beforeEach(() => {
    originalDocument = global.document;
    global.document = createFakeDocument() as unknown as Document;
  });

  afterEach(() => {
    global.document = originalDocument as Document;
  });

  it('renders empty slots as labelled native controls', () => {
    const widget = createWidget();
    const card = widget.createEmptyStateCard({ name: 'Choose earrings' }, 0, 1);

    expect(card.tagName).toBe('BUTTON');
    expect(card.type).toBe('button');
    expect(card.children.at(-1)?.textContent).toBe('Product 2');

    card.dispatch('click', {});

    expect(widget.openModal).toHaveBeenCalledWith(0);
  });

  it.each(['Enter', ' '])('reopens a filled slot with the %p key', (key) => {
    const widget = createWidget();
    const card = widget.createSelectedProductCard({
      product: { title: 'Obsidian Earrings', imageUrl: '/earrings.jpg' },
      stepIndex: 0,
      step: { name: 'Choose earrings' },
      variantId: 'variant-1',
      instanceIndex: 0,
    }, 0);
    const preventDefault = jest.fn();

    card.dispatch('keydown', { key, preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(widget.openModal).toHaveBeenCalledWith(0);
  });

  it('exposes the filled-slot remove action as a labelled native control', () => {
    const widget = createWidget();
    const card = widget.createSelectedProductCard({
      product: { title: 'Obsidian Earrings', imageUrl: '/earrings.jpg' },
      stepIndex: 0,
      step: { name: 'Choose earrings' },
      variantId: 'variant-1',
      instanceIndex: 0,
    }, 0);
    const remove = card.children[0];
    const stopPropagation = jest.fn();

    expect(remove.tagName).toBe('BUTTON');
    expect(remove.type).toBe('button');
    expect(remove.getAttribute('aria-label')).toBe('Remove this product');

    remove.dispatch('click', { stopPropagation });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(widget.removeProductFromSelection).toHaveBeenCalledWith(0, 'variant-1');
  });
});

function createWidget() {
  const widget = {
    selectedBundle: {
      renderFilledSlotsAsHorizontalStacked: true,
    },
    _getProductPageTemplateType: () => 'PDP_MODAL',
    _getProductPageDesignPreset: () => 'MODAL',
    openModal: jest.fn(),
  } as any;
  Object.assign(widget, modalSlotTemplateMethods, ProductPageInpageRenderMethods);
  widget.removeProductFromSelection = jest.fn();
  return widget;
}

function createFakeDocument() {
  return {
    documentElement: {},
    createElement: (tagName: string) => createFakeElement(tagName),
  };
}

function createFakeElement(tagName: string) {
  const attributes = new Map<string, string>();
  const listeners = new Map<string, (event: any) => void>();
  return {
    tagName: tagName.toUpperCase(),
    type: '',
    tabIndex: -1,
    className: '',
    textContent: '',
    title: '',
    innerHTML: '',
    children: [] as any[],
    dataset: {} as Record<string, string>,
    style: { setProperty: jest.fn() },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
    getAttribute(name: string) {
      return attributes.get(name) ?? null;
    },
    appendChild(child: any) {
      this.children.push(child);
      return child;
    },
    addEventListener(name: string, listener: (event: any) => void) {
      listeners.set(name, listener);
    },
    dispatch(name: string, event: any) {
      listeners.get(name)?.(event);
    },
  };
}
