/**
 * Unit tests for the UnlistedBundleBanner helper + UI contract.
 *
 * Issue: feedback-jun26-6
 * Spec : test-spec/unlisted-bundle-banner.spec.md
 *
 * Note: jest is configured with testEnvironment: 'node' in this repo, so we
 * don't render via testing-library. We unit-test the pure URL helper and
 * lock the JSX contract by reading the component source.
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

  it("renders the Unlisted headline copy", () => {
    expect(source).toContain("Your bundle is Unlisted");
  });

  it("renders a CTA s-button linking to the Shopify product admin", () => {
    expect(source).toMatch(/<s-button[^>]*onClick=\{[^}]*window\.open\(adminUrl/);
  });

  it("uses the warning tone for the banner", () => {
    expect(source).toContain('tone="warning"');
  });
});
