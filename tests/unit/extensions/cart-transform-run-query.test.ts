import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Cart Transform input query", () => {
  const query = readFileSync(
    join(process.cwd(), "extensions/bundle-cart-transform-rs/src/run.graphql"),
    "utf8",
  );
  const normalizedQuery = query.replace(/\s+/g, " ");

  it.each([
    ["component_parents", "component_parents"],
    ["component_reference", "component_reference"],
    ["component_quantities", "component_quantities"],
    ["price_adjustment", "price_adjustment"],
    ["component_pricing", "component_pricing"],
  ])("queries app-owned %s metafield with the app namespace", (_label, key) => {
    expect(normalizedQuery).toContain(`metafield(namespace: "$app", key: "${key}")`);
  });

  it("queries cart-transform owner settings with the app namespace", () => {
    expect(query).toMatch(
      /bundleCartLineMessaging:\s*metafield\(namespace:\s*"\$app",\s*key:\s*"bundle_cart_line_messaging"\)/,
    );
    expect(query).toMatch(
      /runtimeTokenSecret:\s*metafield\(namespace:\s*"\$app",\s*key:\s*"runtime_token_secret"\)/,
    );
  });

  it("groups merge lines from EB public cart attributes instead of private bundle IDs", () => {
    expect(normalizedQuery).toContain('wolfpackProductBundleOfferId: attribute(key: "_wolfpackProductBundle:OfferId")');
    expect(normalizedQuery).toContain('wolfpackProductBundleName: attribute(key: "_bundleName")');
    expect(normalizedQuery).toContain('runtimeToken: attribute(key: "_wolfpack_bundle_runtime")');
    expect(normalizedQuery).not.toContain('attribute(key: "_bundle_id")');
    expect(normalizedQuery).not.toContain('attribute(key: "_bundle_name")');
  });
});
