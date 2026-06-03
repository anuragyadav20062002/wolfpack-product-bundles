import fs from "node:fs";
import path from "node:path";

const fpbRoute = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);
const ppbRoute = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);
const fpbHandler = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts"),
  "utf8",
);

function quantityValidationBlock(source: string) {
  const start = source.indexOf("Enable Quantity Validation");
  expect(start).toBeGreaterThan(-1);
  return source.slice(start, start + 5000);
}

describe.each([
  ["FPB", fpbRoute],
  ["PPB", ppbRoute],
])("%s Enable Quantity Validation EB parity contract", (_label, source) => {
  it("keeps quantity validation and product slots as separate bundle-level controls", () => {
    expect(source).toContain("const [quantityValidationEnabled, setQuantityValidationEnabled]");
    expect(source).toContain("const [productSlotsEnabled, setProductSlotsEnabled]");

    const block = quantityValidationBlock(source);
    expect(block).toContain("Enable Quantity Validation");
    expect(block).toContain("Maximum allowed quantity per product");
    expect(block).toContain("Product Slots");
    expect(block).toContain("This feature displays empty slots on the storefront.");
    expect(block).toContain("Slot Icon");
    expect(block).toContain("Note: Only applicable when rules are based on quantity");
    expect(block).toContain("Bundles with 3+ products see 24% higher conversion rates when search filters are enabled.");
  });

  it("uses quantityValidationEnabled for the max quantity field and runtime validation payload", () => {
    const block = quantityValidationBlock(source);
    expect(block).toContain("checked={quantityValidationEnabled || undefined}");
    expect(block).toContain("disabled={!quantityValidationEnabled}");
    expect(source).toContain("isEnabled: quantityValidationEnabled");
    expect(source).not.toContain("isEnabled: productSlotsEnabled");
  });
});

describe("FPB direct quantity-validation persistence", () => {
  it("parses and persists validateQuantityPerProduct independently from productSlotsEnabled", () => {
    expect(fpbHandler).toContain('const validateQuantityPerProductRaw = formData.get("validateQuantityPerProduct") as string | null');
    expect(fpbHandler).toContain("validateQuantityPerProduct,");
  });
});
