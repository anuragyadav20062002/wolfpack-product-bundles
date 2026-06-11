import { readFullPageWidgetSources, readProductPageWidgetSources } from './widget-source-helpers';

const productPageSource = readProductPageWidgetSources();
const fullPageSource = readFullPageWidgetSources();

describe("storefront Product Slots bundle setting", () => {
  it("PPB reads productSlotsEnabled before rendering empty slot cards", () => {
    expect(productPageSource).toContain("this.selectedBundle?.productSlotsEnabled === true");
    expect(productPageSource).toContain("this._shouldRenderProductSlots()");
    expect(productPageSource).toContain("if (this._shouldRenderProductSlots())");
  });

  it("FPB reads productSlotsEnabled before rendering empty state cards", () => {
    expect(fullPageSource).toContain("this.selectedBundle?.productSlotsEnabled === true");
    expect(fullPageSource).toContain("this._shouldRenderProductSlots()");
    expect(fullPageSource).toContain("if (!this._shouldRenderProductSlots())");
  });
});
