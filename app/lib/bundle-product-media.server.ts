export const BUNDLE_PRODUCT_PLACEHOLDER_IMAGE_PATH = "/bundle-product-placeholder.png";

type ProductMediaInput = {
  originalSource: string;
  alt: string;
  mediaContentType: "IMAGE";
};

export function buildBundleProductPlaceholderMediaInput(
  appUrl: string | undefined,
  bundleName: string,
): ProductMediaInput[] | undefined {
  const normalizedAppUrl = appUrl?.trim().replace(/\/+$/, "");
  if (!normalizedAppUrl) {
    return undefined;
  }

  return [
    {
      originalSource: `${normalizedAppUrl}${BUNDLE_PRODUCT_PLACEHOLDER_IMAGE_PATH}`,
      alt: `${bundleName || "Bundle"} - Bundle`,
      mediaContentType: "IMAGE",
    },
  ];
}
