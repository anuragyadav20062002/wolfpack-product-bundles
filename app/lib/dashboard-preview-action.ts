export type DashboardPreviewInput = {
  bundleType: "full_page" | "product_page";
  bundleId: string;
  shopifyProductHandle: string | null;
  shop: string;
  /** Optional app-embed state retained for the preview gate caller. */
  appEmbedEnabled?: boolean;
  bundleStatus?: "active" | "draft" | "unlisted" | "archived" | string;
};

export type DashboardPreviewAction =
  | { kind: "open_url"; url: string }
  | { kind: "create_fpb_preview" }
  | { kind: "error"; toast: string };

const PPB_MISSING_HANDLE_TOAST =
  "Save and place the bundle on a product first to preview it.";

export function decideDashboardPreviewAction(
  input: DashboardPreviewInput,
): DashboardPreviewAction {
  if (input.bundleType === "full_page") {
    if (input.bundleId) {
      return { kind: "create_fpb_preview" };
    }
  }

  if (!input.shopifyProductHandle) {
    return { kind: "error", toast: PPB_MISSING_HANDLE_TOAST };
  }

  const shop = normalizeShop(input.shop);
  return {
    kind: "open_url",
    url: `https://${shop}/products/${input.shopifyProductHandle}`,
  };
}

function normalizeShop(shop: string): string {
  return shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
