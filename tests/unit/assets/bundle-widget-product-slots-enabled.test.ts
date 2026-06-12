import { readFullPageWidgetSources, readProductPageWidgetSources } from './widget-source-helpers';

const productPageSource = readProductPageWidgetSources();
const fullPageSource = readFullPageWidgetSources();

describe("storefront Product Slots bundle setting", () => {
  it("PPB does not read the FPB-only productSlotsEnabled setting", () => {
    expect(productPageSource).not.toContain("this.selectedBundle?.productSlotsEnabled === true");
    expect(productPageSource).not.toContain("this._shouldRenderProductSlots()");
    expect(productPageSource).not.toContain("if (this._shouldRenderProductSlots())");
  });

  it("FPB reads productSlotsEnabled before rendering empty state cards", () => {
    expect(fullPageSource).toContain("this.selectedBundle?.productSlotsEnabled === true");
    expect(fullPageSource).toContain("this._shouldRenderProductSlots()");
    expect(fullPageSource).toContain("if (!this._shouldRenderProductSlots())");
  });

  it("FPB uses Product Slots state for compact sidebar slot layout", () => {
    expect(fullPageSource).toContain("getSummarySidebarEmptyStateMode()");
    expect(fullPageSource).toContain("full-page-side-panel--inline-slots");
    expect(fullPageSource).toContain("side-panel-products--skeleton-list");
  });
});
