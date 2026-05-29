import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, useRevalidator } from "@remix-run/react";
import { AppLogger } from "../../../lib/logger";
import { slugify, validateSlug } from "../../../lib/slug-utils";
import {
  getDefaultDiscountRuleSuccessMessage,
  getDefaultDiscountRuleText,
  normalizePricingDisplayOptions,
  normalizePricingRuleMessages,
  serializePricingDisplayOptions,
} from "../../../lib/pricing-display-options";

import {
  DiscountMethod,
  type PricingRule,
  centsToAmount,
  amountToCents,
  createNewPricingRule,
} from "../../../types/pricing";
import {
  STEP_CONDITION_TYPE_OPTIONS,
  STEP_CONDITION_OPERATOR_OPTIONS,
  CATEGORY_CONDITION_OPERATOR_OPTIONS,
  DISCOUNT_METHOD_OPTIONS,
} from "../../../constants/bundle";
import { useTranslation } from "react-i18next";
import { HELP_TOOLTIPS, type HelpTooltipKey, type HelpTooltipVisual } from "../../../constants/help-tooltips";
import { ERROR_MESSAGES } from "../../../constants/errors";
import { FilePicker } from "../../../components/design-control-panel/settings/FilePicker";
import { PricingTiersSection } from "../../../components/PricingTiersSection";
import { BundleReadinessOverlay, type BundleReadinessItem } from "../../../components/bundle-configure/BundleReadinessOverlay";
import {
  MultiLanguageTextModal,
  type MultiLanguageField,
} from "../../../components/bundle-configure/MultiLanguageTextModal";
import { DiscardChangesModal } from "../../../components/bundle-configure/DiscardChangesModal";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
// Using modern App Bridge SaveBar with declarative 'open' prop for React-friendly state management
import { requireAdminSession } from "../../../lib/auth-guards.server";
import db from "../../../db.server";
import { useBundleConfigurationState } from "../../../hooks/useBundleConfigurationState";
import fullPageBundleStyles from "../../../styles/routes/full-page-bundle-configure.module.css";

// Action handlers - extracted to separate module for better organization
import {
  handleSaveBundle,
  handleSyncBundle,
  handleUpdateBundleStatus,
  handleSyncProduct,
  handleUpdateBundleProduct,
  handleGetPages,
  handleGetThemeTemplates,
  handleGetCurrentTheme,
  handleEnsureBundleTemplates,
  handleCheckFullPageTemplate,
  handleValidateWidgetPlacement,
  handleCreatePreviewPage,
  handleRenamePageSlug,
  handleUpdateBundleDesignTemplate,
} from "./handlers";

import { AppEmbedBanner } from "../../../components/AppEmbedBanner";
import { UnlistedBundleBanner } from "../../../components/UnlistedBundleBanner";
import { EnablePreviewModal } from "../../../components/EnablePreviewModal";
import { useEnablePreviewGate } from "../../../hooks/useEnablePreviewGate";
import {
  fetchBundleProduct,
  fetchShopLocales,
  fetchEmbedData,
} from "../../../lib/bundle-configure-loader.server";
import {
  showPolarisModal,
  hidePolarisModal,
  useModalHideListener,
} from "../_shared/bundle-configure/modal-utils";
import { BundleStatusSection } from "../_shared/bundle-configure/BundleStatusSection";
import { useSharedBundleHandlers } from "../../../hooks/useSharedBundleHandlers";

// Types - extracted to separate module for better organization
import type { LoaderData } from "./types";

const fullPageTemplateOptions = [
  { presetId: "DEFAULT",    label: "Standard Design",   image: "/fullPageThumbnail.png"     },
  { presetId: "CLASSIC",    label: "Classic Design",    image: "/sidePanelThumbnail.png"    },
  { presetId: "COMPACT",    label: "Compact Design",    image: "/floatingCardThumbnail.png" },
  { presetId: "HORIZONTAL", label: "Horizontal Design", image: "/productPageThumbnail.png"  },
] as const;

const FPB_DESIGN_CONTROL_PANEL_URL = "/app/design-control-panel?modal=full_page&section=globalColors";


export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await requireAdminSession(request);
  const { bundleId } = params;

  if (!bundleId) {
    throw new Response(ERROR_MESSAGES.BUNDLE_ID_REQUIRED, { status: 400 });
  }

  // Fetch the bundle with all related data
  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: session.shop,
      // Note: bundleType filter removed - not needed for single bundle lookup
    },
    include: {
      steps: {
        include: {
          StepProduct: true,
          StepCategory: { orderBy: { sortOrder: "asc" } }
        }
      },
      pricing: true
    },
  });

  if (!bundle) {
    throw new Response(ERROR_MESSAGES.BUNDLE_NOT_FOUND, { status: 404 });
  }


  // CRITICAL: Use app's API key (client_id from shopify.app.toml), NOT extension UUID
  // Per Shopify docs: addAppBlockId={api_key}/{handle}
  // Reference: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
  const apiKey = process.env.SHOPIFY_API_KEY || '';
  // Block handle must match the liquid filename (without .liquid extension)
  // File: extensions/bundle-builder/blocks/bundle-full-page.liquid
  const blockHandle = 'bundle-full-page';

  const [bundleProduct, shopLocales, availableBundles, embedData] = await Promise.all([
    bundle.shopifyProductId
      ? fetchBundleProduct(admin, bundle.shopifyProductId, bundleId)
      : Promise.resolve(null),
    fetchShopLocales(admin),
    db.bundle.findMany({
      where: {
        shopId: session.shop,
        bundleType: 'full_page',
        status: { in: ['draft', 'active'] },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    fetchEmbedData(admin, session.shop, apiKey, "bundle-app-embed"),
  ]);

  return json({
    bundle,
    bundleProduct,
    availableBundles,
    shop: session.shop,
    apiKey,
    blockHandle,
    shopLocales,
    appEmbedEnabled: embedData.appEmbedEnabled,
    themeEditorUrl: embedData.themeEditorUrl,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  try {
    const { session, admin } = await requireAdminSession(request);
    const { bundleId } = params;


    if (!session?.shop) {
      return json({ success: false, error: ERROR_MESSAGES.AUTH_REQUIRED }, { status: 401 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (!bundleId) {
      return json({ success: false, error: ERROR_MESSAGES.BUNDLE_ID_REQUIRED }, { status: 400 });
    }

    switch (intent) {
      case "saveBundle":
        return await handleSaveBundle(admin, session, bundleId, formData);
      case "updateBundleStatus":
        return await handleUpdateBundleStatus(admin, session, bundleId, formData);
      case "syncProduct":
        return await handleSyncProduct(admin, session, bundleId, formData);
      case "updateBundleProduct":
        return await handleUpdateBundleProduct(admin, session, bundleId, formData);
      case "getPages":
        return await handleGetPages(admin, session);
      case "getThemeTemplates":
        return await handleGetThemeTemplates(admin, session);
      case "getCurrentTheme":
        return await handleGetCurrentTheme(admin, session);
      case "ensureBundleTemplates":
        return await handleEnsureBundleTemplates(admin, session);
      case "checkFullPageTemplate":
        return await handleCheckFullPageTemplate(admin, session);
      case "validateWidgetPlacement":
        return await handleValidateWidgetPlacement(
          admin,
          session,
          bundleId,
          String(formData.get("desiredSlug") || "")
        );
      case "renamePageSlug":
        return await handleRenamePageSlug(
          admin,
          session,
          bundleId,
          String(formData.get("newSlug") || "")
        );
      case "createPreviewPage":
        return await handleCreatePreviewPage(admin, session, bundleId);
      case "syncBundle":
        return await handleSyncBundle(admin, session, bundleId);
      case "updateBundleDesignTemplate":
        return await handleUpdateBundleDesignTemplate(admin, session, bundleId, formData);
      default:
        return json({ success: false, error: ERROR_MESSAGES.UNKNOWN_ACTION }, { status: 400 });
    }
  } catch (error) {
    AppLogger.error("Action failed", {
      component: 'bundle-config',
      operation: 'action'
    }, error);
    return json({ success: false, error: (error as Error).message || "An error occurred" }, { status: 500 });
  }
};

// Handler functions have been extracted to ./app.bundles.full-page-bundle.configure.$bundleId/handlers/
// Static navigation items - moved outside component to prevent recreation on every render
const bundleSetupItems = [
  { id: "step_setup",        label: "Step Setup",         iconType: "note",   fullPageOnly: false },
  { id: "discount_pricing",  label: "Discount & Pricing", iconType: "filter", fullPageOnly: false },
  { id: "bundle_visibility", label: "Bundle Visibility",  iconType: "view",   fullPageOnly: true  },
  { id: "bundle_settings",   label: "Bundle Settings",    iconType: "edit",   fullPageOnly: false },
  { id: "select_template",   label: "Select Template",    iconType: "paint-brush-flat", fullPageOnly: false },
];

const stepSetupChildItems = [
  { id: "free_gift_addons", label: "Free Gift & Add Ons" },
  { id: "messages", label: "Messages" },
];

const ADDON_MESSAGE_KEY = "addons-direct";

const bundleVisibilityChildItems = [
  { id: "bundle_widget", label: "Bundle Widget" },
];

const TEMPLATE_VARIABLES: [string, string][] = [
  ["{{discountConditionDiff}}", "The remaining quantity or monetary amount a customer needs to add to their cart to unlock the discount."],
  ["{{discountUnit}}", "The symbol for the discount requirement, such as your store's currency symbol ($) for amount-based rules."],
  ["{{discountValue}}", "The numerical value of the discount reward itself (e.g., the '10' in a 10% or $10 discount)."],
  ["{{discountValueUnit}}", "The symbol used for the discount reward, such as the percent sign (%) or the store's currency symbol ($)."],
  ["{{discountedItems}}", "The quantity of items that will be discounted or given free as part of the \"Get Y\" offer."],
];

type VisibilityDisplayConfiguration = {
  showOnAllBundleProducts: boolean;
  selectedProducts: unknown[];
  showOnSpecificProductPages: unknown[];
  collectionsSelectedData: unknown[];
  showOnSpecificCollectionPages: unknown[];
};

type StepSetupMultiLanguageTarget =
  | { type: "text-overrides" }
  | { type: "step"; stepId: string }
  | { type: "step-category"; stepId: string; categoryIndex: number };

function asVisibilityArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getVisibilityDisplayTarget(
  displayConfiguration: Partial<VisibilityDisplayConfiguration> | null | undefined,
  allValue: string,
): string {
  if (!displayConfiguration) return allValue;
  if (asVisibilityArray(displayConfiguration.collectionsSelectedData).length > 0 || asVisibilityArray(displayConfiguration.showOnSpecificCollectionPages).length > 0) {
    return "specific_collections";
  }
  if (asVisibilityArray(displayConfiguration.selectedProducts).length > 0 || asVisibilityArray(displayConfiguration.showOnSpecificProductPages).length > 0) {
    return "specific_products";
  }
  return displayConfiguration.showOnAllBundleProducts === false ? "specific_products" : allValue;
}

function buildVisibilityDisplayConfiguration(
  displayOn: string | null | undefined,
  selectedProducts: unknown[] = [],
  showOnSpecificProductPages: unknown[] = [],
  collectionsSelectedData: unknown[] = [],
  showOnSpecificCollectionPages: unknown[] = [],
): VisibilityDisplayConfiguration {
  const showOnAllBundleProducts = displayOn === "all" || displayOn === "all_products";
  const productPageTargets = showOnSpecificProductPages.length > 0 ? showOnSpecificProductPages : selectedProducts;
  const collectionPageTargets = showOnSpecificCollectionPages.length > 0 ? showOnSpecificCollectionPages : collectionsSelectedData;

  return {
    showOnAllBundleProducts,
    selectedProducts: displayOn === "specific_products" ? selectedProducts.map((product) => compactVisibilityProductReference(product)) : [],
    showOnSpecificProductPages: displayOn === "specific_products" ? productPageTargets.map((product) => compactVisibilityProductPageReference(product)) : [],
    collectionsSelectedData: displayOn === "specific_collections" ? collectionsSelectedData.map((collection) => compactVisibilityCollectionReference(collection)) : [],
    showOnSpecificCollectionPages: displayOn === "specific_collections" ? collectionPageTargets.map((collection) => compactVisibilityCollectionPageReference(collection)) : [],
  };
}

function getVisibilityResourceId(resource: any): string | null {
  return resource?.graphqlId
    ?? resource?.admin_graphql_api_id
    ?? resource?.storefrontId
    ?? resource?.id
    ?? null;
}

function getVisibilityResourceNumericId(resource: any): string {
  const id = String(resource?.productId ?? resource?.collectionId ?? getVisibilityResourceId(resource) ?? "");
  return id.includes("/") ? id.split("/").pop() ?? id : id;
}

function getVisibilityImageUrl(resource: any): string | null {
  return resource?.imageUrl
    ?? resource?.featuredImage?.url
    ?? resource?.image?.url
    ?? resource?.image?.src
    ?? resource?.images?.[0]?.originalSrc
    ?? resource?.images?.[0]?.url
    ?? resource?.images?.[0]?.src
    ?? null;
}

function getVisibilityPickerSelection(picked: any): any[] | null {
  if (Array.isArray(picked)) return picked;
  if (Array.isArray(picked?.selection)) return picked.selection;
  return null;
}

function buildVisibilitySelectionIds(resources: unknown[]) {
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

function normalizeVisibilityProductForDisplayConfiguration(product: any) {
  return compactVisibilityProductReference(product);
}

function normalizeVisibilityProductPageTarget(product: any) {
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

function normalizeVisibilityCollectionForDisplayConfiguration(collection: any) {
  return compactVisibilityCollectionReference(collection);
}

function normalizeVisibilityCollectionPageTarget(collection: any) {
  return compactVisibilityCollectionPageReference(collection);
}

// showPolarisModal / hidePolarisModal imported from _shared/bundle-configure/modal-utils
// BundleStatusSection imported from _shared/bundle-configure/BundleStatusSection

function SettingsRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className={fullPageBundleStyles.settingsRow}>
      <div className={fullPageBundleStyles.settingsRowText}>
        <p className={fullPageBundleStyles.settingsRowTitle}>{title}</p>
        {description && <p className={fullPageBundleStyles.settingsRowDescription}>{description}</p>}
      </div>
      <div className={fullPageBundleStyles.settingsRowControl}>
        {children}
      </div>
    </div>
  );
}

function RichHelpTooltip({
  label,
  tooltipKey,
  accessibilityLabel,
  icon,
}: {
  label?: string;
  tooltipKey: HelpTooltipKey;
  accessibilityLabel?: string;
  icon?: string;
}) {
  const { t } = useTranslation();
  const tooltip = HELP_TOOLTIPS[tooltipKey];
  const title = t(`tooltips.${tooltipKey}.title`);
  const description = t(`tooltips.${tooltipKey}.description`);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);

  const showTooltip = () => {
    if (!wrapperRef.current) return;
    const width = Math.min(320, window.innerWidth - 32);
    const rect = wrapperRef.current.getBoundingClientRect();
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 16), window.innerWidth - width - 16);
    setTooltipPos({
      top: rect.bottom + 10,
      left,
      arrowLeft: rect.left + rect.width / 2 - left,
    });
  };
  const hideTooltip = () => setTooltipPos(null);

  return (
    <span
      ref={wrapperRef}
      className={fullPageBundleStyles.richHelp}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <s-button
        icon={icon}
        variant="tertiary"
        accessibilityLabel={accessibilityLabel || tooltip.accessibilityLabel || label || title}
        className={fullPageBundleStyles.richHelpTrigger}
      >
        {label}
      </s-button>
      <span
        className={`${fullPageBundleStyles.richHelpCard} ${fullPageBundleStyles.richHelpCardFloating}`}
        role="tooltip"
        style={tooltipPos ? {
          position: "fixed",
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: Math.min(320, window.innerWidth - 32),
          transform: "none",
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
          "--rich-help-arrow-left": `${tooltipPos.arrowLeft}px`,
        } as React.CSSProperties : undefined}
      >
        {tooltip.visual && <HelpTooltipVisualBlock visual={tooltip.visual} title={title} />}
        <span className={fullPageBundleStyles.richHelpTitle}>{title}</span>
        <span className={fullPageBundleStyles.richHelpDescription}>{description}</span>
      </span>
    </span>
  );
}

function QuestionHelpTooltip({
  tooltipKey,
}: {
  tooltipKey: HelpTooltipKey;
}) {
  const { t } = useTranslation();
  const tooltip = HELP_TOOLTIPS[tooltipKey];
  const title = t(`tooltips.${tooltipKey}.title`, '');
  const description = t(`tooltips.${tooltipKey}.description`);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);

  const showTooltip = () => {
    if (!wrapperRef.current) return;
    const width = Math.min(320, window.innerWidth - 32);
    const rect = wrapperRef.current.getBoundingClientRect();
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 16), window.innerWidth - width - 16);
    setTooltipPos({
      top: rect.bottom + 10,
      left,
      arrowLeft: rect.left + rect.width / 2 - left,
    });
  };
  const hideTooltip = () => setTooltipPos(null);

  return (
    <span
      ref={wrapperRef}
      className={fullPageBundleStyles.richHelp}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <s-button
        variant="plain"
        icon="info"
        accessibilityLabel={title || description}
        className={fullPageBundleStyles.richHelpTrigger}
      />
      <span
        className={`${fullPageBundleStyles.richHelpCard} ${fullPageBundleStyles.richHelpCardFloating}`}
        role="tooltip"
        style={tooltipPos ? {
          position: "fixed",
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: Math.min(320, window.innerWidth - 32),
          transform: "none",
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
          "--rich-help-arrow-left": `${tooltipPos.arrowLeft}px`,
        } as React.CSSProperties : undefined}
      >
        {tooltip.visual && <span className={fullPageBundleStyles.richHelpImagePlaceholder} />}
        {title && <span className={fullPageBundleStyles.richHelpTitle}>{title}</span>}
        <span className={fullPageBundleStyles.richHelpDescription}>{description}</span>
      </span>
    </span>
  );
}

function HelpTooltipVisualBlock({
  title,
}: {
  visual: HelpTooltipVisual;
  title: string;
}) {
  return (
    <span className={fullPageBundleStyles.richHelpImagePlaceholder} role="img" aria-label={title} />
  );
}

function InfoIcon({ tooltipKey }: { tooltipKey: HelpTooltipKey }) {
  const { t } = useTranslation();
  const description = t(`tooltips.${tooltipKey}.description`);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; right: number } | null>(null);

  const showTooltip = () => {
    if (wrapperRef.current) {
      const r = wrapperRef.current.getBoundingClientRect();
      setTooltipPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
  };
  const hideTooltip = () => setTooltipPos(null);

  return (
    <span
      ref={wrapperRef}
      className={fullPageBundleStyles.pendingBadge}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      tabIndex={0}
      aria-label={`Pending — ${description}`}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      Pending
      <svg width="11" height="11" viewBox="0 0 13 13" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6.5" cy="6.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6.5" y1="5.75" x2="6.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="6.5" cy="4.25" r="0.75" fill="currentColor" />
      </svg>
      {tooltipPos && (
        <span
          className={fullPageBundleStyles.pendingTooltipCard}
          style={{ position: 'fixed', top: tooltipPos.top, right: tooltipPos.right }}
          role="tooltip"
        >
          {description}
        </span>
      )}
    </span>
  );
}

function toNumericShopifyId(id: string | undefined | null): string {
  if (!id) return "";
  const match = id.match(/\/(\d+)$/);
  return match ? match[1] : id;
}

function toProductGid(product: any): string {
  return product?.graphqlId || product?.id || (product?.productId ? `gid://shopify/Product/${product.productId}` : "");
}

function toVariantGid(variant: any): string {
  return variant?.variantGraphqlId || variant?.id || (variant?.variantId ? `gid://shopify/ProductVariant/${variant.variantId}` : "");
}

function normalizeAddonPickerProduct(product: any) {
  const productGid = toProductGid(product);
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const imageUrl = product?.images?.[0]?.originalSrc
    || product?.images?.[0]?.url
    || product?.image?.url
    || product?.imageUrl
    || null;

  return {
    id: productGid,
    productId: toNumericShopifyId(productGid || product?.productId),
    graphqlId: productGid,
    handle: product?.handle ?? null,
    variants: variants.map((variant: any) => {
      const variantGid = toVariantGid(variant);
      return {
        variantId: toNumericShopifyId(variantGid || variant?.variantId),
        variantGraphqlId: variantGid,
        inventoryQuantity: typeof variant?.inventoryQuantity === "number" ? variant.inventoryQuantity : null,
        inventoryPolicy: variant?.inventoryPolicy ?? null,
        price: String(variant?.price ?? "0"),
        variantTitle: variant?.title || variant?.variantTitle || "Default Title",
      };
    }),
    hasOnlyDefaultVariant: product?.hasOnlyDefaultVariant ?? variants.length <= 1,
    images: imageUrl ? [{ originalSrc: imageUrl }] : [],
    title: product?.title || product?.name || "",
    tags: Array.isArray(product?.tags) ? product.tags : [],
  };
}

function normalizeAddonTier(tier: any, index: number) {
  const eligibilityType = tier?.eligibilityCondition?.type || tier?.eligibilityType || "QUANTITY";
  const eligibilityValue = Number(tier?.eligibilityCondition?.value ?? tier?.eligibilityValue ?? 1) || 1;
  const discountType = tier?.discount?.type || tier?.discountType || "PERCENTAGE";
  const discountValue = Number(tier?.discount?.value ?? tier?.discountValue ?? 0) || 0;

  return {
    tierId: tier?.tierId || `tier${index + 1}`,
    title: tier?.title || `Tier ${index + 1}`,
    selectedAddonProducts: Array.isArray(tier?.selectedAddonProducts)
      ? tier.selectedAddonProducts.map(normalizeAddonPickerProduct)
      : [],
    eligibilityCondition: {
      type: eligibilityType,
      value: eligibilityValue,
      isValidateEligibilityConditionEnabled: tier?.eligibilityCondition?.isValidateEligibilityConditionEnabled !== false,
    },
    discount: {
      type: discountType,
      value: discountValue,
    },
    displayVariantsAsIndividualProducts_addons: tier?.displayVariantsAsIndividualProducts_addons === true,
    conditions: Array.isArray(tier?.conditions)
      ? tier.conditions.map((condition: any) => ({
        type: condition?.type || "quantity",
        condition: condition?.condition || "greaterThanOrEqualTo",
        value: String(condition?.value ?? "01"),
      }))
      : [],
  };
}

function createDefaultAddonDraftTier(index = 0) {
  return {
    tierId: `tier${index + 1}`,
    title: `Tier ${index + 1}`,
    selectedAddonProducts: [],
    eligibilityType: "QUANTITY",
    eligibilityValue: 1,
    discountType: "PERCENTAGE",
    discountValue: 0,
    displayVariantsAsIndividualProducts_addons: false,
    displayFree: false,
    conditions: [],
  };
}

function createDefaultAddonTierCondition() {
  return {
    type: "quantity",
    condition: "greaterThanOrEqualTo",
    value: "01",
  };
}

function addonTierToDraft(tier: any, index: number) {
  return {
    ...createDefaultAddonDraftTier(index),
    tierId: tier?.tierId || `tier${index + 1}`,
    title: tier?.title || `Tier ${index + 1}`,
    selectedAddonProducts: Array.isArray(tier?.selectedAddonProducts) ? tier.selectedAddonProducts : [],
    eligibilityType: tier?.eligibilityCondition?.type || tier?.eligibilityType || "QUANTITY",
    eligibilityValue: Number(tier?.eligibilityCondition?.value ?? tier?.eligibilityValue ?? 1) || 1,
    discountType: tier?.discount?.type || tier?.discountType || "PERCENTAGE",
    discountValue: Number(tier?.discount?.value ?? tier?.discountValue ?? 0) || 0,
    displayVariantsAsIndividualProducts_addons: tier?.displayVariantsAsIndividualProducts_addons === true,
    displayFree: false,
    conditions: Array.isArray(tier?.conditions)
      ? tier.conditions.map((condition: any) => ({
        type: condition?.type || "quantity",
        condition: condition?.condition || "greaterThanOrEqualTo",
        value: String(condition?.value ?? "01"),
      }))
      : [],
  };
}

function buildAddonDraftFromPersonalizationData(personalizationData: any) {
  const addonProducts = personalizationData?.addonProducts || {};
  const tiers = Array.isArray(addonProducts?.tiers) && addonProducts.tiers.length > 0
    ? addonProducts.tiers.map(addonTierToDraft)
    : [createDefaultAddonDraftTier()];

  return {
    isPersonalizationEnabled: personalizationData?.isPersonalizationEnabled === true,
    personalizeStepText: personalizationData?.personalizeStepText || "",
    personalizePageSubtext: personalizationData?.personalizePageSubtext || "",
    stepImage: personalizationData?.stepImage || null,
    addonProductsEnabled: addonProducts?.isEnabled === true,
    addonProductsTitle: addonProducts?.title || "",
    addonTiers: tiers,
  };
}

function normalizeGiftMessageProductForPersonalization(product: any) {
  if (!product) return null;
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant: any) => ({
        id: variant.id ?? variant.admin_graphql_api_id ?? variant.variantGraphqlId ?? variant.variantId ?? null,
        title: variant.title ?? variant.variantTitle ?? variant.option1 ?? "Message",
        price: variant.price ?? "0.00",
        taxable: variant.taxable ?? false,
        inventory_policy: variant.inventory_policy ?? variant.inventoryPolicy ?? "continue",
        admin_graphql_api_id: variant.admin_graphql_api_id ?? variant.id ?? variant.variantGraphqlId ?? null,
        option1: variant.option1 ?? variant.title ?? variant.variantTitle ?? "Message",
        variantImage: variant.variantImage ?? variant.image?.url ?? variant.image?.originalSrc ?? variant.image?.src ?? null,
      }))
    : [];

  return {
    ...product,
    id: product.id ?? product.admin_graphql_api_id ?? product.productId ?? null,
    title: product.title ?? "Message",
    handle: product.handle ?? null,
    admin_graphql_api_id: product.admin_graphql_api_id ?? product.id ?? null,
    status: product.status ?? "unlisted",
    variants,
    images: Array.isArray(product.images) ? product.images : [],
  };
}

function buildGiftMessageDraftFromPersonalizationData(personalizationData: any) {
  const giftMessage = personalizationData?.giftMessage || {};
  return {
    isGiftMessageEnabled: giftMessage?.isGiftMessageEnabled === true,
    isSenderAndRecipientNameEnabled: giftMessage?.isSenderAndRecipientNameEnabled === true,
    isGiftMessageMandatory: giftMessage?.isGiftMessageMandatory === true,
    isMessageLimitEnabled: Boolean(giftMessage?.giftMessageCharacterLimit),
    giftMessageCharacterLimit: giftMessage?.giftMessageCharacterLimit ? String(giftMessage.giftMessageCharacterLimit) : "",
    messageProduct: giftMessage?.messageProduct || {
      isMessageProductEnabled: false,
      status: "unlisted",
      product: null,
    },
  };
}

function buildGiftMessageConfigFromDraft(giftMessageDraft: any) {
  if (!giftMessageDraft?.isGiftMessageEnabled) return null;

  const messageProduct = giftMessageDraft.messageProduct || {};
  return {
    isGiftMessageEnabled: true,
    isSenderAndRecipientNameEnabled: giftMessageDraft.isSenderAndRecipientNameEnabled === true,
    giftMessageCharacterLimit: giftMessageDraft.isMessageLimitEnabled ? String(giftMessageDraft.giftMessageCharacterLimit || "") : "",
    isGiftMessageMandatory: giftMessageDraft.isGiftMessageMandatory === true,
    isVideoMessageEnabled: false,
    isEmailEnabled: false,
    messageProduct: {
      isMessageProductEnabled: Boolean(messageProduct.product),
      status: messageProduct.status || "unlisted",
      product: messageProduct.product || null,
    },
  };
}

function buildPersonalizationDataFromDraft(
  addonDraft: any,
  addonMessages: { discountText?: string; successMessage?: string } | null,
  giftMessageDraft?: any,
) {
  const giftMessage = buildGiftMessageConfigFromDraft(giftMessageDraft);
  if (!addonDraft?.isPersonalizationEnabled && !giftMessage?.isGiftMessageEnabled) return null;

  const addonTiers = Array.isArray(addonDraft?.addonTiers) && addonDraft.addonTiers.length > 0
    ? addonDraft.addonTiers
    : [createDefaultAddonDraftTier()];
  const tiers = addonTiers.map(normalizeAddonTier);

  const personalizationData: Record<string, any> = {
    isPersonalizationEnabled: true,
    personalizeStepText: addonDraft?.personalizeStepText || "",
    personalizePageSubtext: addonDraft?.personalizePageSubtext || "",
    stepImage: addonDraft?.stepImage || null,
    giftMessage: buildGiftMessageConfigFromDraft(giftMessageDraft),
    addonProducts: {
      isEnabled: addonDraft?.addonProductsEnabled === true,
      title: addonDraft?.addonProductsTitle || "",
      type: "MULTI_TIER",
      tiers,
      multiLangData: {},
      addonsMessaging: {
        isEnabled: Boolean(addonMessages?.discountText || addonMessages?.successMessage),
        tier1: {
          ineligibleState: addonMessages?.discountText || "",
          eligibleState: addonMessages?.successMessage || "",
        },
      },
    },
  };

  if (!giftMessage) delete personalizationData.giftMessage;
  return personalizationData;
}


export default function ConfigureBundleFlow() {
  const loaderData = useLoaderData<LoaderData>();
  const bundle = loaderData.bundle as unknown as import("../../../hooks/useBundleConfigurationState").BundleData & {
    promoBannerBgImage?: string | null;
    promoBannerBgImageCrop?: string | null;
    loadingGif?: string | null;
    shopifyProductHandle?: string;
  };
  const { bundleProduct: loadedBundleProduct, availableBundles, shop, apiKey, blockHandle, shopLocales = [], appEmbedEnabled = true, themeEditorUrl = null } = loaderData as any;
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();

  // ===== CENTRALIZED STATE MANAGEMENT =====
  // Use the unified bundle configuration state hook
  const configState = useBundleConfigurationState({
    bundle,
    bundleProduct: loadedBundleProduct,
    shopify,
  });

  // Destructure all state from the hook
  const {
    // Dirty state
    isDirty,
    setIsDirty,
    markAsDirty,
    markAsSaved,
    handleDiscard: hookHandleDiscard,
    isResettingRef,
    lastProcessedFetcherDataRef,

    // Form state
    formState,

    // Steps state
    stepsState,

    // Conditions state
    conditionsState,

    // Pricing state
    pricingState,

    // Modal states
    isPageSelectionModalOpen,
    openPageSelectionModal,
    closePageSelectionModal,
    isProductsModalOpen,
    openProductsModal,
    closeProductsModal,
    isCollectionsModalOpen,
    openCollectionsModal,
    closeCollectionsModal,
    currentModalStepId,
    setCurrentModalStepId,

    // Loading states
    isLoadingPages,
    setIsLoadingPages,

    // Page selection data
    availablePages,
    setAvailablePages,
    selectedPage,
    setSelectedPage,

    // Bundle product data
    bundleProduct,
    setBundleProduct,
    productStatus,
    setProductStatus,
    productTitle,
    setProductTitle,
    productImageUrl,
    setProductImageUrl,

    // Collections
    selectedCollections,
    setSelectedCollections,

    // Rule messages
    ruleMessages,
    setRuleMessages,

    // UI states
    activeTabIndex,
    setActiveTabIndex,
    activeSection,
    setActiveSection,
    forceNavigation,
    setForceNavigation,

    // Original values ref
    originalValuesRef,
  } = configState;
  const suppressTopAppEmbedBannerForVisibility = activeSection === "bundle_visibility" || activeSection === "bundle_widget";

  const [addonDraft, setAddonDraft] = useState(() =>
    buildAddonDraftFromPersonalizationData((bundle as any).personalizationData)
  );
  const originalAddonDraftRef = useRef<any>(addonDraft);
  const updateAddonDraft = useCallback((updates: Record<string, any>) => {
    setAddonDraft((current: any) => ({ ...current, ...updates }));
    markAsDirty();
  }, [markAsDirty]);
  const [giftMessageDraft, setGiftMessageDraft] = useState(() =>
    buildGiftMessageDraftFromPersonalizationData((bundle as any).personalizationData)
  );
  const originalGiftMessageDraftRef = useRef<any>(giftMessageDraft);
  const updateGiftMessageDraft = useCallback((updates: Record<string, any>) => {
    setGiftMessageDraft((current: any) => ({ ...current, ...updates }));
    markAsDirty();
  }, [markAsDirty]);

  const shopDomain = useMemo(
    () => (shop.includes('.myshopify.com') ? shop.replace('.myshopify.com', '') : shop),
    [shop]
  );

  const [pageSlug, setPageSlug] = useState<string>(
    bundle.shopifyPageHandle ?? slugify(bundle.name ?? '')
  );
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState<boolean>(
    Boolean(bundle.shopifyPageHandle)
  );
  const originalPageSlugRef = useRef<string>(
    bundle.shopifyPageHandle ?? slugify(bundle.name ?? '')
  );
  const normalizedPageSlug = useMemo(() => slugify(pageSlug), [pageSlug]);
  const pageSlugError = useMemo(() => validateSlug(pageSlug), [pageSlug]);
  const pageUrlPreview = useMemo(
    () => `https://${shopDomain}.myshopify.com/apps/product-bundles/wpb/${bundle.id}`,
    [shopDomain, bundle.id]
  );

  useEffect(() => {
    if (bundle.shopifyPageHandle || hasManuallyEditedSlug) return;
    setPageSlug(slugify(formState.bundleName || ''));
  }, [bundle.shopifyPageHandle, formState.bundleName, hasManuallyEditedSlug]);


  // Per-bundle promo banner background image state
  const [promoBannerBgImage, setPromoBannerBgImage] = useState<string | null>(
    bundle.promoBannerBgImage ?? null
  );
  const originalPromoBannerBgImageRef = useRef<string | null>(bundle.promoBannerBgImage ?? null);

  // Promo banner image crop state
  const [promoBannerBgImageCrop, setPromoBannerBgImageCrop] = useState<string | null>(
    bundle.promoBannerBgImageCrop ?? null
  );
  const originalPromoBannerBgImageCropRef = useRef<string | null>(bundle.promoBannerBgImageCrop ?? null);

  // Loading GIF state
  const [loadingGif, setLoadingGif] = useState<string | null>(bundle.loadingGif ?? null);
  const originalLoadingGifRef = useRef<string | null>(bundle.loadingGif ?? null);

  // Pricing tier config state (full-page bundles)
  const [tierConfig, setTierConfig] = useState<{ label: string; linkedBundleId: string }[]>(
    Array.isArray(bundle.tierConfig) ? (bundle.tierConfig as { label: string; linkedBundleId: string }[]) : []
  );
  const originalTierConfigRef = useRef<{ label: string; linkedBundleId: string }[]>(
    Array.isArray(bundle.tierConfig) ? (bundle.tierConfig as { label: string; linkedBundleId: string }[]) : []
  );

  // Admin-controlled step timeline visibility (null = defer to theme editor)
  const [showStepTimeline, setShowStepTimeline] = useState<boolean>(
    bundle.showStepTimeline !== false  // default true; only false when explicitly saved as false
  );
  const originalShowStepTimelineRef = useRef<boolean>(
    bundle.showStepTimeline !== false
  );

  // Floating promo badge
  const [floatingBadgeEnabled, setFloatingBadgeEnabled] = useState<boolean>(
    (bundle as any).floatingBadgeEnabled ?? false
  );
  const [floatingBadgeText, setFloatingBadgeText] = useState<string>(
    (bundle as any).floatingBadgeText ?? ""
  );
  const originalFloatingBadgeEnabledRef = useRef<boolean>((bundle as any).floatingBadgeEnabled ?? false);
  const originalFloatingBadgeTextRef = useRef<string>((bundle as any).floatingBadgeText ?? "");

  // Bundle Settings state
  const [showProductPrices, setShowProductPrices] = useState<boolean>((bundle as any).showProductPrices ?? true);
  const [showCompareAtPrices, setShowCompareAtPrices] = useState<boolean>((bundle as any).showCompareAtPrices ?? false);
  const [cartRedirectToCheckout, setCartRedirectToCheckout] = useState<boolean>((bundle as any).cartRedirectToCheckout ?? false);
  const [allowQuantityChanges, setAllowQuantityChanges] = useState<boolean>((bundle as any).allowQuantityChanges ?? true);
  const [productSlotsEnabled, setProductSlotsEnabled] = useState<boolean>((bundle as any).productSlotsEnabled ?? false);
  const [maxQtyPerProduct, setMaxQtyPerProduct] = useState<string>((bundle as any).maxQtyPerProduct?.toString() ?? "");
  const [bundleLevelCssExpanded, setBundleLevelCssExpanded] = useState(false);
  const [showTextOnPlusEnabled, setShowTextOnPlusEnabled] = useState<boolean>(
    !!((bundle as any).textOverrides?.addToCartButton)
  );
  const originalShowProductPricesRef = useRef<boolean>((bundle as any).showProductPrices ?? true);
  const originalShowCompareAtPricesRef = useRef<boolean>((bundle as any).showCompareAtPrices ?? false);
  const originalCartRedirectToCheckoutRef = useRef<boolean>((bundle as any).cartRedirectToCheckout ?? false);
  const originalAllowQuantityChangesRef = useRef<boolean>((bundle as any).allowQuantityChanges ?? true);

  const directBundleSummary = (
    ((bundle as any).bundleTextConfig as { bundleSummary?: { title?: string; subTitle?: string } } | null)?.bundleSummary
  ) ?? {};
  const initialTextOverrides = {
    ...(((bundle as any).textOverrides as Record<string, string>) ?? {}),
    yourBundle: directBundleSummary.title ?? "",
    reviewBundle: directBundleSummary.subTitle ?? "",
  };

  // Text overrides state (Messages tab)
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>(
    initialTextOverrides
  );
  const [textOverridesByLocale, setTextOverridesByLocale] = useState<Record<string, Record<string, string>>>(
    ((bundle as any).textOverridesByLocale as Record<string, Record<string, string>>) ?? {}
  );
  const originalTextOverridesRef = useRef<Record<string, string>>(
    initialTextOverrides
  );
  const originalTextOverridesByLocaleRef = useRef<Record<string, Record<string, string>>>(
    ((bundle as any).textOverridesByLocale as Record<string, Record<string, string>>) ?? {}
  );
  // Which locale the merchant is currently editing in the Messages tab
  const [textOverridesLocale, setTextOverridesLocale] = useState<string>("en");
  const [multiLanguageFields, setMultiLanguageFields] = useState<MultiLanguageField[]>([]);
  const [multiLanguageTitle, setMultiLanguageTitle] = useState("Multi Language");
  const [isMultiLanguageModalOpen, setIsMultiLanguageModalOpen] = useState(false);
  const [multiLanguageTarget, setMultiLanguageTarget] = useState<StepSetupMultiLanguageTarget>({ type: "text-overrides" });

  // Multi-language discount messaging state
  const [discountMessagingMultiLanguageEnabled, setDiscountMessagingMultiLanguageEnabled] = useState<boolean>(
    !!(bundle as any).pricing?.ruleMessagesByLocale
  );
  const originalDiscountMessagingMultiLanguageEnabledRef = useRef<boolean>(!!(bundle as any).pricing?.ruleMessagesByLocale);
  const [ruleMessagesByLocale, setRuleMessagesByLocale] = useState<Record<string, Record<string, { discountText: string; successMessage: string }>>>(
    ((bundle as any).pricing?.ruleMessagesByLocale as Record<string, Record<string, { discountText: string; successMessage: string }>>) ?? {}
  );
  const originalRuleMessagesByLocaleRef = useRef<Record<string, Record<string, { discountText: string; successMessage: string }>>>(
    ((bundle as any).pricing?.ruleMessagesByLocale as Record<string, Record<string, { discountText: string; successMessage: string }>>) ?? {}
  );
  const [activeDiscountLocale, setActiveDiscountLocale] = useState<string>(
    shopLocales.find((l: { primary: boolean }) => l.primary)?.locale ?? shopLocales[0]?.locale ?? "en"
  );
  const [globalSuccessMessage, setGlobalSuccessMessage] = useState<string>(
    (bundle as any).pricing?.messages?.successMessage ?? ""
  );
  const [successMessageByLocale, setSuccessMessageByLocale] = useState<Record<string, string>>(
    ((bundle as any).pricing?.messages?.successMessageByLocale as Record<string, string>) ?? {}
  );

  // Tier text for Progress Bar Step-Based
  const [tierTextByRuleId, setTierTextByRuleId] = useState<Record<string, { tierText: string; tierSubtext: string }>>(
    ((bundle as any).pricing?.messages?.tierTextByRuleId as Record<string, { tierText: string; tierSubtext: string }>) ?? {}
  );
  const [tierTextByLocaleByRuleId, setTierTextByLocaleByRuleId] = useState<Record<string, Record<string, { tierText: string; tierSubtext: string }>>>(
    ((bundle as any).pricing?.messages?.tierTextByLocaleByRuleId as Record<string, Record<string, { tierText: string; tierSubtext: string }>>) ?? {}
  );
  const progressBarMultiLangModalRef = useRef<HTMLElement>(null);
  const [isProgressBarMultiLangModalOpen, setIsProgressBarMultiLangModalOpen] = useState(false);
  const [activeProgressBarLocale, setActiveProgressBarLocale] = useState<string>(
    shopLocales.find((l: { primary: boolean }) => l.primary)?.locale ?? shopLocales[0]?.locale ?? "en"
  );
  const bundleQuantityMultiLangModalRef = useRef<HTMLElement>(null);
  const [isBundleQuantityMultiLangModalOpen, setIsBundleQuantityMultiLangModalOpen] = useState(false);
  const [activeBundleQuantityLocale, setActiveBundleQuantityLocale] = useState<string>(
    shopLocales.find((l: { primary: boolean }) => l.primary)?.locale ?? shopLocales[0]?.locale ?? "en"
  );

  // Widget install loading state
  const [isInstallingWidget, setIsInstallingWidget] = useState(false);

  // Active step tab for Bundle Assets section (independent from Step Setup tab)
  const [activeAssetTabIndex, setActiveAssetTabIndex] = useState(0);

  // Search bar enabled (bundle-level)
  const [searchBarEnabled, setSearchBarEnabled] = useState<boolean>(
    (bundle as any).searchBarEnabled ?? false
  );
  const originalSearchBarEnabledRef = useRef<boolean>((bundle as any).searchBarEnabled ?? false);

  // Bundle Visibility — Bundle Widget state
  const savedBundleUpsellConfig = ((bundle as any).bundleUpsellConfig ?? null) as any;
  const savedWidgetConfiguration = savedBundleUpsellConfig?.widgetConfiguration;
  const savedWidgetDisplayConfiguration = savedWidgetConfiguration?.displayConfiguration;
  const [upsellWidgetEnabled, setUpsellWidgetEnabled] = useState<boolean>(savedWidgetConfiguration?.isEnabled ?? (bundle as any).upsellWidgetEnabled ?? false);
  const [upsellWidgetDisplayMode, setUpsellWidgetDisplayMode] = useState<string>((bundle as any).upsellWidgetDisplayMode ?? "button");
  const [upsellWidgetDisplayOn, setUpsellWidgetDisplayOn] = useState<string>(
    (bundle as any).upsellWidgetDisplayOn ?? getVisibilityDisplayTarget(savedWidgetDisplayConfiguration, "all")
  );
  const [upsellWidgetTitle, setUpsellWidgetTitle] = useState<string>(savedWidgetConfiguration?.title ?? "Bundle & Save");
  const [upsellWidgetDescription, setUpsellWidgetDescription] = useState<string>(savedWidgetConfiguration?.description ?? "");
  const [upsellWidgetButtonText, setUpsellWidgetButtonText] = useState<string>(
    savedWidgetConfiguration?.buttonText ?? textOverrides.widgetButtonText ?? "Buy with Bundle"
  );
  const [upsellWidgetImageUrl, setUpsellWidgetImageUrl] = useState<string>(savedWidgetConfiguration?.imageUrl ?? "");
  const [upsellWidgetLanguageMode, setUpsellWidgetLanguageMode] = useState<string>(
    savedWidgetConfiguration?.languageMode ?? savedBundleUpsellConfig?.languageMode ?? "SINGLE"
  );
  const [upsellWidgetSelectedProducts, setUpsellWidgetSelectedProducts] = useState<unknown[]>(asVisibilityArray(savedWidgetDisplayConfiguration?.selectedProducts));
  const [upsellWidgetSpecificProductPages, setUpsellWidgetSpecificProductPages] = useState<unknown[]>(asVisibilityArray(savedWidgetDisplayConfiguration?.showOnSpecificProductPages));
  const [upsellWidgetCollectionsSelectedData, setUpsellWidgetCollectionsSelectedData] = useState<unknown[]>(asVisibilityArray(savedWidgetDisplayConfiguration?.collectionsSelectedData));
  const [upsellWidgetSpecificCollectionPages, setUpsellWidgetSpecificCollectionPages] = useState<unknown[]>(asVisibilityArray(savedWidgetDisplayConfiguration?.showOnSpecificCollectionPages));
  const [autoSelectBrowsedProduct, setAutoSelectBrowsedProduct] = useState<boolean>(
    savedWidgetConfiguration?.useLinkProductAsDefaultProduct ?? (bundle as any).autoSelectBrowsedProduct ?? false
  );

  // Bundle Banner upload state (Gap 2)
  const [bundleBannerDesktopUrl, setBundleBannerDesktopUrl] = useState<string>((bundle as any).bundleBannerDesktopUrl ?? "");
  const [bundleBannerMobileUrl, setBundleBannerMobileUrl] = useState<string>((bundle as any).bundleBannerMobileUrl ?? "");

  // Bundle Level CSS state (Gap 3)
  const [bundleLevelCss, setBundleLevelCss] = useState<string>((bundle as any).bundleLevelCss ?? "");

  // Select Template state (main = DB-synced; pending = overlay working copy)
  const [bundleDesignTemplate, setBundleDesignTemplate] = useState<string | null>((bundle as any).bundleDesignTemplate ?? null);
  const [bundleDesignPresetId, setBundleDesignPresetId] = useState<string | null>((bundle as any).bundleDesignPresetId ?? null);
  const [pendingDesignTemplate, setPendingDesignTemplate] = useState<string | null>(null);
  const [pendingDesignPresetId, setPendingDesignPresetId] = useState<string | null>(null);

  // Step chip navigation slide animation
  const [slideKey, setSlideKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"forward" | "backward" | null>(null);

  // Per-category active tab: keyed by `${stepId}__${catId}`, value 0=Products 1=Collections
  const [categoryActiveTabs, setCategoryActiveTabs] = useState<Record<string, number>>({});
  // Per-category open/collapsed state: keyed by `${stepId}__${catId}`
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({});
  const [categoryRulesOpen, setCategoryRulesOpen] = useState<Record<string, boolean>>({});

  const getStepCategories = useCallback((stepId: string): any[] => {
    const step = stepsState.steps.find((candidate) => candidate.id === stepId) as any;
    return (((step as any)?.StepCategory as any[] | undefined) ?? []);
  }, [stepsState.steps]);

  const updateStepCategories = useCallback((stepId: string, updater: (categories: any[]) => any[]) => {
    const categories = getStepCategories(stepId);
    stepsState.updateStepField(stepId, "StepCategory", updater(categories));
    markAsDirty();
  }, [getStepCategories, markAsDirty, stepsState]);

  const clearCategoryConditionRules = useCallback((stepId: string) => {
    updateStepCategories(stepId, (categories) => categories.map((category) => ({
      ...category,
      conditions: [],
      autoNextStepOnConditionMet: false,
    })));
  }, [updateStepCategories]);

  const addCategoryConditionRule = useCallback((stepId: string, categoryIndex: number) => {
    updateStepCategories(stepId, (categories) => categories.map((category, index) => {
      if (index !== categoryIndex) return category;
      const conditions = Array.isArray(category.conditions) ? category.conditions : [];
      return {
        ...category,
        conditions: [
          ...conditions,
          {
            id: `category-rule-${Date.now()}`,
            type: "quantity",
            condition: "greaterThanOrEqualTo",
            value: "01",
          },
        ],
      };
    }));
  }, [updateStepCategories]);

  const removeCategoryConditionRule = useCallback((stepId: string, categoryIndex: number, ruleId: string) => {
    updateStepCategories(stepId, (categories) => categories.map((category, index) => {
      if (index !== categoryIndex) return category;
      const conditions = Array.isArray(category.conditions) ? category.conditions : [];
      return {
        ...category,
        conditions: conditions.filter((rule: any, ruleIndex: number) => String(rule.id ?? ruleIndex) !== ruleId),
      };
    }));
  }, [updateStepCategories]);

  const updateCategoryConditionRule = useCallback((stepId: string, categoryIndex: number, ruleId: string, field: string, value: string) => {
    updateStepCategories(stepId, (categories) => categories.map((category, index) => {
      if (index !== categoryIndex) return category;
      const conditions = Array.isArray(category.conditions) ? category.conditions : [];
      return {
        ...category,
        conditions: conditions.map((rule: any, ruleIndex: number) => (
          String(rule.id ?? ruleIndex) === ruleId ? { ...rule, [field]: value } : rule
        )),
      };
    }));
  }, [updateStepCategories]);

  const updateCategoryAutoNextRule = useCallback((stepId: string, categoryIndex: number, enabled: boolean) => {
    updateStepCategories(stepId, (categories) => categories.map((category, index) => (
      index === categoryIndex ? { ...category, autoNextStepOnConditionMet: enabled } : category
    )));
  }, [updateStepCategories]);

  // Icon picker visibility (tracks which step's picker is open)
  const [showIconPickerForStep, setShowIconPickerForStep] = useState<string | null>(null);

  // Multi-language modal for step names
  const [isStepLocaleModalOpen, setIsStepLocaleModalOpen] = useState(false);

  // Warning modal state: steps + tiers conflict
  const [stepsTiersWarning, setStepsTiersWarning] = useState<{
    open: boolean;
    onConfirm: (() => void) | null;
  }>({ open: false, onConfirm: null });

  // Select Template modal state
  const selectTemplateModalRef = useRef<HTMLDivElement>(null);
  const selectTemplateOpenButtonRef = useRef<HTMLButtonElement>(null);
  const [isSelectTemplateModalOpen, setIsSelectTemplateModalOpen] = useState(false);
  const [templateModalStep, setTemplateModalStep] = useState<"select" | "confirm">("select");
  const templateFetcher = useFetcher();
  const [templateSaveError, setTemplateSaveError] = useState<string | null>(null);
  const lastTemplateRequestRef = useRef<{ template: string | null; presetId: string | null } | null>(null);
  const lastTemplateResponseRef = useRef<unknown>(null);

  // Sync Bundle modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);

  const defaultMultiLanguageLocale = useCallback(() => (
    shopLocales.find((locale: { primary: boolean }) => locale.primary)?.locale ?? shopLocales[0]?.locale ?? "en"
  ), [shopLocales]);

  const openMultiLanguageModal = useCallback((title: string, fields: MultiLanguageField[]) => {
    setMultiLanguageTarget({ type: "text-overrides" });
    setMultiLanguageTitle(title);
    setMultiLanguageFields(fields);
    setTextOverridesLocale(defaultMultiLanguageLocale());
    setIsMultiLanguageModalOpen(true);
  }, [defaultMultiLanguageLocale]);

  const openStepMultiLanguageModal = useCallback((stepId: string) => {
    const step = stepsState.steps.find((candidate) => candidate.id === stepId) as any;
    if (!step) return;
    setMultiLanguageTarget({ type: "step", stepId });
    setMultiLanguageTitle("Customize Text for Multiple Languages");
    setMultiLanguageFields([
      { key: "productPageStepText", label: "Step Name", fallback: step.name ?? "" },
      { key: "productPageSubtext", label: "Step Title", fallback: step.pageTitle ?? "" },
    ]);
    setTextOverridesLocale(defaultMultiLanguageLocale());
    setIsMultiLanguageModalOpen(true);
  }, [defaultMultiLanguageLocale, stepsState.steps]);

  const openStepCategoryMultiLanguageModal = useCallback((stepId: string, categoryIndex: number) => {
    const step = stepsState.steps.find((candidate) => candidate.id === stepId) as any;
    const category = ((step?.StepCategory as any[] | undefined) ?? [])[categoryIndex];
    if (!category) return;
    setMultiLanguageTarget({ type: "step-category", stepId, categoryIndex });
    setMultiLanguageTitle("Customize Text for Multiple Languages");
    setMultiLanguageFields([
      { key: "name", label: "Category Name", fallback: category.name ?? `Category ${categoryIndex + 1}` },
      { key: "title", label: "Category Title", fallback: category.title ?? "" },
    ]);
    setTextOverridesLocale(defaultMultiLanguageLocale());
    setIsMultiLanguageModalOpen(true);
  }, [defaultMultiLanguageLocale, stepsState.steps]);

  const updateLocalizedTextOverride = useCallback((locale: string, key: string, value: string) => {
    setTextOverridesByLocale((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] ?? {}),
        [key]: value,
      },
    }));
    markAsDirty();
  }, [markAsDirty]);

  const activeMultiLanguageValues = useMemo(() => {
    if (multiLanguageTarget?.type === "step") {
      const step = stepsState.steps.find((candidate) => candidate.id === multiLanguageTarget.stepId) as any;
      return (step?.multiLangData ?? {}) as Record<string, Record<string, string>>;
    }
    if (multiLanguageTarget?.type === "step-category") {
      const step = stepsState.steps.find((candidate) => candidate.id === multiLanguageTarget.stepId) as any;
      const category = ((step?.StepCategory as any[] | undefined) ?? [])[multiLanguageTarget.categoryIndex];
      return (category?.multiLangData ?? {}) as Record<string, Record<string, string>>;
    }
    return textOverridesByLocale;
  }, [multiLanguageTarget, stepsState.steps, textOverridesByLocale]);

  const saveStepSetupMultiLanguageValues = useCallback((nextValues: Record<string, Record<string, string>>) => {
    if (multiLanguageTarget?.type === "step") {
      stepsState.updateStepField(multiLanguageTarget.stepId, "multiLangData", nextValues);
      markAsDirty();
      return;
    }

    if (multiLanguageTarget?.type === "step-category") {
      const step = stepsState.steps.find((candidate) => candidate.id === multiLanguageTarget.stepId) as any;
      const categories = ((step?.StepCategory as any[] | undefined) ?? []);
      const updatedCategories = categories.map((category, index) => (
        index === multiLanguageTarget.categoryIndex
          ? {
              ...category,
              multiLangData: {
                ...(category.multiLangData ?? {}),
                ...nextValues,
              },
            }
          : category
      ));
      stepsState.updateStepField(multiLanguageTarget.stepId, "StepCategory", updatedCategories);
      markAsDirty();
      return;
    }

    setTextOverridesByLocale(nextValues);
    markAsDirty();
  }, [markAsDirty, multiLanguageTarget, stepsState]);

  useEffect(() => {
    setHasPreview(!!localStorage.getItem(`wpb_preview_${bundle.id}`));
  }, [bundle.id]);

  // Modal refs for s-modal web components
  const stepsTiersModalRef = useRef<HTMLElement>(null);
  const pageSelectionModalRef = useRef<HTMLElement>(null);
  const productsModalRef = useRef<HTMLElement>(null);
  const collectionsModalRef = useRef<HTMLElement>(null);
  const syncModalRef = useRef<HTMLElement>(null);
  const templateVariablesModalRef = useRef<HTMLElement>(null);
  const discountVariablesModalRef = useRef<HTMLElement>(null);
  const [isDiscountVariablesModalOpen, setIsDiscountVariablesModalOpen] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    stepsTiersWarning.open ? showPolarisModal(stepsTiersModalRef) : hidePolarisModal(stepsTiersModalRef);
  }, [stepsTiersWarning.open]);

  useEffect(() => {
    isPageSelectionModalOpen ? showPolarisModal(pageSelectionModalRef) : hidePolarisModal(pageSelectionModalRef);
  }, [isPageSelectionModalOpen]);

  useEffect(() => {
    isProductsModalOpen ? showPolarisModal(productsModalRef) : hidePolarisModal(productsModalRef);
  }, [isProductsModalOpen]);

  useEffect(() => {
    isCollectionsModalOpen ? showPolarisModal(collectionsModalRef) : hidePolarisModal(collectionsModalRef);
  }, [isCollectionsModalOpen]);

  useEffect(() => {
    isSyncModalOpen ? showPolarisModal(syncModalRef) : hidePolarisModal(syncModalRef);
  }, [isSyncModalOpen]);

  useEffect(() => {
    isProgressBarMultiLangModalOpen ? showPolarisModal(progressBarMultiLangModalRef) : hidePolarisModal(progressBarMultiLangModalRef);
  }, [isProgressBarMultiLangModalOpen]);

  useEffect(() => {
    isBundleQuantityMultiLangModalOpen ? showPolarisModal(bundleQuantityMultiLangModalRef) : hidePolarisModal(bundleQuantityMultiLangModalRef);
  }, [isBundleQuantityMultiLangModalOpen]);

  useEffect(() => {
    isDiscountVariablesModalOpen ? showPolarisModal(discountVariablesModalRef) : hidePolarisModal(discountVariablesModalRef);
  }, [isDiscountVariablesModalOpen]);

  const closeDiscardModal = useCallback(() => {
    setShowDiscardModal(false);
  }, []);

  const closeSelectTemplateModal = useCallback(() => {
    setIsSelectTemplateModalOpen(false);
    setTemplateModalStep("select");
    setTemplateSaveError(null);
    lastTemplateRequestRef.current = null;
    lastTemplateResponseRef.current = null;
    requestAnimationFrame(() => {
      selectTemplateOpenButtonRef.current?.focus();
    });
  }, []);

  const getTemplateDialogFocusableElements = useCallback((): HTMLElement[] => {
    if (!selectTemplateModalRef.current) {
      return [];
    }

    return Array.from(
      selectTemplateModalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => (
      !element.hasAttribute("disabled")
      && element.tabIndex >= 0
      && window.getComputedStyle(element).display !== "none"
      && window.getComputedStyle(element).visibility !== "hidden"
    ));
  }, []);

  const handleSelectTemplateDialogKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeSelectTemplateModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getTemplateDialogFocusableElements();
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    const activeElementIndex = activeElement ? focusableElements.indexOf(activeElement) : -1;
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (activeElementIndex === -1) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && activeElementIndex === 0) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && activeElementIndex === focusableElements.length - 1) {
      event.preventDefault();
      first.focus();
    }
  }, [closeSelectTemplateModal, getTemplateDialogFocusableElements]);

  const handleSelectTemplateBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeSelectTemplateModal();
    }
  }, [closeSelectTemplateModal]);

  const openSelectTemplateModal = useCallback(() => {
    setPendingDesignTemplate(bundleDesignTemplate);
    setPendingDesignPresetId(bundleDesignPresetId);
    setTemplateModalStep("select");
    setTemplateSaveError(null);
    lastTemplateRequestRef.current = null;
    lastTemplateResponseRef.current = null;
    setIsSelectTemplateModalOpen(true);
  }, [bundleDesignTemplate, bundleDesignPresetId]);

  const openDesignControlPanel = useCallback(() => {
    navigate(FPB_DESIGN_CONTROL_PANEL_URL);
  }, [navigate]);

  useEffect(() => {
    if (isSelectTemplateModalOpen) {
      selectTemplateModalRef.current?.focus();
    }
  }, [isSelectTemplateModalOpen]);

  useEffect(() => {
    const intent = templateFetcher.formData instanceof FormData
      ? templateFetcher.formData.get("intent")
      : null;

    if (templateFetcher.state !== "idle" || intent !== "updateBundleDesignTemplate") {
      return;
    }

    if (templateFetcher.data == null) {
      if (lastTemplateRequestRef.current) {
        setTemplateSaveError("Unable to save template. Please try again.");
      }
      return;
    }

    if (templateFetcher.data === lastTemplateResponseRef.current) {
      return;
    }

    lastTemplateResponseRef.current = templateFetcher.data;

    const response = templateFetcher.data as { success?: boolean; error?: string };
    const request = lastTemplateRequestRef.current;

    if (response.success) {
      if (request) {
        setBundleDesignTemplate(request.template);
        setBundleDesignPresetId(request.presetId);
        setTemplateModalStep("confirm");
      }
      setTemplateSaveError(null);
      lastTemplateRequestRef.current = null;
      return;
    }

    setTemplateSaveError(response.error || "Failed to save template settings.");
  }, [templateFetcher.data, templateFetcher.formData, templateFetcher.state]);

  const handleTemplateNext = useCallback(() => {
    if (!pendingDesignTemplate || !pendingDesignPresetId) {
      return;
    }

    setTemplateSaveError(null);
    lastTemplateRequestRef.current = {
      template: pendingDesignTemplate,
      presetId: pendingDesignPresetId,
    };
    lastTemplateResponseRef.current = null;

    const fd = new FormData();
    fd.append("intent", "updateBundleDesignTemplate");
    fd.append("bundleDesignTemplate", pendingDesignTemplate ?? "");
    fd.append("bundleDesignPresetId", pendingDesignPresetId ?? "");
    templateFetcher.submit(fd, { method: "POST" });
  }, [pendingDesignTemplate, pendingDesignPresetId, templateFetcher]);

  // SaveBar visibility controlled by isDirty flag - no complex change detection needed!

  function buildBundleUpsellConfig() {
    return {
      multiLangText: savedBundleUpsellConfig?.multiLangText ?? {},
      languageMode: upsellWidgetLanguageMode,
      widgetConfiguration: {
        isEnabled: upsellWidgetEnabled,
        type: "OFFER_WIDGET",
        imageUrl: upsellWidgetImageUrl,
        title: upsellWidgetTitle,
        description: upsellWidgetDescription,
        buttonText: upsellWidgetButtonText,
        displayConfiguration: buildVisibilityDisplayConfiguration(
          upsellWidgetDisplayOn,
          upsellWidgetSelectedProducts,
          upsellWidgetSpecificProductPages,
          upsellWidgetCollectionsSelectedData,
          upsellWidgetSpecificCollectionPages,
        ),
        useLinkProductAsDefaultProduct: autoSelectBrowsedProduct,
        languageMode: upsellWidgetLanguageMode,
      },
    };
  }

  const normalizedPricingDisplayOptions = useMemo(() => normalizePricingDisplayOptions({
    rules: pricingState.discountRules,
    messages: {
      displayOptions: pricingState.pricingDisplayOptions,
    },
    showProgressBar: pricingState.showDiscountProgressBar,
    steps: stepsState.steps.map(step => ({
      id: step.id,
      enabled: step.enabled,
      maxQuantity: step.maxQuantity,
    })),
  }), [
    pricingState.discountRules,
    pricingState.pricingDisplayOptions,
    pricingState.showDiscountProgressBar,
    stepsState.steps,
  ]);

  const normalizedRuleMessages = useMemo(() => normalizePricingRuleMessages({
    rules: pricingState.discountRules,
    messages: { ruleMessages },
    method: pricingState.discountType,
  }), [
    pricingState.discountRules,
    pricingState.discountType,
    ruleMessages,
  ]);
  const bundleQuantityOptionsEligible = pricingState.discountType !== DiscountMethod.BUY_X_GET_Y
    && pricingState.discountRules.length > 0
    && pricingState.discountRules.every((rule) => rule.conditionType === "quantity");
  const displayOptionsInactive = !pricingState.discountEnabled || pricingState.discountRules.length === 0;

  useEffect(() => {
    if (!bundleQuantityOptionsEligible && pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled) {
      pricingState.setBundleQuantityOptionsEnabled(false);
    }
  }, [
    bundleQuantityOptionsEligible,
    pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled,
    pricingState.setBundleQuantityOptionsEnabled,
  ]);

  const readinessItems = useMemo<BundleReadinessItem[]>(() => {
    const hasProducts = stepsState.steps.reduce((totalProducts, step) => {
      const legacyProducts = Array.isArray(step.StepProduct) ? step.StepProduct.length : 0;
      const categoryProductCount = Array.isArray((step as any).StepCategory)
        ? ((step as any).StepCategory as any[]).reduce(
            (count: number, category: any) => count + (Array.isArray(category?.products) ? category.products.length : 0),
            0,
          )
        : 0;
      return totalProducts + legacyProducts + categoryProductCount;
    }, 0) >= 3;
    const hasBundleVisibility = Boolean(bundle.shopifyPageId || bundle.shopifyPageHandle || formState.bundleStatus === "active");
    const parentProductActive = String(productStatus || loadedBundleProduct?.status || "").toLowerCase() === "active";

    return [
      { key: "embed",         label: "App Embed Enabled",           description: "Needed for your bundle to show up on store",          points: 15, done: appEmbedEnabled },
      { key: "products",      label: "Minimum 3 Products Added",    description: "Add more products to build a better bundle",          points: 20, done: hasProducts },
      { key: "discount",      label: "Set Up Discount",             description: "Bundles with offers tend to sell better",             points: 15, done: pricingState.discountEnabled },
      { key: "preview",       label: "Preview Bundle",              description: "Check your bundle looks and works right",             points: 10, done: hasPreview },
      { key: "visible",       label: "Set Up Bundle Visibility",    description: "Put your bundle where shoppers can find it",          points: 25, done: hasBundleVisibility },
      { key: "product_active",label: "Set Parent Product to Active","description": "Unlisted bundles won't show in search",            points: 15, done: parentProductActive },
    ];
  }, [
    appEmbedEnabled,
    bundle.shopifyPageHandle,
    bundle.shopifyPageId,
    formState.bundleStatus,
    hasPreview,
    loadedBundleProduct?.status,
    pricingState.discountEnabled,
    productStatus,
    stepsState.steps,
  ]);

  const readinessScore = readinessItems.reduce((sum, item) => sum + (item.done ? item.points : 0), 0);
  const readinessClassName = readinessScore >= 80
    ? fullPageBundleStyles.readinessButtonHigh
    : readinessScore >= 40
      ? fullPageBundleStyles.readinessButtonMedium
      : fullPageBundleStyles.readinessButtonLow;

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      if (bundle.bundleType === 'full_page' && bundle.shopifyPageId) {
        const normalizedSlugError = validateSlug(normalizedPageSlug);
        if (normalizedSlugError) {
          shopify.toast.show(normalizedSlugError, { isError: true, duration: 5000 });
          return;
        }

        if (normalizedPageSlug !== (bundle.shopifyPageHandle ?? '')) {
          const renameData = new FormData();
          renameData.append("intent", "renamePageSlug");
          renameData.append("newSlug", normalizedPageSlug);

          const renameResponse = await fetch(window.location.pathname, {
            method: "POST",
            body: renameData,
          });
          const renameResult = await renameResponse.json() as {
            success?: boolean;
            error?: string;
            newHandle?: string;
            adjusted?: boolean;
          };

          if (!renameResponse.ok || !renameResult.success || !renameResult.newHandle) {
            shopify.toast.show(
              renameResult.error || "Could not rename page slug",
              { isError: true, duration: 5000 }
            );
            return;
          }

          if (renameResult.adjusted && renameResult.newHandle !== normalizedPageSlug) {
            shopify.toast.show(
              `The slug '${normalizedPageSlug}' was taken - using '${renameResult.newHandle}' instead.`,
              { duration: 6000 }
            );
          }

          setPageSlug(renameResult.newHandle);
          originalPageSlugRef.current = renameResult.newHandle;
          setHasManuallyEditedSlug(true);
        }
      }

      // Prepare form data for submission
      const formData = new FormData();
      formData.append("intent", "saveBundle");
      formData.append("bundleName", formState.bundleName);
      formData.append("bundleDescription", formState.bundleDescription);
      formData.append("templateName", formState.templateName);
      formData.append("fullPageLayout", formState.fullPageLayout);
      formData.append("bundleStatus", formState.bundleStatus);
      // Merge collections data into steps before saving
      const stepsWithCollections = stepsState.steps.map(step => ({
        ...step,
        isFreeGift: false,
        freeGiftName: null,
        addonLabel: null,
        addonTitle: null,
        addonIconUrl: null,
        addonDisplayFree: false,
        addonTiers: [],
        collections: selectedCollections[step.id] || step.collections || []
      }));
      const pricingMessages = serializePricingDisplayOptions({
        existingMessages: {
          showDiscountMessaging: pricingState.discountMessagingEnabled,
          ruleMessages: normalizedRuleMessages,
        },
        options: normalizedPricingDisplayOptions,
      });

      formData.append("stepsData", JSON.stringify(stepsWithCollections));
      const enrichedRuleMessages = Object.fromEntries(
        Object.entries(normalizedRuleMessages).map(([id, msg]) => [
          id,
          { ...msg, successMessage: globalSuccessMessage || msg.successMessage },
        ])
      );
      formData.append("discountData", JSON.stringify({
        discountEnabled: pricingState.discountEnabled,
        discountType: pricingState.discountType,
        discountRules: pricingState.discountRules,
        showFooter: pricingState.showFooter,
        showDiscountProgressBar: pricingState.showDiscountProgressBar,
        discountMessagingEnabled: pricingState.discountMessagingEnabled,
        ruleMessages: enrichedRuleMessages,
        successMessage: globalSuccessMessage,
        successMessageByLocale: discountMessagingMultiLanguageEnabled ? successMessageByLocale : null,
        pricingDisplayOptions: pricingMessages.displayOptions,
        discountMessagingMultiLanguageEnabled,
        ruleMessagesByLocale: discountMessagingMultiLanguageEnabled ? ruleMessagesByLocale : null,
        tierTextByRuleId: Object.keys(tierTextByRuleId).length > 0 ? tierTextByRuleId : null,
        tierTextByLocaleByRuleId: Object.keys(tierTextByLocaleByRuleId).length > 0 ? tierTextByLocaleByRuleId : null,
      }));
      formData.append("stepConditions", JSON.stringify(conditionsState.stepConditions));
      formData.append("bundleProduct", JSON.stringify(bundleProduct));
      formData.append("promoBannerBgImage", promoBannerBgImage ?? "");
      formData.append("promoBannerBgImageCrop", promoBannerBgImageCrop ?? "");
      formData.append("loadingGif", loadingGif ?? "");
      formData.append("tierConfigData", tierConfig.length > 0 ? JSON.stringify(tierConfig) : "");
      // Only send showStepTimeline when >= 2 tiers are configured (server will reset to null otherwise)
      if (tierConfig.length >= 2) {
        formData.append("showStepTimeline", String(showStepTimeline));
      }
      formData.append("floatingBadgeEnabled", String(floatingBadgeEnabled));
      formData.append("floatingBadgeText", floatingBadgeText);
      formData.append("showProductPrices", String(showProductPrices));
      formData.append("showCompareAtPrices", String(showCompareAtPrices));
      formData.append("cartRedirectToCheckout", String(cartRedirectToCheckout));
      formData.append("allowQuantityChanges", String(allowQuantityChanges));
      formData.append("searchBarEnabled", String(searchBarEnabled));
      formData.append("textOverrides", Object.keys(textOverrides).length > 0 ? JSON.stringify(textOverrides) : "");
      formData.append("textOverridesByLocale", Object.keys(textOverridesByLocale).length > 0 ? JSON.stringify(textOverridesByLocale) : "");
      formData.append("bundleTextConfig", JSON.stringify({
        bundleSummary: {
          title: textOverrides.yourBundle ?? "",
          subTitle: textOverrides.reviewBundle ?? "",
        },
      }));
      const addonMessages = ruleMessages[ADDON_MESSAGE_KEY] || null;
      const personalizationData = buildPersonalizationDataFromDraft(addonDraft, addonMessages, giftMessageDraft);
      formData.append("personalizationData", personalizationData ? JSON.stringify(personalizationData) : "");
      formData.append("bundleUpsellConfig", JSON.stringify(buildBundleUpsellConfig()));
      formData.append("upsellWidgetEnabled", String(upsellWidgetEnabled));
      formData.append("upsellWidgetDisplayMode", upsellWidgetDisplayMode);
      formData.append("upsellWidgetDisplayOn", upsellWidgetDisplayOn);
      formData.append("autoSelectBrowsedProduct", String(autoSelectBrowsedProduct));
      formData.append("bundleBannerDesktopUrl", bundleBannerDesktopUrl);
      formData.append("bundleBannerMobileUrl", bundleBannerMobileUrl);
      formData.append("bundleLevelCss", bundleLevelCss);
      formData.append("productSlotsEnabled", String(productSlotsEnabled));
      formData.append("maxQtyPerProduct", maxQtyPerProduct);

      // Submit to server action using fetcher

      fetcher.submit(formData, { method: "post" });

      // Note: With useFetcher, we need to handle the response via useEffect
      // The immediate return here will be handled by the fetcher response
      return;
    } catch (error) {
      AppLogger.error("Save failed:", {}, error as any);
      shopify.toast.show((error as Error).message || "Failed to save changes", { isError: true, duration: 5000 });
    }
  }, [
    formState.bundleStatus,
    formState.bundleName,
    formState.bundleDescription,
    formState.templateName,
    stepsState.steps,
    pricingState.discountEnabled,
    pricingState.discountType,
    pricingState.discountRules,
    pricingState.showFooter,
    pricingState.showDiscountProgressBar,
    pricingState.discountMessagingEnabled,
    normalizedPricingDisplayOptions,
    normalizedRuleMessages,
    selectedCollections,
    conditionsState.stepConditions,
    bundleProduct,
    productStatus,
    promoBannerBgImage,
    promoBannerBgImageCrop,
    loadingGif,
    pageSlug,
    normalizedPageSlug,
    bundle.bundleType,
    bundle.shopifyPageId,
    bundle.shopifyPageHandle,
    tierConfig,
    showStepTimeline,
    floatingBadgeEnabled,
    floatingBadgeText,
    showProductPrices,
    showCompareAtPrices,
    cartRedirectToCheckout,
    allowQuantityChanges,
    searchBarEnabled,
    textOverrides,
    textOverridesByLocale,
    ruleMessages,
    addonDraft,
    giftMessageDraft,
    discountMessagingMultiLanguageEnabled,
    globalSuccessMessage,
    successMessageByLocale,
    ruleMessagesByLocale,
    upsellWidgetEnabled,
    upsellWidgetDisplayMode,
    upsellWidgetDisplayOn,
    upsellWidgetTitle,
    upsellWidgetDescription,
    upsellWidgetButtonText,
    upsellWidgetImageUrl,
    upsellWidgetLanguageMode,
    upsellWidgetSelectedProducts,
    upsellWidgetSpecificProductPages,
    upsellWidgetCollectionsSelectedData,
    upsellWidgetSpecificCollectionPages,
    autoSelectBrowsedProduct,
    bundleBannerDesktopUrl,
    bundleBannerMobileUrl,
    bundleLevelCss,
    productSlotsEnabled,
    maxQtyPerProduct,
    shopify
  ]);

  const {
    draggedStep,
    dragOverIndex,
    draggedCatKey,
    dragOverCatKey,
    setDragOverCatKey,
    enhanceTemplateListWithUserSelection,
    handleProductSelection,
    handleSyncProduct,
    handleSyncBundleConfirm,
    handleBundleProductSelect,
    cloneStep,
    deleteStep,
    navigateToStep,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleCatDragStart,
    handleCatDragEnd,
    handleCatDrop,
    handleCollectionSelection,
    updateRuleMessage,
  } = useSharedBundleHandlers({
    stepsState,
    formState,
    selectedCollections,
    setSelectedCollections,
    setRuleMessages,
    setBundleProduct,
    setProductTitle,
    setProductImageUrl,
    markAsDirty,
    activeTabIndex,
    setActiveTabIndex,
    shopify,
    fetcher,
    setIsSyncModalOpen,
    setSlideDir,
    setSlideKey,
    setShowIconPickerForStep,
  });

  // Handle fetcher response
  // CRITICAL FIX: Only process NEW fetcher responses to prevent auto-save bug
  // Note: Intentionally omitting state values from dependencies - we want to capture
  // current values when the response arrives, not re-run when they change
  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      // Skip if we've already processed this response
      if (fetcher.data === lastProcessedFetcherDataRef.current) {
        return;
      }

      // Mark this response as processed
      lastProcessedFetcherDataRef.current = fetcher.data;

      const result = fetcher.data;

      // Handle different action types based on the response or form data
      if (result.success) {
        // Check if this was a save bundle action by looking for bundle data in response
        if ('bundle' in result && result.bundle) {
          // This is a save bundle response
          // Update the ref to new baseline for discard functionality
          originalValuesRef.current = {
            status: formState.bundleStatus,
            name: formState.bundleName,
            description: formState.bundleDescription,
            templateName: formState.templateName,
            fullPageLayout: formState.fullPageLayout,
            steps: JSON.stringify(stepsState.steps),
            discountEnabled: pricingState.discountEnabled,
            discountType: pricingState.discountType,
            discountRules: JSON.stringify(pricingState.discountRules),
            showFooter: pricingState.showFooter,
            showDiscountProgressBar: pricingState.showDiscountProgressBar,
            discountMessagingEnabled: pricingState.discountMessagingEnabled,
            pricingDisplayOptions: JSON.stringify(pricingState.pricingDisplayOptions),
            selectedCollections: JSON.stringify(selectedCollections),
            ruleMessages: JSON.stringify(normalizedRuleMessages),
            stepConditions: JSON.stringify(conditionsState.stepConditions),
            bundleProduct: bundleProduct || null,
            productStatus: productStatus,
          };

          // Update discard baselines for fields managed outside originalValuesRef
          originalPromoBannerBgImageRef.current = promoBannerBgImage;
          originalPromoBannerBgImageCropRef.current = promoBannerBgImageCrop;
          originalLoadingGifRef.current = loadingGif;
          originalTierConfigRef.current = tierConfig;
          originalShowStepTimelineRef.current = showStepTimeline;
          originalFloatingBadgeEnabledRef.current = floatingBadgeEnabled;
          originalFloatingBadgeTextRef.current = floatingBadgeText;
          originalSearchBarEnabledRef.current = searchBarEnabled;
          originalShowProductPricesRef.current = showProductPrices;
          originalShowCompareAtPricesRef.current = showCompareAtPrices;
          originalCartRedirectToCheckoutRef.current = cartRedirectToCheckout;
          originalAllowQuantityChangesRef.current = allowQuantityChanges;
          originalTextOverridesRef.current = textOverrides;
          originalTextOverridesByLocaleRef.current = textOverridesByLocale;
          originalAddonDraftRef.current = addonDraft;
          originalGiftMessageDraftRef.current = giftMessageDraft;
          originalDiscountMessagingMultiLanguageEnabledRef.current = discountMessagingMultiLanguageEnabled;
          originalRuleMessagesByLocaleRef.current = ruleMessagesByLocale;

          // Reset dirty flag after successful save
          setIsDirty(false);

          shopify.toast.show(('message' in result ? result.message : null) || "Changes saved successfully", { isError: false });
        } else if ('productId' in result && result.productId) {
          // This is a sync product response
          const syncMessage = ('message' in result ? result.message : null) || "Product synced successfully";
          shopify.toast.show(syncMessage, { isError: false });

          // Show detailed sync information if available
          if ('syncedData' in result && result.syncedData) {
            const syncedData = result.syncedData as any;
            const { title, status, lastUpdated, changesDetected } = syncedData;

            // If changes were detected and applied, show additional notification
            if (changesDetected) {
              setTimeout(() => {
                shopify.toast.show("Bundle data updated with changes from Shopify product", { isError: false });
              }, 2000);
            }
          }

          // Note: Removed forced page reload to preserve unsaved UI changes
          // The sync updates metafields but doesn't affect the current UI state
        } else if ('pages' in result && result.pages) {
          // This is a get Shopify pages response (for full-page bundles)
          const pages = (result as any).pages || [];

          // Transform pages to match the template format expected by the modal
          const formattedPages = pages.map((page: any) => ({
            handle: page.handle,
            title: page.title,
            type: 'page',
            isPage: true // Flag to identify this as a Shopify page vs template
          }));

          setAvailablePages(formattedPages);
          setIsLoadingPages(false);
        } else if ('templates' in result && result.templates) {
          // This is a get theme templates response (for product-page bundles)
          const rawTemplates = (result as any).templates || [];
          const enhancedTemplates = enhanceTemplateListWithUserSelection(rawTemplates);
          setAvailablePages(enhancedTemplates);
          setIsLoadingPages(false);
        } else if ('themeId' in result && result.themeId) {
          // This is a get current theme response - handled by individual callbacks
        } else if ('pageHandle' in result && result.pageHandle) {
          // Bundle page created successfully
          const pageUrl = (result as any).pageUrl;
          const createdHandle = (result as any).pageHandle as string;
          const slugAdjusted = Boolean((result as any).slugAdjusted);
          const installRequired = (result as any).widgetInstallationRequired;
          const installLink = (result as any).widgetInstallationLink;

          setPageSlug(createdHandle);
          originalPageSlugRef.current = createdHandle;
          setHasManuallyEditedSlug(true);

          if (slugAdjusted && createdHandle !== normalizedPageSlug) {
            shopify.toast.show(
              `The slug '${normalizedPageSlug}' was taken - using '${createdHandle}' instead.`,
              { duration: 6000 }
            );
          }

          if (installRequired && installLink) {
            shopify.toast.show(
              "Page created! Activate the Wolfpack Bundle embed in Theme Settings to go live.",
              { isError: false, duration: 8000 }
            );
            window.open(installLink, '_blank');
          } else {
            shopify.toast.show("Bundle page created successfully!", { isError: false });
            if (pageUrl) {
              window.open(pageUrl, '_blank');
            }
          }
          revalidator.revalidate();
        } else if ('shareablePreviewUrl' in result && result.shareablePreviewUrl) {
          // Draft preview page created/retrieved — open in new tab
          shopify.toast.show("Opening preview in new tab…", { duration: 2000 });
          window.open(result.shareablePreviewUrl as string, '_blank');
          revalidator.revalidate();
        } else if ('synced' in result && result.synced) {
          // Sync bundle response
          shopify.toast.show(('message' in result ? result.message : null) || "Bundle synced successfully", { isError: false });
          revalidator.revalidate();
          // Open embed activation link so merchant can activate (or confirm) the embed
          const syncInstallLink = (result as any).widgetInstallationLink;
          if (syncInstallLink) {
            setTimeout(() => window.open(syncInstallLink, '_blank'), 800);
          }
        } else {
          // Generic success response
          shopify.toast.show(('message' in result ? result.message : null) || "Operation completed successfully", { isError: false });
        }
      } else {
        // Handle errors based on action type
        const errorMessage = ('error' in result ? result.error : null) || "Operation failed";
        shopify.toast.show(errorMessage, { isError: true, duration: 5000 });

        // Handle specific error cases
        if (errorMessage.includes("pages") || errorMessage.includes("templates")) {
          setIsLoadingPages(false);
        }
      }
    }
  }, [fetcher.data, fetcher.state, normalizedPageSlug, revalidator, shopify]);

  // Discard handler - resets hook state and all local state
  const handleDiscard = useCallback(() => {
    hookHandleDiscard();
    setPageSlug(originalPageSlugRef.current);
    setHasManuallyEditedSlug(Boolean(bundle.shopifyPageHandle));
    setPromoBannerBgImage(originalPromoBannerBgImageRef.current);
    setPromoBannerBgImageCrop(originalPromoBannerBgImageCropRef.current);
    setLoadingGif(originalLoadingGifRef.current);
    setTierConfig(originalTierConfigRef.current);
    setShowStepTimeline(originalShowStepTimelineRef.current);
    setFloatingBadgeEnabled(originalFloatingBadgeEnabledRef.current);
    setFloatingBadgeText(originalFloatingBadgeTextRef.current);
    setSearchBarEnabled(originalSearchBarEnabledRef.current);
    setShowProductPrices(originalShowProductPricesRef.current);
    setShowCompareAtPrices(originalShowCompareAtPricesRef.current);
    setCartRedirectToCheckout(originalCartRedirectToCheckoutRef.current);
    setAllowQuantityChanges(originalAllowQuantityChangesRef.current);
    setTextOverrides(originalTextOverridesRef.current);
    setTextOverridesByLocale(originalTextOverridesByLocaleRef.current);
    setAddonDraft(originalAddonDraftRef.current);
    setGiftMessageDraft(originalGiftMessageDraftRef.current);
    setDiscountMessagingMultiLanguageEnabled(originalDiscountMessagingMultiLanguageEnabledRef.current);
    setRuleMessagesByLocale(originalRuleMessagesByLocaleRef.current);
  }, [bundle.shopifyPageHandle, hookHandleDiscard]);

  const handleConfirmDiscard = useCallback(() => {
    closeDiscardModal();
    handleDiscard();
  }, [closeDiscardModal, handleDiscard]);

  const promptSaveBarBeforeNavigation = useCallback(() => {
    shopify.toast.show("Save or discard your changes before moving to another section.", {
      isError: true,
      duration: 5000
    });
    void (shopify as any).saveBar?.leaveConfirmation?.();
  }, [shopify]);

  // Navigation handlers with unsaved changes check
  const handleBackClick = useCallback(() => {
    if (isDirty && !forceNavigation) {
      promptSaveBarBeforeNavigation();
      return;
    }
    navigate("/app/dashboard");
  }, [isDirty, forceNavigation, navigate, promptSaveBarBeforeNavigation]);

  const enablePreviewGate = useEnablePreviewGate({
    appEmbedEnabled,
    themeEditorUrl,
    onSilentBlock: () => shopify.toast.show("Theme editor is unavailable for this shop.", { isError: true }),
  });

  const handlePreviewBundle = useCallback(() => {
    if (isDirty) {
      // Show user-friendly message about unsaved changes
      shopify.toast.show("Please save your changes before previewing the bundle", {
        isError: true,
        duration: 4000
      });
      return;
    }

    enablePreviewGate.requestPreview(() => {
    // FOR FULL-PAGE BUNDLES: Use page URL instead of product URL
    if (bundle.bundleType === 'full_page') {
      if (!bundle.shopifyPageHandle) {
        // No published page yet — trigger draft preview page creation
        const formData = new FormData();
        formData.append("intent", "createPreviewPage");
        fetcher.submit(formData, { method: "post" });
        return;
      }

      const shopDomain = shop.includes('.myshopify.com')
        ? shop.replace('.myshopify.com', '')
        : shop.split('.')[0];

      // When the theme app extension is enabled AND the bundle is active or
      // unlisted, open the Shopify Page URL so the merchant sees the live
      // storefront experience. Otherwise keep the app-proxy URL as the
      // canonical preview destination.
      const bundleStatus = String((bundle as any).status ?? "").toLowerCase();
      const liveEligible = appEmbedEnabled && (bundleStatus === "active" || bundleStatus === "unlisted");
      const pageUrl = liveEligible
        ? `https://${shopDomain}.myshopify.com/pages/${bundle.shopifyPageHandle}`
        : `https://${shopDomain}.myshopify.com/apps/product-bundles/wpb/${bundle.id}`;


      open(pageUrl, '_blank');
      shopify.toast.show("Bundle page opened in new tab", { isError: false });
      return;
    }

    // FOR PRODUCT-PAGE BUNDLES: Use product URL
    let productUrl = null;
    const productHandle = bundleProduct?.handle || bundle.shopifyProductHandle;

    if (bundleProduct) {

      // Method 1: Use onlineStorePreviewUrl first (works for both published and draft products)
      if (bundleProduct.onlineStorePreviewUrl) {
        productUrl = bundleProduct.onlineStorePreviewUrl;
      }
      // Method 2: Fallback to onlineStoreUrl if preview URL not available
      else if (bundleProduct.onlineStoreUrl) {
        productUrl = bundleProduct.onlineStoreUrl;
      }
    }

    // Method 3: Construct URL from handle (GraphQL product handle or DB-stored handle)
    if (!productUrl && productHandle) {
      if (shop.includes('shopifypreview.com')) {
        productUrl = `https://${shop}/products/${productHandle}`;
      } else {
        const shopDomain = shop.includes('.myshopify.com')
          ? shop.replace('.myshopify.com', '')
          : shop;
        productUrl = `https://${shopDomain}.myshopify.com/products/${productHandle}`;
      }
    }
    // Method 4: Fallback - Extract ID and use admin URL
    else if (!productUrl && bundleProduct?.id) {
      const productId = bundleProduct.id.includes('gid://shopify/Product/')
        ? bundleProduct.id.split('/').pop()
        : bundleProduct.id;

      const shopDomain = shop.includes('.myshopify.com')
        ? shop.replace('.myshopify.com', '')
        : shop.split('.')[0];

      productUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
    }

    if (productUrl) {
      open(productUrl, '_blank');

      const isPreviewUrl = bundleProduct && productUrl === bundleProduct.onlineStorePreviewUrl;
      const message = isPreviewUrl
        ? "Bundle product preview opened in new tab"
        : "Bundle product opened in new tab";

      shopify.toast.show(message, { isError: false });
    } else {
      AppLogger.error('Bundle product data:', {}, bundleProduct);
      shopify.toast.show("Unable to determine bundle product URL. Please check bundle product configuration.", {
        isError: true,
        duration: 5000
      });
    }
    });
  }, [isDirty, bundle, bundleProduct, shop, shopify, enablePreviewGate, appEmbedEnabled]);

  const handleSectionChange = useCallback((section: string) => {
    if (section === activeSection) return;

    if (isDirty) {
      promptSaveBarBeforeNavigation();
      return;
    }

    setActiveSection(section);
  }, [isDirty, activeSection, promptSaveBarBeforeNavigation]);

  const openProductInAdmin = useCallback((productId: string) => {
    const storeHandle = shop?.replace('.myshopify.com', '');
    const adminProductUrl = `https://admin.shopify.com/store/${storeHandle}/products/${productId}`;
    if (window.location.hostname.includes("trycloudflare.com")) {
      window.open(adminProductUrl, "_blank");
    } else {
      shopify.navigate(adminProductUrl);
    }
  }, [shop, shopify]);

  const handleReadinessItemClick = useCallback((key: string) => {
    setReadinessOpen(false);
    switch (key) {
      case "embed":
        if (themeEditorUrl) window.open(themeEditorUrl, "_blank");
        break;
      case "products":
        handleSectionChange("step_setup");
        break;
      case "discount":
        handleSectionChange("discount_pricing");
        break;
      case "preview":
        void handlePreviewBundle();
        localStorage.setItem(`wpb_preview_${bundle.id}`, "1");
        setHasPreview(true);
        break;
      case "visible":
        handleSectionChange("bundle_visibility");
        break;
      case "product_active": {
        const productId = bundleProduct?.legacyResourceId || bundleProduct?.id?.split('/').pop() || bundle.shopifyProductId?.split('/').pop();
        if (productId) {
          openProductInAdmin(productId);
        }
        break;
      }
      default:
        break;
    }
  }, [themeEditorUrl, handleSectionChange, handlePreviewBundle, bundle.id, bundleProduct, openProductInAdmin]);

  const handleTemplatePreview = useCallback(() => {
    void handlePreviewBundle();
    closeSelectTemplateModal();
  }, [closeSelectTemplateModal, handlePreviewBundle]);

  // Modal handlers for products and collections view
  // handleShowProducts and handleShowCollections removed - modals managed inline

  const handleCloseProductsModal = useCallback(() => {
    closeProductsModal();
    setCurrentModalStepId('');
  }, []);

  const handleCloseCollectionsModal = useCallback(() => {
    closeCollectionsModal();
    setCurrentModalStepId('');
  }, []);

  useModalHideListener(stepsTiersModalRef, () => setStepsTiersWarning({ open: false, onConfirm: null }));
  useModalHideListener(pageSelectionModalRef, closePageSelectionModal);
  useModalHideListener(productsModalRef, handleCloseProductsModal);
  useModalHideListener(collectionsModalRef, handleCloseCollectionsModal);
  useModalHideListener(syncModalRef, () => setIsSyncModalOpen(false));
  useModalHideListener(progressBarMultiLangModalRef, () => setIsProgressBarMultiLangModalOpen(false));
  useModalHideListener(bundleQuantityMultiLangModalRef, () => setIsBundleQuantityMultiLangModalOpen(false));
  useModalHideListener(discountVariablesModalRef, () => setIsDiscountVariablesModalOpen(false));

  // Add a new step and animate forward to it
  const handleAddNewStep = useCallback(() => {
    const isActivatingMultiStep = stepsState.steps.length === 1;
    if (isActivatingMultiStep && tierConfig.length >= 2) {
      setStepsTiersWarning({
        open: true,
        onConfirm: () => {
          stepsState.addStep();
          setSlideDir("forward");
          setSlideKey(prev => prev + 1);
          setActiveTabIndex(stepsState.steps.length);
        },
      });
      return;
    }
    stepsState.addStep();
    setSlideDir("forward");
    setSlideKey(prev => prev + 1);
    setActiveTabIndex(stepsState.steps.length);
  }, [stepsState, tierConfig, setStepsTiersWarning, setActiveTabIndex]);

  // Function to load available pages or templates based on bundle type
  const loadAvailablePages = useCallback(() => {
    setIsLoadingPages(true);
    try {
      const formData = new FormData();

      // For full-page bundles, fetch Shopify pages (under /pages/ route)
      // For product-page bundles, fetch product templates
      if (bundle.bundleType === 'full_page') {
        formData.append("intent", "getPages");
      } else {
        formData.append("intent", "getThemeTemplates");
      }

      fetcher.submit(formData, { method: "post" });
      // Response will be handled by the existing useEffect
    } catch (error) {
      const resourceType = bundle.bundleType === 'full_page' ? 'pages' : 'theme templates';
      AppLogger.error(`Failed to load ${resourceType}:`, {}, error as any);
      shopify.toast.show(`Failed to load ${resourceType}`, { isError: true, duration: 5000 });
      setIsLoadingPages(false);
    }
  }, [fetcher, shopify, bundle.bundleType]);

  // Add to Storefront: creates a Shopify page for full-page bundles
  const handleAddToStorefront = useCallback(async () => {
    try {
      const normalizedSlugError = validateSlug(normalizedPageSlug);
      if (normalizedSlugError) {
        shopify.toast.show(normalizedSlugError, { isError: true, duration: 5000 });
        return;
      }

      const formData = new FormData();
      formData.append("intent", "validateWidgetPlacement");
      formData.append("desiredSlug", normalizedPageSlug);
      fetcher.submit(formData, { method: "post" });
    } catch (error) {
      AppLogger.error('Error creating bundle page:', {}, error as any);
      shopify.toast.show("Failed to create bundle page", { isError: true, duration: 5000 });
    }
  }, [fetcher, normalizedPageSlug, shopify]);

  // Place widget handlers with page selection modal
  const handlePlaceWidget = useCallback(() => {
    try {
      openPageSelectionModal();
      loadAvailablePages();
    } catch (error) {
      AppLogger.error('Error opening page selection:', {}, error as any);
      shopify.toast.show("Failed to open page selection", { isError: true, duration: 5000 });
    }
  }, [loadAvailablePages, shopify]);

  const openVisibilityProductPicker = useCallback(async (target: "widget" | "embed") => {
    const currentProducts = target === "widget" ? upsellWidgetSelectedProducts : [];
    const picked = await (shopify as any).resourcePicker({
      type: "product",
      multiple: true,
      action: "select",
      selectionIds: buildVisibilitySelectionIds(currentProducts),
    });
    const selection = getVisibilityPickerSelection(picked);
    if (!selection) return;

    const selectedProducts = selection.map(normalizeVisibilityProductForDisplayConfiguration);
    const pageTargets = selectedProducts.map(normalizeVisibilityProductPageTarget);

    setUpsellWidgetSelectedProducts(selectedProducts);
    setUpsellWidgetSpecificProductPages(pageTargets);
    markAsDirty();
  }, [markAsDirty, shopify, upsellWidgetSelectedProducts]);

  const openVisibilityCollectionPicker = useCallback(async (target: "widget" | "embed") => {
    const currentCollections = target === "widget" ? upsellWidgetCollectionsSelectedData : [];
    const picked = await (shopify as any).resourcePicker({
      type: "collection",
      multiple: true,
      action: "select",
      selectionIds: buildVisibilitySelectionIds(currentCollections),
    });
    const selection = getVisibilityPickerSelection(picked);
    if (!selection) return;

    const collectionsSelectedData = selection.map(normalizeVisibilityCollectionForDisplayConfiguration);
    const pageTargets = collectionsSelectedData.map(normalizeVisibilityCollectionPageTarget);

    setUpsellWidgetCollectionsSelectedData(collectionsSelectedData);
    setUpsellWidgetSpecificCollectionPages(pageTargets);
    markAsDirty();
  }, [markAsDirty, shopify, upsellWidgetCollectionsSelectedData]);

  const removeVisibilityProductTarget = useCallback((target: "widget" | "embed", indexToRemove: number) => {
    if (target === "widget") {
      setUpsellWidgetSelectedProducts((prev) => prev.filter((_, index) => index !== indexToRemove));
      setUpsellWidgetSpecificProductPages((prev) => prev.filter((_, index) => index !== indexToRemove));
    }
    markAsDirty();
  }, [markAsDirty]);

  const removeVisibilityCollectionTarget = useCallback((target: "widget" | "embed", indexToRemove: number) => {
    if (target === "widget") {
      setUpsellWidgetCollectionsSelectedData((prev) => prev.filter((_, index) => index !== indexToRemove));
      setUpsellWidgetSpecificCollectionPages((prev) => prev.filter((_, index) => index !== indexToRemove));
    }
    markAsDirty();
  }, [markAsDirty]);

  const handlePageSelection = useCallback(async (template: any) => {
    if (!template?.handle) {
      shopify.toast.show("Template data is invalid", { isError: true, duration: 5000 });
      return;
    }

    const shopDomain = shop.includes('.myshopify.com')
      ? shop.replace('.myshopify.com', '')
      : shop;

    // Build theme editor deep link (used as fallback for non-page templates and on error)
    const buildThemeEditorUrl = () => {
      const placementBlockHandle = upsellWidgetDisplayMode === "button" ? "bundle-upsell-button" : "bundle-upsell-block";
      const appBlockId = `${apiKey}/${placementBlockHandle}`;
      const templateParam = template.isPage ? 'page' : template.handle;
      const previewPath = template.isPage ? encodeURIComponent(`/pages/${template.handle}`) : '';
      return `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${templateParam}&addAppBlockId=${appBlockId}&target=newAppsSection${previewPath ? `&previewPath=${previewPath}` : ''}`;
    };

    // ── Full-page bundle: auto-install via Theme API (no theme editor needed) ──
    if (template.isPage) {
      setIsInstallingWidget(true);
      try {

        const response = await fetch('/api/install-fpb-widget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageHandle: template.handle }),
        });

        const result = await response.json() as { success: boolean; templateCreated?: boolean; templateAlreadyExists?: boolean; error?: string };

        if (result.success) {
          setSelectedPage(template);
          closePageSelectionModal();
          const msg = result.templateAlreadyExists
            ? `Widget already installed — your bundle page is live.`
            : `Widget installed! Your bundle page is live.`;
          shopify.toast.show(msg, { isError: false, duration: 6000 });
        } else {
          // Auto-install failed — fall back to theme editor
          AppLogger.error(`🚨 [INSTALL] Auto-install failed, falling back to theme editor`, { error: result.error });
          setSelectedPage(template);
          closePageSelectionModal();
          shopify.toast.show(`Couldn't auto-install — opening Theme Editor instead.`, { isError: false, duration: 5000 });
          window.open(buildThemeEditorUrl(), '_blank');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        AppLogger.error(`🚨 [INSTALL] Unexpected error, falling back to theme editor`, { errorMessage });
        setSelectedPage(template);
        closePageSelectionModal();
        shopify.toast.show(`Couldn't auto-install — opening Theme Editor instead.`, { isError: false, duration: 5000 });
        window.open(buildThemeEditorUrl(), '_blank');
      } finally {
        setIsInstallingWidget(false);
      }
      return;
    }

    // ── Product-page / custom template: open theme editor (existing flow) ──
    try {
      if (!apiKey || !blockHandle) {
        shopify.toast.show("App configuration missing. Please check app setup.", { isError: true, duration: 5000 });
        return;
      }

      if (template.isBundleContainer && template.bundleProduct) {
        await fetch('/api/ensure-product-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productHandle: template.bundleProduct.handle, bundleId: bundle.id }),
        }).catch(() => { /* non-fatal */ });
      }

      setSelectedPage(template);
      closePageSelectionModal();
      shopify.toast.show(`Opening Theme Editor for "${template.title}"...`, { isError: false, duration: 5000 });
      window.open(buildThemeEditorUrl(), '_blank');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      AppLogger.error('🚨 [THEME_EDITOR] Error in handlePageSelection:', { errorMessage }, error as any);
      shopify.toast.show(`Failed to open Theme Editor: ${errorMessage}`, { isError: true, duration: 5000 });
    }
  }, [shop, shopify, bundle.id, apiKey, upsellWidgetDisplayMode]);

  return (
    <>
      <div className={fullPageBundleStyles.editCanvas}>
      {/* Modern App Bridge SaveBar with declarative React state management */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        onReset={(e) => {
          e.preventDefault();
          setShowDiscardModal(true);
        }}
      >
        {/* SaveBar component - visibility controlled declaratively via 'open' prop */}
        {/* Loading state properly shows spinner during save operation */}
        <SaveBar
          id="bundle-save-bar"
          open={isDirty}
        >
          <button
            type="submit"
            variant="primary"
            loading={fetcher.state !== "idle" ? "" : undefined}
            disabled={fetcher.state !== "idle"}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            disabled={fetcher.state !== "idle"}
          >
            Discard
          </button>
        </SaveBar>

        {/* Hidden inputs for form submission - values will be updated by React state changes */}
        <input type="hidden" name="bundleName" value={formState.bundleName} />
        <input type="hidden" name="bundleDescription" value={formState.bundleDescription} />
        <input type="hidden" name="templateName" value={formState.templateName} />
        <input type="hidden" name="bundleStatus" value={formState.bundleStatus} />
        <input type="hidden" name="bundleProduct" value={JSON.stringify(bundleProduct)} />
        <input type="hidden" name="stepsData" value={JSON.stringify(stepsState.steps)} />
        <input type="hidden" name="discountData" value={JSON.stringify({
          discountEnabled: pricingState.discountEnabled,
          discountType: pricingState.discountType,
          discountRules: pricingState.discountRules,
          showFooter: pricingState.showFooter,
          showDiscountProgressBar: pricingState.showDiscountProgressBar,
          discountMessagingEnabled: pricingState.discountMessagingEnabled,
          ruleMessages: normalizedRuleMessages,
          pricingDisplayOptions: serializePricingDisplayOptions({
            existingMessages: {
              showDiscountMessaging: pricingState.discountMessagingEnabled,
              ruleMessages: normalizedRuleMessages,
            },
            options: normalizedPricingDisplayOptions,
          }).displayOptions,
          discountMessagingMultiLanguageEnabled,
          ruleMessagesByLocale: discountMessagingMultiLanguageEnabled ? ruleMessagesByLocale : null,
          tierTextByRuleId: Object.keys(tierTextByRuleId).length > 0 ? tierTextByRuleId : null,
          tierTextByLocaleByRuleId: Object.keys(tierTextByLocaleByRuleId).length > 0 ? tierTextByLocaleByRuleId : null,
        })} />
        <input type="hidden" name="stepConditions" value={JSON.stringify(conditionsState.stepConditions)} />
      </form>

        <div className={fullPageBundleStyles.canvasHeader}>
          <div className={fullPageBundleStyles.canvasTitleGroup}>
            <div className={fullPageBundleStyles.canvasTitleRow}>
              <button
                type="button"
                className={fullPageBundleStyles.canvasBackButton}
                onClick={handleBackClick}
                aria-label="Back to dashboard"
              >
                ←
              </button>
              <h1 className={fullPageBundleStyles.canvasTitle}>Configure Bundle Flow</h1>
            </div>
          </div>
          <div className={fullPageBundleStyles.canvasActions}>
            <button
              type="button"
              className={`${fullPageBundleStyles.readinessButton} ${readinessClassName}`}
              onClick={() => setReadinessOpen(true)}
            >
              <span className={fullPageBundleStyles.readinessScore}>{readinessScore}</span>
              <span className={fullPageBundleStyles.readinessLabel}>Readiness Score</span>
            </button>
            <s-button
              variant="secondary"
              icon="view"
              onClick={() => { void handlePreviewBundle(); }}
              disabled={fetcher.state !== "idle"}
            >
              Preview Bundle
            </s-button>
          </div>
        </div>

        {!suppressTopAppEmbedBannerForVisibility && (
          <AppEmbedBanner appEmbedEnabled={appEmbedEnabled} themeEditorUrl={themeEditorUrl} />
        )}

        {!parentProductActive && (
          <UnlistedBundleBanner
            shop={shop}
            bundleProductId={bundleProduct?.id ?? bundle.shopifyProductId ?? null}
          />
        )}

        <div className={fullPageBundleStyles.editGrid}>

          {/* Left Sidebar */}
          <div className={fullPageBundleStyles.leftColumn}>
            <s-stack direction="block" gap="base">
              <s-section>
                <s-stack direction="block" gap="small">
                  <div className={fullPageBundleStyles.leftCardHeader}>
                    <h3 className={fullPageBundleStyles.leftCardTitle}>
                      Bundle Product
                    </h3>
                    <div className={fullPageBundleStyles.productMenuWrapper}>
                      <button
                        type="button"
                        className={fullPageBundleStyles.productMenuBtn}
                        aria-label="Bundle product options"
                        onClick={() => setProductMenuOpen((o) => !o)}
                      >
                        <s-icon type="menu-vertical" />
                      </button>
                      {productMenuOpen && (
                        <>
                          <div className={fullPageBundleStyles.productMenuBackdrop} onClick={() => setProductMenuOpen(false)} />
                          <div className={fullPageBundleStyles.productMenuDropdown}>
                            <button
                              type="button"
                              className={fullPageBundleStyles.productMenuDropdownItem}
                              onClick={() => { setProductMenuOpen(false); void handleBundleProductSelect(); }}
                            >
                              <s-icon type="edit" />
                              <span>Replace Product</span>
                            </button>
                            <button
                              type="button"
                              className={fullPageBundleStyles.productMenuDropdownItem}
                              onClick={() => { setProductMenuOpen(false); handleSyncProduct(); }}
                            >
                              <s-icon type="duplicate" />
                              <span>Sync Product</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={fullPageBundleStyles.bundleProductPanel}>
                    <div className={fullPageBundleStyles.bundleProductSummary}>
                      <div className={fullPageBundleStyles.bundleProductIconTile}>
                        {productImageUrl ? (
                          <img
                            src={productImageUrl}
                            alt=""
                            className={fullPageBundleStyles.bundleProductIconImage}
                          />
                        ) : (
                          <s-icon type="product" />
                        )}
                      </div>
                      <span className={fullPageBundleStyles.bundleProductName}>
                        {productTitle || bundleProduct?.title || formState.bundleName || "Bundle Product"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={fullPageBundleStyles.bundleProductEditButton}
                      onClick={() => {
                        const productId = bundleProduct?.legacyResourceId || bundleProduct?.id?.split('/').pop() || bundle.shopifyProductId?.split('/').pop();
                        if (!productId) {
                          void handleBundleProductSelect();
                          return;
                        }
                        openProductInAdmin(productId);
                      }}
                    >
                      <s-icon type="edit" />
                      <span>Edit Product</span>
                    </button>
                  </div>

                  <div className={fullPageBundleStyles.parentProductStatus}>
                    <span>Parent Product Status</span>
                    <s-badge tone={String(productStatus).toLowerCase() === "active" ? "success" : "warning"}>
                      {String(productStatus || "Unlisted").toLowerCase() === "active" ? "Active" : "Unlisted"}
                    </s-badge>
                  </div>
                </s-stack>
              </s-section>

              <s-section>
                <s-stack direction="block" gap="small">
                  <h3 className={fullPageBundleStyles.leftCardTitle}>
                    Bundle Setup
                  </h3>
                  <p className={fullPageBundleStyles.leftCardSubtitle}>
                    Set-up your bundle builder
                  </p>

                  <div className={fullPageBundleStyles.setupNavList}>
                    {bundleSetupItems
                      .filter(item => !item.fullPageOnly || bundle.bundleType === "full_page")
                      .map((item) => {
                        const isActive = activeSection === item.id || (item.id === "step_setup" && (activeSection === "free_gift_addons" || activeSection === "messages")) || (item.id === "bundle_visibility" && activeSection === "bundle_widget");
                        let statusBadge: { label: string; tone?: string } | null = null;
                        if (item.id === 'discount_pricing') {
                          statusBadge = pricingState.discountEnabled ? null : { label: 'None' };
                        }
                        if (item.id === 'bundle_visibility') {
                          statusBadge = bundle.shopifyPageHandle ? { label: 'Complete', tone: 'success' } : { label: 'Pending', tone: 'warning' };
                        }
                        return (
                          <div key={item.id}>
                            {item.id === "select_template" && (
                              <hr style={{ margin: "8px 0", border: "none", borderTop: "1px solid #e1e3e5" }} />
                            )}
                            <button
                              type="button"
                              className={`${fullPageBundleStyles.setupNavItem} ${isActive ? fullPageBundleStyles.setupNavItemActive : ""}`}
                              onClick={() => { if (item.id === "select_template") { openSelectTemplateModal(); } else { handleSectionChange(item.id); } }}
                              ref={item.id === "select_template" ? selectTemplateOpenButtonRef : undefined}
                            >
                              <span className={fullPageBundleStyles.setupNavIcon} aria-hidden="true">
                                {item.iconType
                                  ? <s-icon type={item.iconType as any} />
                                  : (isActive ? "●" : "○")}
                              </span>
                              <span className={fullPageBundleStyles.setupNavLabel}>{item.label}</span>
                              <span className={fullPageBundleStyles.setupNavMeta}>
                                {statusBadge && !isActive && (
                                  statusBadge.label === 'Pending'
                                    ? <InfoIcon tooltipKey="bundleVisibilityPending" />
                                    : <s-badge tone={statusBadge.tone as any || "subdued"}>{statusBadge.label}</s-badge>
                                )}
                              </span>
                            </button>
                            {item.id === "step_setup" && (activeSection === "step_setup" || activeSection === "free_gift_addons" || activeSection === "messages") && (
                              <div className={fullPageBundleStyles.subNav}>
                                {stepSetupChildItems.map((child) => (
                                  <button
                                    key={child.id}
                                    type="button"
                                    className={`${fullPageBundleStyles.subNavItem} ${activeSection === child.id ? fullPageBundleStyles.subNavItemActive : ""}`}
                                    onClick={() => {
                                      if (child.id === "free_gift_addons") handleSectionChange("free_gift_addons");
                                      if (child.id === "messages") handleSectionChange("messages");
                                    }}
                                  >
                                    {child.label}
                                  </button>
                                ))}
                              </div>
                            )}
                            {item.id === "bundle_visibility" && (activeSection === "bundle_visibility" || activeSection === "bundle_widget") && (
                              <div className={fullPageBundleStyles.subNav}>
                                {bundleVisibilityChildItems.map((child) => (
                                  <button
                                    key={child.id}
                                    type="button"
                                    className={`${fullPageBundleStyles.subNavItem} ${activeSection === child.id ? fullPageBundleStyles.subNavItemActive : ""}`}
                                    onClick={() => handleSectionChange(child.id)}
                                  >
                                    {child.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </s-stack>
              </s-section>

            </s-stack>
          </div>

          {/* Main Content Area */}
          <div className={fullPageBundleStyles.mainColumn}>
            {activeSection === "step_setup" && (
              <div data-tour-target="fpb-step-setup">
                <div className={`${fullPageBundleStyles.card} ${fullPageBundleStyles.stepFlowCard}`}>
                  <s-stack direction="block" gap="small">
                    <div className={fullPageBundleStyles.stepFlowTitleRow}>
                      <span className={fullPageBundleStyles.headingWithHelp}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Step Flow</h3>
                        <QuestionHelpTooltip tooltipKey="stepFlow" />
                      </span>
                      <button
                        type="button"
                        className={fullPageBundleStyles.linkButton}
                        onClick={() => window.open("https://wolfpackapps.com", "_blank")}
                      >
                        How to setup?
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                      Create steps for your multi-step bundle here. Select product options for each step below
                    </p>
                  </s-stack>

                  {/* Step Chip Navigation */}
                  <div className={fullPageBundleStyles.stepNav}>
                    {stepsState.steps.map((step, i) => (
                      <button
                        key={step.id}
                        className={activeTabIndex === i ? fullPageBundleStyles.stepChipActive : fullPageBundleStyles.stepChip}
                        onClick={() => navigateToStep(i)}
                      >
                        <span className={fullPageBundleStyles.stepChipNumber}>{i + 1}</span>
                        <span className={fullPageBundleStyles.stepChipLabel}>{step.name || `Step ${i + 1}`}</span>
                        <span className={fullPageBundleStyles.stepChipChevron}>›</span>
                      </button>
                    ))}
                    <button className={fullPageBundleStyles.addStepBtn} onClick={handleAddNewStep}>
                      <span aria-hidden="true">+</span>
                      <span>Add Step</span>
                    </button>
                  </div>
                </div>

                {/* Animated per-step content */}
                {stepsState.steps.map((step, index) => activeTabIndex === index && (
                  <div
                    key={`${step.id}-${slideKey}`}
                    className={slideDir === "forward" ? fullPageBundleStyles.slideForward : slideDir === "backward" ? fullPageBundleStyles.slideBackward : ""}
                  >
                    {/* Step Setup card */}
                    <div className={fullPageBundleStyles.card}>
                      <div className={fullPageBundleStyles.stepSetupHeader}>
                        <div className={fullPageBundleStyles.stepSetupTitleGroup}>
                          <h3 className={fullPageBundleStyles.stepSetupTitle}>Step Setup</h3>
                          <s-switch
                            accessibilityLabel="Enable step"
                            checked={step.enabled !== false || undefined}
                            onChange={(e: Event) => {
                              stepsState.updateStepField(step.id, "enabled", (e.target as HTMLInputElement).checked);
                              markAsDirty();
                            }}
                          />
                        </div>
                        <div className={fullPageBundleStyles.stepSetupActions}>
                          <s-button
                            variant="plain"
                            icon="globe"
                            accessibilityLabel="Multi Language"
                            title="Multi Language"
                            onClick={() => openStepMultiLanguageModal(step.id)}
                          />
                          <s-button
                            variant="plain"
                            icon="duplicate"
                            accessibilityLabel="Clone current step"
                            title="Clone current step"
                            onClick={() => cloneStep(step.id)}
                          />
                          <s-button
                            variant="plain"
                            icon="delete"
                            tone="critical"
                            accessibilityLabel="Delete current step"
                            title="Delete current step"
                            onClick={() => deleteStep(step.id)}
                          />
                        </div>
                      </div>
                      <p className={fullPageBundleStyles.stepSetupDescription}>
                        Edit your step name (Only visible if more than one step is present)
                      </p>
                      <s-stack direction="block" gap="small">
                        <s-text-field
                          label="Step Name"
                          placeholder="Eg:- Add product"
                          value={step.name ?? ""}
                          onInput={(e: Event) => {
                            stepsState.updateStepField(step.id, 'name', (e.target as HTMLInputElement).value);
                            markAsDirty();
                          }}
                          autoComplete="off"
                        />
                      </s-stack>
                    </div>

                    {/* ── Category card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Category</h3>
                        <QuestionHelpTooltip tooltipKey="category" />
                      </div>
                      <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6d7175" }}>
                        Add all product selections in this step to a single category or separate them into multiple categories for better segregation.
                      </p>

                      {(((step.StepCategory as any[] | undefined) ?? []).length === 0) && (
                        <div className={fullPageBundleStyles.emptyState}>No category defined yet</div>
                      )}

                      {/* Per-category accordion rows collapsed by default */}
                      {((step.StepCategory as any[] | undefined) ?? []).map((cat: any, catIndex: number) => {
                        const catKey = `${step.id}__${cat.id ?? catIndex}`;
                        const catActiveTab = categoryActiveTabs[catKey] ?? 0;
                        const catProducts = (cat.products as any[]) ?? [];
                        const catCollections = (cat.collections as any[]) ?? [];
                        const isOpen = categoryOpen[catKey] ?? false;
                        return (
                          <div
                            key={cat.id ?? catIndex}
                            data-cat-key={catKey}
                            className={`${fullPageBundleStyles.categoryAccordion}${dragOverCatKey === catKey ? ` ${fullPageBundleStyles.categoryDragOver}` : ''}`}
                            onDragOver={(e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (draggedCatKey && draggedCatKey !== catKey) setDragOverCatKey(catKey); }}
                            onDragLeave={(e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCatKey(null); }}
                            onDrop={(e: React.DragEvent) => handleCatDrop(e, step.id, catKey)}
                          >
                            {/* Header — click anywhere to toggle; action buttons stop propagation */}
                            <div
                              className={fullPageBundleStyles.categoryAccordionHeader}
                              role="button"
                              aria-expanded={isOpen}
                              tabIndex={0}
                              onClick={() => setCategoryOpen(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
                              onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setCategoryOpen(prev => ({ ...prev, [catKey]: !prev[catKey] }));
                                }
                              }}
                            >
                              <span
                                className={fullPageBundleStyles.categoryDrag}
                                aria-hidden="true"
                                draggable="true"
                                onDragStart={(e: React.DragEvent) => { e.stopPropagation(); handleCatDragStart(e, step.id, catKey); }}
                                onDragEnd={handleCatDragEnd}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >⠿</span>
                              <span className={fullPageBundleStyles.categoryName}>
                                {cat.name || `Category ${catIndex + 1}`}
                              </span>
                              <div
                                className={fullPageBundleStyles.categoryActions}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                <s-button
                                  variant="plain"
                                  icon="duplicate"
                                  accessibilityLabel="Clone category"
                                  onClick={() => {
                                    const cats = (step.StepCategory as any[]) ?? [];
                                    stepsState.updateStepField(step.id, "StepCategory", [
                                      ...cats,
                                      { ...cats[catIndex], id: `cat-${Date.now()}`, name: `${cats[catIndex].name || `Category ${catIndex + 1}`} Copy`, sortOrder: cats.length },
                                    ]);
                                    markAsDirty();
                                  }}
                                />
                                <s-button
                                  variant="plain"
                                  icon="delete"
                                  accessibilityLabel="Delete category"
                                  onClick={() => {
                                    const updated = ((step.StepCategory as any[]) ?? []).filter((_: any, i: number) => i !== catIndex);
                                    stepsState.updateStepField(step.id, "StepCategory", updated);
                                    markAsDirty();
                                  }}
                                />
                                <button
                                  className={fullPageBundleStyles.categoryChevron}
                                  aria-label={isOpen ? "Collapse category" : "Expand category"}
                                  onClick={() => setCategoryOpen(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
                                >
                                  {isOpen ? (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                      <path d="M3 9L7 5L11 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  ) : (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Expandable body — only visible when open */}
                            {isOpen && (
                              <div className={fullPageBundleStyles.categoryAccordionBody}>
                                {/* Category name input and Multi Language control */}
                                <div className={fullPageBundleStyles.catNameRow}>
                                  <input
                                    className={fullPageBundleStyles.categoryNameInput}
                                    type="text"
                                    value={cat.name ?? ""}
                                    placeholder={`Category ${catIndex + 1}`}
                                    aria-label="Category name"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const updated = ((step.StepCategory as any[]) ?? []).map((c: any, i: number) =>
                                        i === catIndex ? { ...c, name: e.target.value } : c
                                      );
                                      stepsState.updateStepField(step.id, "StepCategory", updated);
                                      markAsDirty();
                                    }}
                                  />
                                  <s-button
                                    variant="plain"
                                    icon="globe"
                                    accessibilityLabel="Multi Language"
                                    onClick={() => openStepCategoryMultiLanguageModal(step.id, catIndex)}
                                  >
                                    Multi Language
                                  </s-button>
                                </div>
                                <div className={fullPageBundleStyles.tabRow}>
                                  <button
                                    className={catActiveTab === 0 ? fullPageBundleStyles.tabActive : fullPageBundleStyles.tab}
                                    onClick={() => setCategoryActiveTabs(prev => ({ ...prev, [catKey]: 0 }))}
                                  >
                                    Products
                                    {catProducts.length > 0 && (
                                      <span className={fullPageBundleStyles.tabBadge}>{catProducts.length}</span>
                                    )}
                                  </button>
                                  <button
                                    className={catActiveTab === 1 ? fullPageBundleStyles.tabActive : fullPageBundleStyles.tab}
                                    onClick={() => setCategoryActiveTabs(prev => ({ ...prev, [catKey]: 1 }))}
                                  >
                                    Collections
                                    {catCollections.length > 0 && (
                                      <span className={fullPageBundleStyles.tabBadge}>{catCollections.length}</span>
                                    )}
                                  </button>
                                </div>

                                {catActiveTab === 0 && (
                                  <div>
                                    <div className={fullPageBundleStyles.productActions}>
                                      <s-button
                                        variant="primary"
                                        onClick={async () => {
                                          const picked = await (shopify as any).resourcePicker({
                                            type: "product",
                                            multiple: true,
                                            selectionIds: catProducts.map((p: any) => ({ id: p.id })),
                                          });
                                          if (!picked) return;
                                          const updated = ((step.StepCategory as any[]) ?? []).map((c: any, i: number) =>
                                            i === catIndex ? { ...c, products: picked.map((p: any) => ({
                                              id: p.id,
                                              title: p.title,
                                              imageUrl: p.images?.[0]?.originalSrc || p.images?.[0]?.url || null,
                                              variants: p.variants || null,
                                              minQuantity: 1,
                                              maxQuantity: 10,
                                            })) } : c
                                          );
                                          stepsState.updateStepField(step.id, "StepCategory", updated);
                                          markAsDirty();
                                        }}
                                      >
                                        Add Products
                                      </s-button>
                                      {catProducts.length > 0 && (
                                        <s-badge tone="success">{catProducts.length} Selected</s-badge>
                                      )}
                                    </div>
                                    {catProducts.length > 0 && (
                                      <s-stack direction="block" gap="small-400" style={{ marginTop: 12 }}>
                                        {catProducts.map((product: any) => (
                                          <s-stack key={product.id} direction="inline" gap="small-100">
                                            <img
                                              src={product.imageUrl || "/bundle.png"}
                                              alt={product.title}
                                              style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
                                            />
                                            <span style={{ flex: 1, fontSize: 14 }}>{product.title}</span>
                                            <s-button
                                              variant="plain"
                                              onClick={() => {
                                                const updated = ((step.StepCategory as any[]) ?? []).map((c: any, i: number) =>
                                                  i === catIndex ? { ...c, products: c.products.filter((p: any) => p.id !== product.id) } : c
                                                );
                                                stepsState.updateStepField(step.id, "StepCategory", updated);
                                                markAsDirty();
                                              }}
                                            >
                                              Remove
                                            </s-button>
                                          </s-stack>
                                        ))}
                                      </s-stack>
                                    )}
                                  </div>
                                )}

                                {catActiveTab === 1 && (
                                  <div>
                                    <div className={fullPageBundleStyles.productActions}>
                                      <s-button
                                        variant="primary"
                                        onClick={async () => {
                                          const picked = await (shopify as any).resourcePicker({
                                            type: "collection",
                                            multiple: true,
                                            selectionIds: catCollections.map((c: any) => ({ id: c.id })),
                                          });
                                          if (!picked) return;
                                          const updated = ((step.StepCategory as any[]) ?? []).map((c: any, i: number) =>
                                            i === catIndex ? { ...c, collections: picked.map((col: any) => ({
                                              id: col.id,
                                              handle: col.handle,
                                              title: col.title,
                                            })) } : c
                                          );
                                          stepsState.updateStepField(step.id, "StepCategory", updated);
                                          markAsDirty();
                                        }}
                                      >
                                        Add Collections
                                      </s-button>
                                      {catCollections.length > 0 && (
                                        <s-badge tone="success">{catCollections.length} Selected</s-badge>
                                      )}
                                    </div>
                                    {catCollections.length > 0 && (
                                      <s-stack direction="block" gap="small-400" style={{ marginTop: 12 }}>
                                        {catCollections.map((col: any) => (
                                          <s-stack key={col.id} direction="inline" gap="small-100">
                                            <img
                                              src={col.image?.url || "/bundle.png"}
                                              alt={col.title}
                                              style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
                                            />
                                            <span style={{ flex: 1, fontSize: 14 }}>{col.title}</span>
                                            <s-button
                                              variant="plain"
                                              onClick={() => {
                                                const updated = ((step.StepCategory as any[]) ?? []).map((c: any, i: number) =>
                                                  i === catIndex ? { ...c, collections: c.collections.filter((col2: any) => col2.id !== col.id) } : c
                                                );
                                                stepsState.updateStepField(step.id, "StepCategory", updated);
                                                markAsDirty();
                                              }}
                                            >
                                              Remove
                                            </s-button>
                                          </s-stack>
                                        ))}
                                      </s-stack>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        className={fullPageBundleStyles.addSectionButton}
                        onClick={() => {
                          const cats = (step.StepCategory as any[]) ?? [];
                          stepsState.updateStepField(step.id, "StepCategory", [
                            ...cats,
                            { id: `cat-${Date.now()}`, name: "", sortOrder: cats.length, products: [], collections: [] },
                          ]);
                          markAsDirty();
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        Add Category
                      </button>

                      <s-divider style={{ marginTop: 16, marginBottom: 16 }} />
                      <s-checkbox
                        label="Display variants as individual products"
                        checked={step.displayVariantsAsIndividual ?? undefined}
                        onChange={(e: Event) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          stepsState.updateStepField(step.id, "displayVariantsAsIndividual", checked);
                          markAsDirty();
                        }}
                      />
                    </div>

                    {/* ── Rules Configuration card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Rules Configuration</h3>
                        <QuestionHelpTooltip tooltipKey="rulesConfiguration" />
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 14, color: "#6d7175" }}>
                        Apply rules to the entire step or to specific categories to guide your customer's selections.
                      </p>
                      <button
                        type="button"
                        className={fullPageBundleStyles.linkButton}
                        style={{ marginBottom: 12, display: "inline-block" }}
                        onClick={() => window.open("https://wolfpackapps.com", "_blank")}
                      >
                        Learn More
                      </button>
                      {(() => {
                        const stepCategories = (((step as any).StepCategory as any[] | undefined) ?? []);
                        const categoryRulesAvailable = stepCategories.length > 1;
                        const hasStepRules = (conditionsState.stepConditions[step.id] || []).length > 0;
                        const hasCategoryRules = stepCategories.some((category: any) => (category.conditions || []).length > 0);
                        const activeRuleMode = hasCategoryRules ? "category" : hasStepRules ? "step" : "none";
                        const handleRuleModeChange = (nextMode: string) => {
                          if (nextMode === "none") {
                            conditionsState.clearStepConditions(step.id);
                            clearCategoryConditionRules(step.id);
                            return;
                          }
                          if (nextMode === "step") {
                            clearCategoryConditionRules(step.id);
                            if ((conditionsState.stepConditions[step.id] || []).length === 0) {
                              conditionsState.addConditionRule(step.id);
                            }
                            return;
                          }
                          if (nextMode === "category" && categoryRulesAvailable) {
                            conditionsState.clearStepConditions(step.id);
                            if (!hasCategoryRules) {
                              addCategoryConditionRule(step.id, 0);
                            }
                            return;
                          }
                        };
                        const ruleModeOptions = [
                          { label: "No rules", value: "none" },
                          { label: "Step rules", value: "step" },
                          ...(categoryRulesAvailable ? [{ label: "Category rules", value: "category" }] : []),
                        ];

                        return (
                          <>
                            <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                              {ruleModeOptions.map(opt => (
                                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                                <input
                                  type="radio"
                                  name={`step-rule-mode-${step.id}`}
                                  value={opt.value}
                                  checked={activeRuleMode === opt.value}
                                  onChange={() => handleRuleModeChange(opt.value)}
                                  style={{ margin: 0 }}
                                />
                                {opt.label}
                                </label>
                              ))}
                            </div>

                            {activeRuleMode === "category" ? (
                              <div className={fullPageBundleStyles.categoryRulesList}>
                                {stepCategories.map((cat: any, catIndex: number) => {
                                  const catKey = `${step.id}__${cat.id ?? catIndex}`;
                                  const rules = Array.isArray(cat.conditions) ? cat.conditions : [];
                                  const isRulesOpen = categoryRulesOpen[catKey] ?? catIndex === 0;
                                  const categoryLabel = cat.name || cat.title || `Category ${catIndex + 1}`;

                                  return (
                                    <div key={cat.id ?? catIndex} className={fullPageBundleStyles.categoryRuleAccordion}>
                                      <button
                                        type="button"
                                        className={fullPageBundleStyles.categoryRuleHeader}
                                        aria-expanded={isRulesOpen}
                                        onClick={() => setCategoryRulesOpen(prev => ({ ...prev, [catKey]: !isRulesOpen }))}
                                      >
                                        <span>{categoryLabel} rules</span>
                                        <span aria-hidden="true">{isRulesOpen ? "⌃" : "⌄"}</span>
                                      </button>

                                      {isRulesOpen && (
                                        <div className={fullPageBundleStyles.categoryRuleBody}>
                                          <p className={fullPageBundleStyles.categoryRuleHelp}>
                                            Create Rules based on amount or quantity of products added on this category.
                                            <br />
                                            Note: Rules are only valid on this category
                                          </p>

                                          <div className={fullPageBundleStyles.rulesList}>
                                            {rules.map((rule: any, ruleIndex: number) => {
                                              const ruleId = String(rule.id ?? ruleIndex);
                                              return (
                                                <div key={ruleId} className={fullPageBundleStyles.categoryRuleBlock}>
                                                  <div className={fullPageBundleStyles.ruleHeader}>
                                                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Rule #{ruleIndex + 1}</h4>
                                                    <s-button
                                                      variant="plain"
                                                      tone="critical"
                                                      onClick={() => removeCategoryConditionRule(step.id, catIndex, ruleId)}
                                                    >
                                                      Remove
                                                    </s-button>
                                                  </div>
                                                  <div className={fullPageBundleStyles.ruleFields}>
                                                    <s-select
                                                      label="Type"
                                                      value={rule.type ?? "quantity"}
                                                      onChange={(e: Event) => updateCategoryConditionRule(step.id, catIndex, ruleId, "type", (e.target as HTMLSelectElement).value)}
                                                    >
                                                      {[...STEP_CONDITION_TYPE_OPTIONS].map(opt => (
                                                        <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                                      ))}
                                                    </s-select>
                                                    <s-select
                                                      label="Condition"
                                                      value={rule.condition ?? rule.operator ?? "greaterThanOrEqualTo"}
                                                      onChange={(e: Event) => updateCategoryConditionRule(step.id, catIndex, ruleId, "condition", (e.target as HTMLSelectElement).value)}
                                                    >
                                                      {[...CATEGORY_CONDITION_OPERATOR_OPTIONS].map(opt => (
                                                        <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                                      ))}
                                                    </s-select>
                                                    <s-number-field
                                                      label="Value"
                                                      min={0}
                                                      value={rule.value ?? ""}
                                                      onInput={(e: Event) => updateCategoryConditionRule(step.id, catIndex, ruleId, "value", (e.target as HTMLInputElement).value)}
                                                      autoComplete="off"
                                                    />
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>

                                          {rules.length === 1 && (
                                            <s-checkbox
                                              label="Auto Next When rule is met"
                                              checked={cat.autoNextStepOnConditionMet === true || undefined}
                                              onChange={(e: Event) => updateCategoryAutoNextRule(step.id, catIndex, (e.target as HTMLInputElement).checked)}
                                            />
                                          )}

                                          <button
                                            type="button"
                                            className={fullPageBundleStyles.addSectionButton}
                                            onClick={() => addCategoryConditionRule(step.id, catIndex)}
                                          >
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            </svg>
                                            Add Rule
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <>
                                {(conditionsState.stepConditions[step.id] || []).length === 0 ? (
                                  <div className={fullPageBundleStyles.emptyState}>No rules defined yet</div>
                                ) : (
                                  <div className={fullPageBundleStyles.rulesList}>
                                    {(conditionsState.stepConditions[step.id] || []).map((rule: any, ruleIndex: number) => (
                                      <div key={rule.id} className={fullPageBundleStyles.ruleCard}>
                                        <div className={fullPageBundleStyles.ruleHeader}>
                                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Rule #{ruleIndex + 1}</h4>
                                          <s-button
                                            variant="plain"
                                            tone="critical"
                                            onClick={() => conditionsState.removeConditionRule(step.id, rule.id)}
                                          >
                                            Remove
                                          </s-button>
                                        </div>
                                        <div className={fullPageBundleStyles.ruleFields}>
                                          <s-select
                                            label="Type"
                                            value={rule.type}
                                            onChange={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'type', (e.target as HTMLSelectElement).value)}
                                          >
                                            <s-option value="" disabled>Type</s-option>
                                            {[...STEP_CONDITION_TYPE_OPTIONS].map(opt => (
                                              <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                            ))}
                                          </s-select>
                                          <s-select
                                            label="Operator"
                                            value={rule.operator}
                                            onChange={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'operator', (e.target as HTMLSelectElement).value)}
                                          >
                                            <s-option value="" disabled>Operator</s-option>
                                            {[...STEP_CONDITION_OPERATOR_OPTIONS].map(opt => (
                                              <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                            ))}
                                          </s-select>
                                          <s-number-field
                                            label="Value"
                                            min={0}
                                            placeholder="0"
                                            value={rule.value ?? ""}
                                            onInput={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'value', (e.target as HTMLInputElement).value)}
                                            autoComplete="off"
                                          />
                                        </div>
                                        {(conditionsState.stepConditions[step.id] || []).length === 1 && (
                                          <s-checkbox
                                            label="Auto Next When rule is met"
                                            checked={rule.autoNext === true || rule.autoNext === "true" || undefined}
                                            onChange={(e: Event) => {
                                              conditionsState.updateConditionRule(step.id, rule.id, "autoNext", (e.target as HTMLInputElement).checked ? "true" : "false");
                                            }}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className={fullPageBundleStyles.addSectionButton}
                                  onClick={() => {
                                    if ((conditionsState.stepConditions[step.id] || []).length >= 2) {
                                      shopify.toast.show('A step can have at most 2 rules', { isError: false });
                                      return;
                                    }
                                    conditionsState.addConditionRule(step.id);
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                  </svg>
                                  Add Rule
                                </button>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* ── Step Config card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 650, color: "#202223", letterSpacing: 0 }}>Step Config</h3>
                      <div className={fullPageBundleStyles.stepConfigRow}>
                        <div className={fullPageBundleStyles.iconColumn}>
                          <div className={fullPageBundleStyles.iconBox}>
                            {(step as any).stepImage ? (
                              <img
                                src={(step as any).stepImage}
                                alt="Step icon"
                                className={fullPageBundleStyles.iconImg}
                              />
                            ) : (
                              <div className={fullPageBundleStyles.iconPlaceholder}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                                  <path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 5l-8 4-8-4" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {showIconPickerForStep === step.id && (
                            <FilePicker
                              autoOpen
                              onClose={() => setShowIconPickerForStep(null)}
                              value={(step as any).stepImage ?? null}
                              onChange={(url: string | null) => {
                                stepsState.updateStepField(step.id, 'stepImage', url);
                                setShowIconPickerForStep(null);
                                markAsDirty();
                              }}
                              label=""
                              hideCropEditor
                            />
                          )}
                          <s-button
                            onClick={() => setShowIconPickerForStep(prev => prev === step.id ? null : step.id)}
                          >
                            {(step as any).stepImage ? "Replace" : "Upload"}
                          </s-button>
                        </div>
                        <div className={fullPageBundleStyles.fieldsColumn}>
                          <s-text-field
                            label="Step Title"
                            placeholder="Eg:- Customized T-shirt Bundle for you"
                            value={(step as any).pageTitle ?? ""}
                            onInput={(e: Event) => {
                              stepsState.updateStepField(step.id, 'pageTitle', (e.target as HTMLInputElement).value);
                              markAsDirty();
                            }}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {activeSection === "free_gift_addons" && (() => {
              const savedAddonMessages = (bundle as any).personalizationData?.addonProducts?.addonsMessaging?.tier1 || {};
              const addonMessages = ruleMessages[ADDON_MESSAGE_KEY] || {
                discountText: savedAddonMessages.ineligibleState || "",
                successMessage: savedAddonMessages.eligibleState || "",
              };

              return (
                <div data-tour-target="fpb-free-gift-addons">
                  <s-stack direction="block" gap="base">
                    <div className={fullPageBundleStyles.card}>
                      <div className={fullPageBundleStyles.panelHeader}>
                        <h3 className={fullPageBundleStyles.panelTitle}>Add-Ons and Gifting Step</h3>
                        <s-checkbox
                          accessibilityLabel="Enable add-ons and gifting step"
                          checked={addonDraft.isPersonalizationEnabled || undefined}
                          onChange={(e: Event) => {
                            const checked = (e.target as HTMLInputElement).checked;
                            updateAddonDraft({ isPersonalizationEnabled: checked });
                          }}
                        />
                      </div>
                      <div style={{ marginTop: 16 }} className={fullPageBundleStyles.mediaFieldGrid}>
                        <div className={fullPageBundleStyles.iconColumn}>
                          <div className={fullPageBundleStyles.iconBox}>
                            {addonDraft.stepImage ? (
                              <img src={addonDraft.stepImage} alt="Add-ons step icon" className={fullPageBundleStyles.iconImg} />
                            ) : (
                              <div className={fullPageBundleStyles.iconPlaceholder}>Upload file</div>
                            )}
                          </div>
                          {showIconPickerForStep === "addon-direct" && (
                            <FilePicker
                              value={addonDraft.stepImage ?? null}
                              onChange={(url: string | null) => {
                                updateAddonDraft({ stepImage: url });
                                setShowIconPickerForStep(null);
                              }}
                              label=""
                              hideCropEditor
                            />
                          )}
                          <s-button
                            variant="secondary"
                            icon="upload"
                            onClick={() => setShowIconPickerForStep(prev => prev === "addon-direct" ? null : "addon-direct")}
                          >
                            {showIconPickerForStep === "addon-direct" ? "Close picker" : "Replace"}
                          </s-button>
                        </div>
                        <s-stack direction="block" gap="small">
                          <s-button variant="secondary" icon="globe" disabled>
                            Multi Language
                          </s-button>
                          <s-text-field
                            label="Step Name"
                            value={addonDraft.personalizeStepText ?? ""}
                            placeholder="Add On"
                            onInput={(e: Event) => {
                              const value = (e.target as HTMLInputElement).value;
                              updateAddonDraft({ personalizeStepText: value });
                            }}
                            autoComplete="off"
                          />
                          <s-text-field
                            label="Step Title"
                            value={addonDraft.personalizePageSubtext ?? ""}
                            onInput={(e: Event) => {
                              updateAddonDraft({ personalizePageSubtext: (e.target as HTMLInputElement).value });
                            }}
                            autoComplete="off"
                          />
                        </s-stack>
                      </div>
                    </div>

                    <div className={`${fullPageBundleStyles.card} ${fullPageBundleStyles.addonsCard}`}>
                      <div className={fullPageBundleStyles.addonsHeaderLine}>
                        <div className={fullPageBundleStyles.addonsTitleCluster}>
                          <h3 className={fullPageBundleStyles.panelTitle}>Add-Ons with Bundles</h3>
                          <label className={fullPageBundleStyles.addonsSwitch}>
                            <input
                              type="checkbox"
                              aria-label="Enable add-ons with bundles"
                              checked={addonDraft.addonProductsEnabled === true}
                              onChange={(e: Event) => {
                                updateAddonDraft({ addonProductsEnabled: (e.target as HTMLInputElement).checked });
                              }}
                            />
                            <span />
                          </label>
                          <button
                            type="button"
                            className={fullPageBundleStyles.addonsHelpButton}
                            onClick={() => window.open("https://wolfpackapps.com", "_blank")}
                          >
                            How to setup?
                          </button>
                        </div>
                        <div className={fullPageBundleStyles.addonsHeaderActions}>
                          <button type="button" className={fullPageBundleStyles.addonsLanguageButton} disabled>
                            Multi Language
                          </button>
                        </div>
                      </div>
                      <p className={fullPageBundleStyles.panelDescription}>
                        Enable customers to add extra items to their bundles at a discounted price, for free, or at full price.
                      </p>
                      <div className={fullPageBundleStyles.addonsFormStack}>
                        <s-text-field
                          label="Add on Section title"
                          helpText="Will be visible on the storefront"
                          value={addonDraft.addonProductsTitle ?? ""}
                          onInput={(e: Event) => {
                            updateAddonDraft({ addonProductsTitle: (e.target as HTMLInputElement).value });
                          }}
                          autoComplete="off"
                        />
                        {(() => {
                          const addonTiers: any[] = Array.isArray(addonDraft.addonTiers)
                            ? (addonDraft.addonTiers as any[])
                            : [createDefaultAddonDraftTier()];

                          const updateAddonTiers = (updated: any[]) => {
                            updateAddonDraft({ addonTiers: updated });
                          };
                          const getAddonConditions = (tier: any) =>
                            Array.isArray(tier?.conditions) ? tier.conditions : [];
                          const addAddonTierCondition = (tierIndex: number) => {
                            const updated = addonTiers.map((tier, i) => {
                              if (i !== tierIndex) return tier;
                              const conditions = getAddonConditions(tier);
                              const defaultRule = {
                                ...createDefaultAddonTierCondition(),
                              };
                              return {
                                ...tier,
                                conditions: [...conditions, defaultRule],
                              };
                            });
                            updateAddonTiers(updated);
                          };
                          const removeAddonTierCondition = (tierIndex: number, ruleId: string) => {
                            const updated = addonTiers.map((tier, i) => {
                              if (i !== tierIndex) return tier;
                              const conditions = getAddonConditions(tier);
                              return {
                                ...tier,
                                conditions: conditions.filter((rule: any, idx: number) => String(rule.id ?? idx) !== ruleId),
                              };
                            });
                            updateAddonTiers(updated);
                          };
                          const updateAddonTierCondition = (tierIndex: number, ruleId: string, field: string, value: string) => {
                            const updated = addonTiers.map((tier, i) => {
                              if (i !== tierIndex) return tier;
                              const conditions = getAddonConditions(tier);
                              return {
                                ...tier,
                                conditions: conditions.map((rule: any, idx: number) => (
                                  String(rule.id ?? idx) === ruleId ? { ...rule, [field]: value } : rule
                                )),
                              };
                            });
                            updateAddonTiers(updated);
                          };

                          return (
                            <>
                              {addonTiers.map((tier, idx) => (
                                <div key={idx} className={fullPageBundleStyles.addonsTierCard}>
                                  <div className={fullPageBundleStyles.ruleHeader}>
                                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Tier {idx + 1}</h4>
                                    <s-button
                                      variant="plain"
                                      disabled={addonTiers.length <= 1 || undefined}
                                      onClick={() => {
                                        if (addonTiers.length > 1) {
                                          updateAddonTiers(addonTiers.filter((_, i) => i !== idx));
                                        }
                                      }}
                                    >
                                      Delete
                                    </s-button>
                                  </div>
                                  <s-stack direction="block" gap="small">
                                    <s-text-field
                                      label="Tier title"
                                      value={tier.title ?? `Tier ${idx + 1}`}
                                      onInput={(e: Event) => {
                                        const updated = addonTiers.map((t, i) =>
                                          i === idx ? { ...t, title: (e.target as HTMLInputElement).value } : t
                                        );
                                        updateAddonTiers(updated);
                                      }}
                                      autoComplete="off"
                                    />
                                    <div className={fullPageBundleStyles.addonsProductSelectionRow}>
                                      <s-button
                                        variant="primary"
                                        onClick={async () => {
                                          const currentProducts = Array.isArray(tier.selectedAddonProducts) ? tier.selectedAddonProducts : [];
                                          const picked = await (shopify as any).resourcePicker({
                                            type: "product",
                                            multiple: true,
                                            selectionIds: currentProducts.map((p: any) => ({ id: p.graphqlId || p.id })),
                                          });
                                          const selection = Array.isArray(picked) ? picked : picked?.selection;
                                          if (!selection) return;
                                          const updated = addonTiers.map((t, i) =>
                                            i === idx ? {
                                              ...t,
                                              selectedAddonProducts: selection.map(normalizeAddonPickerProduct),
                                            } : t
                                          );
                                          updateAddonTiers(updated);
                                        }}
                                      >
                                        Add Products
                                      </s-button>
                                      {Array.isArray(tier.selectedAddonProducts) && tier.selectedAddonProducts.length > 0 && (
                                        <span className={fullPageBundleStyles.addonsSelectedCount}>{tier.selectedAddonProducts.length} Selected</span>
                                      )}
                                    </div>
                                    <s-checkbox
                                      label="Display Variants as Individual Products"
                                      checked={tier.displayVariantsAsIndividualProducts_addons === true || undefined}
                                      onChange={(e: Event) => {
                                        const updated = addonTiers.map((t, i) =>
                                          i === idx ? { ...t, displayVariantsAsIndividualProducts_addons: (e.target as HTMLInputElement).checked } : t
                                        );
                                        updateAddonTiers(updated);
                                      }}
                                    />
                                    <div className={fullPageBundleStyles.addonsDiscountGrid}>
                                      <s-select
                                        label="Discount Based on"
                                        value={tier.eligibilityType || tier.eligibilityCondition?.type || "QUANTITY"}
                                        onChange={(e: Event) => {
                                          const updated = addonTiers.map((t, i) =>
                                            i === idx ? { ...t, eligibilityType: (e.target as HTMLSelectElement).value } : t
                                          );
                                          updateAddonTiers(updated);
                                        }}
                                      >
                                        <s-option value="QUANTITY">Bundle Product Quantity</s-option>
                                        <s-option value="AMOUNT">Bundle Value</s-option>
                                      </s-select>
                                      <s-number-field
                                        label={(tier.eligibilityType || tier.eligibilityCondition?.type) === "AMOUNT" ? "Value" : "Qty"}
                                        value={String(tier.eligibilityValue ?? tier.eligibilityCondition?.value ?? 1)}
                                        onInput={(e: Event) => {
                                          const updated = addonTiers.map((t, i) =>
                                            i === idx ? { ...t, eligibilityValue: Number((e.target as HTMLInputElement).value) || 0 } : t
                                          );
                                          updateAddonTiers(updated);
                                        }}
                                        min="0"
                                      />
                                      <s-number-field
                                        label="Discount on Add-ons"
                                        value={String(tier.discountValue ?? tier.discount?.value ?? 0)}
                                        onInput={(e: Event) => {
                                          const updated = addonTiers.map((t, i) =>
                                            i === idx ? { ...t, discountType: "PERCENTAGE", discountValue: Number((e.target as HTMLInputElement).value) || 0 } : t
                                          );
                                          updateAddonTiers(updated);
                                        }}
                                        min="0"
                                        max="100"
                                        suffix="%"
                                      />
                                    </div>
                                    <div className={fullPageBundleStyles.addonsTierRules}>
                                      <h5>Tier Rules</h5>
                                      <p>Create Rules based on quantity of products added on this tier.</p>
                                      <p>Note: Rules are only valid on this tier.</p>
                                      {(getAddonConditions(tier).length === 0) ? (
                                        <div className={fullPageBundleStyles.emptyState}>No rules defined yet</div>
                                      ) : (
                                        <div className={fullPageBundleStyles.rulesList}>
                                          {getAddonConditions(tier).map((rule: any, ruleIndex: number) => (
                                            <div key={rule.id || ruleIndex} className={fullPageBundleStyles.ruleCard}>
                                              <div className={fullPageBundleStyles.ruleHeader}>
                                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Rule #{ruleIndex + 1}</h4>
                                                <s-button
                                                  variant="plain"
                                                  tone="critical"
                                                  onClick={() => removeAddonTierCondition(idx, String(rule.id ?? ruleIndex))}
                                                >
                                                  Remove
                                                </s-button>
                                              </div>
                                              <div className={fullPageBundleStyles.ruleFields}>
                                                <s-select
                                                  label="Type"
                                                  value={rule.type || "quantity"}
                                                  onChange={(e: Event) => updateAddonTierCondition(idx, String(rule.id ?? ruleIndex), "type", (e.target as HTMLSelectElement).value)}
                                                >
                                                  <s-option value="quantity">Quantity</s-option>
                                                  <s-option value="amount">Amount</s-option>
                                                </s-select>
                                                <s-select
                                                  label="Condition"
                                                  value={rule.condition || "greaterThanOrEqualTo"}
                                                  onChange={(e: Event) => updateAddonTierCondition(idx, String(rule.id ?? ruleIndex), "condition", (e.target as HTMLSelectElement).value)}
                                                >
                                                  {[...CATEGORY_CONDITION_OPERATOR_OPTIONS].map(opt => (
                                                    <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                                  ))}
                                                </s-select>
                                                <s-number-field
                                                  label="Value"
                                                  value={rule.value ?? ""}
                                                  onInput={(e: Event) => {
                                                    updateAddonTierCondition(
                                                      idx,
                                                      String(rule.id ?? ruleIndex),
                                                      "value",
                                                      (e.target as HTMLInputElement).value
                                                    );
                                                  }}
                                                  autoComplete="off"
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        className={fullPageBundleStyles.addonsTierRuleButton}
                                        onClick={() => addAddonTierCondition(idx)}
                                      >
                                        Add Tier Rule
                                      </button>
                                    </div>
                                  </s-stack>
                                </div>
                              ))}
                              <button
                                type="button"
                                className={fullPageBundleStyles.addonsTierButton}
                                onClick={() => updateAddonTiers([...addonTiers, {
                                  ...createDefaultAddonDraftTier(addonTiers.length),
                                }])}
                              >
                                Add Add Ons Tier
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className={fullPageBundleStyles.card}>
                      <div className={fullPageBundleStyles.panelHeader}>
                        <h3 className={fullPageBundleStyles.panelTitle}>Footer Messaging</h3>
                        <s-stack direction="inline" gap="small-100">
                          <s-button variant="plain" onClick={() => showPolarisModal(templateVariablesModalRef)}>
                            Show Variables
                          </s-button>
                          <s-button variant="secondary" icon="globe" disabled>
                            Multi Language
                          </s-button>
                        </s-stack>
                      </div>
                      <s-stack direction="block" gap="small" style={{ marginTop: 16 }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Tier 1</h4>
                        <s-text-field
                          label="Message when rule not met"
                          value={addonMessages.discountText}
                          placeholder="Add {{addonsConditionDiff}} more product(s) to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons"
                          onInput={(e: Event) => {
                            const value = (e.target as HTMLInputElement).value;
                            setRuleMessages(prev => ({
                              ...prev,
                              [ADDON_MESSAGE_KEY]: {
                                ...(prev[ADDON_MESSAGE_KEY] || addonMessages),
                                discountText: value,
                              },
                            }));
                          }}
                          autoComplete="off"
                        />
                        <s-text-field
                          label="Success Message"
                          value={addonMessages.successMessage}
                          placeholder="Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons"
                          onInput={(e: Event) => {
                            const value = (e.target as HTMLInputElement).value;
                            setRuleMessages(prev => ({
                              ...prev,
                              [ADDON_MESSAGE_KEY]: {
                                ...(prev[ADDON_MESSAGE_KEY] || addonMessages),
                                successMessage: value,
                              },
                            }));
                          }}
                          autoComplete="off"
                        />
                      </s-stack>
                    </div>
                  </s-stack>
                </div>
              );
            })()}


            {activeSection === "discount_pricing" && (
              <div data-tour-target="fpb-discount-pricing">
              <s-stack direction="block" gap="base">
              <s-section>
                <s-stack direction="block" gap="base">
                  {/* Q1: Header with s-switch */}
                  <s-stack direction="inline" gap="small">
                    <s-stack direction="block" gap="small-400" style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                        Discount &amp; Pricing
                      </h3>
                      <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                        Set up discount rules, applied from lowest to highest.
                      </p>
                    </s-stack>
                    <s-switch
                      checked={pricingState.discountEnabled || undefined}
                      onChange={(e: Event) => pricingState.setDiscountEnabled((e.target as HTMLInputElement).checked)}
                    >
                      Enable
                    </s-switch>
                  </s-stack>

                  <s-banner tone="info">
                    Tip: Discounts are calculated based on the products in cart, make sure to add the &quot;Default Product&quot; quantity or amount while configuring discounts.
                  </s-banner>

                  {/* Q2: Discount Type — always visible, grayed when disabled */}
                  <div style={{ opacity: pricingState.discountEnabled ? 1 : 0.45, pointerEvents: pricingState.discountEnabled ? 'auto' : 'none' }}>
                    <s-select
                      label="Discount Type"
                      value={pricingState.discountType}
                      onChange={(e: Event) => {
                        const nextDiscountType = (e.target as HTMLSelectElement).value as DiscountMethod;
                        const nextRule = createNewPricingRule(nextDiscountType);
                        pricingState.setDiscountType(nextDiscountType);
                        pricingState.setDiscountRules([nextRule]);
                        setRuleMessages({});
                        setRuleMessagesByLocale({});
                        setGlobalSuccessMessage("");
                        setSuccessMessageByLocale({});
                      }}
                    >
                      {[...DISCOUNT_METHOD_OPTIONS].map(opt => (
                        <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                      ))}
                    </s-select>
                  </div>

                  {/* Q2: Discount Rules — always visible, grayed when disabled */}
                  <div style={{ opacity: pricingState.discountEnabled ? 1 : 0.45, pointerEvents: pricingState.discountEnabled ? 'auto' : 'none' }}>
                    <s-stack direction="block" gap="small">
                      {pricingState.discountRules.map((rule, index) => (
                        <s-section key={rule.id} className={fullPageBundleStyles.discountRuleCard}>
                          <s-stack direction="block" gap="small">
                            <div className={fullPageBundleStyles.discountRuleHeader}>
                              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                                Rule #{index + 1}
                              </h4>
                              <s-button
                                variant="plain"
                                tone="critical"
                                onClick={() => pricingState.removeDiscountRule(rule.id)}
                              >
                                Remove
                              </s-button>
                            </div>

                            {pricingState.discountType === DiscountMethod.BUY_X_GET_Y ? (
                              <div className={fullPageBundleStyles.bxyRuleBody}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Customer buys</p>
                                <s-number-field
                                  label="Minimum quantity of items"
                                  value={String(rule.customerBuys ?? 2)}
                                  onInput={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                    customerBuys: Math.max(1, Number((e.target as HTMLInputElement).value) || 1)
                                  })}
                                  min="1"
                                />
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Customer gets</p>
                                <s-number-field
                                  label="Quantity"
                                  helpText="Customer must add the quantity of items specified above to their cart"
                                  value={String(rule.customerGets ?? 1)}
                                  onInput={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                    customerGets: Math.max(1, Number((e.target as HTMLInputElement).value) || 1)
                                  })}
                                  min="1"
                                />
                                <div className={fullPageBundleStyles.bxyRewardGrid}>
                                  <s-number-field
                                    label="Discount value"
                                    value={String(rule.discountValue ?? 0)}
                                    onInput={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                      discountValue: (() => {
                                        const nextValue = Number((e.target as HTMLInputElement).value) || 0;
                                        return (rule.bxyDiscountType ?? 'percentage') === 'percentage'
                                          ? Math.min(100, Math.max(0, nextValue))
                                          : Math.max(0, nextValue);
                                      })()
                                    })}
                                    min="0"
                                    suffix={(rule.bxyDiscountType ?? "percentage") === "percentage" ? "%" : undefined}
                                    prefix={(rule.bxyDiscountType ?? "percentage") === "fixed_amount" ? "₹" : undefined}
                                    max={(rule.bxyDiscountType ?? "percentage") === "percentage" ? "100" : undefined}
                                  />
                                  <s-select
                                    label="Discount type"
                                    value={rule.bxyDiscountType ?? 'percentage'}
                                    onChange={(e: Event) => {
                                      const bxyDiscountType = (e.target as HTMLSelectElement).value as 'percentage' | 'fixed_amount';
                                      const currentValue = Number(rule.discountValue ?? 0) || 0;
                                      pricingState.updateDiscountRule(rule.id, {
                                        bxyDiscountType,
                                        discountValue: bxyDiscountType === 'percentage'
                                          ? Math.min(100, Math.max(0, currentValue))
                                          : Math.max(0, currentValue),
                                      });
                                    }}
                                  >
                                    <s-option value="percentage">% off</s-option>
                                    <s-option value="fixed_amount">₹ off</s-option>
                                  </s-select>
                                  <s-select
                                    label="Apply Discount to"
                                    value={rule.bxyApplyMode ?? 'lowest_priced'}
                                    onChange={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                      bxyApplyMode: (e.target as HTMLSelectElement).value as 'lowest_priced' | 'latest_added'
                                    })}
                                  >
                                    <s-option value="lowest_priced">The lowest priced items</s-option>
                                    <s-option value="latest_added">The latest added items</s-option>
                                  </s-select>
                                </div>
                              </div>
                            ) : (
                              <s-stack direction="block" gap="small-100">
                                {pricingState.discountType === DiscountMethod.FIXED_BUNDLE_PRICE ? (
                                  <div className={fullPageBundleStyles.discountFieldsRowPair}>
                                    <s-number-field
                                      label="Number of Products in Bundle"
                                      value={String(rule.conditionValue ?? 0)}
                                      onInput={(e: Event) => pricingState.updateDiscountRule(rule.id, { conditionValue: Number((e.target as HTMLInputElement).value) || 0 })}
                                      min="0"
                                    />
                                    <s-number-field
                                      label="Price"
                                      value={String(centsToAmount(rule.discountValue))}
                                      onInput={(e: Event) => pricingState.updateDiscountRule(rule.id, { discountValue: amountToCents(Number((e.target as HTMLInputElement).value) || 0) })}
                                      min="0"
                                      prefix="₹"
                                    />
                                  </div>
                                ) : (
                                  <div className={fullPageBundleStyles.discountFieldsRow}>
                                    <s-select
                                      label="Discount on"
                                      value={rule.conditionType ?? 'quantity'}
                                      onChange={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                        conditionType: (e.target as HTMLSelectElement).value as 'quantity' | 'amount'
                                      })}
                                    >
                                      <s-option value="quantity">Quantity</s-option>
                                      <s-option value="amount">Amount</s-option>
                                    </s-select>
                                    <s-number-field
                                      label="is greater than or equal to"
                                      value={String(rule.conditionType === 'amount' ? centsToAmount(rule.conditionValue) : rule.conditionValue)}
                                      onInput={(e: Event) => {
                                        const numValue = Number((e.target as HTMLInputElement).value) || 0;
                                        const finalValue = rule.conditionType === 'amount' ? amountToCents(numValue) : numValue;
                                        pricingState.updateDiscountRule(rule.id, { conditionValue: finalValue });
                                      }}
                                      min="0"
                                      prefix={rule.conditionType === 'amount' ? "₹" : undefined}
                                    />
                                    <s-number-field
                                      label={pricingState.discountType === DiscountMethod.PERCENTAGE_OFF ? "Percentage Off" : "Fixed Amount Off"}
                                      value={String(pricingState.discountType === DiscountMethod.PERCENTAGE_OFF ? rule.discountValue : centsToAmount(rule.discountValue))}
                                      onInput={(e: Event) => {
                                        const numValue = Number((e.target as HTMLInputElement).value) || 0;
                                        const finalValue = pricingState.discountType === DiscountMethod.PERCENTAGE_OFF
                                          ? numValue
                                          : amountToCents(Math.max(0, numValue));
                                        const safeValue = pricingState.discountType === DiscountMethod.PERCENTAGE_OFF
                                          ? Math.min(100, Math.max(0, finalValue))
                                          : finalValue;
                                        pricingState.updateDiscountRule(rule.id, {
                                          discountValue: safeValue,
                                        });
                                      }}
                                      min="0"
                                      max={pricingState.discountType === DiscountMethod.PERCENTAGE_OFF ? "100" : undefined}
                                      suffix={pricingState.discountType === DiscountMethod.PERCENTAGE_OFF ? "%" : undefined}
                                      prefix={pricingState.discountType !== DiscountMethod.PERCENTAGE_OFF ? "₹" : undefined}
                                    />
                                  </div>
                                )}
                              </s-stack>
                            )}
                          </s-stack>
                        </s-section>
                      ))}

                      {pricingState.discountRules.length < 4 ? (
                        <s-button
                          variant="secondary"
                          icon="plus"
                          style={{ width: "100%" }}
                          onClick={pricingState.addDiscountRule}
                        >
                          Add rule
                        </s-button>
                      ) : (
                        <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>
                          Maximum 4 discount rules reached
                        </p>
                      )}
                    </s-stack>
                  </div>
                </s-stack>
              </s-section>

              {/* Discount Display Options */}
              <s-section>
                <div className={displayOptionsInactive ? fullPageBundleStyles.displayOptionsInactive : undefined}>
                  <s-stack direction="block" gap="small">
                    <s-stack direction="block" gap="small-400">
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Discount Display Options</h4>
                      <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                        Choose how discounts are displayed
                      </p>
                    </s-stack>
                    {pricingState.discountType !== DiscountMethod.BUY_X_GET_Y && (
                    <div className={fullPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center" style={{ justifyContent: "space-between" }}>
                        <s-stack direction="inline" gap="small" alignItems="center">
                          <div className={fullPageBundleStyles.displayOptionText}>
                            <p className={fullPageBundleStyles.displayOptionTitle}>Bundle Quantity Options</p>
                            <p className={fullPageBundleStyles.displayOptionDescription}>
                              Configure this section to enable quantity options.
                            </p>
                          </div>
                          <s-switch
                            checked={pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled || undefined}
                            disabled={!bundleQuantityOptionsEligible || undefined}
                            onChange={(e: Event) => pricingState.setBundleQuantityOptionsEnabled((e.target as HTMLInputElement).checked)}
                          />
                        </s-stack>
                        <s-button
                          variant="secondary"
                          icon="globe"
                          disabled={!pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled || shopLocales.length === 0 || undefined}
                          onClick={() => setIsBundleQuantityMultiLangModalOpen(true)}
                        >
                          Multi Language
                        </s-button>
                      </s-stack>
                      <p className={fullPageBundleStyles.optionNote}>
                        <strong>Note:</strong> Bundle Quantity Options can only be enabled when discount rules are based on quantity.
                      </p>
                      {pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled && (
                        <div className={fullPageBundleStyles.nestedDisplayOptions}>
                        <s-stack direction="block" gap="small">
                          {normalizedPricingDisplayOptions.bundleQuantityOptions.options.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                              Add quantity-based discount rules to configure bundle quantity options.
                            </p>
                          ) : normalizedPricingDisplayOptions.bundleQuantityOptions.options.map((option, index) => (
                            <s-section key={option.ruleId} className={fullPageBundleStyles.discountRuleCard}>
                              <s-stack direction="block" gap="small-100">
                                <s-stack direction="inline" gap="small" alignItems="center">
                                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 600, flex: 1 }}>
                                    Rule #{index + 1}
                                  </h5>
                                  <s-button
                                    variant="plain"
                                    accessibilityLabel="Make this rule default"
                                    onClick={() => pricingState.setBundleQuantityDefaultRule(option.ruleId)}
                                  >
                                    {option.isDefault ? "\u2605" : "\u2606"} Make this rule default
                                  </s-button>
                                </s-stack>
                                {option.compatibility.status === "blocked" && (
                                  <p style={{ margin: 0, fontSize: 12, color: "#8a6116" }}>
                                    {option.compatibility.reason}
                                  </p>
                                )}
                                <s-stack direction="inline" gap="small">
                                  <s-text-field
                                    label="Box Label"
                                    value={option.label}
                                    onInput={(e: Event) => pricingState.updateBundleQuantityOption(option.ruleId, {
                                      label: (e.target as HTMLInputElement).value,
                                    })}
                                    autoComplete="off"
                                  />
                                  <s-text-field
                                    label="Box Subtext"
                                    value={option.subtext}
                                    onInput={(e: Event) => pricingState.updateBundleQuantityOption(option.ruleId, {
                                      subtext: (e.target as HTMLInputElement).value,
                                    })}
                                    autoComplete="off"
                                  />
                                </s-stack>
                              </s-stack>
                            </s-section>
                          ))}
                        </s-stack>
                        </div>
                      )}
                    </div>
                    )}
                    <div className={fullPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center" style={{ justifyContent: "space-between" }}>
                        <s-stack direction="inline" gap="small" alignItems="center">
                          <div className={fullPageBundleStyles.displayOptionText}>
                            <p className={fullPageBundleStyles.displayOptionTitle}>Progress Bar</p>
                            <p className={fullPageBundleStyles.displayOptionDescription}>
                              Edit the progress bar content and settings.
                            </p>
                          </div>
                          <s-switch
                            checked={pricingState.showDiscountProgressBar || undefined}
                            onChange={(e: Event) => pricingState.setShowDiscountProgressBar((e.target as HTMLInputElement).checked)}
                          />
                        </s-stack>
                        <s-button
                          variant="secondary"
                          icon="globe"
                          disabled={!pricingState.showDiscountProgressBar || (pricingState.pricingDisplayOptions.progressBar.type || "step_based") !== "step_based" || shopLocales.length === 0 || undefined}
                          onClick={() => setIsProgressBarMultiLangModalOpen(true)}
                        >
                          Multi Language
                        </s-button>
                      </s-stack>
                    {pricingState.showDiscountProgressBar && (
                      <div className={fullPageBundleStyles.nestedDisplayOptions}>
                      <s-stack direction="block" gap="small">
                        <s-choice-list
                          label="Progress bar type"
                          labelAccessibilityVisibility="exclusive"
                          values={[pricingState.pricingDisplayOptions.progressBar.type || "step_based"]}
                          onChange={(e: Event) => {
                            const val = ((e.currentTarget as any).values as string[] | undefined)?.[0];
                            if (val) pricingState.setProgressBarType(val as "simple" | "step_based");
                          }}
                        >
                          <s-choice value="simple">Simple Bar</s-choice>
                          <s-choice value="step_based">Step-Based Bar</s-choice>
                        </s-choice-list>
                        {(pricingState.pricingDisplayOptions.progressBar.type || "step_based") === "step_based" ? (
                          <s-stack direction="block" gap="small">
                            {pricingState.discountRules.length === 0 ? (
                              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>Add discount rules to configure tier text.</p>
                            ) : pricingState.discountRules.map((rule, index) => (
                              <s-section key={rule.id} className={fullPageBundleStyles.discountRuleCard}>
                                <s-stack direction="block" gap="small-100">
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Rule #{index + 1}</p>
                                  <s-stack direction="inline" gap="small">
                                    <s-text-field
                                      label="Tier Text"
                                      value={tierTextByRuleId[rule.id]?.tierText ?? ""}
                                      onInput={(e: Event) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        setTierTextByRuleId(prev => ({ ...prev, [rule.id]: { tierText: val, tierSubtext: prev[rule.id]?.tierSubtext ?? "" } }));
                                        markAsDirty();
                                      }}
                                      autoComplete="off"
                                    />
                                    <s-text-field
                                      label="Tier Subtext"
                                      value={tierTextByRuleId[rule.id]?.tierSubtext ?? ""}
                                      onInput={(e: Event) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        setTierTextByRuleId(prev => ({ ...prev, [rule.id]: { tierText: prev[rule.id]?.tierText ?? "", tierSubtext: val } }));
                                        markAsDirty();
                                      }}
                                      autoComplete="off"
                                    />
                                  </s-stack>
                                </s-stack>
                              </s-section>
                            ))}
                          </s-stack>
                        ) : null}
                      </s-stack>
                      </div>
                    )}
                    </div>
                    <div className={fullPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center" style={{ justifyContent: "space-between" }}>
                        <s-stack direction="inline" gap="small" alignItems="center">
                          <div className={fullPageBundleStyles.displayOptionText}>
                            <p className={fullPageBundleStyles.displayOptionTitle}>Discount Messaging</p>
                            <p className={fullPageBundleStyles.displayOptionDescription}>
                              Edit how discount messages appear above the subtotal.
                            </p>
                          </div>
                          <s-switch
                            checked={pricingState.discountMessagingEnabled || undefined}
                            onChange={(e: Event) => pricingState.setDiscountMessagingEnabled((e.target as HTMLInputElement).checked)}
                          />
                        </s-stack>
                        {shopLocales.length > 0 && (
                          <s-checkbox
                            label="Enable multi-language"
                            checked={discountMessagingMultiLanguageEnabled || undefined}
                            disabled={!pricingState.discountMessagingEnabled || undefined}
                            onChange={(e: Event) => {
                              setDiscountMessagingMultiLanguageEnabled((e.target as HTMLInputElement).checked);
                              markAsDirty();
                            }}
                          />
                        )}
                      </s-stack>
                    {pricingState.discountType === DiscountMethod.BUY_X_GET_Y && (
                      <s-banner tone="info">
                        Discount messaging displays the Total Quantity to Claim Offer (Buy + Get) to ensure customers add their rewards to the cart
                      </s-banner>
                    )}
                    {pricingState.discountMessagingEnabled && (
                      <div className={fullPageBundleStyles.nestedDisplayOptions}>
                      <s-stack direction="block" gap="small">
                        {discountMessagingMultiLanguageEnabled && shopLocales.length > 0 && (
                          <s-stack direction="block" gap="small-100">
                            <s-select
                              label="Language"
                              value={activeDiscountLocale}
                              onChange={(e: Event) => {
                                const locale = (e.target as HTMLSelectElement).value;
                                setActiveDiscountLocale(locale);
                                const primaryLocale = shopLocales.find((l: any) => l.primary)?.locale ?? "en";
                                if (locale !== primaryLocale && !ruleMessagesByLocale[locale]) {
                                  setRuleMessagesByLocale(prev => ({ ...prev, [locale]: normalizedRuleMessages }));
                                  markAsDirty();
                                }
                              }}
                            >
                              {shopLocales.map((loc: { locale: string; name: string; primary: boolean }) => (
                                <s-option key={loc.locale} value={loc.locale}>{loc.name}{loc.primary ? " (default)" : ""}</s-option>
                              ))}
                            </s-select>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Active languages</p>
                            <s-stack direction="inline" gap="small-100" style={{ flexWrap: "wrap" }}>
                              {shopLocales.filter((l: any) => l.primary).map((l: any) => (
                                <s-chip key={l.locale}>{l.name}</s-chip>
                              ))}
                              {Object.keys(ruleMessagesByLocale)
                                .filter(locale => !shopLocales.find((l: any) => l.locale === locale && l.primary))
                                .map(locale => {
                                  const locName = shopLocales.find((l: any) => l.locale === locale)?.name ?? locale;
                                  return <s-chip key={locale}>{locName}</s-chip>;
                                })}
                            </s-stack>
                          </s-stack>
                        )}
                        <div style={{ textAlign: "right" }}>
                          <s-button variant="plain" onClick={() => setIsDiscountVariablesModalOpen(true)}>
                            Show Variables
                          </s-button>
                        </div>
                                {pricingState.discountRules.length > 0 ? (
                                  <s-stack direction="block" gap="small">
                                    {pricingState.discountRules.map((rule: any, index: number) => {
                                      const localeMessages = discountMessagingMultiLanguageEnabled
                                        ? (ruleMessagesByLocale[activeDiscountLocale]?.[rule.id] ?? normalizedRuleMessages[rule.id])
                                        : normalizedRuleMessages[rule.id];
                                      const defaultDiscountText = getDefaultDiscountRuleText(pricingState.discountType, index);
                                      return (
                                <s-section key={rule.id} className={fullPageBundleStyles.discountRuleCard}>
                                  <s-stack direction="block" gap="small">
                                    <h5 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Rule #{index + 1}</h5>
                                    <s-text-field
                                      label="Discount Text"
                                      value={localeMessages?.discountText || defaultDiscountText}
                                      onInput={(e: Event) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        if (discountMessagingMultiLanguageEnabled) {
                                          setRuleMessagesByLocale(prev => ({
                                            ...prev,
                                            [activeDiscountLocale]: {
                                              ...(prev[activeDiscountLocale] || {}),
                                              [rule.id]: { ...(prev[activeDiscountLocale]?.[rule.id] || {}), discountText: val },
                                            },
                                          }));
                                          markAsDirty();
                                        } else {
                                          updateRuleMessage(rule.id, "discountText", val);
                                        }
                                      }}
                                      autoComplete="off"
                                      helpText="This message appears when the customer is close to qualifying for the discount."
                                    />
                                  </s-stack>
                                </s-section>
                              );
                            })}
                            <s-section>
                              <s-stack direction="block" gap="small">
                                <h5 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Success Message</h5>
                                <s-text-field
                                  label="Success Message"
                                  value={(() => {
                                    const defaultMsg = getDefaultDiscountRuleSuccessMessage(pricingState.discountType);
                                    const val = discountMessagingMultiLanguageEnabled
                                      ? (successMessageByLocale[activeDiscountLocale] ?? globalSuccessMessage)
                                      : globalSuccessMessage;
                                    return val || defaultMsg;
                                  })()}
                                  onInput={(e: Event) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (discountMessagingMultiLanguageEnabled) {
                                      setSuccessMessageByLocale(prev => ({ ...prev, [activeDiscountLocale]: val }));
                                    } else {
                                      setGlobalSuccessMessage(val);
                                    }
                                    markAsDirty();
                                  }}
                                  autoComplete="off"
                                  helpText="This message appears when the customer qualifies for the discount."
                                />
                              </s-stack>
                            </s-section>
                          </s-stack>
                        ) : (
                          <s-section>
                            <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>
                              Add discount rules to configure messaging.
                            </p>
                          </s-section>
                        )}
                      </s-stack>
                      </div>
                    )}
                    </div>
                  </s-stack>
                </div>
              </s-section>
              </s-stack>
              </div>
            )}

            {(activeSection === "images_gifs" || activeSection === "bundle_visibility") && (
              <div data-tour-target="fpb-design-settings">
              <s-stack direction="block" gap="base">
                {activeSection === "bundle_visibility" && (
                  <div className={fullPageBundleStyles.visibilityOverviewStack}>
                    <div className={fullPageBundleStyles.visibilityOverviewCard}>
                      <div>
                        <h3 className={fullPageBundleStyles.visibilityCardTitle}>App Embed Status</h3>
                        <p className={fullPageBundleStyles.visibilityCardText}>
                        {appEmbedEnabled
                          ? "Your store is connected and ready. Your bundle can now render on your storefront."
                          : "Enable the Theme app extension for Wolfpack Bundles to place and preview the bundle."}
                        </p>
                      </div>
                      <div className={appEmbedEnabled ? fullPageBundleStyles.visibilityStatusEnabled : fullPageBundleStyles.visibilityStatusWarning}>
                        {appEmbedEnabled ? "Enabled" : "Not enabled"}
                      </div>
                    {!appEmbedEnabled && themeEditorUrl && (
                        <button type="button" className={fullPageBundleStyles.visibilitySecondaryAction} onClick={() => window.open(themeEditorUrl, "_blank")}>
                        Enable here
                        </button>
                    )}
                    </div>

                    <div className={fullPageBundleStyles.visibilityOverviewCard}>
                      <div className={fullPageBundleStyles.visibilitySectionIntro}>
                        <h3 className={fullPageBundleStyles.visibilityCardTitle}>Publishing Best Practices</h3>
                        <p className={fullPageBundleStyles.visibilityCardText}>
                        Pick a placement and follow the quick guide to make your bundle discoverable on your store.
                        </p>
                      </div>
                      <div className={fullPageBundleStyles.visibilityGuideGrid}>
                        {[
                          { title: "Hero Banner",           desc: "Add a button to your homepage hero to drive shoppers directly to your bundle.",      img: "/current-dashboard-setup-widget.png" },
                          { title: "Navigation Menu",       desc: "Add your bundle as a nav link so shoppers can find it from anywhere on your store.", img: "/bundleGallery.png" },
                          { title: "Announcement Banner",   desc: "Show your offer in the announcement bar so visitors see it instantly.",               img: "/fpb.png" },
                          { title: "Featured Product Card", desc: "Feature your bundle product on your homepage so shoppers find it right away.",        img: "/productPageThumbnail.png" },
                        ].map(({ title, desc: description, img }) => (
                          <div key={title} className={fullPageBundleStyles.visibilityGuideCard}>
                            <div className={fullPageBundleStyles.visibilityGuideMedia}>
                              <img src={img} alt={title} />
                            </div>
                            <div className={fullPageBundleStyles.visibilityGuideBody}>
                              <h4 className={fullPageBundleStyles.visibilityGuideTitle}>{title}</h4>
                              <p className={fullPageBundleStyles.visibilityGuideDescription}>{description}</p>
                              <div className={fullPageBundleStyles.visibilityGuideFooter}>
                                <button type="button" className={fullPageBundleStyles.visibilityGuideAction} onClick={() => window.open("https://wolfpackapps.com", "_blank")}>
                                  Quick Setup Guide
                                </button>
                                <span className={fullPageBundleStyles.visibilitySetupTime}>5 min setup</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={fullPageBundleStyles.visibilityOverviewCard}>
                      <div className={fullPageBundleStyles.visibilitySectionIntro}>
                        <h3 className={fullPageBundleStyles.visibilityCardTitle}>Your Bundle Link</h3>
                        <p className={fullPageBundleStyles.visibilityCardText}>
                          Use this link to place your bundle anywhere - theme components, emails, ads, or social bios.
                        </p>
                      </div>
                      <div className={fullPageBundleStyles.visibilityLinkRow}>
                        <input
                          className={fullPageBundleStyles.visibilityTextInput}
                          aria-label="Bundle link"
                          value={pageUrlPreview}
                          disabled
                          readOnly
                        />
                        <button
                          type="button"
                          className={fullPageBundleStyles.visibilitySecondaryAction}
                          onClick={() => {
                            void navigator.clipboard?.writeText(pageUrlPreview);
                            shopify.toast.show("Bundle link copied", { isError: false });
                          }}
                        >
                          Copy Link
                        </button>
                        {bundle.shopifyPageHandle && (
                          <button
                            type="button"
                            className={fullPageBundleStyles.visibilityPlainAction}
                            onClick={() => window.open(pageUrlPreview, '_blank')}
                          >
                            View on Storefront
                          </button>
                        )}
                      </div>
                      <label className={fullPageBundleStyles.visibilityFieldLabel}>
                        <span>Page URL slug</span>
                        <input
                          className={fullPageBundleStyles.visibilityTextInput}
                          value={pageSlug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setPageSlug(e.target.value);
                            setHasManuallyEditedSlug(true);
                            markAsDirty();
                          }}
                          onBlur={() => setPageSlug(slugify(pageSlug))}
                        />
                      </label>
                      {pageSlugError && <p className={fullPageBundleStyles.visibilityCardText}>{pageSlugError}</p>}
                    </div>

                    <div className={fullPageBundleStyles.visibilityOverviewCard}>
                      <h3 className={fullPageBundleStyles.visibilityCardTitle}>Want more placement options?</h3>
                      <div className={fullPageBundleStyles.visibilitySetupPanel}>
                        <div>
                          <h4 className={fullPageBundleStyles.visibilitySetupTitle}>Bundle Widget</h4>
                          <p className={fullPageBundleStyles.visibilityCardText}>
                            Add a bundle button to specific product pages.
                          </p>
                        </div>
                        <button type="button" className={fullPageBundleStyles.visibilityPrimaryAction} onClick={() => handleSectionChange("bundle_widget")}>
                          Set up Bundle Widget
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "images_gifs" && (
                <>
                <div style={{ padding: "var(--s-space-400)", background: "var(--s-color-bg-surface-secondary, #f6f6f7)", borderRadius: 8 }}>
                  <s-stack direction="inline" gap="small-100">
                    <s-icon name="image-alt-minor" />
                    <s-stack direction="block">
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Media Assets</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                        Add visual media to enhance the bundle experience for shoppers.
                      </p>
                    </s-stack>
                  </s-stack>
                </div>

                <s-section>
                  <s-stack direction="block" gap="base">
                    <s-stack direction="inline">
                      <s-stack direction="inline" gap="small" style={{ flex: 1 }}>
                        <s-icon name="image-alt-minor" />
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Promo Banner</p>
                          <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Wide banner displayed at the top of the full-page bundle</p>
                        </s-stack>
                      </s-stack>
                      <s-badge tone="info">Page header</s-badge>
                    </s-stack>

                    <div style={{ padding: "var(--s-space-400)", background: "var(--s-color-bg-surface-secondary, #f6f6f7)", borderRadius: 8 }}>
                      <s-stack direction="inline" gap="large">
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6d7175" }}>FORMAT</p>
                          <p style={{ margin: 0, fontSize: 14 }}>JPG, PNG, WebP, GIF, SVG, AVIF</p>
                        </s-stack>
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6d7175" }}>RECOMMENDED SIZE</p>
                          <p style={{ margin: 0, fontSize: 14 }}>1600 × 400 px · 4:1 ratio</p>
                        </s-stack>
                      </s-stack>
                    </div>

                    <s-divider />

                    <FilePicker
                      value={promoBannerBgImage}
                      onChange={(url) => {
                        setPromoBannerBgImage(url);
                        markAsDirty();
                      }}
                      cropValue={promoBannerBgImageCrop}
                      onCropChange={(crop) => {
                        setPromoBannerBgImageCrop(crop);
                        markAsDirty();
                      }}
                    />
                  </s-stack>
                </s-section>

                {stepsState.steps.length > 0 && (
                  <s-section>
                    <s-stack direction="block" gap="base">
                      <s-stack direction="inline">
                        <s-stack direction="inline" gap="small" style={{ flex: 1 }}>
                          <s-icon name="image-alt-minor" />
                          <s-stack direction="block" gap="small-400">
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Step Images</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Tab icon and banner image per step — shown in the widget</p>
                          </s-stack>
                        </s-stack>
                        <s-badge tone="info">Per step</s-badge>
                      </s-stack>

                      <div>
                        <div className={fullPageBundleStyles.tabRow}>
                          {stepsState.steps.map((step, i) => (
                            <button
                              key={`asset-step-${step.id}`}
                              onClick={() => setActiveAssetTabIndex(i)}
                              className={activeAssetTabIndex === i ? fullPageBundleStyles.tabActive : fullPageBundleStyles.tab}
                            >
                              {step.name || `Step ${i + 1}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {stepsState.steps.map((step, index) => activeAssetTabIndex === index && (
                        <s-stack key={step.id} direction="block" gap="base">
                          <s-stack direction="block" gap="small-100">
                            <s-stack direction="block" gap="small-400">
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Tab Icon</p>
                              <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Circular icon in the step tab. Replaces the step number when set. Recommended: 100 × 100 px square.</p>
                            </s-stack>
                            <FilePicker
                              label="Choose tab icon"
                              hideCropEditor
                              value={(step as any).imageUrl ?? null}
                              onChange={(url) => {
                                stepsState.updateStepField(step.id, 'imageUrl', url ?? null);
                                markAsDirty();
                              }}
                            />
                          </s-stack>

                          <s-divider />

                          <s-stack direction="block" gap="small-100">
                            <s-stack direction="block" gap="small-400">
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Step Banner Image</p>
                              <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Full-width image above the product grid when this step is active. Recommended: 1600 × 400 px.</p>
                            </s-stack>
                            <FilePicker
                              label="Choose banner image"
                              hideCropEditor
                              value={(step as any).bannerImageUrl ?? null}
                              onChange={(url) => {
                                stepsState.updateStepField(step.id, 'bannerImageUrl', url ?? null);
                                markAsDirty();
                              }}
                            />
                          </s-stack>
                        </s-stack>
                      ))}
                    </s-stack>
                  </s-section>
                )}

                <s-section>
                  <s-stack direction="block" gap="base">
                    <s-stack direction="inline">
                      <s-stack direction="inline" gap="small" style={{ flex: 1 }}>
                        <s-icon name="refresh-minor" />
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Loading Animation</p>
                          <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Overlay shown while bundle content is loading</p>
                        </s-stack>
                      </s-stack>
                      <RichHelpTooltip
                        label="Storefront"
                        tooltipKey="loadingAnimation"
                      />
                    </s-stack>

                    <div style={{ padding: "var(--s-space-400)", background: "var(--s-color-bg-surface-secondary, #f6f6f7)", borderRadius: 8 }}>
                      <s-stack direction="inline" gap="large">
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6d7175" }}>FORMAT</p>
                          <p style={{ margin: 0, fontSize: 14 }}>GIF only</p>
                        </s-stack>
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6d7175" }}>RECOMMENDED SIZE</p>
                          <p style={{ margin: 0, fontSize: 14 }}>Max 150 × 150 px</p>
                        </s-stack>
                      </s-stack>
                    </div>

                    <s-divider />

                    <FilePicker
                      label="Choose loading GIF"
                      value={loadingGif}
                      onChange={(url) => {
                        setLoadingGif(url);
                        markAsDirty();
                      }}
                      hideCropEditor
                    />

                    {loadingGif && (
                      <s-stack direction="block" gap="small-100">
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6d7175" }}>PREVIEW</p>
                        <img
                          src={loadingGif}
                          alt="Loading animation preview"
                          style={{ maxWidth: 150, maxHeight: 150, borderRadius: 8, border: "1px solid #e1e3e5" }}
                        />
                      </s-stack>
                    )}
                  </s-stack>
                </s-section>

                <s-section>
                  <s-stack direction="block" gap="base">
                    <s-stack direction="inline">
                      <s-stack direction="inline" gap="small" style={{ flex: 1 }}>
                        <s-icon name="discount-minor" />
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Floating Promo Badge</p>
                          <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Fixed badge at bottom-left of the page — session-dismissed when shopper clicks X</p>
                        </s-stack>
                      </s-stack>
                      <s-badge tone="magic">Storefront</s-badge>
                    </s-stack>

                    <s-checkbox
                      checked={floatingBadgeEnabled || undefined}
                      onChange={(e: Event) => { setFloatingBadgeEnabled((e.target as HTMLInputElement).checked); markAsDirty(); }}
                    >
                      Show floating promo badge
                    </s-checkbox>

                    {floatingBadgeEnabled && (
                      <s-text-field
                        label="Badge text"
                        value={floatingBadgeText}
                        onInput={(e: Event) => { setFloatingBadgeText((e.target as HTMLInputElement).value.slice(0, 60)); markAsDirty(); }}
                        placeholder="e.g. Save 20% today only!"
                        autoComplete="off"
                        helpText="Shown in the badge. Max 60 characters."
                      />
                    )}
                  </s-stack>
                </s-section>
                </>
                )}
              </s-stack>
              </div>
            )}

            {activeSection === "pricing_tiers" && bundle.bundleType === "full_page" && (
              <s-stack direction="block" gap="base">
                <div style={{ padding: "var(--s-space-400)", background: "var(--s-color-bg-surface-secondary, #f6f6f7)", borderRadius: 8 }}>
                  <s-stack direction="inline" gap="small-100">
                    <s-icon name="discount-minor" />
                    <s-stack direction="block" gap="small-400">
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Pricing Tiers</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                        Let shoppers switch between different bundle price points on the same page.
                      </p>
                    </s-stack>
                  </s-stack>
                </div>

                <PricingTiersSection
                  tiers={tierConfig}
                  availableBundles={availableBundles}
                  currentBundleId={bundle.id}
                  showStepTimeline={showStepTimeline}
                  onShowStepTimelineChange={(val) => {
                    setShowStepTimeline(val);
                    markAsDirty();
                  }}
                  stepsCount={stepsState.steps.length}
                  onStepsTiersConflictWarning={(onConfirm) => {
                    setStepsTiersWarning({ open: true, onConfirm });
                  }}
                  onChange={(tiers) => {
                    setTierConfig(tiers);
                    markAsDirty();
                  }}
                />
              </s-stack>
            )}

            {activeSection === "bundle_settings" && (() => {
              const settingsStep = stepsState.steps[activeTabIndex] || stepsState.steps[0];

              return (
                <div data-tour-target="fpb-bundle-settings">
                  <s-stack direction="block" gap="base">

                    {/* Pre Selected Product */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Pre Selected Product</h3>
                          {settingsStep && (
                            <s-switch
                              accessibilityLabel="Enable pre selected product for active step"
                              checked={settingsStep.isDefault || undefined}
                              onChange={(e: Event) => {
                                stepsState.updateStepField(settingsStep.id, "isDefault", (e.target as HTMLInputElement).checked);
                                markAsDirty();
                              }}
                            />
                          )}
                        </s-stack>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                          Choose products that should be added to bundle by default
                        </p>
                        <s-banner tone="info">
                          Tip: Discounts are based on all items in your cart. Don&apos;t forget to include the Pre Selected Product&apos;s quantity or amount when setting up discounts.
                        </s-banner>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                          These products will be added to user&apos;s box automatically on the first step.
                        </p>
                        <s-button variant="primary" onClick={() => handleSectionChange("step_setup")}>
                          Browse Products
                        </s-button>
                      </s-stack>
                    </s-section>

                    {/* Enable Quantity Validation + Product Slots + Slot Icon */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Enable Quantity Validation</h3>
                          <s-switch
                            accessibilityLabel="Enable quantity validation"
                            checked={productSlotsEnabled || undefined}
                            onChange={(e: Event) => { setProductSlotsEnabled((e.target as HTMLInputElement).checked); markAsDirty(); }}
                          />
                        </s-stack>
                        <s-text-field
                          label="Maximum allowed quantity per product"
                          type="number"
                          min="1"
                          value={maxQtyPerProduct || "1"}
                          disabled={!productSlotsEnabled}
                          onInput={(e: Event) => { setMaxQtyPerProduct((e.target as HTMLInputElement).value); markAsDirty(); }}
                          autoComplete="off"
                        />
                        {/* Product Slots sub-section */}
                        {settingsStep && (
                          <s-stack direction="block" gap="small-400">
                            <s-stack direction="inline" alignItems="center" gap="small">
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, flex: 1 }}>Product Slots</p>
                              <s-checkbox
                                accessibilityLabel="Enable product slots display"
                                checked={productSlotsEnabled || undefined}
                                onChange={(e: Event) => { setProductSlotsEnabled((e.target as HTMLInputElement).checked); markAsDirty(); }}
                              />
                            </s-stack>
                            <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                              This feature displays empty slots on the storefront.
                            </p>
                            <s-stack direction="inline" gap="small-100">
                              <s-text-field
                                label="Min"
                                type="number"
                                min="0"
                                value={String(settingsStep.minQuantity ?? 1)}
                                onInput={(e: Event) => {
                                  stepsState.updateStepField(settingsStep.id, "minQuantity", Number((e.target as HTMLInputElement).value) || 0);
                                  markAsDirty();
                                }}
                                autoComplete="off"
                              />
                              <s-text-field
                                label="Max"
                                type="number"
                                min="1"
                                value={String(settingsStep.maxQuantity ?? 1)}
                                onInput={(e: Event) => {
                                  stepsState.updateStepField(settingsStep.id, "maxQuantity", Number((e.target as HTMLInputElement).value) || 1);
                                  markAsDirty();
                                }}
                                autoComplete="off"
                              />
                            </s-stack>
                          </s-stack>
                        )}
                        {/* Slot Icon — nested inside EQV section */}
                        <s-stack direction="block" gap="small-400">
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Slot Icon</h3>
                          <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                            You can change the default icon that renders in the empty slots
                          </p>
                          <s-stack direction="inline" gap="small">
                            <s-button variant="primary" icon="upload" onClick={() => handleSectionChange("step_setup")}>
                              Change Icon
                            </s-button>
                            <s-button
                              variant="secondary"
                              onClick={() => {
                                if (settingsStep) {
                                  stepsState.updateStepField(settingsStep.id, "stepImage", null);
                                  markAsDirty();
                                }
                              }}
                            >
                              Reset
                            </s-button>
                          </s-stack>
                          <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                            Note: Only applicable when rules are based on quantity
                          </p>
                        </s-stack>
                      </s-stack>
                    </s-section>

                    {/* Variant Selector + Show Text on + Button */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <SettingsRow
                          title="Variant Selector"
                          description="Enable variant selection within the product cards instead of the quick look"
                        >
                          {settingsStep && (
                          <s-switch
                            accessibilityLabel="Variant selector"
                            checked={settingsStep.displayVariantsAsIndividual ?? undefined}
                            onChange={(e: Event) => {
                              const checked = (e.target as HTMLInputElement).checked;
                              stepsState.updateStepField(settingsStep.id, "displayVariantsAsIndividual", checked);
                              markAsDirty();
                            }}
                            />
                          )}
                        </SettingsRow>
                        <SettingsRow
                          title="Show Text on + Button"
                          description="Replaces the + icon with a text button and moves it below the price."
                        >
                          <s-switch
                            accessibilityLabel="Show text on plus button"
                            checked={showTextOnPlusEnabled || undefined}
                            onChange={(e: Event) => {
                              const enabled = (e.target as HTMLInputElement).checked;
                              setShowTextOnPlusEnabled(enabled);
                              if (!enabled) {
                                setTextOverrides((prev) => ({ ...prev, addToCartButton: "" }));
                              }
                              markAsDirty();
                            }}
                          />
                        </SettingsRow>
                        {showTextOnPlusEnabled && (
                          <s-stack direction="inline" gap="small" alignItems="end">
                            <s-text-field
                              label="Button text"
                              value={textOverrides.addToCartButton ?? ""}
                              placeholder="Add to Cart"
                              autoComplete="off"
                              onInput={(e: Event) => {
                                setTextOverrides((prev) => ({ ...prev, addToCartButton: (e.target as HTMLInputElement).value }));
                                markAsDirty();
                              }}
                            />
                            <s-button
                              variant="secondary"
                              icon="globe"
                              onClick={() => openMultiLanguageModal("Add Button Text", [
                                { key: "addToCartButton", label: "Button text", fallback: textOverrides.addToCartButton ?? "Add to Cart" },
                              ])}
                            >
                              Multi Language
                            </s-button>
                          </s-stack>
                        )}
                      </s-stack>
                    </s-section>

                    {/* Bundle Cart */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Bundle Cart</h3>
                          <s-button
                            variant="secondary"
                            icon="globe"
                            onClick={() => openMultiLanguageModal("Bundle Cart", [
                              { key: "yourBundle", label: "Bundle Cart Title", fallback: textOverrides.yourBundle ?? "Your Bundle" },
                              { key: "reviewBundle", label: "Bundle Cart Subtitle", fallback: textOverrides.reviewBundle ?? "Review your bundle" },
                            ])}
                          >
                            Multi Language
                          </s-button>
                        </s-stack>
                        <div className={fullPageBundleStyles.settingsNestedFields}>
                          <s-text-field
                            label="Bundle Cart Title"
                            value={textOverrides.yourBundle ?? ""}
                            placeholder="Your Bundle"
                            autoComplete="off"
                            onInput={(e: Event) => {
                              setTextOverrides((prev) => ({ ...prev, yourBundle: (e.target as HTMLInputElement).value }));
                              markAsDirty();
                            }}
                          />
                          <s-text-field
                            label="Bundle Cart Subtitle"
                            value={textOverrides.reviewBundle ?? ""}
                            placeholder="Review your bundle"
                            autoComplete="off"
                            onInput={(e: Event) => {
                              setTextOverrides((prev) => ({ ...prev, reviewBundle: (e.target as HTMLInputElement).value }));
                              markAsDirty();
                            }}
                          />
                        </div>
                      </s-stack>
                    </s-section>

                    {/* Cart line item discount display */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, flex: 1 }}>Cart line item discount display</p>
                          <s-button variant="secondary" onClick={() => handleSectionChange("discount_pricing")}>
                            Edit Defaults
                          </s-button>
                        </s-stack>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>Shows how much the customer is saving on the bundle in cart</p>
                        {[
                          { value: "defaults", label: "Use app defaults", description: "Uses the discount format and label configured in your app settings." },
                          { value: "custom", label: "Customize for this bundle", description: "Set a different discount format or label for this bundle only." },
                        ].map(({ value, label, description }) => (
                          <label key={value} style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="cartDiscountDisplay"
                              value={value}
                              checked={(textOverrides.cartDiscountDisplay ?? "defaults") === value}
                              onChange={() => { setTextOverrides((prev) => ({ ...prev, cartDiscountDisplay: value })); markAsDirty(); }}
                              style={{ marginTop: 3 }}
                            />
                            <span>
                              <span style={{ display: "block", fontSize: 14 }}>{label}</span>
                              <span style={{ display: "block", fontSize: 13, color: "#6d7175" }}>{description}</span>
                            </span>
                          </label>
                        ))}
                      </s-stack>
                    </s-section>

                    {/* Redirect to checkout — WPB-specific */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <SettingsRow
                          title="Redirect to checkout after adding to cart"
                          description="Skip the cart drawer/page after the bundle is added."
                        >
                          <s-switch
                            accessibilityLabel="Redirect to checkout after adding to cart"
                            checked={cartRedirectToCheckout || undefined}
                            onChange={(e: Event) => { setCartRedirectToCheckout((e.target as HTMLInputElement).checked); markAsDirty(); }}
                          />
                        </SettingsRow>
                      </s-stack>
                    </s-section>

                    {/* Bundle Banner — 2-column side-by-side layout */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Bundle Banner</p>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>Upload banner images for desktop and mobile views that will be displayed at the top of your bundle page.</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500 }}>Banner Image: Desktop</p>
                            <FilePicker
                              value={bundleBannerDesktopUrl || null}
                              onChange={(url) => { setBundleBannerDesktopUrl(url ?? ""); markAsDirty(); }}
                            />
                            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6d7175" }}>Recommended Size: <span style={{ color: "#202223" }}>1900x230</span></p>
                          </div>
                          <div>
                            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500 }}>Banner Image: Mobile</p>
                            <FilePicker
                              value={bundleBannerMobileUrl || null}
                              onChange={(url) => { setBundleBannerMobileUrl(url ?? ""); markAsDirty(); }}
                            />
                            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6d7175" }}>Recommended Size: <span style={{ color: "#202223" }}>1100x500</span></p>
                          </div>
                        </div>
                      </s-stack>
                    </s-section>

                    {/* Bundle Level CSS — collapsible */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <button
                          type="button"
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          onClick={() => setBundleLevelCssExpanded((prev) => !prev)}
                        >
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Bundle Level CSS</h3>
                          <span style={{ fontSize: 18, color: "#6d7175", display: "inline-block", transform: bundleLevelCssExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                        </button>
                        {bundleLevelCssExpanded && (
                          <textarea
                            value={bundleLevelCss}
                            placeholder="/* Add custom CSS for this bundle */"
                            rows={6}
                            style={{ width: "100%", fontFamily: "monospace", fontSize: 13, padding: "8px 10px", borderRadius: 6, border: "1px solid #c9cccf", resize: "vertical", boxSizing: "border-box" }}
                            onInput={(e: Event) => { setBundleLevelCss((e.target as HTMLTextAreaElement).value); markAsDirty(); }}
                          />
                        )}
                      </s-stack>
                    </s-section>

                    {/* WPB-specific: Show product prices + Compare-at + Allow quantity changes */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <SettingsRow
                          title="Show product prices"
                          description="Display product prices on product cards."
                        >
                          <s-switch
                            accessibilityLabel="Show product prices"
                            checked={showProductPrices || undefined}
                            onChange={(e: Event) => { setShowProductPrices((e.target as HTMLInputElement).checked); markAsDirty(); }}
                          />
                        </SettingsRow>
                        <SettingsRow
                          title="Show compare-at prices"
                          description="Show original prices next to sale prices."
                        >
                          <s-switch
                            accessibilityLabel="Show compare-at prices"
                            checked={showCompareAtPrices || undefined}
                            onChange={(e: Event) => { setShowCompareAtPrices((e.target as HTMLInputElement).checked); markAsDirty(); }}
                          />
                        </SettingsRow>
                        <SettingsRow
                          title="Allow quantity changes"
                          description="Let customers adjust item quantities inside the bundle."
                        >
                          <s-switch
                            accessibilityLabel="Allow quantity changes"
                            checked={allowQuantityChanges || undefined}
                            onChange={(e: Event) => { setAllowQuantityChanges((e.target as HTMLInputElement).checked); markAsDirty(); }}
                          />
                        </SettingsRow>
                      </s-stack>
                    </s-section>

                    <s-section>
                      <BundleStatusSection
                        status={formState.bundleStatus}
                        onChange={formState.setBundleStatus}
                      />
                    </s-section>
                  </s-stack>
                </div>
              );
            })()}

            {activeSection === "bundle_widget" && (
              <div data-tour-target="fpb-bundle-widget">
                <div className={fullPageBundleStyles.visibilityPanel}>
                  <div className={fullPageBundleStyles.visibilityTitleSwitchRow}>
                    <div>
                      <h3 className={fullPageBundleStyles.visibilityPanelTitle}>Product Page Bundle Upsell Widgets</h3>
                      <p className={fullPageBundleStyles.visibilityCardText}>
                        This will display an upsell block or button on the product pages of your choice.
                      </p>
                    </div>
                    <s-switch
                      checked={upsellWidgetEnabled || undefined}
                      onChange={(e: any) => { setUpsellWidgetEnabled(e.target.checked); markAsDirty(); }}
                    />
                  </div>

                  <div className={fullPageBundleStyles.visibilityPreviewFrame}>
                    <div className={fullPageBundleStyles.visibilityPreviewProduct}>
                      <div className={fullPageBundleStyles.visibilityPreviewThumbnails}>
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className={fullPageBundleStyles.visibilityPreviewImage}>
                        {upsellWidgetImageUrl ? <img src={upsellWidgetImageUrl} alt="" /> : null}
                      </div>
                      <div className={fullPageBundleStyles.visibilityPreviewDetails}>
                        <p className={fullPageBundleStyles.visibilityPreviewTitle}>The Ultimate Juice</p>
                        <p className={fullPageBundleStyles.visibilityPreviewPrice}>$47.97</p>
                        <div className={fullPageBundleStyles.visibilityPreviewNativeButton}>Add to Cart - $47.97</div>
                        <div className={fullPageBundleStyles.visibilityPreviewWidget}>
                          <span>{upsellWidgetTitle || "Bundle & Save"}</span>
                          <button type="button">{upsellWidgetButtonText || "Buy with Bundle"}</button>
                        </div>
                      </div>
                    </div>
                    <div className={fullPageBundleStyles.visibilityRadioBar}>
                      <label className={fullPageBundleStyles.visibilityRadioLabel}>
                        <input
                          type="radio"
                          name="fpbUpsellWidgetType"
                          value="block"
                          checked={upsellWidgetDisplayMode !== "button"}
                          onChange={() => { setUpsellWidgetDisplayMode("block"); markAsDirty(); }}
                        />
                        <span>Offer Upsell Block</span>
                      </label>
                      <label className={fullPageBundleStyles.visibilityRadioLabel}>
                        <input
                          type="radio"
                          name="fpbUpsellWidgetType"
                          value="button"
                          checked={upsellWidgetDisplayMode === "button"}
                          onChange={() => { setUpsellWidgetDisplayMode("button"); markAsDirty(); }}
                        />
                        <span>Offer Upsell Button</span>
                      </label>
                    </div>
                  </div>

                  <div className={fullPageBundleStyles.visibilityInfoBanner}>
                    Select if you want the upsell block or button to appear on product pages.
                  </div>

                  <div className={fullPageBundleStyles.visibilityPanelSection}>
                    <div className={fullPageBundleStyles.visibilitySectionHeader}>
                      <h4 className={fullPageBundleStyles.visibilitySectionTitle}>Widget Settings</h4>
                      <button
                        type="button"
                        className={fullPageBundleStyles.visibilitySecondaryAction}
                        onClick={() => {
                          setUpsellWidgetLanguageMode((prev) => prev === "MULTIPLE" ? "SINGLE" : "MULTIPLE");
                          markAsDirty();
                        }}
                      >
                        Multi Language
                      </button>
                    </div>
                    <div className={fullPageBundleStyles.visibilitySettingsGrid}>
                      <div className={fullPageBundleStyles.visibilityImagePicker}>
                        <FilePicker
                          label="Upload Image"
                          hideCropEditor
                          value={upsellWidgetImageUrl || null}
                          onChange={(url) => { setUpsellWidgetImageUrl(url ?? ""); markAsDirty(); }}
                        />
                      </div>
                      <div className={fullPageBundleStyles.visibilityFieldStack}>
                        <label className={fullPageBundleStyles.visibilityFieldLabel}>
                          <span>Widget Title</span>
                          <input
                            className={fullPageBundleStyles.visibilityTextInput}
                            value={upsellWidgetTitle}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUpsellWidgetTitle(e.target.value); markAsDirty(); }}
                          />
                        </label>
                        <label className={fullPageBundleStyles.visibilityFieldLabel}>
                          <span>Widget Description</span>
                          <textarea
                            className={fullPageBundleStyles.visibilityTextarea}
                            value={upsellWidgetDescription}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setUpsellWidgetDescription(e.target.value); markAsDirty(); }}
                          />
                        </label>
                        <label className={fullPageBundleStyles.visibilityFieldLabel}>
                          <span>Widget Button Text</span>
                          <input
                            className={fullPageBundleStyles.visibilityTextInput}
                            value={upsellWidgetButtonText}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = e.target.value;
                              setUpsellWidgetButtonText(value);
                              setTextOverrides((prev) => ({ ...prev, widgetButtonText: value }));
                              markAsDirty();
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className={fullPageBundleStyles.visibilityPanelSection}>
                    <h4 className={fullPageBundleStyles.visibilitySectionTitle}>Display Widget on</h4>
                    <div className={fullPageBundleStyles.visibilityTargetOptions}>
                      {[
                        { value: "all",                   label: "All products in bundle"  },
                        { value: "specific_products",     label: "Specific products"        },
                        { value: "specific_collections",  label: "Specific collections"     },
                      ].map(({ value, label }) => (
                        <label key={value} className={fullPageBundleStyles.visibilityRadioLabel}>
                          <input
                            type="radio"
                            name="fpbWidgetDisplayOn"
                            value={value}
                            checked={upsellWidgetDisplayOn === value}
                            onChange={() => { setUpsellWidgetDisplayOn(value); markAsDirty(); }}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    {upsellWidgetDisplayOn === "specific_products" && (
                      <div className={fullPageBundleStyles.visibilityTargetPicker}>
                        <button type="button" className={fullPageBundleStyles.visibilitySecondaryAction} onClick={() => openVisibilityProductPicker("widget")}>
                          Select products
                        </button>
                        <div className={fullPageBundleStyles.visibilitySelectionList}>
                          {upsellWidgetSelectedProducts.map((product: any, index) => (
                            <div key={getVisibilityResourceId(product) ?? index} className={fullPageBundleStyles.visibilitySelectionItem}>
                              <span>{product.title ?? "Untitled product"}</span>
                              <button type="button" onClick={() => removeVisibilityProductTarget("widget", index)}>Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {upsellWidgetDisplayOn === "specific_collections" && (
                      <div className={fullPageBundleStyles.visibilityTargetPicker}>
                        <button type="button" className={fullPageBundleStyles.visibilitySecondaryAction} onClick={() => openVisibilityCollectionPicker("widget")}>
                          Select collections
                        </button>
                        <div className={fullPageBundleStyles.visibilitySelectionList}>
                          {upsellWidgetCollectionsSelectedData.map((collection: any, index) => (
                            <div key={getVisibilityResourceId(collection) ?? index} className={fullPageBundleStyles.visibilitySelectionItem}>
                              <span>{collection.title ?? "Untitled collection"}</span>
                              <button type="button" onClick={() => removeVisibilityCollectionTarget("widget", index)}>Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <label className={fullPageBundleStyles.visibilityCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={autoSelectBrowsedProduct}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAutoSelectBrowsedProduct(e.target.checked); markAsDirty(); }}
                    />
                    <span>Add browsed product to bundle</span>
                  </label>
                </div>

                <div className={fullPageBundleStyles.visibilityPlacementCard}>
                  <div>
                    <h4 className={fullPageBundleStyles.visibilitySectionTitle}>Embed the Upsell {upsellWidgetDisplayMode === "button" ? "Button" : "Block"} at a custom location</h4>
                    <p className={fullPageBundleStyles.visibilityCardText}>Place app block on the theme</p>
                  </div>
                  <button type="button" className={fullPageBundleStyles.visibilityPrimaryAction} onClick={handlePlaceWidget}>
                    Embed Upsell {upsellWidgetDisplayMode === "button" ? "Button" : "Block"}
                  </button>
                </div>
              </div>
            )}

            {activeSection === "messages" && (() => {
              const isGiftMessageEnabled = giftMessageDraft.isGiftMessageEnabled === true;
              const hasSenderRecipientFields = giftMessageDraft.isSenderAndRecipientNameEnabled === true;
              const isGiftMessageRequired = giftMessageDraft.isGiftMessageMandatory === true;
              const hasMessageLimit = giftMessageDraft.isMessageLimitEnabled === true;
              const messageProduct = giftMessageDraft.messageProduct?.product || null;

              return (
                <s-stack direction="block" gap="base">
                  <div className={fullPageBundleStyles.card}>
                    <div className={fullPageBundleStyles.panelHeader}>
                      <div>
                        <h3 className={fullPageBundleStyles.panelTitle}>Enable Messages</h3>
                        <p className={fullPageBundleStyles.panelDescription}>
                          Message will show up as a product at checkout
                        </p>
                      </div>
                      <s-checkbox
                        accessibilityLabel="Enable messages"
                        checked={isGiftMessageEnabled || undefined}
                        onChange={(e: Event) => updateGiftMessageDraft({ isGiftMessageEnabled: (e.target as HTMLInputElement).checked })}
                      />
                    </div>

                    <div style={{ marginTop: 16 }} className={fullPageBundleStyles.messagePreview}>
                      <div className={fullPageBundleStyles.messagePreviewIcon} aria-hidden="true">
                        <s-icon name="note" />
                      </div>
                      <div>
                        <p className={fullPageBundleStyles.messagePreviewTitle}>
                          {messageProduct?.title || "Message"}
                        </p>
                        <p className={fullPageBundleStyles.messageNote}>
                          Add a message product so shoppers can include a note with the bundle.
                        </p>
                      </div>
                      <s-button
                        variant="secondary"
                        onClick={async () => {
                          try {
                            const picked = await shopify.resourcePicker({
                              type: "product",
                              multiple: false,
                            });
                            if (picked && picked.length > 0) {
                              const product = picked[0] as any;
                              updateGiftMessageDraft({
                                messageProduct: {
                                  isMessageProductEnabled: true,
                                  status: "unlisted",
                                  product: normalizeGiftMessageProductForPersonalization(product),
                                },
                              });
                            }
                          } catch (_) {
                            // user cancelled picker — no-op
                          }
                        }}
                      >
                        Edit
                      </s-button>
                    </div>

                    <s-stack direction="block" gap="small" style={{ marginTop: 16 }}>
                      <s-checkbox
                        label="Enable Sender and Recipient Fields"
                        checked={hasSenderRecipientFields || undefined}
                        disabled={!isGiftMessageEnabled || undefined}
                        onChange={(e: Event) => updateGiftMessageDraft({ isSenderAndRecipientNameEnabled: (e.target as HTMLInputElement).checked })}
                      />
                      <s-checkbox
                        label="Make Gift Message mandatory"
                        checked={isGiftMessageRequired || undefined}
                        disabled={!isGiftMessageEnabled || undefined}
                        onChange={(e: Event) => updateGiftMessageDraft({ isGiftMessageMandatory: (e.target as HTMLInputElement).checked })}
                      />
                      <s-checkbox
                        label="Enable Message Limit (Characters)"
                        checked={hasMessageLimit || undefined}
                        disabled={!isGiftMessageEnabled || undefined}
                        onChange={(e: Event) => updateGiftMessageDraft({ isMessageLimitEnabled: (e.target as HTMLInputElement).checked })}
                      />
                      <s-number-field
                        label="Enter Message Limit"
                        value={giftMessageDraft.giftMessageCharacterLimit ?? ""}
                        disabled={!isGiftMessageEnabled || !hasMessageLimit}
                        min={0}
                        onInput={(e: Event) => updateGiftMessageDraft({ giftMessageCharacterLimit: (e.target as HTMLInputElement).value })}
                      />
                      <s-divider />
                      <s-checkbox
                        label="Send message through email to the customer"
                        disabled
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#8c9196" }}>
                        <span>Customize your email templates here</span>
                        <s-button variant="secondary" disabled>Customize Emails</s-button>
                      </div>
                      <p className={fullPageBundleStyles.messageNote}>
                        Note: Please reach out to us if you wish to change the domain from where the emails are sent.
                      </p>
                    </s-stack>
                  </div>
                </s-stack>
              );
            })()}
          </div>
        </div>

      {/* Steps + Tiers Conflict Warning Modal */}
      <s-modal ref={stepsTiersModalRef} heading="Review bundle pricing setup">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>Wolfpack Bundles works best when the shopper flow and pricing flow match.</strong>
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Pricing tier pills are best for a single-step bundle. This bundle has <strong>{stepsState.steps.length} steps</strong> configured.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Continue only if you want to show tiers alongside the step-by-step builder.
          </p>
        </s-stack>
        <s-button slot="primaryAction" variant="primary" onClick={() => { stepsTiersWarning.onConfirm?.(); setStepsTiersWarning({ open: false, onConfirm: null }); }}>
          Continue
        </s-button>
        <s-button slot="secondaryActions" onClick={() => setStepsTiersWarning({ open: false, onConfirm: null })}>
          Cancel
        </s-button>
      </s-modal>

      {/* Page Selection Modal */}
      <s-modal ref={pageSelectionModalRef} heading="Add Wolfpack Bundles to storefront">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            {bundle.bundleType === 'full_page'
              ? "Select a page to place and preview the bundle."
              : "Select a template to place and preview the bundle."}
          </p>
          {isLoadingPages ? (
            <s-stack direction="block" gap="small">
              <s-spinner />
              <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                {bundle.bundleType === 'full_page' ? 'Loading pages...' : 'Loading templates...'}
              </p>
            </s-stack>
          ) : availablePages.length > 0 ? (
            <s-stack direction="block" gap="small-100">
              {availablePages.map((template) => (
                <div key={template.id || template.handle} style={{ border: "1px solid #e1e3e5", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <s-stack direction="block" gap="small-400">
                    <s-stack direction="inline" gap="small-400">
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{template.title}</span>
                      {template.recommended && <s-badge tone="success">Bundle Product</s-badge>}
                    </s-stack>
                    {template.description && <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>{template.description}</p>}
                  </s-stack>
                  <s-button
                    variant={template.recommended ? "primary" : undefined}
                    loading={isInstallingWidget || undefined}
                    disabled={isInstallingWidget || undefined}
                    onClick={() => handlePageSelection(template)}
                  >
                    {isInstallingWidget ? 'Adding...' : 'Select'}
                  </s-button>
                </div>
              ))}
            </s-stack>
          ) : (
            <s-stack direction="block" gap="small">
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                {bundle.bundleType === 'full_page' ? 'No pages available' : 'No templates available'}
              </p>
              <s-button href="https://admin.shopify.com/admin/pages" target="_blank">Create page</s-button>
            </s-stack>
          )}
        </s-stack>
        <s-button slot="secondaryActions" disabled={isInstallingWidget || undefined} onClick={() => closePageSelectionModal()}>
          Cancel
        </s-button>
      </s-modal>

      {/* Selected Products Modal */}
      <s-modal ref={productsModalRef} heading="Selected products">
        {(() => {
          const currentStep = stepsState.steps.find(step => step.id === currentModalStepId);
          const selectedProducts = currentStep?.StepProduct || [];
          return selectedProducts.length > 0 ? (
            <s-stack direction="block" gap="small">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected in this step.
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedProducts.map((product: any, index: number) => {
                  const productId = product.productId || product.id?.split('/').pop();
                  return (
                    <li key={product.id || index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f2f3" }}>
                      <s-stack direction="inline" gap="small">
                        <img src={product.imageUrl || product.image?.url || "/bundle.png"} alt={product.title || 'Product'} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                        <s-stack direction="block" gap="small-400">
                          <s-button
                            variant="plain"
                            onClick={() => {
                              if (!productId) return;
                              openProductInAdmin(productId);
                            }}
                            disabled={!productId || undefined}
                          >
                            {product.title || product.name || 'Unnamed Product'}
                          </s-button>
                          {product.variants && product.variants.length > 0 && (
                            <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                              {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} available
                            </p>
                          )}
                        </s-stack>
                      </s-stack>
                      <s-badge tone="info">Product</s-badge>
                    </li>
                  );
                })}
              </ul>
            </s-stack>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>No products selected for this step yet.</p>
          );
        })()}
        <s-button slot="primaryAction" onClick={handleCloseProductsModal}>Close</s-button>
      </s-modal>

      {/* Selected Collections Modal */}
      <s-modal ref={collectionsModalRef} heading="Selected collections">
        {(() => {
          const collections = selectedCollections[currentModalStepId] || [];
          return collections.length > 0 ? (
            <s-stack direction="block" gap="small">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                {collections.length} collection{collections.length !== 1 ? 's' : ''} selected in this step.
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {collections.map((collection: any, index: number) => (
                  <li key={collection.id || index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f2f3" }}>
                    <s-stack direction="block" gap="small-400">
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{collection.title || 'Unnamed Collection'}</span>
                      {collection.handle && <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Handle: {collection.handle}</p>}
                    </s-stack>
                    <s-badge tone="success">Collection</s-badge>
                  </li>
                ))}
              </ul>
            </s-stack>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>No collections selected for this step yet.</p>
          );
        })()}
        <s-button slot="primaryAction" onClick={handleCloseCollectionsModal}>Close</s-button>
      </s-modal>

      {/* Template Variables Modal */}
      <s-modal id="template-variables-modal" ref={templateVariablesModalRef} heading="Message variables" size="small">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Use these variables in Wolfpack Bundles messages. The widget replaces them with live bundle and discount values.
          </p>
          <div className={fullPageBundleStyles.templateVariableGrid}>
            {TEMPLATE_VARIABLES.map(([variable, description]) => (
              <div key={variable} className={fullPageBundleStyles.templateVariableItem}>
                <s-badge>{variable}</s-badge>
                <s-text tone="subdued">{description}</s-text>
              </div>
            ))}
          </div>
        </s-stack>
        <s-button
          slot="primaryAction"
          variant="primary"
          commandFor="template-variables-modal"
          command="--hide"
          onClick={() => hidePolarisModal(templateVariablesModalRef)}
        >
          Done
        </s-button>
      </s-modal>

      <s-modal id="discount-variables-modal" ref={discountVariablesModalRef} heading="Variables" size="small">
        <s-stack direction="block" gap="small">
          {TEMPLATE_VARIABLES.map(([variable, description]) => (
            <div key={variable} className={fullPageBundleStyles.templateVariableItem}>
              <s-text tone="subdued">{description}</s-text>
              <s-badge>{variable}</s-badge>
            </div>
          ))}
        </s-stack>
      </s-modal>

      <BundleReadinessOverlay
        items={readinessItems}
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
        onItemClick={handleReadinessItemClick}
      />

      <MultiLanguageTextModal
        open={isMultiLanguageModalOpen}
        title={multiLanguageTitle}
        locales={shopLocales}
        activeLocale={textOverridesLocale}
        fields={multiLanguageFields}
        valuesByLocale={activeMultiLanguageValues}
        onActiveLocaleChange={setTextOverridesLocale}
        onChange={updateLocalizedTextOverride}
        onSave={saveStepSetupMultiLanguageValues}
        onClose={() => setIsMultiLanguageModalOpen(false)}
      />

      <DiscardChangesModal
        open={showDiscardModal}
        onDiscard={handleConfirmDiscard}
        onContinue={closeDiscardModal}
      />

      {isSelectTemplateModalOpen && (
        <div
          className={fullPageBundleStyles.templateDialogBackdrop}
          role="presentation"
          onMouseDown={handleSelectTemplateBackdropClick}
          onClick={handleSelectTemplateBackdropClick}
        >
          <div
            className={fullPageBundleStyles.templateDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fpb-template-dialog-title"
            tabIndex={-1}
            ref={selectTemplateModalRef}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleSelectTemplateDialogKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={fullPageBundleStyles.templateDialogHeader}>
              <h2 id="fpb-template-dialog-title" className={fullPageBundleStyles.templateDialogHeading}>
                Customization
              </h2>
              <button
                type="button"
                className={fullPageBundleStyles.templateDialogClose}
                aria-label="Close customization"
                onClick={closeSelectTemplateModal}
              >
                <s-icon name="x" />
              </button>
            </div>
            {templateModalStep === "select" ? (
              <>
                <div className={fullPageBundleStyles.templateDialogBody}>
                  <div className={fullPageBundleStyles.templateDialogIntro}>
                    <div>
                      <h3 className={fullPageBundleStyles.templateDialogSubheading}>Customize your bundle</h3>
                      <p className={fullPageBundleStyles.templateDialogDescription}>
                        Choose a design that suits your needs and fits your brand
                      </p>
                    </div>
                    <s-button variant="secondary" onClick={openDesignControlPanel}>
                      Customize Colors &amp; Language
                    </s-button>
                  </div>
                  {templateSaveError ? (
                    <p role="alert" className={fullPageBundleStyles.templateDialogError}>{templateSaveError}</p>
                  ) : null}
                  <div className={fullPageBundleStyles.templateDialogGrid}>
                    {fullPageTemplateOptions.map((tpl) => {
                      const isSelected = pendingDesignPresetId === tpl.presetId && pendingDesignTemplate === "FBP_SIDE_FOOTER";
                      return (
                        <button
                          key={tpl.presetId}
                          type="button"
                          className={`${fullPageBundleStyles.templateOptionCard} ${isSelected ? fullPageBundleStyles.templateOptionCardSelected : ""}`}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setPendingDesignTemplate("FBP_SIDE_FOOTER");
                            setPendingDesignPresetId(tpl.presetId);
                          }}
                        >
                          <span className={fullPageBundleStyles.templateOptionImageFrame}>
                            <img src={tpl.image} alt={tpl.label} className={fullPageBundleStyles.templateOptionImage} />
                          </span>
                          <span className={fullPageBundleStyles.templateOptionFooter}>
                            <span className={fullPageBundleStyles.templateOptionLabel}>{tpl.label}</span>
                            <span className={`${fullPageBundleStyles.templateOptionAction} ${isSelected ? fullPageBundleStyles.templateOptionActionSelected : ""}`}>
                              {isSelected ? "Selected" : "Select"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={fullPageBundleStyles.templateDialogFooter}>
                  <s-button
                    variant="primary"
                    disabled={!pendingDesignPresetId || undefined}
                    loading={templateFetcher.state === "submitting" || undefined}
                    onClick={handleTemplateNext}
                  >
                    Next
                  </s-button>
                </div>
              </>
            ) : (
              <div className={fullPageBundleStyles.templateDialogBody}>
                <div className={fullPageBundleStyles.templateDialogConfirmHeader}>
                  <h3 className={fullPageBundleStyles.templateDialogSubheading}>View your bundle</h3>
                  <p className={fullPageBundleStyles.templateDialogDescription}>View your bundle with your customizations</p>
                </div>
                <div className={fullPageBundleStyles.templateReadyPanel}>
                  <div className={fullPageBundleStyles.templateReadyIcon}>
                    <s-icon name="check" />
                  </div>
                  <h3 className={fullPageBundleStyles.templateReadyTitle}>Your bundle is ready</h3>
                  <p className={fullPageBundleStyles.templateReadyText}>Preview it now with your customizations</p>
                  <s-button variant="secondary" onClick={handleTemplatePreview}>Preview bundle</s-button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync Bundle Confirmation Modal */}
      <s-modal ref={syncModalRef} heading="Sync Wolfpack bundle?">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14 }}>Syncing refreshes the Shopify data used by this Wolfpack Bundles configuration.</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>The Shopify page will be deleted and re-created</li>
            <li>All bundle and component metafields will be rewritten</li>
          </ul>
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>Bundle analytics are preserved. This action cannot be undone.</p>
        </s-stack>
        <s-button slot="primaryAction" variant="primary" loading={fetcher.state === 'submitting' || undefined} onClick={handleSyncBundleConfirm}>
          Sync bundle
        </s-button>
        <s-button slot="secondaryActions" onClick={() => setIsSyncModalOpen(false)}>Cancel</s-button>
      </s-modal>

      {/* Bundle Quantity Options Multi Language Modal */}
      <s-modal id="discount-bundle-quantity-language-modal" ref={bundleQuantityMultiLangModalRef} heading="Customize Text for Multiple Languages">
        <s-stack direction="block" gap="small">
          {shopLocales.length > 0 && (
            <s-select
              label="Select Language"
              value={activeBundleQuantityLocale}
              onChange={(e: Event) => setActiveBundleQuantityLocale((e.target as HTMLSelectElement).value)}
            >
              {shopLocales.map((loc: { locale: string; name: string; primary: boolean }) => (
                <s-option key={loc.locale} value={loc.locale}>{loc.name}{loc.primary ? " (default)" : ""}</s-option>
              ))}
            </s-select>
          )}
          {normalizedPricingDisplayOptions.bundleQuantityOptions.options.map((option, index) => {
            const localizedOption = pricingState.pricingDisplayOptions.bundleQuantityOptions.optionsByLocaleByRuleId?.[activeBundleQuantityLocale]?.[option.ruleId];
            return (
              <s-section key={option.ruleId}>
                <s-stack direction="block" gap="small-100">
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Rule #{index + 1}</p>
                  <s-text-field
                    label="Box Label"
                    value={localizedOption?.label ?? option.label}
                    onInput={(e: Event) => pricingState.updateLocalizedBundleQuantityOption(
                      activeBundleQuantityLocale,
                      option.ruleId,
                      { label: (e.target as HTMLInputElement).value }
                    )}
                    autoComplete="off"
                  />
                  <s-text-field
                    label="Box Subtext"
                    value={localizedOption?.subtext ?? option.subtext}
                    onInput={(e: Event) => pricingState.updateLocalizedBundleQuantityOption(
                      activeBundleQuantityLocale,
                      option.ruleId,
                      { subtext: (e.target as HTMLInputElement).value }
                    )}
                    autoComplete="off"
                  />
                </s-stack>
              </s-section>
            );
          })}
        </s-stack>
        <s-button slot="primaryAction" onClick={() => setIsBundleQuantityMultiLangModalOpen(false)}>Save and close</s-button>
      </s-modal>

      {/* Progress Bar Multi Language Modal */}
      <s-modal id="discount-progress-language-modal" ref={progressBarMultiLangModalRef} heading="Customize Text for Multiple Languages">
        <s-stack direction="block" gap="small">
          {shopLocales.length > 0 && (
            <s-select
              label="Select Language"
              value={activeProgressBarLocale}
              onChange={(e: Event) => setActiveProgressBarLocale((e.target as HTMLSelectElement).value)}
            >
              {shopLocales.map((loc: { locale: string; name: string; primary: boolean }) => (
                <s-option key={loc.locale} value={loc.locale}>{loc.name}{loc.primary ? " (default)" : ""}</s-option>
              ))}
            </s-select>
          )}
          {pricingState.discountRules.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>Add discount rules to configure tier text.</p>
          ) : pricingState.discountRules.map((rule, index) => (
                            <s-section key={rule.id} className={fullPageBundleStyles.discountRuleCard}>
              <s-stack direction="block" gap="small-100">
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Rule #{index + 1}</p>
                <s-stack direction="inline" gap="small">
                <s-text-area
                  label="Tier Text"
                  value={tierTextByLocaleByRuleId[activeProgressBarLocale]?.[rule.id]?.tierText ?? tierTextByRuleId[rule.id]?.tierText ?? ""}
                  onInput={(e: Event) => {
                    const val = (e.target as HTMLTextAreaElement).value;
                    setTierTextByLocaleByRuleId(prev => ({
                      ...prev,
                      [activeProgressBarLocale]: {
                        ...(prev[activeProgressBarLocale] || {}),
                        [rule.id]: { tierText: val, tierSubtext: prev[activeProgressBarLocale]?.[rule.id]?.tierSubtext ?? tierTextByRuleId[rule.id]?.tierSubtext ?? "" },
                      },
                    }));
                    markAsDirty();
                  }}
                  autoComplete="off"
                  helpText="Short label for this tier (e.g. 'Add 3')"
                />
                <s-text-area
                  label="Tier Subtext"
                  value={tierTextByLocaleByRuleId[activeProgressBarLocale]?.[rule.id]?.tierSubtext ?? tierTextByRuleId[rule.id]?.tierSubtext ?? ""}
                  onInput={(e: Event) => {
                    const val = (e.target as HTMLTextAreaElement).value;
                    setTierTextByLocaleByRuleId(prev => ({
                      ...prev,
                      [activeProgressBarLocale]: {
                        ...(prev[activeProgressBarLocale] || {}),
                        [rule.id]: { tierText: prev[activeProgressBarLocale]?.[rule.id]?.tierText ?? tierTextByRuleId[rule.id]?.tierText ?? "", tierSubtext: val },
                      },
                    }));
                    markAsDirty();
                  }}
                  autoComplete="off"
                  helpText="Detail line below tier label (e.g. '1 Product(s) @ 20% off')"
                />
                </s-stack>
              </s-stack>
            </s-section>
          ))}
        </s-stack>
        <s-button slot="primaryAction" onClick={() => setIsProgressBarMultiLangModalOpen(false)}>Save and close</s-button>
      </s-modal>

      <EnablePreviewModal {...enablePreviewGate.modalProps} />

      </div>
    </>
  );
}
