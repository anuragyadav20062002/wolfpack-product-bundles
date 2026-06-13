import {
  buildBundleProductMediaFileUpdates,
  buildStaleBundleProductMediaReferenceRemovals,
  getBundleProductPlaceholderAlt,
} from "../../../app/lib/bundle-product-media.server";

describe("bundle product media helpers", () => {
  it("builds an empty generated placeholder alt text", () => {
    expect(getBundleProductPlaceholderAlt("Product Page Fixture")).toBe(null);
    expect(getBundleProductPlaceholderAlt("")).toBe(null);
  });

  it("removes historical media and duplicate placeholders while keeping the first placeholder", () => {
    const removals = buildStaleBundleProductMediaReferenceRemovals(
      "gid://shopify/Product/123",
      [
        {
          id: "gid://shopify/MediaImage/old",
          alt: "Old Product",
          image: { url: "https://cdn.shopify.com/files/bundle_abc.png" },
        },
        {
          id: "gid://shopify/MediaImage/current",
          alt: "",
          image: { url: "https://cdn.shopify.com/files/bundle-product-placeholder.avif" },
        },
        {
          id: "gid://shopify/MediaImage/duplicate",
          alt: "",
          image: { url: "https://cdn.shopify.com/files/bundle-product-placeholder.avif" },
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

  it("clears stale placeholder alt text and removes historical media in one file batch", () => {
    const updates = buildBundleProductMediaFileUpdates(
      "gid://shopify/Product/123",
      [
        {
          id: "gid://shopify/MediaImage/current",
          alt: "Product Page Fixture - Bundle",
          image: { url: "https://cdn.shopify.com/files/bundle-product-placeholder.avif" },
        },
        {
          id: "gid://shopify/MediaImage/old",
          alt: "Old Product",
          image: { url: "https://cdn.shopify.com/files/bundle_old.png" },
        },
      ],
      "Product Page Fixture",
    );

    expect(updates).toEqual([
      {
        id: "gid://shopify/MediaImage/current",
        alt: null,
      },
      {
        id: "gid://shopify/MediaImage/old",
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
