import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT_DIR, relativePath));
}

describe("Cart Transform list route removal", () => {
  it("removes the obsolete Admin cart-transform bundles list route", () => {
    expect(exists("app/routes/app/app.bundles.cart-transform.tsx")).toBe(false);
    expect(exists("app/routes/app/app.bundles.cart-transform/CartTransformBundles.tsx")).toBe(false);
    expect(exists("app/routes/app/app.bundles.cart-transform/action.server.ts")).toBe(false);
    expect(exists("app/routes/app/app.bundles.cart-transform/date-format.ts")).toBe(false);
  });

  it("keeps supported cart-transform API checks and removes storefront self-heal", () => {
    expect(exists("app/routes/api/api.cart-transform-heal.tsx")).toBe(false);
    expect(exists("app/routes/api/api.check-cart-transform.tsx")).toBe(true);
  });

  it("does not schedule cart-transform self-heal from storefront widget sources", () => {
    const sourceFiles = [
      "app/assets/bundle-widget-full-page.js",
      "app/assets/bundle-widget-product-page.js",
      "app/assets/widgets/full-page/methods/analytics-config-methods.js",
      "app/assets/widgets/product-page/methods/config-lifecycle-methods.js",
    ];

    for (const sourceFile of sourceFiles) {
      const source = fs.readFileSync(path.join(ROOT_DIR, sourceFile), "utf8");
      expect(source).not.toContain("cart-transform-heal");
      expect(source).not.toContain("_scheduleCartTransformSelfHeal");
    }
  });
});
