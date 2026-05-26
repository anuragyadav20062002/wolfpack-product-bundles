export interface DefaultProductVariant {
  variantId: string;
  variantGraphqlId: string;
  inventoryQuantity?: number;
  price?: string;
}

export interface DefaultProductEntry {
  productId: string;
  graphqlId: string;
  handle?: string;
  title: string;
  images?: Array<{ originalSrc: string }>;
  variants: DefaultProductVariant[];
  hasOnlyDefaultVariant?: boolean;
  requiredQuantity: number;
}

export interface DefaultProductsData {
  isDefaultProductsEnabled?: boolean;
  defaultProductsTitle?: string;
  products?: DefaultProductEntry[];
}

function extractShopifyNumericId(id: unknown): string | null {
  if (typeof id !== "string" || id.trim() === "") return null;
  const match = id.match(/\/(\d+)$/);
  return match ? match[1] : id;
}

function firstImageUrl(product: any): string | null {
  return product.imageUrl
    || product.images?.[0]?.originalSrc
    || product.images?.[0]?.url
    || product.image?.url
    || null;
}

function normalizeVariant(variant: any): DefaultProductVariant | null {
  const variantGid = variant.variantGraphqlId || variant.id || variant.gid || variant.admin_graphql_api_id;
  const numericVariantId = variant.variantId && !String(variant.variantId).startsWith("gid://")
    ? String(variant.variantId)
    : extractShopifyNumericId(variantGid);
  if (!variantGid || !numericVariantId) return null;

  const normalizedVariant: DefaultProductVariant = {
    variantId: numericVariantId,
    variantGraphqlId: variantGid,
    inventoryQuantity: Number(variant.inventoryQuantity ?? variant.inventory_quantity ?? 0),
  };
  if (variant.price != null) normalizedVariant.price = String(variant.price);

  return normalizedVariant;
}

export function buildDefaultProductEntryFromPicker(product: any): DefaultProductEntry | null {
  const productGid = product.graphqlId || product.productId || product.id;
  const numericProductId = product.productId && !String(product.productId).startsWith("gid://")
    ? String(product.productId)
    : extractShopifyNumericId(productGid);
  if (!productGid || !numericProductId) return null;

  const rawVariants = Array.isArray(product.variants) ? product.variants : [];
  const selectedVariant = rawVariants.find((variant: any) => (
    variant?.availableForSale !== false && variant?.available !== false
  )) || rawVariants[0];
  const variants = selectedVariant
    ? [normalizeVariant(selectedVariant)].filter((variant): variant is DefaultProductVariant => Boolean(variant))
    : [];
  const imageUrl = firstImageUrl(product);
  const entry: DefaultProductEntry = {
    productId: numericProductId,
    graphqlId: productGid,
    title: product.title || product.name || "",
    images: imageUrl ? [{ originalSrc: imageUrl }] : [],
    variants,
    hasOnlyDefaultVariant: Boolean(product.hasOnlyDefaultVariant ?? rawVariants.length <= 1),
    requiredQuantity: Number(product.requiredQuantity ?? product.minQuantity ?? 1) || 1,
  };
  if (product.handle) entry.handle = product.handle;

  return entry;
}

export function normalizeDefaultProductsData(input: unknown): DefaultProductsData {
  if (!input || typeof input !== "object") return {};
  const data = input as DefaultProductsData;
  if (data.isDefaultProductsEnabled !== true) return {};

  const products = Array.isArray(data.products)
    ? data.products
        .map(buildDefaultProductEntryFromPicker)
        .filter((product): product is DefaultProductEntry => Boolean(product))
    : [];

  return {
    isDefaultProductsEnabled: true,
    defaultProductsTitle: data.defaultProductsTitle ?? "",
    products,
  };
}
