/**
 * Unit tests for the UnlistedBundleBanner helper + UI contract.
 *
 * Issue: feedback-jun26-6
 * Spec : test-spec/unlisted-bundle-banner.spec.md
 *
 * Note: jest is configured with testEnvironment: 'node' in this repo, so we
 * don't render via testing-library. We unit-test the pure URL helper and
 * lock the JSX + configure-route wiring contract by reading source.
 */
import fs from "node:fs";
import path from "node:path";
import { buildShopifyProductAdminUrl } from "../../../app/components/UnlistedBundleBanner";

describe("buildShopifyProductAdminUrl", () => {
  it("converts a full GID and .myshopify shop into an admin product URL", () => {
    expect(buildShopifyProductAdminUrl("s.myshopify.com", "gid://shopify/Product/12345"))
      .toBe("https://admin.shopify.com/store/s/products/12345");
  });

  it("accepts a bare numeric id", () => {
    expect(buildShopifyProductAdminUrl("s.myshopify.com", "12345"))
      .toBe("https://admin.shopify.com/store/s/products/12345");
  });

  it("keeps the shop slug intact when the .myshopify suffix is absent", () => {
    expect(buildShopifyProductAdminUrl("my-store", "gid://shopify/Product/12345"))
      .toBe("https://admin.shopify.com/store/my-store/products/12345");
  });

  it("returns null for null productId", () => {
    expect(buildShopifyProductAdminUrl("s.myshopify.com", null)).toBeNull();
  });

  it("returns null for empty productId", () => {
    expect(buildShopifyProductAdminUrl("s.myshopify.com", "")).toBeNull();
  });
});

describe("UnlistedBundleBanner JSX contract", () => {
  const componentPath = path.join(
    process.cwd(),
    "app/components/UnlistedBundleBanner.tsx",
  );
  const source = fs.readFileSync(componentPath, "utf8");

  it("returns null early when productId is missing", () => {
    expect(source).toMatch(/if\s*\(\s*!\s*adminUrl\s*\)\s*return\s+null/);
  });

  it("renders the translated Unlisted headline copy", () => {
    expect(source).toContain('t("common.unlistedBundle.title")');
  });

  it('renders a "Manage" CTA that delegates navigation to the configure route', () => {
    expect(source).toMatch(/<s-button[^>]*onClick=\{onManage\}/);
    expect(source).toContain('{t("common.actions.manage")}');
    expect(source).not.toContain("window.open");
  });

  it("keeps the existing warning presentation", () => {
    expect(source).toContain('background: "#fff8eb"');
  });
});

describe("UnlistedBundleBanner configure route wiring", () => {
  const routes = [
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ];

  it.each(routes)("passes the existing product-admin navigation callback in %s", (routePath) => {
    const source = fs.readFileSync(path.join(process.cwd(), routePath), "utf8");
    expect(source).toMatch(/<UnlistedBundleBanner[\s\S]*?onManage=\{\(\) => \{[\s\S]*?openProductInAdmin\(productId\);[\s\S]*?\}\}/);
  });
});
