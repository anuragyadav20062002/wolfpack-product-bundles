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
} from "@shopify/polaris-icons";
import { FilePicker } from "../../../components/design-control-panel/settings/FilePicker";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
// Using modern App Bridge SaveBar with declarative 'open' prop for React-friendly state management
import { authenticate } from "../../../shopify.server";
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

declare global {
  interface Window {
    shopify?: { config?: { shop?: string } };
  }
}


export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
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
  { id: "step_setup", label: "Step Setup", icon: ListNumberedIcon },
  { id: "discount_pricing", label: "Discount & Pricing", icon: DiscountIcon },
  { id: "images_gifs", label: "Images & GIFs", icon: ImageIcon },
  // Bundle Upsell and Bundle Settings disabled for later release
  // { id: "bundle_upsell", label: "Bundle Upsell", icon: SettingsIcon },
  // { id: "bundle_settings", label: "Bundle Settings", icon: SettingsIcon },
];

// Static status options - imported from centralized constants
const statusOptions = [...BUNDLE_STATUS_OPTIONS];

// Memoized Bundle Product Card component to prevent unnecessary re-renders
const BundleProductCard = memo(({ bundleProduct, productImageUrl, productTitle, shop, onSync, onSelect }: BundleProductCardProps) => (
  <Card>
    <BlockStack gap="300">
      <InlineStack align="space-between" blockAlign="center">
        <Text variant="headingSm" as="h3">
          Bundle Product
        </Text>
        <Button
          variant="plain"
          tone="critical"
          onClick={onSync}
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
                onClick={onSelect}
                accessibilityLabel="Change bundle product"
              />
            </InlineStack>
          </InlineStack>
        </BlockStack>
      ) : (
        <div className={productPageBundleStyles.productSelectionPlaceholder}>
          <BlockStack gap="100" inlineAlign="center">
            <Icon source={ProductIcon} />
            <Button
              variant="plain"
              onClick={onSelect}
            >
              Select Bundle Product
            </Button>
          </BlockStack>
        </div>
      )}
    </BlockStack>
  </Card>
));

BundleProductCard.displayName = 'BundleProductCard';

// Memoized Bundle Status section to prevent unnecessary re-renders
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
  const loaderData = useLoaderData<LoaderData>();
  const bundle = loaderData.bundle as unknown as import("../../../hooks/useBundleConfigurationState").BundleData & {
    loadingGif?: string | null;
    shopifyProductHandle?: string;
  };
  const { bundleProduct: loadedBundleProduct, shop, apiKey, blockHandle } = loaderData;
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

  // Sync Bundle modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Add to Storefront install state
  const installFetcher = useFetcher<{ success: boolean; templateCreated?: boolean; templateAlreadyExists?: boolean; error?: string }>();
  const isInstallingWidget = installFetcher.state !== 'idle';
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

  // Handle install widget response — on success, open the Theme Editor on the correct product
  useEffect(() => {
    if (installFetcher.data && installFetcher.state === 'idle') {
      const result = installFetcher.data;
      if (result.success) {
        setWidgetInstalled(true);
        shopify.toast.show(
          result.templateAlreadyExists
            ? "Widget already on your theme. Opening Theme Editor…"
            : "Widget installed! Opening Theme Editor on your product…",
          { isError: false }
        );
        // Open Theme Editor with the bundle product as the preview and the
        // product-page-bundle template active so the merchant immediately sees
        // where the widget is placed.
        // shopifyProductHandle is the actual PDP product; bundleProduct.handle is the synthetic
        // bundle product for ads/checkout — prefer the PDP handle for the theme editor URL.
        const productHandle = bundle.shopifyProductHandle;
        if (productHandle) {
          const previewPath = encodeURIComponent(`/products/${productHandle}`);
          const themeEditorUrl = `https://${shop}/admin/themes/current/editor?previewPath=${previewPath}&template=product.product-page-bundle`;
          open(themeEditorUrl, '_blank');
        }
      } else {
        shopify.toast.show(result.error || "Install failed — opening Theme Editor instead.", { isError: true, duration: 5000 });
        // Fallback: open Theme Editor without a specific template so the merchant
        // can place the block manually
        const productHandle = bundle.shopifyProductHandle;
        const previewPath = productHandle ? `&previewPath=${encodeURIComponent(`/products/${productHandle}`)}` : '';
        open(`https://${shop}/admin/themes/current/editor?template=product${previewPath}`, '_blank');
      }
    }
  }, [installFetcher.data, installFetcher.state, bundleProduct, bundle.shopifyProductHandle, shop]);

  const handleAddToStorefront = useCallback(() => {
    const productHandle = bundle.shopifyProductHandle;
    installFetcher.submit(
      JSON.stringify({ productHandle, bundleId: bundle.id }),
      { method: 'POST', action: '/api/install-pdp-widget', encType: 'application/json' }
    );
  }, [bundle.id, bundle.shopifyProductHandle, bundleProduct?.handle, installFetcher]);

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

  return (
    <Page
      title={`Configure: ${formState.bundleName}`}
      subtitle="Set up your cart transform bundle configuration"
      backAction={{
        content: "Cart Transform Bundles",
        onAction: handleBackClick,
      }}
      primaryAction={{
        content: isInstallingWidget ? "Installing…" : widgetInstalled ? "Preview Bundle" : "Add to Storefront",
        onAction: widgetInstalled ? handlePreviewBundle : handleAddToStorefront,
        icon: widgetInstalled ? ViewIcon : ExternalIcon,
        loading: isInstallingWidget,
        disabled: !bundleProduct || stepsState.steps.length === 0 || isInstallingWidget || (!widgetInstalled && isDirty),
      }}
      secondaryActions={[
        {
          content: "Open in Theme Editor",
          icon: ExternalIcon,
          onAction: () => {
            const productHandle = bundle.shopifyProductHandle;
            const previewParam = productHandle ? `&previewPath=${encodeURIComponent(`/products/${productHandle}`)}` : '';
            // If the widget is already installed, navigate directly to the installed template.
            // Using addAppBlockId on an already-installed block causes Shopify to change the
            // previewPath to the first product with that templateSuffix (which may not be this bundle's product).
            const themeEditorUrl = widgetInstalled
              ? `https://${shop}/admin/themes/current/editor?template=product.product-page-bundle${previewParam}`
              : `https://${shop}/admin/themes/current/editor?template=product&addAppBlockId=${apiKey}/${blockHandle}&target=newAppsSection${previewParam}`;
            window.open(themeEditorUrl, '_blank');
          },
        },
        {
          content: "Sync Bundle",
          icon: RefreshIcon,
          destructive: true,
          disabled: isDirty || fetcher.state !== 'idle',
          onAction: () => setIsSyncModalOpen(true),
        },
      ]}
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

        <BlockStack gap="400">
        </BlockStack>

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
                    {bundleSetupItems.map((item) => (
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
              <Card>
                <BlockStack gap="300">
                  <BundleStatusSection
                    status={formState.bundleStatus}
                    onChange={formState.setBundleStatus}
                  />
                </BlockStack>
              </Card>

            </BlockStack>
          </Layout.Section>

          {/* Main Content Area */}
          <Layout.Section>
            {activeSection === "step_setup" && (
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Bundle Steps
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Create steps for your multi-step bundle here. Select product options for each step below
                    </Text>
                  </BlockStack>

                  {/* Steps List */}
                  <BlockStack gap="300">
                    {stepsState.steps.map((step, index) => (
                      <Card
                        key={step.id}
                        background="bg-surface-secondary"
                      >
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
                          <BlockStack gap="300">
                            {/* Step Header */}
                            <InlineStack align="space-between" blockAlign="center" gap="300">
                              <InlineStack gap="200" blockAlign="center">
                                <Icon source={DragHandleIcon} tone="subdued" />
                                <Text variant="bodyMd" fontWeight="medium" as="p">
                                  Step {index + 1}
                                </Text>
                              </InlineStack>

                              <InlineStack gap="100">
                                <Button
                                  variant="tertiary"
                                  size="micro"
                                  icon={DuplicateIcon}
                                  onClick={() => cloneStep(step.id)}
                                  accessibilityLabel="Clone step"
                                />
                                <Button
                                  variant="tertiary"
                                  size="micro"
                                  tone="critical"
                                  icon={DeleteIcon}
                                  onClick={() => deleteStep(step.id)}
                                  accessibilityLabel="Delete step"
                                />
                                <Button
                                  variant="tertiary"
                                  size="micro"
                                  icon={stepsState.expandedSteps.has(step.id) ? ChevronUpIcon : ChevronDownIcon}
                                  onClick={() => stepsState.toggleStepExpansion(step.id)}
                                  accessibilityLabel={stepsState.expandedSteps.has(step.id) ? "Collapse step" : "Expand step"}
                                />
                              </InlineStack>
                            </InlineStack>

                            {/* Expanded Step Content */}
                            <Collapsible id={`step-${step.id}`} open={stepsState.expandedSteps.has(step.id)}>
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
                            </Collapsible>
                          </BlockStack>
                        </div>
                      </Card>
                    ))}

                    {/* Add Step Button */}
                    <Button
                      variant="plain"
                      fullWidth
                      icon={PlusIcon}
                      onClick={() => {
                        const newStepId = stepsState.addStep();
                        // Scroll to the new step after React renders it
                        requestAnimationFrame(() => {
                          const el = document.querySelector(`[data-step-id="${newStepId}"]`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        });
                      }}
                    >
                      Add Step
                    </Button>
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
                          <summary className={productPageBundleStyles.helpSummary}>
                            Show Variables
                          </summary>
                          <div className={productPageBundleStyles.helpContainer}>
                            {/* Essential Variables */}
                            <div className={productPageBundleStyles.helpItem}>
                              <strong>Essential (Most Used):</strong><br />
                              <code>{'{{conditionText}}'}</code> - "₹100" or "2 items"<br />
                              <code>{'{{discountText}}'}</code> - "₹50 off" or "20% off"<br />
                              <code>{'{{bundleName}}'}</code> - Bundle name
                            </div>

                            {/* Specific Variables */}
                            <div className={productPageBundleStyles.helpItem}>
                              <strong>Specific:</strong><br />
                              <code>{'{{amountNeeded}}'}</code> - Amount needed (for spend-based)<br />
                              <code>{'{{itemsNeeded}}'}</code> - Items needed (for quantity-based)<br />
                              <code>{'{{progressPercentage}}'}</code> - Progress % (0-100)
                            </div>

                            {/* Pricing Variables */}
                            <div className={productPageBundleStyles.helpItem}>
                              <strong>Pricing:</strong><br />
                              <code>{'{{currentAmount}}'}</code> - Current total<br />
                              <code>{'{{finalPrice}}'}</code> - Price after discount<br />
                              <code>{'{{savingsAmount}}'}</code> - Amount saved
                            </div>

                            {/* Quick Examples */}
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
        onClose={closePageSelectionModal}
        title="Place Widget"
        primaryAction={{
          content: "Cancel",
          onAction: closePageSelectionModal,
        }}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodySm" tone="subdued">
              Select a template to open the theme editor with widget placement.
            </Text>

            {isLoadingPages ? (
              <BlockStack gap="300" inlineAlign="center">
                <Spinner size="small" />
                <Text as="p" variant="bodySm" tone="subdued">Loading templates...</Text>
              </BlockStack>
            ) : availablePages.length > 0 ? (
              <BlockStack gap="200">
                {availablePages.map((template) => (
                  <Card key={template.id} padding="300">
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
                    No templates available
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

      {/* Sync Bundle Confirmation Modal */}
      <Modal
        open={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        title="Sync Bundle?"
        primaryAction={{
          content: "Sync Bundle",
          destructive: true,
          loading: fetcher.state === 'submitting',
          onAction: handleSyncBundleConfirm,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsSyncModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              This will delete and re-create all Shopify data for this bundle:
            </Text>
            <List type="bullet">
              <List.Item>The Shopify product will be archived and deleted, then re-created</List.Item>
              <List.Item>All bundle and component metafields will be rewritten</List.Item>
            </List>
            <Text as="p" variant="bodyMd" tone="subdued">
              Bundle analytics are preserved. This action cannot be undone.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>

    </Page>
  );
}