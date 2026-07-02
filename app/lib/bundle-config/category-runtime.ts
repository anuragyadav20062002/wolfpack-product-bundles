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

function compactImageReference(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string" && value.trim()) return { src: value };
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const image = value as Record<string, unknown>;
  for (const key of ["src", "url", "originalSrc"]) {
    const fieldValue = image[key];
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      return key === "originalSrc" ? { originalSrc: fieldValue } : { [key]: fieldValue };
    }
  }

  return null;
}

function compactVariantImageReference(value: unknown): Record<string, unknown> | null {
  const image = compactImageReference(value);
  if (!image) return null;
  const src = image.src ?? image.url ?? image.originalSrc;
  return typeof src === "string" && src.trim() ? { src } : null;
}

function compactImages(value: unknown): Record<string, unknown>[] {
  return asArray(value)
    .map(compactImageReference)
    .filter((image): image is Record<string, unknown> => image !== null)
    .slice(0, 1);
}

function compactOptions(value: unknown): Array<string | Record<string, unknown>> {
  return asArray(value)
    .map((option) => {
      if (typeof option === "string" && option.trim()) return option;
      if (!option || typeof option !== "object" || Array.isArray(option)) return null;

      const optionRecord = option as Record<string, unknown>;
      const compact: Record<string, unknown> = {};
      if (typeof optionRecord.name === "string" && optionRecord.name.trim()) compact.name = optionRecord.name;
      if (Array.isArray(optionRecord.values)) compact.values = optionRecord.values.filter((value) =>
        typeof value === "string" || typeof value === "number"
      );
      return Object.keys(compact).length > 0 ? compact : null;
    })
    .filter((option): option is string | Record<string, unknown> => option !== null);
}

function selectedOptionValue(source: Record<string, unknown>, index: number): string | null {
  const selectedOptions = asArray(source.selectedOptions);
  const selectedOption = selectedOptions[index - 1];
  if (!selectedOption || typeof selectedOption !== "object" || Array.isArray(selectedOption)) return null;

  const value = (selectedOption as Record<string, unknown>).value;
  return typeof value === "string" && value.trim() ? value : null;
}

function compactOptionsFromVariants(value: unknown): Array<Record<string, unknown>> {
  const optionNames: string[] = [];
  for (const variant of asArray(value)) {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) continue;

    asArray((variant as Record<string, unknown>).selectedOptions).forEach((option, index) => {
      if (optionNames[index] || !option || typeof option !== "object" || Array.isArray(option)) return;

      const name = (option as Record<string, unknown>).name;
      if (typeof name === "string" && name.trim()) optionNames[index] = name;
    });
  }

  return optionNames.filter(Boolean).map((name) => ({ name }));
}

function compactVariants(value: unknown): Record<string, unknown>[] {
  return asArray(value)
    .map((variant) => {
      if (!variant || typeof variant !== "object" || Array.isArray(variant)) return null;

      const source = variant as Record<string, unknown>;
      const compact: Record<string, unknown> = {};
      for (const key of ["id", "variantId", "variantGraphqlId", "graphqlId", "title", "price", "compareAtPrice", "weight"]) {
        const fieldValue = source[key];
        if (typeof fieldValue === "string" && fieldValue.trim()) compact[key] = fieldValue;
        if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) compact[key] = fieldValue;
      }
      if (typeof source.weightUnit === "string" && source.weightUnit.trim()) {
        compact.weightUnit = source.weightUnit;
      }

      if (source.available === true || source.availableForSale === true) compact.available = true;
      if (source.available === false || source.availableForSale === false) compact.available = false;
      if (typeof source.quantityAvailable === "number" && Number.isFinite(source.quantityAvailable)) {
        compact.quantityAvailable = source.quantityAvailable;
      }
      if (source.currentlyNotInStock === true) compact.currentlyNotInStock = true;

      for (const key of ["option1", "option2", "option3"]) {
        const fieldValue = source[key];
        if (typeof fieldValue === "string" && fieldValue.trim()) compact[key] = fieldValue;
      }
      for (const key of ["option1", "option2", "option3"] as const) {
        if (compact[key]) continue;

        const selectedValue = selectedOptionValue(source, Number(key.replace("option", "")));
        if (selectedValue) compact[key] = selectedValue;
      }

      const image = compactVariantImageReference(source.image) ?? compactVariantImageReference(source.imageUrl);
      if (image) compact.image = image;

      if (Array.isArray(source.sellingPlanAllocations) && source.sellingPlanAllocations.length > 0) {
        compact.sellingPlanAllocations = source.sellingPlanAllocations;
      }

      return Object.keys(compact).length > 0 ? compact : null;
    })
    .filter((variant): variant is Record<string, unknown> => variant !== null);
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

  for (const key of ["price", "compareAtPrice", "weight"]) {
    const fieldValue = mergedProduct[key];
    if (typeof fieldValue === "number" || (typeof fieldValue === "string" && fieldValue.trim())) {
      reference[key] = fieldValue;
    }
  }
  if (typeof mergedProduct.weightUnit === "string" && mergedProduct.weightUnit.trim()) {
    reference.weightUnit = mergedProduct.weightUnit;
  }

  const images = compactImages(mergedProduct.images);
  if (images.length > 0) reference.images = images;

  const variants = compactVariants(mergedProduct.variants);
  if (variants.length > 0) reference.variants = variants;

  const options = compactOptions(mergedProduct.options);
  const derivedOptions = options.length > 0 ? options : compactOptionsFromVariants(mergedProduct.variants);
  if (derivedOptions.length > 0) reference.options = derivedOptions;

  for (const key of ["featuredImage", "image"]) {
    const image = compactImageReference(mergedProduct[key]);
    if (image) {
      reference[key] = image;
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
