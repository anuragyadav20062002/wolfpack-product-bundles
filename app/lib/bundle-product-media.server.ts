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

type FileUpdateInput = {
  id: string;
  alt?: string;
  referencesToRemove?: string[];
};

export function getBundleProductPlaceholderAlt(_bundleName: string): string {
  return "";
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
  const expectedAlt = getBundleProductPlaceholderAlt(bundleName);
  return Boolean(expectedAlt) && altText === expectedAlt;
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
): Array<{ id: string; referencesToRemove: string[] }> {
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

export function buildBundleProductMediaFileUpdates(
  productId: string,
  mediaNodes: BundleProductMediaNode[] | undefined,
  bundleName: string,
): FileUpdateInput[] {
  if (!productId || !hasBundleProductPlaceholderMedia(mediaNodes, bundleName)) {
    return [];
  }

  let placeholderKept = false;

  return (mediaNodes || []).flatMap((mediaNode) => {
    if (!mediaNode.id) return [];

    if (isBundleProductPlaceholderMedia(mediaNode, bundleName) && !placeholderKept) {
      placeholderKept = true;
      const currentAlt = mediaNode.alt ?? mediaNode.image?.altText ?? "";
      return currentAlt === "" ? [] : [{ id: mediaNode.id, alt: "" }];
    }

    return [{ id: mediaNode.id, referencesToRemove: [productId] }];
  });
}
