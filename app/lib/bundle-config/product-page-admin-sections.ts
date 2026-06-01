export interface ProductPageSetupItem {
  id: string;
  label: string;
  iconType: string;
}

export interface ProductPageThemeTemplateOption {
  handle?: string | null;
  fullKey?: string | null;
  isBundleContainer?: boolean | null;
}

export interface ProductPageThemeEditorDeepLinkInput {
  shop: string;
  apiKey: string;
  blockHandle: string;
  bundleId: string;
  productHandle?: string | null;
  template: ProductPageThemeTemplateOption;
}

export const PRODUCT_PAGE_EDIT_DEFAULTS_HREF = "/app/settings";

export const SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE =
  "To offer this bundle as a subscription, all of its products must be part of the same subscription plan in your Shopify settings. Please update your product selling plans and try again.";

export const INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE =
  "Individual selling plans can't be enabled while a bundle-level subscription or BXGY discount is active. Disable it to use individual selling plans.";

export const PRODUCT_PAGE_SETUP_ITEMS: ProductPageSetupItem[] = [
  { id: "step_setup",         label: "Step Setup",         iconType: "note" },
  { id: "discount_pricing",   label: "Discount & Pricing", iconType: "filter" },
  { id: "bundle_visibility",  label: "Bundle Visibility",  iconType: "view" },
  { id: "bundle_settings",    label: "Bundle Settings",    iconType: "edit" },
  { id: "subscriptions",      label: "Subscriptions",      iconType: "clock" },
  { id: "select_template",    label: "Select Template",    iconType: "paint-brush-flat" },
];

export interface SellingPlanValidationSources {
  productIds: string[];
  collectionIds: string[];
}

export interface SellingPlanGroupSummary {
  id: string;
  name: string;
}

interface SellingPlanProduct {
  sellingPlanGroups?: {
    nodes?: SellingPlanGroupSummary[];
  } | null;
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function normalizeProductId(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  if (value.startsWith("gid://shopify/Product/")) return value;
  if (/^\d+$/.test(value)) return `gid://shopify/Product/${value}`;
  return null;
}

function normalizeCollectionId(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  if (value.startsWith("gid://shopify/Collection/")) return value;
  if (/^\d+$/.test(value)) return `gid://shopify/Collection/${value}`;
  return null;
}

function addUnique(target: string[], value: string | null): void {
  if (value && !target.includes(value)) target.push(value);
}

export function extractSellingPlanValidationSources(bundle: any): SellingPlanValidationSources {
  const productIds: string[] = [];
  const collectionIds: string[] = [];

  for (const product of asArray(bundle?.defaultProductsData?.products)) {
    addUnique(productIds, normalizeProductId(product.graphqlId ?? product.productId ?? product.id));
  }

  for (const step of asArray(bundle?.steps)) {
    for (const product of asArray(step.products)) {
      addUnique(productIds, normalizeProductId(product.id ?? product.productId ?? product.graphqlId));
    }
    for (const product of asArray(step.StepProduct)) {
      addUnique(productIds, normalizeProductId(product.productId ?? product.id ?? product.graphqlId));
    }
    for (const collection of asArray(step.collections)) {
      addUnique(collectionIds, normalizeCollectionId(collection.id ?? collection.collectionGid));
    }
    for (const category of asArray(step.StepCategory)) {
      for (const product of asArray(category.products)) {
        addUnique(productIds, normalizeProductId(product.id ?? product.productId ?? product.graphqlId));
      }
      for (const collection of asArray(category.collections)) {
        addUnique(collectionIds, normalizeCollectionId(collection.id ?? collection.collectionGid));
      }
      for (const collection of asArray(category.collectionsSelectedData)) {
        addUnique(collectionIds, normalizeCollectionId(collection.id ?? collection.collectionGid));
      }
    }
  }

  return { productIds, collectionIds };
}

export function deriveCommonSellingPlanGroups(products: SellingPlanProduct[]): SellingPlanGroupSummary[] {
  if (products.length === 0) return [];

  const [firstProduct, ...remainingProducts] = products;
  const commonById = new Map<string, SellingPlanGroupSummary>();
  for (const group of asArray(firstProduct.sellingPlanGroups?.nodes)) {
    if (typeof group?.id === "string" && typeof group?.name === "string") {
      commonById.set(group.id, { id: group.id, name: group.name });
    }
  }

  for (const product of remainingProducts) {
    const productGroupIds = new Set(
      asArray(product.sellingPlanGroups?.nodes)
        .map((group: SellingPlanGroupSummary) => group?.id)
        .filter((id: unknown): id is string => typeof id === "string")
    );
    for (const groupId of Array.from(commonById.keys())) {
      if (!productGroupIds.has(groupId)) commonById.delete(groupId);
    }
  }

  return Array.from(commonById.values());
}

export function resolveProductPageThemeEditorTemplateHandle(template: ProductPageThemeTemplateOption): string {
  const handle = typeof template?.handle === "string" && template.handle.trim() !== ""
    ? template.handle
    : "product";

  return handle;
}

export function buildProductPageThemeEditorDeepLink(input: ProductPageThemeEditorDeepLinkInput): string {
  const shopDomain = input.shop.includes(".myshopify.com")
    ? input.shop
    : `${input.shop}.myshopify.com`;
  const templateHandle = resolveProductPageThemeEditorTemplateHandle(input.template);
  const previewPath = typeof input.productHandle === "string" && input.productHandle.trim() !== ""
    ? `&previewPath=${encodeURIComponent(`/products/${input.productHandle}`)}`
    : "";

  return `https://${shopDomain}/admin/themes/current/editor?template=${templateHandle}&addAppBlockId=${input.apiKey}/${input.blockHandle}&target=newAppsSection&bundleId=${input.bundleId}${previewPath}`;
}
