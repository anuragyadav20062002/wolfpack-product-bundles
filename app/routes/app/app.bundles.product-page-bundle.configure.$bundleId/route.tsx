import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, useRevalidator } from "@remix-run/react";
import { AppLogger } from "../../../lib/logger";

// Note: Migrated from @shopify/polaris to Polaris web components (s-* and ui-*)
import {
  DiscountMethod,
  ConditionType,
  ConditionOperator,
  type PricingRule,
  generateRulePreview,
  centsToAmount,
  amountToCents,
} from "../../../types/pricing";
import {
  STEP_CONDITION_TYPE_OPTIONS,
  STEP_CONDITION_OPERATOR_OPTIONS,
  DISCOUNT_METHOD_OPTIONS,
  DISCOUNT_CONDITION_TYPE_OPTIONS,
  DISCOUNT_OPERATOR_OPTIONS,
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
} from "./handlers";

// Types - extracted to separate module for better organization
import type { LoaderData, BundleProductCardProps } from "./types";
import { AppEmbedBanner } from "../../../components/AppEmbedBanner";
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

declare global {
  interface Window {
    shopify?: { config?: { shop?: string } };
  }
}

// showPolarisModal / hidePolarisModal imported from _shared/bundle-configure/modal-utils

const ADDON_TEMPLATE_VARIABLES: [string, string][] = [
  ["{{addonsConditionDiff}}", "The remaining quantity a customer needs to add to unlock the add-on discount."],
  ["{{addonsDiscountValue}}", "The numerical value of the add-on discount (e.g. the '10' in 10% off)."],
  ["{{addonsDiscountValueUnit}}", "The unit symbol for the add-on discount (% or $)."],
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
const bundleSetupItems = [
  { id: "step_setup",         label: "Step Setup",         iconType: "note"   },
  { id: "discount_pricing",   label: "Discount & Pricing", iconType: "filter" },
  { id: "bundle_visibility",  label: "Bundle Visibility",  iconType: "view"   },
  { id: "bundle_settings",    label: "Bundle Settings",    iconType: "edit"   },
  { id: "select_template",    label: "Select Template",    iconType: "paint-brush-flat" },
];

const bundleVisibilityChildItems = [
  { id: "bundle_widget", label: "Bundle Widget" },
  { id: "bundle_embed",  label: "Bundle Embed"  },
];

// Memoized Bundle Product Card component to prevent unnecessary re-renders
const BundleProductCard = memo(({ bundleProduct, productImageUrl, productTitle, shop, onSync, onSelect }: BundleProductCardProps) => (
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
                onClick={() => {
                  const productUrl = `https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${bundleProduct.legacyResourceId || bundleProduct.id?.split('/').pop()}`;
                  open(productUrl, '_blank');
                }}
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
      className={productPageBundleStyles.pendingBadge}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      tabIndex={0}
      aria-label={`Pending - ${description}`}
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
    setForceNavigation,

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

  // Bundle Visibility — Bundle Widget state (FR-04)
  const [upsellWidgetEnabled, setUpsellWidgetEnabled] = useState<boolean>((bundle as any).upsellWidgetEnabled ?? false);
  const [upsellWidgetDisplayMode, setUpsellWidgetDisplayMode] = useState<string>((bundle as any).upsellWidgetDisplayMode ?? "button");
  const [upsellWidgetDisplayOn, setUpsellWidgetDisplayOn] = useState<string>((bundle as any).upsellWidgetDisplayOn ?? "all");
  const [autoSelectBrowsedProduct, setAutoSelectBrowsedProduct] = useState<boolean>((bundle as any).autoSelectBrowsedProduct ?? false);

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
  const _savedDisplayOpts = (bundle as any).bundlePricing?.displayOptions ?? {};
  const [qtyOptionsEnabled, setQtyOptionsEnabled] = useState<boolean>(_savedDisplayOpts?.bundleQuantityOptions?.enabled === true);
  const [qtyOptionsDefaultRuleId, setQtyOptionsDefaultRuleId] = useState<string | null>(_savedDisplayOpts?.bundleQuantityOptions?.defaultRuleId ?? null);
  const [qtyRuleLabels, setQtyRuleLabels] = useState<Record<string, string>>({});
  const [qtyRuleSubtexts, setQtyRuleSubtexts] = useState<Record<string, string>>({});
  const [progressBarEnabled, setProgressBarEnabled] = useState<boolean>(_savedDisplayOpts?.progressBar?.enabled === true);
  const [progressBarType, setProgressBarType] = useState<string>(_savedDisplayOpts?.progressBar?.type ?? "step_based");
  const [progressBarProgressText, setProgressBarProgressText] = useState<string>(_savedDisplayOpts?.progressBar?.progressText ?? "Add {{conditionText}} to unlock {{discountText}}");
  const [progressBarSuccessText, setProgressBarSuccessText] = useState<string>(_savedDisplayOpts?.progressBar?.successText ?? "{{discountText}} unlocked");

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

  // Select Template state (main = DB-synced; pending = overlay working copy)
  const [bundleDesignTemplate, setBundleDesignTemplate] = useState<string | null>((bundle as any).bundleDesignTemplate ?? null);
  const [bundleDesignPresetId, setBundleDesignPresetId] = useState<string | null>((bundle as any).bundleDesignPresetId ?? null);
  const [pendingDesignTemplate, setPendingDesignTemplate] = useState<string | null>(null);
  const [pendingDesignPresetId, setPendingDesignPresetId] = useState<string | null>(null);

  // Select Template modal state
  const selectTemplateModalRef = useRef<HTMLElement>(null);
  const [templateModalStep, setTemplateModalStep] = useState<"select" | "confirm">("select");
  const templateFetcher = useFetcher();

  // Sync Bundle modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeAssetTabIndex, setActiveAssetTabIndex] = useState(0);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);

  const openMultiLanguageModal = useCallback((title: string, fields: MultiLanguageField[]) => {
    setMultiLanguageTitle(title);
    setMultiLanguageFields(fields);
    setTextOverridesLocale(shopLocales.find((locale: { primary: boolean }) => locale.primary)?.locale ?? shopLocales[0]?.locale ?? "en");
    setIsMultiLanguageModalOpen(true);
  }, [shopLocales]);

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

  useEffect(() => {
    setHasPreview(!!localStorage.getItem(`wpb_preview_${bundle.id}`));
  }, [bundle.id]);

  // Add-Ons icon picker state
  const [showIconPickerForStep, setShowIconPickerForStep] = useState<string | null>(null);

  // Category accordion state (multi-category system — EB parity)
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({});
  const [categoryActiveTabs, setCategoryActiveTabs] = useState<Record<string, number>>({});

  // Template variables modal ref (for Footer Messaging "Show Variables")
  const templateVariablesModalRef = useRef<HTMLElement>(null);

  // Step chip navigation
  const [activeTabIndex, setActiveTabIndex] = useState(0);

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
      formData.append("discountData", JSON.stringify({
        discountEnabled: pricingState.discountEnabled,
        discountType: pricingState.discountType,
        discountRules: pricingState.discountRules,
        showFooter: pricingState.showFooter,
        discountMessagingEnabled: pricingState.discountMessagingEnabled,
        ruleMessages,
        displayOptions: {
          bundleQuantityOptions: {
            enabled: qtyOptionsEnabled,
            defaultRuleId: qtyOptionsDefaultRuleId,
            optionsByRuleId: Object.fromEntries(
              pricingState.discountRules.map((r: any) => [
                r.id,
                { label: qtyRuleLabels[r.id] ?? `Box of ${r.condition?.value ?? ''}`, subtext: qtyRuleSubtexts[r.id] ?? '' },
              ])
            ),
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
    selectedCollections,
    conditionsState.stepConditions,
    bundleProduct,
    productStatus,
    loadingGif,
    textOverrides,
    textOverridesByLocale,
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
  }, [hookHandleDiscard]);

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

  const handlePreviewBundle = useCallback(() => {
    if (isDirty) {
      // Show user-friendly message about unsaved changes
      shopify.toast.show("Please save your changes before previewing the bundle", {
        isError: true,
        duration: 4000
      });
      return;
    }

    // Try different URL construction methods
    let productUrl = null;
    const productHandle = bundle.shopifyProductHandle;

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
  }, [isDirty, bundle, bundleProduct, shop, shopify]);

  const readinessItems = useMemo<BundleReadinessItem[]>(() => {
    const hasProducts = stepsState.steps.some((step) =>
      Array.isArray(step.StepProduct) && step.StepProduct.length > 0
    );
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
          const storeHandle = shop?.replace('.myshopify.com', '');
          shopify.navigate(`https://admin.shopify.com/store/${storeHandle}/products/${productId}`);
        }
        break;
      }
      default:
        break;
    }
  }, [themeEditorUrl, handleSectionChange, handlePreviewBundle, bundle, bundleProduct, shop, shopify]);

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

  const handlePageSelection = useCallback(async (template: any) => {
    try {
      if (!template || !template.handle) {
        AppLogger.error('🚨 [THEME_EDITOR] Invalid template object:', {}, template);
        shopify.toast.show("Template data is invalid", { isError: true, duration: 5000 });
        return;
      }

      const shopDomain = shop.includes('.myshopify.com')
        ? shop.replace('.myshopify.com', '')
        : shop;

      shopify.toast.show(`Preparing theme editor for "${template.title}"...`, { isError: false, duration: 3000 });

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
        return;
      }

      const placementBlockHandle = activeSection === "bundle_widget"
        ? (upsellWidgetDisplayMode === "button" ? "bundle-upsell-button" : "bundle-upsell-block")
        : blockHandle;
      const appBlockId = `${apiKey}/${placementBlockHandle}`;


      // Generate deep link following Shopify's official documentation with bundle ID
      // Official format: template + addAppBlockId + target + bundleId (for auto-population)
      // See: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/deep-links
      //
      // Adding bundleId parameter allows the widget's Liquid code to auto-detect and populate
      // the bundle_id setting in the theme editor, making setup seamless for merchants
      const pageProductHandle = template.bundleProduct?.handle || bundle.shopifyProductHandle;
      const pagePreviewParam = pageProductHandle ? `&previewPath=${encodeURIComponent(`/products/${pageProductHandle}`)}` : '';
      // target=newAppsSection is correct for section-type blocks ("target":"section" in liquid schema).
      // target=mainSection is only for app blocks embedded inside theme sections — using it
      // with a section block causes Shopify to misroute and may open the wrong template/product.
      const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${template.handle}&addAppBlockId=${appBlockId}&target=newAppsSection&bundleId=${bundle.id}${pagePreviewParam}`;


      setSelectedPage(template);
      closePageSelectionModal();

      // Open theme editor in new window/tab for better workflow
      shopify.toast.show(`Opening theme editor for "${template.title}". You'll be able to add the bundle widget to your theme.`, { isError: false, duration: 5000 });

      // Open in new window using robust method to prevent app redirect
      const link = document.createElement('a');
      link.href = themeEditorUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      AppLogger.error('🚨 [THEME_EDITOR] Error in handlePageSelection:', { errorMessage }, error as any);
      shopify.toast.show(`Failed to open theme editor: ${errorMessage}`, { isError: true, duration: 5000 });
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

  useModalHideListener(syncModalRef, () => setIsSyncModalOpen(false));
  useModalHideListener(pageSelectionModalRef, closePageSelectionModal);
  useModalHideListener(productsModalRef, handleCloseProductsModal);
  useModalHideListener(collectionsModalRef, handleCloseCollectionsModal);
  useModalHideListener(selectTemplateModalRef, () => setTemplateModalStep("select"));

  const closeDiscardModal = useCallback(() => {
    setShowDiscardModal(false);
  }, []);

  const openSelectTemplateModal = useCallback(() => {
    setPendingDesignTemplate(bundleDesignTemplate);
    setPendingDesignPresetId(bundleDesignPresetId);
    setTemplateModalStep("select");
    showPolarisModal(selectTemplateModalRef);
  }, [bundleDesignTemplate, bundleDesignPresetId]);

  const handleTemplateNext = useCallback(() => {
    const fd = new FormData();
    fd.append("intent", "updateBundleDesignTemplate");
    fd.append("bundleDesignTemplate", pendingDesignTemplate ?? "");
    fd.append("bundleDesignPresetId", pendingDesignPresetId ?? "");
    templateFetcher.submit(fd, { method: "POST" });
    setBundleDesignTemplate(pendingDesignTemplate);
    setBundleDesignPresetId(pendingDesignPresetId);
    setTemplateModalStep("confirm");
  }, [pendingDesignTemplate, pendingDesignPresetId, templateFetcher]);

  const handleConfirmDiscard = useCallback(() => {
    closeDiscardModal();
    handleDiscard();
  }, [closeDiscardModal, handleDiscard]);

  return (
    <>
      <ui-title-bar title={`Configure: ${formState.bundleName}`}>
        <button variant="breadcrumb" onClick={handleBackClick}>Dashboard</button>
      </ui-title-bar>
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
          ruleMessages
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

        <AppEmbedBanner appEmbedEnabled={appEmbedEnabled} themeEditorUrl={themeEditorUrl} />

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
                        const productUrl = `https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${productId}`;
                        shopify.navigate(productUrl);
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
                        statusBadge = !appEmbedEnabled ? { label: "Pending", tone: "warning" } : null;
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
                          >
                            <span className={productPageBundleStyles.setupNavIcon} aria-hidden="true">
                              {item.iconType
                                ? <s-icon type={item.iconType as any} />
                                : (isActive ? "●" : "○")}
                            </span>
                            <span className={productPageBundleStyles.setupNavLabel}>{item.label}</span>
                            <span className={productPageBundleStyles.setupNavMeta}>
                              {statusBadge && !isActive && (
                                statusBadge.label === "Pending"
                                  ? <InfoIcon tooltipKey="bundleVisibilityPending" />
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
                  <div className={productPageBundleStyles.stepSetupDivider} />

                  {stepsState.steps.map((step, index) => activeTabIndex === index && (
                    <div
                      key={`${step.id}-${slideKey}`}
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
                            icon="duplicate"
                            accessibilityLabel="Clone current step"
                            title="Clone current step"
                            onClick={() => cloneStep(step.id)}
                          />
                          <s-button
                            variant="plain"
                            icon="globe"
                            accessibilityLabel="Multiple language"
                            title="Multiple language"
                            disabled={shopLocales.length === 0}
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

                                {/* ── Categories (multi-category accordion — EB parity) ── */}
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
                                            <div className={productPageBundleStyles.catNameRow}>
                                              <input
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
                                              <s-button variant="plain" icon="globe" disabled accessibilityLabel="Multi Language">Multi Language</s-button>
                                            </div>
                                            <div style={{ marginBottom: 10 }}>
                                              <s-checkbox
                                                label="Display variants as individual products"
                                                checked={(cat as any).displayVariantsAsIndividual ?? false}
                                                onChange={(e: Event) => {
                                                  const updated = (((step as any).StepCategory as any[]) ?? []).map((c: any, i: number) =>
                                                    i === catIndex ? { ...c, displayVariantsAsIndividual: (e.target as HTMLInputElement).checked } : c
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
                                    const ruleCount = (conditionsState.stepConditions[step.id] || []).length;
                                    const activeRuleMode = ruleCount === 0 ? "none" : "step";
                                    const handleRuleModeChange = (nextMode: string) => {
                                      if (nextMode === "none") {
                                        conditionsState.clearStepConditions(step.id);
                                        return;
                                      }
                                      if ((conditionsState.stepConditions[step.id] || []).length === 0) {
                                        conditionsState.addConditionRule(step.id);
                                      }
                                    };
                                    return (
                                      <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                                        {[
                                          { label: "No rules", value: "none" },
                                          { label: "Step rules", value: "step" },
                                          { label: "Category rules", value: "category" },
                                        ].map(opt => (
                                          <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                                            <input
                                              type="radio"
                                              name={`fpb-rule-mode-${step.id}`}
                                              value={opt.value}
                                              checked={activeRuleMode === opt.value}
                                              onChange={() => handleRuleModeChange(opt.value)}
                                              style={{ margin: 0 }}
                                            />
                                            {opt.label}
                                          </label>
                                        ))}
                                      </div>
                                    );
                                  })()}
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
                                </div>

                    {/* ── Step Config card ── */}
                    <div className={productPageBundleStyles.card}>
                      <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 650, color: "#202223", letterSpacing: 0 }}>Step Config</h3>
                      <div className={productPageBundleStyles.stepConfigRow}>
                        <div className={productPageBundleStyles.iconColumn}>
                          <div className={productPageBundleStyles.iconBox}>
                                        {(step as any).timelineIconUrl ? (
                                          <img
                                            src={(step as any).timelineIconUrl}
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
                              value={(step as any).timelineIconUrl ?? null}
                              onChange={(url: string | null) => {
                                stepsState.updateStepField(step.id, 'timelineIconUrl', url);
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
                                        {(step as any).timelineIconUrl ? "Replace" : "Upload"}
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

                  <div style={{ opacity: pricingState.discountEnabled ? 1 : 0.45, pointerEvents: pricingState.discountEnabled ? "auto" : "none" }}>
                    <s-stack direction="block" gap="base">
                      {/* Discount Type */}
                      <s-select
                        label="Discount Type"
                        value={pricingState.discountType}
                        onChange={(e: Event) => {
                          pricingState.setDiscountType((e.target as HTMLSelectElement).value as DiscountMethod);
                          pricingState.setDiscountRules([]);
                          setRuleMessages({});
                        }}
                      >
                        {[...DISCOUNT_METHOD_OPTIONS].map(opt => (
                          <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                        ))}
                      </s-select>

                      {/* Buy X Get Y rule builder */}
                      {pricingState.discountType === DiscountMethod.BUY_X_GET_Y && (() => {
                        const bxyRule = pricingState.discountRules[0];
                        if (!bxyRule) {
                          return (
                            <s-button variant="tertiary" style={{ width: "100%" }} onClick={pricingState.addDiscountRule}>
                              Configure Buy X Get Y
                            </s-button>
                          );
                        }
                        return (
                          <s-section>
                            <s-stack direction="vertical" gap="300">
                              <s-heading size="small">Buy X Get Y Configuration</s-heading>
                              <s-select
                                label="Buy from step"
                                helpText="Customer must fill this step to trigger the offer."
                                onChange={(e: Event) => pricingState.updateDiscountRule(bxyRule.id, { buyStepId: (e.target as HTMLSelectElement).value })}
                              >
                                <option value="">— select step —</option>
                                {stepsState.steps.map((s: any) => (
                                  <option key={s.id} value={s.id} selected={(bxyRule as any).buyStepId === s.id || undefined}>
                                    {s.name || `Step ${s.position ?? ''}`}
                                  </option>
                                ))}
                              </s-select>
                              <s-select
                                label="Get (free gift step)"
                                helpText="Products in this step are given free when the offer triggers."
                                onChange={(e: Event) => pricingState.updateDiscountRule(bxyRule.id, { getStepId: (e.target as HTMLSelectElement).value })}
                              >
                                <option value="">— select step —</option>
                                {stepsState.steps.map((s: any) => (
                                  <option key={s.id} value={s.id} selected={(bxyRule as any).getStepId === s.id || undefined}>
                                    {s.name || `Step ${s.position ?? ''}`}
                                  </option>
                                ))}
                              </s-select>
                              <s-number-field
                                label="Free quantity"
                                helpText="How many items from the get-step are discounted to $0."
                                min={1}
                                value={String((bxyRule as any).getQty ?? 1)}
                                onInput={(e: Event) => pricingState.updateDiscountRule(bxyRule.id, { getQty: Number((e.target as HTMLInputElement).value) || 1 })}
                              />
                            </s-stack>
                          </s-section>
                        );
                      })()}

                      {/* Discount Rules (non-BUY_X_GET_Y types) */}
                      {pricingState.discountType !== DiscountMethod.BUY_X_GET_Y && (
                      <s-stack direction="block" gap="small">
                        {pricingState.discountRules.map((rule, index) => (
                          <s-section key={rule.id}>
                            <s-stack direction="block" gap="small">
                              <s-stack direction="inline" style={{ justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>Rule #{index + 1}</span>
                                <s-button
                                  variant="plain"
                                  tone="critical"
                                  onClick={() => pricingState.removeDiscountRule(rule.id)}
                                >
                                  Remove
                                </s-button>
                              </s-stack>

                              {/* Condition Section */}
                              <s-stack direction="block" gap="small-100">
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>When:</p>
                                <s-stack direction="inline" gap="small-100">
                                  <s-select
                                    label="Type"
                                    onChange={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                      condition: { ...rule.condition, type: (e.target as HTMLSelectElement).value as any }
                                    })}
                                  >
                                    {[...DISCOUNT_CONDITION_TYPE_OPTIONS].map(opt => (
                                      <option key={opt.value} value={opt.value} selected={rule.condition.type === opt.value || undefined}>{opt.label}</option>
                                    ))}
                                  </s-select>
                                  <s-select
                                    label="Operator"
                                    onChange={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                      condition: { ...rule.condition, operator: (e.target as HTMLSelectElement).value as any }
                                    })}
                                  >
                                    {[...DISCOUNT_OPERATOR_OPTIONS].map(opt => (
                                      <option key={opt.value} value={opt.value} selected={rule.condition.operator === opt.value || undefined}>{opt.label}</option>
                                    ))}
                                  </s-select>
                                  <s-text-field
                                    label={rule.condition.type === ConditionType.AMOUNT ? "Amount" : "Quantity"}
                                    value={String(rule.condition.type === ConditionType.AMOUNT ? centsToAmount(rule.condition.value) : rule.condition.value)}
                                    onInput={(e: Event) => {
                                      const numValue = Number((e.target as HTMLInputElement).value) || 0;
                                      const finalValue = rule.condition.type === ConditionType.AMOUNT ? amountToCents(numValue) : numValue;
                                      pricingState.updateDiscountRule(rule.id, {
                                        condition: { ...rule.condition, value: finalValue }
                                      });
                                    }}
                                    type="number"
                                    min="0"
                                    step={rule.condition.type === ConditionType.AMOUNT ? 0.01 : 1}
                                    helpText={rule.condition.type === ConditionType.AMOUNT ? "Amount in shop's currency" : undefined}
                                    autoComplete="off"
                                  />
                                </s-stack>
                              </s-stack>

                              {/* Discount Section */}
                              <s-stack direction="block" gap="small-100">
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Apply:</p>
                                <s-text-field
                                  label={
                                    rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? 'Discount Percentage' :
                                      rule.discount.method === DiscountMethod.FIXED_AMOUNT_OFF ? 'Discount Amount' :
                                        'Bundle Price'
                                  }
                                  value={String(
                                    rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? rule.discount.value :
                                      centsToAmount(rule.discount.value)
                                  )}
                                  onInput={(e: Event) => {
                                    const numValue = Number((e.target as HTMLInputElement).value) || 0;
                                    const finalValue = rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? numValue : amountToCents(numValue);
                                    pricingState.updateDiscountRule(rule.id, {
                                      discount: { ...rule.discount, value: finalValue }
                                    });
                                  }}
                                  type="number"
                                  min="0"
                                  max={rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? "100" : undefined}
                                  step={rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? 1 : 0.01}
                                  suffix={rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? "%" : undefined}
                                  helpText={rule.discount.method !== DiscountMethod.PERCENTAGE_OFF ? "Amount in shop's currency" : undefined}
                                  autoComplete="off"
                                />
                              </s-stack>

                              {/* Preview */}
                              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                Preview: {generateRulePreview(rule)}
                              </p>
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
                            Add Rule
                          </s-button>
                        ) : (
                          <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>
                            Maximum 4 discount rules reached
                          </p>
                        )}
                      </s-stack>
                      )}

                      {/* Discount Messaging */}
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" style={{ justifyContent: "space-between", alignItems: "center" }}>
                          <s-stack direction="block" gap="small-400">
                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                              Discount Messaging
                            </h3>
                            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                              Edit how discount messages appear above the subtotal.
                            </p>
                          </s-stack>
                          <s-tooltip content="Show dynamic discount progress messages in the bundle widget (e.g. 'Add 2 more items to unlock 20% off')">
                            <s-checkbox
                              checked={pricingState.discountMessagingEnabled || undefined}
                              onChange={(e: Event) => pricingState.setDiscountMessagingEnabled((e.target as HTMLInputElement).checked)}
                            >
                              Discount Messaging
                            </s-checkbox>
                          </s-tooltip>
                        </s-stack>

                        {/* Variables Helper */}
                        <details>
                          <summary className={productPageBundleStyles.helpSummary}>
                            Show Variables
                          </summary>
                          <div className={productPageBundleStyles.helpContainer}>
                            <div className={productPageBundleStyles.helpItem}>
                              <strong>Essential (Most Used):</strong><br />
                              <code>{'{{conditionText}}'}</code> - "₹100" or "2 items"<br />
                              <code>{'{{discountText}}'}</code> - "₹50 off" or "20% off"<br />
                              <code>{'{{bundleName}}'}</code> - Bundle name
                            </div>
                            <div className={productPageBundleStyles.helpItem}>
                              <strong>Specific:</strong><br />
                              <code>{'{{amountNeeded}}'}</code> - Amount needed (for spend-based)<br />
                              <code>{'{{itemsNeeded}}'}</code> - Items needed (for quantity-based)<br />
                              <code>{'{{progressPercentage}}'}</code> - Progress % (0-100)
                            </div>
                            <div className={productPageBundleStyles.helpItem}>
                              <strong>Pricing:</strong><br />
                              <code>{'{{currentAmount}}'}</code> - Current total<br />
                              <code>{'{{finalPrice}}'}</code> - Price after discount<br />
                              <code>{'{{savingsAmount}}'}</code> - Amount saved
                            </div>
                            <div className={productPageBundleStyles.helpFooter}>
                              <strong>Quick Examples:</strong><br />
                              💰 <em>"Add {'{{conditionText}}'} to get {'{{discountText}}'}"</em><br />
                              📊 <em>"{'{{progressPercentage}}'} % complete - {'{{conditionText}}'} more needed"</em><br />
                              🎉 <em>"You saved {'{{savingsAmount}}'} on {'{{bundleName}}'}"</em>
                            </div>
                          </div>
                        </details>

                        {/* Dynamic rule-based messaging */}
                        {pricingState.discountMessagingEnabled && (Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).length > 0 && (
                          <s-stack direction="block" gap="small">
                            {(Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).map((rule: any, index: number) => (
                              <s-stack key={rule.id} direction="block" gap="small">
                                <s-section>
                                  <s-stack direction="block" gap="small-100">
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>Rule #{index + 1} Messages</span>
                                    <s-text-area
                                      label="Discount Text"
                                      value={ruleMessages[rule.id]?.discountText || 'Add {{conditionText}} to get {{discountText}}'}
                                      onInput={(e: Event) => updateRuleMessage(rule.id, 'discountText', (e.target as HTMLTextAreaElement).value)}
                                      autoComplete="off"
                                      helpText="This message appears when the customer is close to qualifying for the discount"
                                    />
                                  </s-stack>
                                </s-section>

                                <s-section>
                                  <s-stack direction="block" gap="small-100">
                                    <s-text-area
                                      label="Success Message"
                                      value={ruleMessages[rule.id]?.successMessage || 'Congratulations! You got {{discountText}} on {{bundleName}}! 🎉'}
                                      onInput={(e: Event) => updateRuleMessage(rule.id, 'successMessage', (e.target as HTMLTextAreaElement).value)}
                                      autoComplete="off"
                                      helpText="This message appears when the customer qualifies for the discount"
                                    />
                                  </s-stack>
                                </s-section>
                              </s-stack>
                            ))}
                          </s-stack>
                        )}

                        {/* No rules message */}
                        {pricingState.discountMessagingEnabled && pricingState.discountRules.length === 0 && (
                          <s-section>
                            <s-stack direction="block" gap="small-100" style={{ alignItems: "center" }}>
                              <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>
                                Add discount rules to configure messaging
                              </p>
                            </s-stack>
                          </s-section>
                        )}
                      </s-stack>
                    </s-stack>
                  </div>
                </s-stack>
              </s-section>

              <s-section>
                <div style={{ opacity: pricingState.discountEnabled ? 1 : 0.45, pointerEvents: pricingState.discountEnabled ? "auto" : "none" }}>
                  <s-stack direction="block" gap="small">
                    <s-stack direction="block" gap="small-400">
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Discount Display Options</h4>
                      <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                        Choose how discounts are displayed
                      </p>
                    </s-stack>

                    <div className={productPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center">
                        <div className={productPageBundleStyles.displayOptionText}>
                          <p className={productPageBundleStyles.displayOptionTitle}>Bundle Quantity Options</p>
                          <p className={productPageBundleStyles.displayOptionDescription}>
                            Configure this section to enable quantity options.
                          </p>
                        </div>
                        <QuestionHelpTooltip tooltipKey="bundleQuantityOptions" />
                        <s-checkbox
                          checked={qtyOptionsEnabled || undefined}
                          onChange={(e: Event) => setQtyOptionsEnabled((e.target as HTMLInputElement).checked)}
                        />
                      </s-stack>
                      {qtyOptionsEnabled && (
                        <div className={productPageBundleStyles.nestedDisplayOptions}>
                          <s-stack direction="block" gap="small">
                            <s-button variant="secondary" icon="globe" disabled>
                              Multi Language
                            </s-button>
                            <p className={productPageBundleStyles.optionNote}>
                              <strong>Note:</strong> Bundle Quantity Options can only be enabled when discount rules are based on quantity.
                            </p>
                            {pricingState.discountRules.length === 0 ? (
                              <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                                Add quantity-based discount rules to configure bundle quantity options.
                              </p>
                            ) : (
                              <s-stack direction="block" gap="small">
                                <s-select
                                  label="Default quantity option"
                                  value={qtyOptionsDefaultRuleId ?? ""}
                                  onChange={(e: Event) => setQtyOptionsDefaultRuleId((e.target as HTMLSelectElement).value || null)}
                                >
                                  <s-option value="">None</s-option>
                                  {pricingState.discountRules.map((r: any, i: number) => (
                                    <s-option key={r.id} value={r.id}>
                                      {`Rule #${i + 1} - qty ${r.condition?.value ?? "?"}`}
                                    </s-option>
                                  ))}
                                </s-select>
                                {pricingState.discountRules.map((r: any, i: number) => (
                                  <s-section key={r.id}>
                                    <s-stack direction="block" gap="small-100">
                                      <h5 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                                        Rule #{i + 1}
                                      </h5>
                                      <s-stack direction="inline" gap="small">
                                        <s-text-field
                                          label="Box Label"
                                          placeholder={`Box of ${r.condition?.value ?? ""}`}
                                          value={qtyRuleLabels[r.id] ?? ""}
                                          onInput={(e: Event) => setQtyRuleLabels(prev => ({ ...prev, [r.id]: (e.target as HTMLInputElement).value }))}
                                          autoComplete="off"
                                        />
                                        <s-text-field
                                          label="Box Subtext"
                                          placeholder="e.g. 20% off"
                                          value={qtyRuleSubtexts[r.id] ?? ""}
                                          onInput={(e: Event) => setQtyRuleSubtexts(prev => ({ ...prev, [r.id]: (e.target as HTMLInputElement).value }))}
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

                    <div className={productPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center">
                        <div className={productPageBundleStyles.displayOptionText}>
                          <p className={productPageBundleStyles.displayOptionTitle}>Progress Bar</p>
                          <p className={productPageBundleStyles.displayOptionDescription}>
                            Edit the progress bar content and settings.
                          </p>
                        </div>
                        <QuestionHelpTooltip tooltipKey="discountProgressBar" />
                        <s-checkbox
                          checked={progressBarEnabled || undefined}
                          onChange={(e: Event) => setProgressBarEnabled((e.target as HTMLInputElement).checked)}
                        />
                      </s-stack>
                      {progressBarEnabled && (
                        <div className={productPageBundleStyles.nestedDisplayOptions}>
                          <s-stack direction="block" gap="small">
                            <s-button variant="secondary" icon="globe" disabled>
                              Multi Language
                            </s-button>
                            <s-select
                              label="Progress bar type"
                              value={progressBarType}
                              onChange={(e: Event) => setProgressBarType((e.target as HTMLSelectElement).value)}
                            >
                              <s-option value="simple">Simple Bar</s-option>
                              <s-option value="step_based">Step Based Bar</s-option>
                            </s-select>
                            <s-stack direction="inline" gap="small">
                              <s-text-area
                                label="Progress Text"
                                helpText="Shown while customer is working toward a discount. Supports {{conditionText}}, {{discountText}}."
                                value={progressBarProgressText}
                                onInput={(e: Event) => setProgressBarProgressText((e.target as HTMLTextAreaElement).value)}
                                autoComplete="off"
                              />
                              <s-text-area
                                label="Success Text"
                                helpText="Shown when the discount is unlocked. Supports {{discountText}}."
                                value={progressBarSuccessText}
                                onInput={(e: Event) => setProgressBarSuccessText((e.target as HTMLTextAreaElement).value)}
                                autoComplete="off"
                              />
                            </s-stack>
                            <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                              {pricingState.discountRules.length} discount milestones available from current rules.
                            </p>
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
                <s-stack direction="block" gap="base">
                  <s-section>
                    <s-stack direction="inline" gap="base" alignItems="center">
                      <s-stack direction="block" gap="small-400" style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>App Embed Status</h3>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                          {appEmbedEnabled
                            ? "Your store is connected and ready. Your bundle can now render on your storefront."
                            : "Enable the Theme app extension for Wolfpack Bundles to place and preview the bundle."}
                        </p>
                      </s-stack>
                      <s-badge tone={appEmbedEnabled ? "success" : "warning"}>
                        {appEmbedEnabled ? "Enabled" : "Not enabled"}
                      </s-badge>
                      {!appEmbedEnabled && themeEditorUrl && (
                        <s-button variant="secondary" onClick={() => window.open(themeEditorUrl, "_blank")}>
                          Enable here
                        </s-button>
                      )}
                    </s-stack>
                  </s-section>

                  <s-section>
                    <s-stack direction="block" gap="base">
                      <s-stack direction="block" gap="small-400">
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Publishing Best Practices</h3>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                          Pick a placement and follow the quick guide to make your bundle discoverable on your store.
                        </p>
                      </s-stack>
                      <div className={productPageBundleStyles.visibilityGuideGrid}>
                        {[
                          { title: "Hero Banner",           desc: "Add a button to your homepage hero to drive shoppers directly to your bundle.",      img: "/bundleGallery.png" },
                          { title: "Navigation Menu",       desc: "Add your bundle as a nav link so shoppers can find it from anywhere on your store.", img: "/fpb.png" },
                          { title: "Announcement Banner",   desc: "Show your offer in the announcement bar so visitors see it instantly.",               img: "/pdp.png" },
                          { title: "Featured Product Card", desc: "Feature your bundle product on your homepage so shoppers find it right away.",        img: "/productPageThumbnail.png" },
                        ].map(({ title, desc: description, img }) => (
                          <div key={title} className={productPageBundleStyles.visibilityGuideCard}>
                            <div className={productPageBundleStyles.visibilityGuideMedia}>
                              <img src={img} alt={title} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{title}</h4>
                            <p style={{ margin: 0, fontSize: 12, color: "#6d7175", lineHeight: 1.35 }}>{description}</p>
                            <s-button variant="secondary" onClick={() => window.open("https://wolfpackapps.com", "_blank")}>Quick Setup Guide</s-button>
                            <span className={productPageBundleStyles.visibilitySetupTime}>5 min setup</span>
                          </div>
                        ))}
                      </div>
                    </s-stack>
                  </s-section>

                  <s-section>
                    <s-stack direction="block" gap="small">
                      <s-stack direction="block" gap="small-400">
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Your Bundle Link</h3>
                        <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                          Use this link to place your bundle anywhere - theme components, emails, ads, or social bios.
                        </p>
                      </s-stack>
                      {bundle.shopifyProductHandle && shop ? (
                        <s-stack direction="inline" gap="small">
                          <s-text-field
                            label="Bundle link"
                            value={`https://${shop}/products/${bundle.shopifyProductHandle}`}
                            disabled
                            autoComplete="off"
                          />
                          <s-button
                            variant="secondary"
                            onClick={() => {
                              const url = `https://${shop}/products/${bundle.shopifyProductHandle}`;
                              void navigator.clipboard?.writeText(url);
                              shopify.toast.show("Bundle link copied", { isError: false });
                            }}
                          >
                            Copy Link
                          </s-button>
                          <s-button
                            variant="plain"
                            onClick={() => window.open(`https://${shop}/products/${bundle.shopifyProductHandle}`, "_blank")}
                          >
                            View on Storefront
                          </s-button>
                        </s-stack>
                      ) : (
                        <s-text tone="subdued">Bundle product not yet linked.</s-text>
                      )}
                    </s-stack>
                  </s-section>

                  <s-section>
                    <s-stack direction="block" gap="base">
                      <s-stack direction="inline" gap="base" alignItems="center">
                        <s-stack direction="block" gap="small-400" style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Want more placement options?</h3>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Bundle Widget</h4>
                          <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                            Add a bundle button to specific product pages.
                          </p>
                        </s-stack>
                        <s-button variant="primary" onClick={() => handleSectionChange("bundle_widget")}>Set up Bundle Widget</s-button>
                      </s-stack>
                      <s-stack direction="inline" gap="base" alignItems="center">
                        <s-stack direction="block" gap="small-400" style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Bundle Embed</h4>
                          <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                            Embed the full bundle builder directly on a product page.
                          </p>
                        </s-stack>
                        <s-button variant="secondary" onClick={() => handleSectionChange("bundle_embed")}>Set up Bundle Embed</s-button>
                      </s-stack>
                    </s-stack>
                  </s-section>
                </s-stack>
              </div>
            )}

            {activeSection === "bundle_widget" && (
              <div data-tour-target="ppb-bundle-widget">
                <s-stack direction="block" gap="base">
                  <s-section heading="Product Page Bundle Upsell Widgets">
                    <s-stack direction="vertical" gap="400">
                      <s-stack direction="horizontal" gap="300" align-y="center">
                        <s-switch
                          checked={upsellWidgetEnabled}
                          onChange={(e: any) => { setUpsellWidgetEnabled(e.target.checked); markAsDirty(); }}
                        />
                        <s-text>This will display an upsell block or button on the product pages of your choice.</s-text>
                      </s-stack>

                      <div className={productPageBundleStyles.widgetPreviewMedia}>
                        <span className={productPageBundleStyles.widgetPreviewButton}>
                          {textOverrides.widgetButtonText || "Save More With Bundle"}
                        </span>
                      </div>

                      <s-stack direction="vertical" gap="200">
                        <s-text>Display type</s-text>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="upsellWidgetType"
                            value="block"
                            checked={upsellWidgetDisplayMode !== "button"}
                            onChange={() => { setUpsellWidgetDisplayMode("block"); markAsDirty(); }}
                          />
                          <span style={{ fontSize: 14 }}>Offer Upsell Block</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="upsellWidgetType"
                            value="button"
                            checked={upsellWidgetDisplayMode === "button"}
                            onChange={() => { setUpsellWidgetDisplayMode("button"); markAsDirty(); }}
                          />
                          <span style={{ fontSize: 14 }}>Offer Upsell Button</span>
                        </label>
                        <s-banner tone="info">Select if you want the upsell block or button to appear on product pages.</s-banner>
                      </s-stack>

                      <s-stack direction="vertical" gap="300">
                        <s-heading size="small">Widget Settings</s-heading>
                        <s-stack direction="horizontal" gap="small" align-y="center">
                          <s-button
                            variant="secondary"
                            icon="globe"
                            disabled
                          >
                            Multi Language
                          </s-button>
                        </s-stack>
                        <s-text-field
                          label="Button Text"
                          placeholder="Save More With Bundle"
                          value={textOverrides.widgetButtonText ?? ""}
                          onInput={(e: Event) => { setTextOverrides((prev) => ({ ...prev, widgetButtonText: (e.target as HTMLInputElement).value })); markAsDirty(); }}
                          autoComplete="off"
                        />
                      </s-stack>

                      <s-stack direction="vertical" gap="200">
                        <s-text>Display Widget on</s-text>
                        {[
                          { value: "all",                   label: "All products in bundle"  },
                          { value: "specific_products",     label: "Specific products"        },
                          { value: "specific_collections",  label: "Specific collections"     },
                        ].map(({ value, label }) => (
                          <label key={value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="widgetDisplayOn"
                              value={value}
                              checked={upsellWidgetDisplayOn === value}
                              onChange={() => { setUpsellWidgetDisplayOn(value); markAsDirty(); }}
                            />
                            <span style={{ fontSize: 14 }}>{label}</span>
                          </label>
                        ))}
                      </s-stack>

                      <s-checkbox
                        label="Add browsed product to bundle"
                        checked={autoSelectBrowsedProduct || undefined}
                        onChange={(e: Event) => { setAutoSelectBrowsedProduct((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      />

                      <s-stack direction="vertical" gap="200">
                        <s-heading size="small">Embed the Upsell {upsellWidgetDisplayMode === "button" ? "Button" : "Block"} at a custom location</s-heading>
                        <s-text size="small" tone="subdued">By default, the upsell {upsellWidgetDisplayMode === "button" ? "button" : "block"} is added below the Buy Button. You can move it to a custom spot on the product page if you prefer.</s-text>
                        <s-button
                          variant="secondary"
                          onClick={handlePlaceWidget}
                        >
                          Embed Upsell {upsellWidgetDisplayMode === "button" ? "Button" : "Block"}
                        </s-button>
                      </s-stack>
                    </s-stack>
                  </s-section>
                </s-stack>
              </div>
            )}

            {activeSection === "bundle_embed" && (
              <div data-tour-target="ppb-bundle-embed">
                <s-stack direction="block" gap="base">
                  <s-section heading="Embed Bundle Builder on Product Pages">
                    <s-stack direction="vertical" gap="400">
                      <s-stack direction="horizontal" gap="300" align-y="center">
                        <s-switch
                          checked={textOverrides.bundleEmbedEnabled === "true"}
                          onChange={(e: Event) => { setTextOverrides((prev) => ({ ...prev, bundleEmbedEnabled: (e.target as HTMLInputElement).checked ? "true" : "false" })); markAsDirty(); }}
                        />
                        <s-text>Directly embed the Bundle Builder block on product pages to let customers curate their bundles right there.</s-text>
                      </s-stack>

                      <s-stack direction="horizontal" gap="small" align-y="center">
                        <s-button
                          variant="secondary"
                          icon="globe"
                          onClick={() => openMultiLanguageModal("Bundle Embed", [
                            { key: "embedTitle", label: "Title", fallback: textOverrides.embedTitle ?? "Build Your Bundle & Save More" },
                            { key: "embedSubTitle", label: "Sub Title", fallback: textOverrides.embedSubTitle ?? "", multiline: true },
                          ])}
                        >
                          Multi Language
                        </s-button>
                      </s-stack>

                      <s-text-field
                        label="Title"
                        value={textOverrides.embedTitle ?? "Build Your Bundle & Save More"}
                        onInput={(e: Event) => { setTextOverrides((prev) => ({ ...prev, embedTitle: (e.target as HTMLInputElement).value })); markAsDirty(); }}
                        autoComplete="off"
                      />
                      <s-text-field
                        label="Sub Title"
                        value={textOverrides.embedSubTitle ?? ""}
                        onInput={(e: Event) => { setTextOverrides((prev) => ({ ...prev, embedSubTitle: (e.target as HTMLInputElement).value })); markAsDirty(); }}
                        autoComplete="off"
                      />

                      <s-stack direction="vertical" gap="200">
                        <s-text>Display Bundle on</s-text>
                        {[
                          { value: "all_products",          label: "All products in bundle"  },
                          { value: "specific_products",     label: "Specific products"        },
                          { value: "specific_collections",  label: "Specific collections"     },
                        ].map(({ value, label }) => (
                          <label key={value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="embedDisplayOn"
                              value={value}
                              checked={(textOverrides.embedDisplayOn ?? "all_products") === value}
                              onChange={() => { setTextOverrides((prev) => ({ ...prev, embedDisplayOn: value })); markAsDirty(); }}
                            />
                            <span style={{ fontSize: 14 }}>{label}</span>
                          </label>
                        ))}
                      </s-stack>

                      <s-checkbox
                        checked={textOverrides.embedAddBrowsedProduct === "true" || undefined}
                        onChange={(e: Event) => { setTextOverrides((prev) => ({ ...prev, embedAddBrowsedProduct: (e.target as HTMLInputElement).checked ? "true" : "false" })); markAsDirty(); }}
                      >
                        Add browsed product to bundle
                      </s-checkbox>

                      <s-stack direction="vertical" gap="200">
                        <s-heading size="small">Put the Bundle Builder at a custom location</s-heading>
                        <s-text size="small" tone="subdued">Place app block on the theme.</s-text>
                        <s-button variant="secondary" onClick={handlePlaceWidget}>
                          Place Block
                        </s-button>
                      </s-stack>
                    </s-stack>
                  </s-section>
                </s-stack>
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
              const settingsStep = stepsState.steps[activeTabIndex] || stepsState.steps[0];
              const selectedDefaultProducts = settingsStep
                ? ((settingsStep.StepProduct as any[] | undefined) ?? [])
                : [];
              const defaultProductCount = selectedDefaultProducts.length;
              const defaultProductSelectionIds = selectedDefaultProducts
                .map((product: any) => product.productId || product.id)
                .filter(Boolean)
                .map((id: string) => ({ id }));
              const handleDefaultProductPicker = async () => {
                if (!settingsStep) return;
                const picked = await (shopify as any).resourcePicker({
                  type: "product",
                  multiple: true,
                  action: "select",
                  selectionIds: defaultProductSelectionIds,
                });
                if (!picked) return;

                const defaultProducts = picked.map((product: any) => ({
                  id: product.id,
                  title: product.title,
                  imageUrl: product.images?.[0]?.originalSrc || product.images?.[0]?.url || product.image?.url || null,
                  variants: product.variants || null,
                  minQuantity: 1,
                  maxQuantity: 10,
                }));
                const firstVariantId = defaultProducts[0]?.variants?.[0]?.id || defaultProducts[0]?.variants?.[0]?.gid || "";

                stepsState.updateStepField(settingsStep.id, "StepProduct", defaultProducts);
                stepsState.updateStepField(settingsStep.id, "isDefault", defaultProducts.length > 0);
                stepsState.updateStepField(settingsStep.id, "defaultVariantId", firstVariantId);
                markAsDirty();
              };

              return (
                <div data-tour-target="ppb-bundle-status">
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
                        <s-text-field
                          label="Default products title"
                          value={textOverrides.defaultProductsTitle ?? ""}
                          onInput={(e: Event) => {
                            setTextOverrides((prev) => ({ ...prev, defaultProductsTitle: (e.target as HTMLInputElement).value }));
                            markAsDirty();
                          }}
                          autoComplete="off"
                        />
                        <s-button
                          variant="secondary"
                          icon="globe"
                          onClick={() => openMultiLanguageModal("Pre Selected Product", [
                            { key: "defaultProductsTitle", label: "Default products title", fallback: textOverrides.defaultProductsTitle ?? "" },
                          ])}
                        >
                          Multi Language
                        </s-button>
                        <s-stack direction="block" gap="small-400">
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Choose default products</p>
                          <s-stack direction="inline" gap="small" alignItems="center">
                            <s-button variant="primary" disabled={!settingsStep} onClick={handleDefaultProductPicker}>
                              Browse Products
                            </s-button>
                            <s-badge tone={defaultProductCount > 0 ? "success" : "info"}>
                              {defaultProductCount > 0 ? `${defaultProductCount} selected` : "Not set"}
                            </s-badge>
                          </s-stack>
                        </s-stack>
                      </s-stack>
                    </s-section>

                    {/* Enable Quantity Validation */}
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
                      </s-stack>
                    </s-section>

                    {/* Cart line item discount display */}
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Cart line item discount display</h3>
                          <s-button variant="secondary" onClick={() => handleSectionChange("discount_pricing")}>
                            Edit Defaults
                          </s-button>
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
                            : [{ displayFree: step.addonDisplayFree !== false }];

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
                                    checked={tier.displayFree || undefined}
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
                      const productUrl = productId
                        ? `https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${productId}`
                        : undefined;

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
                                  onClick={() => productUrl && open(productUrl, '_blank')}
                                  disabled={!productUrl || undefined}
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

      {/* Select Template — Shopify native modal */}
      <s-modal ref={selectTemplateModalRef} heading="Customization">
        {templateModalStep === "select" ? (() => {
          const ppbTemplates = [
            { presetId: "CASCADE",    layoutTemplate: "PDP_INPAGE", label: "Product List",     image: "/productPageThumbnail.png"   },
            { presetId: "COGNIVE",    layoutTemplate: "PDP_INPAGE", label: "Product Grid",     image: "/fullPageThumbnail.png"       },
            { presetId: "MODAL",      layoutTemplate: "PDP_MODAL",  label: "Horizontal Slots", image: "/sidePanelThumbnail.png"      },
            { presetId: "SIMPLIFIED", layoutTemplate: "PDP_MODAL",  label: "Vertical Slots",   image: "/floatingCardThumbnail.png"   },
          ];
          return (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>Customize your bundle</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6d7175" }}>Choose a design that suits your needs and fits your brand</p>
                </div>
                <s-button variant="secondary" onClick={() => navigate("/app/design-control-panel")}>
                  Customize Colors &amp; Language
                </s-button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {ppbTemplates.map((tpl) => {
                  const isSelected = pendingDesignPresetId === tpl.presetId && pendingDesignTemplate === tpl.layoutTemplate;
                  return (
                    <div
                      key={tpl.presetId}
                      style={{
                        border: isSelected ? "3px solid #1a1a1a" : "2px solid #e1e3e5",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#f6f6f7",
                        cursor: isSelected ? "default" : "pointer",
                      }}
                      onClick={() => { if (!isSelected) { setPendingDesignTemplate(tpl.layoutTemplate); setPendingDesignPresetId(tpl.presetId); } }}
                    >
                      <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
                        <img src={tpl.image} alt={tpl.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 8, background: "#fff" }}>
                        <h3 style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 600 }}>{tpl.label}</h3>
                        <s-button
                          variant={isSelected ? "primary" : "secondary"}
                          disabled={isSelected || undefined}
                          onClick={(e: Event) => { e.stopPropagation(); if (!isSelected) { setPendingDesignTemplate(tpl.layoutTemplate); setPendingDesignPresetId(tpl.presetId); } }}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </s-button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <s-button
                  variant="primary"
                  loading={templateFetcher.state === "submitting" || undefined}
                  onClick={handleTemplateNext}
                >
                  Next
                </s-button>
              </div>
            </>
          );
        })() : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
            <div style={{ textAlign: "center", background: "#f6f6f7", borderRadius: 12, padding: "48px 40px", maxWidth: 480, width: "100%" }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: "#6d7175" }}>View your bundle</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6d7175" }}>View your bundle with your customizations</p>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e3f1eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <s-icon name="check" />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600 }}>Your bundle is ready</h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6d7175" }}>Preview it now with your customizations</p>
              <s-button variant="secondary" onClick={() => hidePolarisModal(selectTemplateModalRef)}>Preview bundle</s-button>
            </div>
          </div>
        )}
      </s-modal>

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
        valuesByLocale={textOverridesByLocale}
        onActiveLocaleChange={setTextOverridesLocale}
        onChange={updateLocalizedTextOverride}
        onClose={() => setIsMultiLanguageModalOpen(false)}
      />

      </div>
    </>
  );
}
