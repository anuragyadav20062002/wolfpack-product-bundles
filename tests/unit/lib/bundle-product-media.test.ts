import {
  buildStaleBundleProductMediaReferenceRemovals,
  getBundleProductPlaceholderAlt,
} from "../../../app/lib/bundle-product-media.server";

describe("bundle product media helpers", () => {
  it("builds the generated placeholder alt text", () => {
    expect(getBundleProductPlaceholderAlt("Product Page Fixture")).toBe(
      "Product Page Fixture - Bundle",
    );
    expect(getBundleProductPlaceholderAlt("")).toBe("Bundle - Bundle");
  });

  it("removes historical media and duplicate placeholders while keeping the first placeholder", () => {
    const removals = buildStaleBundleProductMediaReferenceRemovals(
      "gid://shopify/Product/123",
      [
        {
          id: "gid://shopify/MediaImage/old",
          alt: "Old Product - Bundle",
          image: { url: "https://cdn.shopify.com/files/bundle_abc.png" },
        },
        {
          id: "gid://shopify/MediaImage/current",
          alt: "Product Page Fixture - Bundle",
          image: { url: "https://cdn.shopify.com/files/bundle-product-placeholder.png" },
        },
        {
          id: "gid://shopify/MediaImage/duplicate",
          alt: "Product Page Fixture - Bundle",
          image: { url: "https://cdn.shopify.com/files/bundle-product-placeholder.png" },
        },
      ],
      "Product Page Fixture",
    );

    expect(removals).toEqual([
      {
        id: "gid://shopify/MediaImage/old",
        referencesToRemove: ["gid://shopify/Product/123"],
      },
      {
        id: "gid://shopify/MediaImage/duplicate",
        referencesToRemove: ["gid://shopify/Product/123"],
      },
    ]);
  });

  it("does not remove media until a placeholder media record exists", () => {
    expect(
      buildStaleBundleProductMediaReferenceRemovals(
        "gid://shopify/Product/123",
        [{ id: "gid://shopify/MediaImage/old", alt: "Old", image: { url: "https://cdn.shopify.com/files/old.png" } }],
        "Product Page Fixture",
      ),
    ).toEqual([]);
  });
});
