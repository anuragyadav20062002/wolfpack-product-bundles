import { PRODUCT_PAGE_SETUP_ITEMS } from "../../../lib/bundle-config/product-page-admin-sections";
export {
  BundleProductCard,
  QuestionHelpTooltip,
  VisibilityBadge,
} from "./ConfigureBundleFlow.ui";

export const ADDON_TEMPLATE_VARIABLES: [string, string][] = [
  [
    "{{addonsConditionDiff}}",
    "The remaining quantity a customer needs to add to unlock the add-on discount.",
  ],
  [
    "{{addonsDiscountValue}}",
    "The numerical value of the add-on discount (e.g. the '10' in 10% off).",
  ],
  [
    "{{addonsDiscountValueUnit}}",
    "The unit symbol for the add-on discount (% or $).",
  ],
];

export const DISCOUNT_TEMPLATE_VARIABLES: [string, string][] = [
  [
    "{{discountConditionDiff}}",
    "The remaining quantity or monetary amount a customer needs to add to their cart to unlock the discount.",
  ],
  [
    "{{discountUnit}}",
    "The symbol for the discount requirement, such as your store's currency symbol ($) for amount-based rules.",
  ],
  [
    "{{discountValue}}",
    "The numerical value of the discount reward itself (e.g., the '10' in a 10% or $10 discount).",
  ],
  [
    "{{discountValueUnit}}",
    "The symbol used for the discount reward, such as the percent sign (%) or the store's currency symbol ($).",
  ],
  [
    "{{discountedItems}}",
    'The quantity of items that will be discounted or given free as part of the "Get Y" offer.',
  ],
];

export const bundleSetupItems = PRODUCT_PAGE_SETUP_ITEMS;

export const bundleVisibilityChildItems = [
  { id: "bundle_widget", label: "Bundle Widget" },
  { id: "bundle_embed", label: "Bundle Embed" },
];

export const productPageTemplateOptions = [
  {
    presetId: "CASCADE",
    layoutTemplate: "PDP_INPAGE",
    label: "Product List",
    image: "/PPB-List.avif",
  },
  {
    presetId: "MODAL",
    layoutTemplate: "PDP_MODAL",
    label: "Horizontal Slots",
    image: "/PPB-HorizontalSlots.avif",
  },
  {
    presetId: "COGNIVE",
    layoutTemplate: "PDP_INPAGE",
    label: "Product Grid",
    image: "/PPB-Grid.avif",
  },
  {
    presetId: "SIMPLIFIED",
    layoutTemplate: "PDP_MODAL",
    label: "Vertical Slots",
    image: "/PPB-VerticalSlots.avif",
  },
] as const;

export const PPB_DESIGN_CONTROL_PANEL_URL = "/app/settings";

type VisibilityDisplayConfiguration = {
  showOnAllBundleProducts: boolean;
  selectedProducts: unknown[];
  showOnSpecificProductPages: unknown[];
  collectionsSelectedData: unknown[];
  showOnSpecificCollectionPages: unknown[];
};

export type StepSetupMultiLanguageTarget =
  | { type: "text-overrides" }
  | { type: "step"; stepId: string }
  | { type: "step-category"; stepId: string; categoryIndex: number };

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

function getVisibilityResourceNumericId(resource: any): string {
  const id = String(
    resource?.productId ??
      resource?.collectionId ??
      getVisibilityResourceId(resource) ??
      "",
  );
  return id.includes("/") ? (id.split("/").pop() ?? id) : id;
}

function getVisibilityImageUrl(resource: any): string | null {
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

function compactVisibilityImages(resource: any) {
  const imageUrl = getVisibilityImageUrl(resource);
  return imageUrl ? [{ originalSrc: imageUrl }] : [];
}

function compactVisibilityProductReference(product: any) {
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

function compactVisibilityProductPageReference(product: any) {
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

function compactVisibilityCollectionReference(collection: any) {
  const graphqlId = getVisibilityResourceId(collection);
  return {
    id: graphqlId,
    collectionId: getVisibilityResourceNumericId(collection),
    graphqlId,
    handle: collection?.handle ?? "",
    title: collection?.title ?? "Untitled collection",
  };
}

function compactVisibilityCollectionPageReference(collection: any) {
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
