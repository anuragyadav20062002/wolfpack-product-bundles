export type PpbPreviewInput = {
  appEmbedEnabled: boolean;
  bundleStatus: string;
  productHandle: string | null;
  /** Shopify Admin GraphQL Product node: { id, handle, onlineStorePreviewUrl, onlineStoreUrl }. */
  bundleProduct: {
    id?: string | null;
    handle?: string | null;
    onlineStorePreviewUrl?: string | null;
    onlineStoreUrl?: string | null;
  } | null;
  shop: string;
};

/**
 * Pure helper that picks the right Preview URL for the PPB configure page.
 *
 * Behavior:
 * - When the theme app embed is enabled AND the bundle is active or unlisted,
 *   prefer the live storefront URL (`/products/{handle}` or `onlineStoreUrl`).
 *   The bundle widget will render correctly in that context.
 * - Otherwise, prefer `onlineStorePreviewUrl` (Shopify's draft preview URL)
 *   so the merchant can still see the product even if not published.
 *
 * Returns `null` when no usable URL can be constructed — the caller should
 * surface a clear error in that case.
 */
export function pickPpbPreviewUrl(input: PpbPreviewInput): string | null {
  const shop = normalizeShop(input.shop);
  const status = (input.bundleStatus ?? "").toLowerCase();
  const liveEligible = input.appEmbedEnabled && (status === "active" || status === "unlisted");
  const product = input.bundleProduct ?? null;
  const handle = product?.handle || input.productHandle;

  if (liveEligible) {
    if (product?.onlineStoreUrl) return product.onlineStoreUrl;
    if (handle) return `https://${shop}/products/${handle}`;
    // Fall through to preview/admin fallback when live URL isn't constructible.
  }

  if (product?.onlineStorePreviewUrl) return product.onlineStorePreviewUrl;
  if (product?.onlineStoreUrl) return product.onlineStoreUrl;
  if (handle) return `https://${shop}/products/${handle}`;

  return null;
}

function normalizeShop(shop: string): string {
  return shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
