function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function keepStringOrNumber(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) target[key] = value;
    if (typeof value === "number" && Number.isFinite(value)) target[key] = value;
  }
}

function keepBoolean(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    if (typeof source[key] === "boolean") target[key] = source[key];
  }
}

function compactImage(value: unknown): Record<string, unknown> | null {
  const image = asRecord(value);
  if (!image) return null;
  for (const key of ["src", "url", "originalSrc"]) {
    const imageUrl = image[key];
    if (typeof imageUrl === "string" && imageUrl.trim()) {
      return key === "originalSrc" ? { originalSrc: imageUrl } : { [key]: imageUrl };
    }
  }
  return null;
}

function compactImages(value: unknown): Record<string, unknown>[] {
  return asArray(value)
    .map(compactImage)
    .filter((image): image is Record<string, unknown> => image !== null)
    .slice(0, 1);
}

function compactVariantImage(value: unknown): Record<string, unknown> | null {
  const image = compactImage(value);
  const src = image?.src ?? image?.url ?? image?.originalSrc;
  return typeof src === "string" && src.trim() ? { src } : null;
}

function selectedOptionValue(source: Record<string, unknown>, index: number): string | null {
  const selectedOption = asRecord(asArray(source.selectedOptions)[index - 1]);
  const value = selectedOption?.value;
  return typeof value === "string" && value.trim() ? value : null;
}

function compactOptions(value: unknown): Array<string | Record<string, unknown>> {
  return asArray(value)
    .map((option) => {
      if (typeof option === "string" && option.trim()) return option;
      const optionRecord = asRecord(option);
      if (!optionRecord) return null;

      const compact: Record<string, unknown> = {};
      const name = optionRecord.name;
      if (typeof name === "string" && name.trim()) compact.name = name;
      if (Array.isArray(optionRecord.values)) {
        compact.values = optionRecord.values.filter(
          (value) => typeof value === "string" || typeof value === "number",
        );
      }
      return Object.keys(compact).length > 0 ? compact : null;
    })
    .filter((option): option is string | Record<string, unknown> => option !== null);
}

function compactVariant(value: unknown): Record<string, unknown> | null {
  const source = asRecord(value);
  if (!source) return null;

  const compact: Record<string, unknown> = {};
  keepStringOrNumber(compact, source, [
    "id",
    "variantId",
    "variantGraphqlId",
    "graphqlId",
    "title",
    "price",
    "compareAtPrice",
    "weight",
  ]);
  keepStringOrNumber(compact, source, ["weightUnit", "option1", "option2", "option3"]);

  if (source.available === true || source.availableForSale === true) compact.available = true;
  if (source.available === false || source.availableForSale === false) compact.available = false;
  if (typeof source.quantityAvailable === "number" && Number.isFinite(source.quantityAvailable)) {
    compact.quantityAvailable = source.quantityAvailable;
  }
  if (source.currentlyNotInStock === true) compact.currentlyNotInStock = true;

  for (const key of ["option1", "option2", "option3"] as const) {
    if (compact[key]) continue;
    const selectedValue = selectedOptionValue(source, Number(key.replace("option", "")));
    if (selectedValue) compact[key] = selectedValue;
  }

  const image = compactVariantImage(source.image) ?? compactVariantImage(source.imageUrl);
  if (image) compact.image = image;
  if (Array.isArray(source.sellingPlanAllocations) && source.sellingPlanAllocations.length > 0) {
    compact.sellingPlanAllocations = source.sellingPlanAllocations;
  }

  return Object.keys(compact).length > 0 ? compact : null;
}

function compactVariants(value: unknown): Record<string, unknown>[] {
  return asArray(value)
    .map(compactVariant)
    .filter((variant): variant is Record<string, unknown> => variant !== null);
}

function compactProduct(value: unknown): Record<string, unknown> | null {
  const source = asRecord(value);
  if (!source) return null;

  const compact: Record<string, unknown> = {};
  keepStringOrNumber(compact, source, [
    "id",
    "productId",
    "graphqlId",
    "handle",
    "title",
    "name",
    "imageUrl",
    "description",
    "descriptionHtml",
    "price",
    "compareAtPrice",
    "weight",
    "weightUnit",
    "minQuantity",
    "maxQuantity",
  ]);
  keepBoolean(compact, source, ["available", "availableForSale"]);

  const images = compactImages(source.images);
  if (images.length > 0) compact.images = images;

  const variants = compactVariants(source.variants);
  if (variants.length > 0) compact.variants = variants;

  const options = compactOptions(source.options);
  if (options.length > 0) compact.options = options;

  for (const key of ["featuredImage", "image"]) {
    const image = compactImage(source[key]);
    if (image) compact[key] = image;
  }

  return Object.keys(compact).length > 0 ? compact : null;
}

function compactProducts(value: unknown): Record<string, unknown>[] {
  return asArray(value)
    .map(compactProduct)
    .filter((product): product is Record<string, unknown> => product !== null);
}

function compactCollection(value: unknown): Record<string, unknown> | null {
  const source = asRecord(value);
  if (!source) return null;

  const compact: Record<string, unknown> = {};
  keepStringOrNumber(compact, source, [
    "id",
    "collectionId",
    "admin_graphql_api_id",
    "handle",
    "title",
  ]);
  return Object.keys(compact).length > 0 ? compact : null;
}

function compactCollections(value: unknown): Record<string, unknown>[] {
  return asArray(value)
    .map(compactCollection)
    .filter((collection): collection is Record<string, unknown> => collection !== null);
}

function compactCategory(value: unknown): Record<string, unknown> | null {
  const source = asRecord(value);
  if (!source) return null;

  const compact: Record<string, unknown> = {};
  keepStringOrNumber(compact, source, [
    "id",
    "categoryId",
    "name",
    "title",
    "subTitle",
    "sortOrder",
    "categoryRank",
    "categoryBanner",
    "categoryImg",
  ]);
  keepBoolean(compact, source, [
    "autoNextStepOnConditionMet",
    "displayVariantsAsIndividualProducts",
    "displayVariantsAsSwatches",
  ]);

  compact.products = compactProducts(source.products);
  compact.selectedProducts = compactProducts(source.selectedProducts);
  compact.collections = compactCollections(source.collections);
  compact.collectionsData = compactCollections(source.collectionsData);
  compact.collectionsSelectedData = compactCollections(source.collectionsSelectedData);
  compact.conditions = asArray(source.conditions);

  const multiLangData = asRecord(source.multiLangData);
  compact.multiLangData = multiLangData ?? null;

  return compact;
}

function compactCategories(value: unknown): Record<string, unknown>[] {
  return asArray(value)
    .map(compactCategory)
    .filter((category): category is Record<string, unknown> => category !== null);
}

export function serializeFpbSaveSteps(
  steps: unknown[] = [],
  selectedCollectionsByStepId: Record<string, unknown[]> = {},
) {
  return steps.map((step) => {
    const source = asRecord(step) ?? {};
    const stepId = typeof source.id === "string" ? source.id : "";
    const selectedCollections = stepId ? selectedCollectionsByStepId[stepId] : undefined;
    const collections = selectedCollections ?? source.collections ?? [];

    return {
      id: source.id,
      name: source.name,
      pageTitle: source.pageTitle ?? null,
      multiLangData: asRecord(source.multiLangData) ?? {},
      stepImage: source.stepImage ?? source.timelineIconUrl ?? null,
      minQuantity: source.minQuantity ?? 1,
      maxQuantity: source.maxQuantity ?? 1,
      enabled: source.enabled !== false,
      displayVariantsAsIndividual: source.displayVariantsAsIndividual ?? false,
      products: compactProducts(source.products),
      collections: compactCollections(collections),
      filters: Array.isArray(source.filters) ? source.filters : null,
      isFreeGift: false,
      freeGiftName: null,
      addonLabel: null,
      addonTitle: null,
      addonAddText: null,
      addonReplaceText: null,
      addonIconUrl: null,
      addonDisplayFree: false,
      addonTiers: [],
      addonUnlockAfterCompletion: true,
      isDefault: source.isDefault === true,
      defaultVariantId: source.defaultVariantId ?? null,
      imageUrl: source.imageUrl ?? null,
      bannerImageUrl: source.bannerImageUrl ?? null,
      StepProduct: compactProducts(source.StepProduct),
      StepCategory: compactCategories(source.StepCategory),
    };
  });
}
