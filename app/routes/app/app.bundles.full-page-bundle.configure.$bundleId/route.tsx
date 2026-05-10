import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, useRevalidator } from "@remix-run/react";
import { AppLogger } from "../../../lib/logger";
import { slugify, validateSlug } from "../../../lib/slug-utils";

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
import { PricingTiersSection } from "../../../components/PricingTiersSection";
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
  { id: "images_gifs",      label: "Bundle Assets",      fullPageOnly: true  },
  { id: "pricing_tiers",    label: "Pricing Tiers",      fullPageOnly: true  },
  { id: "bundle_settings",  label: "Bundle Settings",    fullPageOnly: false },
  { id: "messages",         label: "Messages",           fullPageOnly: false },
];

// Static status options - imported from centralized constants
const statusOptions = [...BUNDLE_STATUS_OPTIONS];

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

  // Text overrides state (Messages tab)
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>(
    ((bundle as any).textOverrides as Record<string, string>) ?? {}
  );
  const [textOverridesByLocale, setTextOverridesByLocale] = useState<Record<string, Record<string, string>>>(
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

  // Modal refs for s-modal web components
  const stepsTiersModalRef = useRef<HTMLElement>(null);
  const pageSelectionModalRef = useRef<HTMLElement>(null);
  const productsModalRef = useRef<HTMLElement>(null);
  const collectionsModalRef = useRef<HTMLElement>(null);
  const syncModalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    stepsTiersWarning.open ? (stepsTiersModalRef.current as any)?.show?.() : (stepsTiersModalRef.current as any)?.hide?.();
  }, [stepsTiersWarning.open]);

  useEffect(() => {
    isPageSelectionModalOpen ? (pageSelectionModalRef.current as any)?.show?.() : (pageSelectionModalRef.current as any)?.hide?.();
  }, [isPageSelectionModalOpen]);

  useEffect(() => {
    isProductsModalOpen ? (productsModalRef.current as any)?.show?.() : (productsModalRef.current as any)?.hide?.();
  }, [isProductsModalOpen]);

  useEffect(() => {
    isCollectionsModalOpen ? (collectionsModalRef.current as any)?.show?.() : (collectionsModalRef.current as any)?.hide?.();
  }, [isCollectionsModalOpen]);

  useEffect(() => {
    isSyncModalOpen ? (syncModalRef.current as any)?.show?.() : (syncModalRef.current as any)?.hide?.();
  }, [isSyncModalOpen]);

  // SaveBar visibility controlled by isDirty flag - no complex change detection needed!

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

      formData.append("stepsData", JSON.stringify(stepsWithCollections));
      formData.append("discountData", JSON.stringify({
        discountEnabled: pricingState.discountEnabled,
        discountType: pricingState.discountType,
        discountRules: pricingState.discountRules,
        showFooter: pricingState.showFooter,
        showDiscountProgressBar: pricingState.showDiscountProgressBar,
        discountMessagingEnabled: pricingState.discountMessagingEnabled,
        ruleMessages
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
    ruleMessages,
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
            selectedCollections: JSON.stringify(selectedCollections),
            ruleMessages: JSON.stringify(ruleMessages),
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
  }, [bundle.shopifyPageHandle, hookHandleDiscard]);

  // Navigation handlers with unsaved changes check
  const handleBackClick = useCallback(() => {
    if (isDirty && !forceNavigation) {
      // Show user-friendly message about unsaved changes with force option
      const proceed = confirm(
        "You have unsaved changes. Are you sure you want to leave this page?\n\n" +
        "Click 'OK' to leave anyway (changes will be lost)\n" +
        "Click 'Cancel' to stay and save your changes"
      );

      if (proceed) {
        setForceNavigation(true);
        // Force navigation even with unsaved changes
        navigate("/app/dashboard");
      } else {
        shopify.toast.show("Save or discard your changes to continue", {
          isError: true,
          duration: 4000
        });
      }
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
    if (isDirty) {
      // Show user-friendly message about unsaved changes
      shopify.toast.show("Please save or discard your changes before switching sections", {
        isError: true,
        duration: 4000
      });
      return;
    }

    setActiveSection(section);
  }, [isDirty, activeSection, shopify]);

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
        {bundle.shopifyPageHandle ? (
          <button onClick={() => {
            const storefrontUrl = `https://${shopDomain}.myshopify.com/pages/${originalPageSlugRef.current}`;
            window.open(storefrontUrl, '_blank');
            shopify.toast.show('Opening bundle page on storefront...', { duration: 3000 });
          }}>View on Storefront</button>
        ) : (
          <button variant="primary" onClick={() => { void handleAddToStorefront(); }} disabled={fetcher.state === 'submitting' || Boolean(pageSlugError)}>
            {fetcher.state === 'submitting' ? 'Adding…' : 'Add to Storefront'}
          </button>
        )}
        {!bundle.shopifyPageHandle && (
          <button onClick={() => { void handlePreviewBundle(); }} disabled={fetcher.state !== 'idle'}>
            Preview on Storefront
          </button>
        )}
        <button onClick={() => {
          if (isDirty) {
            shopify.toast.show("Save your changes before syncing", { isError: true });
            return;
          }
          if (fetcher.state !== 'idle') return;
          setIsSyncModalOpen(true);
        }}>
          Sync Bundle
        </button>
      </ui-title-bar>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 4px 88px" }}>
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
          ruleMessages
        })} />
        <input type="hidden" name="stepConditions" value={JSON.stringify(conditionsState.stepConditions)} />

        <AppEmbedBanner appEmbedEnabled={appEmbedEnabled} themeEditorUrl={themeEditorUrl} />

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* Left Sidebar */}
          <div style={{ width: "33%", flexShrink: 0 }}>
            <s-stack direction="block" gap="base">
              {/* Bundle Setup Navigation Card */}
              <s-section>
                <s-stack direction="block" gap="small">
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                    Bundle Setup
                  </h3>

                  <s-stack direction="block" gap="small-400">
                    {bundleSetupItems
                      .filter(item => !item.fullPageOnly || bundle.bundleType === "full_page")
                      .map((item) => {
                        const isActive = activeSection === item.id;
                        let statusBadge: string | null = null;
                        if (item.id === 'discount_pricing') {
                          statusBadge = pricingState.discountEnabled ? null : 'None';
                        }
                        return (
                          <s-button
                            key={item.id}
                            variant={isActive ? "primary" : "tertiary"}
                            onClick={() => handleSectionChange(item.id)}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                              <span>{item.label}</span>
                              {statusBadge && !isActive && (
                                <s-badge tone="subdued">{statusBadge}</s-badge>
                              )}
                            </span>
                          </s-button>
                        );
                      })}
                  </s-stack>
                </s-stack>
              </s-section>

              {/* Bundle Product Card - Only for product-page bundles */}
              {bundle.bundleType !== 'full_page' && (
                <s-section>
                  <s-stack direction="block" gap="small">
                    <s-stack direction="inline">
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, flex: 1 }}>
                        Bundle Product
                      </h3>
                      <s-button variant="plain" onClick={handleSyncProduct}>
                        Sync Product
                      </s-button>
                    </s-stack>

                    {bundleProduct ? (
                      <s-stack direction="block" gap="small">
                        <s-stack direction="inline" gap="small">
                          <img
                            src={productImageUrl || "/bundle.png"}
                            alt={productTitle || "Bundle Product"}
                            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                          />
                          <s-stack direction="inline" gap="small-100">
                            <s-button
                              variant="plain"
                              onClick={() => {
                                const productUrl = `https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${bundleProduct.legacyResourceId || bundleProduct.id?.split('/').pop()}`;
                                open(productUrl, '_blank');
                              }}
                            >
                              {productTitle || bundleProduct.title || "Untitled Product"}
                            </s-button>
                            <s-button
                              variant="tertiary"
                              onClick={handleBundleProductSelect}
                            >
                              <s-icon name="refresh-minor" />
                            </s-button>
                          </s-stack>
                        </s-stack>
                      </s-stack>
                    ) : (
                      <div className={fullPageBundleStyles.productSelectionPlaceholder}>
                        <s-stack direction="block" gap="small-400">
                          <s-icon name="product-minor" />
                          <s-button variant="plain" onClick={handleBundleProductSelect}>
                            Select Bundle Product
                          </s-button>
                        </s-stack>
                      </div>
                    )}

                    {/* Bundle Status Dropdown */}
                    <s-stack direction="block" gap="small-100">
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                        Bundle Status
                      </h4>
                      <s-select
                        value={formState.bundleStatus}
                        onChange={(e: Event) => formState.setBundleStatus((e.target as HTMLSelectElement).value as BundleStatus)}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </s-select>
                    </s-stack>
                  </s-stack>
                </s-section>
              )}

              {bundle.bundleType === 'full_page' && (
                <s-section>
                  <BundleStatusSection
                    status={formState.bundleStatus}
                    onChange={formState.setBundleStatus}
                  />
                </s-section>
              )}

              {/* Step Summary — only shown when Step Setup is active */}
              {activeSection === "step_setup" && (() => {
                const activeStep = stepsState.steps[activeTabIndex];
                const productCount = activeStep ? stepsState.getUniqueProductCount(activeStep.StepProduct || []) : 0;
                const rulesCount = activeStep ? (conditionsState.stepConditions[activeStep.id] || []).length : 0;
                const filtersCount = activeStep ? (Array.isArray((activeStep as any).filters) ? (activeStep as any).filters.length : 0) : 0;
                return (
                  <div className={fullPageBundleStyles.sideCard}>
                    <s-stack direction="block" gap="small">
                      <s-heading>Step Summary</s-heading>
                      <s-text color="subdued">Select product here will be displayed on this step</s-text>
                      <div className={fullPageBundleStyles.summaryList}>
                        <div className={fullPageBundleStyles.summaryItem}>
                          <s-icon type="product" />
                          <span className={fullPageBundleStyles.summaryLabel}>Selected products</span>
                          <span className={productCount > 0 ? fullPageBundleStyles.summaryValueActive : fullPageBundleStyles.summaryValue}>
                            {productCount > 0 ? productCount : "—"}
                          </span>
                        </div>
                        <div className={fullPageBundleStyles.summaryItem}>
                          <s-icon type="note" />
                          <span className={fullPageBundleStyles.summaryLabel}>Rules</span>
                          <span className={rulesCount > 0 ? fullPageBundleStyles.summaryValueActive : fullPageBundleStyles.summaryValue}>
                            {rulesCount > 0 ? rulesCount : "None"}
                          </span>
                        </div>
                        <div className={fullPageBundleStyles.summaryItem}>
                          <s-icon type="filter" />
                          <span className={fullPageBundleStyles.summaryLabel}>Filters</span>
                          <span className={filtersCount > 0 ? fullPageBundleStyles.summaryValueActive : fullPageBundleStyles.summaryValue}>
                            {filtersCount > 0 ? filtersCount : "None"}
                          </span>
                        </div>
                        <div className={fullPageBundleStyles.summaryItem}>
                          <s-icon type="search" />
                          <span className={fullPageBundleStyles.summaryLabel}>Search Bar</span>
                          <span className={searchBarEnabled ? fullPageBundleStyles.summaryValueActive : fullPageBundleStyles.summaryValue}>
                            {searchBarEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                      <div className={fullPageBundleStyles.previewButtonWrap}>
                        <s-button variant="primary" icon="view" onClick={() => { void handlePreviewBundle(); }}>
                          Preview
                        </s-button>
                      </div>
                    </s-stack>
                  </div>
                );
              })()}

            </s-stack>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {activeSection === "step_setup" && (
              <div data-tour-target="fpb-step-setup">
                {/* Step Chip Navigation */}
                <div className={fullPageBundleStyles.stepNav}>
                  {stepsState.steps.map((step, i) => (
                    <button
                      key={step.id}
                      className={activeTabIndex === i ? fullPageBundleStyles.stepChipActive : fullPageBundleStyles.stepChip}
                      onClick={() => navigateToStep(i)}
                    >
                      {step.name || `Step ${i + 1}`}
                      {stepsState.steps.length > 1 && activeTabIndex === i && (
                        <span
                          style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteStep(step.id); }}
                          title="Remove this step"
                        >
                          ✕
                        </span>
                      )}
                    </button>
                  ))}
                  <button className={fullPageBundleStyles.addStepBtn} onClick={handleAddNewStep}>
                    + Add Step
                  </button>
                </div>

                {/* Animated per-step content */}
                {stepsState.steps.map((step, index) => activeTabIndex === index && (
                  <div
                    key={`${step.id}-${slideKey}`}
                    className={slideDir === "forward" ? fullPageBundleStyles.slideForward : slideDir === "backward" ? fullPageBundleStyles.slideBackward : ""}
                  >
                    {/* ── Step Configuration card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <div className={fullPageBundleStyles.cardHeader}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Step Configuration</h3>
                        {shopLocales.length > 0 && (
                          <s-button
                            variant="secondary"
                            icon="globe"
                            onClick={() => setIsStepLocaleModalOpen(true)}
                          >
                            Multi Language
                          </s-button>
                        )}
                      </div>
                      <div className={fullPageBundleStyles.stepConfigRow}>
                        {/* Icon column */}
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
                            {showIconPickerForStep === step.id ? "Close picker" : "Upload Icon"}
                          </s-button>
                          <s-text color="subdued">512×512 px · PNG/SVG</s-text>
                        </div>
                        {/* Fields column */}
                        <div className={fullPageBundleStyles.fieldsColumn}>
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
                          <div>
                            <s-text-field
                              label="Product Page Title"
                              placeholder="Eg:- Customized T-shirt Bundle for you"
                              value={(step as any).pageTitle ?? ""}
                              onInput={(e: Event) => {
                                stepsState.updateStepField(step.id, 'pageTitle', (e.target as HTMLInputElement).value);
                                markAsDirty();
                              }}
                              autoComplete="off"
                            />
                            <s-text color="subdued">
                              This text will appear as the page header right after the navigation bar.
                            </s-text>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Select Product card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Select Product</h3>
                      <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6d7175" }}>Select product or collection to show in step</p>
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
                            Select product here will be displayed on this step
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
                            Collections selected here will be displayed on this step
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
                    </div>

                    {/* ── Rules card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Rules</h3>
                      <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6d7175" }}>
                        Define conditions for product selection and quantity limits.
                      </p>
                      {(conditionsState.stepConditions[step.id] || []).length === 0 ? (
                        <div className={fullPageBundleStyles.emptyState}>No rules defined yet</div>
                      ) : (
                        <div className={fullPageBundleStyles.rulesList}>
                          {(conditionsState.stepConditions[step.id] || []).map((rule: any, ruleIndex: number) => (
                            <div key={rule.id} className={fullPageBundleStyles.ruleRow}>
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
                              <s-button
                                variant="plain"
                                onClick={() => conditionsState.removeConditionRule(step.id, rule.id)}
                              >
                                <s-icon type="x" />
                              </s-button>
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

                    {/* ── Advanced Step Options card ── */}
                    <div className={fullPageBundleStyles.card}>
                      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Advanced Step Options</h3>
                      <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6d7175" }}>
                        Configure step type, free gift behaviour, and pre-selection settings.
                      </p>

                      {/* Step type selector */}
                      <s-stack direction="block" gap="small">
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>Step type</span>
                        {[
                          { label: 'Regular Step', value: 'regular' },
                          { label: 'Add-On / Upsell Step', value: 'addon' },
                        ].map(choice => (
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
                              markAsDirty();
                            }}
                          >
                            {choice.label}
                          </s-checkbox>
                        ))}
                      </s-stack>

                      {step.isFreeGift && (
                        <s-stack direction="block" gap="small" style={{ marginTop: 16, paddingLeft: 12, borderLeft: "2px solid #e5e7eb" }}>
                          <s-text-field
                            label="Step label (tab name)"
                            placeholder="Add-Ons"
                            helpText="Shown in the bundle step navigator tab."
                            maxLength={40}
                            value={step.addonLabel ?? (step.freeGiftName || '')}
                            onInput={(e: Event) => { stepsState.updateStepField(step.id, 'addonLabel', (e.target as HTMLInputElement).value); markAsDirty(); }}
                            autoComplete="off"
                          />
                          <s-text-field
                            label="Step title (panel heading)"
                            placeholder="Pick a free gift!"
                            helpText="Shown as the heading inside the step panel."
                            value={step.addonTitle || ''}
                            onInput={(e: Event) => { stepsState.updateStepField(step.id, 'addonTitle', (e.target as HTMLInputElement).value); markAsDirty(); }}
                            autoComplete="off"
                          />
                          <s-checkbox
                            checked={step.addonDisplayFree !== false || undefined}
                            onChange={(e: Event) => { stepsState.updateStepField(step.id, 'addonDisplayFree', (e.target as HTMLInputElement).checked); markAsDirty(); }}
                          >
                            Display products as free ($0.00)
                          </s-checkbox>
                          <s-checkbox
                            checked={step.addonUnlockAfterCompletion !== false || undefined}
                            onChange={(e: Event) => { stepsState.updateStepField(step.id, 'addonUnlockAfterCompletion', (e.target as HTMLInputElement).checked); markAsDirty(); }}
                          >
                            Unlock after bundle completion
                          </s-checkbox>
                        </s-stack>
                      )}

                      <s-divider style={{ marginTop: 16, marginBottom: 16 }} />

                      {/* Mandatory default product */}
                      <s-checkbox
                        checked={step.isDefault === true || undefined}
                        onChange={(e: Event) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          stepsState.updateStepField(step.id, 'isDefault', checked);
                          if (!checked) stepsState.updateStepField(step.id, 'defaultVariantId', '');
                          markAsDirty();
                        }}
                      >
                        Mandatory default product
                      </s-checkbox>

                      {step.isDefault && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                          <s-text-field
                            label="Default variant GID"
                            placeholder="gid://shopify/ProductVariant/123456789"
                            helpText="Paste the Shopify variant GID. It must be one of the products added to this step."
                            value={step.defaultVariantId || ''}
                            onInput={(e: Event) => { stepsState.updateStepField(step.id, 'defaultVariantId', (e.target as HTMLInputElement).value); markAsDirty(); }}
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
                                    onClick={() => { stepsState.updateStepField(step.id, 'defaultVariantId', v.id || v.gid); markAsDirty(); }}
                                  >
                                    {sp.title}{v.title && v.title !== 'Default Title' ? ` · ${v.title}` : ''} — {v.id || v.gid}
                                  </s-button>
                                ))
                              )}
                            </s-stack>
                          )}
                        </div>
                      )}

                      <s-divider style={{ marginTop: 16, marginBottom: 16 }} />

                      {/* Clone / Delete step */}
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
                    </div>
                  </div>
                ))}
              </div>
            )}


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
                        Set up to 4 discount rules, applied from lowest to highest.
                      </p>
                    </s-stack>
                    <s-switch
                      checked={pricingState.discountEnabled || undefined}
                      onChange={(e: Event) => pricingState.setDiscountEnabled((e.target as HTMLInputElement).checked)}
                    >
                      Enable
                    </s-switch>
                  </s-stack>

                  {/* Q5: Blue info box */}
                  <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#e8f4fd', borderRadius: 6, border: '1px solid #c4dff5' }}>
                    <s-icon name="info" style={{ color: '#0870d9', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0, fontSize: 13, color: '#0c4a82', lineHeight: 1.5 }}>
                      Discounts are applied at checkout via Shopify&apos;s cart transform. Rules stack from lowest to highest threshold — the highest qualifying rule wins.
                    </p>
                  </div>

                  {/* Q2: Discount Type — always visible, grayed when disabled */}
                  <div style={{ opacity: pricingState.discountEnabled ? 1 : 0.45, pointerEvents: pricingState.discountEnabled ? 'auto' : 'none' }}>
                    <s-select
                      value={pricingState.discountType}
                      onChange={(e: Event) => {
                        pricingState.setDiscountType((e.target as HTMLSelectElement).value as DiscountMethod);
                        pricingState.setDiscountRules([]);
                        setRuleMessages({});
                      }}
                    >
                      {[...DISCOUNT_METHOD_OPTIONS].map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
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

                            {/* Condition Section */}
                            <s-stack direction="block" gap="small-100">
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>When:</p>
                              <s-stack direction="inline" gap="small-100">
                                <s-select
                                  value={rule.condition.type}
                                  onChange={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                    condition: { ...rule.condition, type: (e.target as HTMLSelectElement).value as any }
                                  })}
                                >
                                  <option value="" disabled>Type</option>
                                  {[...DISCOUNT_CONDITION_TYPE_OPTIONS].map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </s-select>
                                <s-select
                                  value={rule.condition.operator}
                                  onChange={(e: Event) => pricingState.updateDiscountRule(rule.id, {
                                    condition: { ...rule.condition, operator: (e.target as HTMLSelectElement).value as any }
                                  })}
                                >
                                  <option value="" disabled>Operator</option>
                                  {[...DISCOUNT_OPERATOR_OPTIONS].map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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

                  {/* Discount Messaging — only when enabled */}
                  {pricingState.discountEnabled && (
                    <s-stack direction="block" gap="small">
                      <s-stack direction="inline">
                        <s-stack direction="block" gap="small-400" style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                            Discount Messaging
                          </h4>
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

                      {/* Q6: Compact variables reference (replaces verbose accordion) */}
                      <div style={{ padding: '10px 12px', background: '#f6f6f7', borderRadius: 6 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#443f3f' }}>Template variables:</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                          {([
                            ['{{conditionText}}', 'Threshold ("2 items", "₹100")'],
                            ['{{discountText}}',  'Discount ("20% off", "₹50 off")'],
                            ['{{bundleName}}',    'Bundle name'],
                            ['{{progressPercentage}}', 'Progress 0–100'],
                            ['{{amountNeeded}}',  'Spend still needed'],
                            ['{{itemsNeeded}}',   'Items still needed'],
                          ] as [string, string][]).map(([v, desc]) => (
                            <div key={v} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                              <code style={{ fontSize: 11, background: '#e3e5e7', padding: '1px 4px', borderRadius: 3, color: '#202223', flexShrink: 0, whiteSpace: 'nowrap' }}>{v}</code>
                              <span style={{ fontSize: 11, color: '#6d7175' }}>{desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic rule-based messaging */}
                      {pricingState.discountMessagingEnabled && (Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).length > 0 && (
                        <s-stack direction="block" gap="small">
                          {(Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).map((rule: any, index: number) => (
                            <s-stack key={rule.id} direction="block" gap="small">
                              <s-section>
                                <s-stack direction="block" gap="small-100">
                                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                                    Rule #{index + 1} Messages
                                  </h4>
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

                      {/* Show message when no rules exist */}
                      {pricingState.discountMessagingEnabled && pricingState.discountRules.length === 0 && (
                        <s-section>
                          <s-stack direction="block" gap="small-100">
                            <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>
                              Add discount rules to configure messaging
                            </p>
                          </s-stack>
                        </s-section>
                      )}
                    </s-stack>
                  )}
                </s-stack>
              </s-section>

              {/* Q3: Display Options — separate always-visible card, grayed when discount off */}
              <s-section>
                <div style={{ opacity: pricingState.discountEnabled ? 1 : 0.45, pointerEvents: pricingState.discountEnabled ? 'auto' : 'none' }}>
                  <s-stack direction="block" gap="small">
                    <s-stack direction="block" gap="small-400">
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Display Options</h4>
                      <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                        Control which discount elements are shown in the bundle widget.
                      </p>
                    </s-stack>
                    <s-checkbox
                      checked={pricingState.showFooter || undefined}
                      onChange={(e: Event) => pricingState.setShowFooter((e.target as HTMLInputElement).checked)}
                    >
                      Show footer
                    </s-checkbox>
                    <s-checkbox
                      checked={pricingState.showDiscountProgressBar || undefined}
                      onChange={(e: Event) => pricingState.setShowDiscountProgressBar((e.target as HTMLInputElement).checked)}
                    >
                      Progress bar
                    </s-checkbox>
                  </s-stack>
                </div>
              </s-section>
              </s-stack>
              </div>
            )}

            {activeSection === "images_gifs" && (
              <div data-tour-target="fpb-design-settings">
              <s-stack direction="block" gap="base">

                {/* Storefront Page — moved here from sidebar */}
                {bundle.bundleType === 'full_page' && (
                  <s-section>
                    <s-stack direction="block" gap="small">
                      <s-stack direction="inline" gap="small">
                        <s-icon name="globe" />
                        <s-stack direction="block" gap="small-400" style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Storefront Page</h3>
                          <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                            The URL where this bundle lives on your store. Rename it here — changes take effect on save.
                          </p>
                        </s-stack>
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
                        helpText={`Preview: ${pageUrlPreview}`}
                        error={pageSlugError ?? undefined}
                        autoComplete="off"
                      />
                    </s-stack>
                  </s-section>
                )}

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
                        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e1e3e5", marginBottom: 16 }}>
                          {stepsState.steps.map((step, i) => (
                            <button
                              key={`asset-step-${step.id}`}
                              onClick={() => setActiveAssetTabIndex(i)}
                              style={{
                                padding: "8px 16px",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: activeAssetTabIndex === i ? 600 : 400,
                                color: activeAssetTabIndex === i ? "#202223" : "#6d7175",
                                borderBottom: activeAssetTabIndex === i ? "2px solid #202223" : "2px solid transparent",
                                marginBottom: -1,
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
                      <s-tooltip content="This setting controls the loading animation visible to shoppers on your storefront">
                        <s-badge tone="magic">Storefront</s-badge>
                      </s-tooltip>
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

            {activeSection === "bundle_settings" && (
              <div data-tour-target="fpb-bundle-visibility">
              <s-stack direction="block" gap="base">
                <div style={{ padding: "var(--s-space-400)", background: "var(--s-color-bg-surface-secondary, #f6f6f7)", borderRadius: 8 }}>
                  <s-stack direction="inline" gap="small-100">
                    <s-icon name="note" />
                    <s-stack direction="block" gap="small-400">
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Bundle Settings</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Control how this bundle behaves on the storefront.</p>
                    </s-stack>
                  </s-stack>
                </div>
                <s-section>
                  <s-stack direction="block" gap="base">
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Display</h3>
                    <s-checkbox
                      checked={showProductPrices || undefined}
                      helpText="Display the price of each product on its card."
                      onChange={(e: Event) => { setShowProductPrices((e.target as HTMLInputElement).checked); markAsDirty(); }}
                    >Show product prices</s-checkbox>
                    <s-checkbox
                      checked={showCompareAtPrices || undefined}
                      helpText="Show the original (strike-through) price next to the sale price."
                      onChange={(e: Event) => { setShowCompareAtPrices((e.target as HTMLInputElement).checked); markAsDirty(); }}
                    >Show compare-at prices</s-checkbox>
                    <s-checkbox
                      checked={allowQuantityChanges || undefined}
                      helpText="Let customers adjust the quantity of individual products within the bundle."
                      onChange={(e: Event) => { setAllowQuantityChanges((e.target as HTMLInputElement).checked); markAsDirty(); }}
                    >Allow quantity changes</s-checkbox>
                  </s-stack>
                </s-section>
                <s-section>
                  <s-stack direction="block" gap="base">
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Cart behaviour</h3>
                    <s-checkbox
                      checked={cartRedirectToCheckout || undefined}
                      helpText="Takes customers directly to checkout instead of the cart page when they click Add to Bundle."
                      onChange={(e: Event) => { setCartRedirectToCheckout((e.target as HTMLInputElement).checked); markAsDirty(); }}
                    >Redirect to checkout after adding to cart</s-checkbox>
                  </s-stack>
                </s-section>
              </s-stack>
              </div>
            )}

            {activeSection === "messages" && (() => {
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
                { key: "addToCartButton",  label: "Add to Cart button",   placeholder: "Add to Cart",  helpText: 'Shown in the footer and mobile bar when the bundle is complete.' },
                { key: "nextButton",       label: "Next Step button",     placeholder: "Next",         helpText: 'Footer button to advance to the next step.' },
                { key: "doneButton",       label: "Done button",          placeholder: "Done",         helpText: 'Shown on the last step in the modal navigator.' },
                { key: "freeBadge",        label: "Free gift badge",      placeholder: "Free",         helpText: 'Badge shown on free-gift product cards.' },
                { key: "includedBadge",    label: "Included badge",       placeholder: "Included",     helpText: 'Badge shown on product cards that are already in the bundle.' },
                { key: "yourBundle",       label: "Sidebar title",        placeholder: "Your Bundle",  helpText: 'Heading of the selected-products sidebar / bottom sheet.' },
              ];
              return (
                <s-stack direction="block" gap="base">
                  <div style={{ padding: "var(--s-space-400)", background: "var(--s-color-bg-surface-secondary, #f6f6f7)", borderRadius: 8 }}>
                    <s-stack direction="inline" gap="small-100">
                      <s-icon name="note" />
                      <s-stack direction="block" gap="small-400">
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Widget Text</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>Customise the text shown to customers in the bundle widget.</p>
                      </s-stack>
                    </s-stack>
                  </div>
                  {localeOptions.length > 1 && (
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Language</h3>
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>Select a language to customise strings for that locale.</p>
                        <s-select
                          label="Editing language"
                          value={textOverridesLocale}
                          onChange={(e: Event) => setTextOverridesLocale((e.target as HTMLSelectElement).value)}
                        >
                          {localeOptions.map(opt => (
                            <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                          ))}
                        </s-select>
                      </s-stack>
                    </s-section>
                  )}
                  <s-section>
                    <s-stack direction="block" gap="base">
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                        Widget labels{!isEnglish ? ` — ${localeOptions.find((o) => o.value === textOverridesLocale)?.label ?? textOverridesLocale}` : ""}
                      </h3>
                      {!isEnglish && (
                        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>Leave a field blank to fall back to the English default.</p>
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
                  </s-section>
                </s-stack>
              );
            })()}
          </div>
        </div>
      </form>

      {/* Steps + Tiers Conflict Warning Modal */}
      <s-modal ref={stepsTiersModalRef} heading="Steps and Pricing Tiers conflict">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>Using both steps and pricing tiers creates a confusing experience for shoppers.</strong>
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Pricing tier pills work best with a <strong>single-step flat-grid bundle</strong> (e.g. pick any 3 products).
            Your bundle has <strong>{stepsState.steps.length} steps</strong> configured, which guides shoppers through a sequential flow.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Continuing will configure tiers alongside steps. Consider reducing to 1 step for the best flat-grid BYOB experience.
          </p>
        </s-stack>
        <s-button slot="primaryAction" variant="primary" onClick={() => { stepsTiersWarning.onConfirm?.(); setStepsTiersWarning({ open: false, onConfirm: null }); }}>
          Continue anyway
        </s-button>
        <s-button slot="secondaryActions" onClick={() => setStepsTiersWarning({ open: false, onConfirm: null })}>
          Cancel
        </s-button>
      </s-modal>

      {/* Page Selection Modal */}
      <s-modal ref={pageSelectionModalRef} heading="Add to Storefront">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            {bundle.bundleType === 'full_page'
              ? "Select the bundle page — we'll install the widget automatically. No Theme Editor needed."
              : 'Select a template to open the Theme Editor with widget placement.'}
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
                    {isInstallingWidget ? 'Installing…' : 'Select'}
                  </s-button>
                </div>
              ))}
            </s-stack>
          ) : (
            <s-stack direction="block" gap="small">
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                {bundle.bundleType === 'full_page' ? 'No pages available' : 'No templates available'}
              </p>
              <s-button href="https://admin.shopify.com/admin/pages" target="_blank">Create Page</s-button>
            </s-stack>
          )}
        </s-stack>
        <s-button slot="secondaryActions" disabled={isInstallingWidget || undefined} onClick={() => closePageSelectionModal()}>
          Cancel
        </s-button>
      </s-modal>

      {/* Selected Products Modal */}
      <s-modal ref={productsModalRef} heading="Selected Products">
        {(() => {
          const currentStep = stepsState.steps.find(step => step.id === currentModalStepId);
          const selectedProducts = currentStep?.StepProduct || [];
          return selectedProducts.length > 0 ? (
            <s-stack direction="block" gap="small">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for this step:
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
      <s-modal ref={collectionsModalRef} heading="Selected Collections">
        {(() => {
          const collections = selectedCollections[currentModalStepId] || [];
          return collections.length > 0 ? (
            <s-stack direction="block" gap="small">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                {collections.length} collection{collections.length !== 1 ? 's' : ''} selected for this step:
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

      {/* Sync Bundle Confirmation Modal */}
      <s-modal ref={syncModalRef} heading="Sync Bundle?">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14 }}>This will delete and re-create all Shopify data for this bundle:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>The Shopify page will be deleted and re-created</li>
            <li>All bundle and component metafields will be rewritten</li>
          </ul>
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>Bundle analytics are preserved. This action cannot be undone.</p>
        </s-stack>
        <s-button slot="primaryAction" variant="primary" loading={fetcher.state === 'submitting' || undefined} onClick={handleSyncBundleConfirm}>
          Sync Bundle
        </s-button>
        <s-button slot="secondaryActions" onClick={() => setIsSyncModalOpen(false)}>Cancel</s-button>
      </s-modal>

      </div>
    </>
  );
}
