import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
  "utf8",
);
const modalSource = readFileSync(
  path.join(process.cwd(), "app/assets/bundle-modal-component.js"),
  "utf8",
);

describe("FPB runtime config surface", () => {
  it("does not emit text banner defaults for image-only FPB banners", () => {
    expect(source).not.toContain("promoBannerSubtitle");
    expect(source).not.toContain("promoBannerTagline");
    expect(source).not.toContain("promoBannerNote");
    expect(source).not.toContain("Mix & Match");
    expect(source).not.toContain("Create Your Perfect Bundle");
    expect(source).not.toContain("Mix & Match Your Favorites");
  });

  it("does not expose modal quantity selector config for FPB templates", () => {
    expect(source).not.toContain("showQuantitySelectorInModal");
    expect(modalSource).not.toContain("showQuantitySelectorInModal");
  });

  it("does not expose promo banner crop runtime logic", () => {
    expect(source).not.toContain("promoBannerBgImageCrop");
    expect(source).not.toContain("cropRaw");
    expect(source).not.toContain("crop.width");
  });
});
