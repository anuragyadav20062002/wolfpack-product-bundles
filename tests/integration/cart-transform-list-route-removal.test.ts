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

  it("keeps cart-transform API support available", () => {
    expect(exists("app/routes/api/api.cart-transform-heal.tsx")).toBe(true);
    expect(exists("app/routes/api/api.check-cart-transform.tsx")).toBe(true);
  });
});
