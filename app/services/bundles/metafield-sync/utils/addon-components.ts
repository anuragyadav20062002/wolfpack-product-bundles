export interface AddonComponentVariant {
  productId: string | null;
  variantId: string | null;
  priceCents: number | null;
  title?: string;
  imageUrl?: string;
}

function normalizeGid(value: unknown, resource: "Product" | "ProductVariant"): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.startsWith(`gid://shopify/${resource}/`)) return raw;
  if (/^\d+$/.test(raw)) return `gid://shopify/${resource}/${raw}`;
  return null;
}

function parsePriceCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

function addonProductId(product: any): string | null {
  return normalizeGid(
    product?.graphqlId
      ?? product?.productGraphqlId
      ?? product?.id
      ?? product?.productId,
    "Product",
  );
}

function addonVariantId(variant: any): string | null {
  return normalizeGid(
    variant?.variantGraphqlId
      ?? variant?.graphqlId
      ?? variant?.id
      ?? variant?.variantId,
    "ProductVariant",
  );
}

export function collectAddonComponentVariants(personalizationData: any): AddonComponentVariant[] {
  const addonProducts = personalizationData?.addonProducts;
  if (!addonProducts || addonProducts.isEnabled === false) return [];

  const tiers = Array.isArray(addonProducts.tiers) ? addonProducts.tiers : [];
  const seenVariants = new Set<string>();
  const seenProductsWithoutVariants = new Set<string>();
  const results: AddonComponentVariant[] = [];

  for (const tier of tiers) {
    const selectedProducts = Array.isArray(tier?.selectedAddonProducts)
      ? tier.selectedAddonProducts
      : [];

    for (const product of selectedProducts) {
      const productId = addonProductId(product);
      const title = typeof product?.title === "string" ? product.title : undefined;
      const imageUrl = typeof product?.imageUrl === "string" ? product.imageUrl : undefined;
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      let addedVariant = false;

      for (const variant of variants) {
        const variantId = addonVariantId(variant);
        if (!variantId || seenVariants.has(variantId)) continue;

        seenVariants.add(variantId);
        addedVariant = true;
        results.push({
          productId,
          variantId,
          priceCents: parsePriceCents(variant?.price),
          title,
          imageUrl,
        });
      }

      if (!addedVariant && productId && !seenProductsWithoutVariants.has(productId)) {
        seenProductsWithoutVariants.add(productId);
        results.push({
          productId,
          variantId: null,
          priceCents: null,
          title,
          imageUrl,
        });
      }
    }
  }

  return results;
}
