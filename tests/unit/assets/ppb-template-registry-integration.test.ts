// eslint-disable-next-line @typescript-eslint/no-require-imports
const { cogniveTemplateMethods } = require('../../../app/assets/widgets/product-page/templates/cognive-template.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { modalSlotTemplateMethods } = require('../../../app/assets/widgets/product-page/templates/modal-slot-template.js');

export {};

describe('PPB template registry integration', () => {
  it('uses the registry resolver for Cognive/Grid detection', () => {
    class ProductPageWidget {
      _getProductPageTemplateType() {
        return 'PDP_INPAGE';
      }

      _getProductPageDesignPreset() {
        return 'COGNIVE';
      }
    }

    Object.assign(ProductPageWidget.prototype, cogniveTemplateMethods);
    const widget = new ProductPageWidget() as any;

    expect(widget._isProductPageGridTemplate()).toBe(true);
    expect(widget._isProductPageCogniveTemplate()).toBe(true);
  });

  it('uses the registry resolver for modal vertical slot detection', () => {
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

    expect(widget._isProductPageModalSlotTemplate()).toBe(true);
    expect(widget._usesVerticalModalSlotLayout()).toBe(true);

    widget.selectedBundle.renderFilledSlotsAsHorizontalStacked = true;
    expect(widget._usesVerticalModalSlotLayout()).toBe(false);
  });

  it('wires Cascade/List detection to the registry resolver', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const source = fs.readFileSync(path.join(process.cwd(), 'app/assets/widgets/product-page/templates/cascade-template.js'), 'utf8');

    expect(source).toContain('resolveProductPageTemplateConfig');
    expect(source).not.toContain('attachProductPageTemplateMethods');
    expect(source).toContain("config?.id === 'LIST'");
  });
});
