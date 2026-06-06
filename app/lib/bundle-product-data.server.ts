type GeneratedBundleProductMetadataInput = {
  bundleName: string;
  shopName?: string | null;
};

type GeneratedBundleProductMetadata = {
  title: string;
  handle: string;
  productType: "product";
  vendor?: string;
};

export function buildGeneratedBundleProductHandle(bundleName: string): string {
  const handle = bundleName
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return handle || "bundle";
}

export function buildGeneratedBundleProductMetadata({
  bundleName,
  shopName,
}: GeneratedBundleProductMetadataInput): GeneratedBundleProductMetadata {
  const metadata: GeneratedBundleProductMetadata = {
    title: bundleName.trim(),
    handle: buildGeneratedBundleProductHandle(bundleName),
    productType: "product",
  };

  const vendor = shopName?.trim();
  if (vendor) {
    metadata.vendor = vendor;
  }

  return metadata;
}
