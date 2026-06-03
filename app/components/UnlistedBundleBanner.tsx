import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        <p style={{ margin: 0, fontWeight: 650 }}>{t("common.unlistedBundle.title")}</p>
        <p style={{ margin: "2px 0 0" }}>
          {t("common.unlistedBundle.body")}
        </p>
      </div>
      <s-button
        variant="secondary"
        tone="auto"
        onClick={onManage}
      >
        {t("common.actions.manage")}
      </s-button>
    </div>
  );
}
