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

describe("FPB Enable Quantity Validation EB parity contract", () => {
  it("keeps quantity validation and product slots as separate bundle-level controls", () => {
    const source = fpbRoute;
    expect(source).toContain("const [quantityValidationEnabled, setQuantityValidationEnabled]");
    expect(source).toContain("const [productSlotsEnabled, setProductSlotsEnabled]");

    const block = quantityValidationBlock(source);
    expect(block).toContain("Enable Quantity Validation");
    expect(block).toContain("Maximum allowed quantity per product");
    expect(block).toContain("Product Slots");
    expect(block).toContain("This feature displays empty slots on the storefront.");
    expect(block).toContain("Slot Icon");
    expect(block).toContain("Note: Only applicable when rules are based on quantity");
  });

  it("uses quantityValidationEnabled for the max quantity field and runtime validation payload", () => {
    const source = fpbRoute;
    const block = quantityValidationBlock(source);
    expect(block).toContain("checked={quantityValidationEnabled || undefined}");
    expect(block).toContain("disabled={!quantityValidationEnabled}");
    expect(source).toContain("isEnabled: quantityValidationEnabled");
    expect(source).not.toContain("isEnabled: productSlotsEnabled");
  });
});

describe("PPB Enable Quantity Validation contract", () => {
  it("keeps quantity validation but does not expose FPB Product Slots controls", () => {
    expect(ppbRoute).toContain("const [quantityValidationEnabled, setQuantityValidationEnabled]");
    expect(ppbRoute).not.toContain("const [productSlotsEnabled, setProductSlotsEnabled]");

    const block = quantityValidationBlock(ppbRoute);
    expect(block).toContain("Enable Quantity Validation");
    expect(block).toContain("Maximum allowed quantity per product");
    expect(block).not.toContain("Product Slots");
    expect(block).not.toContain("This feature displays empty slots on the storefront.");
    expect(block).not.toContain("Slot Icon");
    expect(block).not.toContain("Note: Only applicable when rules are based on quantity");
  });

  it("uses quantityValidationEnabled for the max quantity field and runtime validation payload", () => {
    const block = quantityValidationBlock(ppbRoute);
    expect(block).toContain("checked={quantityValidationEnabled || undefined}");
    expect(block).toContain("disabled={!quantityValidationEnabled}");
    expect(ppbRoute).toContain("isEnabled: quantityValidationEnabled");
    expect(ppbRoute).not.toContain("isEnabled: productSlotsEnabled");
  });
});

describe("FPB direct quantity-validation persistence", () => {
  it("parses and persists validateQuantityPerProduct independently from productSlotsEnabled", () => {
    expect(fpbHandler).toContain('const validateQuantityPerProductRaw = formData.get("validateQuantityPerProduct") as string | null');
    expect(fpbHandler).toContain("validateQuantityPerProduct,");
  });
});
