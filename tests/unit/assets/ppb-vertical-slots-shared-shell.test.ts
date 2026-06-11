// eslint-disable-next-line @typescript-eslint/no-require-imports
const { modalSlotTemplateMethods } = require('../../../app/assets/widgets/product-page/templates/modal-slot-template.js');

describe('PPB Vertical Slots shared shell migration', () => {
  let originalDocument: Document | undefined;

  beforeEach(() => {
    originalDocument = global.document;
    global.document = createFakeDocument() as unknown as Document;
  });

  afterEach(() => {
    global.document = originalDocument as Document;
  });

  it('builds vertical modal slot grids through the shared selected-slots wrapper', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const source = fs.readFileSync(path.join(process.cwd(), 'app/assets/widgets/product-page/templates/modal-slot-template.js'), 'utf8');

    expect(source).toContain("import { renderSelectedProductSlots } from '../../shared/components/selected-product-slots.js';");
    expect(source).toContain("mode: isVertical ? 'vertical' : 'horizontal'");
    expect(source).toContain('bw-ppb-modal-slot-grid--simplified');
  });

  it('creates a vertical shared slot wrapper at runtime', () => {
    class ProductPageWidget {
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
    const widget = new ProductPageWidget();
    const section = widget._createModalSlotStepSection({ name: 'Choose first item' });
    const grid = section.querySelector('[data-bw-selected-slots="true"]');

    expect(grid).not.toBeNull();
    expect(grid.className).toContain('bw-selected-slots--mode-vertical');
    expect(grid.className).toContain('bw-ppb-modal-slot-grid--simplified');
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
