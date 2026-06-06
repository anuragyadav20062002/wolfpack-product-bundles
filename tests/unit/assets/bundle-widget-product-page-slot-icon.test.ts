import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/assets/bundle-widget-product-page.js"),
  "utf8",
);

describe("product-page widget bundle Slot Icon", () => {
  it("renders the bundle-level slot icon in empty slots before falling back to the plus SVG", () => {
    expect(source).toContain("this.selectedBundle?.productSlotIconUrl");
    expect(source).toContain("slotIconImg.src = productSlotIconUrl");
    expect(source).toContain("iconWrapper.appendChild(slotIconImg)");
    expect(source).toContain("iconWrapper.innerHTML = `<svg");
  });
});
