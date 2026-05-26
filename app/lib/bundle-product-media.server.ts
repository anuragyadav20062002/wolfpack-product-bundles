export const BUNDLE_PRODUCT_PLACEHOLDER_IMAGE_PATH = "/bundle-product-placeholder.png";
const BUNDLE_PRODUCT_PLACEHOLDER_IMAGE_FILENAME = "bundle-product-placeholder.";

type ProductMediaInput = {
  originalSource: string;
  alt: string;
  mediaContentType: "IMAGE";
};

export type BundleProductMediaNode = {
  id?: string | null;
  alt?: string | null;
  image?: {
    url?: string | null;
    altText?: string | null;
  } | null;
};

type FileReferenceRemovalInput = {
  id: string;
  referencesToRemove: string[];
};

export function getBundleProductPlaceholderAlt(bundleName: string): string {
  return `${bundleName?.trim() || "Bundle"} - Bundle`;
}

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
      alt: getBundleProductPlaceholderAlt(bundleName),
      mediaContentType: "IMAGE",
    },
  ];
}

function isBundleProductPlaceholderMedia(
  mediaNode: BundleProductMediaNode,
  bundleName: string,
): boolean {
  const imageUrl = mediaNode.image?.url?.trim() || "";
  if (imageUrl) {
    return imageUrl.includes(BUNDLE_PRODUCT_PLACEHOLDER_IMAGE_FILENAME);
  }

  const altText = mediaNode.alt || mediaNode.image?.altText || "";
  return altText === getBundleProductPlaceholderAlt(bundleName);
}

export function hasBundleProductPlaceholderMedia(
  mediaNodes: BundleProductMediaNode[] | undefined,
  bundleName: string,
): boolean {
  return (mediaNodes || []).some((mediaNode) =>
    isBundleProductPlaceholderMedia(mediaNode, bundleName),
  );
}

export function buildStaleBundleProductMediaReferenceRemovals(
  productId: string,
  mediaNodes: BundleProductMediaNode[] | undefined,
  bundleName: string,
): FileReferenceRemovalInput[] {
  if (!productId || !hasBundleProductPlaceholderMedia(mediaNodes, bundleName)) {
    return [];
  }

  let placeholderKept = false;

  return (mediaNodes || []).flatMap((mediaNode) => {
    if (!mediaNode.id) return [];

    if (isBundleProductPlaceholderMedia(mediaNode, bundleName) && !placeholderKept) {
      placeholderKept = true;
      return [];
    }

    return [{ id: mediaNode.id, referencesToRemove: [productId] }];
  });
}
