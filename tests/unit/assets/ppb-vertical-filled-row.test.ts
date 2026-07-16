// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveSelectedSlotTitle } = require('../../../app/assets/widgets/product-page/methods/inpage-render-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageInpageRenderMethods } = require('../../../app/assets/widgets/product-page/methods/inpage-render-methods.js');

describe('SelectedSlotTitle', () => {
  const longTitle = '14k Dangling Obsidian Earrings';

  it('keeps the full title for Vertical Slots', () => {
    expect(resolveSelectedSlotTitle(longTitle, true)).toBe(longTitle);
  });

  it('preserves compact titles for other templates', () => {
    expect(resolveSelectedSlotTitle(longTitle, false)).toBe('14k Dangling Obsidian Ear...');
  });

  it('keeps short titles unchanged', () => {
    expect(resolveSelectedSlotTitle('Short title', true)).toBe('Short title');
    expect(resolveSelectedSlotTitle('Short title', false)).toBe('Short title');
  });

  it('opens a filled exact-one slot so the selected product can be replaced', () => {
    const originalDocument = global.document;
    global.document = createFakeDocument() as unknown as Document;
    const openModal = jest.fn();

    try {
      const widget = {
        selectedBundle: {
          steps: [{ conditionValue: 1, conditionOperator: 'equal_to' }],
        },
        _usesVerticalModalSlotLayout: () => true,
        openModal,
        removeProductFromSelection: jest.fn(),
      };
      const card = ProductPageInpageRenderMethods.createSelectedProductCard.call(widget, {
        product: { title: longTitle, imageUrl: 'https://cdn.example.test/product.jpg' },
        stepIndex: 0,
        step: {},
        variantId: 'variant-1',
        instanceIndex: 0,
      }, 0);

      card.dispatch('click');
      expect(openModal).toHaveBeenCalledWith(0);
    } finally {
      global.document = originalDocument;
    }
  });
});

function createFakeDocument() {
  return {
    createElement: (tagName: string) => createFakeElement(tagName),
  };
}

function createFakeElement(tagName: string) {
  const listeners: Record<string, (event: { stopPropagation: () => void }) => void> = {};
  const attributes = new Map<string, string>();
  return {
    tagName: tagName.toUpperCase(),
    className: '',
    dataset: {} as Record<string, string>,
    children: [] as any[],
    appendChild(child: any) {
      this.children.push(child);
      return child;
    },
    addEventListener(name: string, handler: typeof listeners[string]) {
      listeners[name] = handler;
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
    dispatch(name: string) {
      listeners[name]?.({ stopPropagation: () => {} });
    },
    set innerHTML(_value: string) {},
    textContent: '',
    title: '',
    src: '',
    alt: '',
  };
}
