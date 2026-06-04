import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Bundle checkout UI contract", () => {
  const source = readFileSync(
    join(process.cwd(), "extensions/bundle-checkout-ui/src/Checkout.tsx"),
    "utf8",
  );

  it("renders custom bundle component rows with product thumbnails", () => {
    expect(source).toContain("imageUrl");
    expect(source).toContain("<s-product-thumbnail");
    expect(source).toContain('size="base"');
  });

  it("does not render a redundant Bundle (n items) custom summary line", () => {
    expect(source).not.toContain("Bundle ({componentCount} items)");
  });

  it("keeps non-bundle checkout lines untouched", () => {
    expect(source).toContain("const isBundleParent = getAttr('_is_bundle_parent') === 'true';");
    expect(source).toContain("if (!isBundleParent) {");
    expect(source).toContain("return null;");
  });
});
