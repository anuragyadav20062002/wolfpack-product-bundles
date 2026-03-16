import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, useRevalidator } from "@remix-run/react";
import { AppLogger } from "../../../lib/logger";

// Note: Using Polaris Checkbox component for toggle functionality
// Polaris React v12 doesn't have a dedicated Switch component
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
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Icon,
  Select,
  Badge,
  TextField,
  Tabs,
  Collapsible,
  FormLayout,
  Checkbox,
  Modal,
  Thumbnail,
  List,
  Spinner,
  Divider,
  Box,
} from "@shopify/polaris";
import {
  ViewIcon,
  SettingsIcon,
  DragHandleIcon,
  DeleteIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExternalIcon,
  ProductIcon,
  DuplicateIcon,
  CollectionIcon,
  ListNumberedIcon,
  DiscountIcon,
  RefreshIcon,
  ImageIcon,
  LockIcon,
} from "@shopify/polaris-icons";
import { FilePicker } from "../../../components/design-control-panel/settings/FilePicker";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
// Using modern App Bridge SaveBar with declarative 'open' prop for React-friendly state management
import { authenticate } from "../../../shopify.server";
import db from "../../../db.server";
import { ensurePageBundleIdMetafieldDefinition } from "../../../services/bundles/metafield-sync.server";
import { useBundleConfigurationState } from "../../../hooks/useBundleConfigurationState";
import fullPageBundleStyles from "../../../styles/routes/full-page-bundle-configure.module.css";

// Action handlers - extracted to separate module for better organization
import {
  handleSaveBundle,
  handleUpdateBundleStatus,
  handleSyncProduct,
  handleUpdateBundleProduct,
  handleGetPages,
  handleGetThemeTemplates,
  handleGetCurrentTheme,
  handleEnsureBundleTemplates,
  handleCheckFullPageTemplate,
  handleValidateWidgetPlacement,
} from "./handlers";

// Types - extracted to separate module for better organization
import type {
  BundleStatus,
  LoaderData,
  BundleStatusSectionProps,
} from "./types";


export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const { bundleId } = params;

  if (!bundleId) {
    throw new Response(ERROR_MESSAGES.BUNDLE_ID_REQUIRED, { status: 400 });
  }

  // Ensure PAGE metafield definition exists with PUBLIC_READ storefront access.
  // Without this definition, page.metafields['$app'].bundle_id is always null in Liquid.
  // Fire-and-forget — do not block page load; idempotent if definition already exists.
  ensurePageBundleIdMetafieldDefinition(admin).catch((err: unknown) => {
    console.error("[full-page-bundle] Failed to ensure PAGE metafield definition:", err);
  });

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

  AppLogger.debug('Bundle loaded from database', {
    component: 'bundle-config',
    bundleId: bundle.id,
    operation: 'load'
  }, { stepsCount: bundle.steps.length });

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
  // File: extensions/bundle-builder/blocks/bundle-full-page.liquid
  const blockHandle = 'bundle-full-page';

  return json({
    bundle,
    bundleProduct,
    shop: session.shop,
    apiKey,
    blockHandle,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  try {
    const { session, admin } = await authenticate.admin(request);
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
        return await handleValidateWidgetPlacement(admin, session, bundleId);
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
  { id: "step_setup",       label: "Step Setup",          icon: ListNumberedIcon, fullPageOnly: false },
  { id: "discount_pricing", label: "Discount & Pricing",  icon: DiscountIcon,     fullPageOnly: false },
  { id: "images_gifs",      label: "Images & GIFs",       icon: ImageIcon,        fullPageOnly: true  },
  // Bundle Upsell and Bundle Settings disabled for later release
  // { id: "bundle_upsell", label: "Bundle Upsell", icon: SettingsIcon },
  // { id: "bundle_settings", label: "Bundle Settings", icon: SettingsIcon },
];

// Static status options - imported from centralized constants
const statusOptions = [...BUNDLE_STATUS_OPTIONS];

// Memoized BundleStatusSection component (BundleStatusSectionProps imported from types)
const BundleStatusSection = memo(({ status, onChange }: BundleStatusSectionProps) => (
  <BlockStack gap="200">
    <Text variant="headingSm" as="h4">
      Bundle Status
    </Text>
    <Select
      label="Bundle Status"
      options={statusOptions}
      value={status}
      onChange={(selected: string) => onChange(selected as BundleStatus)}
      labelHidden
    />
  </BlockStack>
));
BundleStatusSection.displayName = 'BundleStatusSection';

export default function ConfigureBundleFlow() {
  const { bundle, bundleProduct: loadedBundleProduct, shop, apiKey, blockHandle } = useLoaderData<LoaderData>();
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

  AppLogger.debug("[DEBUG] Initial step conditions state:", conditionsState.stepConditions);

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
        discountMessagingEnabled: pricingState.discountMessagingEnabled,
        ruleMessages
      }));
      formData.append("stepConditions", JSON.stringify(conditionsState.stepConditions));
      formData.append("bundleProduct", JSON.stringify(bundleProduct));
      formData.append("promoBannerBgImage", promoBannerBgImage ?? "");
      formData.append("promoBannerBgImageCrop", promoBannerBgImageCrop ?? "");
      formData.append("loadingGif", loadingGif ?? "");
      AppLogger.debug("[DEBUG] Submitting step conditions to server:", conditionsState.stepConditions);
      AppLogger.debug("[DEBUG] Submitting bundle product to server:", bundleProduct);

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
    promoBannerBgImage,
    promoBannerBgImageCrop,
    loadingGif,
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
            steps: JSON.stringify(stepsState.steps),
            discountEnabled: pricingState.discountEnabled,
            discountType: pricingState.discountType,
            discountRules: JSON.stringify(pricingState.discountRules),
            showFooter: pricingState.showFooter,
            discountMessagingEnabled: pricingState.discountMessagingEnabled,
            selectedCollections: JSON.stringify(selectedCollections),
            ruleMessages: JSON.stringify(ruleMessages),
            stepConditions: JSON.stringify(conditionsState.stepConditions),
            bundleProduct: bundleProduct || null,
            productStatus: productStatus,
          };

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
            AppLogger.debug('Sync data:', { title, status, lastUpdated, changesDetected });

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
          const installRequired = (result as any).widgetInstallationRequired;
          const installLink = (result as any).widgetInstallationLink;

          if (installRequired && installLink) {
            // First-time setup: open theme editor so merchant can click Save to enable the widget
            shopify.toast.show(
              "Page created! Click Save in the theme editor to activate the widget.",
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

  // Discard handler - resets hook state and local image/crop/gif state
  const handleDiscard = useCallback(() => {
    hookHandleDiscard();
    setPromoBannerBgImage(originalPromoBannerBgImageRef.current);
    setPromoBannerBgImageCrop(originalPromoBannerBgImageCropRef.current);
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

    // FOR FULL-PAGE BUNDLES: Use page URL instead of product URL
    if (bundle.bundleType === 'full_page') {
      if (!bundle.shopifyPageHandle) {
        shopify.toast.show("Bundle page not created yet. Please use 'Add to Storefront' to create the bundle page first.", {
          isError: true,
          duration: 5000
        });
        return;
      }

      // Construct page URL
      const shopDomain = shop.includes('.myshopify.com')
        ? shop.replace('.myshopify.com', '')
        : shop.split('.')[0];

      const pageUrl = `https://${shopDomain}.myshopify.com/pages/${bundle.shopifyPageHandle}`;

      AppLogger.debug('Opening full-page bundle preview:', {
        bundleId: bundle.id,
        pageHandle: bundle.shopifyPageHandle,
        pageUrl
      });

      open(pageUrl, '_blank');
      shopify.toast.show("Bundle page opened in new tab", { isError: false });
      return;
    }

    // FOR PRODUCT-PAGE BUNDLES: Use product URL
    let productUrl = null;
    const productHandle = bundleProduct?.handle || bundle.shopifyProductHandle;

    if (bundleProduct) {
      AppLogger.debug('Bundle product data for preview:', {
        id: bundleProduct.id,
        handle: bundleProduct.handle,
        status: bundleProduct.status,
        publishedOnCurrentPublication: bundleProduct.status === 'ACTIVE',
        onlineStoreUrl: bundleProduct.onlineStoreUrl,
        onlineStorePreviewUrl: bundleProduct.onlineStorePreviewUrl,
        shop: shop
      });

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
        AppLogger.debug(`🔍 [SELECTION_ID] Product: ${p.title}, productId: ${p.productId}, id: ${p.id}, using: ${productGid}`);

        // Check if this product has specific variants selected
        // If variants array exists and has items, include them in selectionIds
        if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
          const variantIds = p.variants.map((v: any) => ({ id: v.id }));
          AppLogger.debug(`🔍 [SELECTION_ID] Product ${p.title} has ${p.variants.length} variants:`, variantIds);
          return {
            id: productGid,
            variants: variantIds
          };
        }

        return { id: productGid };
      });

      AppLogger.debug("🔍 [PRODUCT_SELECTION] Total items in StepProduct:", {}, `${currentProducts.length}`);
      AppLogger.debug("🔍 [PRODUCT_SELECTION] Selection IDs being sent to picker:", {}, `${selectionIds.length}`);
      AppLogger.debug("🔍 [PRODUCT_SELECTION] StepProduct data structure:", {}, currentProducts.length > 0 ? Object.keys(currentProducts[0]) : 'empty');
      AppLogger.debug("🔍 [PRODUCT_SELECTION] StepProduct sample:", {}, JSON.stringify(currentProducts.slice(0, 2), null, 2));
      AppLogger.debug("🔍 [PRODUCT_SELECTION] Selection IDs being sent to resource picker:", {}, JSON.stringify(selectionIds, null, 2));

      AppLogger.debug("🚀 [RESOURCE_PICKER] Opening resource picker with config:", {
        type: "product",
        multiple: true,
        selectionIds: selectionIds
      });

      const products = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: selectionIds,
      });

      AppLogger.debug("✅ [RESOURCE_PICKER] Resource picker closed. Received selection:", {}, products ? "YES" : "NO");

      if (products && products.selection) {
        AppLogger.debug("🔍 [PRODUCT_SELECTION] Previous products count:", {}, currentProducts.length);
        AppLogger.debug("🔍 [PRODUCT_SELECTION] New products count:", {}, products.selection.length);
        AppLogger.debug("🔍 [PRODUCT_SELECTION] Full response from picker:", {}, JSON.stringify(products, null, 2));
        AppLogger.debug("🔍 [PRODUCT_SELECTION] Raw products from resource picker:", {}, JSON.stringify(products.selection.slice(0, 2), null, 2));

        // Transform products to include imageUrl from images array
        const transformedProducts = products.selection.map((product: any) => {
          const imageUrl = product.images?.[0]?.originalSrc || product.images?.[0]?.url || product.image?.url || null;
          AppLogger.debug(`📸 [PRODUCT_SELECTION] Transforming ${product.title}: images array =`, {}, `${JSON.stringify(product.images)} → imageUrl = ${imageUrl}`);
          return {
            ...product,
            imageUrl: imageUrl
          };
        });

        AppLogger.debug("🔍 [PRODUCT_SELECTION] Transformed products with imageUrl:", {}, JSON.stringify(transformedProducts.slice(0, 2), null, 2));

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
      AppLogger.debug("Product selection cancelled or failed:", {}, error as any);
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
      AppLogger.debug("Bundle product selection cancelled or failed:", {}, error as any);
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
        AppLogger.debug("🔍 [COLLECTION_SELECTION] Previous collections count:", {}, currentCollections.length);
        AppLogger.debug("🔍 [COLLECTION_SELECTION] New collections count:", {}, collections.length);

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
      AppLogger.debug("Collection selection cancelled or failed:", {}, error as any);
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
      const formData = new FormData();
      formData.append("intent", "validateWidgetPlacement");
      fetcher.submit(formData, { method: "post" });
    } catch (error) {
      AppLogger.error('Error creating bundle page:', {}, error as any);
      shopify.toast.show("Failed to create bundle page", { isError: true, duration: 5000 });
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
  }, [loadAvailablePages, shopify]);

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
      AppLogger.debug(`🎯 [THEME_EDITOR] Starting widget placement for template: ${template.handle}`);

      // Create a theme template service instance
      // Note: We'll need to refactor this to get admin from a fetcher since this is client-side
      // For now, we'll use the existing approach but add template creation via API call

      // Check if this is a bundle-specific template that needs to be created
      if (template.isBundleContainer && template.bundleProduct) {
        AppLogger.debug(`🏗️ [THEME_EDITOR] Ensuring template exists for bundle product: ${template.bundleProduct.handle}`);

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
        AppLogger.debug(`✅ [THEME_EDITOR] Template preparation result:`, templateResult);

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

      AppLogger.debug(`🔧 [THEME_EDITOR] Using app block ID: ${appBlockId}`, {
        apiKey,
        blockHandle,
        bundleId: bundle.id
      });

      // Generate deep link following Shopify's official documentation with bundle ID
      // Official format: template + addAppBlockId + target + bundleId (for auto-population)
      // See: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/deep-links
      //
      // Adding bundleId parameter allows the widget's Liquid code to auto-detect and populate
      // the bundle_id setting in the theme editor, making setup seamless for merchants
      //
      // For full-page bundles: always use the shared 'page.full-page-bundle' template.
      // All bundle pages are assigned this templateSuffix so the block only needs to be
      // installed once. page.handle in Liquid identifies which bundle to render.
      // For product templates, template format is just: {handle}
      const templateParam = template.isPage ? 'page.full-page-bundle' : template.handle;

      const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${templateParam}&addAppBlockId=${appBlockId}&target=newAppsSection`;

      AppLogger.debug(`🔗 [THEME_EDITOR] Generated deep link with bundleId:`, {
        templateParam,
        isPage: template.isPage,
        bundleId: bundle.id,
        url: themeEditorUrl
      });

      setSelectedPage(template);
      closePageSelectionModal();

      // Open theme editor in a new tab to preserve embedded app session
      shopify.toast.show(`Opening theme editor for "${template.title}". You'll be able to add the bundle widget to your theme.`, { isError: false, duration: 5000 });
      AppLogger.debug(`✅ [THEME_EDITOR] Opening theme editor`);

      // Open in new tab to preserve embedded app session (using _top would destroy iframe)
      window.open(themeEditorUrl, '_blank');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      AppLogger.error('🚨 [THEME_EDITOR] Error in handlePageSelection:', { errorMessage }, error as any);
      shopify.toast.show(`Failed to open theme editor: ${errorMessage}`, { isError: true, duration: 5000 });
    }
  }, [shop, shopify, bundle.id]);

  return (
    <Page
      title={`Configure: ${formState.bundleName}`}
      subtitle="Set up your cart transform bundle configuration"
      backAction={{
        content: "Cart Transform Bundles",
        onAction: handleBackClick,
      }}
      primaryAction={
        bundle.shopifyPageHandle
          ? {
              content: "View on Storefront",
              icon: ExternalIcon,
              onAction: () => {
                const shopDomain = shop.includes('.myshopify.com')
                  ? shop.replace('.myshopify.com', '')
                  : shop;
                const storefrontUrl = `https://${shopDomain}.myshopify.com/pages/${bundle.shopifyPageHandle}`;
                window.open(storefrontUrl, '_blank');
                shopify.toast.show('Opening bundle page on storefront...', { duration: 3000 });
              },
            }
          : {
              content: "Add to Storefront",
              onAction: () => { void handleAddToStorefront(); },
              loading: fetcher.state === 'submitting',
            }
      }
    >
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
          discardConfirmation={true}
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

        <Layout>

          {/* Left Sidebar */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              {/* Bundle Setup Navigation Card */}
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h3">
                    Bundle Setup
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Set-up your bundle builder
                  </Text>

                  <BlockStack gap="100">
                    {bundleSetupItems
                      .filter(item => !item.fullPageOnly || bundle.bundleType === "full_page")
                      .map((item) => (
                        <Button
                          key={item.id}
                          variant={activeSection === item.id ? "primary" : "tertiary"}
                          fullWidth
                          textAlign="start"
                          icon={item.icon}
                          disabled={false}
                          onClick={() => handleSectionChange(item.id)}
                        >
                          {item.label}
                        </Button>
                      ))}
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Bundle Product Card - Only for product-page bundles */}
              {bundle.bundleType !== 'full_page' && (
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingSm" as="h3">
                        Bundle Product
                      </Text>
                      <Button
                        variant="plain"
                        tone="critical"
                        onClick={handleSyncProduct}
                      >
                        Sync Product
                      </Button>
                    </InlineStack>

                    {bundleProduct ? (
                      <BlockStack gap="300">
                        <InlineStack gap="300" blockAlign="center" wrap={false}>
                          <Thumbnail
                            source={productImageUrl || "/bundle.png"}
                            alt={productTitle || "Bundle Product"}
                            size="medium"
                          />
                          <InlineStack gap="200" blockAlign="center" wrap={false}>
                            <Button
                              variant="plain"
                              onClick={() => {
                                const productUrl = `https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${bundleProduct.legacyResourceId || bundleProduct.id?.split('/').pop()}`;
                                open(productUrl, '_blank');
                              }}
                              icon={ExternalIcon}
                            >
                              {productTitle || bundleProduct.title || "Untitled Product"}
                            </Button>
                            <Button
                              variant="tertiary"
                              size="slim"
                              icon={RefreshIcon}
                              onClick={handleBundleProductSelect}
                              accessibilityLabel="Change bundle product"
                            />
                          </InlineStack>
                        </InlineStack>
                      </BlockStack>
                    ) : (
                      <div className={fullPageBundleStyles.productSelectionPlaceholder}>
                        <BlockStack gap="100" inlineAlign="center">
                          <Icon source={ProductIcon} />
                          <Button
                            variant="plain"
                            onClick={handleBundleProductSelect}
                          >
                            Select Bundle Product
                          </Button>
                        </BlockStack>
                      </div>
                    )}

                    {/* Bundle Status Dropdown */}
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h4">
                        Bundle Status
                      </Text>
                      <Select
                        label="Bundle Status"
                        options={statusOptions}
                        value={formState.bundleStatus}
                        onChange={(selected: string) => formState.setBundleStatus(selected as 'active' | 'draft' | 'archived')}
                        labelHidden
                      />
                    </BlockStack>
                  </BlockStack>
                </Card>
              )}

              {/* Bundle Status Card - For full-page bundles */}
              {bundle.bundleType === 'full_page' && (
                <Card>
                  <BundleStatusSection
                    status={formState.bundleStatus}
                    onChange={formState.setBundleStatus}
                  />
                </Card>
              )}

              {/* Layout Selection - For full-page bundles */}
              {bundle.bundleType === 'full_page' && (
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingSm" as="h3">Page Layout</Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Choose where the bundle summary and navigation appears
                    </Text>
                    <BlockStack gap="400">
                      {/* Footer Bottom Option */}
                      <div
                        onClick={() => formState.setFullPageLayout("footer_bottom")}
                        style={{
                          border: formState.fullPageLayout === "footer_bottom"
                            ? "2px solid var(--p-color-border-interactive)"
                            : "1px solid var(--p-color-border-secondary)",
                          borderRadius: "12px",
                          padding: "20px 16px",
                          cursor: "pointer",
                          background: formState.fullPageLayout === "footer_bottom"
                            ? "var(--p-color-bg-surface-selected)"
                            : "var(--p-color-bg-surface)",
                          transition: "border 0.15s, background 0.15s",
                        }}
                      >
                        <BlockStack gap="300" inlineAlign="center">
                          {/* SVG Illustration — Footer Bottom */}
                          <svg width="140" height="96" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1" y="1" width="138" height="94" rx="4" stroke="#D1D5DB" strokeWidth="1" fill="#F9FAFB" />
                            {/* Product grid area */}
                            <rect x="12" y="10" width="24" height="20" rx="2" fill="#E5E7EB" />
                            <rect x="42" y="10" width="24" height="20" rx="2" fill="#E5E7EB" />
                            <rect x="72" y="10" width="24" height="20" rx="2" fill="#E5E7EB" />
                            <rect x="102" y="10" width="24" height="20" rx="2" fill="#E5E7EB" />
                            <rect x="12" y="36" width="24" height="20" rx="2" fill="#E5E7EB" />
                            <rect x="42" y="36" width="24" height="20" rx="2" fill="#E5E7EB" />
                            <rect x="72" y="36" width="24" height="20" rx="2" fill="#E5E7EB" />
                            <rect x="102" y="36" width="24" height="20" rx="2" fill="#E5E7EB" />
                            {/* Bottom footer bar */}
                            <rect x="1" y="68" width="138" height="26" rx="0" fill="#7C3AED" opacity="0.85" />
                            <rect x="12" y="75" width="44" height="4" rx="2" fill="white" opacity="0.8" />
                            <rect x="12" y="82" width="28" height="3" rx="1.5" fill="white" opacity="0.5" />
                            <rect x="96" y="74" width="32" height="14" rx="3" fill="white" opacity="0.7" />
                          </svg>
                          <Text variant="bodyMd" as="p" fontWeight="semibold" alignment="center">
                            Footer at bottom
                          </Text>
                          <Text variant="bodySm" as="p" tone="subdued" alignment="center">
                            Sticky bar at the bottom with summary and navigation
                          </Text>
                        </BlockStack>
                      </div>

                      {/* Footer Side Option */}
                      <div
                        onClick={() => formState.setFullPageLayout("footer_side")}
                        style={{
                          border: formState.fullPageLayout === "footer_side"
                            ? "2px solid var(--p-color-border-interactive)"
                            : "1px solid var(--p-color-border-secondary)",
                          borderRadius: "12px",
                          padding: "20px 16px",
                          cursor: "pointer",
                          background: formState.fullPageLayout === "footer_side"
                            ? "var(--p-color-bg-surface-selected)"
                            : "var(--p-color-bg-surface)",
                          transition: "border 0.15s, background 0.15s",
                        }}
                      >
                        <BlockStack gap="300" inlineAlign="center">
                          {/* SVG Illustration — Sidebar */}
                          <svg width="140" height="96" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1" y="1" width="138" height="94" rx="4" stroke="#D1D5DB" strokeWidth="1" fill="#F9FAFB" />
                            {/* Product grid area (left) */}
                            <rect x="10" y="10" width="22" height="16" rx="2" fill="#E5E7EB" />
                            <rect x="36" y="10" width="22" height="16" rx="2" fill="#E5E7EB" />
                            <rect x="62" y="10" width="22" height="16" rx="2" fill="#E5E7EB" />
                            <rect x="10" y="32" width="22" height="16" rx="2" fill="#E5E7EB" />
                            <rect x="36" y="32" width="22" height="16" rx="2" fill="#E5E7EB" />
                            <rect x="62" y="32" width="22" height="16" rx="2" fill="#E5E7EB" />
                            <rect x="10" y="54" width="22" height="16" rx="2" fill="#E5E7EB" />
                            <rect x="36" y="54" width="22" height="16" rx="2" fill="#E5E7EB" />
                            <rect x="62" y="54" width="22" height="16" rx="2" fill="#E5E7EB" />
                            {/* Side panel (right) */}
                            <rect x="90" y="1" width="49" height="94" rx="0" fill="#7C3AED" opacity="0.85" />
                            <rect x="97" y="12" width="34" height="4" rx="2" fill="white" opacity="0.8" />
                            <rect x="97" y="24" width="34" height="10" rx="2" fill="white" opacity="0.15" />
                            <rect x="97" y="40" width="34" height="10" rx="2" fill="white" opacity="0.15" />
                            <rect x="97" y="56" width="34" height="10" rx="2" fill="white" opacity="0.15" />
                            <rect x="97" y="74" width="34" height="14" rx="3" fill="white" opacity="0.7" />
                          </svg>
                          <Text variant="bodyMd" as="p" fontWeight="semibold" alignment="center">
                            Sidebar panel
                          </Text>
                          <Text variant="bodySm" as="p" tone="subdued" alignment="center">
                            Side panel on the right with summary and navigation
                          </Text>
                        </BlockStack>
                      </div>
                    </BlockStack>
                  </BlockStack>
                </Card>
              )}

            </BlockStack>
          </Layout.Section>

          {/* Main Content Area */}
          <Layout.Section>
            {activeSection === "step_setup" && (
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text variant="headingSm" as="h3">
                          Bundle Tabs
                        </Text>
                        <Text variant="bodyMd" tone="subdued" as="p">
                          Configure each tab of your full-page bundle. Each tab represents a product selection step.
                        </Text>
                      </BlockStack>
                      {/* Progress Indicator */}
                      <Badge tone="info">
                        {`${stepsState.steps.filter(step => step.StepProduct && step.StepProduct.length > 0).length} / ${stepsState.steps.length} Configured`}
                      </Badge>
                    </InlineStack>
                  </BlockStack>

                  {/* Tabs Navigation */}
                  {stepsState.steps.length > 0 && (
                    <Tabs
                      tabs={stepsState.steps.map((step, index) => ({
                        id: step.id,
                        content: step.name || `Tab ${index + 1}`,
                        badge: step.StepProduct && step.StepProduct.length > 0 ? stepsState.getUniqueProductCount(step.StepProduct).toString() : undefined,
                      }))}
                      selected={activeTabIndex}
                      onSelect={setActiveTabIndex}
                    />
                  )}

                  {/* Active Tab Content */}
                  <BlockStack gap="300">
                    {stepsState.steps.map((step, index) => (
                      activeTabIndex === index && (
                      <Card
                        key={step.id}
                        background="bg-surface-secondary"
                      >
                        <BlockStack gap="400">
                          {/* Tab Header */}
                          <InlineStack align="space-between" blockAlign="center" gap="300">
                            <Text variant="bodyLg" fontWeight="semibold" as="p">
                              {step.name || `Tab ${index + 1}`}
                            </Text>

                            <InlineStack gap="100">
                              <Button
                                variant="tertiary"
                                size="micro"
                                icon={DuplicateIcon}
                                onClick={() => cloneStep(step.id)}
                                accessibilityLabel="Clone tab"
                              />
                              <Button
                                variant="tertiary"
                                size="micro"
                                tone="critical"
                                icon={DeleteIcon}
                                onClick={() => deleteStep(step.id)}
                                accessibilityLabel="Delete tab"
                              />
                            </InlineStack>
                          </InlineStack>

                          {/* Tab Content (always visible, no collapse) */}
                          <BlockStack gap="400">
                                {/* Step Name and Page Title */}
                                <FormLayout>
                                  <TextField
                                    label="Step Name"
                                    value={step.name}
                                    onChange={(value) => stepsState.updateStepField(step.id, 'name', value)}
                                    autoComplete="off"
                                  />
                                </FormLayout>

                                {/* Products/Collections Tabs */}
                                <BlockStack gap="300">
                                  <Tabs
                                    tabs={[
                                      {
                                        id: 'products',
                                        content: 'Products',
                                        badge: step.StepProduct && step.StepProduct.length > 0 ? stepsState.getUniqueProductCount(step.StepProduct).toString() : undefined,
                                      },
                                      {
                                        id: 'collections',
                                        content: 'Collections',
                                      },
                                    ]}
                                    selected={stepsState.selectedTab}
                                    onSelect={stepsState.setSelectedTab}
                                  />

                                  {stepsState.selectedTab === 0 && (
                                    <BlockStack gap="200">
                                      <Text as="p" variant="bodyMd" tone="subdued">
                                        Products selected here will be displayed on this step
                                      </Text>
                                      <InlineStack gap="200" align="start">
                                        <Button
                                          variant="primary"
                                          size="medium"
                                          onClick={() => handleProductSelection(step.id)}
                                        >
                                          Add Products
                                        </Button>
                                        {step.StepProduct && step.StepProduct.length > 0 && (
                                          <Badge tone="info">
                                            {`${stepsState.getUniqueProductCount(step.StepProduct)} Selected`}
                                          </Badge>
                                        )}
                                      </InlineStack>
                                    </BlockStack>
                                  )}

                                  {stepsState.selectedTab === 1 && (
                                    <BlockStack gap="200">
                                      <Text as="p" variant="bodyMd" tone="subdued">
                                        Collections selected here will be displayed on this step
                                      </Text>
                                      <InlineStack gap="200" align="start">
                                        <Button
                                          variant="primary"
                                          size="medium"
                                          icon={CollectionIcon}
                                          onClick={() => handleCollectionSelection(step.id)}
                                        >
                                          Add Collections
                                        </Button>
                                        {selectedCollections[step.id]?.length > 0 && (
                                          <Badge tone="info">
                                            {`${selectedCollections[step.id].length} Selected`}
                                          </Badge>
                                        )}
                                      </InlineStack>

                                      {/* Display selected collections */}
                                      {selectedCollections[step.id]?.length > 0 && (
                                        <BlockStack gap="100">
                                          <Text as="h5" variant="bodyMd" fontWeight="medium">
                                            Selected Collections:
                                          </Text>
                                          <BlockStack gap="100">
                                            {selectedCollections[step.id].map((collection: any) => (
                                              <InlineStack key={collection.id} gap="200" blockAlign="center">
                                                <Thumbnail
                                                  source={collection.image?.url || "/bundle.png"}
                                                  alt={collection.title}
                                                  size="small"
                                                />
                                                <Text as="span" variant="bodyMd">{collection.title}</Text>
                                                <Button
                                                  variant="plain"
                                                  size="micro"
                                                  tone="critical"
                                                  onClick={() => {
                                                    setSelectedCollections(prev => ({
                                                      ...prev,
                                                      [step.id]: prev[step.id]?.filter(c => c.id !== collection.id) || []
                                                    }));
                                                  }}
                                                >
                                                  Remove
                                                </Button>
                                              </InlineStack>
                                            ))}
                                          </BlockStack>
                                        </BlockStack>
                                      )}
                                    </BlockStack>
                                  )}
                                </BlockStack>

                                {/* Conditions Section */}
                                <BlockStack gap="300">
                                  <BlockStack gap="100">
                                    <Text variant="headingSm" as="h4">
                                      Conditions
                                    </Text>
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                      Create Conditions based on amount or quantity of products added on this step.
                                    </Text>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                      Note: Conditions are only valid on this step
                                    </Text>
                                  </BlockStack>

                                  {/* Existing Condition Rules */}
                                  {(conditionsState.stepConditions[step.id] || []).map((rule: any, ruleIndex: any) => (
                                    <Card key={rule.id} background="bg-surface-secondary">
                                      <BlockStack gap="200">
                                        <InlineStack align="space-between" blockAlign="center">
                                          <Text as="h5" variant="bodyMd" fontWeight="medium">
                                            Condition #{ruleIndex + 1}
                                          </Text>
                                          <Button
                                            variant="plain"
                                            tone="critical"
                                            onClick={() => conditionsState.removeConditionRule(step.id, rule.id)}
                                          >
                                            Remove
                                          </Button>
                                        </InlineStack>

                                        <InlineStack gap="200" align="start">
                                          <Select
                                            label="Condition Type"
                                            options={[...STEP_CONDITION_TYPE_OPTIONS]}
                                            value={rule.type}
                                            onChange={(value) => conditionsState.updateConditionRule(step.id, rule.id, 'type', value)}
                                          />
                                          <Select
                                            label="Operator"
                                            options={[...STEP_CONDITION_OPERATOR_OPTIONS]}
                                            value={rule.operator}
                                            onChange={(value) => conditionsState.updateConditionRule(step.id, rule.id, 'operator', value)}
                                          />
                                          <TextField
                                            label="Value"
                                            value={rule.value}
                                            onChange={(value) => conditionsState.updateConditionRule(step.id, rule.id, 'value', value)}
                                            autoComplete="off"
                                            type="number"
                                            min="0"
                                          />
                                        </InlineStack>
                                      </BlockStack>
                                    </Card>
                                  ))}

                                  <Button
                                    variant="tertiary"
                                    fullWidth
                                    icon={PlusIcon}
                                    onClick={() => {
                                      if ((conditionsState.stepConditions[step.id] || []).length >= 2) {
                                        shopify.toast.show('A step can have at most 2 conditions', { isError: false });
                                        return;
                                      }
                                      conditionsState.addConditionRule(step.id);
                                    }}
                                  >
                                    Add Rule
                                  </Button>
                                </BlockStack>
                          </BlockStack>
                        </BlockStack>
                      </Card>
                      )
                    ))}

                    {/* Add Tab Button */}
                    <InlineStack gap="200" align="center">
                      <Button
                        variant="primary"
                        icon={PlusIcon}
                        onClick={() => {
                          stepsState.addStep();
                          setActiveTabIndex(stepsState.steps.length); // Switch to new tab
                        }}
                      >
                        Add New Tab
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
            )}

            {activeSection === "discount_pricing" && (
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Discount & Pricing
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Set up to 4 discount rules, applied from lowest to highest.
                    </Text>
                  </BlockStack>

                  {/* Discount Enable Toggle - Using Checkbox as toggle */}
                  <Checkbox
                    label="Enable discount pricing for this bundle"
                    checked={pricingState.discountEnabled}
                    onChange={(value) => pricingState.setDiscountEnabled(value)}
                    helpText="Turn on to configure discount rules and pricing options"
                  />

                  {pricingState.discountEnabled && (
                    <BlockStack gap="400">
                      {/* Discount Type */}
                      <Select
                        label="Discount Type"
                        options={[...DISCOUNT_METHOD_OPTIONS]}
                        value={pricingState.discountType}
                        onChange={(value) => {
                          pricingState.setDiscountType(value as DiscountMethod);
                          // Clear existing rules when discount type changes
                          pricingState.setDiscountRules([]);
                          // Clear rule messages when discount type changes
                          setRuleMessages({});
                        }}
                      />

                      {/* Discount Rules - New Standardized Structure */}
                      <BlockStack gap="300">
                        {pricingState.discountRules.map((rule, index) => (
                          <Card key={rule.id} background="bg-surface-secondary">
                            <BlockStack gap="300">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text as="h4" variant="bodyMd" fontWeight="medium">
                                  Rule #{index + 1}
                                </Text>
                                <Button
                                  variant="plain"
                                  tone="critical"
                                  onClick={() => pricingState.removeDiscountRule(rule.id)}
                                >
                                  Remove
                                </Button>
                              </InlineStack>

                              {/* Condition Section */}
                              <BlockStack gap="200">
                                <Text as="p" variant="bodyMd" fontWeight="semibold">When:</Text>
                                <InlineStack gap="200" align="start">
                                  <Select
                                    label="Type"
                                    options={[...DISCOUNT_CONDITION_TYPE_OPTIONS]}
                                    value={rule.condition.type}
                                    onChange={(value) => pricingState.updateDiscountRule(rule.id, {
                                      condition: { ...rule.condition, type: value as any }
                                    })}
                                  />
                                  <Select
                                    label="Operator"
                                    options={[...DISCOUNT_OPERATOR_OPTIONS]}
                                    value={rule.condition.operator}
                                    onChange={(value) => pricingState.updateDiscountRule(rule.id, {
                                      condition: { ...rule.condition, operator: value as any }
                                    })}
                                  />
                                  <TextField
                                    label={rule.condition.type === ConditionType.AMOUNT ? "Amount" : "Quantity"}
                                    value={String(rule.condition.type === ConditionType.AMOUNT ? centsToAmount(rule.condition.value) : rule.condition.value)}
                                    onChange={(value) => {
                                      const numValue = Number(value) || 0;
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
                                </InlineStack>
                              </BlockStack>

                              {/* Discount Section */}
                              <BlockStack gap="200">
                                <Text as="p" variant="bodyMd" fontWeight="semibold">Apply:</Text>
                                <TextField
                                  label={
                                    rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? 'Discount Percentage' :
                                      rule.discount.method === DiscountMethod.FIXED_AMOUNT_OFF ? 'Discount Amount' :
                                        'Bundle Price'
                                  }
                                  value={String(
                                    rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? rule.discount.value :
                                      centsToAmount(rule.discount.value)
                                  )}
                                  onChange={(value) => {
                                    const numValue = Number(value) || 0;
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
                              </BlockStack>

                              {/* Preview */}
                              <Text as="p" variant="bodySm" tone="subdued">
                                Preview: {generateRulePreview(rule)}
                              </Text>
                            </BlockStack>
                          </Card>
                        ))}

                        {pricingState.discountRules.length < 4 && (
                          <Button
                            variant="tertiary"
                            fullWidth
                            icon={PlusIcon}
                            onClick={pricingState.addDiscountRule}
                          >
                            Add rule
                          </Button>
                        )}
                      </BlockStack>


                      {/* Discount Messaging */}
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="100">
                            <Text variant="headingSm" as="h4">
                              Discount Messaging
                            </Text>
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Edit how discount messages appear above the subtotal.
                            </Text>
                          </BlockStack>
                          <Checkbox
                            label="Discount Messaging"
                            checked={pricingState.discountMessagingEnabled}
                            onChange={pricingState.setDiscountMessagingEnabled}
                          />
                        </InlineStack>

                        {/* Integrated Variables Helper */}
                        <details>
                          <summary className={fullPageBundleStyles.helpSummary}>
                            Show Variables
                          </summary>
                          <div className={fullPageBundleStyles.helpContainer}>
                            {/* Essential Variables */}
                            <div className={fullPageBundleStyles.helpItem}>
                              <strong>Essential (Most Used):</strong><br />
                              <code>{'{{conditionText}}'}</code> - "₹100" or "2 items"<br />
                              <code>{'{{discountText}}'}</code> - "₹50 off" or "20% off"<br />
                              <code>{'{{bundleName}}'}</code> - Bundle name
                            </div>

                            {/* Specific Variables */}
                            <div className={fullPageBundleStyles.helpItem}>
                              <strong>Specific:</strong><br />
                              <code>{'{{amountNeeded}}'}</code> - Amount needed (for spend-based)<br />
                              <code>{'{{itemsNeeded}}'}</code> - Items needed (for quantity-based)<br />
                              <code>{'{{progressPercentage}}'}</code> - Progress % (0-100)
                            </div>

                            {/* Pricing Variables */}
                            <div className={fullPageBundleStyles.helpItem}>
                              <strong>Pricing:</strong><br />
                              <code>{'{{currentAmount}}'}</code> - Current total<br />
                              <code>{'{{finalPrice}}'}</code> - Price after discount<br />
                              <code>{'{{savingsAmount}}'}</code> - Amount saved
                            </div>

                            {/* Quick Examples */}
                            <div className={fullPageBundleStyles.helpFooter}>
                              <strong>Quick Examples:</strong><br />
                              💰 <em>"Add {'{{conditionText}}'} to get {'{{discountText}}'}"</em><br />
                              📊 <em>"{'{{progressPercentage}}'} % complete - {'{{conditionText}}'} more needed"</em><br />
                              🎉 <em>"You saved {'{{savingsAmount}}'} on {'{{bundleName}}'}"</em>
                            </div>
                          </div>
                        </details>

                        {/* Dynamic rule-based messaging */}
                        {pricingState.discountMessagingEnabled && (Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).length > 0 && (
                          <BlockStack gap="300">
                            {(Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).map((rule: any, index: number) => (
                              <BlockStack key={rule.id} gap="300">
                                <Card background="bg-surface-secondary">
                                  <BlockStack gap="200">
                                    <Text as="h4" variant="bodyMd" fontWeight="medium">
                                      Rule #{index + 1} Messages
                                    </Text>
                                    <TextField
                                      label="Discount Text"
                                      value={ruleMessages[rule.id]?.discountText || 'Add {{conditionText}} to get {{discountText}}'}
                                      onChange={(value) => updateRuleMessage(rule.id, 'discountText', value)}
                                      multiline={2}
                                      autoComplete="off"
                                      helpText="This message appears when the customer is close to qualifying for the discount"
                                    />
                                  </BlockStack>
                                </Card>

                                <Card background="bg-surface-secondary">
                                  <BlockStack gap="200">
                                    <TextField
                                      label="Success Message"
                                      value={ruleMessages[rule.id]?.successMessage || 'Congratulations! You got {{discountText}} on {{bundleName}}! 🎉'}
                                      onChange={(value) => updateRuleMessage(rule.id, 'successMessage', value)}
                                      multiline={2}
                                      autoComplete="off"
                                      helpText="This message appears when the customer qualifies for the discount"
                                    />
                                  </BlockStack>
                                </Card>
                              </BlockStack>
                            ))}
                          </BlockStack>
                        )}

                        {/* Show message when no rules exist */}
                        {pricingState.discountMessagingEnabled && pricingState.discountRules.length === 0 && (
                          <Card background="bg-surface-secondary">
                            <BlockStack gap="200" inlineAlign="center">
                              <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                                Add discount rules to configure messaging
                              </Text>
                            </BlockStack>
                          </Card>
                        )}
                      </BlockStack>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
            )}

            {activeSection === "images_gifs" && (
              <BlockStack gap="400">
                <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={ImageIcon} tone="subdued" />
                    <BlockStack gap="0">
                      <Text variant="headingSm" fontWeight="semibold" as="p">Media Assets</Text>
                      <Text variant="bodyXs" tone="subdued" as="p">
                        Add visual media to enhance the bundle experience for shoppers.
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>

                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="300" blockAlign="center">
                        <Icon source={ImageIcon} tone="base" />
                        <BlockStack gap="100">
                          <Text variant="headingSm" fontWeight="semibold" as="p">Promo Banner</Text>
                          <Text variant="bodyXs" tone="subdued" as="p">Wide banner displayed at the top of the full-page bundle</Text>
                        </BlockStack>
                      </InlineStack>
                      <Badge tone="info">Page header</Badge>
                    </InlineStack>

                    <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                      <InlineStack gap="600">
                        <BlockStack gap="100">
                          <Text variant="bodyXs" fontWeight="semibold" tone="subdued" as="p">FORMAT</Text>
                          <Text variant="bodySm" as="p">JPG, PNG, WebP</Text>
                        </BlockStack>
                        <BlockStack gap="100">
                          <Text variant="bodyXs" fontWeight="semibold" tone="subdued" as="p">RECOMMENDED SIZE</Text>
                          <Text variant="bodySm" as="p">1600 × 280 px · 16:3 ratio</Text>
                        </BlockStack>
                      </InlineStack>
                    </Box>

                    <Divider />

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
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="300" blockAlign="center">
                        <Icon source={RefreshIcon} tone="magic" />
                        <BlockStack gap="100">
                          <Text variant="headingSm" fontWeight="semibold" as="p">Loading Animation</Text>
                          <Text variant="bodyXs" tone="subdued" as="p">Overlay shown while bundle content is loading</Text>
                        </BlockStack>
                      </InlineStack>
                      <Badge tone="magic">Storefront</Badge>
                    </InlineStack>

                    <BlockStack gap="100">
                      <Text variant="bodyXs" fontWeight="semibold" tone="subdued" as="p">APPEARS DURING</Text>
                      <InlineStack gap="150" wrap>
                        <Badge tone="info">Initial load</Badge>
                        <Badge tone="info">Step transitions</Badge>
                        <Badge tone="info">Add to cart</Badge>
                      </InlineStack>
                    </BlockStack>

                    <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                      <InlineStack gap="600">
                        <BlockStack gap="100">
                          <Text variant="bodyXs" fontWeight="semibold" tone="subdued" as="p">FORMAT</Text>
                          <Text variant="bodySm" as="p">GIF only</Text>
                        </BlockStack>
                        <BlockStack gap="100">
                          <Text variant="bodyXs" fontWeight="semibold" tone="subdued" as="p">RECOMMENDED SIZE</Text>
                          <Text variant="bodySm" as="p">Max 150 × 150 px</Text>
                        </BlockStack>
                      </InlineStack>
                    </Box>

                    <Divider />

                    <FilePicker
                      label="Choose loading GIF"
                      value={loadingGif}
                      onChange={(url) => {
                        setLoadingGif(url);
                        markAsDirty();
                      }}
                      hideCropEditor
                    />
                  </BlockStack>
                </Card>
              </BlockStack>
            )}
          </Layout.Section>
        </Layout>
      </form>

      {/* Page Selection Modal */}
      <Modal
        open={isPageSelectionModalOpen}
        onClose={() => closePageSelectionModal()}
        title="Place Widget"
        primaryAction={{
          content: "Cancel",
          onAction: () => closePageSelectionModal(),
        }}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodySm" tone="subdued">
              {bundle.bundleType === 'full_page'
                ? 'Select a page to open the theme editor with widget placement.'
                : 'Select a template to open the theme editor with widget placement.'}
            </Text>

            {isLoadingPages ? (
              <BlockStack gap="300" inlineAlign="center">
                <Spinner size="small" />
                <Text as="p" variant="bodySm" tone="subdued">
                  {bundle.bundleType === 'full_page' ? 'Loading pages...' : 'Loading templates...'}
                </Text>
              </BlockStack>
            ) : availablePages.length > 0 ? (
              <BlockStack gap="200">
                {availablePages.map((template) => (
                  <Card key={template.id || template.handle} padding="300">
                    <InlineStack wrap={false} gap="300" align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="span" variant="bodyMd" fontWeight="medium">
                            {template.title}
                          </Text>
                          {template.recommended && (
                            <Badge tone="success">Bundle Product</Badge>
                          )}
                        </InlineStack>
                        {template.description && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            {template.description}
                          </Text>
                        )}
                      </BlockStack>
                      <Button
                        onClick={() => handlePageSelection(template)}
                        variant={template.recommended ? "primary" : "secondary"}
                        icon={ExternalIcon}
                        size="slim"
                      >
                        Select
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Card padding="400">
                <BlockStack gap="300" inlineAlign="center">
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    {bundle.bundleType === 'full_page' ? 'No pages available' : 'No templates available'}
                  </Text>
                  <Button
                    url="https://admin.shopify.com/admin/pages"
                    external
                  >
                    Create Page
                  </Button>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Selected Products Modal */}
      <Modal
        open={isProductsModalOpen}
        onClose={handleCloseProductsModal}
        title="Selected Products"
        primaryAction={{
          content: "Close",
          onAction: handleCloseProductsModal,
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {(() => {
              const currentStep = stepsState.steps.find(step => step.id === currentModalStepId);
              const selectedProducts = currentStep?.StepProduct || [];

              return selectedProducts.length > 0 ? (
                <BlockStack gap="300">
                  <Text as="h4" variant="bodyMd" fontWeight="medium">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for this step:
                  </Text>
                  <Card>
                    <List type="bullet">
                      {selectedProducts.map((product: any, index: number) => {
                        // Extract product ID from Shopify GID (e.g., "gid://shopify/Product/123" -> "123")
                        const productId = product.productId || product.id?.split('/').pop();
                        const productUrl = productId
                          ? `https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${productId}`
                          : undefined;

                        return (
                          <List.Item key={product.id || index}>
                            <InlineStack gap="200" align="space-between" blockAlign="center">
                              <InlineStack gap="300" blockAlign="center">
                                <Thumbnail
                                  source={product.imageUrl || product.image?.url || "/bundle.png"}
                                  alt={product.title || product.name || 'Product'}
                                  size="small"
                                />
                                <BlockStack gap="050">
                                  {/* Make product title clickable to navigate to Shopify Admin product page */}
                                  <Button
                                    variant="plain"
                                    onClick={() => productUrl && open(productUrl, '_blank')}
                                    icon={ExternalIcon}
                                    disabled={!productUrl}
                                  >
                                    {product.title || product.name || 'Unnamed Product'}
                                  </Button>
                                  {product.variants && product.variants.length > 0 && (
                                    <Text as="p" variant="bodySm" tone="subdued">
                                      {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} available
                                    </Text>
                                  )}
                                </BlockStack>
                              </InlineStack>
                              <Badge tone="info">Product</Badge>
                            </InlineStack>
                          </List.Item>
                        );
                      })}
                    </List>
                  </Card>
                </BlockStack>
              ) : (
                <BlockStack gap="200" inlineAlign="center">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No products selected for this step yet.
                  </Text>
                </BlockStack>
              );
            })()}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Selected Collections Modal */}
      <Modal
        open={isCollectionsModalOpen}
        onClose={handleCloseCollectionsModal}
        title="Selected Collections"
        primaryAction={{
          content: "Close",
          onAction: handleCloseCollectionsModal,
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {(() => {
              const collections = selectedCollections[currentModalStepId] || [];

              return collections.length > 0 ? (
                <BlockStack gap="300">
                  <Text as="h4" variant="bodyMd" fontWeight="medium">
                    {collections.length} collection{collections.length !== 1 ? 's' : ''} selected for this step:
                  </Text>
                  <Card>
                    <List type="bullet">
                      {collections.map((collection: any, index: number) => (
                        <List.Item key={collection.id || index}>
                          <InlineStack gap="200" align="space-between">
                            <BlockStack gap="050">
                              <Text as="h5" variant="bodyMd" fontWeight="medium">
                                {collection.title || 'Unnamed Collection'}
                              </Text>
                              {collection.handle && (
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Handle: {collection.handle}
                                </Text>
                              )}
                            </BlockStack>
                            <Badge tone="success">Collection</Badge>
                          </InlineStack>
                        </List.Item>
                      ))}
                    </List>
                  </Card>
                </BlockStack>
              ) : (
                <BlockStack gap="200" inlineAlign="center">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No collections selected for this step yet.
                  </Text>
                </BlockStack>
              );
            })()}
          </BlockStack>
        </Modal.Section>
      </Modal>

    </Page>
  );
}