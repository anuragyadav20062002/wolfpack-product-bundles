export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageSidePanelMethods } = require('../../../app/assets/widgets/full-page/methods/side-panel-methods.js');

class FakeElement {
  tagName: string;
  className = '';
  innerHTML = '';
  children: FakeElement[] = [];
  dataset: Record<string, string> = {};
  attributes: Record<string, string> = {};
  listeners: Record<string, Array<(event?: { stopPropagation?: () => void }) => unknown>> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get classList() {
    return {
      add: (className: string) => {
        const classes = this.className.split(/\s+/).filter(Boolean);
        if (!classes.includes(className)) {
          this.className = [...classes, className].join(' ');
        }
      },
    };
  }

  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }

  addEventListener(eventName: string, handler: (event?: { stopPropagation?: () => void }) => unknown) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(handler);
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
  }

  click() {
    const event = { stopPropagation: jest.fn() };
    (this.listeners.click || []).forEach((handler) => handler(event));
    return event;
  }
}

function collectButtons(root: FakeElement): FakeElement[] {
  const buttons = root.tagName === 'BUTTON' ? [root] : [];
  root.children.forEach((child) => {
    buttons.push(...collectButtons(child));
  });
  return buttons;
}

describe('FPB Standard sidebar slot tiles', () => {
  beforeEach(() => {
    (global as any).document = {
      createElement: (tagName: string) => new FakeElement(tagName),
    };
  });

  it('renders a remove control for filled product slots and delegates to the summary removal flow', () => {
    const container = document.createElement('div') as unknown as FakeElement;
    const selectedItem = {
      id: 'product-1',
      variantId: 'variant-1',
      title: 'Selected product',
      quantity: 1,
      stepIndex: 0,
    };
    const context = {
      selectedBundle: { productSlotIconUrl: '' },
      getSummarySidebarMaxItemCount: () => 2,
      getSummaryProductDisplayTitle: () => 'Selected product',
      _getSelectedProductImageSrc: () => 'https://cdn.example.com/product.jpg',
      _escapeHTML: (value: string) => value,
      getSummaryProductRemovalState: () => ({ canRemove: true, blockedMessage: '' }),
      removeSummarySelectedProduct: jest.fn(),
    };

    fullPageSidePanelMethods._renderStandardSidebarSlotTiles.call(
      context,
      container,
      [selectedItem],
    );

    const removeButton = collectButtons(container).find((button) =>
      button.attributes['data-action'] === 'remove-selected-product'
    );

    expect(removeButton).toBeDefined();
    const clickEvent = removeButton?.click();

    expect(clickEvent?.stopPropagation).toHaveBeenCalled();
    expect(context.removeSummarySelectedProduct).toHaveBeenCalledWith(
      selectedItem,
      'Selected product',
    );
  });
});
