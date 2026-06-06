import fs from "node:fs";
import path from "node:path";

const productPageSource = fs.readFileSync(
  path.join(process.cwd(), "app/assets/bundle-widget-product-page.js"),
  "utf8",
);
const fullPageSource = fs.readFileSync(
  path.join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
  "utf8",
);

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
