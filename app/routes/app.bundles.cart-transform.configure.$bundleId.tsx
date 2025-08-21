import { useState, useEffect, useCallback } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
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
  ButtonGroup,
  TextField,
  Tabs,
  Collapsible,
  FormLayout,
  Checkbox,
  Modal,
  Thumbnail,
  List,
} from "@shopify/polaris";
import {
  ArrowLeftIcon,
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
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
// Using modern App Bridge contextual save bar with data-save-bar attribute on form
import { authenticate } from "../shopify.server";
import db from "../db.server";

// Bundle types based on existing schema
interface Bundle {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  bundleType: 'cart_transform';
  steps: any[];
  pricing?: any;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const { bundleId } = params;

  if (!bundleId) {
    throw new Response("Bundle ID is required", { status: 400 });
  }

  // Fetch the bundle with all related data
  const bundle = await db.bundle.findUnique({
    where: { 
      id: bundleId, 
      shopId: session.shop,
      bundleType: 'cart_transform'
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
    throw new Response("Bundle not found", { status: 404 });
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
      console.warn("Failed to fetch bundle product:", error);
      // Don't fail the entire request if we can't fetch the product
    }
  }

  return json({ 
    bundle,
    bundleProduct,
    shop: session.shop,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  try {
    const { session, admin } = await authenticate.admin(request);
    const { bundleId } = params;
    
    console.log("Authentication successful:", { shop: session?.shop, bundleId });
    
    if (!session?.shop) {
      console.error("No session shop found");
      return json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (!bundleId) {
      return json({ success: false, error: "Bundle ID is required" }, { status: 400 });
    }

    switch (intent) {
      case "saveBundle":
        return await handleSaveBundle(admin, session, bundleId, formData);
      case "updateBundleStatus":
        return await handleUpdateBundleStatus(admin, session, bundleId, formData);
      case "syncProduct":
        return await handleSyncProduct(admin, session, bundleId, formData);
      case "getPages":
        return await handleGetPages(admin, session);
      case "getThemeTemplates":
        return await handleGetThemeTemplates(admin, session);
      case "getCurrentTheme":
        return await handleGetCurrentTheme(admin, session);
      default:
        return json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Action error:", error);
    return json({ success: false, error: error.message || "An error occurred" }, { status: 500 });
  }
};

// Helper function to create metafield definitions if they don't exist
async function ensureBundleMetafieldDefinitions(admin: any) {
  const CREATE_METAFIELD_DEFINITION = `
    mutation CreateBundleMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
          namespace
          key
          ownerType
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  // Define both metafield definitions
  const definitions = [
    {
      name: "Cart Transform Bundle Config",
      namespace: "bundle_discounts",
      key: "cart_transform_config",
      description: "Cart transform bundle configuration data",
      type: "json",
      ownerType: "PRODUCT"
    },
    {
      name: "Discount Function Bundle Config",
      namespace: "bundle_discounts", 
      key: "discount_function_config",
      description: "Discount function bundle configuration data",
      type: "json",
      ownerType: "PRODUCT"
    }
  ];

  for (const definition of definitions) {
    try {
      const response = await admin.graphql(CREATE_METAFIELD_DEFINITION, {
        variables: { definition }
      });

      const data = await response.json();
      
      if (data.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
        const error = data.data.metafieldDefinitionCreate.userErrors[0];
        if (error.code !== "TAKEN") { // TAKEN means it already exists, which is OK
          console.error(`Metafield definition creation error for ${definition.key}:`, error);
          // Continue with other definitions even if one fails
        }
      }
    } catch (error) {
      console.error(`Error ensuring metafield definition for ${definition.key}:`, error);
      // Continue with other definitions even if one fails
    }
  }

  return true;
}

// Helper function to update bundle product metafields
async function updateBundleProductMetafields(admin: any, bundleProductId: string, bundleConfiguration: any, bundleType: 'cart_transform' | 'discount_function' = 'cart_transform') {
  await ensureBundleMetafieldDefinitions(admin);

  const SET_METAFIELDS = `
    mutation SetBundleMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          namespace
          value
          createdAt
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const metafieldKey = bundleType === 'cart_transform' ? 'cart_transform_config' : 'discount_function_config';
  
  const response = await admin.graphql(SET_METAFIELDS, {
    variables: {
      metafields: [
        {
          ownerId: bundleProductId,
          namespace: "bundle_discounts",
          key: metafieldKey,
          type: "json",
          value: JSON.stringify(bundleConfiguration)
        }
      ]
    }
  });

  const data = await response.json();

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    const error = data.data.metafieldsSet.userErrors[0];
    console.error("Metafield set error:", error);
    throw new Error(`Failed to update bundle metafields: ${error.message}`);
  }

  return data.data?.metafieldsSet?.metafields?.[0];
}

// Map frontend discount method values to schema enum values
function mapDiscountMethod(discountType: string): string {
  switch (discountType) {
    case 'fixed_bundle_price':
    case 'fixed_amount_off':
      return 'fixed_amount_off';
    case 'percentage_off':
      return 'percentage_off';
    case 'free_shipping':
      return 'free_shipping';
    default:
      return 'fixed_amount_off'; // Default fallback
  }
}

// Handle saving bundle configuration
async function handleSaveBundle(admin: any, session: any, bundleId: string, formData: FormData) {
  // Parse form data
  const bundleName = formData.get("bundleName") as string;
  const bundleDescription = formData.get("bundleDescription") as string;
  const bundleStatus = formData.get("bundleStatus") as string;
  const stepsData = JSON.parse(formData.get("stepsData") as string);
  const discountData = JSON.parse(formData.get("discountData") as string);

  // Update bundle in database
  const updatedBundle = await db.bundle.update({
    where: { 
      id: bundleId, 
      shopId: session.shop 
    },
    data: {
      name: bundleName,
      description: bundleDescription,
      status: bundleStatus as any,
      // Update steps if provided
      ...(stepsData && {
        steps: {
          deleteMany: {},
          createMany: {
            data: stepsData.map((step: any, index: number) => ({
              name: step.pageTitle || step.name, // Use pageTitle as name if available
              position: index + 1, // Map stepNumber to position field
              products: step.products || [],
              collections: step.collections || [],
              displayVariantsAsIndividual: step.displayVariantsAsIndividualProducts || false,
              minQuantity: step.minQuantity || 1,
              maxQuantity: step.maxQuantity || 1,
              enabled: step.enabled !== false // Default to true unless explicitly false
            }))
          }
        }
      }),
      // Update pricing if provided
      ...(discountData && {
        pricing: {
          upsert: {
            create: {
              enableDiscount: discountData.discountEnabled,
              discountMethod: mapDiscountMethod(discountData.discountType),
              rules: discountData.discountRules || [],
              messages: {
                showDiscountDisplay: discountData.discountDisplayEnabled || false,
                showDiscountMessaging: discountData.discountMessagingEnabled || false,
                ruleMessages: discountData.ruleMessages || {}
              }
            },
            update: {
              enableDiscount: discountData.discountEnabled,
              discountMethod: mapDiscountMethod(discountData.discountType),
              rules: discountData.discountRules || [],
              messages: {
                showDiscountDisplay: discountData.discountDisplayEnabled || false,
                showDiscountMessaging: discountData.discountMessagingEnabled || false,
                ruleMessages: discountData.ruleMessages || {}
              }
            }
          }
        }
      })
    },
    include: {
      steps: true,
      pricing: true
    }
  });

  // If bundle has a Shopify product and discount is enabled, update its metafields
  if (updatedBundle.shopifyProductId && discountData?.discountEnabled) {
    const baseConfiguration = {
      bundleId: updatedBundle.id,
      name: updatedBundle.name,
      steps: stepsData || [],
      pricing: {
        enabled: discountData.discountEnabled,
        method: discountData.discountType,
        rules: discountData.discountRules || []
      },
      updatedAt: new Date().toISOString()
    };

    try {
      // Save cart transform configuration
      const cartTransformConfig = {
        ...baseConfiguration,
        type: "cart_transform"
      };
      await updateBundleProductMetafields(admin, updatedBundle.shopifyProductId, cartTransformConfig, 'cart_transform');

      // Save discount function configuration
      const discountFunctionConfig = {
        ...baseConfiguration,
        type: "discount_function"
      };
      await updateBundleProductMetafields(admin, updatedBundle.shopifyProductId, discountFunctionConfig, 'discount_function');

    } catch (error) {
      console.error("Failed to update bundle product metafields:", error);
      // Don't fail the entire operation - just log the error
    }
  }

  return json({ 
    success: true, 
    bundle: updatedBundle,
    message: "Bundle configuration saved successfully"
  });
}

// Handle updating bundle status
async function handleUpdateBundleStatus(admin: any, session: any, bundleId: string, formData: FormData) {
  const status = formData.get("status") as string;

  const updatedBundle = await db.bundle.update({
    where: { 
      id: bundleId, 
      shopId: session.shop 
    },
    data: { status: status as any },
    include: {
      steps: true,
      pricing: true
    }
  });

  return json({ 
    success: true, 
    bundle: updatedBundle,
    message: `Bundle status updated to ${status}`
  });
}

// Handle syncing bundle product
async function handleSyncProduct(admin: any, session: any, bundleId: string, formData: FormData) {
  const bundle = await db.bundle.findUnique({
    where: { 
      id: bundleId, 
      shopId: session.shop 
    },
    include: {
      steps: true,
      pricing: true
    }
  });

  if (!bundle) {
    return json({ success: false, error: "Bundle not found" }, { status: 404 });
  }

  let productId = bundle.shopifyProductId;

  // Create product if it doesn't exist
  if (!productId) {
    const CREATE_PRODUCT = `
      mutation CreateBundleProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        input: {
          title: bundle.name,
          handle: `bundle-${bundle.id}`,
          productType: "Bundle",
          vendor: "Bundle Builder",
          status: "ACTIVE",
          descriptionHtml: bundle.description || "",
          variants: [
            {
              price: "0.00",
              inventoryManagement: "NOT_MANAGED",
              inventoryPolicy: "CONTINUE"
            }
          ]
        }
      }
    });

    const data = await response.json();

    if (data.data?.productCreate?.userErrors?.length > 0) {
      const error = data.data.productCreate.userErrors[0];
      throw new Error(`Failed to create bundle product: ${error.message}`);
    }

    productId = data.data?.productCreate?.product?.id;

    // Update bundle with product ID
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyProductId: productId }
    });
  }

  // Update metafields with current bundle configuration
  if (productId && bundle.pricing?.enableDiscount) {
    const bundleConfiguration = {
      bundleId: bundle.id,
      name: bundle.name,
      type: "cart_transform",
      steps: bundle.steps || [],
      pricing: {
        enabled: bundle.pricing.enableDiscount,
        method: bundle.pricing.discountMethod,
        rules: bundle.pricing.rules || []
      },
      updatedAt: new Date().toISOString()
    };

    await updateBundleProductMetafields(admin, productId, bundleConfiguration);
  }

  return json({ 
    success: true,
    productId,
    message: "Bundle product synchronized successfully"
  });
}

// Handle getting available pages for widget placement
async function handleGetPages(admin: any, session: any) {
  const GET_PAGES = `
    query getPages($first: Int!) {
      pages(first: $first) {
        nodes {
          id
          title
          handle
          createdAt
          updatedAt
        }
      }
    }
  `;

  const response = await admin.graphql(GET_PAGES, {
    variables: { first: 50 } // Get first 50 pages
  });

  const data = await response.json();

  if (data.data?.pages?.nodes) {
    return json({ 
      success: true, 
      pages: data.data.pages.nodes
    });
  } else {
    return json({ 
      success: false, 
      error: "Failed to fetch pages" 
    });
  }
}

// Handle getting theme templates
async function handleGetThemeTemplates(admin: any, session: any) {
  try {
    // Get the published theme directly
    const GET_PUBLISHED_THEME = `
      query getPublishedTheme {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id
            name
            role
          }
        }
      }
    `;

    const themesResponse = await admin.graphql(GET_PUBLISHED_THEME);

    const themesData = await themesResponse.json();
    
    if (!themesData.data?.themes?.nodes) {
      return json({ 
        success: false, 
        error: "Failed to fetch themes" 
      });
    }

    // Get the published theme (should be the first and only one)
    const publishedTheme = themesData.data.themes.nodes[0];
    
    if (!publishedTheme) {
      console.error("No themes returned from GraphQL:", themesData);
      return json({ 
        success: false, 
        error: "No published theme found" 
      });
    }

    console.log("Found published theme:", publishedTheme);

    // Extract theme ID (remove gid prefix if present)
    const themeId = publishedTheme.id.replace('gid://shopify/OnlineStoreTheme/', '');
    console.log("Theme ID extracted:", themeId);

    // Now fetch theme assets using REST API (since GraphQL doesn't expose theme assets)
    const shop = session.shop;
    const accessToken = session.accessToken;
    
    const assetsUrl = `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json`;
    console.log("Assets URL:", assetsUrl);
    
    const assetsResponse = await fetch(assetsUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!assetsResponse.ok) {
      const errorText = await assetsResponse.text();
      console.error("Assets response error:", {
        status: assetsResponse.status,
        statusText: assetsResponse.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch theme assets: ${assetsResponse.status} ${assetsResponse.statusText}`);
    }

    const assetsData = await assetsResponse.json();
    console.log("Assets fetched successfully, count:", assetsData.assets?.length || 0);
    
    // Filter for template files and organize them
    const templates = assetsData.assets
      .filter((asset: any) => asset.key.startsWith('templates/') && 
                               (asset.key.endsWith('.liquid') || asset.key.endsWith('.json')))
      .map((asset: any) => {
        const templateName = asset.key.replace('templates/', '').replace(/\.(liquid|json)$/, '');
        const isJson = asset.key.endsWith('.json');
        
        // Determine template type and description
        let title = templateName;
        let description = '';
        let recommended = false;

        if (templateName === 'index') {
          title = 'Homepage';
          description = 'Main landing page of your store';
          recommended = true;
        } else if (templateName.startsWith('product')) {
          title = templateName === 'product' ? 'Product Pages' : `Product - ${templateName.replace('product.', '')}`;
          description = 'Individual product detail pages';
          recommended = templateName === 'product';
        } else if (templateName.startsWith('collection')) {
          title = templateName === 'collection' ? 'Collection Pages' : `Collection - ${templateName.replace('collection.', '')}`;
          description = 'Product collection listing pages';
          recommended = templateName === 'collection';
        } else if (templateName === 'page') {
          title = 'Static Pages';
          description = 'Custom content pages (About, Contact, etc.)';
          recommended = true;
        } else if (templateName === 'cart') {
          title = 'Cart Page';
          description = 'Shopping cart page';
          recommended = false;
        } else if (templateName === 'search') {
          title = 'Search Results';
          description = 'Search results page';
          recommended = false;
        } else {
          title = templateName.charAt(0).toUpperCase() + templateName.slice(1);
          description = `${title} template`;
          recommended = false;
        }

        return {
          id: templateName,
          title,
          handle: templateName,
          description,
          recommended,
          fileType: isJson ? 'JSON' : 'Liquid',
          fullKey: asset.key
        };
      })
      .sort((a: any, b: any) => {
        // Sort by recommended first, then alphabetically
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return a.title.localeCompare(b.title);
      });

    return json({ 
      success: true, 
      templates,
      themeId,
      themeName: publishedTheme.name
    });

  } catch (error) {
    console.error("Error fetching theme templates:", error);
    return json({ 
      success: false, 
      error: "Failed to fetch theme templates" 
    });
  }
}

// Handle getting current theme for deep linking
async function handleGetCurrentTheme(admin: any, session: any) {
  const GET_CURRENT_THEME = `
    query getCurrentTheme {
      themes(first: 1, query: "role:main") {
        nodes {
          id
          name
          role
        }
      }
    }
  `;

  const response = await admin.graphql(GET_CURRENT_THEME);
  const data = await response.json();

  if (data.data?.themes?.nodes?.[0]) {
    const theme = data.data.themes.nodes[0];
    return json({ 
      success: true, 
      themeId: theme.id.replace('gid://shopify/Theme/', ''),
      themeName: theme.name
    });
  } else {
    return json({ 
      success: false, 
      error: "Failed to fetch current theme" 
    });
  }
}

export default function ConfigureBundleFlow() {
  const { bundle, bundleProduct: loadedBundleProduct, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();
  
  // State for form controls
  const [bundleStatus, setBundleStatus] = useState(bundle.status);
  const [activeSection, setActiveSection] = useState("step_setup");
  const [bundleName, setBundleName] = useState(bundle.name);
  const [bundleDescription, setBundleDescription] = useState(bundle.description || "");
  
  // State for step management
  const [steps, setSteps] = useState(bundle.steps || []);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState(0);
  const [stepConditions, setStepConditions] = useState<Record<string, any[]>>({});
  
  // State for widget placement
  const [widgetPlacementConfig, setWidgetPlacementConfig] = useState<Record<string, boolean>>({
    productPages: true,
    collectionPages: false,
    cartPage: false,
    customPages: false
  });
  
  // State for page selection modal
  const [isPageSelectionModalOpen, setIsPageSelectionModalOpen] = useState(false);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);

  // State for products/collections view modals
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
  const [currentModalStepId, setCurrentModalStepId] = useState<string>('');
  
  // State for bundle product - initialize with loaded data
  const [bundleProduct, setBundleProduct] = useState<any>(loadedBundleProduct);
  const [isBundleProductPickerOpen, setIsBundleProductPickerOpen] = useState(false);
  const [productStatus, setProductStatus] = useState(loadedBundleProduct?.status || "ACTIVE");
  
  // State for collections
  const [selectedCollections, setSelectedCollections] = useState<Record<string, any[]>>({});
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [currentStepIdForCollection, setCurrentStepIdForCollection] = useState<string | null>(null);
  
  // State for discount & pricing
  const [discountEnabled, setDiscountEnabled] = useState(bundle.pricing?.enableDiscount || false);
  const [discountType, setDiscountType] = useState(bundle.pricing?.discountMethod || 'fixed_bundle_price');
  const [discountRules, setDiscountRules] = useState(bundle.pricing?.rules || []);
  const [discountDisplayEnabled, setDiscountDisplayEnabled] = useState(true);
  const [discountMessagingEnabled, setDiscountMessagingEnabled] = useState(true);
  
  // State for rule-specific messaging
  const [ruleMessages, setRuleMessages] = useState<Record<string, { discountText: string; successMessage: string }>>({});
  const [showVariables, setShowVariables] = useState(false);
  
  // Section-specific change tracking
  const [sectionChanges, setSectionChanges] = useState<Record<string, boolean>>({
    step_setup: false,
    discount_pricing: false
  });
  
  // Track original values for change detection - initialize with loaded data to prevent false positives
  const [originalValues, setOriginalValues] = useState({
    status: bundle.status,
    name: bundle.name,
    description: bundle.description || "",
    steps: JSON.stringify(bundle.steps || []),
    discountEnabled: bundle.pricing?.enableDiscount || false,
    discountType: bundle.pricing?.discountMethod || 'fixed_bundle_price',
    discountRules: JSON.stringify(bundle.pricing?.rules || []),
    discountDisplayEnabled: true,
    discountMessagingEnabled: true,
    selectedCollections: JSON.stringify({}),
    ruleMessages: JSON.stringify({}),
    stepConditions: JSON.stringify({}),
    bundleProduct: loadedBundleProduct, // Initialize with loaded data to prevent false changes
    productStatus: loadedBundleProduct?.status || "ACTIVE",
  });
  
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Helper function to trigger contextual save bar
  const triggerSaveBar = useCallback(() => {
    // Use requestAnimationFrame for better performance and timing
    requestAnimationFrame(() => {
      try {
        // Find the form with data-save-bar attribute
        const form = document.querySelector('form[data-save-bar]') as HTMLFormElement;
        if (!form) {
          console.warn('Save bar form not found - form may not be mounted yet');
          // Retry after a short delay if form is not found
          setTimeout(() => {
            const retryForm = document.querySelector('form[data-save-bar]') as HTMLFormElement;
            if (retryForm) {
              const retryInputs = retryForm.querySelectorAll('input');
              if (retryInputs.length > 0) {
                const event = new Event('input', { bubbles: true, cancelable: true });
                retryInputs[0].dispatchEvent(event);
                console.log('Save bar triggered successfully on retry');
              }
            }
          }, 100);
          return;
        }

        // Get all input elements in the form
        const formInputs = form.querySelectorAll('input');
        if (formInputs.length === 0) {
          console.warn('No form inputs found for save bar');
          return;
        }

        // Trigger input event on the first input to activate save bar
        const event = new Event('input', { bubbles: true, cancelable: true });
        formInputs[0].dispatchEvent(event);
        
        console.log('Save bar triggered successfully');
      } catch (error) {
        console.error('Error triggering save bar:', error);
        // Fallback: Try to trigger on any form element
        try {
          const anyForm = document.querySelector('form') as HTMLFormElement;
          if (anyForm) {
            const anyInputs = anyForm.querySelectorAll('input');
            if (anyInputs.length > 0) {
              const event = new Event('input', { bubbles: true, cancelable: true });
              anyInputs[0].dispatchEvent(event);
              console.log('Save bar triggered using fallback method');
            }
          }
        } catch (fallbackError) {
          console.error('Fallback save bar trigger also failed:', fallbackError);
        }
      }
    });
  }, []);

  // Helper function to dismiss contextual save bar when no changes exist
  const dismissSaveBar = useCallback(() => {
    // Use requestAnimationFrame for better performance and timing
    requestAnimationFrame(() => {
      try {
        // Find the form with data-save-bar attribute
        const form = document.querySelector('form[data-save-bar]') as HTMLFormElement;
        if (!form) {
          console.warn('Save bar form not found for dismissal');
          return;
        }

        // For modern App Bridge (4.x.x), we don't need to manually dismiss the save bar
        // It automatically dismisses when form inputs return to their original values
        // We just need to ensure the hidden inputs reflect the current state correctly
        const formInputs = form.querySelectorAll('input[type="hidden"]');
        formInputs.forEach((input: HTMLInputElement) => {
          // Update hidden inputs to current values without triggering events
          if (input.name) {
            // Update the value silently to reflect current state
            const currentValue = getCurrentValueForField(input.name);
            if (currentValue !== undefined) {
              input.value = currentValue;
            }
          }
        });
        
        console.log('Save bar dismissed successfully - form inputs synchronized');
      } catch (error) {
        console.error('Error dismissing save bar:', error);
      }
    });
  }, []);

  // Helper function to get current value for a field
  const getCurrentValueForField = useCallback((fieldName: string): string => {
    switch (fieldName) {
      case 'bundleName':
        return bundleName;
      case 'bundleDescription':
        return bundleDescription;
      case 'bundleStatus':
        return bundleStatus;
      case 'stepsData':
        return JSON.stringify(steps);
      case 'discountData':
        return JSON.stringify({discountEnabled, discountType, discountRules});
      case 'selectedCollections':
        return JSON.stringify(selectedCollections);
      case 'stepConditions':
        return JSON.stringify(stepConditions);
      case 'bundleProduct':
        return JSON.stringify(bundleProduct);
      case 'productStatus':
        return productStatus;
      default:
        return '';
    }
  }, [bundleName, bundleDescription, bundleStatus, steps, discountEnabled, discountType, discountRules, selectedCollections, stepConditions, bundleProduct, productStatus]);

  // Check for changes whenever form values change
  useEffect(() => {
    const stepSetupChanges = (
      bundleName !== originalValues.name ||
      bundleDescription !== originalValues.description ||
      JSON.stringify(steps) !== originalValues.steps ||
      JSON.stringify(selectedCollections) !== originalValues.selectedCollections ||
      JSON.stringify(stepConditions) !== originalValues.stepConditions ||
      JSON.stringify(bundleProduct) !== JSON.stringify(originalValues.bundleProduct) ||
      productStatus !== originalValues.productStatus
    );
    
    const discountPricingChanges = (
      discountEnabled !== originalValues.discountEnabled ||
      discountType !== originalValues.discountType ||
      JSON.stringify(discountRules) !== originalValues.discountRules ||
      discountDisplayEnabled !== originalValues.discountDisplayEnabled ||
      discountMessagingEnabled !== originalValues.discountMessagingEnabled ||
      JSON.stringify(ruleMessages) !== originalValues.ruleMessages
    );
    
    const bundleStatusChanges = (
      bundleStatus !== originalValues.status
    );
    
    const hasChanges = stepSetupChanges || discountPricingChanges || bundleStatusChanges;
    
    // Update section-specific changes
    setSectionChanges({
      step_setup: stepSetupChanges,
      discount_pricing: discountPricingChanges
    });
    
    setHasUnsavedChanges(hasChanges);
    
    // Manage save bar based on whether changes exist
    // Only interact with save bar if form is ready (originalValues.bundleProduct is set)
    if (originalValues.bundleProduct !== undefined) {
      if (hasChanges) {
        triggerSaveBar();
      } else {
        dismissSaveBar();
      }
    }
  }, [
    bundleStatus, bundleName, bundleDescription, steps, 
    discountEnabled, discountType, discountRules, 
    discountDisplayEnabled, discountMessagingEnabled, ruleMessages,
    selectedCollections, stepConditions, bundleProduct, productStatus,
    originalValues, triggerSaveBar, dismissSaveBar
  ]);

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      // Prepare form data for submission
      const formData = new FormData();
      formData.append("intent", "saveBundle");
      formData.append("bundleName", bundleName);
      formData.append("bundleDescription", bundleDescription);
      formData.append("bundleStatus", bundleStatus);
      formData.append("stepsData", JSON.stringify(steps));
      formData.append("discountData", JSON.stringify({
        discountEnabled,
        discountType,
        discountRules,
        discountDisplayEnabled,
        discountMessagingEnabled,
        ruleMessages
      }));

      // Submit to server action using fetcher
      console.log("Submitting save request with fetcher");
      console.log("FormData intent:", formData.get("intent"));
      
      fetcher.submit(formData, { method: "post" });
      
      // Note: With useFetcher, we need to handle the response via useEffect
      // The immediate return here will be handled by the fetcher response
      return;
    } catch (error) {
      console.error("Save failed:", error);
      shopify.toast.show(error.message || "Failed to save changes", { isError: true });
    }
  }, [bundleStatus, bundleName, bundleDescription, steps, discountEnabled, discountType, discountRules, discountDisplayEnabled, discountMessagingEnabled, ruleMessages, selectedCollections, stepConditions, bundleProduct, productStatus, shopify]);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      const result = fetcher.data;
      
      // Handle different action types based on the response or form data
      if (result.success) {
        // Check if this was a save bundle action by looking for bundle data in response
        if (result.bundle) {
          // This is a save bundle response
          setOriginalValues({
            status: bundleStatus,
            name: bundleName,
            description: bundleDescription,
            steps: JSON.stringify(steps),
            discountEnabled: discountEnabled,
            discountType: discountType,
            discountRules: JSON.stringify(discountRules),
            discountDisplayEnabled: discountDisplayEnabled,
            discountMessagingEnabled: discountMessagingEnabled,
            selectedCollections: JSON.stringify(selectedCollections),
            ruleMessages: JSON.stringify(ruleMessages),
            stepConditions: JSON.stringify(stepConditions),
            bundleProduct: bundleProduct,
            productStatus: productStatus,
          });
          
          // Reset section changes after successful save
          setSectionChanges({
            step_setup: false,
            discount_pricing: false
          });
          
          shopify.toast.show(result.message || "Changes saved successfully", { isError: false });
        } else if (result.productId) {
          // This is a sync product response
          shopify.toast.show(result.message || "Product synced successfully", { isError: false });
          // Optionally refetch bundle product data here
        } else if (result.templates) {
          // This is a get theme templates response
          setAvailablePages(result.templates || []);
          setIsLoadingPages(false);
          console.log("Theme templates loaded successfully:", result.templates.length, "from theme:", result.themeName);
        } else if (result.themeId) {
          // This is a get current theme response - handled by individual callbacks
          console.log("Theme ID fetched:", result.themeId);
        } else {
          // Generic success response
          shopify.toast.show(result.message || "Operation completed successfully", { isError: false });
        }
      } else {
        // Handle errors based on action type
        const errorMessage = result.error || "Operation failed";
        shopify.toast.show(errorMessage, { isError: true });
        
        // Handle specific error cases
        if (errorMessage.includes("pages") || errorMessage.includes("templates")) {
          setIsLoadingPages(false);
        }
      }
    }
  }, [fetcher.data, fetcher.state, bundleStatus, bundleName, bundleDescription, steps, discountEnabled, discountType, discountRules, discountDisplayEnabled, discountMessagingEnabled, selectedCollections, ruleMessages, stepConditions, bundleProduct, productStatus, shopify]);

  // Discard handler
  const handleDiscard = useCallback(() => {
    try {
      // Reset to original values
      setBundleStatus(originalValues.status);
      setBundleName(originalValues.name);
      setBundleDescription(originalValues.description);
      setSteps(JSON.parse(originalValues.steps));
      setDiscountEnabled(originalValues.discountEnabled);
      setDiscountType(originalValues.discountType);
      setDiscountRules(JSON.parse(originalValues.discountRules));
      setDiscountDisplayEnabled(originalValues.discountDisplayEnabled);
      setDiscountMessagingEnabled(originalValues.discountMessagingEnabled);
      setSelectedCollections(JSON.parse(originalValues.selectedCollections));
      setRuleMessages(JSON.parse(originalValues.ruleMessages));
      setStepConditions(JSON.parse(originalValues.stepConditions));
      // Keep the loaded bundle product instead of resetting to null
      setBundleProduct(originalValues.bundleProduct || loadedBundleProduct);
      setProductStatus(originalValues.productStatus);
      
      // Reset section changes after discard
      setSectionChanges({
        step_setup: false,
        discount_pricing: false
      });
      
      shopify.toast.show("Changes discarded", { isError: false });
    } catch (error) {
      console.error("Error discarding changes:", error);
      shopify.toast.show("Error discarding changes", { isError: true });
    }
  }, [originalValues, loadedBundleProduct, shopify]);

  // Emergency force navigation state for escape hatch
  const [forceNavigation, setForceNavigation] = useState(false);

  // Navigation handlers with unsaved changes check
  const handleBackClick = useCallback(() => {
    if (hasUnsavedChanges && !forceNavigation) {
      // Show user-friendly message about unsaved changes with force option
      const proceed = confirm(
        "You have unsaved changes. Are you sure you want to leave this page?\n\n" +
        "Click 'OK' to leave anyway (changes will be lost)\n" +
        "Click 'Cancel' to stay and save your changes"
      );
      
      if (proceed) {
        setForceNavigation(true);
        // Force navigation even with unsaved changes
        navigate("/app/bundles/cart-transform");
      } else {
        shopify.toast.show("Save or discard your changes to continue", { 
          isError: true,
          duration: 4000 
        });
      }
      return;
    }
    navigate("/app/bundles/cart-transform");
  }, [hasUnsavedChanges, forceNavigation, navigate, shopify]);

  const handlePreviewBundle = useCallback(() => {
    if (hasUnsavedChanges) {
      // Show user-friendly message about unsaved changes
      shopify.toast.show("Please save your changes before previewing the bundle", { 
        isError: true,
        duration: 4000 
      });
      return;
    }

    // Check if bundle product exists
    if (!bundleProduct) {
      shopify.toast.show("Bundle product not found. Please select a bundle product first.", { 
        isError: true,
        duration: 4000 
      });
      return;
    }

    // Extract shop domain properly
    const shopDomain = shop.includes('.myshopify.com') 
      ? shop.replace('.myshopify.com', '') 
      : shop;

    // Try different URL construction methods
    let productUrl = null;

    // Method 1: Use onlineStoreUrl if available
    if (bundleProduct.onlineStoreUrl) {
      productUrl = bundleProduct.onlineStoreUrl;
    }
    // Method 2: Use handle to construct URL
    else if (bundleProduct.handle) {
      productUrl = `https://${shopDomain}.myshopify.com/products/${bundleProduct.handle}`;
    }
    // Method 3: Extract ID from GraphQL ID and construct URL
    else if (bundleProduct.id) {
      const productId = bundleProduct.id.includes('gid://shopify/Product/') 
        ? bundleProduct.id.split('/').pop() 
        : bundleProduct.id;
      // Use Shopify admin preview URL as fallback
      productUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
    }

    if (productUrl) {
      console.log('Opening bundle product URL:', productUrl);
      window.open(productUrl, '_blank');
      shopify.toast.show("Bundle product opened in new tab", { isError: false });
    } else {
      console.error('Bundle product data:', bundleProduct);
      shopify.toast.show("Unable to determine bundle product URL. Please check bundle product configuration.", { 
        isError: true,
        duration: 5000 
      });
    }
  }, [hasUnsavedChanges, bundleProduct, shop, shopify]);

  const handleSectionChange = useCallback((section: string) => {
    if (hasUnsavedChanges) {
      // Show user-friendly message about unsaved changes
      shopify.toast.show("Please save or discard your changes before switching sections", { 
        isError: true,
        duration: 4000 
      });
      return;
    }
    
    // Clear section-specific changes when successfully navigating
    setSectionChanges(prev => ({
      ...prev,
      [activeSection]: false,
      [section]: false
    }));
    
    setActiveSection(section);
  }, [hasUnsavedChanges, activeSection, shopify]);

  // Modal handlers for products and collections view
  const handleShowProducts = useCallback((stepId: string) => {
    setCurrentModalStepId(stepId);
    setIsProductsModalOpen(true);
  }, []);

  const handleShowCollections = useCallback((stepId: string) => {
    setCurrentModalStepId(stepId);
    setIsCollectionsModalOpen(true);
  }, []);

  const handleCloseProductsModal = useCallback(() => {
    setIsProductsModalOpen(false);
    setCurrentModalStepId('');
  }, []);

  const handleCloseCollectionsModal = useCallback(() => {
    setIsCollectionsModalOpen(false);
    setCurrentModalStepId('');
  }, []);

  // Step management functions
  const addNewStep = useCallback(() => {
    const newStep = {
      id: `temp-${Date.now()}`,
      name: `Step ${steps.length + 1}`,
      position: steps.length,
      minQuantity: 1,
      maxQuantity: 1,
      enabled: true,
      StepProduct: [],
      icon: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productCategory: null,
      collections: null,
      products: null,
      displayVariantsAsIndividual: false,
      bundleId: bundle.id,
    };
    setSteps([...steps, newStep] as any);
    setExpandedSteps(new Set([...Array.from(expandedSteps), newStep.id]));
  }, [steps, expandedSteps, bundle.id]);


  const toggleStepExpansion = useCallback((stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  }, [expandedSteps]);

  const updateStepField = useCallback((stepId: string, field: string, value: any) => {
    setSteps(prev => {
      const newSteps = prev.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      ) as any;
      
      // Trigger save bar for step field changes
      triggerSaveBar();
      
      return newSteps;
    });
  }, [triggerSaveBar]);

  // Condition management functions
  const addConditionRule = useCallback((stepId: string) => {
    const newRule = {
      id: `rule-${Date.now()}`,
      type: 'quantity',
      operator: 'is_equal_to',
      value: '0',
    };
    setStepConditions(prev => ({
      ...prev,
      [stepId]: [...(prev[stepId] || []), newRule],
    }));
    
    // Trigger save bar for adding step condition
    triggerSaveBar();
  }, [triggerSaveBar]);

  const removeConditionRule = useCallback((stepId: string, ruleId: string) => {
    setStepConditions(prev => ({
      ...prev,
      [stepId]: (prev[stepId] || []).filter(rule => rule.id !== ruleId),
    }));
    
    // Trigger save bar for removing step condition
    triggerSaveBar();
  }, [triggerSaveBar]);

  const updateConditionRule = useCallback((stepId: string, ruleId: string, field: string, value: string) => {
    setStepConditions(prev => ({
      ...prev,
      [stepId]: (prev[stepId] || []).map(rule =>
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      ),
    }));
    
    // Trigger save bar for updating step condition
    triggerSaveBar();
  }, [triggerSaveBar]);

  // Product selection handlers
  const handleProductSelection = useCallback(async (stepId: string) => {
    try {
      const step = steps.find(s => s.id === stepId);
      const currentProducts = step?.StepProduct || [];
      
      const products = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: currentProducts.map((p) => ({ id: p.id })),
      });

      if (products && products.selection) {
        // Update the step with selected products
        setSteps(steps.map(step => 
          step.id === stepId 
            ? { ...step, StepProduct: products.selection }
            : step
        ) as any);
        
        // Trigger save bar for product selection changes
        triggerSaveBar();
        
        shopify.toast.show("Products updated successfully!");
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      console.log("Product selection cancelled or failed:", error);
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error : 
                          (error && typeof error === 'object' && 'message' in error) ? error.message : '';
      
      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
                            errorMessage?.toLowerCase().includes('abort') ||
                            errorMessage?.toLowerCase().includes('dismiss') ||
                            errorMessage?.toLowerCase().includes('close') ||
                            error === null || error === undefined;
      
      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show("Failed to select products", { isError: true });
      }
    }
  }, [steps, shopify, triggerSaveBar]);

  const handleSyncProduct = useCallback(() => {
    try {
      console.log("Syncing bundle product...");
      
      // Prepare form data for sync operation
      const formData = new FormData();
      formData.append("intent", "syncProduct");

      // Submit to server action using fetcher
      fetcher.submit(formData, { method: "post" });
      
      // Response will be handled by the existing useEffect
    } catch (error) {
      console.error("Product sync failed:", error);
      shopify.toast.show(error.message || "Failed to sync product", { isError: true });
    }
  }, [fetcher, shopify]);

  const handleBundleProductSelect = useCallback(async () => {
    try {
      const products = await shopify.resourcePicker({
        type: "product",
        multiple: false,
      });
      
      if (products.length > 0) {
        const selectedProduct = products[0];
        setBundleProduct(selectedProduct);
        console.log("Bundle product selected:", selectedProduct);
        shopify.toast.show("Bundle product updated successfully", { isError: false });
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      console.log("Bundle product selection cancelled or failed:", error);
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error : 
                          (error && typeof error === 'object' && 'message' in error) ? error.message : '';
      
      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
                            errorMessage?.toLowerCase().includes('abort') ||
                            errorMessage?.toLowerCase().includes('dismiss') ||
                            errorMessage?.toLowerCase().includes('close') ||
                            error === null || error === undefined;
      
      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show("Failed to select bundle product", { isError: true });
      }
    }
  }, [shopify]);

  const handleProductStatusChange = useCallback(async (newStatus: string) => {
    try {
      setProductStatus(newStatus);
      // TODO: Implement actual product status update via GraphQL
      console.log("Product status changed to:", newStatus);
      shopify.toast.show("Product status updated successfully", { isError: false });
    } catch (error) {
      console.error("Product status update failed:", error);
      shopify.toast.show("Failed to update product status", { isError: true });
    }
  }, [shopify]);

  // Step management handlers
  const cloneStep = useCallback((stepId: string) => {
    const stepToClone = steps.find(step => step.id === stepId);
    if (stepToClone) {
      const newStep = {
        ...stepToClone,
        id: `step-${Date.now()}`,
        name: `${stepToClone.name} (Copy)`,
        StepProduct: stepToClone.StepProduct || []
      };
      setSteps(prev => {
        const stepIndex = prev.findIndex(step => step.id === stepId);
        const newSteps = [...prev];
        newSteps.splice(stepIndex + 1, 0, newStep);
        
        // Update the hidden form input immediately to trigger save bar
        setTimeout(() => {
          const stepsInput = document.querySelector('input[name="stepsData"]') as HTMLInputElement;
          if (stepsInput) {
            stepsInput.value = JSON.stringify(newSteps);
            // Trigger an input event to notify App Bridge of the change
            const event = new Event('input', { bubbles: true });
            stepsInput.dispatchEvent(event);
          }
        }, 0);
        
        return newSteps;
      });
      shopify.toast.show("Step cloned successfully", { isError: false });
    }
  }, [steps, shopify]);

  const deleteStep = useCallback((stepId: string) => {
    if (steps.length <= 1) {
      shopify.toast.show("Cannot delete the last step", { isError: true });
      return;
    }
    setSteps(prev => {
      const newSteps = prev.filter(step => step.id !== stepId);
      
      // Update the hidden form input immediately to trigger save bar
      setTimeout(() => {
        const stepsInput = document.querySelector('input[name="stepsData"]') as HTMLInputElement;
        if (stepsInput) {
          stepsInput.value = JSON.stringify(newSteps);
          // Trigger an input event to notify App Bridge of the change
          const event = new Event('input', { bubbles: true });
          stepsInput.dispatchEvent(event);
        }
      }, 0);
      
      return newSteps;
    });
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
    shopify.toast.show("Step deleted successfully", { isError: false });
  }, [steps, shopify]);

  // Drag and drop state
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, stepId: string, index: number) => {
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
    
    const dragIndex = steps.findIndex(step => step.id === draggedStep);
    
    if (dragIndex !== -1 && dragIndex !== dropIndex) {
      setSteps(prev => {
        const newSteps = [...prev];
        const draggedStepData = newSteps[dragIndex];
        newSteps.splice(dragIndex, 1);
        newSteps.splice(dropIndex, 0, draggedStepData);
        
        // Update the hidden form input immediately to trigger save bar
        setTimeout(() => {
          const stepsInput = document.querySelector('input[name="stepsData"]') as HTMLInputElement;
          if (stepsInput) {
            stepsInput.value = JSON.stringify(newSteps);
            // Trigger an input event to notify App Bridge of the change
            const event = new Event('input', { bubbles: true });
            stepsInput.dispatchEvent(event);
          }
        }, 0);
        
        return newSteps;
      });
      
      shopify.toast.show("Step reordered successfully", { isError: false });
    }
    
    setDraggedStep(null);
    setDragOverIndex(null);
  }, [draggedStep, steps, shopify]);

  const addStep = useCallback(() => {
    const newStep = {
      id: `step-${Date.now()}`,
      name: `Step ${steps.length + 1}`,
      pageTitle: '',
      collections: [],
      products: [],
      StepProduct: [],
      displayVariantsAsIndividual: false
    };
    setSteps(prev => {
      const newSteps = [...prev, newStep];
      // Trigger save bar for adding step
      triggerSaveBar();
      return newSteps;
    });
    setExpandedSteps(prev => new Set([...prev, newStep.id]));
    shopify.toast.show("Step added successfully", { isError: false });
  }, [steps, shopify]);

  // Collection management handlers
  const handleCollectionSelection = useCallback(async (stepId: string) => {
    try {
      const collections = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
      });
      
      if (collections.length > 0) {
        setSelectedCollections(prev => ({
          ...prev,
          [stepId]: collections
        }));
        
        // Trigger save bar for collection selection changes
        triggerSaveBar();
        
        shopify.toast.show("Collections updated successfully", { isError: false });
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      console.log("Collection selection cancelled or failed:", error);
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error : 
                          (error && typeof error === 'object' && 'message' in error) ? error.message : '';
      
      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
                            errorMessage?.toLowerCase().includes('abort') ||
                            errorMessage?.toLowerCase().includes('dismiss') ||
                            errorMessage?.toLowerCase().includes('close') ||
                            error === null || error === undefined;
      
      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show("Failed to select collections", { isError: true });
      }
    }
  }, [shopify, triggerSaveBar]);

  // Discount rule management
  const addDiscountRule = useCallback(() => {
    let newRule;
    
    if (discountType === 'fixed_bundle_price') {
      newRule = {
        id: `rule-${Date.now()}`,
        numberOfProducts: 0,
        price: 0,
      };
    } else {
      // For percentage_off and fixed_amount_off
      newRule = {
        id: `rule-${Date.now()}`,
        type: 'amount', // amount or quantity
        condition: 'greater_than_equal_to', // greater_than_equal_to, less_than_equal_to, equal_to
        value: 0,
        discountValue: 0, // percentage or fixed amount
      };
    }
    
    setDiscountRules([...discountRules, newRule]);
    
    // Initialize messaging for new rule
    setRuleMessages(prev => ({
      ...prev,
      [newRule.id]: {
        discountText: 'Add {{discountConditionDiff}} {{discountUnit}} to get the bundle at {{discountValueUnit}}{{discountValue}}',
        successMessage: 'Congratulations 🎉 you have gotten the best offer on your bundle!'
      }
    }));
    
    // Trigger save bar for adding discount rule
    triggerSaveBar();
  }, [discountRules, discountType, triggerSaveBar]);

  const removeDiscountRule = useCallback((ruleId: string) => {
    setDiscountRules(discountRules.filter(rule => rule.id !== ruleId));
    // Remove messaging for deleted rule
    setRuleMessages(prev => {
      const updated = { ...prev };
      delete updated[ruleId];
      return updated;
    });
    
    // Trigger save bar for removing discount rule
    triggerSaveBar();
  }, [discountRules, triggerSaveBar]);

  const updateDiscountRule = useCallback((ruleId: string, field: string, value: any) => {
    // Ensure numeric values are never negative
    let processedValue = value;
    if (['numberOfProducts', 'price', 'value', 'discountValue'].includes(field)) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      processedValue = Math.max(0, numValue || 0);
    }
    
    setDiscountRules(discountRules.map(rule => 
      rule.id === ruleId ? { ...rule, [field]: processedValue } : rule
    ));
    
    // Trigger save bar for updating discount rule
    triggerSaveBar();
  }, [discountRules, triggerSaveBar]);

  // Rule message management
  const updateRuleMessage = useCallback((ruleId: string, field: 'discountText' | 'successMessage', value: string) => {
    setRuleMessages(prev => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: value
      }
    }));
    
    // Trigger save bar for rule message changes
    triggerSaveBar();
  }, [triggerSaveBar]);

  // Function to load available theme templates
  const loadAvailablePages = useCallback(() => {
    setIsLoadingPages(true);
    try {
      const formData = new FormData();
      formData.append("intent", "getThemeTemplates");

      fetcher.submit(formData, { method: "post" });
      // Response will be handled by the existing useEffect
    } catch (error) {
      console.error("Failed to load theme templates:", error);
      shopify.toast.show("Failed to load theme templates", { isError: true });
      setIsLoadingPages(false);
    }
  }, [fetcher, shopify]);

  // Place widget handlers with page selection modal
  const handlePlaceWidget = useCallback(() => {
    try {
      console.log('Opening page selection modal');
      setIsPageSelectionModalOpen(true);
      loadAvailablePages();
    } catch (error) {
      console.error('Error opening page selection:', error);
      shopify.toast.show("Failed to open page selection", { isError: true });
    }
  }, [loadAvailablePages, shopify]);

  const handlePageSelection = useCallback((template: any) => {
    try {
      console.log('Template selected:', template);
      
      if (!template || !template.handle) {
        console.error('Invalid template object:', template);
        shopify.toast.show("Template data is invalid", { isError: true });
        return;
      }

      const shopDomain = shop.includes('.myshopify.com') 
        ? shop.replace('.myshopify.com', '') 
        : shop;

      // Use correct app block ID format: {client_id}/{block_handle}
      // The block handle is the filename without .liquid (bundle.liquid -> bundle)
      const appBlockId = 'bfda5624970c7ada838998eb951e9e85/bundle';
      
      // Generate theme editor deep link for template with app block
      // Format based on Shopify documentation: https://{shop}.myshopify.com/admin/themes/current/editor?template={template}&addAppBlockId={appBlockId}
      const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${template.handle}&addAppBlockId=${appBlockId}&target=newAppsSection`;

      console.log('Generated theme editor URL:', themeEditorUrl);

      setSelectedPage(template);
      setIsPageSelectionModalOpen(false);

      // Open theme editor in new tab
      window.open(themeEditorUrl, '_blank', 'noopener,noreferrer');
      
      shopify.toast.show(`Theme editor opened for "${template.title}". Look for "Bundle Builder" in the Apps section and drag it to your desired location.`, { isError: false, duration: 6000 });
      
    } catch (error) {
      console.error('Error opening theme editor:', error);
      shopify.toast.show("Failed to open theme editor", { isError: true });
    }
  }, [shop, shopify]);

  // Bundle setup navigation items
  const bundleSetupItems = [
    { id: "step_setup", label: "Step Setup", icon: ListNumberedIcon },
    { id: "discount_pricing", label: "Discount & Pricing", icon: DiscountIcon },
    // Bundle Upsell and Bundle Settings disabled for later release
    // { id: "bundle_upsell", label: "Bundle Upsell", icon: SettingsIcon },
    // { id: "bundle_settings", label: "Bundle Settings", icon: SettingsIcon },
  ];

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ];

  // Product status options based on Shopify ProductStatus enum
  const productStatusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Draft", value: "DRAFT" },
    { label: "Archived", value: "ARCHIVED" },
  ];

  return (
    <Page>
      {/* Modern App Bridge contextual save bar using form with data-save-bar */}
      <form 
        data-save-bar
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        onReset={(e) => {
          e.preventDefault();
          handleDiscard();
        }}
      >
        {/* Hidden form inputs to track changes for App Bridge contextual save bar */}
        <input 
          type="hidden" 
          name="bundleName" 
          value={bundleName} 
          readOnly
        />
        <input 
          type="hidden" 
          name="bundleDescription" 
          value={bundleDescription} 
          readOnly
        />
        <input 
          type="hidden" 
          name="bundleStatus" 
          value={bundleStatus} 
          readOnly
        />
        <input 
          type="hidden" 
          name="stepsData" 
          value={JSON.stringify(steps)} 
          readOnly
        />
        <input 
          type="hidden" 
          name="discountData" 
          value={JSON.stringify({ discountEnabled, discountType, discountRules })} 
          readOnly
        />
        {/* Page Header */}
      <div style={{ marginBottom: "20px" }}>
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Button 
              variant="tertiary" 
              onClick={handleBackClick}
              icon={ArrowLeftIcon}
              disabled={hasUnsavedChanges}
            />
            <Text variant="headingLg" as="h1">
              Configure Bundle Flow
            </Text>
          </InlineStack>
          <Button 
            variant="primary" 
            onClick={handlePreviewBundle}
            icon={ViewIcon}
            disabled={hasUnsavedChanges}
          >
            Preview Bundle
          </Button>
        </InlineStack>
      </div>

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
                <Text variant="bodySm" tone="subdued">
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
                      disabled={hasUnsavedChanges && activeSection !== item.id}
                      onClick={() => handleSectionChange(item.id)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Bundle Product Card */}
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
                  <InlineStack gap="300" blockAlign="center">
                    <Thumbnail
                      source={bundleProduct.featuredImage?.url || bundleProduct.images?.[0]?.originalSrc || "/bundle.png"}
                      alt={bundleProduct.title || "Bundle Product"}
                      size="small"
                    />
                    <InlineStack gap="200" blockAlign="center">
                      <Button
                        variant="plain"
                        url={`https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${bundleProduct.legacyResourceId || bundleProduct.id?.split('/').pop()}`}
                        external
                        icon={ExternalIcon}
                      >
                        {bundleProduct.title || "Untitled Product"}
                      </Button>
                      <Button
                        variant="tertiary"
                        size="micro"
                        icon={RefreshIcon}
                        onClick={handleBundleProductSelect}
                        accessibilityLabel="Change bundle product"
                      />
                    </InlineStack>
                  </InlineStack>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '80px',
                    border: '1px dashed #ccc',
                    borderRadius: '8px'
                  }}>
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
                    options={statusOptions}
                    value={bundleStatus}
                    onChange={setBundleStatus}
                  />
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Take your bundle live Card */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingSm" as="h3">
                  Take your bundle live
                </Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodyMd">
                    Place on theme
                  </Text>
                  <Button 
                    icon={SettingsIcon}
                    onClick={handlePlaceWidget}
                  >
                    Place Widget
                  </Button>
                </InlineStack>
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
                  <Text variant="bodyMd" tone="subdued">
                    Create steps for your multi-step bundle here. Select product options for each step below
                  </Text>
                </BlockStack>

                {/* Steps List */}
                <BlockStack gap="300">
                  {steps.map((step, index) => (
                  <Card 
                    key={step.id} 
                    background="bg-surface-secondary"
                  >
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, step.id, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{
                        cursor: draggedStep === step.id ? 'grabbing' : 'grab',
                        transition: 'all 0.2s ease',
                        transform: dragOverIndex === index && draggedStep !== step.id ? 'translateY(-4px)' : 'translateY(0)',
                        boxShadow: dragOverIndex === index && draggedStep !== step.id 
                          ? '0 8px 16px rgba(0,0,0,0.15), 0 0 0 2px rgba(33, 150, 243, 0.3)' 
                          : draggedStep === step.id 
                            ? '0 4px 12px rgba(0,0,0,0.2)' 
                            : 'none',
                        opacity: draggedStep === step.id ? 0.6 : 1,
                        border: dragOverIndex === index && draggedStep !== step.id 
                          ? '2px dashed rgba(33, 150, 243, 0.5)' 
                          : '2px solid transparent',
                        borderRadius: '8px',
                        position: 'relative' as const,
                        zIndex: draggedStep === step.id ? 1000 : 1,
                        background: dragOverIndex === index && draggedStep !== step.id 
                          ? 'rgba(33, 150, 243, 0.05)' 
                          : undefined
                      }}
                    >
                      <BlockStack gap="300">
                        {/* Step Header */}
                        <InlineStack align="space-between" blockAlign="center" gap="300">
                          <InlineStack gap="200" blockAlign="center">
                            <Icon source={DragHandleIcon} tone="subdued" />
                            <Text variant="bodyMd" fontWeight="medium">
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
                            icon={expandedSteps.has(step.id) ? ChevronUpIcon : ChevronDownIcon}
                            onClick={() => toggleStepExpansion(step.id)}
                            accessibilityLabel={expandedSteps.has(step.id) ? "Collapse step" : "Expand step"}
                          />
                        </InlineStack>
                      </InlineStack>

                      {/* Expanded Step Content */}
                      <Collapsible open={expandedSteps.has(step.id)}>
                        <BlockStack gap="400">
                          {/* Step Name and Page Title */}
                          <FormLayout>
                            <TextField
                              label="Step Name"
                              value={step.name}
                              onChange={(value) => updateStepField(step.id, 'name', value)}
                              autoComplete="off"
                            />
                            <TextField
                              label="Step Page Title"
                              value={step.pageTitle || ''}
                              onChange={(value) => updateStepField(step.id, 'pageTitle', value)}
                              autoComplete="off"
                            />
                          </FormLayout>

                          {/* Products/Collections Tabs */}
                          <BlockStack gap="300">
                            <Tabs
                              tabs={[
                                {
                                  id: 'products',
                                  content: `Products ${step.StepProduct?.length > 0 ? step.StepProduct.length : ''}`,
                                  badge: step.StepProduct?.length > 0 ? step.StepProduct.length.toString() : undefined,
                                },
                                {
                                  id: 'collections',
                                  content: 'Collections',
                                },
                              ]}
                              selected={selectedTab}
                              onSelect={setSelectedTab}
                            />

                            {selectedTab === 0 && (
                              <BlockStack gap="200">
                                <Text variant="bodyMd" tone="subdued">
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
                                  {step.StepProduct?.length > 0 && (
                                    <Badge tone="info">
                                      <Button
                                        variant="plain"
                                        size="micro"
                                        onClick={() => handleShowProducts(step.id)}
                                      >
                                        {step.StepProduct.length} Selected
                                      </Button>
                                    </Badge>
                                  )}
                                </InlineStack>
                                <Checkbox
                                  label="Display variants as individual products"
                                  checked={step.displayVariantsAsIndividual || false}
                                  onChange={(checked) => updateStepField(step.id, 'displayVariantsAsIndividual', checked)}
                                />
                              </BlockStack>
                            )}

                            {selectedTab === 1 && (
                              <BlockStack gap="200">
                                <Text variant="bodyMd" tone="subdued">
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
                                      <Button
                                        variant="plain"
                                        size="micro"
                                        onClick={() => handleShowCollections(step.id)}
                                      >
                                        {selectedCollections[step.id].length} Selected
                                      </Button>
                                    </Badge>
                                  )}
                                </InlineStack>

                                {/* Display selected collections */}
                                {selectedCollections[step.id]?.length > 0 && (
                                  <BlockStack gap="100">
                                    <Text variant="bodyMd" fontWeight="medium">
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
                                          <Text variant="bodyMd">{collection.title}</Text>
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
                              <Text variant="bodyMd" tone="subdued">
                                Create Conditions based on amount or quantity of products added on this step.
                              </Text>
                              <Text variant="bodySm" tone="subdued">
                                Note: Conditions are only valid on this step
                              </Text>
                            </BlockStack>
                            
                            {/* Existing Condition Rules */}
                            {(stepConditions[step.id] || []).map((rule, ruleIndex) => (
                              <Card key={rule.id} background="bg-surface-secondary">
                                <BlockStack gap="200">
                                  <InlineStack align="space-between" blockAlign="center">
                                    <Text variant="bodyMd" fontWeight="medium">
                                      Condition #{ruleIndex + 1}
                                    </Text>
                                    <Button
                                      variant="plain"
                                      tone="critical"
                                      onClick={() => removeConditionRule(step.id, rule.id)}
                                    >
                                      Remove
                                    </Button>
                                  </InlineStack>
                                  
                                  <InlineStack gap="200" align="start">
                                    <Select
                                      options={[
                                        { label: 'Quantity', value: 'quantity' },
                                        { label: 'Amount', value: 'amount' },
                                      ]}
                                      value={rule.type}
                                      onChange={(value) => updateConditionRule(step.id, rule.id, 'type', value)}
                                    />
                                    <Select
                                      options={[
                                        { label: 'is equal to', value: 'is_equal_to' },
                                        { label: 'is greater than', value: 'is_greater_than' },
                                        { label: 'is less than', value: 'is_less_than' },
                                        { label: 'is greater than or equal to', value: 'is_greater_than_or_equal_to' },
                                        { label: 'is less than or equal to', value: 'is_less_than_or_equal_to' },
                                      ]}
                                      value={rule.operator}
                                      onChange={(value) => updateConditionRule(step.id, rule.id, 'operator', value)}
                                    />
                                    <TextField
                                      value={rule.value}
                                      onChange={(value) => updateConditionRule(step.id, rule.id, 'value', value)}
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
                              onClick={() => addConditionRule(step.id)}
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
                    variant="dashed" 
                    fullWidth
                    icon={PlusIcon}
                    onClick={addStep}
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
                  <Text variant="bodyMd" tone="subdued">
                    Set up to 4 discount rules, applied from lowest to highest.
                  </Text>
                </BlockStack>

                {/* Discount Enable Toggle */}
                <FormLayout>
                  <Checkbox
                    label="Discount & Pricing"
                    checked={discountEnabled}
                    onChange={setDiscountEnabled}
                  />
                </FormLayout>

                {discountEnabled && (
                  <BlockStack gap="400">
                    {/* Discount Type */}
                    <Select
                      label="Discount Type"
                      options={[
                        { label: 'Fixed Bundle Price', value: 'fixed_bundle_price' },
                        { label: 'Percentage Off', value: 'percentage_off' },
                        { label: 'Fixed Amount Off', value: 'fixed_amount_off' },
                      ]}
                      value={discountType}
                      onChange={(value) => {
                        setDiscountType(value);
                        // Clear existing rules when discount type changes since field structure is different
                        setDiscountRules([]);
                        // Clear rule messages when discount type changes
                        setRuleMessages({});
                      }}
                    />

                    {/* Discount Rules */}
                    <BlockStack gap="300">
                      {discountRules.map((rule, index) => (
                        <Card key={rule.id} background="bg-surface-secondary">
                          <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                              <Text variant="bodyMd" fontWeight="medium">
                                Rule #{index + 1}
                              </Text>
                              <Button
                                variant="plain"
                                tone="critical"
                                onClick={() => removeDiscountRule(rule.id)}
                              >
                                Remove
                              </Button>
                            </InlineStack>
                            
                            {/* Render different fields based on discount type */}
                            {discountType === 'fixed_bundle_price' ? (
                              <InlineStack gap="200" align="start">
                                <TextField
                                  label="Number of Products in Bundle"
                                  value={String(rule.numberOfProducts || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'numberOfProducts', parseInt(value) || 0)}
                                  type="number"
                                  min="0"
                                  autoComplete="off"
                                />
                                <TextField
                                  label="Price"
                                  value={String(rule.price || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'price', parseFloat(value) || 0)}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  prefix="₹"
                                  autoComplete="off"
                                />
                              </InlineStack>
                            ) : (
                              <BlockStack gap="300">
                                <InlineStack gap="200" align="start">
                                  <Select
                                    label="Type"
                                    options={[
                                      { label: 'Amount', value: 'amount' },
                                      { label: 'Quantity', value: 'quantity' },
                                    ]}
                                    value={rule.type || 'amount'}
                                    onChange={(value) => updateDiscountRule(rule.id, 'type', value)}
                                  />
                                  <Select
                                    label="Condition"
                                    options={[
                                      { label: 'Greater than & equal to', value: 'greater_than_equal_to' },
                                      { label: 'Less than & equal to', value: 'less_than_equal_to' },
                                      { label: 'Equal to', value: 'equal_to' },
                                    ]}
                                    value={rule.condition || 'greater_than_equal_to'}
                                    onChange={(value) => updateDiscountRule(rule.id, 'condition', value)}
                                  />
                                  <TextField
                                    label="Value"
                                    value={String(rule.value || 0)}
                                    onChange={(value) => updateDiscountRule(rule.id, 'value', parseFloat(value) || 0)}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    autoComplete="off"
                                  />
                                </InlineStack>
                                <TextField
                                  label={discountType === 'percentage_off' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                                  value={String(rule.discountValue || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'discountValue', parseFloat(value) || 0)}
                                  type="number"
                                  min="0"
                                  max={discountType === 'percentage_off' ? "100" : undefined}
                                  step="0.01"
                                  prefix={discountType === 'fixed_amount_off' ? '₹' : undefined}
                                  suffix={discountType === 'percentage_off' ? '%' : undefined}
                                  autoComplete="off"
                                />
                              </BlockStack>
                            )}
                          </BlockStack>
                        </Card>
                      ))}

                      {discountRules.length < 4 && (
                        <Button 
                          variant="tertiary" 
                          fullWidth
                          icon={PlusIcon}
                          onClick={addDiscountRule}
                        >
                          Add rule
                        </Button>
                      )}
                    </BlockStack>

                    {/* Discount Display Options */}
                    <BlockStack gap="300">
                      <Text variant="headingSm" as="h4">
                        Discount Display Options
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        Choose how discounts are displayed
                      </Text>
                      <Checkbox
                        label="Discount Display Options"
                        checked={discountDisplayEnabled}
                        onChange={setDiscountDisplayEnabled}
                      />
                    </BlockStack>

                    {/* Discount Messaging */}
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text variant="headingSm" as="h4">
                            Discount Messaging
                          </Text>
                          <Text variant="bodyMd" tone="subdued">
                            Edit how discount messages appear above the subtotal.
                          </Text>
                        </BlockStack>
                        <Checkbox
                          label="Discount Messaging"
                          checked={discountMessagingEnabled}
                          onChange={setDiscountMessagingEnabled}
                        />
                      </InlineStack>

                      <Button 
                        variant="plain"
                        onClick={() => setShowVariables(!showVariables)}
                      >
                        Show Variables
                      </Button>

                      {/* Show available variables when toggled */}
                      {showVariables && (
                        <Card background="bg-surface-secondary">
                          <BlockStack gap="300">
                            <Text variant="headingSm" as="h4">
                              Variables
                            </Text>
                            <BlockStack gap="200">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd">
                                  Discount Condition Difference
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {'{{discountConditionDiff}}'}
                                </Text>
                              </InlineStack>
                              
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd">
                                  Discount Unit
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {'{{discountUnit}}'}
                                </Text>
                              </InlineStack>
                              
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd">
                                  Discount Value
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {'{{discountValue}}'}
                                </Text>
                              </InlineStack>
                              
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd">
                                  Discount Value Unit
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {'{{discountValueUnit}}'}
                                </Text>
                              </InlineStack>
                            </BlockStack>
                          </BlockStack>
                        </Card>
                      )}

                      {/* Dynamic rule-based messaging */}
                      {discountMessagingEnabled && discountRules.length > 0 && (
                        <BlockStack gap="300">
                          {discountRules.map((rule, index) => (
                            <BlockStack key={rule.id} gap="300">
                              <Card background="bg-surface-secondary">
                                <BlockStack gap="200">
                                  <Text variant="bodyMd" fontWeight="medium">
                                    Rule #{index + 1}
                                  </Text>
                                  <Text variant="bodySm" tone="subdued">
                                    Discount Text
                                  </Text>
                                  <TextField
                                    value={ruleMessages[rule.id]?.discountText || 'Add {{discountConditionDiff}} {{discountUnit}} to get the bundle at {{discountValueUnit}}{{discountValue}}'}
                                    onChange={(value) => updateRuleMessage(rule.id, 'discountText', value)}
                                    multiline={2}
                                    autoComplete="off"
                                    helpText="This message appears when the customer is close to qualifying for the discount"
                                  />
                                </BlockStack>
                              </Card>

                              <Card background="bg-surface-secondary">
                                <BlockStack gap="200">
                                  <Text variant="bodyMd" fontWeight="medium">
                                    Success Message
                                  </Text>
                                  <TextField
                                    value={ruleMessages[rule.id]?.successMessage || 'Congratulations 🎉 you have gotten the best offer on your bundle!'}
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
                      {discountMessagingEnabled && discountRules.length === 0 && (
                        <Card background="bg-surface-secondary">
                          <BlockStack gap="200" inlineAlign="center">
                            <Text variant="bodyMd" tone="subdued" alignment="center">
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
        </Layout.Section>
      </Layout>
      </form>

      {/* Page Selection Modal */}
      <Modal
        open={isPageSelectionModalOpen}
        onClose={() => setIsPageSelectionModalOpen(false)}
        title="Select Template for Widget Placement"
        primaryAction={{
          content: "Cancel",
          onAction: () => setIsPageSelectionModalOpen(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd">
              Choose a page template where you want to place the Bundle Builder widget. The theme editor will open with the selected template ready for widget configuration. Look for the "Bundle Builder" app block in the Apps section and drag it to your desired location.
            </Text>
            
            {isLoadingPages ? (
              <BlockStack gap="200" inlineAlign="center">
                <Text variant="bodyMd" tone="subdued">Loading templates...</Text>
              </BlockStack>
            ) : availablePages.length > 0 ? (
              <BlockStack gap="200">
                {availablePages.map((template) => (
                  <Card key={template.id} sectioned>
                    <InlineStack wrap={false} gap="300" align="space-between">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text variant="bodyMd" fontWeight="medium">
                            {template.title}
                          </Text>
                          {template.recommended && (
                            <Badge tone="success">Recommended</Badge>
                          )}
                          {template.fileType && (
                            <Badge tone="info">{template.fileType}</Badge>
                          )}
                        </InlineStack>
                        <Text variant="bodySm" tone="subdued">
                          {template.description}
                        </Text>
                        <Text variant="bodyXs" tone="subdued">
                          Template: {template.handle}
                        </Text>
                      </BlockStack>
                      <Button
                        onClick={() => handlePageSelection(template)}
                        primary
                        icon={ExternalIcon}
                      >
                        Select Template
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Card sectioned>
                <BlockStack gap="200" inlineAlign="center">
                  <Text variant="bodyMd" tone="subdued" alignment="center">
                    No pages found in your store. You can create pages in your Shopify admin and return here to place the widget.
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
              const currentStep = steps.find(step => step.id === currentModalStepId);
              const selectedProducts = currentStep?.StepProduct || [];
              
              return selectedProducts.length > 0 ? (
                <BlockStack gap="300">
                  <Text variant="bodyMd" fontWeight="medium">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for this step:
                  </Text>
                  <Card>
                    <List type="bullet">
                      {selectedProducts.map((product: any, index: number) => (
                        <List.Item key={product.id || index}>
                          <InlineStack gap="200" align="space-between">
                            <BlockStack gap="050">
                              <Text variant="bodyMd" fontWeight="medium">
                                {product.title || product.name || 'Unnamed Product'}
                              </Text>
                              {product.variants && product.variants.length > 0 && (
                                <Text variant="bodySm" tone="subdued">
                                  {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} available
                                </Text>
                              )}
                            </BlockStack>
                            <Badge tone="info">Product</Badge>
                          </InlineStack>
                        </List.Item>
                      ))}
                    </List>
                  </Card>
                </BlockStack>
              ) : (
                <BlockStack gap="200" inlineAlign="center">
                  <Text variant="bodyMd" tone="subdued">
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
                  <Text variant="bodyMd" fontWeight="medium">
                    {collections.length} collection{collections.length !== 1 ? 's' : ''} selected for this step:
                  </Text>
                  <Card>
                    <List type="bullet">
                      {collections.map((collection: any, index: number) => (
                        <List.Item key={collection.id || index}>
                          <InlineStack gap="200" align="space-between">
                            <BlockStack gap="050">
                              <Text variant="bodyMd" fontWeight="medium">
                                {collection.title || 'Unnamed Collection'}
                              </Text>
                              {collection.handle && (
                                <Text variant="bodySm" tone="subdued">
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
                  <Text variant="bodyMd" tone="subdued">
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