// eslint-disable-next-line @typescript-eslint/no-require-imports
const { modalSlotTemplateMethods } = require('../../../app/assets/widgets/product-page/templates/modal-slot-template.js');

export {};

describe('PPB Vertical Slots shared shell migration', () => {
  let originalDocument: Document | undefined;

  beforeEach(() => {
    originalDocument = global.document;
    global.document = createFakeDocument() as unknown as Document;
  });

  afterEach(() => {
    global.document = originalDocument as Document;
  });

  it('creates a vertical shared slot wrapper at runtime', () => {
    class ProductPageWidget {
      selectedBundle: { renderFilledSlotsAsHorizontalStacked: boolean };

      constructor() {
        this.selectedBundle = { renderFilledSlotsAsHorizontalStacked: false };
      }

      _getProductPageTemplateType() {
        return 'PDP_MODAL';
      }

      _getProductPageDesignPreset() {
        return 'MODAL';
      }
    }

    Object.assign(ProductPageWidget.prototype, modalSlotTemplateMethods);
    const widget = new ProductPageWidget() as any;
    const section = widget._createModalSlotStepSection({ name: 'Choose first item' });
    const grid = section.querySelector('[data-bw-selected-slots="true"]');

    expect(grid).not.toBeNull();
  });
});

function createFakeDocument() {
  return {
    createElement: (tagName: string) => createFakeElement(tagName),
  };
}

function createFakeElement(tagName: string) {
  const element = {
    tagName: tagName.toUpperCase(),
    className: '',
    textContent: '',
    children: [] as any[],
    firstElementChild: null as any,
    appendChild(child: any) {
      this.children.push(child);
      return child;
    },
    matches(selector: string) {
      return selector === '[data-bw-selected-slots="true"]'
        && this.dataset?.bwSelectedSlots === 'true';
    },
    querySelector(selector: string): any {
      for (const child of this.children) {
        if (child.matches?.(selector)) return child;
        const found = child.querySelector?.(selector);
        if (found) return found;
      }
      return null;
    },
    dataset: {} as Record<string, string>,
    set innerHTML(value: string) {
      const child = createFakeElement('div');
      const classMatch = value.match(/class="([^"]+)"/);
      child.className = classMatch?.[1] || '';
      if (value.includes('data-bw-selected-slots="true"')) {
        child.dataset.bwSelectedSlots = 'true';
      }
      this.firstElementChild = child;
    },
  };

  return element;
}
