import { readProductPageWidgetSources } from './widget-source-helpers';

const source = readProductPageWidgetSources();

describe("product-page widget bundle Slot Icon", () => {
  it("does not read the FPB-only bundle-level Slot Icon setting", () => {
    expect(source).not.toContain("this.selectedBundle?.productSlotIconUrl");
    expect(source).not.toContain("slotIconImg.src = productSlotIconUrl");
    expect(source).not.toContain("iconWrapper.appendChild(slotIconImg)");
    expect(source).toContain("iconWrapper.innerHTML = `<svg");
  });
});
