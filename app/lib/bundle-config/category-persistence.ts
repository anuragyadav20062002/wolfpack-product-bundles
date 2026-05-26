function asObjectArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function buildStepCategoryCreateInput(category: Record<string, unknown>, index: number) {
  const categoryId = stringValue(category.categoryId) ?? stringValue(category.id);
  const categoryRank = numberValue(category.categoryRank);
  const sortOrder = numberValue(category.sortOrder) ?? categoryRank ?? index;
  const products = asObjectArray(category.products);
  const selectedProducts = asObjectArray(category.selectedProducts);
  const collectionsData = asObjectArray(category.collectionsData);
  const collectionsSelectedData = asObjectArray(category.collectionsSelectedData);
  const explicitCollections = asObjectArray(category.collections);
  const collections = explicitCollections.length > 0 ? explicitCollections : collectionsSelectedData;

  return {
    ...(categoryId ? { id: categoryId } : {}),
    name: stringValue(category.name) ?? stringValue(category.title) ?? "",
    title: stringValue(category.title),
    subTitle: stringValue(category.subTitle),
    sortOrder,
    categoryRank,
    products,
    selectedProducts,
    collections,
    collectionsData,
    collectionsSelectedData,
    conditions: asObjectArray(category.conditions),
    categoryBanner: stringValue(category.categoryBanner),
    categoryImg: stringValue(category.categoryImg),
    autoNextStepOnConditionMet: category.autoNextStepOnConditionMet === true,
    displayVariantsAsIndividualProducts: category.displayVariantsAsIndividualProducts === true,
    displayVariantsAsSwatches: category.displayVariantsAsSwatches === true,
    multiLangData: objectRecord(category.multiLangData),
  };
}
