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

export interface ConfigureSectionModelItem extends ConfigureChildItem {
  slots: string[];
}

export interface BundleSettingsSlotModel {
  shared: string[];
  fullPageOnly: string[];
  productPageOnly: string[];
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
      isLinked: Boolean(input.fullPageUrl),
      url: input.fullPageUrl ?? "",
      emptyMessage: "Bundle link is unavailable.",
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

const STEP_SETUP_SECTION_MODEL: ConfigureSectionModelItem[] = [
  { id: "step_flow", label: "Step Flow", slots: [] },
  { id: "step_setup_details", label: "Step Setup", slots: [] },
  { id: "category", label: "Category", slots: [] },
  { id: "rules_configuration", label: "Rules Configuration", slots: [] },
  { id: "step_config", label: "Step Config", slots: [] },
];

export function buildStepSetupSectionModel(
  bundleType: ConfigureBundleType,
): ConfigureSectionModelItem[] {
  return STEP_SETUP_SECTION_MODEL.map((section) => ({
    ...section,
    slots:
      bundleType === "product_page" && section.id === "category"
        ? ["category_variant_controls"]
        : [],
  }));
}

const SHARED_BUNDLE_SETTINGS_SLOTS = [
  "default_products",
  "quantity_validation",
  "summary_text",
];

export function buildBundleSettingsSlotModel(
  bundleType: ConfigureBundleType,
): BundleSettingsSlotModel {
  return {
    shared: [...SHARED_BUNDLE_SETTINGS_SLOTS],
    fullPageOnly:
      bundleType === "full_page" ? ["product_slots", "slot_icon"] : [],
    productPageOnly:
      bundleType === "product_page"
        ? [
            "variant_selector",
            "cart_line_discount_display",
            "bundle_banner",
            "bundle_level_css",
            "subscription_controls",
            "bundle_embed",
            "place_widget",
          ]
        : [],
  };
}

export function applyPpbCategoryVariantFlags<T extends Record<string, unknown>>(
  categories: T[],
  flags: {
    displayVariantsAsIndividualProducts?: boolean;
    displayVariantsAsSwatches?: boolean;
  },
): T[] {
  return categories.map((category) => ({
    ...category,
    ...(typeof flags.displayVariantsAsIndividualProducts === "boolean"
      ? {
          displayVariantsAsIndividualProducts:
            flags.displayVariantsAsIndividualProducts,
        }
      : {}),
    ...(typeof flags.displayVariantsAsSwatches === "boolean"
      ? { displayVariantsAsSwatches: flags.displayVariantsAsSwatches }
      : {}),
  }));
}

export function updatePpbCategoryVariantFlag<
  T extends Record<string, unknown>,
>(categories: T[], categoryIndex: number, enabled: boolean): T[] {
  return categories.map((category, index) =>
    index === categoryIndex
      ? {
          ...category,
          displayVariantsAsIndividualProducts: enabled,
        }
      : category,
  );
}
