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
  BUNDLE_STATUS_OPTIONS,
  STEP_CONDITION_TYPE_OPTIONS,
  STEP_CONDITION_OPERATOR_OPTIONS,
  DISCOUNT_METHOD_OPTIONS,
  DISCOUNT_CONDITION_TYPE_OPTIONS,
  DISCOUNT_OPERATOR_OPTIONS,
} from "../../../constants/bundle";
import { ERROR_MESSAGES } from "../../../constants/errors";
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
} from "./handlers";

// Types - extracted to separate module for better organization
import type {
  LoaderData,
  BundleStatusSectionProps,
  BundleProductCardProps,
} from "./types";
import type { BundleStatus } from "../../../constants/bundle";
import { checkAppEmbedEnabled } from "../../../services/theme/app-embed-check.server";
import { AppEmbedBanner } from "../../../components/AppEmbedBanner";
import { BundleReadinessOverlay, type BundleReadinessItem } from "../../../components/bundle-configure/BundleReadinessOverlay";

declare global {
  interface Window {
    shopify?: { config?: { shop?: string } };
  }
}

function showPolarisModal(ref: { current: any }) {
  const modal = ref.current as any;
  modal?.showOverlay?.();
  if (!modal?.showOverlay) modal?.show?.();
}

function hidePolarisModal(ref: { current: any }) {
  const modal = ref.current as any;
  modal?.hideOverlay?.();
  if (!modal?.hideOverlay) modal?.hide?.();
}

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

  // CRITICAL: Use app's API key (client_id from shopify.app.toml), NOT extension UUID
  // Per Shopify docs: addAppBlockId={api_key}/{handle}
  // Reference: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
  const apiKey = process.env.SHOPIFY_API_KEY || '';
  // Block handle must match the liquid filename (without .liquid extension)
  // File: extensions/bundle-builder/blocks/bundle-product-page.liquid
  const blockHandle = 'bundle-product-page';

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

  const embedCheck = await checkAppEmbedEnabled(admin, session.shop);
  const themeEditorUrl = embedCheck.themeId
    ? `https://${session.shop}/admin/themes/${embedCheck.themeId.split("/").pop()}/editor?context=apps&appEmbed=${apiKey}%2Fbundle-full-page-embed`
    : null;

  return json({
    bundle,
    bundleProduct,
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
      case "validateWidgetPlacement":
        return await handleValidateWidgetPlacement(admin, session, bundleId);
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

// Handler functions have been extracted to ./app.bundles.product-page-bundle.configure.$bundleId/handlers/

// Static navigation items - moved outside component to prevent recreation on every render
const bundleSetupItems = [
  { id: "step_setup",       label: "Step Setup",         iconType: "note"   },
  { id: "discount_pricing", label: "Discount & Pricing", iconType: "filter" },
  { id: "bundle_settings",  label: "Bundle Settings",    iconType: "edit"   },
];

const stepSetupChildItems = [
  { id: "free_gift_addons", label: "Free Gift & Add Ons" },
  { id: "messages",         label: "Messages"            },
];

// Static status options - imported from centralized constants
const statusOptions = [...BUNDLE_STATUS_OPTIONS];

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

// Memoized Bundle Status section to prevent unnecessary re-renders
const BundleStatusSection = memo(({ status, onChange }: BundleStatusSectionProps) => {
  const selectRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selectRef.current) {
      (selectRef.current as any).value = status;
    }
  }, [status]);
  return (
    <s-stack direction="block" gap="small-100">
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
        Bundle Status
      </h3>
      <s-select
        ref={selectRef}
        label="Bundle Status"
        onChange={(e: Event) => onChange((e.target as HTMLSelectElement).value as BundleStatus)}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </s-select>
    </s-stack>
  );
});

BundleStatusSection.displayName = 'BundleStatusSection';

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

  // Bundle Visibility — Bundle Widget state (FR-04)
  const [upsellWidgetEnabled, setUpsellWidgetEnabled] = useState<boolean>((bundle as any).upsellWidgetEnabled ?? false);
  const [upsellWidgetDisplayMode, setUpsellWidgetDisplayMode] = useState<string>((bundle as any).upsellWidgetDisplayMode ?? "block");
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

  // Sync Bundle modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeAssetTabIndex, setActiveAssetTabIndex] = useState(0);
  const [readinessOpen, setReadinessOpen] = useState(false);

  // Add-Ons icon picker state
  const [showIconPickerForStep, setShowIconPickerForStep] = useState<string | null>(null);

  // Category accordion state (multi-category system — EB parity)
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({});
  const [categoryActiveTabs, setCategoryActiveTabs] = useState<Record<string, number>>({});
  const [draggedCatKey, setDraggedCatKey] = useState<string | null>(null);
  const [dragOverCatKey, setDragOverCatKey] = useState<string | null>(null);

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
    const embedLink = `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/bundle-product-page-embed`;
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
      { key: "embed",          label: "App embed enabled",           description: "Required to display bundles on your storefront.",          points: 15, done: appEmbedEnabled },
      { key: "products",       label: "Products added to a step",    description: "Add at least one product to a bundle step.",               points: 20, done: hasProducts },
      { key: "discount",       label: "Discount configured",         description: "Set a discount to give customers a reason to bundle.",     points: 15, done: pricingState.discountEnabled },
      { key: "widget",         label: "Widget placed on product page",description: "Place the bundle widget on your product page template.",   points: 25, done: widgetPlaced },
      { key: "product_active", label: "Parent product active",       description: "Your parent product must be active to accept orders.",     points: 15, done: parentProductActive },
    ];
  }, [
    appEmbedEnabled,
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

  const navigateToStep = useCallback((idx: number) => {
    if (idx === activeTabIndex) return;
    setSlideDir(idx > activeTabIndex ? "forward" : "backward");
    setSlideKey(prev => prev + 1);
    setActiveTabIndex(idx);
  }, [activeTabIndex, setActiveTabIndex]);

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

  // Category drag-and-drop handlers (multi-category system)
  const handleCatDragStart = useCallback((e: React.DragEvent, stepId: string, catKey: string) => {
    setDraggedCatKey(catKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", catKey);
    const accordion = (e.currentTarget as HTMLElement).closest('[data-cat-key]') as HTMLElement | null;
    if (accordion) accordion.style.opacity = "0.5";
  }, []);

  const handleCatDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedCatKey(null);
    setDragOverCatKey(null);
    const accordion = (e.currentTarget as HTMLElement).closest('[data-cat-key]') as HTMLElement | null;
    if (accordion) accordion.style.opacity = "1";
  }, []);

  const handleCatDrop = useCallback((e: React.DragEvent, stepId: string, dropCatKey: string) => {
    e.preventDefault();
    const srcKey = draggedCatKey;
    setDraggedCatKey(null);
    setDragOverCatKey(null);
    if (!srcKey || srcKey === dropCatKey) return;
    const targetStep = stepsState.steps.find((s: any) => s.id === stepId);
    if (!targetStep) return;
    const cats = ((targetStep as any).StepCategory as any[]) ?? [];
    const srcIdx = cats.findIndex((_: any, i: number) => `${stepId}__${cats[i].id ?? i}` === srcKey);
    const dstIdx = cats.findIndex((_: any, i: number) => `${stepId}__${cats[i].id ?? i}` === dropCatKey);
    if (srcIdx === -1 || dstIdx === -1 || srcIdx === dstIdx) return;
    const reordered = [...cats];
    const [moved] = reordered.splice(srcIdx, 1);
    reordered.splice(dstIdx, 0, moved);
    stepsState.updateStepField(stepId, "StepCategory", reordered.map((c: any, i: number) => ({ ...c, sortOrder: i })));
    markAsDirty();
  }, [draggedCatKey, stepsState, markAsDirty]);


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

      const appBlockId = `${apiKey}/${blockHandle}`;


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
  }, [shop, shopify, bundle.id]);

  // Sync Bundle modal ref
  const syncModalRef = useRef<HTMLElement>(null);
  const pageSelectionModalRef = useRef<HTMLElement>(null);
  const productsModalRef = useRef<HTMLElement>(null);
  const collectionsModalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isSyncModalOpen) {
      (syncModalRef.current as any)?.show?.();
    } else {
      (syncModalRef.current as any)?.hide?.();
    }
  }, [isSyncModalOpen]);

  useEffect(() => {
    if (isPageSelectionModalOpen) {
      (pageSelectionModalRef.current as any)?.show?.();
    } else {
      (pageSelectionModalRef.current as any)?.hide?.();
    }
  }, [isPageSelectionModalOpen]);

  useEffect(() => {
    if (isProductsModalOpen) {
      (productsModalRef.current as any)?.show?.();
    } else {
      (productsModalRef.current as any)?.hide?.();
    }
  }, [isProductsModalOpen]);

  useEffect(() => {
    if (isCollectionsModalOpen) {
      (collectionsModalRef.current as any)?.show?.();
    } else {
      (collectionsModalRef.current as any)?.hide?.();
    }
  }, [isCollectionsModalOpen]);

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
                    <button
                      type="button"
                      className={productPageBundleStyles.ebLinkButton}
                      onClick={handleSyncProduct}
                    >
                      Sync Product
                    </button>
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
                    <s-badge tone={String(productStatus).toLowerCase() === "active" ? "success" : "warning"}>
                      {String(productStatus || "Unlisted").toLowerCase() === "active" ? "Active" : "Unlisted"}
                    </s-badge>
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
                      const isActive = activeSection === item.id || (item.id === "step_setup" && (activeSection === "free_gift_addons" || activeSection === "messages"));
                      let statusBadge: { label: string; tone?: string } | null = null;
                      if (item.id === "discount_pricing") {
                        statusBadge = pricingState.discountEnabled ? null : { label: "None" };
                      }
                      return (
                        <div key={item.id}>
                          <button
                            type="button"
                            className={`${productPageBundleStyles.setupNavItem} ${isActive ? productPageBundleStyles.setupNavItemActive : ""}`}
                            onClick={() => handleSectionChange(item.id)}
                          >
                            <span className={productPageBundleStyles.setupNavIcon} aria-hidden="true">
                              {item.iconType
                                ? <s-icon type={item.iconType as any} />
                                : (isActive ? "●" : "○")}
                            </span>
                            <span className={productPageBundleStyles.setupNavLabel}>{item.label}</span>
                            <span className={productPageBundleStyles.setupNavMeta}>
                              {statusBadge && !isActive && (
                                <s-badge tone={(statusBadge.tone as any) || "subdued"}>{statusBadge.label}</s-badge>
                              )}
                            </span>
                          </button>
                          {item.id === "step_setup" && (activeSection === "step_setup" || activeSection === "free_gift_addons" || activeSection === "messages") && (
                            <div className={productPageBundleStyles.ebSubNav}>
                              {stepSetupChildItems.map((child) => (
                                <button
                                  key={child.id}
                                  type="button"
                                  className={`${productPageBundleStyles.ebSubNavItem} ${activeSection === child.id ? productPageBundleStyles.ebSubNavItemActive : ""}`}
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
          <div className={productPageBundleStyles.mainColumn}>
            {activeSection === "step_setup" && (
              <div data-tour-target="ppb-product-selection">
                <div className={`${productPageBundleStyles.card} ${productPageBundleStyles.stepFlowCard}`}>
                  <s-stack direction="block" gap="small">
                    <div className={productPageBundleStyles.stepFlowTitleRow}>
                      <span className={productPageBundleStyles.headingWithHelp}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Step Flow</h3>
                        <s-button variant="plain" icon="info" accessibilityLabel="Step flow info" />
                      </span>
                      <button
                        type="button"
                        className={productPageBundleStyles.ebLinkButton}
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
                </div>

                {stepsState.steps.map((step, index) => activeTabIndex === index && (
                  <div
                    key={`${step.id}-${slideKey}`}
                    className={slideDir === "forward" ? productPageBundleStyles.slideForward : slideDir === "backward" ? productPageBundleStyles.slideBackward : ""}
                  >
                    <div className={productPageBundleStyles.card}>
                      <div className={productPageBundleStyles.cardHeader}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Step Setup</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <s-button
                            variant="plain"
                            icon="duplicate"
                            accessibilityLabel="Clone step"
                            onClick={() => cloneStep(step.id)}
                          />
                          {stepsState.steps.length > 1 && (
                            <s-button
                              variant="plain"
                              icon="delete"
                              accessibilityLabel="Delete step"
                              onClick={() => deleteStep(step.id)}
                            />
                          )}
                        </div>
                      </div>
                      <s-stack direction="block" gap="base">
                        {/* Step Name */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <s-text-field
                            label="Step Name"
                            value={step.name}
                            onInput={(e: Event) => stepsState.updateStepField(step.id, 'name', (e.target as HTMLInputElement).value)}
                            autoComplete="off"
                          />
                        </div>

                                {/* Legacy products migration banner — shown when step has StepProduct rows but no StepCategory yet */}
                                {step.StepProduct && step.StepProduct.length > 0 && (((step as any).StepCategory as any[] | undefined) ?? []).length === 0 && (
                                  <s-banner tone="warning">
                                    <p style={{ margin: 0, fontSize: 14 }}>
                                      <strong>Action needed:</strong> This step has {step.StepProduct.length} product{step.StepProduct.length !== 1 ? "s" : ""} from the previous system. Use <strong>+ Add Category</strong> below to re-add them to the new category system.
                                    </p>
                                  </s-banner>
                                )}

                                {/* ── Categories (multi-category accordion — EB parity) ── */}
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Categories</h3>
                                    <button
                                      type="button"
                                      className={productPageBundleStyles.ebLinkButton}
                                      onClick={() => window.open("https://wolfpackapps.com", "_blank")}
                                    >
                                      How to setup?
                                    </button>
                                  </div>
                                  <p style={{ margin: "0 0 12px", fontSize: 14, color: "#6d7175" }}>
                                    Add all product selections to a single category or separate them into multiple categories for easier bundling
                                  </p>

                                  {((step as any).StepCategory as any[] | undefined ?? []).map((cat: any, catIndex: number) => {
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
                                          onClick={() => setCategoryOpen(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
                                        >
                                          <span
                                            className={productPageBundleStyles.ebCategoryDrag}
                                            aria-hidden="true"
                                            draggable="true"
                                            onDragStart={(e: React.DragEvent) => { e.stopPropagation(); handleCatDragStart(e, step.id, catKey); }}
                                            onDragEnd={handleCatDragEnd}
                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                          >⠿</span>
                                          <span className={productPageBundleStyles.ebCategoryName}>
                                            {cat.name || `Category ${catIndex + 1}`}
                                          </span>
                                          <div
                                            className={productPageBundleStyles.ebCategoryActions}
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
                                                    {catProducts.length > 0 ? "Edit Products" : "Add Products"}
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
                                                    {catCollections.length > 0 ? "Edit Collections" : "Add Collections"}
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

                                  <s-button
                                    variant="plain"
                                    icon="plus"
                                    onClick={() => {
                                      const cats = ((step as any).StepCategory as any[]) ?? [];
                                      stepsState.updateStepField(step.id, "StepCategory", [
                                        ...cats,
                                        { id: `cat-${Date.now()}`, name: "", sortOrder: cats.length, products: [], collections: [] },
                                      ]);
                                      markAsDirty();
                                    }}
                                  >
                                    Add Category
                                  </s-button>
                                </div>

                                {/* ── Rules Configuration card ── */}
                                <div style={{ marginTop: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Rules Configuration</h3>
                                  </div>
                                  <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6d7175" }}>
                                    Apply rules to the entire step to guide your customer's selections.
                                  </p>
                                  {(() => {
                                    const ruleCount = (conditionsState.stepConditions[step.id] || []).length;
                                    const activeRuleMode = ruleCount === 0 ? "none" : "step";
                                    return (
                                      <s-choice-list
                                        label="Rule mode"
                                        labelAccessibilityVisibility="exclusive"
                                        values={[activeRuleMode]}
                                        onChange={(e: Event) => {
                                          const nextMode = ((e.currentTarget as any).values as string[] | undefined)?.[0];
                                          if (nextMode === "none") {
                                            conditionsState.clearStepConditions(step.id);
                                          } else if (nextMode === "step" && ruleCount === 0) {
                                            conditionsState.addConditionRule(step.id);
                                          }
                                        }}
                                      >
                                        <s-choice value="none" selected={activeRuleMode === "none" || undefined}>No rules</s-choice>
                                        <s-choice value="step" selected={activeRuleMode === "step" || undefined}>Step rules</s-choice>
                                      </s-choice-list>
                                    );
                                  })()}
                                  {(conditionsState.stepConditions[step.id] || []).length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                      {(conditionsState.stepConditions[step.id] || []).map((rule: any, ruleIndex: number) => (
                                        <div key={rule.id} style={{ border: "1px solid #e1e3e5", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                            <span style={{ fontSize: 14, fontWeight: 650 }}>Rule #{ruleIndex + 1}</span>
                                            <s-button
                                              variant="plain"
                                              tone="critical"
                                              onClick={() => conditionsState.removeConditionRule(step.id, rule.id)}
                                            >
                                              Remove
                                            </s-button>
                                          </div>
                                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                                            <s-select
                                              value={rule.type}
                                              onChange={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'type', (e.target as HTMLSelectElement).value)}
                                            >
                                              <s-option value="" disabled>Type</s-option>
                                              {[...STEP_CONDITION_TYPE_OPTIONS].map(opt => (
                                                <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                              ))}
                                            </s-select>
                                            <s-select
                                              value={rule.operator}
                                              onChange={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'operator', (e.target as HTMLSelectElement).value)}
                                            >
                                              <s-option value="" disabled>Operator</s-option>
                                              {[...STEP_CONDITION_OPERATOR_OPTIONS].map(opt => (
                                                <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                              ))}
                                            </s-select>
                                            <input
                                              type="number"
                                              min="0"
                                              placeholder="Value"
                                              style={{ padding: "6px 10px", border: "1px solid #c9cccf", borderRadius: 6, fontSize: 14, width: 90 }}
                                              value={rule.value ?? ""}
                                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => conditionsState.updateConditionRule(step.id, rule.id, 'value', e.target.value)}
                                              autoComplete="off"
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
                                  <div style={{ marginTop: 4 }}>
                                    <s-button
                                      variant="plain"
                                      icon="plus"
                                      onClick={() => {
                                        if ((conditionsState.stepConditions[step.id] || []).length >= 2) {
                                          shopify.toast.show('A step can have at most 2 rules', { isError: false });
                                          return;
                                        }
                                        conditionsState.addConditionRule(step.id);
                                      }}
                                    >
                                      Add Rule
                                    </s-button>
                                  </div>
                                </div>

                                {/* ── Category Filters ── */}
                                <s-stack direction="block" gap="small">
                                  <s-divider />
                                  <s-stack direction="block" gap="small-400">
                                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Category Filters</h3>
                                    <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                      Add filter tabs above the product grid so shoppers can browse by category.
                                      Each tab filters to products from a specific collection on this step.
                                    </p>
                                  </s-stack>
                                  {(!selectedCollections[step.id] || selectedCollections[step.id].length === 0) ? (
                                    <p style={{ fontSize: 14, color: "#6d7175", margin: 0 }}>
                                      Add collections to this step first to configure category filters.
                                    </p>
                                  ) : (
                                    <s-stack direction="block" gap="small">
                                      {((step as any).filters as { label: string; collectionHandle: string }[] || []).map(
                                        (filter, fi) => (
                                          <div key={fi} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                                            <s-text-field
                                              label="Tab label"
                                              placeholder="e.g. Shirts"
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
                                              {(selectedCollections[step.id] as { id: string; handle: string; title: string }[]).map(col => (
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
                                      <div>
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
                                          + Add Filter Tab
                                        </s-button>
                                      </div>
                                    </s-stack>
                                  )}
                                </s-stack>

                                {/* Step Options */}
                                <s-stack direction="block" gap="small">
                                  <s-divider />
                                  <s-stack direction="block" gap="small-400">
                                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Step Options</h3>
                                    <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                      Advanced options for free gift steps and pre-selected (mandatory) products.
                                    </p>
                                  </s-stack>

                                  {/* Step type selector */}
                                  <s-stack direction="block" gap="small-400">
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>Step type</span>
                                    {[{ label: 'Regular Step', value: 'regular' }, { label: 'Add-On / Upsell Step', value: 'addon' }].map(choice => (
                                      <s-checkbox
                                        key={choice.value}
                                        checked={(step.isFreeGift ? 'addon' : 'regular') === choice.value || undefined}
                                        onChange={() => {
                                          const isAddon = choice.value === 'addon';
                                          stepsState.updateStepField(step.id, 'isFreeGift', isAddon);
                                          if (!isAddon) {
                                            stepsState.updateStepField(step.id, 'addonLabel', null);
                                            stepsState.updateStepField(step.id, 'addonTitle', null);
                                            stepsState.updateStepField(step.id, 'addonIconUrl', null);
                                          }
                                        }}
                                      >
                                        {choice.label}
                                      </s-checkbox>
                                    ))}
                                  </s-stack>

                                  {step.isFreeGift && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                      <s-text-field
                                        label="Step label (tab name)"
                                        placeholder="Add-Ons"
                                        helpText="Shown in the bundle step navigator tab."
                                        maxLength={40}
                                        value={step.addonLabel ?? (step.freeGiftName || '')}
                                        onInput={(e: Event) => stepsState.updateStepField(step.id, 'addonLabel', (e.target as HTMLInputElement).value)}
                                        autoComplete="off"
                                      />
                                      <s-text-field
                                        label="Step title (panel heading)"
                                        placeholder="Pick a free gift!"
                                        helpText="Shown as the heading inside the step panel."
                                        value={step.addonTitle || ''}
                                        onInput={(e: Event) => stepsState.updateStepField(step.id, 'addonTitle', (e.target as HTMLInputElement).value)}
                                        autoComplete="off"
                                      />
                                      <s-checkbox
                                        checked={step.addonDisplayFree !== false || undefined}
                                        onChange={(e: Event) => stepsState.updateStepField(step.id, 'addonDisplayFree', (e.target as HTMLInputElement).checked)}
                                        helpText="Customers see $0 on products in this step."
                                      >
                                        Display products as free ($0.00)
                                      </s-checkbox>
                                      <s-checkbox
                                        checked={step.addonUnlockAfterCompletion !== false || undefined}
                                        onChange={(e: Event) => stepsState.updateStepField(step.id, 'addonUnlockAfterCompletion', (e.target as HTMLInputElement).checked)}
                                        helpText="This step tab is locked until all prior steps are filled."
                                      >
                                        Unlock after bundle completion
                                      </s-checkbox>
                                    </div>
                                  )}

                                  <s-divider />

                                  {/* Default (mandatory) product toggle */}
                                  <s-checkbox
                                    checked={step.isDefault === true || undefined}
                                    onChange={(e: Event) => {
                                      const checked = (e.target as HTMLInputElement).checked;
                                      stepsState.updateStepField(step.id, 'isDefault', checked);
                                      if (!checked) stepsState.updateStepField(step.id, 'defaultVariantId', '');
                                    }}
                                    helpText="A specific variant is pre-selected when the bundle loads. Customers cannot remove it."
                                  >
                                    Mandatory default product
                                  </s-checkbox>

                                  {step.isDefault && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                      <s-text-field
                                        label="Default variant GID"
                                        placeholder="gid://shopify/ProductVariant/123456789"
                                        helpText="Paste the Shopify variant GID. It must be one of the products added to this step."
                                        value={step.defaultVariantId || ''}
                                        onInput={(e: Event) => stepsState.updateStepField(step.id, 'defaultVariantId', (e.target as HTMLInputElement).value)}
                                        autoComplete="off"
                                      />
                                      {step.StepProduct && step.StepProduct.length > 0 && (
                                        <s-stack direction="block" gap="small-400">
                                          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                            Available variants from products in this step:
                                          </p>
                                          {step.StepProduct.flatMap((sp: any) =>
                                            (sp.variants || []).map((v: any) => (
                                              <s-button
                                                key={v.id || v.gid}
                                                variant="plain"
                                                onClick={() => stepsState.updateStepField(step.id, 'defaultVariantId', v.id || v.gid)}
                                              >
                                                {sp.title}{v.title && v.title !== 'Default Title' ? ` · ${v.title}` : ''} — {v.id || v.gid}
                                              </s-button>
                                            ))
                                          )}
                                        </s-stack>
                                      )}
                                    </div>
                                  )}
                                </s-stack>

                                {/* ── Step Config ── */}
                                <div style={{ marginTop: 8 }}>
                                  <s-divider style={{ marginBottom: 16 }} />
                                  <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 650, color: "#202223" }}>Step Config</h3>
                                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                      <div style={{ width: 72, height: 72, border: "1px dashed #c9cccf", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f6f7" }}>
                                        {(step as any).timelineIconUrl ? (
                                          <img
                                            src={(step as any).timelineIconUrl}
                                            alt="Step icon"
                                            style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }}
                                          />
                                        ) : (
                                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                                            <path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 5l-8 4-8-4" />
                                          </svg>
                                        )}
                                      </div>
                                      <s-button
                                        variant="plain"
                                        icon="upload"
                                        onClick={() => setShowIconPickerForStep((prev: string | null) => prev === step.id ? null : step.id)}
                                      >
                                        {showIconPickerForStep === step.id ? "Cancel" : "Upload icon"}
                                      </s-button>
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
                                    </div>
                                    <div style={{ flex: 1 }}>
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

                      </s-stack>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "discount_pricing" && (
              <div data-tour-target="ppb-discount-pricing">
              <s-section>
                <s-stack direction="block" gap="base">
                  <s-stack direction="block" gap="small-100">
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                      Discount &amp; Pricing
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                      Set up to 4 discount rules, applied from lowest to highest.
                    </p>
                  </s-stack>

                  {/* Discount Enable Toggle */}
                  <s-checkbox
                    checked={pricingState.discountEnabled || undefined}
                    onChange={(e: Event) => pricingState.setDiscountEnabled((e.target as HTMLInputElement).checked)}
                    helpText="Turn on to configure discount rules and pricing options"
                  >
                    Enable discount pricing for this bundle
                  </s-checkbox>

                  {pricingState.discountEnabled && (
                    <s-stack direction="block" gap="base">
                      {/* Discount Type */}
                      <s-select
                        label="Discount Type"
                        onChange={(e: Event) => {
                          pricingState.setDiscountType((e.target as HTMLSelectElement).value as DiscountMethod);
                          pricingState.setDiscountRules([]);
                          setRuleMessages({});
                        }}
                      >
                        {[...DISCOUNT_METHOD_OPTIONS].map(opt => (
                          <option key={opt.value} value={opt.value} selected={pricingState.discountType === opt.value || undefined}>{opt.label}</option>
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
                            variant="tertiary"
                            style={{ width: "100%" }}
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
                  )}
                </s-stack>
              </s-section>

              {/* FR-03: Bundle Quantity Options */}
              <s-section heading="Bundle Quantity Options">
                <s-stack direction="vertical" gap="400">
                  <s-stack direction="horizontal" gap="300" align-y="center">
                    <s-switch
                      checked={qtyOptionsEnabled}
                      onChange={(e: any) => setQtyOptionsEnabled(e.target.checked)}
                    />
                    <s-stack direction="vertical" gap="100">
                      <s-text>Enable bundle quantity selector</s-text>
                      <s-text size="small" tone="subdued">Show a quantity picker so customers can choose how many bundles to add in one go.</s-text>
                    </s-stack>
                  </s-stack>

                  {qtyOptionsEnabled && pricingState.discountRules.length > 0 && (
                    <s-stack direction="vertical" gap="300">
                      <s-select
                        label="Default quantity option"
                        onChange={(e: any) => setQtyOptionsDefaultRuleId(e.target.value || null)}
                      >
                        <option value="">— none —</option>
                        {pricingState.discountRules.map((r: any, i: number) => (
                          <option key={r.id} value={r.id} selected={qtyOptionsDefaultRuleId === r.id || undefined}>
                            {`Rule #${i + 1} — qty ${r.condition?.value ?? '?'}`}
                          </option>
                        ))}
                      </s-select>
                      {pricingState.discountRules.map((r: any, i: number) => (
                        <s-box key={r.id} padding="300" border-color="subdued" border-width="025" border-radius="200">
                          <s-stack direction="vertical" gap="200">
                            <s-text>Rule #{i + 1} — qty {r.condition?.value ?? '?'}</s-text>
                            <s-text-field
                              label="Label"
                              placeholder={`Box of ${r.condition?.value ?? ''}`}
                              value={qtyRuleLabels[r.id] ?? ''}
                              onInput={(e: Event) => setQtyRuleLabels(prev => ({ ...prev, [r.id]: (e.target as HTMLInputElement).value }))}
                              autoComplete="off"
                            />
                            <s-text-field
                              label="Subtext"
                              placeholder="e.g. 20% off"
                              value={qtyRuleSubtexts[r.id] ?? ''}
                              onInput={(e: Event) => setQtyRuleSubtexts(prev => ({ ...prev, [r.id]: (e.target as HTMLInputElement).value }))}
                              autoComplete="off"
                            />
                          </s-stack>
                        </s-box>
                      ))}
                    </s-stack>
                  )}
                  {qtyOptionsEnabled && pricingState.discountRules.length === 0 && (
                    <s-text tone="subdued" size="small">Add discount rules first to configure quantity options per tier.</s-text>
                  )}
                </s-stack>
              </s-section>

              {/* FR-03: Progress Bar */}
              <s-section heading="Discount Progress Bar">
                <s-stack direction="vertical" gap="400">
                  <s-stack direction="horizontal" gap="300" align-y="center">
                    <s-switch
                      checked={progressBarEnabled}
                      onChange={(e: any) => setProgressBarEnabled(e.target.checked)}
                    />
                    <s-stack direction="vertical" gap="100">
                      <s-text>Enable progress bar</s-text>
                      <s-text size="small" tone="subdued">Show a visual progress bar in the widget motivating customers toward the next discount tier.</s-text>
                    </s-stack>
                  </s-stack>

                  {progressBarEnabled && (
                    <s-stack direction="vertical" gap="300">
                      <s-select
                        label="Progress bar style"
                        value={progressBarType}
                        onChange={(e: any) => setProgressBarType(e.target.value)}
                      >
                        <option value="step_based">Step-based (milestone markers per rule)</option>
                        <option value="simple">Simple (single fill bar)</option>
                      </s-select>
                      <s-text-field
                        label="Progress text"
                        helpText="Shown while customer is working toward a discount. Supports {{conditionText}}, {{discountText}}."
                        value={progressBarProgressText}
                        onInput={(e: Event) => setProgressBarProgressText((e.target as HTMLInputElement).value)}
                        autoComplete="off"
                      />
                      <s-text-field
                        label="Success text"
                        helpText="Shown when the discount is unlocked. Supports {{discountText}}."
                        value={progressBarSuccessText}
                        onInput={(e: Event) => setProgressBarSuccessText((e.target as HTMLInputElement).value)}
                        autoComplete="off"
                      />
                    </s-stack>
                  )}
                </s-stack>
              </s-section>
              </div>
            )}

            {activeSection === "bundle_visibility" && (
              <div>
                {/* App Embed Status */}
                <s-section heading="App Embed Status">
                  <AppEmbedBanner appEmbedEnabled={appEmbedEnabled} themeEditorUrl={themeEditorUrl} />
                </s-section>

                {/* Publishing Best Practices */}
                <s-section heading="Publishing Best Practices">
                  <s-stack direction="vertical" gap="300">
                    <s-text>Follow these steps to ensure your bundle widget appears correctly for customers.</s-text>
                    <s-grid columns="2" gap="300">
                      <s-box padding="300" border-color="subdued" border-width="025" border-radius="200">
                        <s-stack direction="vertical" gap="200">
                          <s-icon type="view" />
                          <s-heading size="small">Enable App Embed</s-heading>
                          <s-text size="small" tone="subdued">Turn on the wolfpack-product-bundles embed in your theme settings to activate the widget.</s-text>
                        </s-stack>
                      </s-box>
                      <s-box padding="300" border-color="subdued" border-width="025" border-radius="200">
                        <s-stack direction="vertical" gap="200">
                          <s-icon type="product" />
                          <s-heading size="small">Add to Product Page</s-heading>
                          <s-text size="small" tone="subdued">Place the bundle widget block on your product page template using the theme editor.</s-text>
                        </s-stack>
                      </s-box>
                      <s-box padding="300" border-color="subdued" border-width="025" border-radius="200">
                        <s-stack direction="vertical" gap="200">
                          <s-icon type="check" />
                          <s-heading size="small">Test on Storefront</s-heading>
                          <s-text size="small" tone="subdued">Visit your product page as a customer to confirm the bundle widget is visible and functional.</s-text>
                        </s-stack>
                      </s-box>
                      <s-box padding="300" border-color="subdued" border-width="025" border-radius="200">
                        <s-stack direction="vertical" gap="200">
                          <s-icon type="globe" />
                          <s-heading size="small">Go Live</s-heading>
                          <s-text size="small" tone="subdued">Once tested, publish your theme to make the bundle available to all customers.</s-text>
                        </s-stack>
                      </s-box>
                    </s-grid>
                  </s-stack>
                </s-section>

                {/* Your Bundle Link */}
                <s-section heading="Your Bundle Link">
                  <s-stack direction="vertical" gap="300">
                    <s-text>Share or preview your bundle on the storefront.</s-text>
                    {bundle.shopifyProductHandle && shop ? (
                      <s-stack direction="horizontal" gap="200" align-y="center">
                        <s-text>
                          {`https://${shop}/products/${bundle.shopifyProductHandle}`}
                        </s-text>
                        <s-button
                          variant="plain"
                          icon="duplicate"
                          onClick={() => {
                            const url = `https://${shop}/products/${bundle.shopifyProductHandle}`;
                            navigator.clipboard.writeText(url).catch(() => {});
                          }}
                        >
                          Copy
                        </s-button>
                        <s-button
                          variant="plain"
                          icon="view"
                          onClick={() => {
                            const url = `https://${shop}/products/${bundle.shopifyProductHandle}`;
                            window.open(url, "_blank");
                          }}
                        >
                          Preview
                        </s-button>
                      </s-stack>
                    ) : (
                      <s-text tone="subdued">Bundle product not yet linked.</s-text>
                    )}
                  </s-stack>
                </s-section>

                {/* Bundle Widget */}
                <s-section heading="Bundle Widget">
                  <s-stack direction="vertical" gap="400">
                    <s-stack direction="horizontal" gap="300" align-y="center">
                      <s-switch
                        checked={upsellWidgetEnabled}
                        onChange={(e: any) => setUpsellWidgetEnabled(e.target.checked)}
                      />
                      <s-stack direction="vertical" gap="100">
                        <s-text>Enable bundle widget on product page</s-text>
                        <s-text size="small" tone="subdued">When enabled, the bundle widget will appear on the associated product page.</s-text>
                      </s-stack>
                    </s-stack>

                    {upsellWidgetEnabled && (
                      <s-stack direction="vertical" gap="300">
                        <s-select
                          label="Display Mode"
                          value={upsellWidgetDisplayMode}
                          onChange={(e: any) => setUpsellWidgetDisplayMode(e.target.value)}
                        >
                          <option value="block">Block — full width below product info</option>
                          <option value="inline">Inline — embedded within product description</option>
                          <option value="drawer">Drawer — slide-out panel</option>
                        </s-select>

                        <s-select
                          label="Display On"
                          value={upsellWidgetDisplayOn}
                          onChange={(e: any) => setUpsellWidgetDisplayOn(e.target.value)}
                        >
                          <option value="all">All product pages</option>
                          <option value="bundle_product">Bundle product page only</option>
                          <option value="component_products">Component product pages</option>
                        </s-select>

                        <s-stack direction="horizontal" gap="300" align-y="center">
                          <s-switch
                            checked={autoSelectBrowsedProduct}
                            onChange={(e: any) => setAutoSelectBrowsedProduct(e.target.checked)}
                          />
                          <s-stack direction="vertical" gap="100">
                            <s-text>Auto-select browsed product</s-text>
                            <s-text size="small" tone="subdued">Automatically pre-select the product the customer is currently viewing when the bundle loads.</s-text>
                          </s-stack>
                        </s-stack>
                      </s-stack>
                    )}
                  </s-stack>
                </s-section>
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

            {activeSection === "bundle_settings" && (
              <div data-tour-target="ppb-bundle-status">
              <s-stack direction="block" gap="base">
                <div style={{ padding: "var(--s-space-400)", background: "#f6f6f7", borderRadius: 8 }}>
                  <s-stack direction="inline" gap="small-100" style={{ alignItems: "center" }}>
                    <s-icon name="image-alt-minor" />
                    <s-stack direction="block">
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Bundle Settings</p>
                      <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                        Control how this bundle behaves on the storefront.
                      </p>
                    </s-stack>
                  </s-stack>
                </div>

                <s-section>
                  <s-stack direction="block" gap="base">
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Display</h3>
                    <s-checkbox
                      checked={showProductPrices || undefined}
                      onChange={(e: Event) => { setShowProductPrices((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      helpText="Display the price of each product on its card."
                    >
                      Show product prices
                    </s-checkbox>
                    <s-checkbox
                      checked={showCompareAtPrices || undefined}
                      onChange={(e: Event) => { setShowCompareAtPrices((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      helpText="Show the original (strike-through) price next to the sale price."
                    >
                      Show compare-at prices
                    </s-checkbox>
                    <s-checkbox
                      checked={allowQuantityChanges || undefined}
                      onChange={(e: Event) => { setAllowQuantityChanges((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      helpText="Let customers adjust the quantity of individual products within the bundle."
                    >
                      Allow quantity changes
                    </s-checkbox>
                  </s-stack>
                </s-section>

                <s-section>
                  <s-stack direction="block" gap="base">
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Cart behaviour</h3>
                    <s-checkbox
                      checked={cartRedirectToCheckout || undefined}
                      onChange={(e: Event) => { setCartRedirectToCheckout((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      helpText="Takes customers directly to checkout instead of the cart page."
                    >
                      Redirect to checkout after adding to cart
                    </s-checkbox>
                  </s-stack>
                </s-section>

                <s-section>
                  <s-stack direction="block" gap="base">
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Developer</h3>
                    <s-checkbox
                      checked={sdkMode || undefined}
                      onChange={(e: Event) => { setSdkMode((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      helpText="Loads the Wolfpack Bundles headless SDK instead of the pre-built widget. Use when building a custom bundle UI."
                    >
                      Enable SDK mode
                    </s-checkbox>
                  </s-stack>
                </s-section>

                {/* FR-05 sub-section 1: Pre-selected variant */}
                <s-section heading="Pre-selected Variant">
                  <s-stack direction="vertical" gap="300">
                    <s-text tone="subdued">Optionally pre-select a specific variant when the bundle widget loads.</s-text>
                    <s-text-field
                      label="Variant ID"
                      placeholder="gid://shopify/ProductVariant/123456"
                      helpText="Paste the Shopify variant GID to pre-select it on load."
                      value={preSelectedProductVariantId}
                      onInput={(e: Event) => { setPreSelectedProductVariantId((e.target as HTMLInputElement).value); markAsDirty(); }}
                      autoComplete="off"
                    />
                  </s-stack>
                </s-section>

                {/* FR-05 sub-section 2: Product quantity limits */}
                <s-section heading="Product Quantity Limits">
                  <s-stack direction="vertical" gap="300">
                    <s-number-field
                      label="Max quantity per product"
                      helpText="Maximum number of times a single product can be added across all bundle steps. Leave blank for no limit."
                      min={1}
                      value={maxQtyPerProduct}
                      onInput={(e: Event) => { setMaxQtyPerProduct((e.target as HTMLInputElement).value); markAsDirty(); }}
                    />
                  </s-stack>
                </s-section>

                {/* FR-05 sub-section 3: Product slots */}
                <s-section heading="Product Slots">
                  <s-stack direction="vertical" gap="300">
                    <s-stack direction="horizontal" gap="300" align-y="center">
                      <s-switch
                        checked={productSlotsEnabled}
                        onChange={(e: any) => { setProductSlotsEnabled(e.target.checked); markAsDirty(); }}
                      />
                      <s-stack direction="vertical" gap="100">
                        <s-text>Enable product slot indicators</s-text>
                        <s-text size="small" tone="subdued">Show empty slot placeholders in the widget to visualise how many items remain to be selected.</s-text>
                      </s-stack>
                    </s-stack>
                    {productSlotsEnabled && (
                      <s-text-field
                        label="Slot icon URL (optional)"
                        placeholder="https://cdn.shopify.com/..."
                        helpText="Custom icon shown in empty slots. Defaults to a generic placeholder if left blank."
                        value={productSlotIconUrl}
                        onInput={(e: Event) => { setProductSlotIconUrl((e.target as HTMLInputElement).value); markAsDirty(); }}
                        autoComplete="off"
                      />
                    )}
                  </s-stack>
                </s-section>

                {/* FR-05 sub-section 4: Variant selector */}
                <s-section heading="Variant Selector">
                  <s-stack direction="vertical" gap="300">
                    <s-stack direction="horizontal" gap="300" align-y="center">
                      <s-switch
                        checked={variantSelectorEnabled}
                        onChange={(e: any) => { setVariantSelectorEnabled(e.target.checked); markAsDirty(); }}
                      />
                      <s-stack direction="vertical" gap="100">
                        <s-text>Show variant selector on product cards</s-text>
                        <s-text size="small" tone="subdued">Display size/colour dropdowns on each product card so customers can pick a variant before adding to the bundle.</s-text>
                      </s-stack>
                    </s-stack>
                  </s-stack>
                </s-section>

                {/* FR-05 sub-section 5: Add-to-bundle button */}
                <s-section heading="Add to Bundle Button">
                  <s-stack direction="vertical" gap="300">
                    <s-checkbox
                      checked={showTextOnAddButton || undefined}
                      onChange={(e: Event) => { setShowTextOnAddButton((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      helpText="Show an 'Add' label inside the add-to-bundle button on product cards."
                    >
                      Show text on add button
                    </s-checkbox>
                  </s-stack>
                </s-section>

                {/* FR-05 sub-section 6: Cart title & subtitle */}
                <s-section heading="Cart Line Labels">
                  <s-stack direction="vertical" gap="300">
                    <s-text tone="subdued">Customise how the bundle appears in the cart line item.</s-text>
                    <s-text-field
                      label="Bundle cart title"
                      placeholder="My Bundle"
                      helpText="Overrides the bundle name shown in the cart line item."
                      value={bundleCartTitle}
                      onInput={(e: Event) => { setBundleCartTitle((e.target as HTMLInputElement).value); markAsDirty(); }}
                      autoComplete="off"
                    />
                    <s-text-field
                      label="Bundle cart subtitle"
                      placeholder="Build your own"
                      helpText="Secondary line shown beneath the cart title."
                      value={bundleCartSubtitle}
                      onInput={(e: Event) => { setBundleCartSubtitle((e.target as HTMLInputElement).value); markAsDirty(); }}
                      autoComplete="off"
                    />
                  </s-stack>
                </s-section>

                {/* FR-05 sub-section 7: Bundle banners */}
                <s-section heading="Bundle Banners">
                  <s-stack direction="vertical" gap="300">
                    <s-text tone="subdued">Optional banner images shown at the top of the bundle widget.</s-text>
                    <s-text-field
                      label="Desktop banner URL"
                      placeholder="https://cdn.shopify.com/..."
                      helpText="Recommended: 1200×300 px. Shown on screens wider than 768 px."
                      value={bundleBannerDesktopUrl}
                      onInput={(e: Event) => { setBundleBannerDesktopUrl((e.target as HTMLInputElement).value); markAsDirty(); }}
                      autoComplete="off"
                    />
                    <s-text-field
                      label="Mobile banner URL"
                      placeholder="https://cdn.shopify.com/..."
                      helpText="Recommended: 600×200 px. Shown on screens 768 px and narrower."
                      value={bundleBannerMobileUrl}
                      onInput={(e: Event) => { setBundleBannerMobileUrl((e.target as HTMLInputElement).value); markAsDirty(); }}
                      autoComplete="off"
                    />
                  </s-stack>
                </s-section>

                {/* Widget label text overrides */}
                <s-section heading="Widget Labels">
                  {(() => {
                    const isEnglish = textOverridesLocale === "en";
                    const currentOverrides: Record<string, string> = isEnglish
                      ? textOverrides
                      : (textOverridesByLocale[textOverridesLocale] ?? {});
                    const setCurrentOverrides = (key: string, value: string) => {
                      if (isEnglish) {
                        setTextOverrides((prev) => ({ ...prev, [key]: value }));
                      } else {
                        setTextOverridesByLocale((prev) => ({
                          ...prev,
                          [textOverridesLocale]: { ...(prev[textOverridesLocale] ?? {}), [key]: value },
                        }));
                      }
                      markAsDirty();
                    };
                    const localeOptions = [
                      { label: "English (default)", value: "en" },
                      ...shopLocales
                        .filter((l: { locale: string; name: string; primary: boolean }) => l.locale !== "en")
                        .map((l: { locale: string; name: string; primary: boolean }) => ({ label: l.name, value: l.locale })),
                    ];
                    const fields: { key: string; label: string; placeholder: string; helpText: string }[] = [
                      { key: "addToCartButton", label: "Add Bundle to Cart button",   placeholder: "Add Bundle to Cart",             helpText: "Main CTA button when the bundle is complete." },
                      { key: "nextButton",      label: "Next Step button",             placeholder: "Next",                           helpText: "Button to advance to the next step." },
                      { key: "doneButton",      label: "Done button",                  placeholder: "Done",                           helpText: "Shown on the last step." },
                      { key: "freeBadge",       label: "Free gift badge",              placeholder: "Free",                           helpText: "Badge shown on free-gift product cards." },
                      { key: "includedBadge",   label: "Included badge",               placeholder: "Included",                       helpText: "Badge shown on already-included product cards." },
                      { key: "completeSteps",   label: "Incomplete bundle message",    placeholder: "Complete All Steps to Continue", helpText: "Shown on the CTA when not all steps are complete." },
                      { key: "addingToCart",    label: "Adding to cart message",       placeholder: "Adding to Cart...",              helpText: "Shown on the CTA while the cart request is in flight." },
                    ];
                    return (
                      <s-stack direction="block" gap="small">
                        <s-text tone="subdued">Customise the text shown to customers in the bundle widget.</s-text>
                        {localeOptions.length > 1 && (
                          <s-select
                            label="Editing language"
                            onChange={(e: Event) => setTextOverridesLocale((e.target as HTMLSelectElement).value)}
                          >
                            {localeOptions.map(opt => (
                              <option key={opt.value} value={opt.value} selected={textOverridesLocale === opt.value || undefined}>{opt.label}</option>
                            ))}
                          </s-select>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {fields.map(({ key, label, placeholder, helpText }) => (
                            <s-text-field
                              key={key}
                              label={label}
                              value={currentOverrides[key] ?? ""}
                              placeholder={placeholder}
                              helpText={helpText}
                              autoComplete="off"
                              onInput={(e: Event) => setCurrentOverrides(key, (e.target as HTMLInputElement).value)}
                            />
                          ))}
                        </div>
                      </s-stack>
                    );
                  })()}
                </s-section>

                {/* FR-05 sub-section 8: Bundle-level CSS */}
                <s-section heading="Custom CSS">
                  <s-stack direction="vertical" gap="300">
                    <s-text tone="subdued">Inject custom CSS scoped to this bundle widget. Sanitized on save.</s-text>
                    <s-text-area
                      label="Bundle-level CSS"
                      placeholder=".wolfpack-bundle { background: #f9f9f9; }"
                      helpText="CSS is sanitized on save. Use .wolfpack-bundle as the root selector."
                      value={bundleLevelCss}
                      onInput={(e: Event) => { setBundleLevelCss((e.target as HTMLTextAreaElement).value); markAsDirty(); }}
                      autoComplete="off"
                      rows={8}
                    />
                  </s-stack>
                </s-section>
              </s-stack>
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
                <div>
                  <s-stack direction="block" gap="base">
                    {/* Card 1: Add-Ons and Gifting Step */}
                    <div className={productPageBundleStyles.card}>
                      <div className={productPageBundleStyles.ebPanelHeader}>
                        <h3 className={productPageBundleStyles.ebPanelTitle}>Add-Ons and Gifting Step</h3>
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
                      <div style={{ marginTop: 16 }} className={productPageBundleStyles.ebMediaFieldGrid}>
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

                    {/* Card 2: Add-Ons with Bundles */}
                    <div className={productPageBundleStyles.card}>
                      <div className={productPageBundleStyles.ebPanelHeader}>
                        <div>
                          <h3 className={productPageBundleStyles.ebPanelTitle}>Add-Ons with Bundles</h3>
                          <p className={productPageBundleStyles.ebPanelDescription}>
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
                                <div key={idx} className={productPageBundleStyles.ebRuleCard}>
                                  <div className={productPageBundleStyles.ebRuleHeader}>
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
                      <div className={productPageBundleStyles.ebPanelHeader}>
                        <h3 className={productPageBundleStyles.ebPanelTitle}>Footer Messaging</h3>
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
                    <div className={productPageBundleStyles.ebPanelHeader}>
                      <div>
                        <h3 className={productPageBundleStyles.ebPanelTitle}>Enable Messages</h3>
                        <p className={productPageBundleStyles.ebPanelDescription}>
                          Message will show up as a product at checkout
                        </p>
                      </div>
                      <s-checkbox
                        accessibilityLabel="Enable messages"
                        checked={giftMessagesEnabled || undefined}
                        onChange={(e: Event) => { setGiftMessagesEnabled((e.target as HTMLInputElement).checked); markAsDirty(); }}
                      />
                    </div>

                    <div style={{ marginTop: 16 }} className={productPageBundleStyles.ebMessagePreview}>
                      <div className={productPageBundleStyles.ebMessagePreviewIcon} aria-hidden="true">
                        <s-icon name="note" />
                      </div>
                      <div>
                        <p className={productPageBundleStyles.ebMessagePreviewTitle}>
                          {giftMessageProductTitle || "Message"}
                        </p>
                        <p className={productPageBundleStyles.ebMessageNote}>
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
        <s-button slot="primaryAction" onClick={closePageSelectionModal}>Cancel</s-button>
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
        bundleId={bundle.id}
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
      />

      </div>
    </>
  );
}