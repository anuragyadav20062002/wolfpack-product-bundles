import type { CSSProperties } from "react";
import { FPB_TEMPLATE_CONFIGS } from "../../../assets/widgets/full-page/templates/registry.js";
import { PPB_TEMPLATE_CONFIGS } from "../../../assets/widgets/product-page/templates/registry.js";
import {
  mapTemplateSelection,
  type BundleContractType,
  type TemplateKey,
  type TemplateSelection,
} from "../../../lib/bundle-config/template-selection";
import { buildSettingsDesignRuntime } from "../../../lib/settings-design-runtime";

export type DesignPreviewSurface =
  | "builder"
  | "product-picker"
  | "cart-summary"
  | "loading"
  | "validation"
  | "upsell";
export type DesignPreviewFamily = "full-page" | "product-page";
export type DesignPreviewViewport = "desktop" | "mobile";
export type DesignPreviewNavigation =
  | "timeline"
  | "compact-timeline"
  | "horizontal-timeline"
  | "cascade-steps"
  | "cognive-steps"
  | "none";
export type DesignPreviewCategories = "accordion" | "pills" | "underline" | "tabs" | "none";
export type DesignPreviewSummary = "rows" | "slot-grid" | "compact-slots" | "cascade-drawer" | "pdp-footer" | "modal-footer";

export interface DesignPreviewProductCardContract {
  mode: "grid" | "compact" | "row";
  columns: {
    desktop: number;
    mobile: number;
  };
}

export interface DesignPreviewTemplateDescriptor {
  key: TemplateKey;
  bundleType: BundleContractType;
  translationKey: string;
  family: DesignPreviewFamily;
  selection: TemplateSelection;
  productCard: DesignPreviewProductCardContract;
  navigation: DesignPreviewNavigation;
  categories: DesignPreviewCategories;
  summary: DesignPreviewSummary;
  slotOrientation?: "horizontal" | "vertical";
  supportedSurfaces: readonly DesignPreviewSurface[];
  sceneRegions: Record<DesignPreviewViewport, readonly string[]>;
}

export interface DesignPreviewFieldTarget {
  surface: DesignPreviewSurface;
  elements: readonly string[];
  templates?: readonly TemplateKey[];
  surfaceOverrides?: Partial<Record<TemplateKey, DesignPreviewSurface>>;
}

export interface DesignPreviewFixtureProduct {
  id: string;
  translationKey: string;
  imageUrl: string;
  selected: boolean;
  quantity: number;
}

export interface DesignPreviewFixture {
  steps: readonly { id: string; translationKey: string }[];
  categories: readonly { id: string; translationKey: string }[];
  products: readonly DesignPreviewFixtureProduct[];
  discountTiers: readonly { minimum: number; percentage: number }[];
  emptySlots: readonly { id: string; position: number }[];
  validationMessage: string;
  upsell: DesignPreviewFixtureProduct;
}

export interface DesignPreviewScene {
  templateKey: TemplateKey;
  surface: DesignPreviewSurface;
  viewport: DesignPreviewViewport;
  regions: readonly string[];
}

export type DesignPreviewTheme = CSSProperties & Record<`--preview-${string}`, string>;

type RuntimeTemplateConfig = {
  productCard?: {
    mode?: string;
    columns?: { desktop?: number; mobile?: number };
  };
  summary?: { mode?: string };
  timeline?: { mode?: string };
  slots?: { orientation?: string };
};

function resolveProductCardMode(mode: string | undefined): DesignPreviewProductCardContract["mode"] {
  return mode === "compact" || mode === "row" ? mode : "grid";
}

function resolveSlotOrientation(orientation: string | undefined) {
  return orientation === "horizontal" || orientation === "vertical" ? orientation : undefined;
}

function resolveFullPageNavigation(mode: string | undefined): DesignPreviewNavigation {
  if (mode === "compact") return "compact-timeline";
  if (mode === "horizontal") return "horizontal-timeline";
  return "timeline";
}

function resolveFullPageSummary(mode: string | undefined): DesignPreviewSummary {
  if (mode === "slots") return "slot-grid";
  if (mode === "compactSlots") return "compact-slots";
  return "rows";
}

function resolveProductPageNavigation(selection: TemplateSelection): DesignPreviewNavigation {
  if (selection.bundleDesignPresetId === "CASCADE") return "cascade-steps";
  if (selection.bundleDesignPresetId === "COGNIVE") return "cognive-steps";
  return "none";
}

function resolveProductPageSummary(mode: string | undefined): DesignPreviewSummary {
  if (mode === "drawerRows") return "cascade-drawer";
  if (mode === "drawer") return "pdp-footer";
  return "modal-footer";
}

const ALL_FPB_TEMPLATES: readonly TemplateKey[] = ["standard", "classic", "compact", "horizontal"];
const PRODUCT_PAGE_TEMPLATES: readonly TemplateKey[] = ["product-list", "product-grid", "horizontal-slots", "vertical-slots"];
const SLOT_TEMPLATES: readonly TemplateKey[] = ["horizontal-slots", "vertical-slots"];
const CATEGORY_TEMPLATES: readonly TemplateKey[] = ["classic", "compact", "horizontal", "product-list", "product-grid"];
const COMMON_SURFACES = ["builder", "cart-summary", "loading", "validation", "upsell"] as const;
const SLOT_SURFACES = ["builder", "product-picker", "cart-summary", "loading", "validation", "upsell"] as const;

function fullPageDescriptor(
  key: "standard" | "classic" | "compact" | "horizontal",
  translationKey: string,
  config: RuntimeTemplateConfig,
  adapter: Pick<DesignPreviewTemplateDescriptor, "categories" | "sceneRegions">,
): DesignPreviewTemplateDescriptor {
  const configuredColumns = config.productCard?.columns;
  return {
    key,
    bundleType: "full_page",
    translationKey,
    family: "full-page",
    selection: mapTemplateSelection("full_page", key),
    navigation: resolveFullPageNavigation(config.timeline?.mode),
    summary: resolveFullPageSummary(config.summary?.mode),
    productCard: {
      mode: resolveProductCardMode(config.productCard?.mode),
      columns: {
        // Horizontal renders two intrinsic row tracks in the storefront shell even
        // though each row primitive owns a single-column internal contract.
        desktop: key === "horizontal" ? 2 : configuredColumns?.desktop ?? 3,
        mobile: configuredColumns?.mobile ?? 2,
      },
    },
    supportedSurfaces: COMMON_SURFACES,
    ...adapter,
  };
}

function productPageDescriptor(
  key: "product-list" | "product-grid" | "horizontal-slots" | "vertical-slots",
  translationKey: string,
  config: RuntimeTemplateConfig,
  adapter: Pick<DesignPreviewTemplateDescriptor, "categories" | "sceneRegions">,
): DesignPreviewTemplateDescriptor {
  const slotOrientation = resolveSlotOrientation(config.slots?.orientation);
  const isSlotTemplate = Boolean(slotOrientation);
  const selection = mapTemplateSelection("product_page", key);
  return {
    key,
    bundleType: "product_page",
    translationKey,
    family: "product-page",
    selection,
    navigation: resolveProductPageNavigation(selection),
    summary: resolveProductPageSummary(config.summary?.mode),
    productCard: {
      mode: resolveProductCardMode(config.productCard?.mode),
      columns: key === "product-list"
        ? { desktop: 1, mobile: 1 }
        : key === "product-grid"
          ? { desktop: 4, mobile: 2 }
          : { desktop: 3, mobile: 2 },
    },
    slotOrientation,
    supportedSurfaces: isSlotTemplate ? SLOT_SURFACES : COMMON_SURFACES,
    ...adapter,
  };
}

export const DESIGN_PREVIEW_TEMPLATES: readonly DesignPreviewTemplateDescriptor[] = [
  fullPageDescriptor("standard", "settingsDcp.preview.templates.standard", FPB_TEMPLATE_CONFIGS.STANDARD, {
    categories: "accordion",
    sceneRegions: {
      desktop: ["timeline", "category-accordion", "product-grid", "summary-sidebar"],
      mobile: ["timeline", "category-accordion", "product-grid", "sticky-summary-tray"],
    },
  }),
  fullPageDescriptor("classic", "settingsDcp.preview.templates.classic", FPB_TEMPLATE_CONFIGS.CLASSIC, {
    categories: "pills",
    sceneRegions: {
      desktop: ["timeline", "pill-categories", "product-grid", "slot-summary"],
      mobile: ["timeline", "pill-categories", "product-grid", "expandable-summary-tray"],
    },
  }),
  fullPageDescriptor("compact", "settingsDcp.preview.templates.compact", FPB_TEMPLATE_CONFIGS.COMPACT, {
    categories: "pills",
    sceneRegions: {
      desktop: ["compact-timeline", "pill-categories", "product-grid", "compact-slot-summary"],
      mobile: ["compact-timeline", "pill-categories", "product-grid", "compact-summary-tray"],
    },
  }),
  fullPageDescriptor("horizontal", "settingsDcp.preview.templates.horizontal", FPB_TEMPLATE_CONFIGS.HORIZONTAL, {
    categories: "underline",
    sceneRegions: {
      desktop: ["horizontal-timeline", "underline-categories", "product-rows", "summary-sidebar"],
      mobile: ["horizontal-timeline", "underline-categories", "product-rows", "sticky-summary-tray"],
    },
  }),
  productPageDescriptor("product-list", "settingsDcp.preview.templates.productList", PPB_TEMPLATE_CONFIGS.LIST, {
    categories: "tabs",
    sceneRegions: {
      desktop: ["neutral-pdp-shell", "cascade-step-flow", "category-tabs", "product-rows", "pdp-footer"],
      mobile: ["neutral-pdp-shell", "cascade-step-flow", "category-tabs", "product-rows", "pdp-footer"],
    },
  }),
  productPageDescriptor("product-grid", "settingsDcp.preview.templates.productGrid", PPB_TEMPLATE_CONFIGS.GRID, {
    categories: "tabs",
    sceneRegions: {
      desktop: ["neutral-pdp-shell", "cognive-step-headers", "category-tabs", "product-grid", "pdp-footer"],
      mobile: ["neutral-pdp-shell", "cognive-step-headers", "category-tabs", "product-grid", "pdp-footer"],
    },
  }),
  productPageDescriptor("horizontal-slots", "settingsDcp.preview.templates.horizontalSlots", PPB_TEMPLATE_CONFIGS.HORIZONTAL_SLOTS, {
    categories: "none",
    sceneRegions: {
      desktop: ["neutral-pdp-shell", "horizontal-slots", "modal-footer"],
      mobile: ["neutral-pdp-shell", "horizontal-slots", "modal-footer"],
    },
  }),
  productPageDescriptor("vertical-slots", "settingsDcp.preview.templates.verticalSlots", PPB_TEMPLATE_CONFIGS.VERTICAL_SLOTS, {
    categories: "none",
    sceneRegions: {
      desktop: ["neutral-pdp-shell", "vertical-slots", "modal-footer"],
      mobile: ["neutral-pdp-shell", "vertical-slots", "modal-footer"],
    },
  }),
] as const;

export const DESIGN_PREVIEW_FIXTURE: DesignPreviewFixture = {
  steps: [
    { id: "products", translationKey: "settingsDcp.preview.surface.stepOne" },
    { id: "review", translationKey: "settingsDcp.preview.surface.stepTwo" },
  ],
  categories: [
    { id: "essentials", translationKey: "settingsDcp.preview.surface.categoryOne" },
    { id: "favourites", translationKey: "settingsDcp.preview.surface.categoryTwo" },
    { id: "extras", translationKey: "settingsDcp.preview.surface.categoryThree" },
  ],
  products: [
    { id: "first", translationKey: "settingsDcp.preview.surface.products.first", imageUrl: "/design-preview-product-1.png", selected: true, quantity: 1 },
    { id: "second", translationKey: "settingsDcp.preview.surface.products.second", imageUrl: "/design-preview-product-2.png", selected: true, quantity: 1 },
    { id: "third", translationKey: "settingsDcp.preview.surface.products.third", imageUrl: "/design-preview-product-3.png", selected: false, quantity: 0 },
    { id: "fourth", translationKey: "settingsDcp.preview.surface.products.fourth", imageUrl: "/design-preview-product-4.png", selected: false, quantity: 0 },
  ],
  discountTiers: [
    { minimum: 2, percentage: 10 },
    { minimum: 3, percentage: 15 },
    { minimum: 4, percentage: 20 },
  ],
  emptySlots: [
    { id: "slot-2", position: 2 },
    { id: "slot-3", position: 3 },
  ],
  validationMessage: "settingsDcp.preview.surface.validationMessage",
  upsell: { id: "fourth", translationKey: "settingsDcp.preview.surface.products.fourth", imageUrl: "/design-preview-product-4.png", selected: false, quantity: 0 },
};

const target = (
  surface: DesignPreviewSurface,
  elements: readonly string[],
  options: Pick<DesignPreviewFieldTarget, "templates" | "surfaceOverrides"> = {},
): DesignPreviewFieldTarget => ({ surface, elements, ...options });
const builderTarget = (...elements: string[]) => target("builder", elements);
const productTarget = (...elements: string[]) => target("builder", elements, {
  surfaceOverrides: { "horizontal-slots": "product-picker", "vertical-slots": "product-picker" },
});
const cartTarget = (...elements: string[]) => target("cart-summary", elements);

export const DESIGN_PREVIEW_FIELD_TARGETS: Readonly<Record<string, DesignPreviewFieldTarget>> = {
  "Primary Color": builderTarget("product action", "active navigation", "progress", "cart action"),
  "Button Text Color": builderTarget("action text", "active navigation text"),
  "Primary Text Color": builderTarget("product text", "prices", "navigation", "cart text"),
  "Secondary Color": builderTarget("inactive navigation", "empty progress", "quantity controls"),
  "Product Background Color": productTarget("product cards", "cart", "empty slots"),
  "Primary Font Size": productTarget("product titles", "primary prices", "step text"),
  "Primary Font Weight": productTarget("product titles", "primary prices"),
  "Secondary Font Size": productTarget("compare-at prices", "discount text"),
  "Secondary Font Weight": productTarget("compare-at prices", "discount text"),
  "Body Font Size": productTarget("variant labels", "supporting text"),
  "Body Font Weight": productTarget("variant labels", "supporting text"),
  "Bundle Buttons Corner Style": productTarget("buttons", "tabs", "quantity controls"),
  "Bundle Buttons Base": productTarget("buttons", "tabs", "quantity controls"),
  "Product Card & Cart Corner Style": productTarget("product cards", "cart"),
  "Product Card & Cart Base": productTarget("product cards", "cart", "product images"),
  "Image Fit": productTarget("product images"),
  "expert.navigationBanner.navigationBannerStepCompletionColor": target("builder", ["completed steps"], { templates: ALL_FPB_TEMPLATES }),
  "expert.navigationBanner.navigationCheckColor": target("builder", ["completed step checks"], { templates: ALL_FPB_TEMPLATES }),
  "expert.navigationBanner.navigationBannerStepTextColor": target("builder", ["step labels"], { templates: ALL_FPB_TEMPLATES }),
  "expert.generalSettings.productPageTitleColor": target("builder", ["product-page title"], { templates: PRODUCT_PAGE_TEMPLATES }),
  "expert.navigationBanner.navigationBannerStepProgressBarEmptyColor": target("builder", ["step progress"], { templates: ALL_FPB_TEMPLATES }),
  "expert.generalSettings.loadingBgColor": target("loading", ["loading overlay"]),
  "expert.generalSettings.conditionToastBgColor": target("validation", ["condition toast"]),
  "expert.generalSettings.conditionToastTextColor": target("validation", ["condition toast text"]),
  "expert.navigationBanner.tabsActiveBgColor": target("builder", ["active categories"], { templates: CATEGORY_TEMPLATES }),
  "expert.navigationBanner.tabsActiveTextColor": target("builder", ["active category text"], { templates: CATEGORY_TEMPLATES }),
  "expert.navigationBanner.tabsInactiveBgColor": target("builder", ["inactive categories"], { templates: CATEGORY_TEMPLATES }),
  "expert.navigationBanner.tabsInactiveTextColor": target("builder", ["inactive category text"], { templates: CATEGORY_TEMPLATES }),
  "expert.productCard.productCardBgColor": productTarget("product cards"),
  "expert.productCard.productCardTextColor": productTarget("product titles"),
  "expert.productCard.productCardButtonColor": productTarget("product actions"),
  "expert.productCard.productCardButtonTextColor": productTarget("product action text"),
  "expert.emptyStateCard.emptyStateCardBorderColor": target("builder", ["empty slot border", "empty slot icon"], { templates: SLOT_TEMPLATES }),
  "expert.emptyStateCard.emptyStateCardTextColor": target("builder", ["empty slot text"], { templates: SLOT_TEMPLATES }),
  "expert.cartFooter.cartFooterBgColor": cartTarget("cart"),
  "expert.cartFooter.cartFooterTextColor": cartTarget("cart text"),
  "expert.cartFooter.cartFooterNextButtonColor": cartTarget("next action"),
  "expert.cartFooter.cartFooterNextButtonTextColor": cartTarget("next action text"),
  "expert.cartFooter.cartFooterBackButtonColor": target("cart-summary", ["back action"], { templates: ALL_FPB_TEMPLATES }),
  "expert.cartFooter.cartFooterBackButtonTextColor": cartTarget("back action text"),
  "expert.cartFooter.cartFooterDiscountTextColor": cartTarget("discount message"),
  "expert.cartFooter.cartFooterDiscountProgressBarEmptyColor": cartTarget("discount progress remainder"),
  "expert.cartFooter.cartFooterDiscountProgressBarFilledColor": cartTarget("discount progress fill"),
  "expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonBg": target("upsell", ["upsell action"]),
  "expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonTextColor": target("upsell", ["upsell action text"]),
  "expert.mixAndMatchConfig.generalSettings.bundleUpsellFontColor": target("upsell", ["upsell text"]),
};
const DESIGN_PREVIEW_FIELD_TARGET_MAP = new Map(Object.entries(DESIGN_PREVIEW_FIELD_TARGETS));

type JsonObject = Record<string, unknown>;

function readPath(source: JsonObject, path: string): string | undefined {
  let current: unknown = source;
  for (const segment of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    // Runtime paths are drawn only from this module's fixed token mapping.
    // eslint-disable-next-line security/detect-object-injection
    current = (current as JsonObject)[segment];
  }
  return current === null || current === undefined || current === "" ? undefined : String(current);
}

function readFirstPath(source: JsonObject, paths: readonly string[], fallback: string) {
  for (const path of paths) {
    const value = readPath(source, path);
    if (value !== undefined) return value;
  }
  return fallback;
}

function weightValue(value: string) {
  return value.toLowerCase() === "bold" ? "700" : "400";
}

export function getDesignPreviewTemplate(templateKey: TemplateKey) {
  return DESIGN_PREVIEW_TEMPLATES.find((template) => template.key === templateKey);
}

export function getSupportedDesignPreviewSurfaces(templateKey: TemplateKey) {
  return getDesignPreviewTemplate(templateKey)?.supportedSurfaces ?? COMMON_SURFACES;
}

export function getDesignPreviewFieldTarget(fieldKey: string, templateKey?: TemplateKey) {
  const fieldTarget = DESIGN_PREVIEW_FIELD_TARGET_MAP.get(fieldKey);
  if (!fieldTarget || !templateKey) return fieldTarget;
  const override = fieldTarget.surfaceOverrides
    ? new Map(Object.entries(fieldTarget.surfaceOverrides)).get(templateKey)
    : undefined;
  return override ? { ...fieldTarget, surface: override } : fieldTarget;
}

export function isDesignPreviewFieldApplicable(fieldKey: string, templateKey: TemplateKey) {
  const fieldTarget = getDesignPreviewFieldTarget(fieldKey, templateKey);
  return !fieldTarget?.templates || fieldTarget.templates.includes(templateKey);
}

export function getDesignPreviewScene(
  templateKey: TemplateKey,
  surface: DesignPreviewSurface,
  viewport: DesignPreviewViewport,
): DesignPreviewScene {
  const descriptor = getDesignPreviewTemplate(templateKey);
  if (!descriptor) throw new Error(`Unknown Design preview template "${templateKey}"`);

  const regions = viewport === "mobile"
    ? [...descriptor.sceneRegions.mobile]
    : [...descriptor.sceneRegions.desktop];
  if (surface === "product-picker" && descriptor.slotOrientation) {
    regions.push(viewport === "mobile" ? "product-picker-bottom-sheet" : "product-picker-modal");
  } else if (surface === "cart-summary") {
    if (templateKey === "product-list") regions.push("cascade-selected-drawer", "pdp-footer");
    else if (descriptor.family === "product-page") regions.push(descriptor.summary);
    else regions.push(viewport === "mobile" ? descriptor.sceneRegions.mobile.at(-1) ?? "sticky-summary-tray" : "summary-sidebar");
  } else if (surface !== "builder") {
    regions.push(`${surface}-overlay`);
  }

  return { templateKey, surface, viewport, regions: [...new Set(regions)] };
}

export function buildDesignPreviewTheme(
  fieldValues: Record<string, string>,
  isExpertControlsEnabled = false,
  templateKey: TemplateKey = "standard",
): DesignPreviewTheme {
  let runtime: ReturnType<typeof buildSettingsDesignRuntime>;
  try {
    runtime = buildSettingsDesignRuntime({ fieldValues, isExpertControlsEnabled });
  } catch {
    runtime = buildSettingsDesignRuntime({ fieldValues: {}, isExpertControlsEnabled });
  }
  const page = runtime.pageCustomization as JsonObject;
  const styles = page.stylePresets as JsonObject;
  const isProductPage = getDesignPreviewTemplate(templateKey)?.family === "product-page";
  const productRoot = isProductPage ? "mixAndMatchConfig.productCard" : "productCard";
  const footerRoot = isProductPage ? "mixAndMatchConfig.footer" : "cartFooter";
  const tabsRoot = isProductPage ? "mixAndMatchConfig.tabs" : "navigationBanner";
  const toastRoot = isProductPage ? "mixAndMatchConfig.toast" : "generalSettings";
  const upsellRoot = isProductPage ? "mixAndMatchConfig.generalSettings" : "generalSettings";

  return {
    "--preview-primary": readFirstPath(styles, ["colors.primaryColor"], "#000000"),
    "--preview-button-text": readFirstPath(styles, ["colors.buttonTextColor"], "#ffffff"),
    "--preview-primary-text": readFirstPath(styles, ["colors.primaryTextColor"], "#000000"),
    "--preview-accent": readFirstPath(styles, ["colors.accentColor"], "#eeeeee"),
    "--preview-product-bg": readFirstPath(page, [`${productRoot}.productCardBgColor`], "#ffffff"),
    "--preview-product-text": readFirstPath(page, [`${productRoot}.${isProductPage ? "productCardTitleColor" : "productCardTextColor"}`], "#000000"),
    "--preview-product-button-bg": readFirstPath(page, [`${productRoot}.${isProductPage ? "productCardButtonBgColor" : "productCardButtonColor"}`], "#000000"),
    "--preview-product-button-text": readFirstPath(page, [`${productRoot}.productCardButtonTextColor`], "#ffffff"),
    "--preview-compare-price": readFirstPath(page, [`${productRoot}.${isProductPage ? "productCardComparedAtPriceColor" : "compareAtPriceColor"}`], "#000000"),
    "--preview-quantity-bg": readFirstPath(page, [`${productRoot}.${isProductPage ? "productCardQuantityButtonBgColor" : "productCardQuantitySelectorBgColor"}`], "#eeeeee"),
    "--preview-quantity-text": readFirstPath(page, [`${productRoot}.${isProductPage ? "productCardQuantityLabelColor" : "quantitySelectorButtonTextColor"}`], "#000000"),
    "--preview-primary-font-size": readFirstPath(styles, ["typography.primaryFontSize"], "16px"),
    "--preview-primary-font-weight": weightValue(readFirstPath(styles, ["typography.primaryFontWeight"], "Bold")),
    "--preview-secondary-font-size": readFirstPath(styles, ["typography.secondaryFontSize"], "14px"),
    "--preview-secondary-font-weight": weightValue(readFirstPath(styles, ["typography.secondaryFontWeight"], "Bold")),
    "--preview-body-font-size": readFirstPath(styles, ["typography.bodyFontSize"], "14px"),
    "--preview-body-font-weight": weightValue(readFirstPath(styles, ["typography.bodyFontWeight"], "Regular")),
    "--preview-button-radius": readFirstPath(page, [`${productRoot}.${isProductPage ? "productCardButtonBorderRadius" : "buttonBorderRadius"}`], "5px"),
    "--preview-card-radius": readFirstPath(page, [`${productRoot}.${isProductPage ? "productCardBorderRadius" : "cardBorderRadius"}`], "10px"),
    "--preview-image-radius": readFirstPath(page, [`${productRoot}.${isProductPage ? "productCardImageBorderRadius" : "cardImageBorderRadius"}`], "8px"),
    "--preview-image-fit": readFirstPath(page, [`${productRoot}.${isProductPage ? "productCardImageFit" : "productImageFit"}`], "cover"),
    "--preview-step-completed": readFirstPath(page, ["navigationBanner.navigationBannerStepCompletionColor"], "#000000"),
    "--preview-step-check": readFirstPath(page, ["navigationBanner.navigationCheckColor"], "#ffffff"),
    "--preview-step-text": readFirstPath(page, ["navigationBanner.navigationBannerStepTextColor"], "#000000"),
    "--preview-step-empty": readFirstPath(page, ["navigationBanner.navigationBannerStepProgressBarEmptyColor"], "#cccccc"),
    "--preview-page-title": readFirstPath(page, ["generalSettings.productPageTitleColor"], "#000000"),
    "--preview-loading-bg": readFirstPath(page, ["generalSettings.loadingBgColor"], "rgba(255,255,255,0.92)"),
    "--preview-toast-bg": readFirstPath(page, [`${toastRoot}.${isProductPage ? "toastBgColor" : "conditionToastBgColor"}`], "#000000"),
    "--preview-toast-text": readFirstPath(page, [`${toastRoot}.${isProductPage ? "toastTextColor" : "conditionToastTextColor"}`], "#ffffff"),
    "--preview-tab-active-bg": readFirstPath(page, [`${tabsRoot}.tabsActiveBgColor`, "categoryBlock.tabActiveBgColor"], "#000000"),
    "--preview-tab-active-text": readFirstPath(page, [`${tabsRoot}.tabsActiveTextColor`, "categoryBlock.tabActiveTextColor"], "#ffffff"),
    "--preview-tab-inactive-bg": readFirstPath(page, [`${tabsRoot}.tabsInactiveBgColor`, "categoryBlock.tabInactiveBgColor"], "#eeeeee"),
    "--preview-tab-inactive-text": readFirstPath(page, [`${tabsRoot}.tabsInactiveTextColor`, "categoryBlock.tabInactiveTextColor"], "#000000"),
    "--preview-empty-bg": readFirstPath(page, ["mixAndMatchConfig.emptyStateCard.emptyStateCardBgColor"], "#ffffff"),
    "--preview-empty-border": readFirstPath(page, ["mixAndMatchConfig.emptyStateCard.emptyStateCardBorderColor"], "#000000"),
    "--preview-empty-icon": readFirstPath(page, ["mixAndMatchConfig.emptyStateCard.emptyStateCardIconColor"], "#000000"),
    "--preview-empty-text": readFirstPath(page, ["mixAndMatchConfig.emptyStateCard.emptyStateCardTextColor"], "#3e3e3e"),
    "--preview-cart-bg": readFirstPath(page, [`${footerRoot}.${isProductPage ? "footerBgColor" : "cartFooterBgColor"}`], "#ffffff"),
    "--preview-cart-text": readFirstPath(page, [`${footerRoot}.${isProductPage ? "footerTextColor" : "cartFooterTextColor"}`], "#000000"),
    "--preview-cart-next-bg": readFirstPath(page, [`${footerRoot}.${isProductPage ? "footerNextBtnBgColor" : "cartFooterNextButtonColor"}`], "#000000"),
    "--preview-cart-next-text": readFirstPath(page, [`${footerRoot}.${isProductPage ? "footerNextBtnTextColor" : "cartFooterNextButtonTextColor"}`], "#ffffff"),
    "--preview-cart-back-bg": readFirstPath(page, ["cartFooter.cartFooterBackButtonColor"], "#6d7175"),
    "--preview-cart-back-text": readFirstPath(page, [`${footerRoot}.${isProductPage ? "footerBackBtnTextColor" : "cartFooterBackButtonTextColor"}`], "#000000"),
    "--preview-discount-text": readFirstPath(page, [isProductPage ? "mixAndMatchConfig.bundleHeader.headerDiscountTextColor" : "cartFooter.cartFooterDiscountTextColor"], "#000000"),
    "--preview-discount-progress-empty": readFirstPath(page, [`${footerRoot}.${isProductPage ? "footerDiscountProgressBarEmptyColor" : "cartFooterDiscountProgressBarEmptyColor"}`], "#c1e7c5"),
    "--preview-discount-progress-filled": readFirstPath(page, [`${footerRoot}.${isProductPage ? "footerDiscountProgressBarFilledColor" : "cartFooterDiscountProgressBarFilledColor"}`], "#15a524"),
    "--preview-add-bundle-bg": readFirstPath(page, ["mixAndMatchConfig.addBundleBtn.addBundleBtnBgColor"], "#000000"),
    "--preview-add-bundle-text": readFirstPath(page, ["mixAndMatchConfig.addBundleBtn.addBundleBtnTextColor"], "#ffffff"),
    "--preview-upsell-button-bg": readFirstPath(page, [`${upsellRoot}.${isProductPage ? "bundleUpsellButtonBg" : "bundleUpSellButtonBg"}`], "#000000"),
    "--preview-upsell-button-text": readFirstPath(page, [`${upsellRoot}.${isProductPage ? "bundleUpsellButtonTextColor" : "bundleUpsellTextColor"}`], "#ffffff"),
    "--preview-upsell-text": readFirstPath(page, [`${upsellRoot}.bundleUpsellFontColor`], "#000000"),
  };
}
