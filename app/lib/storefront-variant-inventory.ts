type StorefrontVariantInventorySource = {
  availableForSale?: boolean | null;
  quantityAvailable?: unknown;
  currentlyNotInStock?: boolean | null;
};

export function normalizeStorefrontQuantityAvailable(
  variant: StorefrontVariantInventorySource,
): number | null {
  const quantityAvailable =
    typeof variant.quantityAvailable === "number" &&
    Number.isFinite(variant.quantityAvailable)
      ? variant.quantityAvailable
      : null;

  if (quantityAvailable !== 0) {
    return quantityAvailable;
  }

  if (
    variant.availableForSale === true &&
    variant.currentlyNotInStock !== true
  ) {
    return null;
  }

  return 0;
}
