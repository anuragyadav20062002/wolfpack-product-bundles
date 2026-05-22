import { createHmac } from "node:crypto";
import { verifyAppProxyRequest } from "../../../app/lib/app-proxy.server";

function signedProxyUrl(overrides: Record<string, string> = {}) {
  const params = new URLSearchParams({
    shop: "test-shop.myshopify.com",
    path_prefix: "/apps/product-bundles",
    timestamp: "1770000000",
    ...overrides,
  });

  const groupedParams = new Map<string, string[]>();

  for (const [key, value] of params.entries()) {
    if (key === "signature") continue;
    const values = groupedParams.get(key) ?? [];
    values.push(value);
    groupedParams.set(key, values);
  }

  const message = [...groupedParams.entries()]
    .map(([key, values]) => `${key}=${values.join(",")}`)
    .sort()
    .join("");

  params.set(
    "signature",
    createHmac("sha256", "test_api_secret").update(message).digest("hex"),
  );

  return new URL(`https://test-shop.myshopify.com/apps/product-bundles/wpb/bundle-1?${params.toString()}`);
}

describe("verifyAppProxyRequest", () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;

  beforeEach(() => {
    process.env.SHOPIFY_API_SECRET = "test_api_secret";
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it("returns the shop domain for a valid Shopify app proxy signature", () => {
    expect(verifyAppProxyRequest(signedProxyUrl())).toBe("test-shop.myshopify.com");
  });

  it("accepts Shopify's documented duplicate-param signing shape", () => {
    process.env.SHOPIFY_API_SECRET = "hush";

    const url = new URL(
      "https://proxy-domain.com/proxy/extra/path/components?extra=1&extra=2&shop={shop}.myshopify.com&logged_in_customer_id=1&path_prefix=%2Fapps%2Fawesome_reviews&timestamp=1317327555&signature=e71d571c0a35d531ae367189d59afd33ae5b56be274c77c9e8bd6ce42e256304",
    );

    expect(verifyAppProxyRequest(url)).toBe("{shop}.myshopify.com");
  });

  it("returns null when the signature is invalid", () => {
    const url = signedProxyUrl();
    url.searchParams.set("signature", "bad-signature");

    expect(verifyAppProxyRequest(url)).toBeNull();
  });

  it("returns null when required proxy params are missing", () => {
    const url = signedProxyUrl();
    url.searchParams.delete("shop");

    expect(verifyAppProxyRequest(url)).toBeNull();
  });
});
