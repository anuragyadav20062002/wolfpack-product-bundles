import { BundleStatus } from "../constants/bundle";

type BundleProductDescriptionInput = {
  bundleName: string;
  customDescription?: string | null;
  status?: string | null;
};

export type BundleProductTroubleshootingCategory = "visibility_unlisted";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function hasBundleProductSoftError(status?: string | null): boolean {
  return getBundleProductTroubleshootingCategory({ status }) !== null;
}

export function getBundleProductTroubleshootingCategory({
  status,
}: Pick<BundleProductDescriptionInput, "status">): BundleProductTroubleshootingCategory | null {
  if (String(status || "").toLowerCase() === BundleStatus.UNLISTED) {
    return "visibility_unlisted";
  }

  return null;
}

export function buildBundleProductDescriptionHtml({
  bundleName,
  customDescription,
  status,
}: BundleProductDescriptionInput): string {
  const safeBundleName = bundleName || "Bundle";
  const troubleshootingCategory = getBundleProductTroubleshootingCategory({ status });

  if (troubleshootingCategory === "visibility_unlisted") {
    return [
      '<p><strong>Category:</strong> Visibility</p>',
      "<h3>Your Bundle is Unlisted</h3>",
      '<p>This product is automatically managed by Wolfpack Product Bundles with its <strong>Status</strong> set to <strong>"Unlisted"</strong>.</p>',
      "<p>The bundle is active and discounts will apply, but it is hidden from your store's search results and collection pages. Customers can still purchase it using a direct link.</p>",
      "<h3>To Make It Discoverable</h3>",
      '<p>To show this bundle on your storefront, including collections or search, change its <strong>Status</strong> to <strong>"Active"</strong> from Wolfpack Product Bundles.</p>',
      "<h3>Management</h3>",
      "<p><strong>Customization:</strong> Edit the title, images, and product media as you would for any standard product.</p>",
      "<p><strong>Do Not Delete:</strong> Deleting this product will break the bundle's functionality.</p>",
    ].join("");
  }

  const trimmedDescription = customDescription?.trim();
  if (trimmedDescription) {
    return trimmedDescription;
  }

  return `${escapeHtml(safeBundleName)} - Bundle Product`;
}
