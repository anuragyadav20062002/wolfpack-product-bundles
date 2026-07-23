import {
  getBundleEditPath,
  resolveCloneConfigureRedirect,
} from "../../../app/lib/bundle-navigation";

describe("bundle navigation helpers", () => {
  it.each([
    ["full_page", "/app/bundles/full-page-bundle/configure/bundle-123"],
    ["product_page", "/app/bundles/product-page-bundle/configure/bundle-123"],
  ])("builds the %s configure path", (bundleType, expectedPath) => {
    expect(getBundleEditPath("bundle-123", bundleType)).toBe(expectedPath);
  });

  it("uses the configure redirect returned by a successful clone", () => {
    expect(
      resolveCloneConfigureRedirect({
        success: true,
        redirectTo:
          "/app/bundles/full-page-bundle/configure/bundle-456?mode=create",
      }),
    ).toBe(
      "/app/bundles/full-page-bundle/configure/bundle-456?mode=create",
    );
  });

  it.each([
    [{ success: false, redirectTo: "/app/bundles/product-page-bundle/configure/bundle-1" }],
    [{ success: true }],
    [{ success: true, redirectTo: "https://example.com/not-an-app-route" }],
  ])("does not navigate for an invalid clone response", (response) => {
    expect(resolveCloneConfigureRedirect(response)).toBeNull();
  });
});
