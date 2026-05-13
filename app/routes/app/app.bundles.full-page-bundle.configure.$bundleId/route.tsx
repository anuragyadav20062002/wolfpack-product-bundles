import { useState, useEffect, useCallback, useRef, useMemo, memo, type RefObject, type ReactNode } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, useRevalidator } from "@remix-run/react";
import { AppLogger } from "../../../lib/logger";
import { slugify, validateSlug } from "../../../lib/slug-utils";
import {
  DEFAULT_PROGRESS_BAR_PROGRESS_TEXT,
  DEFAULT_PROGRESS_BAR_SUCCESS_TEXT,
  DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE,
  DEFAULT_DISCOUNT_RULE_TEXT,
  normalizePricingDisplayOptions,
  normalizePricingRuleMessages,
  serializePricingDisplayOptions,
} from "../../../lib/pricing-display-options";

import {
  DiscountMethod,
  ConditionType,
  ConditionOperator,
  type PricingRule,
  centsToAmount,
  amountToCents,
} from "../../../types/pricing";
import {
  BUNDLE_STATUS_OPTIONS,
  STEP_CONDITION_TYPE_OPTIONS,
  STEP_CONDITION_OPERATOR_OPTIONS,
  DISCOUNT_METHOD_OPTIONS,
  DISCOUNT_CONDITION_TYPE_OPTIONS,
  DISCOUNT_OPERATOR_OPTIONS,
} from "../../../constants/bundle";
import { HELP_TOOLTIPS, type HelpTooltipKey, type HelpTooltipVisual } from "../../../constants/help-tooltips";
import { ERROR_MESSAGES } from "../../../constants/errors";
import { FilePicker } from "../../../components/design-control-panel/settings/FilePicker";
import { PricingTiersSection } from "../../../components/PricingTiersSection";
import { BundleReadinessOverlay, type BundleReadinessItem } from "../../../components/bundle-configure/BundleReadinessOverlay";
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
} from "./handlers";

import { checkAppEmbedEnabled } from "../../../services/theme/app-embed-check.server";
import { AppEmbedBanner } from "../../../components/AppEmbedBanner";

// Types - extracted to separate module for better organization
import type {
  LoaderData,
  BundleStatusSectionProps,
} from "./types";
import type { BundleStatus } from "../../../constants/bundle";


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
          StepProduct: true
        }
      },
      pricing: true
    },
  });

  if (!bundle) {
    throw new Response(ERROR_MESSAGES.BUNDLE_NOT_FOUND, { status: 404 });
  }


  // Fetch bundle product data from Shopify if it exists
  let bundleProduct = null;
  if (bundle.shopifyProductId) {
    try {
      const GET_BUNDLE_PRODUCT = `
        query GetBundleProduct($id: ID!) {
          product(id: $id) {
            id
            title
            handle
            status
            onlineStoreUrl
            onlineStorePreviewUrl
            description
            productType
            vendor
            tags
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price
                }
              }
            }
          }
        }
      `;

      const productResponse = await admin.graphql(GET_BUNDLE_PRODUCT, {
        variables: {
          id: bundle.shopifyProductId
        }
      });

      const productData = await productResponse.json();
      bundleProduct = productData.data?.product;
    } catch (error) {
      AppLogger.warn("Failed to fetch bundle product", {
        component: 'bundle-config',
        bundleId: params.bundleId,
        operation: 'fetch-product'
      }, error);
      // Don't fail the entire request if we can't fetch the product
    }
  }

  // Fetch all full-page bundles for the shop (used in pricing tiers selector)
  const availableBundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      bundleType: 'full_page',
      status: { in: ['draft', 'active'] },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Fetch shop locales for multi-language text overrides
  let shopLocales: { locale: string; name: string; primary: boolean }[] = [];
  try {
    const localesResponse = await admin.graphql(`
      query GetShopLocales {
        shopLocales {
          locale
          name
          primary
          published
        }
      }
    `);
    const localesData = await localesResponse.json() as { data?: { shopLocales?: { locale: string; name: string; primary: boolean; published: boolean }[] } };
    shopLocales = (localesData.data?.shopLocales ?? []).filter((l) => l.published);
  } catch {
    // Non-critical — fall back to English-only mode
  }

  // CRITICAL: Use app's API key (client_id from shopify.app.toml), NOT extension UUID
  // Per Shopify docs: addAppBlockId={api_key}/{handle}
  // Reference: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
  const apiKey = process.env.SHOPIFY_API_KEY || '';
  // Block handle must match the liquid filename (without .liquid extension)
  // File: extensions/bundle-builder/blocks/bundle-full-page.liquid
  const blockHandle = 'bundle-full-page';

  const embedCheck = await checkAppEmbedEnabled(admin, session.shop);
  const themeEditorUrl = embedCheck.themeId
    ? `https://${session.shop}/admin/themes/${embedCheck.themeId.split("/").pop()}/editor?context=apps&appEmbed=${apiKey}%2Fbundle-full-page-embed`
    : null;

  return json({
    bundle,
    bundleProduct,
    availableBundles,
    shop: session.shop,
    apiKey,
    blockHandle,
    shopLocales,
    appEmbedEnabled: embedCheck.enabled,
    themeEditorUrl,
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
  { id: "step_setup",       label: "Step Setup",         fullPageOnly: false },
  { id: "discount_pricing", label: "Discount & Pricing", fullPageOnly: false },
  { id: "bundle_visibility", label: "Bundle Visibility", fullPageOnly: true  },
  { id: "bundle_settings",  label: "Bundle Settings",    fullPageOnly: false },
];

const stepSetupChildItems = [
  { id: "free_gift_addons", label: "Free Gift & Add Ons" },
  { id: "messages", label: "Messages" },
];

// Static status options - imported from centralized constants
const statusOptions = [...BUNDLE_STATUS_OPTIONS];

const TEMPLATE_VARIABLES: [string, string][] = [
  ["{{discountConditionDiff}}", "The remaining quantity or monetary amount a customer needs to add to their cart to unlock the discount."],
  ["{{discountUnit}}", "The symbol for the discount requirement, such as your store's currency symbol ($) for amount-based rules."],
  ["{{discountValue}}", "The numerical value of the discount reward itself (e.g., the '10' in a 10% or $10 discount)."],
  ["{{discountValueUnit}}", "The symbol used for the discount reward, such as the percent sign (%) or the store's currency symbol ($)."],
  ["{{discountedItems}}", "The quantity of items that will be discounted or given free as part of the \"Get Y\" offer."],
];

function showPolarisModal(ref: RefObject<HTMLElement>) {
  const modal = ref.current as any;
  modal?.showOverlay?.();
  if (!modal?.showOverlay) modal?.show?.();
}

function hidePolarisModal(ref: RefObject<HTMLElement>) {
  const modal = ref.current as any;
  modal?.hideOverlay?.();
  if (!modal?.hideOverlay) modal?.hide?.();
}

// Memoized BundleStatusSection component (BundleStatusSectionProps imported from types)
const BundleStatusSection = memo(({ status, onChange }: BundleStatusSectionProps) => (
  <s-stack direction="block" gap="small-100">
    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
      Bundle Status
    </h4>
    <s-select
      value={status}
      onChange={(e: Event) => onChange((e.target as HTMLSelectElement).value as BundleStatus)}
    >
      {statusOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </s-select>
  </s-stack>
));
BundleStatusSection.displayName = 'BundleStatusSection';

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
  const tooltip = HELP_TOOLTIPS[tooltipKey];

  return (
    <span className={fullPageBundleStyles.richHelp}>
      <s-button
        icon={icon}
        variant="tertiary"
        accessibilityLabel={accessibilityLabel || tooltip.accessibilityLabel || label || tooltip.title}
        className={fullPageBundleStyles.richHelpTrigger}
      >
        {label}
      </s-button>
      <span className={fullPageBundleStyles.richHelpCard} role="tooltip">
        <HelpTooltipVisualBlock visual={tooltip.visual} title={tooltip.title} />
        <span className={fullPageBundleStyles.richHelpTitle}>{tooltip.title}</span>
        <span className={fullPageBundleStyles.richHelpDescription}>{tooltip.description}</span>
      </span>
    </span>
  );
}

function QuestionHelpTooltip({
  tooltipKey,
}: {
  tooltipKey: HelpTooltipKey;
}) {
  const tooltip = HELP_TOOLTIPS[tooltipKey];

  return (
    <span className={fullPageBundleStyles.richHelp}>
      <button
        type="button"
        className={fullPageBundleStyles.questionHelpButton}
        aria-label={tooltip.accessibilityLabel || tooltip.title}
      >
        ?
      </button>
      <span className={fullPageBundleStyles.richHelpCard} role="tooltip">
        <HelpTooltipVisualBlock visual={tooltip.visual} title={tooltip.title} />
        <span className={fullPageBundleStyles.richHelpDescription}>{tooltip.description}</span>
      </span>
    </span>
  );
}

function HelpTooltipVisualBlock({
  visual,
  title,
}: {
  visual: HelpTooltipVisual;
  title: string;
}) {
  const visualClass = {
    "step-flow": fullPageBundleStyles.richHelpVisual_stepFlow,
    category: fullPageBundleStyles.richHelpVisual_category,
    rules: fullPageBundleStyles.richHelpVisual_rules,
    quantity: fullPageBundleStyles.richHelpVisual_quantity,
    progress: fullPageBundleStyles.richHelpVisual_progress,
    messaging: fullPageBundleStyles.richHelpVisual_messaging,
    loading: fullPageBundleStyles.richHelpVisual_loading,
  }[visual];

  if (visual === "category") {
    return (
      <span className={fullPageBundleStyles.richHelpCategoryVisual} role="img" aria-label={title}>
        <span className={fullPageBundleStyles.richHelpCategoryTabActive}>Category 1</span>
        <span className={fullPageBundleStyles.richHelpCategoryTab}>Category 2</span>
        <span className={fullPageBundleStyles.richHelpCategoryTab}>Category 3</span>
      </span>
    );
  }

  return (
    <span className={`${fullPageBundleStyles.richHelpVisual} ${visualClass}`} role="img" aria-label={title}>
      <span className={fullPageBundleStyles.richHelpVisualTrack}>
        <span className={fullPageBundleStyles.richHelpVisualNode}>1</span>
        <span className={fullPageBundleStyles.richHelpVisualLine} />
        <span className={fullPageBundleStyles.richHelpVisualNode}>2</span>
        <span className={fullPageBundleStyles.richHelpVisualLine} />
        <span className={fullPageBundleStyles.richHelpVisualNode}>3</span>
      </span>
    </span>
  );
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
    () => `https://${shopDomain}.myshopify.com/pages/${pageSlug}`,
    [shopDomain, pageSlug]
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
  const originalShowProductPricesRef = useRef<boolean>((bundle as any).showProductPrices ?? true);
  const originalShowCompareAtPricesRef = useRef<boolean>((bundle as any).showCompareAtPrices ?? false);
  const originalCartRedirectToCheckoutRef = useRef<boolean>((bundle as any).cartRedirectToCheckout ?? false);
  const originalAllowQuantityChangesRef = useRef<boolean>((bundle as any).allowQuantityChanges ?? true);

  // Text overrides state (Messages tab)
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>(
    ((bundle as any).textOverrides as Record<string, string>) ?? {}
  );
  const [textOverridesByLocale, setTextOverridesByLocale] = useState<Record<string, Record<string, string>>>(
    ((bundle as any).textOverridesByLocale as Record<string, Record<string, string>>) ?? {}
  );
  const originalTextOverridesRef = useRef<Record<string, string>>(
    ((bundle as any).textOverrides as Record<string, string>) ?? {}
  );
  const originalTextOverridesByLocaleRef = useRef<Record<string, Record<string, string>>>(
    ((bundle as any).textOverridesByLocale as Record<string, Record<string, string>>) ?? {}
  );
  // Which locale the merchant is currently editing in the Messages tab
  const [textOverridesLocale, setTextOverridesLocale] = useState<string>("en");

  // Widget install loading state
  const [isInstallingWidget, setIsInstallingWidget] = useState(false);

  // Active step tab for Bundle Assets section (independent from Step Setup tab)
  const [activeAssetTabIndex, setActiveAssetTabIndex] = useState(0);

  // Search bar enabled (bundle-level)
  const [searchBarEnabled, setSearchBarEnabled] = useState<boolean>(
    (bundle as any).searchBarEnabled ?? false
  );
  const originalSearchBarEnabledRef = useRef<boolean>((bundle as any).searchBarEnabled ?? false);

  // Step chip navigation slide animation
  const [slideKey, setSlideKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"forward" | "backward" | null>(null);

  // Icon picker visibility (tracks which step's picker is open)
  const [showIconPickerForStep, setShowIconPickerForStep] = useState<string | null>(null);

  // Multi-language modal for step names
  const [isStepLocaleModalOpen, setIsStepLocaleModalOpen] = useState(false);

  // Warning modal state: steps + tiers conflict
  const [stepsTiersWarning, setStepsTiersWarning] = useState<{
    open: boolean;
    onConfirm: (() => void) | null;
  }>({ open: false, onConfirm: null });

  // Sync Bundle modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);

  // Modal refs for s-modal web components
  const stepsTiersModalRef = useRef<HTMLElement>(null);
  const pageSelectionModalRef = useRef<HTMLElement>(null);
  const productsModalRef = useRef<HTMLElement>(null);
  const collectionsModalRef = useRef<HTMLElement>(null);
  const syncModalRef = useRef<HTMLElement>(null);
  const templateVariablesModalRef = useRef<HTMLElement>(null);

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

  // SaveBar visibility controlled by isDirty flag - no complex change detection needed!

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
  }), [
    pricingState.discountRules,
    ruleMessages,
  ]);

  const readinessItems = useMemo<BundleReadinessItem[]>(() => {
    const hasProducts = stepsState.steps.some((step) =>
      Array.isArray(step.StepProduct) && step.StepProduct.length > 0
    );
    const hasBundleVisibility = Boolean(bundle.shopifyPageId || bundle.shopifyPageHandle || formState.bundleStatus === "active");
    const parentProductActive = String(productStatus || loadedBundleProduct?.status || "").toLowerCase() === "active";

    return [
      { key: "embed", label: "App embed enabled", description: "Required to display bundles on your storefront.", points: 15, done: appEmbedEnabled },
      { key: "products", label: "Products added to a step", description: "Add at least one product to a bundle step.", points: 20, done: hasProducts },
      { key: "discount", label: "Discount configured", description: "Set a discount to give customers a reason to bundle.", points: 15, done: pricingState.discountEnabled },
      { key: "visible", label: "Bundle placed / visible", description: "Place your bundle on a page so customers can find it.", points: 25, done: hasBundleVisibility },
      { key: "product_active", label: "Parent product active", description: "Your parent product must be active to accept orders.", points: 15, done: parentProductActive },
    ];
  }, [
    appEmbedEnabled,
    bundle.shopifyPageHandle,
    bundle.shopifyPageId,
    formState.bundleStatus,
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
      formData.append("discountData", JSON.stringify({
        discountEnabled: pricingState.discountEnabled,
        discountType: pricingState.discountType,
        discountRules: pricingState.discountRules,
        showFooter: pricingState.showFooter,
        showDiscountProgressBar: pricingState.showDiscountProgressBar,
        discountMessagingEnabled: pricingState.discountMessagingEnabled,
        ruleMessages: normalizedRuleMessages,
        pricingDisplayOptions: pricingMessages.displayOptions
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
    shopify
  ]);

  // Function to enhance template list with user's selected template
  const enhanceTemplateListWithUserSelection = useCallback((templates: any[]) => {
    if (!formState.templateName || formState.templateName.trim() === '') {
      return templates;
    }

    const userTemplateHandle = formState.templateName.startsWith('product.') ? formState.templateName : `product.${formState.templateName}`;

    // Check if user's template already exists in the list
    const templateExists = templates.some(t => t.handle === userTemplateHandle || t.handle === formState.templateName);

    if (!templateExists) {
      // Add user's selected template at the top of the list
      const userTemplate = {
        id: userTemplateHandle,
        title: `🎯 ${formState.templateName} (Your Selection)`,
        handle: userTemplateHandle,
        description: `Custom template "${formState.templateName}" - your selected bundle container template`,
        recommended: true,
        bundleRelevant: true,
        fileType: 'User Selected',
        fullKey: `templates/${userTemplateHandle}.liquid`,
        isBundleContainer: true,
        isUserSelected: true
      };

      return [userTemplate, ...templates];
    }

    // If template exists, mark it as user selected
    return templates.map(t => {
      if (t.handle === userTemplateHandle || t.handle === formState.templateName) {
        return {
          ...t,
          title: `🎯 ${t.title} (Your Selection)`,
          recommended: true,
          isUserSelected: true
        };
      }
      return t;
    });
  }, [formState.templateName]);

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
  }, [bundle.shopifyPageHandle, hookHandleDiscard]);

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

  const handlePreviewBundle = useCallback(() => {
    if (isDirty) {
      // Show user-friendly message about unsaved changes
      shopify.toast.show("Please save your changes before previewing the bundle", {
        isError: true,
        duration: 4000
      });
      return;
    }

    // FOR FULL-PAGE BUNDLES: Use page URL instead of product URL
    if (bundle.bundleType === 'full_page') {
      if (!bundle.shopifyPageHandle) {
        // No published page yet — trigger draft preview page creation
        const formData = new FormData();
        formData.append("intent", "createPreviewPage");
        fetcher.submit(formData, { method: "post" });
        return;
      }

      // Construct page URL
      const shopDomain = shop.includes('.myshopify.com')
        ? shop.replace('.myshopify.com', '')
        : shop.split('.')[0];

      const pageUrl = `https://${shopDomain}.myshopify.com/pages/${bundle.shopifyPageHandle}`;


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
  }, [isDirty, bundle, bundleProduct, shop, shopify]);

  const handleSectionChange = useCallback((section: string) => {
    if (section === activeSection) return;

    if (isDirty) {
      promptSaveBarBeforeNavigation();
      return;
    }

    setActiveSection(section);
  }, [isDirty, activeSection, promptSaveBarBeforeNavigation]);

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

  // Step management functions


  // NOTE: toggleStepExpansion, getUniqueProductCount, updateStepField, addConditionRule,
  // removeConditionRule, updateConditionRule are now provided by stepsState and conditionsState hooks

  // Product selection handlers
  const handleProductSelection = useCallback(async (stepId: string) => {
    try {
      const step = stepsState.steps.find(s => s.id === stepId);
      const currentProducts = step?.StepProduct || [];

      // Build selectionIds from StepProduct
      // When loaded from DB: use productId field
      // When from resource picker: use id field
      // If variants exist and are selected, include them in the format needed by resource picker
      const selectionIds = currentProducts.map((p: any) => {
        const productGid = p.productId || p.id; // productId from DB, id from picker

        // Check if this product has specific variants selected
        // If variants array exists and has items, include them in selectionIds
        if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
          const variantIds = p.variants.map((v: any) => ({ id: v.id }));
          return {
            id: productGid,
            variants: variantIds
          };
        }

        return { id: productGid };
      });



      const products = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: selectionIds,
      });


      if (products && products.selection) {

        // Transform products to include imageUrl from images array
        const transformedProducts = products.selection.map((product: any) => {
          const imageUrl = product.images?.[0]?.originalSrc || product.images?.[0]?.url || product.image?.url || null;
          return {
            ...product,
            imageUrl: imageUrl
          };
        });


        // Update the step with selected products (this replaces the entire selection)
        // Deselected products will not be in the selection array, so they're automatically removed
        stepsState.setSteps(stepsState.steps.map(step =>
          step.id === stepId
            ? { ...step, StepProduct: transformedProducts }
            : step
        ) as any);

        const addedCount = transformedProducts.length - currentProducts.length;
        const message = addedCount > 0
          ? `Added ${addedCount} product${addedCount !== 1 ? 's' : ''}!`
          : addedCount < 0
            ? `Removed ${Math.abs(addedCount)} product${Math.abs(addedCount) !== 1 ? 's' : ''}!`
            : transformedProducts.length === 0
              ? "All products removed"
              : "Products updated successfully!";

        shopify.toast.show(message);
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show(ERROR_MESSAGES.FAILED_TO_SELECT_PRODUCTS, { isError: true, duration: 5000 });
      }
    }
  }, [stepsState.steps, stepsState.setSteps, shopify]);

  const handleSyncProduct = useCallback(() => {
    try {

      // Show loading toast
      shopify.toast.show("Syncing bundle product with Shopify...", { isError: false });

      // Prepare form data for sync operation
      const formData = new FormData();
      formData.append("intent", "syncProduct");

      // Submit to server action using fetcher
      fetcher.submit(formData, { method: "post" });

      // Response will be handled by the existing useEffect
    } catch (error) {
      AppLogger.error("Product sync failed:", {}, error as any);
      shopify.toast.show((error as Error).message || ERROR_MESSAGES.FAILED_TO_SYNC_PRODUCT, { isError: true, duration: 5000 });
    }
  }, [fetcher, shopify]);

  const handleSyncBundleConfirm = useCallback(() => {
    setIsSyncModalOpen(false);
    const formData = new FormData();
    formData.append("intent", "syncBundle");
    fetcher.submit(formData, { method: "post" });
  }, [fetcher]);

  const handleBundleProductSelect = useCallback(async () => {
    try {
      const products = await shopify.resourcePicker({
        type: "product",
        multiple: false,
      });

      if (products && products.length > 0) {
        const selectedProduct = products[0] as any;
        setBundleProduct(selectedProduct);
        setProductTitle(selectedProduct.title || "");
        setProductImageUrl(selectedProduct.featuredImage?.url || selectedProduct.images?.[0]?.originalSrc || "");

        shopify.toast.show("Bundle product updated successfully", { isError: false });
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show(ERROR_MESSAGES.FAILED_TO_SELECT_BUNDLE_PRODUCT, { isError: true, duration: 5000 });
      }
    }
  }, [shopify]);

  // Step management handlers
  const cloneStep = useCallback((stepId: string) => {
    const stepToClone = stepsState.steps.find(step => step.id === stepId);
    if (stepToClone) {
      const newStep = {
        ...stepToClone,
        id: `step-${Date.now()}`,
        name: `${stepToClone.name} (Copy)`,
        StepProduct: stepToClone.StepProduct || []
      };
      stepsState.setSteps(prev => {
        const stepIndex = prev.findIndex(step => step.id === stepId);
        const newSteps = [...prev];
        newSteps.splice(stepIndex + 1, 0, newStep);
        return newSteps;
      });
      shopify.toast.show("Step cloned successfully", { isError: false });
    }
  }, [stepsState.steps, stepsState.setSteps, shopify]);

  const deleteStep = useCallback((stepId: string) => {
    if (stepsState.steps.length <= 1) {
      shopify.toast.show(ERROR_MESSAGES.CANNOT_DELETE_LAST_STEP, { isError: true, duration: 5000 });
      return;
    }

    // Use hook's removeStep which handles expandedSteps cleanup and dirty flag
    stepsState.removeStep(stepId);
  }, [stepsState]);

  // Navigate between steps with slide animation
  const navigateToStep = useCallback((idx: number) => {
    if (idx === activeTabIndex) return;
    setSlideDir(idx > activeTabIndex ? "forward" : "backward");
    setSlideKey(prev => prev + 1);
    setActiveTabIndex(idx);
    setShowIconPickerForStep(null);
  }, [activeTabIndex, setActiveTabIndex]);

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

  // Drag and drop state
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, stepId: string, _index: number) => {
    setDraggedStep(stepId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", stepId);

    // Add visual feedback by setting drag image
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "0.5";
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedStep(null);
    setDragOverIndex(null);

    // Reset visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "1";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedStep) return;

    const dragIndex = stepsState.steps.findIndex(step => step.id === draggedStep);

    if (dragIndex !== -1 && dragIndex !== dropIndex) {
      stepsState.setSteps(prev => {
        const newSteps = [...prev];
        const draggedStepData = newSteps[dragIndex];
        newSteps.splice(dragIndex, 1);
        newSteps.splice(dropIndex, 0, draggedStepData);
        return newSteps;
      });

      shopify.toast.show("Step reordered successfully", { isError: false });
    }

    setDraggedStep(null);
    setDragOverIndex(null);
  }, [draggedStep, stepsState.steps, stepsState.setSteps, shopify]);

  // NOTE: addStep is now provided by stepsState hook

  // Collection management handlers
  const handleCollectionSelection = useCallback(async (stepId: string) => {
    try {
      const currentCollections = selectedCollections[stepId] || [];

      const collections = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
        selectionIds: currentCollections.map((c: any) => ({ id: c.id })),
      });

      if (collections && collections.length > 0) {

        setSelectedCollections(prev => ({
          ...prev,
          [stepId]: collections as any
        }));

        const addedCount = collections.length - currentCollections.length;
        const message = addedCount > 0
          ? `Added ${addedCount} collection${addedCount !== 1 ? 's' : ''}!`
          : addedCount < 0
            ? `Removed ${Math.abs(addedCount)} collection${Math.abs(addedCount) !== 1 ? 's' : ''}!`
            : "Collections updated successfully!";

        shopify.toast.show(message, { isError: false });
      } else if (collections && collections.length === 0) {
        // User deselected all collections
        setSelectedCollections(prev => ({
          ...prev,
          [stepId]: []
        }));
        shopify.toast.show("All collections removed", { isError: false });
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show(ERROR_MESSAGES.FAILED_TO_SELECT_COLLECTIONS, { isError: true, duration: 5000 });
      }
    }
  }, [shopify, selectedCollections]);

  // NOTE: Discount rule management (addDiscountRule, removeDiscountRule, updateDiscountRule)
  // is now provided by pricingState hook

  // Rule message management
  const updateRuleMessage = useCallback((ruleId: string, field: 'discountText' | 'successMessage', value: string) => {
    setRuleMessages(prev => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: value
      }
    }));
  }, []);

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
      const appBlockId = `${apiKey}/${blockHandle}`;
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
  }, [shop, shopify, bundle.id, apiKey, blockHandle]);

  return (
    <>
      <ui-title-bar title={`Configure: ${formState.bundleName}`}>
        <button variant="breadcrumb" onClick={handleBackClick}>Dashboard</button>
      </ui-title-bar>
      <div className={fullPageBundleStyles.editCanvas}>
      {/* Modern App Bridge SaveBar with declarative React state management */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        onReset={(e) => {
          e.preventDefault();
          handleDiscard();
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
            onClick={handleDiscard}
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
          }).displayOptions
        })} />
        <input type="hidden" name="stepConditions" value={JSON.stringify(conditionsState.stepConditions)} />

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

        <AppEmbedBanner appEmbedEnabled={appEmbedEnabled} themeEditorUrl={themeEditorUrl} />

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
                    <button
                      type="button"
                      className={fullPageBundleStyles.ebLinkButton}
                      onClick={handleSyncProduct}
                    >
                      Sync Product
                    </button>
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
                          <span aria-hidden="true">□</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className={fullPageBundleStyles.bundleProductName}
                        onClick={() => {
                          const productId = bundleProduct?.legacyResourceId || bundleProduct?.id?.split('/').pop() || bundle.shopifyProductId?.split('/').pop();
                          if (!productId) {
                            void handleBundleProductSelect();
                            return;
                          }
                          const productUrl = `https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${productId}`;
                          open(productUrl, '_blank');
                        }}
                      >
                        {productTitle || bundleProduct?.title || formState.bundleName || "Bundle Product"}
                      </button>
                    </div>
                    <button
                      type="button"
                      className={fullPageBundleStyles.bundleProductEditButton}
                      onClick={handleBundleProductSelect}
                    >
                      <span aria-hidden="true">↗</span>
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
                        const isActive = activeSection === item.id || (item.id === "step_setup" && (activeSection === "free_gift_addons" || activeSection === "messages"));
                        let statusBadge: { label: string; tone?: string } | null = null;
                        if (item.id === 'discount_pricing') {
                          statusBadge = pricingState.discountEnabled ? null : { label: 'None' };
                        }
                        if (item.id === 'bundle_visibility') {
                          statusBadge = bundle.shopifyPageHandle ? { label: 'Complete', tone: 'success' } : { label: 'Pending', tone: 'warning' };
                        }
                        return (
                          <div key={item.id}>
                            <button
                              type="button"
                              className={`${fullPageBundleStyles.setupNavItem} ${isActive ? fullPageBundleStyles.setupNavItemActive : ""}`}
                              onClick={() => handleSectionChange(item.id)}
                            >
                              <span className={fullPageBundleStyles.setupNavIcon} aria-hidden="true">
                                {item.id === "step_setup" && "✥"}
                                {item.id === "discount_pricing" && "◌"}
                                {item.id === "bundle_visibility" && "⌂"}
                                {item.id === "bundle_settings" && "⌘"}
                              </span>
                              <span className={fullPageBundleStyles.setupNavLabel}>{item.label}</span>
                              <span className={fullPageBundleStyles.setupNavMeta}>
                                {statusBadge && !isActive && (
                                  <s-badge tone={statusBadge.tone as any || "subdued"}>{statusBadge.label}</s-badge>
                                )}
                              </span>
                            </button>
                            {item.id === "step_setup" && (activeSection === "step_setup" || activeSection === "free_gift_addons" || activeSection === "messages") && (
                              <div className={fullPageBundleStyles.ebSubNav}>
                                {stepSetupChildItems.map((child) => (
                                  <button
                                    key={child.id}
                                    type="button"
                                    className={`${fullPageBundleStyles.ebSubNavItem} ${activeSection === child.id ? fullPageBundleStyles.ebSubNavItemActive : ""}`}
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
                        className={fullPageBundleStyles.ebLinkButton}
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
                        {stepsState.steps.length > 1 && activeTabIndex === i && (
                          <span
                            className={fullPageBundleStyles.stepChipRemove}
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteStep(step.id); }}
                            title="Remove this step"
                          >
                            ✕
                          </span>
                        )}
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
                    {/* ── EB-style Step Setup card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <div className={fullPageBundleStyles.cardHeader}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Step Setup</h3>
                        <s-checkbox
                          accessibilityLabel="Enable step"
                          checked={step.enabled !== false || undefined}
                          onChange={(e: Event) => {
                            stepsState.updateStepField(step.id, "enabled", (e.target as HTMLInputElement).checked);
                            markAsDirty();
                          }}
                        />
                      </div>
                      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6d7175" }}>
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
                        {shopLocales.length > 0 && (
                          <s-button
                            variant="secondary"
                            icon="globe"
                            onClick={() => setIsStepLocaleModalOpen(true)}
                          >
                            Multi Language
                          </s-button>
                        )}
                      </s-stack>
                    </div>

                    {/* ── Category card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Category</h3>
                      <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6d7175" }}>
                        Add all product selections in this step to a single category or separate them into multiple categories for better segregation.
                      </p>
                      <div className={fullPageBundleStyles.tabRow}>
                        <button
                          className={stepsState.selectedTab === 0 ? fullPageBundleStyles.tabActive : fullPageBundleStyles.tab}
                          onClick={() => stepsState.setSelectedTab(0)}
                        >
                          Browse Products
                          {step.StepProduct && step.StepProduct.length > 0 && (
                            <span className={fullPageBundleStyles.tabBadge}>{stepsState.getUniqueProductCount(step.StepProduct)}</span>
                          )}
                        </button>
                        <button
                          className={stepsState.selectedTab === 1 ? fullPageBundleStyles.tabActive : fullPageBundleStyles.tab}
                          onClick={() => stepsState.setSelectedTab(1)}
                        >
                          Browse Collections
                          {(selectedCollections[step.id]?.length > 0) && (
                            <span className={fullPageBundleStyles.tabBadge}>{selectedCollections[step.id].length}</span>
                          )}
                        </button>
                      </div>

                      {stepsState.selectedTab === 0 && (
                        <div>
                          <p style={{ margin: "0 0 12px", fontSize: 14, color: "#6d7175" }}>
                            Products selected here will be displayed in this step.
                          </p>
                          <div className={fullPageBundleStyles.productActions}>
                            <s-button variant="primary" onClick={() => handleProductSelection(step.id)}>
                              Add Product
                            </s-button>
                            {step.StepProduct && step.StepProduct.length > 0 && (
                              <s-badge tone="success">
                                {stepsState.getUniqueProductCount(step.StepProduct)} Selected
                              </s-badge>
                            )}
                          </div>
                        </div>
                      )}

                      {stepsState.selectedTab === 1 && (
                        <div>
                          <p style={{ margin: "0 0 12px", fontSize: 14, color: "#6d7175" }}>
                            Collections selected here will be displayed in this step.
                          </p>
                          <div className={fullPageBundleStyles.productActions}>
                            <s-button variant="primary" onClick={() => handleCollectionSelection(step.id)}>
                              Add Collections
                            </s-button>
                            {selectedCollections[step.id]?.length > 0 && (
                              <s-badge tone="success">
                                {selectedCollections[step.id].length} Selected
                              </s-badge>
                            )}
                          </div>
                          {selectedCollections[step.id]?.length > 0 && (
                            <s-stack direction="block" gap="small-400" style={{ marginTop: 12 }}>
                              {selectedCollections[step.id].map((col: any) => (
                                <s-stack key={col.id} direction="inline" gap="small-100">
                                  <img
                                    src={col.image?.url || "/bundle.png"}
                                    alt={col.title}
                                    style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
                                  />
                                  <span style={{ flex: 1, fontSize: 14 }}>{col.title}</span>
                                  <s-button
                                    variant="plain"
                                    onClick={() => setSelectedCollections(prev => ({
                                      ...prev,
                                      [step.id]: prev[step.id]?.filter((c: any) => c.id !== col.id) || []
                                    }))}
                                  >
                                    Remove
                                  </s-button>
                                </s-stack>
                              ))}
                            </s-stack>
                          )}
                        </div>
                      )}

                      {(() => {
                        const filters = (((step as any).filters as { label: string; collectionHandle: string }[]) || [])
                          .filter((filter) => filter.label || filter.collectionHandle);
                        const collectionsForStep = ((selectedCollections[step.id] || step.collections || []) as { id?: string; handle?: string; title?: string }[]);
                        const categoryRows = filters.length > 0
                          ? filters.map((filter, filterIndex) => ({
                              id: `${filter.collectionHandle || "filter"}-${filterIndex}`,
                              label: filter.label || filter.collectionHandle || `Category ${filterIndex + 1}`,
                              type: "filter" as const,
                              index: filterIndex,
                            }))
                          : collectionsForStep.length > 0
                            ? collectionsForStep.map((collection, collectionIndex) => ({
                                id: collection.id || collection.handle || `collection-${collectionIndex}`,
                                label: collection.title || collection.handle || `Category ${collectionIndex + 1}`,
                                type: "collection" as const,
                                index: collectionIndex,
                              }))
                            : (step.StepProduct && step.StepProduct.length > 0)
                              ? [{
                                  id: "selected-products",
                                  label: "Products",
                                  type: "products" as const,
                                  index: 0,
                                }]
                              : [];

                        return categoryRows.length > 0 ? (
                          <div className={fullPageBundleStyles.ebCategoryList}>
                            {categoryRows.map((row) => (
                              <div key={row.id} className={fullPageBundleStyles.ebCategoryItem}>
                                <span className={fullPageBundleStyles.ebCategoryDrag} aria-hidden="true">⋮⋮</span>
                                <span className={fullPageBundleStyles.ebCategoryName}>{row.label}</span>
                                <span className={fullPageBundleStyles.ebCategoryActions}>
                                  <s-button
                                    variant="plain"
                                    onClick={() => {
                                      if (row.type !== "filter") {
                                        shopify.toast.show("Create category filter tabs before cloning categories.", { isError: false });
                                        return;
                                      }
                                      const current = (((step as any).filters as { label: string; collectionHandle: string }[]) || []);
                                      const source = current[row.index];
                                      stepsState.updateStepField(step.id, "filters", [
                                        ...current,
                                        { ...source, label: `${source.label || "Category"} Copy` },
                                      ]);
                                      markAsDirty();
                                    }}
                                  >
                                    Clone
                                  </s-button>
                                  <s-button
                                    variant="plain"
                                    onClick={() => {
                                      if (row.type === "filter") {
                                        const updated = (((step as any).filters as { label: string; collectionHandle: string }[]) || []).filter((_, i) => i !== row.index);
                                        stepsState.updateStepField(step.id, "filters", updated.length > 0 ? updated : null);
                                      } else if (row.type === "collection") {
                                        setSelectedCollections(prev => ({
                                          ...prev,
                                          [step.id]: (prev[step.id] || []).filter((_: any, i: number) => i !== row.index),
                                        }));
                                      } else {
                                        stepsState.updateStepField(step.id, "StepProduct", []);
                                      }
                                      markAsDirty();
                                    }}
                                  >
                                    Delete
                                  </s-button>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })()}

                      <s-divider style={{ marginTop: 16, marginBottom: 16 }} />
                      <s-stack direction="block" gap="small">
                        <span className={fullPageBundleStyles.headingWithHelp}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Category filters</h4>
                          <QuestionHelpTooltip tooltipKey="category" />
                        </span>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                          Add product selections to a single category or separate them into multiple filter tabs for better segregation.
                        </p>
                        {((selectedCollections[step.id] || step.collections || []).length === 0) ? (
                          <div className={fullPageBundleStyles.emptyState}>
                            Add collections to this step first to configure category filter tabs.
                          </div>
                        ) : (
                          <s-stack direction="block" gap="small">
                            {((step as any).filters as { label: string; collectionHandle: string }[] || []).map(
                              (filter, fi) => (
                                <div key={fi} className={fullPageBundleStyles.categoryFilterRow}>
                                  <s-text-field
                                    label="Tab label"
                                    placeholder="e.g. Snowboards"
                                    value={filter.label}
                                    onInput={(e: Event) => {
                                      const updated = [
                                        ...((step as any).filters || []),
                                      ] as { label: string; collectionHandle: string }[];
                                      updated[fi] = { ...updated[fi], label: (e.target as HTMLInputElement).value };
                                      stepsState.updateStepField(step.id, 'filters', updated);
                                      markAsDirty();
                                    }}
                                    autoComplete="off"
                                  />
                                  <s-select
                                    label="Collection"
                                    value={filter.collectionHandle}
                                    onChange={(e: Event) => {
                                      const updated = [
                                        ...((step as any).filters || []),
                                      ] as { label: string; collectionHandle: string }[];
                                      updated[fi] = { ...updated[fi], collectionHandle: (e.target as HTMLSelectElement).value };
                                      stepsState.updateStepField(step.id, 'filters', updated);
                                      markAsDirty();
                                    }}
                                  >
                                    <s-option value="" disabled>Select collection</s-option>
                                    {((selectedCollections[step.id] || step.collections || []) as { id: string; handle: string; title: string }[]).map(col => (
                                      <s-option key={col.id} value={col.handle || col.id}>{col.title || col.handle}</s-option>
                                    ))}
                                  </s-select>
                                  <s-button
                                    variant="plain"
                                    onClick={() => {
                                      const updated = ((step as any).filters as { label: string; collectionHandle: string }[]).filter((_, i) => i !== fi);
                                      stepsState.updateStepField(step.id, 'filters', updated.length > 0 ? updated : null);
                                      markAsDirty();
                                    }}
                                  >
                                    <s-icon name="delete" />
                                  </s-button>
                                </div>
                              )
                            )}
                            <s-button
                              variant="secondary"
                              icon="plus"
                              onClick={() => {
                                const current = ((step as any).filters as { label: string; collectionHandle: string }[]) || [];
                                stepsState.updateStepField(step.id, 'filters', [
                                  ...current,
                                  { label: "", collectionHandle: "" },
                                ]);
                                markAsDirty();
                              }}
                            >
                              Add Category
                            </s-button>
                          </s-stack>
                        )}
                      </s-stack>
                      <s-divider style={{ marginTop: 16, marginBottom: 16 }} />
                      <s-checkbox
                        label="Display variants as individual products"
                        checked={step.displayVariantsAsIndividualProducts || step.displayVariantsAsIndividual || undefined}
                        onChange={(e: Event) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          stepsState.updateStepField(step.id, "displayVariantsAsIndividualProducts", checked);
                          stepsState.updateStepField(step.id, "displayVariantsAsIndividual", checked);
                          markAsDirty();
                        }}
                      />
                    </div>

                    {/* ── Rules Configuration card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <div className={fullPageBundleStyles.cardHeader}>
                        <div>
                          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Rules Configuration</h3>
                          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                            Apply rules to the entire step or to specific categories to guide your customer's selections.
                          </p>
                        </div>
                        <RichHelpTooltip
                          label="Learn More"
                          tooltipKey="rulesConfiguration"
                        />
                      </div>
                      {(() => {
                        const filters = ((step as any).filters as { label: string; collectionHandle: string }[] || []);
                        const ruleCount = (conditionsState.stepConditions[step.id] || []).length;
                        const activeRuleMode = ruleCount === 0 ? "none" : filters.length > 0 ? "category" : "step";
                        const handleRuleModeChange = (nextMode: string) => {
                          if (nextMode === "none") {
                            conditionsState.clearStepConditions(step.id);
                            return;
                          }
                          if (nextMode === "category" && (selectedCollections[step.id] || step.collections || []).length === 0) {
                            shopify.toast.show("Add collections before using category rules.", { isError: true });
                            return;
                          }
                          if ((conditionsState.stepConditions[step.id] || []).length === 0) {
                            conditionsState.addConditionRule(step.id);
                          }
                        };

                        return (
                          <s-choice-list
                            label="Rule mode"
                            labelAccessibilityVisibility="exclusive"
                            values={[activeRuleMode]}
                            onChange={(e: Event) => {
                              const nextMode = ((e.currentTarget as any).values as string[] | undefined)?.[0];
                              if (nextMode) handleRuleModeChange(nextMode);
                            }}
                          >
                            <s-choice value="none" selected={activeRuleMode === "none" || undefined}>No rules</s-choice>
                            <s-choice value="step" selected={activeRuleMode === "step" || undefined}>Step rules</s-choice>
                            <s-choice value="category" selected={activeRuleMode === "category" || undefined}>Category rules</s-choice>
                          </s-choice-list>
                        );
                      })()}
                      {(conditionsState.stepConditions[step.id] || []).length === 0 ? (
                        <div className={fullPageBundleStyles.emptyState}>No rules defined yet</div>
                      ) : (
                        <div className={fullPageBundleStyles.rulesList}>
                          {(conditionsState.stepConditions[step.id] || []).map((rule: any, ruleIndex: number) => (
                            <div key={rule.id} className={fullPageBundleStyles.ebRuleCard}>
                              <div className={fullPageBundleStyles.ebRuleHeader}>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Rule #{ruleIndex + 1}</h4>
                                <s-button
                                  variant="plain"
                                  onClick={() => conditionsState.removeConditionRule(step.id, rule.id)}
                                >
                                  Remove
                                </s-button>
                              </div>
                              <div className={fullPageBundleStyles.ebRuleFields}>
                                <s-select
                                  value={rule.type}
                                  onChange={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'type', (e.target as HTMLSelectElement).value)}
                                >
                                  <option value="" disabled>Type</option>
                                  {[...STEP_CONDITION_TYPE_OPTIONS].map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </s-select>
                                <s-select
                                  value={rule.operator}
                                  onChange={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'operator', (e.target as HTMLSelectElement).value)}
                                >
                                  <option value="" disabled>Operator</option>
                                  {[...STEP_CONDITION_OPERATOR_OPTIONS].map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </s-select>
                                <s-text-field
                                  label="Value"
                                  value={rule.value}
                                  onInput={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'value', (e.target as HTMLInputElement).value)}
                                  autoComplete="off"
                                  type="number"
                                  min="0"
                                />
                              </div>
                              <s-checkbox
                                label="Auto Next When rule is met"
                                checked={rule.autoNext === true || rule.autoNext === "true" || undefined}
                                onChange={(e: Event) => {
                                  conditionsState.updateConditionRule(step.id, rule.id, "autoNext", (e.target as HTMLInputElement).checked ? "true" : "false");
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={fullPageBundleStyles.addRuleWrap}>
                        <s-button
                          variant="secondary"
                          icon="plus"
                          onClick={() => {
                            if ((conditionsState.stepConditions[step.id] || []).length >= 2) {
                              shopify.toast.show('A step can have at most 2 rules', { isError: false });
                              return;
                            }
                            conditionsState.addConditionRule(step.id);
                          }}
                        >
                          + Add Rule
                        </s-button>
                      </div>
                    </div>

                    {/* ── Step Config card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Step Config</h3>
                      <div className={fullPageBundleStyles.stepConfigRow}>
                        <div className={fullPageBundleStyles.iconColumn}>
                          <div className={fullPageBundleStyles.iconBox}>
                            {(step as any).timelineIconUrl ? (
                              <img
                                src={(step as any).timelineIconUrl}
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
                            variant="secondary"
                            icon="upload"
                            onClick={() => setShowIconPickerForStep(prev => prev === step.id ? null : step.id)}
                          >
                            {showIconPickerForStep === step.id ? "Close picker" : "Replace"}
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
              const step = stepsState.steps[activeTabIndex] || stepsState.steps[0];
              if (!step) return null;
              const addonMessages = ruleMessages[`addons-${step.id}`] || {
                discountText: "",
                successMessage: "",
              };

              return (
                <div data-tour-target="fpb-free-gift-addons">
                  <s-stack direction="block" gap="base">
                    <div className={fullPageBundleStyles.card}>
                      <div className={fullPageBundleStyles.ebPanelHeader}>
                        <h3 className={fullPageBundleStyles.ebPanelTitle}>Add-Ons and Gifting Step</h3>
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
                      <div style={{ marginTop: 16 }} className={fullPageBundleStyles.ebMediaFieldGrid}>
                        <div className={fullPageBundleStyles.iconColumn}>
                          <div className={fullPageBundleStyles.iconBox}>
                            {step.addonIconUrl ? (
                              <img src={step.addonIconUrl} alt="Add-ons step icon" className={fullPageBundleStyles.iconImg} />
                            ) : (
                              <div className={fullPageBundleStyles.iconPlaceholder}>Upload file</div>
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
                            label="Step Title"
                            value={step.addonTitle ?? ""}
                            onInput={(e: Event) => {
                              stepsState.updateStepField(step.id, "addonTitle", (e.target as HTMLInputElement).value);
                              markAsDirty();
                            }}
                            autoComplete="off"
                          />
                        </s-stack>
                      </div>
                    </div>

                    <div className={fullPageBundleStyles.card}>
                      <div className={fullPageBundleStyles.ebPanelHeader}>
                        <div>
                          <h3 className={fullPageBundleStyles.ebPanelTitle}>Add-Ons with Bundles</h3>
                          <p className={fullPageBundleStyles.ebPanelDescription}>
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
                        <div className={fullPageBundleStyles.ebRuleCard}>
                          <div className={fullPageBundleStyles.ebRuleHeader}>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Tier 1</h4>
                            <s-button
                              variant="plain"
                              onClick={() => {
                                stepsState.updateStepField(step.id, "addonDisplayFree", false);
                                markAsDirty();
                              }}
                            >
                              Delete
                            </s-button>
                          </div>
                          <s-checkbox
                            label="Display products as free ($0.00)"
                            checked={step.addonDisplayFree !== false || undefined}
                            onChange={(e: Event) => {
                              stepsState.updateStepField(step.id, "addonDisplayFree", (e.target as HTMLInputElement).checked);
                              markAsDirty();
                            }}
                          />
                        </div>
                        <s-button variant="secondary" icon="plus">
                          Add Add Ons Tier
                        </s-button>
                      </s-stack>
                    </div>

                    <div className={fullPageBundleStyles.card}>
                      <div className={fullPageBundleStyles.ebPanelHeader}>
                        <h3 className={fullPageBundleStyles.ebPanelTitle}>Footer Messaging</h3>
                        <s-stack direction="inline" gap="small-100">
                          <s-button variant="secondary" onClick={() => setTemplateVariablesModalOpen(true)}>
                            Show Variables
                          </s-button>
                          <s-button variant="secondary" icon="globe">
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
                        <s-divider />
                        <s-stack direction="inline" gap="small-100">
                          <s-button variant="secondary" icon="duplicate" onClick={() => cloneStep(step.id)}>
                            Clone Step
                          </s-button>
                          {stepsState.steps.length > 1 && (
                            <s-button variant="plain" onClick={() => deleteStep(step.id)}>
                              Delete Step
                            </s-button>
                          )}
                        </s-stack>
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
                        pricingState.setDiscountType((e.target as HTMLSelectElement).value as DiscountMethod);
                        pricingState.setDiscountRules([]);
                        setRuleMessages({});
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
                        <s-section key={rule.id}>
                          <s-stack direction="block" gap="small">
                            <s-stack direction="inline">
                              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, flex: 1 }}>
                                Rule #{index + 1}
                              </h4>
                              <s-button
                                variant="plain"
                                onClick={() => pricingState.removeDiscountRule(rule.id)}
                              >
                                Remove
                              </s-button>
                            </s-stack>

                            <s-stack direction="block" gap="small-100">
                              <s-stack direction="inline" gap="small-100">
                                <s-select
                                  label="Discount on"
                                  value={rule.condition.type}
                                  onChange={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                    condition: { ...rule.condition, type: (e.target as HTMLSelectElement).value as any }
                                  })}
                                >
                                  {[...DISCOUNT_CONDITION_TYPE_OPTIONS].map(opt => (
                                    <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                  ))}
                                </s-select>
                                <s-select
                                  label="Condition"
                                  value={rule.condition.operator}
                                  onChange={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                    condition: { ...rule.condition, operator: (e.target as HTMLSelectElement).value as any }
                                  })}
                                >
                                  {[...DISCOUNT_OPERATOR_OPTIONS].map(opt => (
                                    <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                  ))}
                                </s-select>
                                <s-number-field
                                  label={rule.condition.operator === ConditionOperator.GTE ? "is greater than or equal to" : "Value"}
                                  value={String(rule.condition.type === ConditionType.AMOUNT ? centsToAmount(rule.condition.value) : rule.condition.value)}
                                  onInput={(e: Event) => {
                                    const numValue = Number((e.target as HTMLInputElement).value) || 0;
                                    const finalValue = rule.condition.type === ConditionType.AMOUNT ? amountToCents(numValue) : numValue;
                                    pricingState.updateDiscountRule(rule.id, {
                                      condition: { ...rule.condition, value: finalValue }
                                    });
                                  }}
                                  min="0"
                                  helpText={rule.condition.type === ConditionType.AMOUNT ? "Amount in shop's currency" : undefined}
                                />
                                <s-number-field
                                  label={
                                    rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? "Percentage Off" :
                                      rule.discount.method === DiscountMethod.FIXED_AMOUNT_OFF ? "Fixed Amount Off" :
                                        "Fixed Bundle Price"
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
                                  min="0"
                                  suffix={rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? "%" : undefined}
                                  helpText={rule.discount.method !== DiscountMethod.PERCENTAGE_OFF ? "Amount in shop's currency" : undefined}
                                />
                              </s-stack>
                            </s-stack>
                          </s-stack>
                        </s-section>
                      ))}

                      {pricingState.discountRules.length < 4 ? (
                        <s-button
                          variant="tertiary"
                          onClick={pricingState.addDiscountRule}
                        >
                          <s-icon name="plus-minor" />
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
                <div style={{ opacity: pricingState.discountEnabled ? 1 : 0.45, pointerEvents: pricingState.discountEnabled ? 'auto' : 'none' }}>
                  <s-stack direction="block" gap="small">
                    <s-stack direction="block" gap="small-400">
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Discount Display Options</h4>
                      <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                        Choose how discounts are displayed
                      </p>
                    </s-stack>
                    <div className={fullPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center">
                        <div className={fullPageBundleStyles.displayOptionText}>
                          <p className={fullPageBundleStyles.displayOptionTitle}>Bundle Quantity Options</p>
                          <p className={fullPageBundleStyles.displayOptionDescription}>
                            Configure this section to enable quantity options.
                          </p>
                        </div>
                        <RichHelpTooltip
                          tooltipKey="bundleQuantityOptions"
                          icon="info"
                        />
                        <s-checkbox
                          checked={pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled || undefined}
                          onChange={(e: Event) => pricingState.setBundleQuantityOptionsEnabled((e.target as HTMLInputElement).checked)}
                        />
                      </s-stack>
                      {pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled && (
                        <div className={fullPageBundleStyles.nestedDisplayOptions}>
                        <s-stack direction="block" gap="small">
                          <s-button variant="secondary" icon="globe">
                            Multi Language
                          </s-button>
                          <p className={fullPageBundleStyles.optionNote}>
                            <strong>Note:</strong> Bundle Quantity Options can only be enabled when discount rules are based on quantity.
                          </p>
                          {normalizedPricingDisplayOptions.bundleQuantityOptions.options.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                              Add quantity-based discount rules to configure bundle quantity options.
                            </p>
                          ) : normalizedPricingDisplayOptions.bundleQuantityOptions.options.map((option, index) => (
                            <s-section key={option.ruleId}>
                              <s-stack direction="block" gap="small-100">
                                <s-stack direction="inline" gap="small" alignItems="center">
                                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 600, flex: 1 }}>
                                    Rule #{index + 1}
                                  </h5>
                                  <s-button
                                    variant={option.isDefault ? "primary" : "secondary"}
                                    aria-pressed={option.isDefault ? "true" : "false"}
                                    onClick={() => pricingState.setBundleQuantityDefaultRule(option.ruleId)}
                                  >
                                    Make this rule default
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
                    <div className={fullPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center">
                        <div className={fullPageBundleStyles.displayOptionText}>
                          <p className={fullPageBundleStyles.displayOptionTitle}>Progress Bar</p>
                          <p className={fullPageBundleStyles.displayOptionDescription}>
                            Edit the progress bar content and settings.
                          </p>
                        </div>
                        <RichHelpTooltip
                          tooltipKey="discountProgressBar"
                          icon="info"
                        />
                        <s-checkbox
                          checked={pricingState.showDiscountProgressBar || undefined}
                          onChange={(e: Event) => pricingState.setShowDiscountProgressBar((e.target as HTMLInputElement).checked)}
                        />
                      </s-stack>
                    {pricingState.showDiscountProgressBar && (
                      <div className={fullPageBundleStyles.nestedDisplayOptions}>
                      <s-stack direction="block" gap="small">
                        <s-button variant="secondary" icon="globe" disabled>
                          Multi Language
                        </s-button>
                        <div className={fullPageBundleStyles.modeOptions}>
                          <label className={fullPageBundleStyles.modeOption}>
                            <input
                              type="radio"
                              checked={pricingState.pricingDisplayOptions.progressBar.type === "simple"}
                              onChange={() => pricingState.setProgressBarType("simple")}
                            />
                            Simple Bar
                          </label>
                          <label className={fullPageBundleStyles.modeOption}>
                            <input
                              type="radio"
                              checked={pricingState.pricingDisplayOptions.progressBar.type === "step_based"}
                              onChange={() => pricingState.setProgressBarType("step_based")}
                            />
                            Step Based Bar
                          </label>
                        </div>
                        <s-stack direction="inline" gap="small">
                          <s-text-area
                            label="Progress Text"
                            value={pricingState.pricingDisplayOptions.progressBar.progressText || DEFAULT_PROGRESS_BAR_PROGRESS_TEXT}
                            onInput={(e: Event) => pricingState.updateProgressBarOptions({
                              progressText: (e.target as HTMLTextAreaElement).value,
                            })}
                            autoComplete="off"
                            helpText="Message shown before the shopper qualifies for the next discount."
                          />
                          <s-text-area
                            label="Success Text"
                            value={pricingState.pricingDisplayOptions.progressBar.successText || DEFAULT_PROGRESS_BAR_SUCCESS_TEXT}
                            onInput={(e: Event) => pricingState.updateProgressBarOptions({
                              successText: (e.target as HTMLTextAreaElement).value,
                            })}
                            autoComplete="off"
                            helpText="Message shown after the shopper qualifies for the discount."
                          />
                        </s-stack>
                        <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                          {normalizedPricingDisplayOptions.progressBar.milestones.length} discount milestones available from current rules.
                        </p>
                      </s-stack>
                      </div>
                    )}
                    </div>
                    <div className={fullPageBundleStyles.displayOptionRow}>
                      <s-stack direction="inline" gap="small" alignItems="center">
                        <div className={fullPageBundleStyles.displayOptionText}>
                          <p className={fullPageBundleStyles.displayOptionTitle}>Discount Messaging</p>
                          <p className={fullPageBundleStyles.displayOptionDescription}>
                            Edit how discount messages appear above the subtotal.
                          </p>
                        </div>
                        <RichHelpTooltip
                          tooltipKey="discountMessaging"
                          icon="info"
                        />
                        <s-checkbox
                          checked={pricingState.discountMessagingEnabled || undefined}
                          onChange={(e: Event) => pricingState.setDiscountMessagingEnabled((e.target as HTMLInputElement).checked)}
                        />
                      </s-stack>
                    {pricingState.discountMessagingEnabled && (
                      <div className={fullPageBundleStyles.nestedDisplayOptions}>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <s-checkbox
                            label="Enable multi-language"
                            checked={false}
                            disabled
                          />
                          <s-button
                            variant="tertiary"
                            icon="info"
                            commandFor="template-variables-modal"
                            command="--show"
                            onClick={() => showPolarisModal(templateVariablesModalRef)}
                          >
                            Show Variables
                          </s-button>
                        </s-stack>

                        {(Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).length > 0 ? (
                          <s-stack direction="block" gap="small">
                            {(Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).map((rule: any, index: number) => (
                              <s-section key={rule.id}>
                                <s-stack direction="block" gap="small">
                                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                                    Rule #{index + 1} Messages
                                  </h5>
                                  <s-text-area
                                    label="Discount Text"
                                    value={normalizedRuleMessages[rule.id]?.discountText || DEFAULT_DISCOUNT_RULE_TEXT}
                                    onInput={(e: Event) => updateRuleMessage(rule.id, "discountText", (e.target as HTMLTextAreaElement).value)}
                                    autoComplete="off"
                                    helpText="This message appears when the customer is close to qualifying for the discount."
                                  />
                                  <s-text-area
                                    label="Success Message"
                                    value={normalizedRuleMessages[rule.id]?.successMessage || DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE}
                                    onInput={(e: Event) => updateRuleMessage(rule.id, "successMessage", (e.target as HTMLTextAreaElement).value)}
                                    autoComplete="off"
                                    helpText="This message appears when the customer qualifies for the discount."
                                  />
                                </s-stack>
                              </s-section>
                            ))}
                          </s-stack>
                        ) : (
                          <s-section>
                            <s-stack direction="block" gap="small-100">
                              <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>
                                Add discount rules to configure messaging.
                              </p>
                            </s-stack>
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

                <s-section>
                  <s-stack direction="block" gap="base">
                    <s-stack direction="block" gap="small-400">
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Publishing Best Practices</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                        Pick a placement and follow the quick guide to make your bundle discoverable on your store.
                      </p>
                    </s-stack>
                    <div className={fullPageBundleStyles.visibilityGuideGrid}>
                      {[
                        ["Hero Banner", "Add a button to your homepage hero to drive shoppers directly to your bundle."],
                        ["Navigation Menu", "Add your bundle as a nav link so shoppers can find it from anywhere on your store."],
                        ["Announcement Banner", "Show your offer in the announcement bar so visitors see it instantly."],
                        ["Featured Product Card", "Feature your bundle product on your homepage so shoppers find it right away."],
                      ].map(([title, description]) => (
                        <div key={title} className={fullPageBundleStyles.visibilityGuideCard}>
                          <div className={fullPageBundleStyles.visibilityGuideMedia}>
                            <s-icon name="image-alt" />
                          </div>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{title}</h4>
                          <p style={{ margin: 0, fontSize: 12, color: "#6d7175", lineHeight: 1.35 }}>{description}</p>
                          <s-button variant="secondary" onClick={handlePlaceWidget}>Quick Setup Guide</s-button>
                          <span className={fullPageBundleStyles.visibilitySetupTime}>5 min setup</span>
                        </div>
                      ))}
                    </div>
                  </s-stack>
                </s-section>

                {/* Storefront Page — moved here from sidebar */}
                {bundle.bundleType === 'full_page' && (
                  <s-section>
                    <s-stack direction="block" gap="small">
                      <s-stack direction="inline" gap="small">
                        <s-icon name="globe" />
                        <s-stack direction="block" gap="small-400" style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Your Bundle Link</h3>
                          <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                            Use this link to place your bundle anywhere - theme components, emails, ads, or social bios.
                          </p>
                        </s-stack>
                      </s-stack>
                      <s-stack direction="inline" gap="small">
                        <s-text-field
                          label="Bundle link"
                          value={pageUrlPreview}
                          disabled
                          autoComplete="off"
                        />
                        <s-button
                          variant="secondary"
                          onClick={() => {
                            void navigator.clipboard?.writeText(pageUrlPreview);
                            shopify.toast.show("Bundle link copied", { isError: false });
                          }}
                        >
                          Copy Link
                        </s-button>
                        {bundle.shopifyPageHandle && (
                          <s-button
                            variant="plain"
                            onClick={() => window.open(`https://${shopDomain}.myshopify.com/pages/${originalPageSlugRef.current}`, '_blank')}
                          >
                            View on Storefront
                          </s-button>
                        )}
                      </s-stack>
                      <s-text-field
                        label="Page URL slug"
                        value={pageSlug}
                        onInput={(e: Event) => {
                          setPageSlug((e.target as HTMLInputElement).value);
                          setHasManuallyEditedSlug(true);
                          if (bundle.shopifyPageId) markAsDirty();
                        }}
                        onBlur={() => setPageSlug(slugify(pageSlug))}
                        helpText="Rename the page slug here. Changes take effect on save."
                        error={pageSlugError ?? undefined}
                        autoComplete="off"
                      />
                    </s-stack>
                  </s-section>
                )}

                <s-section>
                  <s-stack direction="inline" gap="base" alignItems="center">
                    <s-stack direction="block" gap="small-400" style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Want more placement options?</h3>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Bundle Widget</h4>
                      <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                        Add a bundle button to specific product pages.
                      </p>
                    </s-stack>
                    <s-button variant="primary" onClick={handlePlaceWidget}>Set up Bundle Widget</s-button>
                  </s-stack>
                </s-section>

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
              const defaultStepCount = stepsState.steps.filter((step) => step.isDefault).length;

              return (
                <div data-tour-target="fpb-bundle-settings">
                  <s-stack direction="block" gap="base">
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Pre Selected Product</h3>
                          {settingsStep && (
                            <s-checkbox
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
                          Choose products that should be added to bundle by default.
                        </p>
                        {defaultStepCount > 0 && (
                          <s-banner tone="info">
                            Tip: Discounts are calculated based in the products in cart, make sure to add the &quot;Default Product&quot; quantity or amount while configuring discounts.
                          </s-banner>
                        )}
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                          These products will be added to the shopper's bundle automatically on the first step.
                        </p>
                        <s-stack direction="inline" gap="small" alignItems="center">
                          <s-button variant="primary" onClick={() => handleSectionChange("step_setup")}>
                            Browse Products
                          </s-button>
                          <s-badge tone={defaultStepCount > 0 ? "success" : "info"}>
                            {defaultStepCount > 0 ? `${defaultStepCount} configured` : "Not set"}
                          </s-badge>
                        </s-stack>
                      </s-stack>
                    </s-section>

                    <s-section>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Enable Quantity Validation</h3>
                          <s-badge tone="success">Enabled</s-badge>
                        </s-stack>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                          Maximum allowed quantity per product is controlled by the active step's product slots.
                        </p>
                        {settingsStep && (
                          <s-stack direction="block" gap="small-400">
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Product Slots</h4>
                            <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                              This feature displays empty slots on the storefront. Active step: {settingsStep.name || `Step ${activeTabIndex + 1}`}.
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
                      </s-stack>
                    </s-section>

                    <s-section>
                      <s-stack direction="block" gap="small">
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Slot Icon</h3>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                          You can change the default icon that renders in the empty slots.
                        </p>
                        <s-stack direction="inline" gap="small">
                          <s-button variant="primary" icon="upload" onClick={() => handleSectionChange("step_setup")}>
                            Change Icon
                          </s-button>
                          <s-button variant="secondary" onClick={() => handleSectionChange("step_setup")}>
                            Reset
                          </s-button>
                        </s-stack>
                        <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                          Note: Only applicable when rules are based on quantity.
                        </p>
                      </s-stack>
                    </s-section>

                    <s-section>
                      <s-stack direction="block" gap="small">
                        <SettingsRow
                          title="Variant Selector"
                          description="Enable variant selection within the product cards instead of the quick look."
                        >
                          {settingsStep && (
                            <s-switch
                              accessibilityLabel="Variant selector"
                              checked={settingsStep.displayVariantsAsIndividualProducts || settingsStep.displayVariantsAsIndividual || undefined}
                              onChange={(e: Event) => {
                                const checked = (e.target as HTMLInputElement).checked;
                                stepsState.updateStepField(settingsStep.id, "displayVariantsAsIndividualProducts", checked);
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
                        </SettingsRow>
                      </s-stack>
                    </s-section>

                    <s-section>
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" alignItems="center" gap="small">
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Bundle Cart</h3>
                          <s-button variant="secondary" onClick={() => handleSectionChange("messages")}>
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

                    <s-section>
                      <s-stack direction="block" gap="small">
                        <SettingsRow
                          title="Cart line item discount display"
                          description="Shows how much the customer is saving on the bundle in cart."
                        >
                          <s-button variant="secondary" onClick={() => handleSectionChange("discount_pricing")}>
                            Edit Defaults
                          </s-button>
                        </SettingsRow>
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
                        <SettingsRow
                          title="Bundle Banner"
                          description="Upload banner images for desktop and mobile views from Bundle Visibility."
                        >
                          <s-button variant="secondary" onClick={() => handleSectionChange("bundle_visibility")}>
                            Manage Banner
                          </s-button>
                        </SettingsRow>
                        <SettingsRow
                          title="Bundle Level CSS"
                          description="Advanced styling is controlled from the design panel."
                        >
                          <s-badge tone="info">Design panel</s-badge>
                        </SettingsRow>
                      </s-stack>
                    </s-section>

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

            {activeSection === "messages" && (() => {
              const setMessageOverride = (key: string, value: string) => {
                setTextOverrides((prev) => ({ ...prev, [key]: value }));
                markAsDirty();
              };
              const isGiftMessageEnabled = textOverrides.giftMessageEnabled === "true";
              const hasSenderRecipientFields = textOverrides.giftMessageSenderRecipientEnabled === "true";
              const isGiftMessageRequired = textOverrides.giftMessageRequired === "true";
              const hasMessageLimit = textOverrides.giftMessageLimitEnabled === "true";

              return (
                <s-stack direction="block" gap="base">
                  <div className={fullPageBundleStyles.card}>
                    <div className={fullPageBundleStyles.ebPanelHeader}>
                      <div>
                        <h3 className={fullPageBundleStyles.ebPanelTitle}>Enable Messages</h3>
                        <p className={fullPageBundleStyles.ebPanelDescription}>
                          Message will show up as a product at checkout
                        </p>
                      </div>
                      <s-checkbox
                        accessibilityLabel="Enable messages"
                        checked={isGiftMessageEnabled || undefined}
                        onChange={(e: Event) => setMessageOverride("giftMessageEnabled", (e.target as HTMLInputElement).checked ? "true" : "false")}
                      />
                    </div>

                    <div style={{ marginTop: 16 }} className={fullPageBundleStyles.ebMessagePreview}>
                      <div className={fullPageBundleStyles.ebMessagePreviewIcon} aria-hidden="true">
                        <s-icon type="note" />
                      </div>
                      <div>
                        <p className={fullPageBundleStyles.ebMessagePreviewTitle}>
                          {textOverrides.giftMessageProductTitle || "Message"}
                        </p>
                        <p className={fullPageBundleStyles.ebMessageNote}>
                          Add a message product so shoppers can include a note with the bundle.
                        </p>
                      </div>
                      <s-button variant="secondary">
                        Edit
                      </s-button>
                    </div>

                    <s-stack direction="block" gap="small" style={{ marginTop: 16 }}>
                      <s-checkbox
                        label="Enable Sender and Recipient Fields"
                        checked={hasSenderRecipientFields || undefined}
                        onChange={(e: Event) => setMessageOverride("giftMessageSenderRecipientEnabled", (e.target as HTMLInputElement).checked ? "true" : "false")}
                      />
                      <s-checkbox
                        label="Make Gift Message mandatory"
                        checked={isGiftMessageRequired || undefined}
                        onChange={(e: Event) => setMessageOverride("giftMessageRequired", (e.target as HTMLInputElement).checked ? "true" : "false")}
                      />
                      <s-checkbox
                        label="Enable Message Limit (Characters)"
                        checked={hasMessageLimit || undefined}
                        onChange={(e: Event) => setMessageOverride("giftMessageLimitEnabled", (e.target as HTMLInputElement).checked ? "true" : "false")}
                      />
                      <s-number-field
                        label="Enter Message Limit"
                        value={textOverrides.giftMessageLimit ?? ""}
                        disabled={!hasMessageLimit}
                        min={0}
                        onInput={(e: Event) => setMessageOverride("giftMessageLimit", (e.target as HTMLInputElement).value)}
                      />
                    </s-stack>
                  </div>
                </s-stack>
              );
            })()}
          </div>
        </div>
      </form>

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
                  const productUrl = productId
                    ? `https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${productId}`
                    : undefined;
                  return (
                    <li key={product.id || index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f2f3" }}>
                      <s-stack direction="inline" gap="small">
                        <img src={product.imageUrl || product.image?.url || "/bundle.png"} alt={product.title || 'Product'} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                        <s-stack direction="block" gap="small-400">
                          <s-button variant="plain" disabled={!productUrl || undefined} onClick={() => productUrl && open(productUrl, '_blank')}>
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

      <BundleReadinessOverlay
        items={readinessItems}
        bundleId={bundle.id}
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
      />

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

      </div>
    </>
  );
}
