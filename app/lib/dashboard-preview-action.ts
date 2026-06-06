export type DashboardPreviewInput = {
  bundleType: "full_page" | "product_page";
  bundleId: string;
  shopifyProductHandle: string | null;
  shopifyPageHandle: string | null;
  shop: string;
  /**
   * Optional. When true AND bundleStatus is "active" | "unlisted" AND a
   * shopifyPageHandle is set, FPB Preview opens the Shopify Page URL
   * instead of the app-proxy URL. Defaults to false (preserves the
   * helper's original behavior).
   */
  appEmbedEnabled?: boolean;
  bundleStatus?: "active" | "draft" | "unlisted" | "archived" | string;
};

export type DashboardPreviewAction =
  | { kind: "open_url"; url: string }
  | { kind: "create_preview_page" }
  | { kind: "error"; toast: string };

const PPB_MISSING_HANDLE_TOAST =
  "Save and place the bundle on a product first to preview it.";

export function decideDashboardPreviewAction(
  input: DashboardPreviewInput,
): DashboardPreviewAction {
  const shop = normalizeShop(input.shop);
  if (input.bundleType === "full_page") {
    if (input.shopifyPageHandle) {
      return {
        kind: "open_url",
        url: `https://${shop}/pages/${input.shopifyPageHandle}`,
      };
    }

    return { kind: "create_preview_page" };
  }

  if (!input.shopifyProductHandle) {
    return { kind: "error", toast: PPB_MISSING_HANDLE_TOAST };
  }

  return {
    kind: "open_url",
    url: `https://${shop}/products/${input.shopifyProductHandle}`,
  };
}

function normalizeShop(shop: string): string {
  return shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
