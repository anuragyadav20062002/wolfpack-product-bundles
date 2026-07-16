const FPB_PROXY_PATH = "/apps/product-bundles/wpb";

function normalizeShopDomain(shop: string): string {
  return shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function buildFpbStorefrontUrl(shop: string, bundleId: string): string {
  return `https://${normalizeShopDomain(shop)}${FPB_PROXY_PATH}/${encodeURIComponent(bundleId)}`;
}

export function appendFpbPreviewToken(url: string, token: string): string {
  const previewUrl = new URL(url);
  previewUrl.searchParams.set("wpb_preview", token);
  return previewUrl.toString();
}
