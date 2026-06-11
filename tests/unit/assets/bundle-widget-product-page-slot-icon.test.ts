import { readProductPageWidgetSources } from './widget-source-helpers';

const source = readProductPageWidgetSources();

describe("product-page widget bundle Slot Icon", () => {
  it("renders the bundle-level slot icon in empty slots before falling back to the plus SVG", () => {
    expect(source).toContain("this.selectedBundle?.productSlotIconUrl");
    expect(source).toContain("slotIconImg.src = productSlotIconUrl");
    expect(source).toContain("iconWrapper.appendChild(slotIconImg)");
    expect(source).toContain("iconWrapper.innerHTML = `<svg");
  });
});
