import { readPpbConfigureRouteFamilySource } from "./ppb-configure-route-source";

describe("Product Page Place Widget copy", () => {
  it("uses the captured EB top-card action text without extra glyphs", () => {
    const source = readPpbConfigureRouteFamilySource();

    expect(source).toContain("Take your bundle live");
    expect(source).toContain("Place on theme");
    expect(source).toContain("Place Widget");
    expect(source).not.toContain("Place Widget ↗");
  });
});
