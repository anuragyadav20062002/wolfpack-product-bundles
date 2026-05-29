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
  | { kind: "create_page_then_open"; url: string }
  | { kind: "error"; toast: string };

const PPB_MISSING_HANDLE_TOAST =
  "Save and place the bundle on a product first to preview it.";

export function decideDashboardPreviewAction(
  input: DashboardPreviewInput,
): DashboardPreviewAction {
  const shop = normalizeShop(input.shop);
  const status = (input.bundleStatus ?? "").toLowerCase();
  const liveEligible = input.appEmbedEnabled === true && (status === "active" || status === "unlisted");

  if (input.bundleType === "full_page") {
    if (liveEligible && input.shopifyPageHandle) {
      return {
        kind: "open_url",
        url: `https://${shop}/pages/${input.shopifyPageHandle}`,
      };
    }

    const url = `https://${shop}/apps/product-bundles/wpb/${input.bundleId}`;
    if (!input.shopifyPageHandle) {
      // Proxy URL works regardless; kick off Shopify Page creation in the
      // background so the bundle has a real Page next time.
      return { kind: "create_page_then_open", url };
    }
    return { kind: "open_url", url };
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
