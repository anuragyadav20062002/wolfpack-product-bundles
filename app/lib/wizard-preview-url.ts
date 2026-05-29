export type WizardPreviewInput = {
  shop: string;
  bundleId: string;
  bundleType: "full_page" | "product_page";
  productHandle: string | null;
  pageHandle: string | null;
};

export type WizardPreviewResult =
  | { kind: "url"; url: string }
  | { kind: "error"; reason: "missing_product_handle" };

export function buildWizardPreviewUrl(input: WizardPreviewInput): WizardPreviewResult {
  const shop = normalizeShop(input.shop);

  if (input.bundleType === "full_page") {
    return { kind: "url", url: `https://${shop}/apps/product-bundles/wpb/${input.bundleId}` };
  }

  if (!input.productHandle) {
    return { kind: "error", reason: "missing_product_handle" };
  }

  return { kind: "url", url: `https://${shop}/products/${input.productHandle}` };
}

function normalizeShop(shop: string): string {
  return shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
