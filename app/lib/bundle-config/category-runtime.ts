function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function objectOrEmpty(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function productReferenceKey(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const product = value as Record<string, unknown>;
  for (const key of ["productId", "graphqlId", "id"]) {
    const fieldValue = product[key];
    if (typeof fieldValue === "string" && fieldValue.trim()) return fieldValue;
  }
  return null;
}

function normalizeReferenceKey(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.split("/").pop() ?? trimmed;
}

function compactProductReference(
  value: unknown,
  productSourceByKey: Map<string, Record<string, unknown>> = new Map(),
): Record<string, unknown> | null {
  if (typeof value === "string" && value.trim()) return { id: value };
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const product = value as Record<string, unknown>;
  const productKey = productReferenceKey(product);
  const source = productKey
    ? productSourceByKey.get(productKey) ?? productSourceByKey.get(normalizeReferenceKey(productKey) ?? "")
    : null;
  const mergedProduct = source ? { ...source, ...product } : product;
  const reference: Record<string, unknown> = {};
  for (const key of ["id", "productId", "graphqlId", "handle", "title"]) {
    const fieldValue = mergedProduct[key];
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      reference[key] = fieldValue;
    }
  }

  for (const key of ["imageUrl", "description"]) {
    const fieldValue = mergedProduct[key];
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      reference[key] = fieldValue;
    }
  }

  for (const key of ["price", "compareAtPrice"]) {
    const fieldValue = mergedProduct[key];
    if (typeof fieldValue === "number" || (typeof fieldValue === "string" && fieldValue.trim())) {
      reference[key] = fieldValue;
    }
  }

  for (const key of ["images", "variants", "options"]) {
    const fieldValue = mergedProduct[key];
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
      reference[key] = fieldValue;
    }
  }

  for (const key of ["featuredImage", "image"]) {
    const fieldValue = mergedProduct[key];
    if (fieldValue && typeof fieldValue === "object" && !Array.isArray(fieldValue)) {
      reference[key] = fieldValue;
    }
  }

  return Object.keys(reference).length > 0 ? reference : null;
}

function compactCollectionReference(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string" && value.trim()) return { id: value };
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const collection = value as Record<string, unknown>;
  const reference: Record<string, unknown> = {};
  for (const key of ["id", "handle", "title"]) {
    const fieldValue = collection[key];
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      reference[key] = fieldValue;
    }
  }

  return Object.keys(reference).length > 0 ? reference : null;
}

function buildProductSourceMap(productSources: unknown[] = []): Map<string, Record<string, unknown>> {
  const sourceMap = new Map<string, Record<string, unknown>>();
  for (const source of productSources) {
    if (!source || typeof source !== "object" || Array.isArray(source)) continue;
    const sourceRecord = source as Record<string, unknown>;
    const sourceKey = productReferenceKey(sourceRecord);
    if (!sourceKey) continue;
    sourceMap.set(sourceKey, sourceRecord);
    const normalizedKey = normalizeReferenceKey(sourceKey);
    if (normalizedKey) sourceMap.set(normalizedKey, sourceRecord);
  }
  return sourceMap;
}

function compactProductReferences(
  value: unknown,
  productSourceByKey: Map<string, Record<string, unknown>> = new Map(),
): Record<string, unknown>[] {
  return asArray(value)
    .map((reference) => compactProductReference(reference, productSourceByKey))
    .filter((reference): reference is Record<string, unknown> => reference !== null);
}

function compactCollectionReferences(value: unknown): Record<string, unknown>[] {
  return asArray(value)
    .map(compactCollectionReference)
    .filter((reference): reference is Record<string, unknown> => reference !== null);
}

export function formatStepCategoryForRuntime(
  category: Record<string, unknown>,
  index: number,
  productSources: unknown[] = [],
) {
  const categoryId = stringOrNull(category.categoryId) ?? stringOrNull(category.id) ?? `category-${index + 1}`;
  const categoryRank = numberOrNull(category.categoryRank);
  const sortOrder = numberOrNull(category.sortOrder);
  const collectionsSelectedData = compactCollectionReferences(category.collectionsSelectedData);
  const collections = compactCollectionReferences(category.collections);
  const productSourceByKey = buildProductSourceMap(productSources);

  return {
    categoryId,
    name: stringOrEmpty(category.name),
    title: stringOrEmpty(category.title) || stringOrEmpty(category.name),
    subTitle: stringOrEmpty(category.subTitle),
    rank: categoryRank ?? sortOrder ?? index,
    categoryRank,
    products: compactProductReferences(category.products, productSourceByKey),
    selectedProducts: compactProductReferences(category.selectedProducts, productSourceByKey),
    collections: collections.length > 0 ? collections : collectionsSelectedData,
    collectionsData: compactCollectionReferences(category.collectionsData),
    collectionsSelectedData,
    conditions: asArray(category.conditions),
    categoryBanner: stringOrEmpty(category.categoryBanner),
    categoryImg: stringOrEmpty(category.categoryImg),
    autoNextStepOnConditionMet: category.autoNextStepOnConditionMet === true,
    displayVariantsAsIndividualProducts: category.displayVariantsAsIndividualProducts === true,
    displayVariantsAsSwatches: category.displayVariantsAsSwatches === true,
    multiLangData: objectOrEmpty(category.multiLangData),
  };
}

export function formatStepCategoriesForRuntime(step: Record<string, unknown>, productSources: unknown[] = []) {
  return asArray(step.StepCategory).map((category, index) =>
    formatStepCategoryForRuntime(category as Record<string, unknown>, index, productSources)
  );
}
