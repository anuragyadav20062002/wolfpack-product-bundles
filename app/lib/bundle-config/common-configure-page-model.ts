export type ConfigureBundleType = "full_page" | "product_page";

export interface ConfigureSetupItem {
  id: string;
  label: string;
  iconType: string;
  fullPageOnly?: boolean;
}

export interface ConfigureChildItem {
  id: string;
  label: string;
}

const COMMON_SETUP_ITEMS: ConfigureSetupItem[] = [
  { id: "step_setup", label: "Step Setup", iconType: "note" },
  { id: "discount_pricing", label: "Discount & Pricing", iconType: "filter" },
  { id: "bundle_visibility", label: "Bundle Visibility", iconType: "view" },
  { id: "bundle_settings", label: "Bundle Settings", iconType: "edit" },
];

const SELECT_TEMPLATE_ITEM: ConfigureSetupItem = {
  id: "select_template",
  label: "Select Template",
  iconType: "paint-brush-flat",
};

const SUBSCRIPTIONS_ITEM: ConfigureSetupItem = {
  id: "subscriptions",
  label: "Subscriptions",
  iconType: "clock",
};

export function buildConfigureSetupItems(
  bundleType: ConfigureBundleType,
): ConfigureSetupItem[] {
  const items = [...COMMON_SETUP_ITEMS];
  if (bundleType === "product_page") {
    items.push(SUBSCRIPTIONS_ITEM);
  }
  items.push(SELECT_TEMPLATE_ITEM);
  return items.map((item) => ({
    ...item,
    fullPageOnly: bundleType === "full_page" && item.id === "bundle_visibility",
  }));
}

export function buildBundleVisibilityChildItems(
  bundleType: ConfigureBundleType,
): ConfigureChildItem[] {
  const items = [{ id: "bundle_widget", label: "Bundle Widget" }];
  if (bundleType === "product_page") {
    items.push({ id: "bundle_embed", label: "Bundle Embed" });
  }
  return items;
}

export interface EmbedStatusModel {
  enabled: boolean;
  label: "Enabled" | "Disabled";
  tone: "success" | "warning";
  description: string;
}

export function buildEmbedStatusModel(
  _bundleType: ConfigureBundleType,
  enabled: boolean,
): EmbedStatusModel {
  return {
    enabled,
    label: enabled ? "Enabled" : "Disabled",
    tone: enabled ? "success" : "warning",
    description: enabled
      ? "Your store is connected and ready. Your bundle can now render on your storefront."
      : "Enable the Theme app extension for Wolfpack Bundles to place and preview the bundle.",
  };
}

export interface BundleLinkModel {
  kind: "page" | "product";
  isLinked: boolean;
  url: string;
  emptyMessage: string;
}

export function buildBundleLinkModel(input: {
  bundleType: ConfigureBundleType;
  fullPageUrl?: string | null;
  pageHandle?: string | null;
  shop?: string | null;
  productHandle?: string | null;
}): BundleLinkModel {
  if (input.bundleType === "full_page") {
    return {
      kind: "page",
      isLinked: Boolean(input.pageHandle && input.fullPageUrl),
      url: input.fullPageUrl ?? "",
      emptyMessage: "Bundle page not yet linked.",
    };
  }

  const shop = input.shop?.trim();
  const handle = input.productHandle?.trim();
  return {
    kind: "product",
    isLinked: Boolean(shop && handle),
    url: shop && handle ? `https://${shop}/products/${handle}` : "",
    emptyMessage: "Bundle product not yet linked.",
  };
}

export function isMultiLanguageActionDisabled(locales: unknown[]): boolean {
  return locales.length === 0;
}
