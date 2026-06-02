interface UnlistedBundleBannerProps {
  shop: string;
  bundleProductId: string | null;
  onManage: () => void;
}

export function buildShopifyProductAdminUrl(
  shop: string,
  productId: string | null,
): string | null {
  if (!productId) return null;
  const numericId = productId.includes("gid://shopify/Product/")
    ? productId.split("/").pop()
    : productId;
  if (!numericId) return null;
  const storeSlug = shop.replace(/\.myshopify\.com$/, "");
  return `https://admin.shopify.com/store/${storeSlug}/products/${numericId}`;
}

export function UnlistedBundleBanner({ shop, bundleProductId, onManage }: UnlistedBundleBannerProps) {
  const adminUrl = buildShopifyProductAdminUrl(shop, bundleProductId);
  if (!adminUrl) return null;

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        margin: "0 0 12px",
        border: "1px solid #ffd79d",
        borderRadius: 8,
        background: "#fff8eb",
      }}
      suppressHydrationWarning
    >
      <span
        aria-hidden="true"
        style={{
          display: "grid",
          placeItems: "center",
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "#ffb82e",
          color: "#5f3700",
          fontSize: 16,
          fontWeight: 700,
          flex: "0 0 auto",
        }}
      >
        !
      </span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4, color: "#5f3700" }}>
        <p style={{ margin: 0, fontWeight: 650 }}>Your bundle is Unlisted</p>
        <p style={{ margin: "2px 0 0" }}>
          Bundle is hidden from your store&rsquo;s search results and collection pages. <br />
          For discoverabiity, change the bundle product&rsquo;s status to Active in Shopify Products.
        </p>
      </div>
      <s-button
        variant="secondary"
        tone="auto"
        onClick={onManage}
      >
        Manage
      </s-button>
    </div>
  );
}
