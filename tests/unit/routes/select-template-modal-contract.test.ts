import { readFileSync } from "node:fs";
import { join } from "node:path";

const ppbSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);

const fpbSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);

describe("Select template modal contract", () => {
  it("keeps the captured modal shell and actions in both bundle configure routes", () => {
    for (const source of [ppbSource, fpbSource]) {
      expect(source).toContain("Customization");
      expect(source).toContain("Customize your bundle");
      expect(source).toContain("Choose a design that suits your needs and fits your brand");
      expect(source).toContain("Customize Colors &amp; Language");
      expect(source).toContain('{isSelected ? "Selected" : "Select"}');
      expect(source).toContain("Next");
    }
  });

  it("keeps the captured post-next bundle-ready state in both bundle configure routes", () => {
    for (const source of [ppbSource, fpbSource]) {
      expect(source).toContain("View your bundle");
      expect(source).toContain("View your bundle with your customizations");
      expect(source).toContain("Your bundle is ready");
      expect(source).toContain("Preview it now with your customizations");
      expect(source).toContain("Preview bundle");
    }
  });

  it("keeps the captured FPB template inventory", () => {
    expect(fpbSource).toContain('label: "Standard Design"');
    expect(fpbSource).toContain('label: "Classic Design"');
    expect(fpbSource).toContain('label: "Compact Design"');
    expect(fpbSource).toContain('label: "Horizontal Design"');
  });

  it("keeps the captured PPB template inventory and order", () => {
    const productListIndex = ppbSource.indexOf('label: "Product List"');
    const horizontalSlotsIndex = ppbSource.indexOf('label: "Horizontal Slots"');
    const productGridIndex = ppbSource.indexOf('label: "Product Grid"');
    const verticalSlotsIndex = ppbSource.indexOf('label: "Vertical Slots"');

    expect(productListIndex).toBeGreaterThan(-1);
    expect(horizontalSlotsIndex).toBeGreaterThan(productListIndex);
    expect(productGridIndex).toBeGreaterThan(horizontalSlotsIndex);
    expect(verticalSlotsIndex).toBeGreaterThan(productGridIndex);
  });
});
