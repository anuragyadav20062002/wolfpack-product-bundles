import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, useRevalidator } from "@remix-run/react";
import { AppLogger } from "../../../lib/logger";

// Note: Migrated from @shopify/polaris to Polaris web components (s-* and ui-*)
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
import { ERROR_MESSAGES } from "../../../constants/errors";
import { useTranslation } from "react-i18next";
import { HELP_TOOLTIPS, type HelpTooltipKey } from "../../../constants/help-tooltips";
import { FilePicker } from "../../../components/design-control-panel/settings/FilePicker";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
// Using modern App Bridge SaveBar with declarative 'open' prop for React-friendly state management
import { requireAdminSession } from "../../../lib/auth-guards.server";
import db from "../../../db.server";
import { useBundleConfigurationState } from "../../../hooks/useBundleConfigurationState";
import productPageBundleStyles from "../../../styles/routes/product-page-bundle-configure.module.css";
import { UnlistedBundleBanner } from "../../../components/UnlistedBundleBanner";
import { EnablePreviewModal } from "../../../components/EnablePreviewModal";
import { useEnablePreviewGate } from "../../../hooks/useEnablePreviewGate";
import { pickPpbPreviewUrl } from "../../../lib/ppb-preview-url";

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
  handleValidateWidgetPlacement,
  handleUpdateBundleDesignTemplate,
  handleValidateSellingPlanGroups,
} from "./handlers";

// Types - extracted to separate module for better organization
import type { LoaderData, BundleProductCardProps } from "./types";
import { BundleReadinessOverlay, type BundleReadinessItem } from "../../../components/bundle-configure/BundleReadinessOverlay";
import {
  MultiLanguageTextModal,
  type MultiLanguageField,
} from "../../../components/bundle-configure/MultiLanguageTextModal";
import { DiscardChangesModal } from "../../../components/bundle-configure/DiscardChangesModal";
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
import {
  DEFAULT_PROGRESS_BAR_PROGRESS_TEXT,
  DEFAULT_PROGRESS_BAR_SUCCESS_TEXT,
  getDefaultDiscountRuleSuccessMessage,
  getDefaultDiscountRuleText,
} from "../../../lib/pricing-display-options";
import {
  INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE,
  PRODUCT_PAGE_EDIT_DEFAULTS_HREF,
  PRODUCT_PAGE_SETUP_ITEMS,
  SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
  buildProductPageThemeEditorDeepLink,
} from "../../../lib/bundle-config/product-page-admin-sections";
import {
  buildDefaultProductEntryFromPicker,
  normalizeDefaultProductsData,
  type DefaultProductsData,
} from "../../../lib/bundle-config/default-products";

declare global {
  interface Window {
    shopify?: { config?: { shop?: string } };
  }
}

interface SubscriptionValidationResponse {
  success: boolean;
  isValid?: boolean;
  productCount?: number;
  plans?: Array<{ id: string; name: string }>;
  message?: string | null;
  error?: string;
}

type IndividualSellingPlanShowFor = "ALL_PRODUCTS" | "OOS_PRODUCTS";

// showPolarisModal / hidePolarisModal imported from _shared/bundle-configure/modal-utils

const ADDON_TEMPLATE_VARIABLES: [string, string][] = [
  ["{{addonsConditionDiff}}", "The remaining quantity a customer needs to add to unlock the add-on discount."],
  ["{{addonsDiscountValue}}", "The numerical value of the add-on discount (e.g. the '10' in 10% off)."],
  ["{{addonsDiscountValueUnit}}", "The unit symbol for the add-on discount (% or $)."],
];

const DISCOUNT_TEMPLATE_VARIABLES: [string, string][] = [
  ["{{discountConditionDiff}}", "The remaining quantity or monetary amount a customer needs to add to their cart to unlock the discount."],
  ["{{discountUnit}}", "The symbol for the discount requirement, such as your store's currency symbol ($) for amount-based rules."],
  ["{{discountValue}}", "The numerical value of the discount reward itself (e.g., the '10' in a 10% or $10 discount)."],
  ["{{discountValueUnit}}", "The symbol used for the discount reward, such as the percent sign (%) or the store's currency symbol ($)."],
  ["{{discountedItems}}", "The quantity of items that will be discounted or given free as part of the \"Get Y\" offer."],
];

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
  // File: extensions/bundle-builder/blocks/bundle-product-page.liquid
  const blockHandle = 'bundle-product-page';

  const [bundleProduct, shopLocales, embedData] = await Promise.all([
    bundle.shopifyProductId
      ? fetchBundleProduct(admin, bundle.shopifyProductId, bundleId)
      : Promise.resolve(null),
    fetchShopLocales(admin),
    fetchEmbedData(admin, session.shop, apiKey, "bundle-app-embed"),
  ]);

  return json({
    bundle,
    bundleProduct,
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
      case "validateWidgetPlacement":
        return await handleValidateWidgetPlacement(admin, session, bundleId);
      case "syncBundle":
        return await handleSyncBundle(admin, session, bundleId);
      case "updateBundleDesignTemplate":
        return await handleUpdateBundleDesignTemplate(admin, session, bundleId, formData);
      case "validateSellingPlanGroups":
        return await handleValidateSellingPlanGroups(admin, session, bundleId);
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

// Handler functions have been extracted to ./app.bundles.product-page-bundle.configure.$bundleId/handlers/

// Static navigation items - moved outside component to prevent recreation on every render
const bundleSetupItems = PRODUCT_PAGE_SETUP_ITEMS;

const bundleVisibilityChildItems = [
  { id: "bundle_widget", label: "Bundle Widget" },
  { id: "bundle_embed",  label: "Bundle Embed"  },
];

const productPageTemplateOptions = [
  { presetId: "CASCADE", layoutTemplate: "PDP_INPAGE", label: "Product List", image: "/productPageThumbnail.png" },
  { presetId: "COGNIVE", layoutTemplate: "PDP_INPAGE", label: "Product Grid", image: "/fullPageThumbnail.png" },
  { presetId: "MODAL", layoutTemplate: "PDP_MODAL", label: "Horizontal Slots", image: "/sidePanelThumbnail.png" },
  { presetId: "SIMPLIFIED", layoutTemplate: "PDP_MODAL", label: "Vertical Slots", image: "/floatingCardThumbnail.png" },
] as const;

const PPB_DESIGN_CONTROL_PANEL_URL = "/app/design-control-panel?modal=product_page&section=globalColors";

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

// Memoized Bundle Product Card component to prevent unnecessary re-renders
const BundleProductCard = memo(({ bundleProduct, productImageUrl, productTitle, onSync, onSelect, onOpenProduct }: BundleProductCardProps) => (
  <s-section>
    <s-stack direction="block" gap="small">
      <s-stack direction="inline" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          Bundle Product
        </h3>
        <s-button
          variant="plain"
          tone="critical"
          onClick={onSync}
        >
          Sync Product
        </s-button>
      </s-stack>

      {bundleProduct ? (
        <s-stack direction="block" gap="small">
          <s-stack direction="inline" gap="small" style={{ alignItems: "center", flexWrap: "nowrap" }}>
            <img
              src={productImageUrl || "/bundle.png"}
              alt={productTitle || "Bundle Product"}
              style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
            />
            <s-stack direction="inline" gap="small-100" style={{ alignItems: "center", flexWrap: "nowrap" }}>
              <s-button
                variant="plain"
                onClick={onOpenProduct}
                disabled={!onOpenProduct}
              >
                <s-icon name="external-minor" />
                {productTitle || bundleProduct.title || "Untitled Product"}
              </s-button>
              <s-button
                variant="tertiary"
                onClick={onSelect}
                aria-label="Change bundle product"
              >
                <s-icon name="refresh-minor" />
              </s-button>
            </s-stack>
          </s-stack>
        </s-stack>
      ) : (
        <div className={productPageBundleStyles.productSelectionPlaceholder}>
          <s-stack direction="block" gap="small-400" style={{ alignItems: "center" }}>
            <s-icon name="product-minor" />
            <s-button
              variant="plain"
              onClick={onSelect}
            >
              Select Bundle Product
            </s-button>
          </s-stack>
        </div>
      )}
    </s-stack>
  </s-section>
));

BundleProductCard.displayName = 'BundleProductCard';

// BundleStatusSection imported from _shared/bundle-configure/BundleStatusSection

function QuestionHelpTooltip({ tooltipKey }: { tooltipKey: HelpTooltipKey }) {
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
      className={productPageBundleStyles.richHelp}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <s-button
        variant="plain"
        icon="info"
        accessibilityLabel={title || description}
        className={productPageBundleStyles.richHelpTrigger}
      />
      <span
        className={`${productPageBundleStyles.richHelpCard} ${productPageBundleStyles.richHelpCardFloating}`}
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
        {tooltip.visual && <span className={productPageBundleStyles.richHelpImagePlaceholder} />}
        {title && <span className={productPageBundleStyles.richHelpTitle}>{title}</span>}
        <span className={productPageBundleStyles.richHelpDescription}>{description}</span>
      </span>
    </span>
  );
}

function VisibilityBadge({ isOptimised }: { isOptimised: boolean }) {
  const { t } = useTranslation();
  const description = t(`tooltips.bundleVisibilityPending.description`);
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
      className={isOptimised ? productPageBundleStyles.optimisedBadge : productPageBundleStyles.pendingBadge}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      tabIndex={0}
      aria-label={`${isOptimised ? 'Optimised' : 'Pending'} — ${description}`}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      {isOptimised ? 'Optimised' : 'Pending'}
      <svg width="11" height="11" viewBox="0 0 13 13" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6.5" cy="6.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6.5" y1="5.75" x2="6.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="6.5" cy="4.25" r="0.75" fill="currentColor" />
      </svg>
      {tooltipPos && (
        <span
          className={productPageBundleStyles.pendingTooltipCard}
          style={{ position: "fixed", top: tooltipPos.top, right: tooltipPos.right }}
          role="tooltip"
        >
          {description}
        </span>
      )}
    </span>
  );
}

export default function ConfigureBundleFlow() {
  const loaderData = useLoaderData<LoaderData>();
  const bundle = loaderData.bundle as unknown as import("../../../hooks/useBundleConfigurationState").BundleData & {
    loadingGif?: string | null;
    shopifyProductHandle?: string;
  };
  const { bundleProduct: loadedBundleProduct, shop, apiKey, blockHandle, shopLocales = [], appEmbedEnabled = true, themeEditorUrl = null } = loaderData as any;
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();
  const subscriptionFetcher = useFetcher<SubscriptionValidationResponse>();
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
    activeSection,
    setActiveSection,
    forceNavigation,

    // Original values ref
    originalValuesRef,
  } = configState;


  // Loading GIF state
  const [loadingGif, setLoadingGif] = useState<string | null>(bundle.loadingGif ?? null);
  const originalLoadingGifRef = useRef<string | null>(bundle.loadingGif ?? null);

  // Bundle Settings state
  const [showProductPrices, setShowProductPrices] = useState<boolean>((bundle as any).showProductPrices ?? true);
  const originalShowProductPricesRef = useRef<boolean>((bundle as any).showProductPrices ?? true);
  const [showCompareAtPrices, setShowCompareAtPrices] = useState<boolean>((bundle as any).showCompareAtPrices ?? false);
  const originalShowCompareAtPricesRef = useRef<boolean>((bundle as any).showCompareAtPrices ?? false);
  const [cartRedirectToCheckout, setCartRedirectToCheckout] = useState<boolean>((bundle as any).cartRedirectToCheckout ?? false);
  const originalCartRedirectToCheckoutRef = useRef<boolean>((bundle as any).cartRedirectToCheckout ?? false);
  const [allowQuantityChanges, setAllowQuantityChanges] = useState<boolean>((bundle as any).allowQuantityChanges ?? true);
  const originalAllowQuantityChangesRef = useRef<boolean>((bundle as any).allowQuantityChanges ?? true);
  const [sdkMode, setSdkMode] = useState<boolean>((bundle as any).sdkMode ?? false);
  const originalSdkModeRef = useRef<boolean>((bundle as any).sdkMode ?? false);

  // Text overrides state (Messages tab)
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>(
    ((bundle as any).textOverrides as Record<string, string>) ?? {}
  );
  const originalTextOverridesRef = useRef<Record<string, string>>(
    ((bundle as any).textOverrides as Record<string, string>) ?? {}
  );
  const [textOverridesByLocale, setTextOverridesByLocale] = useState<Record<string, Record<string, string>>>(
    ((bundle as any).textOverridesByLocale as Record<string, Record<string, string>>) ?? {}
  );
  const originalTextOverridesByLocaleRef = useRef<Record<string, Record<string, string>>>(
    ((bundle as any).textOverridesByLocale as Record<string, Record<string, string>>) ?? {}
  );
  const [textOverridesLocale, setTextOverridesLocale] = useState<string>("en");
  const [multiLanguageFields, setMultiLanguageFields] = useState<MultiLanguageField[]>([]);
  const [multiLanguageTitle, setMultiLanguageTitle] = useState("Multi Language");
  const [isMultiLanguageModalOpen, setIsMultiLanguageModalOpen] = useState(false);
  const [multiLanguageTarget, setMultiLanguageTarget] = useState<StepSetupMultiLanguageTarget>({ type: "text-overrides" });

  // Bundle Visibility — Bundle Widget state (FR-04)
  const savedBundleUpsellConfig = ((bundle as any).bundleUpsellConfig ?? null) as any;
  const savedWidgetConfiguration = savedBundleUpsellConfig?.widgetConfiguration;
  const savedUpsellConfiguration = savedBundleUpsellConfig?.upsellConfiguration;
  const savedWidgetDisplayConfiguration = savedWidgetConfiguration?.displayConfiguration;
  const savedEmbedDisplayConfiguration = savedUpsellConfiguration?.displayConfiguration;
  const [upsellWidgetEnabled, setUpsellWidgetEnabled] = useState<boolean>(savedWidgetConfiguration?.isEnabled ?? (bundle as any).upsellWidgetEnabled ?? false);
  const [upsellWidgetDisplayMode, setUpsellWidgetDisplayMode] = useState<string>((bundle as any).upsellWidgetDisplayMode ?? "button");
  const [upsellWidgetDisplayOn, setUpsellWidgetDisplayOn] = useState<string>(
    (bundle as any).upsellWidgetDisplayOn ?? getVisibilityDisplayTarget(savedWidgetDisplayConfiguration, "all")
  );
  const [upsellWidgetTitle, setUpsellWidgetTitle] = useState<string>(savedWidgetConfiguration?.title ?? "Bundle & Save");
  const [upsellWidgetDescription, setUpsellWidgetDescription] = useState<string>(savedWidgetConfiguration?.description ?? "");
  const [upsellWidgetButtonText, setUpsellWidgetButtonText] = useState<string>(savedWidgetConfiguration?.buttonText ?? "Buy With Bundle");
  const [upsellWidgetImageUrl, setUpsellWidgetImageUrl] = useState<string>(savedWidgetConfiguration?.imageUrl ?? "");
  const [upsellWidgetSelectedProducts, setUpsellWidgetSelectedProducts] = useState<unknown[]>(asVisibilityArray(savedWidgetDisplayConfiguration?.selectedProducts));
  const [upsellWidgetSpecificProductPages, setUpsellWidgetSpecificProductPages] = useState<unknown[]>(asVisibilityArray(savedWidgetDisplayConfiguration?.showOnSpecificProductPages));
  const [upsellWidgetCollectionsSelectedData, setUpsellWidgetCollectionsSelectedData] = useState<unknown[]>(asVisibilityArray(savedWidgetDisplayConfiguration?.collectionsSelectedData));
  const [upsellWidgetSpecificCollectionPages, setUpsellWidgetSpecificCollectionPages] = useState<unknown[]>(asVisibilityArray(savedWidgetDisplayConfiguration?.showOnSpecificCollectionPages));
  const [autoSelectBrowsedProduct, setAutoSelectBrowsedProduct] = useState<boolean>(
    savedWidgetConfiguration?.useLinkProductAsDefaultProduct ?? (bundle as any).autoSelectBrowsedProduct ?? false
  );
  const [bundleEmbedEnabled, setBundleEmbedEnabled] = useState<boolean>(savedUpsellConfiguration?.isEnabled ?? textOverrides.bundleEmbedEnabled === "true");
  const [bundleEmbedTitle, setBundleEmbedTitle] = useState<string>(savedUpsellConfiguration?.title ?? textOverrides.embedTitle ?? "Build Your Bundle & Save More");
  const [bundleEmbedSubTitle, setBundleEmbedSubTitle] = useState<string>(savedUpsellConfiguration?.subTitle ?? textOverrides.embedSubTitle ?? "");
  const [bundleEmbedDisplayOn, setBundleEmbedDisplayOn] = useState<string>(
    textOverrides.embedDisplayOn ?? getVisibilityDisplayTarget(savedEmbedDisplayConfiguration, "all_products")
  );
  const [bundleEmbedAddBrowsedProduct, setBundleEmbedAddBrowsedProduct] = useState<boolean>(
    savedUpsellConfiguration?.useLinkProductAsDefaultProduct ?? textOverrides.embedAddBrowsedProduct === "true"
  );
  const [bundleEmbedSelectedProducts, setBundleEmbedSelectedProducts] = useState<unknown[]>(asVisibilityArray(savedEmbedDisplayConfiguration?.selectedProducts));
  const [bundleEmbedSpecificProductPages, setBundleEmbedSpecificProductPages] = useState<unknown[]>(asVisibilityArray(savedEmbedDisplayConfiguration?.showOnSpecificProductPages));
  const [bundleEmbedCollectionsSelectedData, setBundleEmbedCollectionsSelectedData] = useState<unknown[]>(asVisibilityArray(savedEmbedDisplayConfiguration?.collectionsSelectedData));
  const [bundleEmbedSpecificCollectionPages, setBundleEmbedSpecificCollectionPages] = useState<unknown[]>(asVisibilityArray(savedEmbedDisplayConfiguration?.showOnSpecificCollectionPages));

  const originalUpsellWidgetEnabledRef = useRef<boolean>(savedWidgetConfiguration?.isEnabled ?? (bundle as any).upsellWidgetEnabled ?? false);
  const originalUpsellWidgetDisplayModeRef = useRef<string>((bundle as any).upsellWidgetDisplayMode ?? "button");
  const originalUpsellWidgetDisplayOnRef = useRef<string>((bundle as any).upsellWidgetDisplayOn ?? getVisibilityDisplayTarget(savedWidgetDisplayConfiguration, "all"));
  const originalUpsellWidgetTitleRef = useRef<string>(savedWidgetConfiguration?.title ?? "Bundle & Save");
  const originalUpsellWidgetDescriptionRef = useRef<string>(savedWidgetConfiguration?.description ?? "");
  const originalUpsellWidgetButtonTextRef = useRef<string>(savedWidgetConfiguration?.buttonText ?? "Buy With Bundle");
  const originalUpsellWidgetImageUrlRef = useRef<string>(savedWidgetConfiguration?.imageUrl ?? "");
  const originalAutoSelectBrowsedProductRef = useRef<boolean>(savedWidgetConfiguration?.useLinkProductAsDefaultProduct ?? (bundle as any).autoSelectBrowsedProduct ?? false);
  const originalBundleEmbedEnabledRef = useRef<boolean>(savedUpsellConfiguration?.isEnabled ?? (bundle as any).textOverrides?.bundleEmbedEnabled === "true");
  const originalBundleEmbedTitleRef = useRef<string>(savedUpsellConfiguration?.title ?? (bundle as any).textOverrides?.embedTitle ?? "Build Your Bundle & Save More");
  const originalBundleEmbedSubTitleRef = useRef<string>(savedUpsellConfiguration?.subTitle ?? (bundle as any).textOverrides?.embedSubTitle ?? "");
  const originalBundleEmbedDisplayOnRef = useRef<string>((bundle as any).textOverrides?.embedDisplayOn ?? getVisibilityDisplayTarget(savedEmbedDisplayConfiguration, "all_products"));
  const originalBundleEmbedAddBrowsedProductRef = useRef<boolean>(savedUpsellConfiguration?.useLinkProductAsDefaultProduct ?? (bundle as any).textOverrides?.embedAddBrowsedProduct === "true");

  // FR-02: Gift Messages state
  const [giftMessagesEnabled, setGiftMessagesEnabled] = useState<boolean>((bundle as any).giftMessagesEnabled ?? false);
  const [giftMessageProductId, setGiftMessageProductId] = useState<string | null>((bundle as any).giftMessageProductId ?? null);
  const [giftMessageProductTitle, setGiftMessageProductTitle] = useState<string | null>((bundle as any).giftMessageProductTitle ?? null);
  const [giftMessageEnableSenderRecipient, setGiftMessageEnableSenderRecipient] = useState<boolean>((bundle as any).giftMessageEnableSenderRecipient ?? false);
  const [giftMessageMandatory, setGiftMessageMandatory] = useState<boolean>((bundle as any).giftMessageMandatory ?? false);
  const [giftMessageEnableLimit, setGiftMessageEnableLimit] = useState<boolean>((bundle as any).giftMessageEnableLimit ?? false);
  const [giftMessageCharLimit, setGiftMessageCharLimit] = useState<string>((bundle as any).giftMessageCharLimit?.toString() ?? "");
  const [giftMessageSendEmail, setGiftMessageSendEmail] = useState<boolean>((bundle as any).giftMessageSendEmail ?? false);

  // FR-03: Display options state (Quantity Options + Progress Bar)
  const _savedDisplayOpts = (bundle as any).pricing?.displayOptions ?? {};
  const savedQuantityOptionsByRuleId = (_savedDisplayOpts?.bundleQuantityOptions?.optionsByRuleId ?? {}) as Record<string, { label?: string; subtext?: string }>;
  const [qtyOptionsEnabled, setQtyOptionsEnabled] = useState<boolean>(_savedDisplayOpts?.bundleQuantityOptions?.enabled === true);
  const [qtyOptionsDefaultRuleId, setQtyOptionsDefaultRuleId] = useState<string | null>(_savedDisplayOpts?.bundleQuantityOptions?.defaultRuleId ?? null);
  const [qtyRuleLabels, setQtyRuleLabels] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(savedQuantityOptionsByRuleId).map(([ruleId, option]) => [ruleId, option.label ?? ""]))
  );
  const [qtyRuleSubtexts, setQtyRuleSubtexts] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(savedQuantityOptionsByRuleId).map(([ruleId, option]) => [ruleId, option.subtext ?? ""]))
  );
  const [qtyRuleTextsByLocaleByRuleId, setQtyRuleTextsByLocaleByRuleId] = useState<Record<string, Record<string, { label: string; subtext: string }>>>(
    _savedDisplayOpts?.bundleQuantityOptions?.optionsByLocaleByRuleId ?? {}
  );
  const [progressBarEnabled, setProgressBarEnabled] = useState<boolean>(_savedDisplayOpts?.progressBar?.enabled === true);
  const [progressBarType, setProgressBarType] = useState<string>(_savedDisplayOpts?.progressBar?.type ?? "step_based");
  const [progressBarProgressText] = useState<string>(_savedDisplayOpts?.progressBar?.progressText ?? DEFAULT_PROGRESS_BAR_PROGRESS_TEXT);
  const [progressBarSuccessText] = useState<string>(_savedDisplayOpts?.progressBar?.successText ?? DEFAULT_PROGRESS_BAR_SUCCESS_TEXT);

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

  const [discountMessagingMultiLanguageEnabled, setDiscountMessagingMultiLanguageEnabled] = useState<boolean>(
    !!(bundle as any).pricing?.ruleMessagesByLocale
  );
  const [ruleMessagesByLocale, setRuleMessagesByLocale] = useState<Record<string, Record<string, { discountText: string; successMessage: string }>>>(
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

  // FR-05: Bundle Settings — new sub-sections
  const [preSelectedProductVariantId, setPreSelectedProductVariantId] = useState<string>((bundle as any).preSelectedProductVariantId ?? "");
  const [maxQtyPerProduct, setMaxQtyPerProduct] = useState<string>((bundle as any).maxQtyPerProduct?.toString() ?? "");
  const [productSlotsEnabled, setProductSlotsEnabled] = useState<boolean>((bundle as any).productSlotsEnabled ?? false);
  const [productSlotIconUrl, setProductSlotIconUrl] = useState<string>((bundle as any).productSlotIconUrl ?? "");
  const [variantSelectorEnabled, setVariantSelectorEnabled] = useState<boolean>((bundle as any).variantSelectorEnabled ?? true);
  const [showTextOnAddButton, setShowTextOnAddButton] = useState<boolean>((bundle as any).showTextOnAddButton ?? false);
  const [bundleCartTitle, setBundleCartTitle] = useState<string>((bundle as any).bundleCartTitle ?? "");
  const [bundleCartSubtitle, setBundleCartSubtitle] = useState<string>((bundle as any).bundleCartSubtitle ?? "");
  const [bundleBannerDesktopUrl, setBundleBannerDesktopUrl] = useState<string>((bundle as any).bundleBannerDesktopUrl ?? "");
  const [bundleBannerMobileUrl, setBundleBannerMobileUrl] = useState<string>((bundle as any).bundleBannerMobileUrl ?? "");
  const [bundleLevelCss, setBundleLevelCss] = useState<string>((bundle as any).bundleLevelCss ?? "");
  const [bundleLevelCssExpanded, setBundleLevelCssExpanded] = useState(false);
  const initialDefaultProductsData = useMemo(
    () => normalizeDefaultProductsData((bundle as any).defaultProductsData),
    [bundle]
  );
  const [defaultProductsData, setDefaultProductsData] = useState<DefaultProductsData>(initialDefaultProductsData);
  const originalDefaultProductsDataRef = useRef<DefaultProductsData>(initialDefaultProductsData);
  const [individualSellingPlanEnabled, setIndividualSellingPlanEnabled] = useState<boolean>(
    ((bundle as any).individualSellingPlanSelection as { isEnabled?: boolean } | null)?.isEnabled === true
  );
  const [individualSellingPlanShowFor, setIndividualSellingPlanShowFor] = useState<IndividualSellingPlanShowFor>(
    ((bundle as any).individualSellingPlanSelection as { showFor?: unknown } | null)?.showFor === "OOS_PRODUCTS"
      ? "OOS_PRODUCTS"
      : "ALL_PRODUCTS"
  );

  // Select Template state (main = DB-synced; pending = overlay working copy)
  const [bundleDesignTemplate, setBundleDesignTemplate] = useState<string | null>((bundle as any).bundleDesignTemplate ?? null);
  const [bundleDesignPresetId, setBundleDesignPresetId] = useState<string | null>((bundle as any).bundleDesignPresetId ?? null);
  const [pendingDesignTemplate, setPendingDesignTemplate] = useState<string | null>(null);
  const [pendingDesignPresetId, setPendingDesignPresetId] = useState<string | null>(null);

  // Select Template dialog state
  const [isSelectTemplateModalOpen, setIsSelectTemplateModalOpen] = useState(false);
  const [templateModalStep, setTemplateModalStep] = useState<"select" | "confirm">("select");
  const templateFetcher = useFetcher();
  const selectTemplateDialogRef = useRef<HTMLDivElement>(null);
  const selectTemplateOpenButtonRef = useRef<HTMLButtonElement>(null);
  const [templateSaveError, setTemplateSaveError] = useState<string | null>(null);
  const lastTemplateRequestRef = useRef<{ template: string | null; presetId: string | null } | null>(null);
  const lastTemplateResponseRef = useRef<unknown>(null);

  // Sync Bundle modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeAssetTabIndex, setActiveAssetTabIndex] = useState(0);
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
    const category = (((step as any)?.StepCategory as any[] | undefined) ?? [])[categoryIndex];
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
      const category = (((step as any)?.StepCategory as any[] | undefined) ?? [])[multiLanguageTarget.categoryIndex];
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
      const categories = (((step as any)?.StepCategory as any[] | undefined) ?? []);
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

  // Add-Ons icon picker state
  const [showIconPickerForStep, setShowIconPickerForStep] = useState<string | null>(null);

  // Category accordion state for the multi-category configure surface
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({});
  const [categoryActiveTabs, setCategoryActiveTabs] = useState<Record<string, number>>({});
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

  // Template variables modal ref (for Footer Messaging "Show Variables")
  const templateVariablesModalRef = useRef<HTMLElement>(null);
  const discountVariablesModalRef = useRef<HTMLElement>(null);
  const [isDiscountVariablesModalOpen, setIsDiscountVariablesModalOpen] = useState(false);

  const bundleQuantityOptionsEligible = pricingState.discountType !== DiscountMethod.BUY_X_GET_Y
    && pricingState.discountRules.length > 0
    && pricingState.discountRules.every((rule: PricingRule) => rule.conditionType === "quantity");
  const displayOptionsInactive = !pricingState.discountEnabled || pricingState.discountRules.length === 0;

  useEffect(() => {
    if (!bundleQuantityOptionsEligible && qtyOptionsEnabled) {
      setQtyOptionsEnabled(false);
      markAsDirty();
    }
  }, [bundleQuantityOptionsEligible, qtyOptionsEnabled, markAsDirty]);

  // Step chip navigation
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const buildDefaultProductsData = useCallback(() => {
    return normalizeDefaultProductsData(defaultProductsData);
  }, [defaultProductsData]);

  function buildBundleUpsellConfig() {
    return {
      multiLangText: savedBundleUpsellConfig?.multiLangText ?? {},
      widgetConfiguration: {
        isEnabled: upsellWidgetEnabled,
        type: "OFFER_WIDGET",
        imageUrl: upsellWidgetImageUrl,
        title: upsellWidgetTitle,
        description: upsellWidgetDescription,
        buttonText: upsellWidgetButtonText,
        displayConfiguration: buildVisibilityDisplayConfiguration(upsellWidgetDisplayOn, upsellWidgetSelectedProducts, upsellWidgetSpecificProductPages, upsellWidgetCollectionsSelectedData, upsellWidgetSpecificCollectionPages),
        useLinkProductAsDefaultProduct: autoSelectBrowsedProduct,
      },
      upsellConfiguration: {
        isEnabled: bundleEmbedEnabled,
        title: bundleEmbedTitle,
        subTitle: bundleEmbedSubTitle,
        displayConfiguration: buildVisibilityDisplayConfiguration(bundleEmbedDisplayOn, bundleEmbedSelectedProducts, bundleEmbedSpecificProductPages, bundleEmbedCollectionsSelectedData, bundleEmbedSpecificCollectionPages),
        useLinkProductAsDefaultProduct: bundleEmbedAddBrowsedProduct,
      },
    };
  }

  // Step chip navigation slide animation
  const [slideKey, setSlideKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"forward" | "backward" | null>(null);

  // Add to Storefront install state
  // Treat as already installed if bundle already has a Shopify product (saved at least once)
  const [widgetInstalled, setWidgetInstalled] = useState(!!bundle.shopifyProductId);

  // SaveBar visibility controlled by isDirty flag - no complex change detection needed!

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      // Prepare form data for submission
      const formData = new FormData();
      formData.append("intent", "saveBundle");
      formData.append("bundleName", formState.bundleName);
      formData.append("bundleDescription", formState.bundleDescription);
      formData.append("templateName", formState.templateName);
      formData.append("bundleStatus", formState.bundleStatus);
      // Merge collections data into steps before saving
      const stepsWithCollections = stepsState.steps.map(step => ({
        ...step,
        collections: selectedCollections[step.id] || step.collections || []
      }));

      formData.append("stepsData", JSON.stringify(stepsWithCollections));
      const enrichedRuleMessages = Object.fromEntries(
        Object.entries(ruleMessages).map(([id, msg]) => [
          id,
          { ...msg, successMessage: globalSuccessMessage || msg.successMessage },
        ])
      );
      formData.append("discountData", JSON.stringify({
        discountEnabled: pricingState.discountEnabled,
        discountType: pricingState.discountType,
        discountRules: pricingState.discountRules,
        showFooter: pricingState.showFooter,
        discountMessagingEnabled: pricingState.discountMessagingEnabled,
        ruleMessages: enrichedRuleMessages,
        successMessage: globalSuccessMessage,
        successMessageByLocale: discountMessagingMultiLanguageEnabled ? successMessageByLocale : null,
        discountMessagingMultiLanguageEnabled,
        ruleMessagesByLocale: discountMessagingMultiLanguageEnabled ? ruleMessagesByLocale : null,
        tierTextByRuleId: Object.keys(tierTextByRuleId).length > 0 ? tierTextByRuleId : null,
        tierTextByLocaleByRuleId: Object.keys(tierTextByLocaleByRuleId).length > 0 ? tierTextByLocaleByRuleId : null,
        displayOptions: {
          bundleQuantityOptions: {
            enabled: qtyOptionsEnabled,
            defaultRuleId: qtyOptionsDefaultRuleId,
            optionsByRuleId: Object.fromEntries(
              pricingState.discountRules.map((r: any) => [
                r.id,
                { label: qtyRuleLabels[r.id] ?? `Box of ${r.conditionValue ?? ''}`, subtext: qtyRuleSubtexts[r.id] ?? '' },
              ])
            ),
            optionsByLocaleByRuleId: qtyRuleTextsByLocaleByRuleId,
          },
          progressBar: {
            enabled: progressBarEnabled,
            type: progressBarType,
            progressText: progressBarProgressText,
            successText: progressBarSuccessText,
          },
        },
      }));
      formData.append("stepConditions", JSON.stringify(conditionsState.stepConditions));
      formData.append("bundleProduct", JSON.stringify(bundleProduct));
      formData.append("loadingGif", loadingGif ?? "");
      formData.append("showProductPrices", String(showProductPrices));
      formData.append("showCompareAtPrices", String(showCompareAtPrices));
      formData.append("cartRedirectToCheckout", String(cartRedirectToCheckout));
      formData.append("allowQuantityChanges", String(allowQuantityChanges));
      formData.append("sdkMode", String(sdkMode));
      formData.append("textOverrides", Object.keys(textOverrides).length > 0 ? JSON.stringify(textOverrides) : "");
      formData.append("textOverridesByLocale", Object.keys(textOverridesByLocale).length > 0 ? JSON.stringify(textOverridesByLocale) : "");
      // FR-04: Bundle Visibility — Bundle Widget
      formData.append("upsellWidgetEnabled", String(upsellWidgetEnabled));
      formData.append("upsellWidgetDisplayMode", upsellWidgetDisplayMode);
      formData.append("upsellWidgetDisplayOn", upsellWidgetDisplayOn);
      formData.append("autoSelectBrowsedProduct", String(autoSelectBrowsedProduct));
      // FR-02: Gift Messages
      formData.append("giftMessagesEnabled", String(giftMessagesEnabled));
      formData.append("giftMessageProductId", giftMessageProductId ?? "");
      formData.append("giftMessageProductTitle", giftMessageProductTitle ?? "");
      formData.append("giftMessageEnableSenderRecipient", String(giftMessageEnableSenderRecipient));
      formData.append("giftMessageMandatory", String(giftMessageMandatory));
      formData.append("giftMessageEnableLimit", String(giftMessageEnableLimit));
      formData.append("giftMessageCharLimit", giftMessageCharLimit);
      formData.append("giftMessageSendEmail", String(giftMessageSendEmail));
      // FR-05: Bundle Settings
      formData.append("preSelectedProductVariantId", preSelectedProductVariantId);
      formData.append("maxQtyPerProduct", maxQtyPerProduct);
      formData.append("productSlotsEnabled", String(productSlotsEnabled));
      formData.append("productSlotIconUrl", productSlotIconUrl);
      formData.append("variantSelectorEnabled", String(variantSelectorEnabled));
      formData.append("showTextOnAddButton", String(showTextOnAddButton));
      formData.append("bundleCartTitle", bundleCartTitle);
      formData.append("bundleCartSubtitle", bundleCartSubtitle);
      formData.append("bundleBannerDesktopUrl", bundleBannerDesktopUrl);
      formData.append("bundleBannerMobileUrl", bundleBannerMobileUrl);
      formData.append("bundleLevelCss", bundleLevelCss);
      formData.append("defaultProductsData", JSON.stringify(buildDefaultProductsData()));
      formData.append("validateQuantityPerProduct", JSON.stringify({
        isEnabled: productSlotsEnabled,
        allowedQuantity: Number.parseInt(maxQtyPerProduct || "1", 10) || 1,
      }));
      formData.append("individualSellingPlanSelection", JSON.stringify({
        isEnabled: pricingState.discountType === DiscountMethod.BUY_X_GET_Y ? false : individualSellingPlanEnabled,
        showFor: individualSellingPlanShowFor,
      }));
      formData.append("bundleTextConfig", JSON.stringify({
        bundleSummary: {
          title: bundleCartTitle,
          subTitle: bundleCartSubtitle,
        },
      }));
      formData.append("boxSelection", (bundle as any).boxSelection ? JSON.stringify((bundle as any).boxSelection) : "");
      formData.append("bundleUpsellConfig", JSON.stringify(buildBundleUpsellConfig()));
      formData.append("discountDisplayOverride", (bundle as any).discountDisplayOverride ? JSON.stringify((bundle as any).discountDisplayOverride) : "");
      formData.append("useSingleStepCategoriesAsBundleSteps", String((bundle as any).useSingleStepCategoriesAsBundleSteps ?? false));

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
    pricingState.discountMessagingEnabled,
    ruleMessages,
    qtyOptionsEnabled,
    qtyOptionsDefaultRuleId,
    qtyRuleLabels,
    qtyRuleSubtexts,
    qtyRuleTextsByLocaleByRuleId,
    progressBarEnabled,
    progressBarType,
    progressBarProgressText,
    progressBarSuccessText,
    discountMessagingMultiLanguageEnabled,
    successMessageByLocale,
    ruleMessagesByLocale,
    tierTextByRuleId,
    tierTextByLocaleByRuleId,
    globalSuccessMessage,
    selectedCollections,
    conditionsState.stepConditions,
    bundleProduct,
    productStatus,
    loadingGif,
    textOverrides,
    textOverridesByLocale,
    buildDefaultProductsData,
    savedBundleUpsellConfig,
    upsellWidgetEnabled,
    upsellWidgetDisplayMode,
    upsellWidgetDisplayOn,
    upsellWidgetTitle,
    upsellWidgetDescription,
    upsellWidgetButtonText,
    upsellWidgetImageUrl,
    upsellWidgetSelectedProducts,
    upsellWidgetSpecificProductPages,
    upsellWidgetCollectionsSelectedData,
    upsellWidgetSpecificCollectionPages,
    autoSelectBrowsedProduct,
    bundleEmbedEnabled,
    bundleEmbedTitle,
    bundleEmbedSubTitle,
    bundleEmbedDisplayOn,
    bundleEmbedSelectedProducts,
    bundleEmbedSpecificProductPages,
    bundleEmbedCollectionsSelectedData,
    bundleEmbedSpecificCollectionPages,
    bundleEmbedAddBrowsedProduct,
    productSlotsEnabled,
    maxQtyPerProduct,
    individualSellingPlanEnabled,
    individualSellingPlanShowFor,
    bundleCartTitle,
    bundleCartSubtitle,
    bundle,
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
          // Update discard baselines for all Tier-2 fields
          originalLoadingGifRef.current = loadingGif;
          originalShowProductPricesRef.current = showProductPrices;
          originalShowCompareAtPricesRef.current = showCompareAtPrices;
          originalCartRedirectToCheckoutRef.current = cartRedirectToCheckout;
          originalAllowQuantityChangesRef.current = allowQuantityChanges;
          originalSdkModeRef.current = sdkMode;
          originalTextOverridesRef.current = textOverrides;
          originalTextOverridesByLocaleRef.current = textOverridesByLocale;
          originalDefaultProductsDataRef.current = defaultProductsData;
          originalUpsellWidgetEnabledRef.current = upsellWidgetEnabled;
          originalUpsellWidgetDisplayModeRef.current = upsellWidgetDisplayMode;
          originalUpsellWidgetDisplayOnRef.current = upsellWidgetDisplayOn;
          originalUpsellWidgetTitleRef.current = upsellWidgetTitle;
          originalUpsellWidgetDescriptionRef.current = upsellWidgetDescription;
          originalUpsellWidgetButtonTextRef.current = upsellWidgetButtonText;
          originalUpsellWidgetImageUrlRef.current = upsellWidgetImageUrl;
          originalAutoSelectBrowsedProductRef.current = autoSelectBrowsedProduct;
          originalBundleEmbedEnabledRef.current = bundleEmbedEnabled;
          originalBundleEmbedTitleRef.current = bundleEmbedTitle;
          originalBundleEmbedSubTitleRef.current = bundleEmbedSubTitle;
          originalBundleEmbedDisplayOnRef.current = bundleEmbedDisplayOn;
          originalBundleEmbedAddBrowsedProductRef.current = bundleEmbedAddBrowsedProduct;
          // Mark state as saved (updates hook baseline ref and resets dirty flag)
          markAsSaved();

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
        } else if ('templates' in result && result.templates) {
          // This is a get theme templates response
          const rawTemplates = (result as any).templates || [];
          const enhancedTemplates = enhanceTemplateListWithUserSelection(rawTemplates);
          setAvailablePages(enhancedTemplates);
          setIsLoadingPages(false);
        } else if ('themeId' in result && result.themeId) {
          // This is a get current theme response - handled by individual callbacks
        } else if ('synced' in result && result.synced) {
          // Sync bundle response
          shopify.toast.show(('message' in result ? result.message : null) || "Bundle synced successfully", { isError: false });
          revalidator.revalidate();
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
  }, [fetcher.data, fetcher.state]);

  useEffect(() => {
    // formData is cleared by the time state returns to 'idle', so guard
    // using the request ref set at submit time instead.
    if (templateFetcher.state !== 'idle' || !lastTemplateRequestRef.current) {
      return;
    }

    if (templateFetcher.data === null || templateFetcher.data === undefined) {
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

    const errorMessage = response.error || "Failed to save template settings.";
    setTemplateSaveError(errorMessage);
  }, [templateFetcher.data, templateFetcher.formData, templateFetcher.state]);

  const handleAddToStorefront = useCallback(() => {
    const embedLink = `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/bundle-app-embed`;
    open(embedLink, '_blank');
    shopify.toast.show(
      "Activate the Wolfpack Bundle embed in Theme Settings to go live.",
      { isError: false, duration: 8000 }
    );
  }, [shop, apiKey, shopify]);

  // Discard handler - resets hook state and all local state
  const handleDiscard = useCallback(() => {
    hookHandleDiscard();
    setLoadingGif(originalLoadingGifRef.current);
    setShowProductPrices(originalShowProductPricesRef.current);
    setShowCompareAtPrices(originalShowCompareAtPricesRef.current);
    setCartRedirectToCheckout(originalCartRedirectToCheckoutRef.current);
    setAllowQuantityChanges(originalAllowQuantityChangesRef.current);
    setSdkMode(originalSdkModeRef.current);
    setTextOverrides(originalTextOverridesRef.current);
    setTextOverridesByLocale(originalTextOverridesByLocaleRef.current);
    setDefaultProductsData(originalDefaultProductsDataRef.current);
    setUpsellWidgetEnabled(originalUpsellWidgetEnabledRef.current);
    setUpsellWidgetDisplayMode(originalUpsellWidgetDisplayModeRef.current);
    setUpsellWidgetDisplayOn(originalUpsellWidgetDisplayOnRef.current);
    setUpsellWidgetTitle(originalUpsellWidgetTitleRef.current);
    setUpsellWidgetDescription(originalUpsellWidgetDescriptionRef.current);
    setUpsellWidgetButtonText(originalUpsellWidgetButtonTextRef.current);
    setUpsellWidgetImageUrl(originalUpsellWidgetImageUrlRef.current);
    setAutoSelectBrowsedProduct(originalAutoSelectBrowsedProductRef.current);
    setBundleEmbedEnabled(originalBundleEmbedEnabledRef.current);
    setBundleEmbedTitle(originalBundleEmbedTitleRef.current);
    setBundleEmbedSubTitle(originalBundleEmbedSubTitleRef.current);
    setBundleEmbedDisplayOn(originalBundleEmbedDisplayOnRef.current);
    setBundleEmbedAddBrowsedProduct(originalBundleEmbedAddBrowsedProductRef.current);
  }, [hookHandleDiscard]);

  const enablePreviewGate = useEnablePreviewGate({
    appEmbedEnabled,
    themeEditorUrl,
    onSilentBlock: () => shopify.toast.show("Theme editor is unavailable for this shop.", { isError: true }),
    sessionKey: bundle.id,
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
    // Pick the URL via the shared helper. When the theme app extension is
    // enabled AND the bundle is active or unlisted, this returns the live
    // storefront URL so the merchant sees the customer-facing experience;
    // otherwise it falls back to Shopify's draft preview URL.
    const bundleStatusForPreview = String((bundle as any).status ?? "").toLowerCase();
    let productUrl = pickPpbPreviewUrl({
      appEmbedEnabled,
      bundleStatus: bundleStatusForPreview,
      productHandle: bundle.shopifyProductHandle,
      bundleProduct,
      shop,
    });

    // Final fallback: admin product page link so the merchant has somewhere
    // to land when the storefront URL can't be constructed.
    if (!productUrl && bundleProduct?.id) {
      const productId = bundleProduct.id.includes('gid://shopify/Product/')
        ? bundleProduct.id.split('/').pop()
        : bundleProduct.id;

      const shopDomain = shop.includes('.myshopify.com')
        ? shop.replace('.myshopify.com', '')
        : shop.split('.')[0];

      productUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
    }

    if (productUrl) {
      // Add template view parameter if template name is set
      if (formState.templateName && !productUrl.includes('/admin.shopify.com/')) {
        const separator = productUrl.includes('?') ? '&' : '?';
        productUrl += `${separator}view=${formState.templateName}`;
      }

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
  }, [isDirty, bundle, bundleProduct, shop, shopify, formState.templateName, enablePreviewGate, appEmbedEnabled]);

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
    const widgetPlaced = upsellWidgetEnabled;
    const parentProductActive = String(productStatus || loadedBundleProduct?.status || "").toLowerCase() === "active";

    return [
      { key: "embed",         label: "App Embed Enabled",          description: "Needed for your bundle to show up on store",       points: 15, done: appEmbedEnabled },
      { key: "products",      label: "Minimum 3 Products Added",   description: "Add more products to build a better bundle",       points: 20, done: hasProducts },
      { key: "discount",      label: "Set Up Discount",            description: "Bundles with offers tend to sell better",          points: 15, done: pricingState.discountEnabled },
      { key: "preview",       label: "Preview Bundle",             description: "Check your bundle looks and works right",          points: 10, done: hasPreview },
      { key: "widget",        label: "Place Bundle Widget",        description: "Place the bundle widget on your product page",     points: 25, done: widgetPlaced },
      { key: "product_active",label: "Set Parent Product to Active","description": "Unlisted bundles won't show in search",        points: 15, done: parentProductActive },
    ];
  }, [
    appEmbedEnabled,
    hasPreview,
    loadedBundleProduct?.status,
    pricingState.discountEnabled,
    productStatus,
    stepsState.steps,
    upsellWidgetEnabled,
  ]);

  const readinessScore = readinessItems.reduce((sum, item) => sum + (item.done ? item.points : 0), 0);
  const readinessClassName = readinessScore >= 80
    ? productPageBundleStyles.readinessButtonHigh
    : readinessScore >= 40
      ? productPageBundleStyles.readinessButtonMedium
      : productPageBundleStyles.readinessButtonLow;

  const handleSectionChange = useCallback((section: string) => {
    if (isDirty) {
      shopify.toast.show("Please save or discard your changes before switching sections", {
        isError: true,
        duration: 4000
      });
      return;
    }

    setActiveSection(section);
  }, [isDirty, shopify]);

  const openProductInAdmin = useCallback((productId: string) => {
    const storeHandle = shop?.replace('.myshopify.com', '');
    const adminProductUrl = `https://admin.shopify.com/store/${storeHandle}/products/${productId}`;
    if (window.location.hostname.includes("trycloudflare.com")) {
      window.open(adminProductUrl, "_blank");
    } else {
      shopify.navigate(adminProductUrl);
    }
  }, [shop, shopify]);

  // Navigation handlers with unsaved changes check
  const handleBackClick = useCallback(() => {
    if (isDirty && !forceNavigation) {
      shopify.toast.show("Save or discard your changes before moving to another section.", {
        isError: true,
        duration: 5000
      });
      void (shopify as any).saveBar?.leaveConfirmation?.();
      return;
    }
    navigate("/app/dashboard");
  }, [isDirty, forceNavigation, navigate, shopify]);

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
      case "widget":
        handleSectionChange("bundle_visibility");
        break;
      case "product_active": {
        const productId = bundleProduct?.legacyResourceId || bundleProduct?.id?.split('/').pop() || (bundle as any).shopifyProductId?.split('/').pop();
        if (productId) {
          openProductInAdmin(productId);
        }
        break;
      }
      default:
        break;
    }
  }, [themeEditorUrl, handleSectionChange, handlePreviewBundle, bundle, bundleProduct, openProductInAdmin]);

  const handleAddNewStep = useCallback(() => {
    stepsState.addStep();
    setSlideDir("forward");
    setSlideKey(prev => prev + 1);
    setActiveTabIndex(stepsState.steps.length);
  }, [stepsState, setActiveTabIndex]);

  // Modal handlers for products and collections view
  // handleShowProducts and handleShowCollections removed - modals managed inline

  const handleCloseProductsModal = useCallback(() => {
    closeProductsModal();
    setCurrentModalStepId('');
  }, [closeProductsModal, setCurrentModalStepId]);

  const handleCloseCollectionsModal = useCallback(() => {
    closeCollectionsModal();
    setCurrentModalStepId('');
  }, [closeCollectionsModal, setCurrentModalStepId]);

  // Function to load available theme templates
  const loadAvailablePages = useCallback(() => {
    setIsLoadingPages(true);
    try {
      const formData = new FormData();
      formData.append("intent", "getThemeTemplates");

      fetcher.submit(formData, { method: "post" });
      // Response will be handled by the existing useEffect
    } catch (error) {
      AppLogger.error("Failed to load theme templates:", {}, error as any);
      shopify.toast.show("Failed to load theme templates", { isError: true, duration: 5000 });
      setIsLoadingPages(false);
    }
  }, [fetcher, shopify]);

  // Place widget handlers with page selection modal
  const handlePlaceWidget = useCallback(() => {
    try {
      openPageSelectionModal();
      loadAvailablePages();
    } catch (error) {
      AppLogger.error('Error opening page selection:', {}, error as any);
      shopify.toast.show("Failed to open page selection", { isError: true, duration: 5000 });
    }
  }, [loadAvailablePages, shopify, openPageSelectionModal]);

  const openVisibilityProductPicker = useCallback(async (target: "widget" | "embed") => {
    const currentProducts = target === "widget" ? upsellWidgetSelectedProducts : bundleEmbedSelectedProducts;
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

    if (target === "widget") {
      setUpsellWidgetSelectedProducts(selectedProducts);
      setUpsellWidgetSpecificProductPages(pageTargets);
    } else {
      setBundleEmbedSelectedProducts(selectedProducts);
      setBundleEmbedSpecificProductPages(pageTargets);
    }
    markAsDirty();
  }, [bundleEmbedSelectedProducts, markAsDirty, shopify, upsellWidgetSelectedProducts]);

  const openVisibilityCollectionPicker = useCallback(async (target: "widget" | "embed") => {
    const currentCollections = target === "widget" ? upsellWidgetCollectionsSelectedData : bundleEmbedCollectionsSelectedData;
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

    if (target === "widget") {
      setUpsellWidgetCollectionsSelectedData(collectionsSelectedData);
      setUpsellWidgetSpecificCollectionPages(pageTargets);
    } else {
      setBundleEmbedCollectionsSelectedData(collectionsSelectedData);
      setBundleEmbedSpecificCollectionPages(pageTargets);
    }
    markAsDirty();
  }, [bundleEmbedCollectionsSelectedData, markAsDirty, shopify, upsellWidgetCollectionsSelectedData]);

  const removeVisibilityProductTarget = useCallback((target: "widget" | "embed", indexToRemove: number) => {
    if (target === "widget") {
      setUpsellWidgetSelectedProducts((prev) => prev.filter((_, index) => index !== indexToRemove));
      setUpsellWidgetSpecificProductPages((prev) => prev.filter((_, index) => index !== indexToRemove));
    } else {
      setBundleEmbedSelectedProducts((prev) => prev.filter((_, index) => index !== indexToRemove));
      setBundleEmbedSpecificProductPages((prev) => prev.filter((_, index) => index !== indexToRemove));
    }
    markAsDirty();
  }, [markAsDirty]);

  const removeVisibilityCollectionTarget = useCallback((target: "widget" | "embed", indexToRemove: number) => {
    if (target === "widget") {
      setUpsellWidgetCollectionsSelectedData((prev) => prev.filter((_, index) => index !== indexToRemove));
      setUpsellWidgetSpecificCollectionPages((prev) => prev.filter((_, index) => index !== indexToRemove));
    } else {
      setBundleEmbedCollectionsSelectedData((prev) => prev.filter((_, index) => index !== indexToRemove));
      setBundleEmbedSpecificCollectionPages((prev) => prev.filter((_, index) => index !== indexToRemove));
    }
    markAsDirty();
  }, [markAsDirty]);

  const handlePageSelection = useCallback(async (template: any) => {
    let editorWindow: Window | null = null;
    try {
      if (!template || !template.handle) {
        AppLogger.error('🚨 [THEME_EDITOR] Invalid template object:', {}, template);
        shopify.toast.show("Template data is invalid", { isError: true, duration: 5000 });
        return;
      }

      shopify.toast.show(`Preparing theme editor for "${template.title}"...`, { isError: false, duration: 3000 });

      // Open synchronously from the click event so browsers keep the tab gesture.
      editorWindow = window.open("about:blank", "_blank", "noopener,noreferrer");

      // Create a theme template service instance
      // Note: We'll need to refactor this to get admin from a fetcher since this is client-side
      // For now, we'll use the existing approach but add template creation via API call

      // Check if this is a bundle-specific template that needs to be created
      if (template.isBundleContainer && template.bundleProduct) {

        // Make API call to create template if needed
        const createTemplateResponse = await fetch(`/api/ensure-product-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productHandle: template.bundleProduct.handle,
            bundleId: bundle.id
          })
        });

        if (!createTemplateResponse.ok) {
          AppLogger.error('🚨 [THEME_EDITOR] Failed to ensure template exists', {});
          shopify.toast.show("Failed to prepare product template", { isError: true, duration: 5000 });
          editorWindow?.close();
          return;
        }

        const templateResult = await createTemplateResponse.json();

        if (templateResult.created) {
          shopify.toast.show(`Created new template for ${template.bundleProduct.handle}`, { isError: false, duration: 4000 });
        }
      }

      // Use app API key and block handle from loader data (passed from server)
      // CRITICAL: Must use app's API key (client_id), not extension UUID
      if (!apiKey || !blockHandle) {
        AppLogger.error('🚨 [THEME_EDITOR] Missing app configuration');
        shopify.toast.show("App configuration missing. Please check app setup.", { isError: true, duration: 5000 });
        editorWindow?.close();
        return;
      }

      const placementBlockHandle = activeSection === "bundle_widget"
        ? (upsellWidgetDisplayMode === "button" ? "bundle-upsell-button" : "bundle-upsell-block")
        : blockHandle;

      // Generate deep link following Shopify's official documentation with bundle ID
      // Official format: template + addAppBlockId + target + bundleId (for auto-population)
      // See: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/deep-links
      //
      // Adding bundleId parameter allows the widget's Liquid code to auto-detect and populate
      // the bundle_id setting in the theme editor, making setup seamless for merchants
      const pageProductHandle = template.bundleProduct?.handle || bundle.shopifyProductHandle;
      const themeEditorUrl = buildProductPageThemeEditorDeepLink({
        shop,
        apiKey,
        blockHandle: placementBlockHandle,
        bundleId: bundle.id,
        productHandle: pageProductHandle,
        template,
      });


      setSelectedPage(template);
      closePageSelectionModal();

      // Open theme editor in new window/tab for better workflow
      shopify.toast.show(`Opening theme editor for "${template.title}". You'll be able to add the bundle widget to your theme.`, { isError: false, duration: 5000 });

      if (editorWindow && !editorWindow.closed) {
        editorWindow.location.href = themeEditorUrl;
      } else {
        window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      AppLogger.error('🚨 [THEME_EDITOR] Error in handlePageSelection:', { errorMessage }, error as any);
      shopify.toast.show(`Failed to open theme editor: ${errorMessage}`, { isError: true, duration: 5000 });
      editorWindow?.close();
    }
  }, [activeSection, blockHandle, shop, shopify, bundle.id, upsellWidgetDisplayMode, apiKey]);

  // Sync Bundle modal ref
  const syncModalRef = useRef<HTMLElement>(null);
  const pageSelectionModalRef = useRef<HTMLElement>(null);
  const productsModalRef = useRef<HTMLElement>(null);
  const collectionsModalRef = useRef<HTMLElement>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    isSyncModalOpen ? showPolarisModal(syncModalRef) : hidePolarisModal(syncModalRef);
  }, [isSyncModalOpen]);

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
    isProgressBarMultiLangModalOpen ? showPolarisModal(progressBarMultiLangModalRef) : hidePolarisModal(progressBarMultiLangModalRef);
  }, [isProgressBarMultiLangModalOpen]);

  useEffect(() => {
    isBundleQuantityMultiLangModalOpen ? showPolarisModal(bundleQuantityMultiLangModalRef) : hidePolarisModal(bundleQuantityMultiLangModalRef);
  }, [isBundleQuantityMultiLangModalOpen]);

  useEffect(() => {
    isDiscountVariablesModalOpen ? showPolarisModal(discountVariablesModalRef) : hidePolarisModal(discountVariablesModalRef);
  }, [isDiscountVariablesModalOpen]);

  useModalHideListener(syncModalRef, () => setIsSyncModalOpen(false));
  useModalHideListener(pageSelectionModalRef, closePageSelectionModal);
  useModalHideListener(productsModalRef, handleCloseProductsModal);
  useModalHideListener(collectionsModalRef, handleCloseCollectionsModal);
  useModalHideListener(progressBarMultiLangModalRef, () => setIsProgressBarMultiLangModalOpen(false));
  useModalHideListener(bundleQuantityMultiLangModalRef, () => setIsBundleQuantityMultiLangModalOpen(false));
  useModalHideListener(discountVariablesModalRef, () => setIsDiscountVariablesModalOpen(false));

  const closeDiscardModal = useCallback(() => {
    setShowDiscardModal(false);
  }, []);

  const closeSelectTemplateDialog = useCallback(() => {
    setIsSelectTemplateModalOpen(false);
    setTemplateModalStep("select");
    setTemplateSaveError(null);
    lastTemplateRequestRef.current = null;
    lastTemplateResponseRef.current = null;
    requestAnimationFrame(() => {
      selectTemplateOpenButtonRef.current?.focus();
    });
  }, []);

  const getSelectTemplateDialogFocusableElements = useCallback((): HTMLElement[] => {
    if (!selectTemplateDialogRef.current) {
      return [];
    }

    return Array.from(
      selectTemplateDialogRef.current.querySelectorAll<HTMLElement>(
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
      closeSelectTemplateDialog();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getSelectTemplateDialogFocusableElements();
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
  }, [closeSelectTemplateDialog, getSelectTemplateDialogFocusableElements]);

  const handleSelectTemplateBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeSelectTemplateDialog();
    }
  }, [closeSelectTemplateDialog]);

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
    navigate(PPB_DESIGN_CONTROL_PANEL_URL);
  }, [navigate]);

  useEffect(() => {
    if (isSelectTemplateModalOpen) {
      selectTemplateDialogRef.current?.focus();
    }
  }, [isSelectTemplateModalOpen]);

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

  const handleTemplatePreview = useCallback(() => {
    void handlePreviewBundle();
    closeSelectTemplateDialog();
  }, [closeSelectTemplateDialog, handlePreviewBundle]);

  const handleConfirmDiscard = useCallback(() => {
    closeDiscardModal();
    handleDiscard();
  }, [closeDiscardModal, handleDiscard]);

  return (
    <>
      <div className={productPageBundleStyles.editCanvas}>
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
          discountMessagingEnabled: pricingState.discountMessagingEnabled,
          ruleMessages,
          discountMessagingMultiLanguageEnabled,
          ruleMessagesByLocale: discountMessagingMultiLanguageEnabled ? ruleMessagesByLocale : null,
          tierTextByRuleId: Object.keys(tierTextByRuleId).length > 0 ? tierTextByRuleId : null,
          tierTextByLocaleByRuleId: Object.keys(tierTextByLocaleByRuleId).length > 0 ? tierTextByLocaleByRuleId : null,
          displayOptions: {
            bundleQuantityOptions: {
              enabled: qtyOptionsEnabled,
              defaultRuleId: qtyOptionsDefaultRuleId,
              optionsByRuleId: Object.fromEntries(
                pricingState.discountRules.map((rule: PricingRule) => [
                  rule.id,
                  {
                    label: qtyRuleLabels[rule.id] ?? `Box of ${rule.conditionValue ?? ""}`,
                    subtext: qtyRuleSubtexts[rule.id] ?? "",
                  },
                ])
              ),
              optionsByLocaleByRuleId: qtyRuleTextsByLocaleByRuleId,
            },
            progressBar: {
              enabled: progressBarEnabled,
              type: progressBarType,
              progressText: progressBarProgressText,
              successText: progressBarSuccessText,
            },
          },
        })} />
        <input type="hidden" name="stepConditions" value={JSON.stringify(conditionsState.stepConditions)} />
      </form>

        <div className={productPageBundleStyles.canvasHeader}>
          <div className={productPageBundleStyles.canvasTitleGroup}>
            <div className={productPageBundleStyles.canvasTitleRow}>
              <button
                type="button"
                className={productPageBundleStyles.canvasBackButton}
                onClick={handleBackClick}
                aria-label="Back to dashboard"
              >
                ←
              </button>
              <h1 className={productPageBundleStyles.canvasTitle}>Configure Bundle Flow</h1>
            </div>
          </div>
          <div className={productPageBundleStyles.canvasActions}>
            <button
              type="button"
              className={`${productPageBundleStyles.readinessButton} ${readinessClassName}`}
              onClick={() => setReadinessOpen(true)}
            >
              <span className={productPageBundleStyles.readinessScore}>{readinessScore}</span>
              <span className={productPageBundleStyles.readinessLabel}>Readiness Score</span>
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

        {String(productStatus || loadedBundleProduct?.status || "").toLowerCase() !== "active" && (
          <UnlistedBundleBanner
            shop={shop}
            bundleProductId={loadedBundleProduct?.id ?? (bundle as any).shopifyProductId ?? null}
          />
        )}

        <div className={productPageBundleStyles.editGrid}>

          {/* Left Sidebar */}
          <div className={productPageBundleStyles.leftColumn}>
            <s-stack direction="block" gap="base">

              {/* Bundle Product Card */}
              <s-section>
                <s-stack direction="block" gap="small">
                  <div className={productPageBundleStyles.leftCardHeader}>
                    <h3 className={productPageBundleStyles.leftCardTitle}>Bundle Product</h3>
                    <div className={productPageBundleStyles.productMenuWrapper}>
                      <button
                        type="button"
                        className={productPageBundleStyles.productMenuBtn}
                        aria-label="Bundle product options"
                        onClick={() => setProductMenuOpen((o) => !o)}
                      >
                        <s-icon type="menu-vertical" />
                      </button>
                      {productMenuOpen && (
                        <>
                          <div className={productPageBundleStyles.productMenuBackdrop} onClick={() => setProductMenuOpen(false)} />
                          <div className={productPageBundleStyles.productMenuDropdown}>
                            <button
                              type="button"
                              className={productPageBundleStyles.productMenuDropdownItem}
                              onClick={() => { setProductMenuOpen(false); void handleBundleProductSelect(); }}
                            >
                              <s-icon type="edit" />
                              <span>Replace Product</span>
                            </button>
                            <button
                              type="button"
                              className={productPageBundleStyles.productMenuDropdownItem}
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

                  <div className={productPageBundleStyles.bundleProductPanel}>
                    <div className={productPageBundleStyles.bundleProductSummary}>
                      <div className={productPageBundleStyles.bundleProductIconTile}>
                        {productImageUrl ? (
                          <img
                            src={productImageUrl}
                            alt=""
                            className={productPageBundleStyles.bundleProductIconImage}
                          />
                        ) : (
                          <s-icon type="product" />
                        )}
                      </div>
                      <span className={productPageBundleStyles.bundleProductName}>
                        {productTitle || bundleProduct?.title || formState.bundleName || "Bundle Product"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={productPageBundleStyles.bundleProductEditButton}
                      onClick={() => {
                          const productId = bundleProduct?.legacyResourceId || bundleProduct?.id?.split('/').pop() || (bundle as any).shopifyProductId?.split('/').pop();
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

                  <div className={productPageBundleStyles.parentProductStatus}>
                    <span>Parent Product Status</span>
                    {(() => {
                      const normalizedStatus = String(productStatus || "").toLowerCase();
                      const statusLabel = normalizedStatus === "active"
                        ? "Active"
                        : normalizedStatus === "archived"
                          ? "Archived"
                          : "Unlisted";
                      return (
                        <s-badge tone={statusLabel === "Active" ? "success" : "warning"}>
                          {statusLabel}
                        </s-badge>
                      );
                    })()}
                  </div>
                </s-stack>
              </s-section>

              {/* Bundle Setup Navigation Card */}
              <s-section>
                <s-stack direction="block" gap="small">
                  <h3 className={productPageBundleStyles.leftCardTitle}>Bundle Setup</h3>
                  <p className={productPageBundleStyles.leftCardSubtitle}>Set-up your bundle builder</p>

                  <div className={productPageBundleStyles.setupNavList}>
                    {bundleSetupItems.map((item) => {
                      const isActive = activeSection === item.id || (item.id === "bundle_visibility" && (activeSection === "bundle_widget" || activeSection === "bundle_embed"));
                      let statusBadge: { label: string; tone?: string } | null = null;
                      if (item.id === "discount_pricing") {
                        statusBadge = pricingState.discountEnabled ? null : { label: "None" };
                      }
                      if (item.id === "bundle_visibility") {
                        statusBadge = appEmbedEnabled ? { label: "Optimised", tone: "success" } : { label: "Pending", tone: "warning" };
                      }
                      return (
                        <div key={item.id}>
                          {item.id === "select_template" && (
                            <hr style={{ margin: "8px 0", border: "none", borderTop: "1px solid #e1e3e5" }} />
                          )}
                          <button
                            type="button"
                            className={`${productPageBundleStyles.setupNavItem} ${isActive ? productPageBundleStyles.setupNavItemActive : ""}`}
                            onClick={() => { if (item.id === "select_template") { openSelectTemplateModal(); } else { handleSectionChange(item.id); } }}
                            ref={item.id === "select_template" ? selectTemplateOpenButtonRef : undefined}
                          >
                            <span className={productPageBundleStyles.setupNavIcon} aria-hidden="true">
                              {item.iconType
                                ? <s-icon type={item.iconType as any} />
                                : (isActive ? "●" : "○")}
                            </span>
                            <span className={productPageBundleStyles.setupNavLabel}>{item.label}</span>
                            <span className={productPageBundleStyles.setupNavMeta}>
                              {statusBadge && (
                                (statusBadge.label === "Pending" || statusBadge.label === "Optimised")
                                  ? <VisibilityBadge isOptimised={statusBadge.label === "Optimised"} />
                                  : <s-badge tone={(statusBadge.tone as any) || "subdued"}>{statusBadge.label}</s-badge>
                              )}
                            </span>
                          </button>
                          {item.id === "bundle_visibility" && (activeSection === "bundle_visibility" || activeSection === "bundle_widget" || activeSection === "bundle_embed") && (
                            <div className={productPageBundleStyles.subNav}>
                              {bundleVisibilityChildItems.map((child) => (
                                <button
                                  key={child.id}
                                  type="button"
                                  className={`${productPageBundleStyles.subNavItem} ${activeSection === child.id ? productPageBundleStyles.subNavItemActive : ""}`}
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

              {/* Take your bundle live card */}
              <s-section>
                <s-stack direction="block" gap="small">
                  <h3 className={productPageBundleStyles.leftCardTitle}>Take your bundle live</h3>
                  <div className={productPageBundleStyles.bundleLivePanel}>
                    <span className={productPageBundleStyles.bundleLivePlaceOnTheme}>Place on theme</span>
                    <s-button variant="secondary" onClick={handlePlaceWidget}>
                      Place Widget ↗
                    </s-button>
                  </div>
                </s-stack>
              </s-section>

            </s-stack>
          </div>

          {/* Main Content Area */}
          <div className={productPageBundleStyles.mainColumn}>
            {activeSection === "step_setup" && (
              <div data-tour-target="ppb-product-selection">
                <div className={`${productPageBundleStyles.card} ${productPageBundleStyles.stepFlowCard}`}>
                  <s-stack direction="block" gap="small">
                    <div className={productPageBundleStyles.stepFlowTitleRow}>
                      <span className={productPageBundleStyles.headingWithHelp}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Step Flow</h3>
                        <QuestionHelpTooltip tooltipKey="stepFlow" />
                      </span>
                      <button
                        type="button"
                        className={productPageBundleStyles.linkButton}
                        onClick={() => window.open("https://wolfpackapps.com", "_blank")}
                      >
                        How to setup?
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                      Create steps for your multi-step bundle here. Select product options for each step below
                    </p>
                  </s-stack>
                  <div className={productPageBundleStyles.stepNav}>
                    {stepsState.steps.map((step, i) => (
                      <button
                        key={step.id}
                        className={activeTabIndex === i ? productPageBundleStyles.stepChipActive : productPageBundleStyles.stepChip}
                        onClick={() => navigateToStep(i)}
                      >
                        <span className={productPageBundleStyles.stepChipNumber}>{i + 1}</span>
                        <span className={productPageBundleStyles.stepChipLabel}>{step.name || `Step ${i + 1}`}</span>
                        <span className={productPageBundleStyles.stepChipChevron}>›</span>
                      </button>
                    ))}
                    <button className={productPageBundleStyles.addStepBtn} onClick={handleAddNewStep}>
                      <span aria-hidden="true">+</span>
                      <span>Add Step</span>
                    </button>
                  </div>
                  {stepsState.steps.map((step, index) => activeTabIndex === index && (
                    <div
                      key={`${step.id}-${slideKey}`}
                      style={{ paddingTop: "16px" }}
                      className={slideDir === "forward" ? productPageBundleStyles.slideForward : slideDir === "backward" ? productPageBundleStyles.slideBackward : ""}
                    >
                      <div className={productPageBundleStyles.stepSetupHeader}>
                        <div className={productPageBundleStyles.stepSetupTitleGroup}>
                          <h3 className={productPageBundleStyles.stepSetupTitle}>Step Setup</h3>
                          <s-switch
                            accessibilityLabel="Enable step"
                            checked={step.enabled !== false || undefined}
                            onChange={(e: Event) => {
                              stepsState.updateStepField(step.id, "enabled", (e.target as HTMLInputElement).checked);
                              markAsDirty();
                            }}
                          />
                        </div>
                        <div className={productPageBundleStyles.stepSetupActions}>
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
                      <p className={productPageBundleStyles.stepSetupDescription}>
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
                  ))}
                </div>

                {stepsState.steps.map((step, index) => activeTabIndex === index && (
                  <div
                    key={`${step.id}-${slideKey}-categories`}
                    className={slideDir === "forward" ? productPageBundleStyles.slideForward : slideDir === "backward" ? productPageBundleStyles.slideBackward : ""}
                  >
                                {/* Legacy products migration banner — shown when step has StepProduct rows but no StepCategory yet */}
                                {step.StepProduct && step.StepProduct.length > 0 && (((step as any).StepCategory as any[] | undefined) ?? []).length === 0 && (
                                  <s-banner tone="warning">
                                    <p style={{ margin: 0, fontSize: 14 }}>
                                      <strong>Action needed:</strong> This step has {step.StepProduct.length} product{step.StepProduct.length !== 1 ? "s" : ""} from the previous system. Use <strong>+ Add Category</strong> below to re-add them to the new category system.
                                    </p>
                                  </s-banner>
                                )}

                                {/* Categories (multi-category accordion) */}
                    <div className={productPageBundleStyles.card}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Category</h3>
                                    <QuestionHelpTooltip tooltipKey="category" />
                                  </div>
                                  <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6d7175" }}>
                                    Add all product selections in this step to a single category or separate them into multiple categories for better segregation.
                                  </p>

                                  {(((step as any).StepCategory as any[] | undefined) ?? []).length === 0 && (
                                    <div className={productPageBundleStyles.emptyState}>No category defined yet</div>
                                  )}

                                  {(((step as any).StepCategory as any[] | undefined) ?? []).map((cat: any, catIndex: number) => {
                                    const catKey = `${step.id}__${cat.id ?? catIndex}`;
                                    const catActiveTab = categoryActiveTabs[catKey] ?? 0;
                                    const catProducts = (cat.products as any[]) ?? [];
                                    const catCollections = (cat.collections as any[]) ?? [];
                                    const isOpen = categoryOpen[catKey] ?? false;
                                    return (
                                      <div
                                        key={cat.id ?? catIndex}
                                        data-cat-key={catKey}
                                        className={`${productPageBundleStyles.categoryAccordion}${dragOverCatKey === catKey ? ` ${productPageBundleStyles.categoryDragOver}` : ''}`}
                                        onDragOver={(e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (draggedCatKey && draggedCatKey !== catKey) setDragOverCatKey(catKey); }}
                                        onDragLeave={(e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCatKey(null); }}
                                        onDrop={(e: React.DragEvent) => handleCatDrop(e, step.id, catKey)}
                                      >
                                        <div
                                          className={productPageBundleStyles.categoryAccordionHeader}
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
                                            className={productPageBundleStyles.categoryDrag}
                                            aria-hidden="true"
                                            draggable="true"
                                            onDragStart={(e: React.DragEvent) => { e.stopPropagation(); handleCatDragStart(e, step.id, catKey); }}
                                            onDragEnd={handleCatDragEnd}
                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                          >⠿</span>
                                          <span className={productPageBundleStyles.categoryName}>
                                            {cat.name || `Category ${catIndex + 1}`}
                                          </span>
                                          <div
                                            className={productPageBundleStyles.categoryActions}
                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                          >
                                            <s-button
                                              variant="plain"
                                              icon="duplicate"
                                              accessibilityLabel="Clone category"
                                              onClick={() => {
                                                const cats = ((step as any).StepCategory as any[]) ?? [];
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
                                                const updated = (((step as any).StepCategory as any[]) ?? []).filter((_: any, i: number) => i !== catIndex);
                                                stepsState.updateStepField(step.id, "StepCategory", updated);
                                                markAsDirty();
                                              }}
                                            />
                                            <button
                                              className={productPageBundleStyles.categoryChevron}
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

                                        {isOpen && (
                                          <div className={productPageBundleStyles.categoryAccordionBody}>
                                            <div className={productPageBundleStyles.categoryFieldGroup}>
                                              <label
                                                className={productPageBundleStyles.categoryFieldLabel}
                                                htmlFor={`ppb-category-name-${catKey}`}
                                              >
                                                Category Name
                                              </label>
                                              <div className={productPageBundleStyles.catNameRow}>
                                                <input
                                                  id={`ppb-category-name-${catKey}`}
                                                  className={productPageBundleStyles.categoryNameInput}
                                                  type="text"
                                                  value={cat.name ?? ""}
                                                  placeholder={`Category ${catIndex + 1}`}
                                                  aria-label="Category name"
                                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const updated = (((step as any).StepCategory as any[]) ?? []).map((c: any, i: number) =>
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
                                            </div>
                                            <div className={productPageBundleStyles.categoryFieldGroup}>
                                              <label
                                                className={productPageBundleStyles.categoryFieldLabel}
                                                htmlFor={`ppb-category-title-${catKey}`}
                                              >
                                                Category Title
                                              </label>
                                              <input
                                                id={`ppb-category-title-${catKey}`}
                                                className={productPageBundleStyles.categoryNameInput}
                                                type="text"
                                                value={cat.title ?? ""}
                                                aria-label="Category title"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                  const updated = (((step as any).StepCategory as any[]) ?? []).map((c: any, i: number) =>
                                                    i === catIndex ? { ...c, title: e.target.value } : c
                                                  );
                                                  stepsState.updateStepField(step.id, "StepCategory", updated);
                                                  markAsDirty();
                                                }}
                                              />
                                            </div>
                                            <div className={productPageBundleStyles.tabRow}>
                                              <button
                                                className={catActiveTab === 0 ? productPageBundleStyles.tabActive : productPageBundleStyles.tab}
                                                onClick={() => setCategoryActiveTabs(prev => ({ ...prev, [catKey]: 0 }))}
                                              >
                                                Products
                                                {catProducts.length > 0 && (
                                                  <span className={productPageBundleStyles.tabBadge}>{catProducts.length}</span>
                                                )}
                                              </button>
                                              <button
                                                className={catActiveTab === 1 ? productPageBundleStyles.tabActive : productPageBundleStyles.tab}
                                                onClick={() => setCategoryActiveTabs(prev => ({ ...prev, [catKey]: 1 }))}
                                              >
                                                Collections
                                                {catCollections.length > 0 && (
                                                  <span className={productPageBundleStyles.tabBadge}>{catCollections.length}</span>
                                                )}
                                              </button>
                                            </div>

                                            {catActiveTab === 0 && (
                                              <div>
                                                <div className={productPageBundleStyles.productActions}>
                                                  <s-button
                                                    variant="primary"
                                                    onClick={async () => {
                                                      const picked = await (shopify as any).resourcePicker({
                                                        type: "product",
                                                        multiple: true,
                                                        selectionIds: catProducts.map((p: any) => ({ id: p.id })),
                                                      });
                                                      if (!picked) return;
                                                      const updated = (((step as any).StepCategory as any[]) ?? []).map((c: any, i: number) =>
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
                                                            const updated = (((step as any).StepCategory as any[]) ?? []).map((c: any, i: number) =>
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
                                                <div className={productPageBundleStyles.productActions}>
                                                  <s-button
                                                    variant="primary"
                                                    onClick={async () => {
                                                      const picked = await (shopify as any).resourcePicker({
                                                        type: "collection",
                                                        multiple: true,
                                                        selectionIds: catCollections.map((c: any) => ({ id: c.id })),
                                                      });
                                                      if (!picked) return;
                                                      const updated = (((step as any).StepCategory as any[]) ?? []).map((c: any, i: number) =>
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
                                                        <span style={{ flex: 1, fontSize: 14 }}>{col.title}</span>
                                                        <s-button
                                                          variant="plain"
                                                          onClick={() => {
                                                            const updated = (((step as any).StepCategory as any[]) ?? []).map((c: any, i: number) =>
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
                                            <div className={productPageBundleStyles.categoryVariantControl}>
                                              <s-checkbox
                                                label="Display variants as individual products"
                                                checked={cat.displayVariantsAsIndividualProducts === true || undefined}
                                                onChange={(e: Event) => {
                                                  const updated = (((step as any).StepCategory as any[]) ?? []).map((c: any, i: number) =>
                                                    i === catIndex ? { ...c, displayVariantsAsIndividualProducts: (e.target as HTMLInputElement).checked } : c
                                                  );
                                                  stepsState.updateStepField(step.id, "StepCategory", updated);
                                                  markAsDirty();
                                                }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  <button
                                    type="button"
                                    className={productPageBundleStyles.addSectionButton}
                                    onClick={() => {
                                      const cats = ((step as any).StepCategory as any[]) ?? [];
                                      stepsState.updateStepField(step.id, "StepCategory", [
                                        ...cats,
                                        {
                                          id: `cat-${Date.now()}`,
                                          name: "",
                                          title: "",
                                          sortOrder: cats.length,
                                          products: [],
                                          collections: [],
                                          displayVariantsAsIndividualProducts: false,
                                          displayVariantsAsSwatches: false,
                                        },
                                      ]);
                                      markAsDirty();
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                    Add Category
                                  </button>
                                </div>

                    {/* ── Rules Configuration card ── */}
                    <div className={productPageBundleStyles.card}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Rules Configuration</h3>
                                    <QuestionHelpTooltip tooltipKey="rulesConfiguration" />
                                  </div>
                                  <p style={{ margin: "0 0 8px", fontSize: 14, color: "#6d7175" }}>
                                    Apply rules to the entire step or to specific categories to guide your customer's selections.
                                  </p>
                                  <button
                                    type="button"
                                    className={productPageBundleStyles.linkButton}
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
                                          <div className={productPageBundleStyles.categoryRulesList}>
                                            {stepCategories.map((cat: any, catIndex: number) => {
                                              const catKey = `${step.id}__${cat.id ?? catIndex}`;
                                              const rules = Array.isArray(cat.conditions) ? cat.conditions : [];
                                              const isRulesOpen = categoryRulesOpen[catKey] ?? catIndex === 0;
                                              const categoryLabel = cat.name || cat.title || `Category ${catIndex + 1}`;

                                              return (
                                                <div key={cat.id ?? catIndex} className={productPageBundleStyles.categoryRuleAccordion}>
                                                  <button
                                                    type="button"
                                                    className={productPageBundleStyles.categoryRuleHeader}
                                                    aria-expanded={isRulesOpen}
                                                    onClick={() => setCategoryRulesOpen(prev => ({ ...prev, [catKey]: !isRulesOpen }))}
                                                  >
                                                    <span>{categoryLabel} rules</span>
                                                    <span aria-hidden="true">{isRulesOpen ? "⌃" : "⌄"}</span>
                                                  </button>

                                                  {isRulesOpen && (
                                                    <div className={productPageBundleStyles.categoryRuleBody}>
                                                      <p className={productPageBundleStyles.categoryRuleHelp}>
                                                        Create Rules based on amount or quantity of products added on this category.
                                                        <br />
                                                        Note: Rules are only valid on this category
                                                      </p>

                                                      <div className={productPageBundleStyles.rulesList}>
                                                        {rules.map((rule: any, ruleIndex: number) => {
                                                          const ruleId = String(rule.id ?? ruleIndex);
                                                          return (
                                                            <div key={ruleId} className={productPageBundleStyles.categoryRuleBlock}>
                                                              <div className={productPageBundleStyles.ruleHeader}>
                                                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Rule #{ruleIndex + 1}</h4>
                                                                <s-button
                                                                  variant="plain"
                                                                  tone="critical"
                                                                  onClick={() => removeCategoryConditionRule(step.id, catIndex, ruleId)}
                                                                >
                                                                  Remove
                                                                </s-button>
                                                              </div>
                                                              <div className={productPageBundleStyles.categoryRuleFields}>
                                                                <select
                                                                  className={productPageBundleStyles.ruleInlineSelect}
                                                                  value={rule.type ?? "quantity"}
                                                                  onChange={(e) => updateCategoryConditionRule(step.id, catIndex, ruleId, "type", (e.target as HTMLSelectElement).value)}
                                                                  aria-label="Type"
                                                                >
                                                                  {[...STEP_CONDITION_TYPE_OPTIONS].map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                  ))}
                                                                </select>
                                                                <select
                                                                  className={productPageBundleStyles.ruleInlineSelect}
                                                                  value={rule.condition ?? rule.operator ?? "greaterThanOrEqualTo"}
                                                                  onChange={(e) => updateCategoryConditionRule(step.id, catIndex, ruleId, "condition", (e.target as HTMLSelectElement).value)}
                                                                  aria-label="Condition"
                                                                >
                                                                  {[...CATEGORY_CONDITION_OPERATOR_OPTIONS].map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                  ))}
                                                                </select>
                                                                <input
                                                                  type="number"
                                                                  className={productPageBundleStyles.ruleInlineNumber}
                                                                  min={0}
                                                                  value={rule.value ?? ""}
                                                                  onChange={(e) => updateCategoryConditionRule(step.id, catIndex, ruleId, "value", (e.target as HTMLInputElement).value)}
                                                                  autoComplete="off"
                                                                  aria-label="Value"
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
                                                        className={productPageBundleStyles.addSectionButton}
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
                                              <div className={productPageBundleStyles.emptyState}>No rules defined yet</div>
                                            ) : (
                                              <div className={productPageBundleStyles.rulesList}>
                                                {(conditionsState.stepConditions[step.id] || []).map((rule: any, ruleIndex: number) => (
                                                  <div key={rule.id} className={productPageBundleStyles.ruleCard}>
                                                    <div className={productPageBundleStyles.ruleHeader}>
                                                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Rule #{ruleIndex + 1}</h4>
                                                      <s-button
                                                        variant="plain"
                                                        tone="critical"
                                                        onClick={() => conditionsState.removeConditionRule(step.id, rule.id)}
                                                      >
                                                        Remove
                                                      </s-button>
                                                    </div>
                                                    <div className={productPageBundleStyles.ruleFields}>
                                                      <s-select
                                                        value={rule.type}
                                                        label="Type"
                                                        onChange={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'type', (e.target as HTMLSelectElement).value)}
                                                      >
                                                        <s-option value="" disabled>Type</s-option>
                                                        {[...STEP_CONDITION_TYPE_OPTIONS].map(opt => (
                                                          <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                                        ))}
                                                      </s-select>
                                                      <s-select
                                                        value={rule.operator}
                                                        label="Operator"
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
                                              className={productPageBundleStyles.addSectionButton}
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
                    <div className={productPageBundleStyles.card}>
                      <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 650, color: "#202223", letterSpacing: 0 }}>Step Config</h3>
                      <div className={productPageBundleStyles.stepConfigRow}>
                        <div className={productPageBundleStyles.iconColumn}>
                          <div className={productPageBundleStyles.iconBox}>
                                        {(step as any).stepImage ? (
                                          <img
                                            src={(step as any).stepImage}
                                            alt="Step icon"
                              className={productPageBundleStyles.iconImg}
                                          />
                                        ) : (
                              <div className={productPageBundleStyles.iconPlaceholder}>
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
                        <div className={productPageBundleStyles.fieldsColumn}>
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

            {activeSection === "discount_pricing" && (
              <div data-tour-target="ppb-discount-pricing">
              <s-stack direction="block" gap="base">
              <s-section>
                <s-stack direction="block" gap="base">
                  <s-stack direction="block" gap="small-400">
                    <s-stack direction="inline" gap="small" alignItems="center">
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Discount &amp; Pricing</h3>
                      <s-switch
                        checked={pricingState.discountEnabled || undefined}
                        onChange={(e: Event) => pricingState.setDiscountEnabled((e.target as HTMLInputElement).checked)}
                      >
                        Enable
                      </s-switch>
                    </s-stack>
                    <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                      Set up discount rules, applied from lowest to highest.
                    </p>
                  </s-stack>

                  <s-banner tone="info">
                    Tip: Discounts are calculated based on the products in cart, make sure to add the &quot;Default Product&quot; quantity or amount while configuring discounts.
                  </s-banner>

                  <div style={{ opacity: pricingState.discountEnabled ? 1 : 0.45, pointerEvents: pricingState.discountEnabled ? "auto" : "none" }}>
                    <s-stack direction="block" gap="base">
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>Discount Type</p>
                        <s-select
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

                      {pricingState.discountType === DiscountMethod.BUY_X_GET_Y && (
                        <s-stack direction="block" gap="small">
                          {pricingState.discountRules.map((rule, index) => (
                            <s-section key={rule.id} className={productPageBundleStyles.discountRuleCard}>
                              <s-stack direction="block" gap="small">
                                <div className={productPageBundleStyles.discountRuleHeader}>
                                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                                    Rule #{index + 1}
                                  </h4>
                                  <s-button variant="plain" tone="critical" onClick={() => pricingState.removeDiscountRule(rule.id)}>
                                    Remove
                                  </s-button>
                                </div>
                                <div className={productPageBundleStyles.bxyRuleBody}>
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
                                <div className={productPageBundleStyles.bxyRewardGrid}>
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
                              </s-stack>
                            </s-section>
                          ))}
                          {pricingState.discountRules.length < 4 ? (
                            <s-button variant="secondary" icon="plus" style={{ width: "100%" }} onClick={pricingState.addDiscountRule}>
                              Add rule
                            </s-button>
                          ) : (
                            <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>Maximum 4 discount rules reached</p>
                          )}
                        </s-stack>
                      )}

                      {pricingState.discountType !== DiscountMethod.BUY_X_GET_Y && (
                        <s-stack direction="block" gap="small">
                          {pricingState.discountRules.map((rule, index) => (
                            <s-section key={rule.id} className={productPageBundleStyles.discountRuleCard}>
                              <s-stack direction="block" gap="small">
                                <div className={productPageBundleStyles.discountRuleHeader}>
                                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                                    Rule #{index + 1}
                                  </h4>
                                  <s-button variant="plain" tone="critical" onClick={() => pricingState.removeDiscountRule(rule.id)}>
                                    Remove
                                  </s-button>
                                </div>
                                {pricingState.discountType === DiscountMethod.FIXED_BUNDLE_PRICE ? (
                                  <div className={productPageBundleStyles.discountFieldsRowPair}>
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
                                  <div className={productPageBundleStyles.discountFieldsRow}>
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
                                        pricingState.updateDiscountRule(rule.id, { discountValue: safeValue });
                                      }}
                                      min="0"
                                      max={pricingState.discountType === DiscountMethod.PERCENTAGE_OFF ? "100" : undefined}
                                      suffix={pricingState.discountType === DiscountMethod.PERCENTAGE_OFF ? "%" : undefined}
                                      prefix={pricingState.discountType !== DiscountMethod.PERCENTAGE_OFF ? "₹" : undefined}
                                    />
                                  </div>
                                )}
                              </s-stack>
                            </s-section>
                          ))}
                          {pricingState.discountRules.length < 4 ? (
                            <s-button variant="secondary" icon="plus" style={{ width: "100%" }} onClick={pricingState.addDiscountRule}>
                              Add rule
                            </s-button>
                          ) : (
                            <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>Maximum 4 discount rules reached</p>
                          )}
                        </s-stack>
                      )}
                    </s-stack>
                  </div>
                </s-stack>
              </s-section>

              <s-section>
                <div className={displayOptionsInactive ? productPageBundleStyles.displayOptionsInactive : undefined}>
                  <s-stack direction="block" gap="small">
                    <s-stack direction="block" gap="small-400">
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Discount Display Options</h4>
                      <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>Choose how discounts are displayed</p>
                    </s-stack>

                    {/* Bundle Quantity Options — only for non-BXY */}
                    {pricingState.discountType !== DiscountMethod.BUY_X_GET_Y && (
                      <div className={productPageBundleStyles.displayOptionRow}>
                        <s-stack direction="inline" gap="small" alignItems="center" style={{ justifyContent: "space-between" }}>
                          <s-stack direction="inline" gap="small" alignItems="center">
                            <div className={productPageBundleStyles.displayOptionText}>
                              <p className={productPageBundleStyles.displayOptionTitle}>Bundle Quantity Options</p>
                              <p className={productPageBundleStyles.displayOptionDescription}>Configure this section to enable quantity options.</p>
                            </div>
                            <s-switch
                              checked={qtyOptionsEnabled || undefined}
                              disabled={!bundleQuantityOptionsEligible || undefined}
                              onChange={(e: Event) => { setQtyOptionsEnabled((e.target as HTMLInputElement).checked); markAsDirty(); }}
                            />
                          </s-stack>
                          <s-button
                            variant="secondary"
                            icon="globe"
                            disabled={!qtyOptionsEnabled || shopLocales.length === 0 || undefined}
                            onClick={() => setIsBundleQuantityMultiLangModalOpen(true)}
                          >
                            Multi Language
                          </s-button>
                        </s-stack>
                        <p className={productPageBundleStyles.optionNote}>
                          <strong>Note:</strong> Bundle Quantity Options can only be enabled when discount rules are based on quantity.
                        </p>
                        {qtyOptionsEnabled && (
                          <div className={productPageBundleStyles.nestedDisplayOptions}>
                            <s-stack direction="block" gap="small">
                              {pricingState.discountRules.length === 0 ? (
                                <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                                  Add quantity-based discount rules to configure bundle quantity options.
                                </p>
                              ) : (
                                <s-stack direction="block" gap="small">
                                  {pricingState.discountRules.map((r: any, i: number) => (
                                    <s-section key={r.id} className={productPageBundleStyles.discountRuleCard}>
                                      <s-stack direction="block" gap="small-100">
                                        <s-stack direction="inline" gap="small" alignItems="center">
                                          <h5 style={{ margin: 0, fontSize: 13, fontWeight: 600, flex: 1 }}>Rule #{i + 1}</h5>
                                          <s-button
                                            variant="plain"
                                            accessibilityLabel="Make this rule default"
                                            onClick={() => { setQtyOptionsDefaultRuleId(r.id); markAsDirty(); }}
                                          >
                                            {r.id === qtyOptionsDefaultRuleId ? "\u2605" : "\u2606"} Make this rule default
                                          </s-button>
                                        </s-stack>
                                        <s-stack direction="inline" gap="small">
                                          <s-text-field
                                            label="Box Label"
                                            placeholder={`Box of ${r.conditionValue ?? ""}`}
                                            value={qtyRuleLabels[r.id] ?? ""}
                                            onInput={(e: Event) => { setQtyRuleLabels(prev => ({ ...prev, [r.id]: (e.target as HTMLInputElement).value })); markAsDirty(); }}
                                            autoComplete="off"
                                          />
                                          <s-text-field
                                            label="Box Subtext"
                                            placeholder="e.g. 20% off"
                                            value={qtyRuleSubtexts[r.id] ?? ""}
                                            onInput={(e: Event) => { setQtyRuleSubtexts(prev => ({ ...prev, [r.id]: (e.target as HTMLInputElement).value })); markAsDirty(); }}
                                            autoComplete="off"
                                          />
                                        </s-stack>
                                      </s-stack>
                                    </s-section>
                                  ))}
                                </s-stack>
                              )}
                            </s-stack>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className={productPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center" style={{ justifyContent: "space-between" }}>
                        <s-stack direction="inline" gap="small" alignItems="center">
                          <div className={productPageBundleStyles.displayOptionText}>
                            <p className={productPageBundleStyles.displayOptionTitle}>Progress Bar</p>
                            <p className={productPageBundleStyles.displayOptionDescription}>Edit the progress bar content and settings.</p>
                          </div>
                          <s-switch
                            checked={progressBarEnabled || undefined}
                            onChange={(e: Event) => { setProgressBarEnabled((e.target as HTMLInputElement).checked); markAsDirty(); }}
                          />
                        </s-stack>
                        <s-button
                          variant="secondary"
                          icon="globe"
                          disabled={!progressBarEnabled || progressBarType !== "step_based" || shopLocales.length === 0 || undefined}
                          onClick={() => setIsProgressBarMultiLangModalOpen(true)}
                        >
                          Multi Language
                        </s-button>
                      </s-stack>
                      {progressBarEnabled && (
                        <div className={productPageBundleStyles.nestedDisplayOptions}>
                          <s-stack direction="block" gap="small">
                            <s-choice-list
                              label="Progress bar type"
                              labelAccessibilityVisibility="exclusive"
                              values={[progressBarType]}
                              onChange={(e: Event) => {
                                const val = ((e.currentTarget as any).values as string[] | undefined)?.[0];
                                if (val) setProgressBarType(val);
                              }}
                            >
                              <s-choice value="simple">Simple Bar</s-choice>
                              <s-choice value="step_based">Step-Based Bar</s-choice>
                            </s-choice-list>
                            {progressBarType === "step_based" ? (
                              <s-stack direction="block" gap="small">
                                {pricingState.discountRules.length === 0 ? (
                                  <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>Add discount rules to configure tier text.</p>
                                ) : pricingState.discountRules.map((rule: any, index: number) => (
                                  <s-section key={rule.id} className={productPageBundleStyles.discountRuleCard}>
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

                    {/* Discount Messaging */}
                    <div className={productPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center" style={{ justifyContent: "space-between" }}>
                        <s-stack direction="inline" gap="small" alignItems="center">
                          <div className={productPageBundleStyles.displayOptionText}>
                            <p className={productPageBundleStyles.displayOptionTitle}>Discount Messaging</p>
                            <p className={productPageBundleStyles.displayOptionDescription}>Edit how discount messages appear above the subtotal.</p>
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
                        <div className={productPageBundleStyles.nestedDisplayOptions}>
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
                                      setRuleMessagesByLocale(prev => ({ ...prev, [locale]: ruleMessages }));
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
                                        ? (ruleMessagesByLocale[activeDiscountLocale]?.[rule.id] ?? ruleMessages[rule.id])
                                        : ruleMessages[rule.id];
                                      const defaultDiscountText = getDefaultDiscountRuleText(pricingState.discountType, index);
                                      return (
                                    <s-section key={rule.id} className={productPageBundleStyles.discountRuleCard}>
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
                                    <s-section className={productPageBundleStyles.discountRuleCard}>
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

            {activeSection === "bundle_visibility" && (
              <div data-tour-target="ppb-bundle-visibility">
                <div className={productPageBundleStyles.visibilityOverviewStack}>
                  <div className={productPageBundleStyles.visibilityOverviewCard}>
                    <div className={productPageBundleStyles.visibilityCardHeaderRow}>
                      <div>
                        <h3 className={productPageBundleStyles.visibilityCardTitle}>App Embed Status</h3>
                        <p className={productPageBundleStyles.visibilityCardText}>
                          {appEmbedEnabled
                            ? "Your store is connected and ready. Your bundle can now render on your storefront."
                            : "Enable the Theme app extension for Wolfpack Bundles to place and preview the bundle."}
                        </p>
                      </div>
                      <div className={appEmbedEnabled ? productPageBundleStyles.visibilityStatusEnabled : productPageBundleStyles.visibilityStatusWarning}>
                        {appEmbedEnabled ? "Enabled" : "Not enabled"}
                      </div>
                    </div>
                    {!appEmbedEnabled && themeEditorUrl && (
                      <button type="button" className={productPageBundleStyles.visibilitySecondaryAction} onClick={() => window.open(themeEditorUrl, "_blank")}>
                        Enable here
                      </button>
                    )}
                  </div>

                  <div className={productPageBundleStyles.visibilityOverviewCard}>
                    <div className={productPageBundleStyles.visibilitySectionIntro}>
                      <h3 className={productPageBundleStyles.visibilityCardTitle}>Publishing Best Practices</h3>
                      <p className={productPageBundleStyles.visibilityCardText}>
                        Pick a placement and follow the quick guide to make your bundle discoverable on your store.
                      </p>
                    </div>
                    <div className={productPageBundleStyles.visibilityGuideGrid}>
                      {[
                        { title: "Hero Banner",           desc: "Add a button to your homepage hero to drive shoppers directly to your bundle.",      img: "/Hero-Banner.png" },
                        { title: "Navigation Menu",       desc: "Add your bundle as a nav link so shoppers can find it from anywhere on your store.", img: "/Navigation-Menu.png" },
                        { title: "Announcement Banner",   desc: "Show your offer in the announcement bar so visitors see it instantly.",               img: "/Announcement-Bar.png" },
                        { title: "Featured Product Card", desc: "Feature your bundle product on your homepage so shoppers find it right away.",        img: "/Featured-Product-Card.png" },
                      ].map(({ title, desc: description, img }) => (
                        <div key={title} className={productPageBundleStyles.visibilityGuideCard}>
                          <div className={productPageBundleStyles.visibilityGuideMedia}>
                            <img src={img} alt={title} />
                          </div>
                          <div className={productPageBundleStyles.visibilityGuideBody}>
                            <h4 className={productPageBundleStyles.visibilityGuideTitle}>{title}</h4>
                            <p className={productPageBundleStyles.visibilityGuideDescription}>{description}</p>
                            <div className={productPageBundleStyles.visibilityGuideFooter}>
                              <button type="button" className={productPageBundleStyles.visibilityGuideAction} onClick={() => window.open("https://wolfpackapps.com", "_blank")}>
                                Quick Setup Guide
                              </button>
                              <span className={productPageBundleStyles.visibilitySetupTime}>5 min setup</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={productPageBundleStyles.visibilityOverviewCard}>
                    <div className={productPageBundleStyles.visibilitySectionIntro}>
                      <h3 className={productPageBundleStyles.visibilityCardTitle}>Your Bundle Link</h3>
                      <p className={productPageBundleStyles.visibilityCardText}>
                        Use this link to place your bundle anywhere - theme components, emails, ads, or social bios.
                      </p>
                    </div>
                    {bundle.shopifyProductHandle && shop ? (
                      <div className={productPageBundleStyles.visibilityLinkRow}>
                        <input
                          className={productPageBundleStyles.visibilityTextInput}
                          aria-label="Bundle link"
                          value={`https://${shop}/products/${bundle.shopifyProductHandle}`}
                          disabled
                          readOnly
                        />
                        <button
                          type="button"
                          className={productPageBundleStyles.visibilitySecondaryAction}
                          onClick={() => {
                            const url = `https://${shop}/products/${bundle.shopifyProductHandle}`;
                            void navigator.clipboard?.writeText(url);
                            shopify.toast.show("Bundle link copied", { isError: false });
                          }}
                        >
                          Copy Link
                        </button>
                        <button
                          type="button"
                          className={productPageBundleStyles.visibilityPlainAction}
                          onClick={() => window.open(`https://${shop}/products/${bundle.shopifyProductHandle}`, "_blank")}
                        >
                          View on Storefront
                        </button>
                      </div>
                    ) : (
                      <p className={productPageBundleStyles.visibilityCardText}>Bundle product not yet linked.</p>
                    )}
                  </div>

                  <div className={productPageBundleStyles.visibilityOverviewCard}>
                    <h3 className={productPageBundleStyles.visibilityCardTitle}>Want more placement options?</h3>
                    <div className={productPageBundleStyles.visibilitySetupPanel}>
                      <div>
                        <h4 className={productPageBundleStyles.visibilitySetupTitle}>Bundle Widget</h4>
                        <p className={productPageBundleStyles.visibilityCardText}>
                          Add a bundle button to specific product pages.
                        </p>
                      </div>
                      <button type="button" className={productPageBundleStyles.visibilityPrimaryAction} onClick={() => handleSectionChange("bundle_widget")}>
                        Set up Bundle Widget
                      </button>
                    </div>
                    <div className={productPageBundleStyles.visibilitySetupPanel}>
                      <div>
                        <h4 className={productPageBundleStyles.visibilitySetupTitle}>Bundle Embed</h4>
                        <p className={productPageBundleStyles.visibilityCardText}>
                          Embed the full bundle builder directly on a product page.
                        </p>
                      </div>
                      <button type="button" className={productPageBundleStyles.visibilitySecondaryAction} onClick={() => handleSectionChange("bundle_embed")}>
                        Set up Bundle Embed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "bundle_widget" && (
              <div data-tour-target="ppb-bundle-widget">
                <div className={productPageBundleStyles.visibilityPanel}>
                  <div className={productPageBundleStyles.visibilityTitleSwitchRow}>
                    <div>
                      <h3 className={productPageBundleStyles.visibilityPanelTitle}>Product Page Bundle Upsell Widgets</h3>
                      <p className={productPageBundleStyles.visibilityCardText}>
                        This will display an upsell block or button on the product pages of your choice.
                      </p>
                    </div>
                    <s-switch
                      checked={upsellWidgetEnabled || undefined}
                      onChange={(e: any) => { setUpsellWidgetEnabled(e.target.checked); markAsDirty(); }}
                    />
                  </div>

                  <div className={productPageBundleStyles.upsellWidgetContent} style={{ opacity: upsellWidgetEnabled ? 1 : 0.4, pointerEvents: upsellWidgetEnabled ? undefined : 'none' }}>
                  <div className={productPageBundleStyles.visibilityPreviewFrame}>
                    <img
                      className={productPageBundleStyles.visibilityPreviewFullImage}
                      src={upsellWidgetDisplayMode === "button" ? "/Upsell-Button.png" : "/Upsell-Block.png"}
                      alt={upsellWidgetDisplayMode === "button" ? "Upsell Button preview" : "Upsell Block preview"}
                    />
                    <div className={productPageBundleStyles.visibilityRadioBar}>
                      <label className={productPageBundleStyles.visibilityRadioLabel}>
                        <input
                          type="radio"
                          name="upsellWidgetType"
                          value="block"
                          checked={upsellWidgetDisplayMode !== "button"}
                          onChange={() => { setUpsellWidgetDisplayMode("block"); markAsDirty(); }}
                        />
                        <span>Offer Upsell Block</span>
                      </label>
                      <label className={productPageBundleStyles.visibilityRadioLabel}>
                        <input
                          type="radio"
                          name="upsellWidgetType"
                          value="button"
                          checked={upsellWidgetDisplayMode === "button"}
                          onChange={() => { setUpsellWidgetDisplayMode("button"); markAsDirty(); }}
                        />
                        <span>Offer Upsell Button</span>
                      </label>
                    </div>
                  </div>

                  <div className={productPageBundleStyles.visibilityInfoBanner}>
                    Select if you want the upsell block or button to appear on product pages.
                  </div>

                  <div className={productPageBundleStyles.visibilityPanelSection}>
                    <div className={productPageBundleStyles.visibilitySectionHeader}>
                      <h4 className={productPageBundleStyles.visibilitySectionTitle}>Widget Settings</h4>
                      <s-button
                        variant="secondary"
                        icon="globe"
                        onClick={() => openMultiLanguageModal("Bundle Widget", [
                          { key: "widgetTitle", label: "Widget Title", fallback: upsellWidgetTitle },
                          { key: "widgetDescription", label: "Widget Description", fallback: upsellWidgetDescription, multiline: true },
                          { key: "widgetButtonText", label: "Widget Button Text", fallback: upsellWidgetButtonText },
                        ])}
                      >
                        Multi Language
                      </s-button>
                    </div>
                    <div className={productPageBundleStyles.visibilitySettingsGrid}>
                      <div className={productPageBundleStyles.visibilityImagePicker}>
                        <FilePicker
                          label="Upload Image"
                          hideCropEditor
                          value={upsellWidgetImageUrl || null}
                          onChange={(url) => { setUpsellWidgetImageUrl(url ?? ""); markAsDirty(); }}
                        />
                      </div>
                      <div className={productPageBundleStyles.visibilityFieldStack}>
                        <label className={productPageBundleStyles.visibilityFieldLabel}>
                          <span>Widget Title</span>
                          <input
                            className={productPageBundleStyles.visibilityTextInput}
                            value={upsellWidgetTitle}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUpsellWidgetTitle(e.target.value); markAsDirty(); }}
                          />
                        </label>
                        <label className={productPageBundleStyles.visibilityFieldLabel}>
                          <span>Widget Description</span>
                          <textarea
                            className={productPageBundleStyles.visibilityTextarea}
                            value={upsellWidgetDescription}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setUpsellWidgetDescription(e.target.value); markAsDirty(); }}
                          />
                        </label>
                        <label className={productPageBundleStyles.visibilityFieldLabel}>
                          <span>Widget Button Text</span>
                          <input
                            className={productPageBundleStyles.visibilityTextInput}
                            value={upsellWidgetButtonText}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUpsellWidgetButtonText(e.target.value); markAsDirty(); }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className={productPageBundleStyles.visibilityPanelSection}>
                    <h4 className={productPageBundleStyles.visibilitySectionTitle}>Display Widget on</h4>
                    <div className={productPageBundleStyles.visibilityTargetOptions}>
                      {[
                        { value: "all",                   label: "All products in bundle"  },
                        { value: "specific_products",     label: "Specific products"        },
                        { value: "specific_collections",  label: "Specific collections"     },
                      ].map(({ value, label }) => (
                        <label key={value} className={productPageBundleStyles.visibilityRadioLabel}>
                          <input
                            type="radio"
                            name="widgetDisplayOn"
                            value={value}
                            checked={upsellWidgetDisplayOn === value}
                            onChange={() => { setUpsellWidgetDisplayOn(value); markAsDirty(); }}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    {upsellWidgetDisplayOn === "specific_products" && (
                      <div className={productPageBundleStyles.visibilityTargetPicker}>
                        <button type="button" className={productPageBundleStyles.visibilitySecondaryAction} onClick={() => openVisibilityProductPicker("widget")}>
                          Select products
                        </button>
                        <div className={productPageBundleStyles.visibilitySelectionList}>
                          {upsellWidgetSelectedProducts.map((product: any, index) => (
                            <div key={getVisibilityResourceId(product) ?? index} className={productPageBundleStyles.visibilitySelectionItem}>
                              <span>{product.title ?? "Untitled product"}</span>
                              <button type="button" onClick={() => removeVisibilityProductTarget("widget", index)}>Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {upsellWidgetDisplayOn === "specific_collections" && (
                      <div className={productPageBundleStyles.visibilityTargetPicker}>
                        <button type="button" className={productPageBundleStyles.visibilitySecondaryAction} onClick={() => openVisibilityCollectionPicker("widget")}>
                          Select collections
                        </button>
                        <div className={productPageBundleStyles.visibilitySelectionList}>
                          {upsellWidgetCollectionsSelectedData.map((collection: any, index) => (
                            <div key={getVisibilityResourceId(collection) ?? index} className={productPageBundleStyles.visibilitySelectionItem}>
                              <span>{collection.title ?? "Untitled collection"}</span>
                              <button type="button" onClick={() => removeVisibilityCollectionTarget("widget", index)}>Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <label className={productPageBundleStyles.visibilityCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={autoSelectBrowsedProduct}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAutoSelectBrowsedProduct(e.target.checked); markAsDirty(); }}
                    />
                    <span>Add browsed product to bundle</span>
                  </label>
                  </div>
                </div>

                <div className={productPageBundleStyles.visibilityPlacementCard}>
                  <div>
                    <h4 className={productPageBundleStyles.visibilitySectionTitle}>Embed the Upsell {upsellWidgetDisplayMode === "button" ? "Button" : "Block"} at a custom location</h4>
                    <p className={productPageBundleStyles.visibilityCardText}>
                      By default, the upsell {upsellWidgetDisplayMode === "button" ? "button" : "block"} is added below the Buy Button. You can move it to a custom spot on the product page if you prefer.
                    </p>
                  </div>
                  <button type="button" className={productPageBundleStyles.visibilityPrimaryAction} onClick={handlePlaceWidget}>
                    Embed Upsell {upsellWidgetDisplayMode === "button" ? "Button" : "Block"}
                  </button>
                </div>
              </div>
            )}

            {activeSection === "bundle_embed" && (
              <div data-tour-target="ppb-bundle-embed">
                <div className={productPageBundleStyles.visibilityPanel}>
                  <div className={productPageBundleStyles.visibilityTitleSwitchRow}>
                    <div>
                      <h3 className={productPageBundleStyles.visibilityPanelTitle}>Embed Bundle Builder on Product Pages</h3>
                      <p className={productPageBundleStyles.visibilityCardText}>
                        Directly embed the Bundle Builder block on product pages to let customers curate their bundles right there.
                      </p>
                    </div>
                    <s-switch
                      checked={bundleEmbedEnabled || undefined}
                      onChange={(e: Event) => { setBundleEmbedEnabled((e.target as HTMLInputElement).checked); markAsDirty(); }}
                    />
                  </div>

                  <div style={{ opacity: bundleEmbedEnabled ? 1 : 0.4, pointerEvents: bundleEmbedEnabled ? undefined : 'none' }}>
                  <div className={productPageBundleStyles.visibilitySectionHeader}>
                    <span />
                    <s-button
                      variant="plain"
                      icon="globe"
                      accessibilityLabel="Multi Language"
                      title="Multi Language"
                      onClick={() => openMultiLanguageModal("Bundle Embed", [
                        { key: "embedTitle", label: "Title", fallback: bundleEmbedTitle },
                        { key: "embedSubTitle", label: "Sub Title", fallback: bundleEmbedSubTitle, multiline: true },
                      ])}
                    />
                  </div>

                  <div className={productPageBundleStyles.visibilityFieldStack}>
                    <label className={productPageBundleStyles.visibilityFieldLabel}>
                      <span>Title</span>
                      <input
                        className={productPageBundleStyles.visibilityTextInput}
                        value={bundleEmbedTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBundleEmbedTitle(e.target.value); markAsDirty(); }}
                      />
                    </label>
                    <label className={productPageBundleStyles.visibilityFieldLabel}>
                      <span>Sub Title</span>
                      <input
                        className={productPageBundleStyles.visibilityTextInput}
                        value={bundleEmbedSubTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBundleEmbedSubTitle(e.target.value); markAsDirty(); }}
                      />
                    </label>
                  </div>

                  <div className={productPageBundleStyles.visibilityPanelSection}>
                    <h4 className={productPageBundleStyles.visibilitySectionTitle}>Display Bundle on</h4>
                    <div className={productPageBundleStyles.visibilityTargetOptions}>
                      {[
                        { value: "all_products",          label: "All products in bundle"  },
                        { value: "specific_products",     label: "Specific products"        },
                        { value: "specific_collections",  label: "Specific collections"     },
                      ].map(({ value, label }) => (
                        <label key={value} className={productPageBundleStyles.visibilityRadioLabel}>
                          <input
                            type="radio"
                            name="embedDisplayOn"
                            value={value}
                            checked={bundleEmbedDisplayOn === value}
                            onChange={() => { setBundleEmbedDisplayOn(value); markAsDirty(); }}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    {bundleEmbedDisplayOn === "specific_products" && (
                      <div className={productPageBundleStyles.visibilityTargetPicker}>
                        <button type="button" className={productPageBundleStyles.visibilitySecondaryAction} onClick={() => openVisibilityProductPicker("embed")}>
                          Select products
                        </button>
                        <div className={productPageBundleStyles.visibilitySelectionList}>
                          {bundleEmbedSelectedProducts.map((product: any, index) => (
                            <div key={getVisibilityResourceId(product) ?? index} className={productPageBundleStyles.visibilitySelectionItem}>
                              <span>{product.title ?? "Untitled product"}</span>
                              <button type="button" onClick={() => removeVisibilityProductTarget("embed", index)}>Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {bundleEmbedDisplayOn === "specific_collections" && (
                      <div className={productPageBundleStyles.visibilityTargetPicker}>
                        <button type="button" className={productPageBundleStyles.visibilitySecondaryAction} onClick={() => openVisibilityCollectionPicker("embed")}>
                          Select collections
                        </button>
                        <div className={productPageBundleStyles.visibilitySelectionList}>
                          {bundleEmbedCollectionsSelectedData.map((collection: any, index) => (
                            <div key={getVisibilityResourceId(collection) ?? index} className={productPageBundleStyles.visibilitySelectionItem}>
                              <span>{collection.title ?? "Untitled collection"}</span>
                              <button type="button" onClick={() => removeVisibilityCollectionTarget("embed", index)}>Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <label className={productPageBundleStyles.visibilityCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={bundleEmbedAddBrowsedProduct}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBundleEmbedAddBrowsedProduct(e.target.checked); markAsDirty(); }}
                    />
                    <span>Add browsed product to bundle</span>
                  </label>
                  </div>
                </div>

                <div className={productPageBundleStyles.visibilityPlacementCard}>
                  <div>
                    <h4 className={productPageBundleStyles.visibilitySectionTitle}>Put the Bundle Builder at a custom location</h4>
                    <p className={productPageBundleStyles.visibilityCardText}>
                      By default, the bundle builder is added below the Buy Button. You can move it to a custom spot on the product page if you prefer.
                    </p>
                  </div>
                  <button type="button" className={productPageBundleStyles.visibilityPrimaryAction} onClick={handlePlaceWidget}>
                    Place Block
                  </button>
                </div>
              </div>
            )}

            {activeSection === "images_gifs" && (
              <div data-tour-target="ppb-design-settings">
              <s-stack direction="block" gap="base">
                <div style={{ padding: "var(--s-space-400)", background: "#f6f6f7", borderRadius: 8 }}>
                  <s-stack direction="inline" gap="small-100" style={{ alignItems: "center" }}>
                    <s-icon name="image-alt-minor" />
                    <s-stack direction="block">
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Media Assets</p>
                      <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                        Add visual media to enhance the bundle experience for shoppers.
                      </p>
                    </s-stack>
                  </s-stack>
                </div>

                {stepsState.steps.length > 0 && (
                  <s-section>
                    <s-stack direction="block" gap="base">
                      <s-stack direction="inline">
                        <s-stack direction="inline" gap="small" style={{ flex: 1 }}>
                          <s-icon name="image-alt-minor" />
                          <s-stack direction="block" gap="small-400">
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Step Images</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Banner image per step — shown above the step's products in the widget</p>
                          </s-stack>
                        </s-stack>
                        <s-badge tone="info">Per step</s-badge>
                      </s-stack>

                      <div>
                        <div style={{ display: "flex", borderBottom: "1.5px solid #e5e7eb", marginBottom: 16, gap: 0 }}>
                          {stepsState.steps.map((step, i) => (
                            <button
                              key={`asset-step-${step.id}`}
                              onClick={() => setActiveAssetTabIndex(i)}
                              style={{
                                padding: "10px 0",
                                marginRight: 24,
                                fontSize: 14,
                                fontWeight: activeAssetTabIndex === i ? 600 : 500,
                                color: activeAssetTabIndex === i ? "#1a1a1a" : "#6b7280",
                                cursor: "pointer",
                                borderBottom: activeAssetTabIndex === i ? "2px solid #1a1a1a" : "2px solid transparent",
                                marginBottom: -1.5,
                                background: "none",
                                border: "none",
                                borderBottomStyle: "solid",
                                borderBottomWidth: 2,
                                borderBottomColor: activeAssetTabIndex === i ? "#1a1a1a" : "transparent",
                              }}
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
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Step Banner Image</p>
                              <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Full-width image shown above this step's products. Recommended: 1600 × 400 px.</p>
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
                    <s-stack direction="inline" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <s-stack direction="inline" gap="small" style={{ alignItems: "center" }}>
                        <s-icon name="refresh-minor" />
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Loading Animation</p>
                          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>Overlay shown while bundle content is loading</p>
                        </s-stack>
                      </s-stack>
                      <s-tooltip content="This setting controls the loading animation visible to shoppers on your storefront">
                        <s-badge tone="magic">Storefront</s-badge>
                      </s-tooltip>
                    </s-stack>

                    <div style={{ padding: "var(--s-space-400)", background: "#f6f6f7", borderRadius: 8 }}>
                      <s-stack direction="inline" gap="large">
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#6d7175" }}>FORMAT</p>
                          <p style={{ margin: 0, fontSize: 14 }}>GIF only</p>
                        </s-stack>
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#6d7175" }}>RECOMMENDED SIZE</p>
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
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#6d7175" }}>PREVIEW</p>
                        <img
                          src={loadingGif}
                          alt="Loading animation preview"
                          style={{ maxWidth: 150, maxHeight: 150, borderRadius: 8, border: "1px solid #e1e3e5" }}
                        />
                      </s-stack>
                    )}
                  </s-stack>
                </s-section>
              </s-stack>
              </div>
            )}

            {activeSection === "bundle_settings" && (() => {
              const selectedDefaultProducts = defaultProductsData.products ?? [];
              const defaultProductsEnabled = defaultProductsData.isDefaultProductsEnabled === true;
              const defaultProductCount = selectedDefaultProducts.length;
              const defaultProductSelectionIds = selectedDefaultProducts
                .map((product: any) => product.graphqlId || product.productId || product.id)
                .filter(Boolean)
                .map((id: string) => ({ id }));
              const individualSellingPlanBlocked = pricingState.discountType === DiscountMethod.BUY_X_GET_Y;
              const handleDefaultProductPicker = async () => {
                const picked = await (shopify as any).resourcePicker({
                  type: "product",
                  multiple: true,
                  action: "select",
                  selectionIds: defaultProductSelectionIds,
                });
                if (!picked) return;

                const defaultProducts = picked
                  .map(buildDefaultProductEntryFromPicker)
                  .filter((product): product is NonNullable<ReturnType<typeof buildDefaultProductEntryFromPicker>> => Boolean(product));

                setDefaultProductsData((prev) => ({
                  isDefaultProductsEnabled: true,
                  defaultProductsTitle: prev.defaultProductsTitle ?? "",
                  products: defaultProducts,
                }));
                markAsDirty();
              };

              return (
                <div data-tour-target="ppb-bundle-status">
                  <s-stack direction="block" gap="base">

                    {/* Pre Selected Product */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <div className={productPageBundleStyles.settingTitleRow}>
                          <h3 className={productPageBundleStyles.settingTitle}>Pre Selected Product</h3>
                          <span className={productPageBundleStyles.settingInlineSwitch}>
                            <s-switch
                              accessibilityLabel="Enable pre selected product"
                              checked={defaultProductsEnabled || undefined}
                              onChange={(e: Event) => {
                                const checked = (e.target as HTMLInputElement).checked;
                                setDefaultProductsData((prev) => ({
                                  ...prev,
                                  isDefaultProductsEnabled: checked,
                                  defaultProductsTitle: prev.defaultProductsTitle ?? "",
                                  products: prev.products ?? [],
                                }));
                                markAsDirty();
                              }}
                            />
                          </span>
                        </div>
                        <s-banner tone="info">
                          Tip: Discounts are based on all items in your cart. Don&apos;t forget to include the Pre Selected Product&apos;s quantity or amount when setting up discounts.
                        </s-banner>
                        <s-text-field
                          label="Default products title"
                          value={defaultProductsData.defaultProductsTitle ?? ""}
                          onInput={(e: Event) => {
                            const value = (e.target as HTMLInputElement).value;
                            setDefaultProductsData((prev) => ({ ...prev, defaultProductsTitle: value }));
                            markAsDirty();
                          }}
                          autoComplete="off"
                        />
                        <div className={productPageBundleStyles.defaultProductsPickerGroup}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Choose default products</p>
                          <div className={productPageBundleStyles.defaultProductsPickerActions}>
                            <s-button
                              variant={defaultProductsEnabled ? "primary" : "secondary"}
                              disabled={!defaultProductsEnabled || undefined}
                              onClick={handleDefaultProductPicker}
                            >
                              Browse Products
                            </s-button>
                            {defaultProductCount > 0 && <s-badge tone="success">{defaultProductCount} selected</s-badge>}
                          </div>
                        </div>
                      </s-stack>
                    </s-section>

                    {/* Enable Quantity Validation */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <div className={productPageBundleStyles.settingTitleRow}>
                          <h3 className={productPageBundleStyles.settingTitle}>Enable Quantity Validation</h3>
                          <span className={productPageBundleStyles.settingInlineSwitch}>
                            <s-switch
                              accessibilityLabel="Enable quantity validation"
                              checked={productSlotsEnabled || undefined}
                              onChange={(e: Event) => { setProductSlotsEnabled((e.target as HTMLInputElement).checked); markAsDirty(); }}
                            />
                          </span>
                        </div>
                        <s-text-field
                          label="Maximum allowed quantity per product"
                          type="number"
                          min="1"
                          value={maxQtyPerProduct || "1"}
                          disabled={!productSlotsEnabled}
                          onInput={(e: Event) => { setMaxQtyPerProduct((e.target as HTMLInputElement).value); markAsDirty(); }}
                          autoComplete="off"
                        />
                        {individualSellingPlanBlocked && (
                          <s-banner tone="warning">
                            {INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE}
                          </s-banner>
                        )}
                        <div className={productPageBundleStyles.settingTitleRow}>
                          <h3 className={`${productPageBundleStyles.settingTitle} ${individualSellingPlanBlocked ? productPageBundleStyles.settingTitleMuted : ""}`}>
                            Pre-order &amp; Subscription Integration
                          </h3>
                          <span className={productPageBundleStyles.settingInlineSwitch}>
                            <s-switch
                              accessibilityLabel="Enable pre-order and subscription integration"
                              checked={!individualSellingPlanBlocked && individualSellingPlanEnabled || undefined}
                              disabled={individualSellingPlanBlocked || undefined}
                              onChange={(e: Event) => {
                                setIndividualSellingPlanEnabled((e.target as HTMLInputElement).checked);
                                markAsDirty();
                              }}
                            />
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "#8c9196" }}>
                          Let customers select a unique selling plan (subscription, pre-order, etc.) for each product in the bundle.
                        </p>
                        <s-select
                          label="Apply to products"
                          value={individualSellingPlanShowFor}
                          disabled={individualSellingPlanBlocked || !individualSellingPlanEnabled || undefined}
                          onChange={(e: Event) => {
                            setIndividualSellingPlanShowFor(
                              ((e.target as HTMLSelectElement).value as IndividualSellingPlanShowFor)
                            );
                            markAsDirty();
                          }}
                        >
                          <s-option value="ALL_PRODUCTS">All products</s-option>
                          <s-option value="OOS_PRODUCTS">Out of stock products</s-option>
                        </s-select>
                      </s-stack>
                    </s-section>

                    {/* Cart line item discount display */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Cart line item discount display</h3>
                          <button
                            type="button"
                            onClick={() => {
                              const authSearch = window.location.search.replace(/^\?/, "");
                              const targetHref = authSearch
                                ? `${PRODUCT_PAGE_EDIT_DEFAULTS_HREF}&${authSearch}`
                                : PRODUCT_PAGE_EDIT_DEFAULTS_HREF;
                              window.location.assign(targetHref);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              minHeight: 32,
                              padding: "0 12px",
                              borderRadius: 8,
                              border: "1px solid #c9cccf",
                              color: "#202223",
                              fontSize: 13,
                              fontWeight: 600,
                              textDecoration: "none",
                              background: "#ffffff",
                              cursor: "pointer",
                            }}
                          >
                            Edit Defaults
                          </button>
                        </s-stack>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>Shows how much the customer is saving on the bundle in cart</p>
                        {[
                          { value: "defaults", label: "Use app defaults",         description: "Uses the discount format and label configured in your app settings." },
                          { value: "custom",   label: "Customize for this bundle", description: "Set a different discount format or label for this bundle only." },
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

            {activeSection === "subscriptions" && (() => {
              const validation = subscriptionFetcher.data;
              const validationMessage = validation?.success === false
                ? validation.error
                : validation?.isValid === false
                  ? (validation.message ?? SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE)
                  : null;

              return (
                <div data-tour-target="ppb-subscriptions">
                  <s-section>
                    <s-stack direction="block" gap="base">
                      <s-stack direction="inline" alignItems="center" gap="small">
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Bundle Subscriptions</h3>
                        <s-button variant="plain">
                          How to setup?
                        </s-button>
                      </s-stack>
                      <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                        Allow customers to purchase the bundle as a subscription
                      </p>

                      {validationMessage && (
                        <s-banner tone="warning">
                          <s-stack direction="block" gap="small-400">
                            <span>{validationMessage}</span>
                            <s-button variant="plain">Learn More</s-button>
                          </s-stack>
                        </s-banner>
                      )}

                      <s-stack direction="inline" gap="small" alignItems="center">
                        <s-button
                          variant="primary"
                          loading={subscriptionFetcher.state === "submitting" || undefined}
                          disabled={subscriptionFetcher.state !== "idle" || undefined}
                          onClick={() => {
                            const formData = new FormData();
                            formData.append("intent", "validateSellingPlanGroups");
                            subscriptionFetcher.submit(formData, { method: "post" });
                          }}
                        >
                          Get Subscription Plans
                        </s-button>
                      </s-stack>
                    </s-stack>
                  </s-section>
                </div>
              );
            })()}

            {activeSection === "free_gift_addons" && (() => {
              const step = stepsState.steps[activeTabIndex] || stepsState.steps[0];
              if (!step) return (
                <div className={productPageBundleStyles.card} style={{ textAlign: "center", padding: "32px 16px" }}>
                  <s-text tone="subdued">Add at least one step in <strong>Step Setup</strong> to configure Free Gift &amp; Add Ons settings.</s-text>
                </div>
              );
              const addonMessages = ruleMessages[`addons-${step.id}`] || {
                discountText: "",
                successMessage: "",
              };

              return (
                <div>
                  <s-stack direction="block" gap="base">
                    {/* Card 1: Add-Ons and Gifting Step */}
                    <div className={productPageBundleStyles.card}>
                      <div className={productPageBundleStyles.panelHeader}>
                        <h3 className={productPageBundleStyles.panelTitle}>Add-Ons and Gifting Step</h3>
                        <s-checkbox
                          accessibilityLabel="Enable add-ons and gifting step"
                          checked={step.isFreeGift || undefined}
                          onChange={(e: Event) => {
                            const checked = (e.target as HTMLInputElement).checked;
                            stepsState.updateStepField(step.id, "isFreeGift", checked);
                            if (!checked) {
                              stepsState.updateStepField(step.id, "addonLabel", null);
                              stepsState.updateStepField(step.id, "addonTitle", null);
                              stepsState.updateStepField(step.id, "addonIconUrl", null);
                            }
                            markAsDirty();
                          }}
                        />
                      </div>
                      <div style={{ marginTop: 16 }} className={productPageBundleStyles.mediaFieldGrid}>
                        <div className={productPageBundleStyles.iconColumn}>
                          <div className={productPageBundleStyles.iconBox}>
                            {step.addonIconUrl ? (
                              <img src={step.addonIconUrl} alt="Add-ons step icon" className={productPageBundleStyles.iconImg} />
                            ) : (
                              <div className={productPageBundleStyles.iconPlaceholder}>Upload file</div>
                            )}
                          </div>
                          {showIconPickerForStep === `addon-${step.id}` && (
                            <FilePicker
                              value={step.addonIconUrl ?? null}
                              onChange={(url: string | null) => {
                                stepsState.updateStepField(step.id, "addonIconUrl", url);
                                setShowIconPickerForStep(null);
                                markAsDirty();
                              }}
                              label=""
                              hideCropEditor
                            />
                          )}
                          <s-button
                            variant="secondary"
                            icon="upload"
                            onClick={() => setShowIconPickerForStep(prev => prev === `addon-${step.id}` ? null : `addon-${step.id}`)}
                          >
                            {showIconPickerForStep === `addon-${step.id}` ? "Close picker" : "Replace"}
                          </s-button>
                        </div>
                        <s-stack direction="block" gap="small">
                          <s-button variant="secondary" icon="globe" disabled>
                            Multi Language
                          </s-button>
                          <s-text-field
                            label="Step Name"
                            value={step.addonLabel ?? step.freeGiftName ?? ""}
                            placeholder="Add On"
                            onInput={(e: Event) => {
                              const value = (e.target as HTMLInputElement).value;
                              stepsState.updateStepField(step.id, "addonLabel", value);
                              stepsState.updateStepField(step.id, "freeGiftName", value);
                              markAsDirty();
                            }}
                            autoComplete="off"
                          />
                          <s-text-field
                            label="Add On"
                            value={step.addonAddText ?? ""}
                            placeholder="Add to Cart"
                            helpText="Button text on the product card when adding an add-on item"
                            onInput={(e: Event) => {
                              stepsState.updateStepField(step.id, "addonAddText", (e.target as HTMLInputElement).value || null);
                              markAsDirty();
                            }}
                            autoComplete="off"
                          />
                          <s-text-field
                            label="Step Title"
                            value={step.addonTitle ?? ""}
                            onInput={(e: Event) => {
                              stepsState.updateStepField(step.id, "addonTitle", (e.target as HTMLInputElement).value);
                              markAsDirty();
                            }}
                            autoComplete="off"
                          />
                          <s-text-field
                            label="Replace"
                            value={step.addonReplaceText ?? ""}
                            placeholder="Selected ✓"
                            helpText="Button text on the product card when an add-on item is already selected"
                            onInput={(e: Event) => {
                              stepsState.updateStepField(step.id, "addonReplaceText", (e.target as HTMLInputElement).value || null);
                              markAsDirty();
                            }}
                            autoComplete="off"
                          />
                        </s-stack>
                      </div>
                    </div>

                    {/* Card 2: Add-Ons with Bundles */}
                    <div className={productPageBundleStyles.card}>
                      <div className={productPageBundleStyles.panelHeader}>
                        <div>
                          <h3 className={productPageBundleStyles.panelTitle}>Add-Ons with Bundles</h3>
                          <p className={productPageBundleStyles.panelDescription}>
                            Enable customers to add extra items to their bundles at a discounted price, for free, or at full price.
                          </p>
                        </div>
                        <s-checkbox
                          accessibilityLabel="Enable add-ons with bundles"
                          checked={step.addonUnlockAfterCompletion !== false || undefined}
                          onChange={(e: Event) => {
                            stepsState.updateStepField(step.id, "addonUnlockAfterCompletion", (e.target as HTMLInputElement).checked);
                            markAsDirty();
                          }}
                        />
                      </div>
                      <s-stack direction="block" gap="small" style={{ marginTop: 16 }}>
                        <s-stack direction="inline" gap="small">
                          <s-button
                            variant="secondary"
                            onClick={() => window.open("https://wolfpackapps.com", "_blank")}
                          >
                            How to setup?
                          </s-button>
                          <s-button variant="secondary" icon="globe" disabled>
                            Multi Language
                          </s-button>
                        </s-stack>
                        <s-text-field
                          label="Add on Section title"
                          helpText="Will be visible on the storefront"
                          value={step.freeGiftName ?? ""}
                          onInput={(e: Event) => {
                            stepsState.updateStepField(step.id, "freeGiftName", (e.target as HTMLInputElement).value);
                            markAsDirty();
                          }}
                          autoComplete="off"
                        />
                        {(() => {
                          const addonTiers: { displayFree: boolean }[] = Array.isArray(step.addonTiers)
                            ? (step.addonTiers as { displayFree: boolean }[])
                            : [{ displayFree: step.addonDisplayFree === true }];

                          const updateAddonTiers = (updated: { displayFree: boolean }[]) => {
                            stepsState.updateStepField(step.id, "addonTiers", updated);
                            markAsDirty();
                          };

                          return (
                            <>
                              {addonTiers.map((tier, idx) => (
                                <div key={idx} className={productPageBundleStyles.ruleCard}>
                                  <div className={productPageBundleStyles.ruleHeader}>
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
                                  <s-checkbox
                                    label="Display products as free ($0.00)"
                                    checked={tier.displayFree === true}
                                    onChange={(e: Event) => {
                                      const updated = addonTiers.map((t, i) =>
                                        i === idx ? { ...t, displayFree: (e.target as HTMLInputElement).checked } : t
                                      );
                                      updateAddonTiers(updated);
                                    }}
                                  />
                                </div>
                              ))}
                              <s-button
                                variant="secondary"
                                icon="plus"
                                onClick={() => updateAddonTiers([...addonTiers, { displayFree: true }])}
                              >
                                Add Add Ons Tier
                              </s-button>
                            </>
                          );
                        })()}
                      </s-stack>
                    </div>

                    {/* Card 3: Footer Messaging */}
                    <div className={productPageBundleStyles.card}>
                      <div className={productPageBundleStyles.panelHeader}>
                        <h3 className={productPageBundleStyles.panelTitle}>Footer Messaging</h3>
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
                              [`addons-${step.id}`]: {
                                ...(prev[`addons-${step.id}`] || addonMessages),
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
                              [`addons-${step.id}`]: {
                                ...(prev[`addons-${step.id}`] || addonMessages),
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

            {activeSection === "messages" && (() => {
              return (
                <s-stack direction="block" gap="base">
                  <div className={productPageBundleStyles.card}>
                    <div className={productPageBundleStyles.panelHeader}>
                      <div>
                        <h3 className={productPageBundleStyles.panelTitle}>Enable Messages</h3>
                        <p className={productPageBundleStyles.panelDescription}>
                          Message will show up as a product at checkout
                        </p>
                      </div>
                      <s-checkbox
                        accessibilityLabel="Enable messages"
                        checked={giftMessagesEnabled || undefined}
                        onChange={(e: Event) => { setGiftMessagesEnabled((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      />
                    </div>

                    <div style={{ marginTop: 16 }} className={productPageBundleStyles.messagePreview}>
                      <div className={productPageBundleStyles.messagePreviewIcon} aria-hidden="true">
                        <s-icon name="note" />
                      </div>
                      <div>
                        <p className={productPageBundleStyles.messagePreviewTitle}>
                          {giftMessageProductTitle || "Message"}
                        </p>
                        <p className={productPageBundleStyles.messageNote}>
                          Add a message product so shoppers can include a note with the bundle.
                        </p>
                      </div>
                      <s-button
                        variant="secondary"
                        onClick={async () => {
                          try {
                            const picked = await (window as any).shopify?.resourcePicker({ type: "product", multiple: false });
                            if (picked && picked.length > 0) {
                              const product = picked[0] as any;
                              setGiftMessageProductId(product.id ?? "");
                              setGiftMessageProductTitle(product.title ?? "");
                              markAsDirty();
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
                        checked={giftMessageEnableSenderRecipient || undefined}
                        onChange={(e: Event) => { setGiftMessageEnableSenderRecipient((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      />
                      <s-checkbox
                        label="Make Gift Message mandatory"
                        checked={giftMessageMandatory || undefined}
                        onChange={(e: Event) => { setGiftMessageMandatory((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      />
                      <s-checkbox
                        label="Enable Message Limit (Characters)"
                        checked={giftMessageEnableLimit || undefined}
                        onChange={(e: Event) => { setGiftMessageEnableLimit((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      />
                      <s-number-field
                        label="Enter Message Limit"
                        value={giftMessageCharLimit}
                        disabled={!giftMessageEnableLimit}
                        min={0}
                        onInput={(e: Event) => { setGiftMessageCharLimit((e.target as HTMLInputElement).value); markAsDirty(); }}
                      />
                    </s-stack>
                  </div>
                </s-stack>
              );
            })()}
          </div>
        </div>

      {/* Page Selection Modal */}
      <s-modal ref={pageSelectionModalRef} heading="Place Widget">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Select a template to open the theme editor with widget placement.
          </p>

          {isLoadingPages ? (
            <s-stack direction="block" gap="small" style={{ alignItems: "center" }}>
              <s-spinner />
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>Loading templates...</p>
            </s-stack>
          ) : availablePages.length > 0 ? (
            <s-stack direction="block" gap="small-100">
              {availablePages.map((template) => (
                <s-section key={template.id}>
                  <s-stack direction="inline" gap="small" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap" }}>
                    <s-stack direction="block" gap="small-400">
                      <s-stack direction="inline" gap="small-100" style={{ alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>
                          {template.title}
                        </span>
                        {template.recommended && (
                          <s-badge tone="success">Bundle Product</s-badge>
                        )}
                      </s-stack>
                      {template.description && (
                        <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                          {template.description}
                        </p>
                      )}
                    </s-stack>
                    <s-button
                      onClick={() => handlePageSelection(template)}
                      variant={template.recommended ? "primary" : "secondary"}
                    >
                      <s-icon name="external-minor" />
                      Select
                    </s-button>
                  </s-stack>
                </s-section>
              ))}
            </s-stack>
          ) : (
            <s-section>
              <s-stack direction="block" gap="small" style={{ alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>
                  No templates available
                </p>
                <s-button href="https://admin.shopify.com/admin/pages">
                  Create Page
                </s-button>
              </s-stack>
            </s-section>
          )}
        </s-stack>
        <s-button slot="secondaryActions" onClick={closePageSelectionModal}>Cancel</s-button>
      </s-modal>

      {/* Selected Products Modal */}
      <s-modal ref={productsModalRef} heading="Selected Products">
        <s-stack direction="block" gap="base">
          {(() => {
            const currentStep = stepsState.steps.find(step => step.id === currentModalStepId);
            const selectedProducts = currentStep?.StepProduct || [];

            return selectedProducts.length > 0 ? (
              <s-stack direction="block" gap="small">
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for this step:
                </span>
                <s-section>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {selectedProducts.map((product: any, index: number) => {
                      const productId = product.productId || product.id?.split('/').pop();

                      return (
                        <li key={product.id || index}>
                          <s-stack direction="inline" gap="small-100" style={{ justifyContent: "space-between", alignItems: "center" }}>
                            <s-stack direction="inline" gap="small" style={{ alignItems: "center" }}>
                              <img
                                src={product.imageUrl || product.image?.url || "/bundle.png"}
                                alt={product.title || product.name || 'Product'}
                                style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                              />
                              <s-stack direction="block">
                                <s-button
                                  variant="plain"
                                  onClick={() => {
                                    if (!productId) return;
                                    openProductInAdmin(productId);
                                  }}
                                  disabled={!productId || undefined}
                                >
                                  <s-icon name="external-minor" />
                                  {product.title || product.name || 'Unnamed Product'}
                                </s-button>
                                {product.variants && product.variants.length > 0 && (
                                  <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                    {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} available
                                  </p>
                                )}
                              </s-stack>
                            </s-stack>
                            <s-badge tone="info">Product</s-badge>
                          </s-stack>
                        </li>
                      );
                    })}
                  </ul>
                </s-section>
              </s-stack>
            ) : (
              <s-stack direction="block" gap="small-100" style={{ alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                  No products selected for this step yet.
                </p>
              </s-stack>
            );
          })()}
        </s-stack>
        <s-button slot="primaryAction" onClick={handleCloseProductsModal}>Close</s-button>
      </s-modal>

      {/* Selected Collections Modal */}
      <s-modal ref={collectionsModalRef} heading="Selected Collections">
        <s-stack direction="block" gap="base">
          {(() => {
            const collections = selectedCollections[currentModalStepId] || [];

            return collections.length > 0 ? (
              <s-stack direction="block" gap="small">
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {collections.length} collection{collections.length !== 1 ? 's' : ''} selected for this step:
                </span>
                <s-section>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {collections.map((collection: any, index: number) => (
                      <li key={collection.id || index}>
                        <s-stack direction="inline" gap="small-100" style={{ justifyContent: "space-between" }}>
                          <s-stack direction="block">
                            <span style={{ fontSize: 14, fontWeight: 500 }}>
                              {collection.title || 'Unnamed Collection'}
                            </span>
                            {collection.handle && (
                              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                Handle: {collection.handle}
                              </p>
                            )}
                          </s-stack>
                          <s-badge tone="success">Collection</s-badge>
                        </s-stack>
                      </li>
                    ))}
                  </ul>
                </s-section>
              </s-stack>
            ) : (
              <s-stack direction="block" gap="small-100" style={{ alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                  No collections selected for this step yet.
                </p>
              </s-stack>
            );
          })()}
        </s-stack>
        <s-button slot="primaryAction" onClick={handleCloseCollectionsModal}>Close</s-button>
      </s-modal>

      <DiscardChangesModal
        open={showDiscardModal}
        onDiscard={handleConfirmDiscard}
        onContinue={closeDiscardModal}
      />

      {isSelectTemplateModalOpen && (
        <div
          className={productPageBundleStyles.templateDialogBackdrop}
          role="presentation"
          onMouseDown={handleSelectTemplateBackdropClick}
          onClick={handleSelectTemplateBackdropClick}
        >
          <div
            className={productPageBundleStyles.templateDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ppb-template-dialog-title"
            tabIndex={-1}
            ref={selectTemplateDialogRef}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleSelectTemplateDialogKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={productPageBundleStyles.templateDialogHandle} aria-hidden="true" />
            <div className={productPageBundleStyles.templateDialogHeader}>
              <h2 id="ppb-template-dialog-title" className={productPageBundleStyles.templateDialogHeading}>
                Customization
              </h2>
              <button
                type="button"
                className={productPageBundleStyles.templateDialogClose}
                aria-label="Close customization"
                onClick={closeSelectTemplateDialog}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {templateModalStep === "select" ? (
              <>
                <div className={productPageBundleStyles.templateDialogBody}>
                    <div className={productPageBundleStyles.templateDialogIntro}>
                      <div>
                        <h3 className={productPageBundleStyles.templateDialogSubheading}>Customize your bundle</h3>
                        <p className={productPageBundleStyles.templateDialogDescription}>
                          Choose a design that suits your needs and fits your brand
                        </p>
                      </div>
                    <s-button variant="secondary" onClick={openDesignControlPanel}>
                      Customize Colors &amp; Language
                    </s-button>
                  </div>
                  {templateSaveError ? (
                    <p role="alert" className={productPageBundleStyles.templateDialogError}>{templateSaveError}</p>
                  ) : null}
                  <div className={productPageBundleStyles.templateDialogGrid}>
                    {productPageTemplateOptions.map((templateOption) => {
                      const isSelected = pendingDesignPresetId === templateOption.presetId && pendingDesignTemplate === templateOption.layoutTemplate;
                      return (
                        <button
                          key={templateOption.presetId}
                          type="button"
                          className={`${productPageBundleStyles.templateOptionCard} ${isSelected ? productPageBundleStyles.templateOptionCardSelected : ""}`}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setPendingDesignTemplate(templateOption.layoutTemplate);
                            setPendingDesignPresetId(templateOption.presetId);
                          }}
                        >
                          <span className={productPageBundleStyles.templateOptionImageFrame}>
                            <img src={templateOption.image} alt={templateOption.label} className={productPageBundleStyles.templateOptionImage} />
                          </span>
                          <span className={productPageBundleStyles.templateOptionFooter}>
                            <span className={productPageBundleStyles.templateOptionLabel}>{templateOption.label}</span>
                            <span className={`${productPageBundleStyles.templateOptionAction} ${isSelected ? productPageBundleStyles.templateOptionActionSelected : ""}`}>
                              {isSelected ? "Selected" : "Select"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={productPageBundleStyles.templateDialogFooter}>
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
              <div className={productPageBundleStyles.templateDialogBody}>
                <div className={productPageBundleStyles.templateDialogConfirmHeader}>
                  <h3 className={productPageBundleStyles.templateDialogSubheading}>View your bundle</h3>
                  <p className={productPageBundleStyles.templateDialogDescription}>View your bundle with your customizations</p>
                </div>
                <div className={productPageBundleStyles.templateReadyPanel}>
                  <div className={productPageBundleStyles.templateReadyIcon}>
                    <s-icon name="check" />
                  </div>
                  <h3 className={productPageBundleStyles.templateReadyTitle}>Your bundle is ready</h3>
                  <p className={productPageBundleStyles.templateReadyText}>Preview it now with your customizations</p>
                  <s-button variant="secondary" onClick={handleTemplatePreview}>Preview bundle</s-button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync Bundle Confirmation Modal */}
      <s-modal ref={syncModalRef} heading="Sync Bundle?">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14 }}>
            This will delete and re-create all Shopify data for this bundle:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>The Shopify product will be archived and deleted, then re-created</li>
            <li>All bundle and component metafields will be rewritten</li>
          </ul>
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Bundle analytics are preserved. This action cannot be undone.
          </p>
        </s-stack>
        <s-button slot="primaryAction" variant="primary" loading={fetcher.state === 'submitting' || undefined} onClick={handleSyncBundleConfirm}>Sync Bundle</s-button>
        <s-button slot="secondaryActions" onClick={() => setIsSyncModalOpen(false)}>Cancel</s-button>
      </s-modal>

      <s-modal id="ppb-template-variables-modal" ref={templateVariablesModalRef} heading="Message variables" size="small">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Use these variables in Wolfpack Bundles messages. The widget replaces them with live bundle and discount values.
          </p>
          <div className={productPageBundleStyles.templateVariableGrid}>
            {ADDON_TEMPLATE_VARIABLES.map(([variable, description]) => (
              <div key={variable} className={productPageBundleStyles.templateVariableItem}>
                <s-badge>{variable}</s-badge>
                <s-text tone="subdued">{description}</s-text>
              </div>
            ))}
          </div>
        </s-stack>
        <s-button
          slot="primaryAction"
          variant="primary"
          commandFor="ppb-template-variables-modal"
          command="--hide"
          onClick={() => hidePolarisModal(templateVariablesModalRef)}
        >
          Done
        </s-button>
      </s-modal>

      <s-modal id="discount-variables-modal" ref={discountVariablesModalRef} heading="Variables" size="medium">
        <div>
          {DISCOUNT_TEMPLATE_VARIABLES.map(([variable, description], index) => (
            <div key={variable}>
              {index > 0 && <s-divider />}
              <div className={productPageBundleStyles.discountVariableRow}>
                <s-text tone="subdued">{description}</s-text>
                <span className={productPageBundleStyles.discountVariableCode}>{variable}</span>
              </div>
            </div>
          ))}
        </div>
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
          {pricingState.discountRules.map((rule: PricingRule, index: number) => {
            const localizedOption = qtyRuleTextsByLocaleByRuleId[activeBundleQuantityLocale]?.[rule.id];
            return (
              <s-section key={rule.id}>
                <s-stack direction="block" gap="small-100">
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Rule #{index + 1}</p>
                  <s-text-field
                    label="Box Label"
                    value={localizedOption?.label ?? qtyRuleLabels[rule.id] ?? `Box of ${rule.conditionValue ?? ""}`}
                    onInput={(e: Event) => {
                      const label = (e.target as HTMLInputElement).value;
                      setQtyRuleTextsByLocaleByRuleId((prev) => ({
                        ...prev,
                        [activeBundleQuantityLocale]: {
                          ...(prev[activeBundleQuantityLocale] ?? {}),
                          [rule.id]: {
                            label,
                            subtext: prev[activeBundleQuantityLocale]?.[rule.id]?.subtext ?? qtyRuleSubtexts[rule.id] ?? "",
                          },
                        },
                      }));
                      markAsDirty();
                    }}
                    autoComplete="off"
                  />
                  <s-text-field
                    label="Box Subtext"
                    value={localizedOption?.subtext ?? qtyRuleSubtexts[rule.id] ?? ""}
                    onInput={(e: Event) => {
                      const subtext = (e.target as HTMLInputElement).value;
                      setQtyRuleTextsByLocaleByRuleId((prev) => ({
                        ...prev,
                        [activeBundleQuantityLocale]: {
                          ...(prev[activeBundleQuantityLocale] ?? {}),
                          [rule.id]: {
                            label: prev[activeBundleQuantityLocale]?.[rule.id]?.label ?? qtyRuleLabels[rule.id] ?? `Box of ${rule.conditionValue ?? ""}`,
                            subtext,
                          },
                        },
                      }));
                      markAsDirty();
                    }}
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
          ) : pricingState.discountRules.map((rule: any, index: number) => (
            <s-section key={rule.id}>
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

      <EnablePreviewModal {...enablePreviewGate.modalProps} />

      </div>
    </>
  );
}
