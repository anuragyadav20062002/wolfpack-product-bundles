import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Product Page Select Template card order", () => {
  it("matches the captured EB template order", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
      "utf8",
    );

    const productListIndex = source.indexOf('label: "Product List"');
    const horizontalSlotsIndex = source.indexOf('label: "Horizontal Slots"');
    const productGridIndex = source.indexOf('label: "Product Grid"');
    const verticalSlotsIndex = source.indexOf('label: "Vertical Slots"');

    expect(productListIndex).toBeGreaterThan(-1);
    expect(horizontalSlotsIndex).toBeGreaterThan(productListIndex);
    expect(productGridIndex).toBeGreaterThan(horizontalSlotsIndex);
    expect(verticalSlotsIndex).toBeGreaterThan(productGridIndex);
  });
});
