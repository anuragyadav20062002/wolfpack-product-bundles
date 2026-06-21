export type VisibilityDisplayConfiguration = {
  showOnAllBundleProducts: boolean;
  selectedProducts: unknown[];
  showOnSpecificProductPages: unknown[];
  collectionsSelectedData: unknown[];
  showOnSpecificCollectionPages: unknown[];
};

export type StepSetupMultiLanguageTarget =
  | { type: "text-overrides" }
  | { type: "step"; stepId: string }
  | { type: "step-category"; stepId: string; categoryIndex: number }
  | { type: "addon-step" }
  | { type: "addon-section" }
  | { type: "addon-footer" };

export function asVisibilityArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function getVisibilityDisplayTarget(
  displayConfiguration:
    | Partial<VisibilityDisplayConfiguration>
    | null
    | undefined,
  allValue: string,
): string {
  if (!displayConfiguration) return allValue;
  if (
    asVisibilityArray(displayConfiguration.collectionsSelectedData).length >
      0 ||
    asVisibilityArray(displayConfiguration.showOnSpecificCollectionPages)
      .length > 0
  ) {
    return "specific_collections";
  }
  if (
    asVisibilityArray(displayConfiguration.selectedProducts).length > 0 ||
    asVisibilityArray(displayConfiguration.showOnSpecificProductPages).length >
      0
  ) {
    return "specific_products";
  }
  return displayConfiguration.showOnAllBundleProducts === false
    ? "specific_products"
    : allValue;
}

export function buildVisibilityDisplayConfiguration(
  displayOn: string | null | undefined,
  selectedProducts: unknown[] = [],
  showOnSpecificProductPages: unknown[] = [],
  collectionsSelectedData: unknown[] = [],
  showOnSpecificCollectionPages: unknown[] = [],
): VisibilityDisplayConfiguration {
  const showOnAllBundleProducts =
    displayOn === "all" || displayOn === "all_products";
  const productPageTargets =
    showOnSpecificProductPages.length > 0
      ? showOnSpecificProductPages
      : selectedProducts;
  const collectionPageTargets =
    showOnSpecificCollectionPages.length > 0
      ? showOnSpecificCollectionPages
      : collectionsSelectedData;

  return {
    showOnAllBundleProducts,
    selectedProducts:
      displayOn === "specific_products"
        ? selectedProducts.map((product) =>
            compactVisibilityProductReference(product),
          )
        : [],
    showOnSpecificProductPages:
      displayOn === "specific_products"
        ? productPageTargets.map((product) =>
            compactVisibilityProductPageReference(product),
          )
        : [],
    collectionsSelectedData:
      displayOn === "specific_collections"
        ? collectionsSelectedData.map((collection) =>
            compactVisibilityCollectionReference(collection),
          )
        : [],
    showOnSpecificCollectionPages:
      displayOn === "specific_collections"
        ? collectionPageTargets.map((collection) =>
            compactVisibilityCollectionPageReference(collection),
          )
        : [],
  };
}

export function getVisibilityResourceId(resource: any): string | null {
  return (
    resource?.graphqlId ??
    resource?.admin_graphql_api_id ??
    resource?.storefrontId ??
    resource?.id ??
    null
  );
}

export function getVisibilityResourceNumericId(resource: any): string {
  const id = String(
    resource?.productId ??
      resource?.collectionId ??
      getVisibilityResourceId(resource) ??
      "",
  );
  return id.includes("/") ? (id.split("/").pop() ?? id) : id;
}

export function getVisibilityImageUrl(resource: any): string | null {
  return (
    resource?.imageUrl ??
    resource?.featuredImage?.url ??
    resource?.image?.url ??
    resource?.image?.src ??
    resource?.images?.[0]?.originalSrc ??
    resource?.images?.[0]?.url ??
    resource?.images?.[0]?.src ??
    null
  );
}

export function getVisibilityPickerSelection(picked: any): any[] | null {
  if (Array.isArray(picked)) return picked;
  if (Array.isArray(picked?.selection)) return picked.selection;
  return null;
}

export function buildVisibilitySelectionIds(resources: unknown[]) {
  return resources
    .map((resource: any) => getVisibilityResourceId(resource))
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .map((id) => ({ id }));
}

export function compactVisibilityImages(resource: any) {
  const imageUrl = getVisibilityImageUrl(resource);
  return imageUrl ? [{ originalSrc: imageUrl }] : [];
}

export function compactVisibilityProductReference(product: any) {
  const graphqlId = getVisibilityResourceId(product);
  const imageUrl = getVisibilityImageUrl(product);

  return {
    id: graphqlId,
    productId: getVisibilityResourceNumericId(product),
    graphqlId,
    handle: product?.handle ?? "",
    title: product?.title ?? "Untitled product",
    images: compactVisibilityImages(product),
    imageUrl,
    variants: [],
  };
}

export function compactVisibilityProductPageReference(product: any) {
  const normalized = compactVisibilityProductReference(product);
  return {
    productId: normalized.productId,
    graphqlId: normalized.graphqlId,
    handle: normalized.handle,
    variants: normalized.variants,
    images: normalized.images,
    title: normalized.title,
  };
}

export function normalizeVisibilityProductForDisplayConfiguration(
  product: any,
) {
  return compactVisibilityProductReference(product);
}

export function normalizeVisibilityProductPageTarget(product: any) {
  return compactVisibilityProductPageReference(product);
}

export function compactVisibilityCollectionReference(collection: any) {
  const graphqlId = getVisibilityResourceId(collection);
  return {
    id: graphqlId,
    collectionId: getVisibilityResourceNumericId(collection),
    graphqlId,
    handle: collection?.handle ?? "",
    title: collection?.title ?? "Untitled collection",
  };
}

export function compactVisibilityCollectionPageReference(collection: any) {
  const normalized = compactVisibilityCollectionReference(collection);
  return {
    collectionId: normalized.collectionId,
    graphqlId: normalized.graphqlId,
    handle: normalized.handle,
    variants: [],
    images: [],
    title: normalized.title,
  };
}

export function normalizeVisibilityCollectionForDisplayConfiguration(
  collection: any,
) {
  return compactVisibilityCollectionReference(collection);
}

export function normalizeVisibilityCollectionPageTarget(collection: any) {
  return compactVisibilityCollectionPageReference(collection);
}
