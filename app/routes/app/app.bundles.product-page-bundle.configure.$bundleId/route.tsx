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

declare global {
  interface Window {
    shopify?: { config?: { shop?: string } };
  }
}


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
  { id: "step_setup", label: "Step Setup", iconName: "list-numbered-minor" },
  { id: "discount_pricing", label: "Discount & Pricing", iconName: "discount-minor" },
  { id: "images_gifs", label: "Bundle Assets", iconName: "image-alt-minor" },
  { id: "bundle_settings", label: "Bundle Settings", iconName: "image-alt-minor" },
  { id: "messages", label: "Messages", iconName: "list-numbered-minor" },
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
  const [showCompareAtPrices, setShowCompareAtPrices] = useState<boolean>((bundle as any).showCompareAtPrices ?? false);
  const [cartRedirectToCheckout, setCartRedirectToCheckout] = useState<boolean>((bundle as any).cartRedirectToCheckout ?? false);
  const [allowQuantityChanges, setAllowQuantityChanges] = useState<boolean>((bundle as any).allowQuantityChanges ?? true);
  const [sdkMode, setSdkMode] = useState<boolean>((bundle as any).sdkMode ?? false);

  // Text overrides state (Messages tab)
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>(
    ((bundle as any).textOverrides as Record<string, string>) ?? {}
  );
  const [textOverridesByLocale, setTextOverridesByLocale] = useState<Record<string, Record<string, string>>>(
    ((bundle as any).textOverridesByLocale as Record<string, Record<string, string>>) ?? {}
  );
  const [textOverridesLocale, setTextOverridesLocale] = useState<string>("en");

  // Sync Bundle modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

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
        ruleMessages
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
          // Update discard baseline for fields managed outside the hook
          originalLoadingGifRef.current = loadingGif;
          // Mark state as saved (updates baseline ref and resets dirty flag)
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

  // Discard handler - resets hook state and local gif state
  const handleDiscard = useCallback(() => {
    hookHandleDiscard();
    setLoadingGif(originalLoadingGifRef.current);
  }, [hookHandleDiscard]);

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
  }, [isDirty, shopify]);

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
      (syncModalRef.current as any)?.show();
    } else {
      (syncModalRef.current as any)?.hide();
    }
  }, [isSyncModalOpen]);

  useEffect(() => {
    if (isPageSelectionModalOpen) {
      (pageSelectionModalRef.current as any)?.show();
    } else {
      (pageSelectionModalRef.current as any)?.hide();
    }
  }, [isPageSelectionModalOpen]);

  useEffect(() => {
    if (isProductsModalOpen) {
      (productsModalRef.current as any)?.show();
    } else {
      (productsModalRef.current as any)?.hide();
    }
  }, [isProductsModalOpen]);

  useEffect(() => {
    if (isCollectionsModalOpen) {
      (collectionsModalRef.current as any)?.show();
    } else {
      (collectionsModalRef.current as any)?.hide();
    }
  }, [isCollectionsModalOpen]);

  return (
    <>
      <ui-title-bar title={`Configure: ${formState.bundleName}`}>
        <button variant="breadcrumb" onClick={handleBackClick}>Dashboard</button>
        <button
          variant="primary"
          onClick={widgetInstalled ? handlePreviewBundle : handleAddToStorefront}
          disabled={(!bundleProduct || stepsState.steps.length === 0 || (!widgetInstalled && isDirty)) || undefined}
        >
          {widgetInstalled ? "Preview Bundle" : "Add to Storefront"}
        </button>
        <button
          onClick={() => {
            const productHandle = bundle.shopifyProductHandle;
            const previewParam = productHandle ? `&previewPath=${encodeURIComponent(`/products/${productHandle}`)}` : '';
            const editorUrl = widgetInstalled
              ? `https://${shop}/admin/themes/current/editor?template=product${previewParam}`
              : `https://${shop}/admin/themes/current/editor?template=product&addAppBlockId=${apiKey}/${blockHandle}&target=newAppsSection${previewParam}`;
            window.open(editorUrl, '_blank');
          }}
        >
          Open in Theme Editor
        </button>
        <button
          onClick={() => {
            if (isDirty) {
              shopify.toast.show("Save your changes before syncing", { isError: true });
              return;
            }
            if (fetcher.state !== 'idle') return;
            setIsSyncModalOpen(true);
          }}
        >
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
          discountMessagingEnabled: pricingState.discountMessagingEnabled,
          ruleMessages
        })} />
        <input type="hidden" name="stepConditions" value={JSON.stringify(conditionsState.stepConditions)} />

        <AppEmbedBanner appEmbedEnabled={appEmbedEnabled} themeEditorUrl={themeEditorUrl} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, alignItems: "start" }}>

          {/* Left Sidebar */}
          <s-stack direction="block" gap="base">
              {/* Bundle Setup Navigation Card */}
              <s-section>
                <s-stack direction="block" gap="small">
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                    Bundle Setup
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                    Set-up your bundle builder
                  </p>

                  <s-stack direction="block" gap="small-400">
                    {bundleSetupItems.map((item) => (
                      <s-button
                        key={item.id}
                        variant={activeSection === item.id ? "primary" : "tertiary"}
                        style={{ width: "100%", textAlign: "start" }}
                        onClick={() => handleSectionChange(item.id)}
                      >
                        <s-icon name={item.iconName} />
                        {item.label}
                      </s-button>
                    ))}
                  </s-stack>
                </s-stack>
              </s-section>

              {/* Bundle Product Card - Memoized to prevent unnecessary re-renders */}
              <BundleProductCard
                bundleProduct={bundleProduct}
                productImageUrl={productImageUrl}
                productTitle={productTitle}
                shop={shop}
                onSync={handleSyncProduct}
                onSelect={handleBundleProductSelect}
              />

              {/* Bundle Status Card */}
              <s-section>
                <s-stack direction="block" gap="small">
                  <BundleStatusSection
                    status={formState.bundleStatus}
                    onChange={formState.setBundleStatus}
                  />
                </s-stack>
              </s-section>

          </s-stack>

          {/* Main Content Area */}
          <div>
            {activeSection === "step_setup" && (
              <s-section>
                <s-stack direction="block" gap="base">
                  <s-stack direction="block" gap="small-100">
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                      Bundle Steps
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                      Create steps for your multi-step bundle here. Select product options for each step below
                    </p>
                  </s-stack>

                  {/* Steps List */}
                  <s-stack direction="block" gap="small">
                    {stepsState.steps.map((step, index) => (
                      <s-section key={step.id}>
                        <div
                          data-step-id={step.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, step.id, index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`${productPageBundleStyles.stepCard} ${
                            draggedStep === step.id ? productPageBundleStyles.stepCardDragging : ''
                          } ${
                            dragOverIndex === index && draggedStep !== step.id ? productPageBundleStyles.stepCardDragOver : ''
                          }`}
                        >
                          <s-stack direction="block" gap="small">
                            {/* Step Header */}
                            <s-stack direction="inline" gap="small" style={{ justifyContent: "space-between", alignItems: "center" }}>
                              <s-stack direction="inline" gap="small-100" style={{ alignItems: "center" }}>
                                <s-icon name="drag-handle-minor" />
                                <p style={{ margin: 0, fontSize: 14 }}>
                                  Step {index + 1}
                                </p>
                              </s-stack>

                              <s-stack direction="inline" gap="small-400">
                                <s-button
                                  variant="tertiary"
                                  onClick={() => cloneStep(step.id)}
                                  aria-label="Clone step"
                                >
                                  <s-icon name="duplicate-minor" />
                                </s-button>
                                <s-button
                                  variant="tertiary"
                                  tone="critical"
                                  onClick={() => deleteStep(step.id)}
                                  aria-label="Delete step"
                                >
                                  <s-icon name="delete-minor" />
                                </s-button>
                                <s-button
                                  variant="tertiary"
                                  onClick={() => stepsState.toggleStepExpansion(step.id)}
                                  aria-label={stepsState.expandedSteps.has(step.id) ? "Collapse step" : "Expand step"}
                                >
                                  <s-icon name={stepsState.expandedSteps.has(step.id) ? "chevron-up-minor" : "chevron-down-minor"} />
                                </s-button>
                              </s-stack>
                            </s-stack>

                            {/* Expanded Step Content */}
                            <div style={{ display: stepsState.expandedSteps.has(step.id) ? "block" : "none" }}>
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

                                {/* Products/Collections Tabs */}
                                <s-stack direction="block" gap="small">
                                  <div>
                                    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e1e3e5", marginBottom: 16 }}>
                                      {[
                                        { id: 'products', content: `Products${step.StepProduct && step.StepProduct.length > 0 ? ` (${stepsState.getUniqueProductCount(step.StepProduct)})` : ''}` },
                                        { id: 'collections', content: 'Collections' },
                                      ].map((tab, i) => (
                                        <button
                                          key={tab.id}
                                          onClick={() => stepsState.setSelectedTab(i)}
                                          style={{
                                            padding: "8px 16px",
                                            border: "none",
                                            background: "none",
                                            cursor: "pointer",
                                            fontSize: 14,
                                            fontWeight: stepsState.selectedTab === i ? 600 : 400,
                                            color: stepsState.selectedTab === i ? "#202223" : "#6d7175",
                                            borderBottom: stepsState.selectedTab === i ? "2px solid #202223" : "2px solid transparent",
                                            marginBottom: -1,
                                          }}
                                        >
                                          {tab.content}
                                        </button>
                                      ))}
                                    </div>

                                    {stepsState.selectedTab === 0 && (
                                      <s-stack direction="block" gap="small-100">
                                        <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                          Products selected here will be displayed on this step
                                        </p>
                                        <s-stack direction="inline" gap="small-100">
                                          <s-button
                                            variant="primary"
                                            onClick={() => handleProductSelection(step.id)}
                                          >
                                            Add Products
                                          </s-button>
                                          {step.StepProduct && step.StepProduct.length > 0 && (
                                            <s-badge tone="info">
                                              {`${stepsState.getUniqueProductCount(step.StepProduct)} Selected`}
                                            </s-badge>
                                          )}
                                        </s-stack>
                                      </s-stack>
                                    )}

                                    {stepsState.selectedTab === 1 && (
                                      <s-stack direction="block" gap="small-100">
                                        <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                          Collections selected here will be displayed on this step
                                        </p>
                                        <s-stack direction="inline" gap="small-100">
                                          <s-button
                                            variant="primary"
                                            onClick={() => handleCollectionSelection(step.id)}
                                          >
                                            <s-icon name="collection-minor" />
                                            Add Collections
                                          </s-button>
                                          {selectedCollections[step.id]?.length > 0 && (
                                            <s-badge tone="info">
                                              {`${selectedCollections[step.id].length} Selected`}
                                            </s-badge>
                                          )}
                                        </s-stack>

                                        {/* Display selected collections */}
                                        {selectedCollections[step.id]?.length > 0 && (
                                          <s-stack direction="block" gap="small-400">
                                            <span style={{ fontSize: 14, fontWeight: 500 }}>Selected Collections:</span>
                                            <s-stack direction="block" gap="small-400">
                                              {selectedCollections[step.id].map((collection: any) => (
                                                <s-stack key={collection.id} direction="inline" gap="small-100" style={{ alignItems: "center" }}>
                                                  <img
                                                    src={collection.image?.url || "/bundle.png"}
                                                    alt={collection.title}
                                                    style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                                                  />
                                                  <span>{collection.title}</span>
                                                  <s-button
                                                    variant="plain"
                                                    tone="critical"
                                                    onClick={() => {
                                                      setSelectedCollections(prev => ({
                                                        ...prev,
                                                        [step.id]: prev[step.id]?.filter(c => c.id !== collection.id) || []
                                                      }));
                                                    }}
                                                  >
                                                    Remove
                                                  </s-button>
                                                </s-stack>
                                              ))}
                                            </s-stack>
                                          </s-stack>
                                        )}
                                      </s-stack>
                                    )}
                                  </div>
                                </s-stack>

                                {/* Conditions Section */}
                                <s-stack direction="block" gap="small">
                                  <s-stack direction="block" gap="small-400">
                                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                                      Conditions
                                    </h3>
                                    <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                      Create Conditions based on amount or quantity of products added on this step.
                                    </p>
                                    <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                                      Note: Conditions are only valid on this step
                                    </p>
                                  </s-stack>

                                  {/* Existing Condition Rules */}
                                  {(conditionsState.stepConditions[step.id] || []).map((rule: any, ruleIndex: any) => (
                                    <s-section key={rule.id}>
                                      <s-stack direction="block" gap="small-100">
                                        <s-stack direction="inline" style={{ justifyContent: "space-between", alignItems: "center" }}>
                                          <span style={{ fontSize: 14, fontWeight: 500 }}>Condition #{ruleIndex + 1}</span>
                                          <s-button
                                            variant="plain"
                                            tone="critical"
                                            onClick={() => conditionsState.removeConditionRule(step.id, rule.id)}
                                          >
                                            Remove
                                          </s-button>
                                        </s-stack>

                                        <s-stack direction="inline" gap="small-100">
                                          <s-select
                                            label="Condition Type"
                                            onChange={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'type', (e.target as HTMLSelectElement).value)}
                                          >
                                            {[...STEP_CONDITION_TYPE_OPTIONS].map(opt => (
                                              <option key={opt.value} value={opt.value} selected={rule.type === opt.value || undefined}>{opt.label}</option>
                                            ))}
                                          </s-select>
                                          <s-select
                                            label="Operator"
                                            onChange={(e: Event) => conditionsState.updateConditionRule(step.id, rule.id, 'operator', (e.target as HTMLSelectElement).value)}
                                          >
                                            {[...STEP_CONDITION_OPERATOR_OPTIONS].map(opt => (
                                              <option key={opt.value} value={opt.value} selected={rule.operator === opt.value || undefined}>{opt.label}</option>
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
                                        </s-stack>
                                      </s-stack>
                                    </s-section>
                                  ))}

                                  <s-button
                                    variant="tertiary"
                                    style={{ width: "100%" }}
                                    onClick={() => {
                                      if ((conditionsState.stepConditions[step.id] || []).length >= 2) {
                                        shopify.toast.show('A step can have at most 2 conditions', { isError: false });
                                        return;
                                      }
                                      conditionsState.addConditionRule(step.id);
                                    }}
                                  >
                                    <s-icon name="plus-minor" />
                                    Add Rule
                                  </s-button>
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

                              </s-stack>
                            </div>
                          </s-stack>
                        </div>
                      </s-section>
                    ))}

                    {/* Add Step Button */}
                    <s-button
                      variant="plain"
                      style={{ width: "100%" }}
                      onClick={() => {
                        const newStepId = stepsState.addStep();
                        requestAnimationFrame(() => {
                          const el = document.querySelector(`[data-step-id="${newStepId}"]`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        });
                      }}
                    >
                      <s-icon name="plus-minor" />
                      Add Step
                    </s-button>
                  </s-stack>
                </s-stack>
              </s-section>
            )}

            {activeSection === "discount_pricing" && (
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

                      {/* Discount Rules */}
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
            )}

            {activeSection === "images_gifs" && (
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
            )}

            {activeSection === "bundle_settings" && (
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
              </s-stack>
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
                { key: "addToCartButton",  label: "Add Bundle to Cart button",        placeholder: "Add Bundle to Cart",               helpText: 'Main CTA button when the bundle is complete.' },
                { key: "nextButton",       label: "Next Step button",                 placeholder: "Next",                             helpText: 'Button to advance to the next step in the modal.' },
                { key: "doneButton",       label: "Done button",                      placeholder: "Done",                             helpText: 'Shown on the last step.' },
                { key: "freeBadge",        label: "Free gift badge",                  placeholder: "Free",                             helpText: 'Badge shown on free-gift product cards.' },
                { key: "includedBadge",    label: "Included badge",                   placeholder: "Included",                         helpText: 'Badge shown on already-included product cards.' },
                { key: "completeSteps",    label: "Incomplete bundle message",        placeholder: "Complete All Steps to Continue",   helpText: 'Shown on the CTA when not all required steps are complete.' },
                { key: "addingToCart",     label: "Adding to cart message",           placeholder: "Adding to Cart...",                helpText: 'Shown on the CTA while the cart request is in flight.' },
              ];
              return (
                <s-stack direction="block" gap="base">
                  <div style={{ padding: "var(--s-space-400)", background: "#f6f6f7", borderRadius: 8 }}>
                    <s-stack direction="inline" gap="small-100" style={{ alignItems: "center" }}>
                      <s-icon name="list-numbered-minor" />
                      <s-stack direction="block">
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Messages</p>
                        <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                          Customise the text shown to customers in the bundle widget.
                        </p>
                      </s-stack>
                    </s-stack>
                  </div>

                  {localeOptions.length > 1 && (
                    <s-section>
                      <s-stack direction="block" gap="small">
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Language</h3>
                        <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                          Select a language to customise strings for that locale. Customers on English storefronts always use the default values above.
                        </p>
                        <s-select
                          label="Editing language"
                          onChange={(e: Event) => setTextOverridesLocale((e.target as HTMLSelectElement).value)}
                        >
                          {localeOptions.map(opt => (
                            <option key={opt.value} value={opt.value} selected={textOverridesLocale === opt.value || undefined}>{opt.label}</option>
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
                        <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                          Leave a field blank to fall back to the English default.
                        </p>
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

      </div>
    </>
  );
}