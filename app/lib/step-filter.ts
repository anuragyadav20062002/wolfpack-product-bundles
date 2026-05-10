export interface StepFilterConfig {
  label: string;
  collectionHandle: string;
}

export interface FilterableProduct {
  id: string;
  parentProductId?: string;
  [key: string]: unknown;
}

/**
 * Filters a product list to those belonging to the given collection,
 * identified by pre-fetched product IDs from stepCollectionProductIds.
 *
 * Handles both raw numeric IDs and GID-format strings ("gid://shopify/Product/123").
 * Returns the full list unchanged when collectionProductIds is null or empty.
 */
export function filterProductsByCollectionIds<T extends FilterableProduct>(
  products: T[],
  collectionProductIds: string[] | null,
): T[] {
  if (!collectionProductIds || collectionProductIds.length === 0) {
    return products;
  }

  const extractNumericId = (gidOrId: string): string => {
    const parts = String(gidOrId).split("/");
    return parts[parts.length - 1];
  };

  const normalizedCollectionIds = new Set(collectionProductIds.map(extractNumericId));

  return products.filter(p => {
    const numericPid = extractNumericId(String(p.parentProductId || p.id || ""));
    return normalizedCollectionIds.has(numericPid);
  });
}

/**
 * Validates raw step.filters input from the DB or form.
 * Returns the cleaned array, or null if empty / all invalid.
 */
export function validateStepFilters(
  raw: unknown,
): StepFilterConfig[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const valid = raw.filter(
    (item): item is StepFilterConfig =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).label === "string" &&
      (item as StepFilterConfig).label.trim().length > 0 &&
      typeof (item as Record<string, unknown>).collectionHandle === "string" &&
      (item as StepFilterConfig).collectionHandle.trim().length > 0,
  );

  return valid.length > 0 ? valid : null;
}
