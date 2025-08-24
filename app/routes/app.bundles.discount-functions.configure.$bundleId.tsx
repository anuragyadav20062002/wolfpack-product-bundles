import { useState, useEffect, useCallback } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
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
  bundleType: 'discount_function';
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
      bundleType: 'discount_function'
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

  // Discount function bundles don't need bundle product data
  return json({ 
    bundle,
    shop: session.shop,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const { bundleId } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (!bundleId) {
    return json({ success: false, error: "Bundle ID is required" }, { status: 400 });
  }

  try {
    switch (intent) {
      case "saveBundle":
        return await handleSaveBundle(admin, session, bundleId, formData);
      case "updateBundleStatus":
        return await handleUpdateBundleStatus(admin, session, bundleId, formData);
      case "syncProduct":
        // Discount function bundles don't need product sync functionality
        return json({ success: true, message: "Sync not needed for discount function bundles" });
      case "getPages":
        return await handleGetPages(admin, session);
      case "getCurrentTheme":
        return await handleGetCurrentTheme(admin, session);
      case "createDiscountCode":
        return await handleCreateDiscountCode(admin, session, bundleId, formData);
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
              name: step.name,
              pageTitle: step.pageTitle || step.name,
              stepNumber: index + 1,
              products: step.products || [],
              collections: step.collections || [],
              conditions: step.conditions || [],
              displayVariantsAsIndividualProducts: step.displayVariantsAsIndividualProducts || false
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
              discountMethod: discountData.discountType,
              rules: discountData.discountRules || [],
              displaySettings: {
                showDiscountDisplay: discountData.discountDisplayEnabled || false,
                showDiscountMessaging: discountData.discountMessagingEnabled || false,
                ruleMessages: discountData.ruleMessages || {}
              }
            },
            update: {
              enableDiscount: discountData.discountEnabled,
              discountMethod: discountData.discountType,
              rules: discountData.discountRules || [],
              displaySettings: {
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

  // For discount function bundles, metafields are applied to the selected products instead of a bundle product
  // This is handled in the discount function itself

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

// Handle creating discount codes for discount function bundles
async function handleCreateDiscountCode(admin: any, session: any, bundleId: string, formData: FormData) {
  const codePrefix = formData.get("codePrefix") as string;
  const ruleId = formData.get("ruleId") as string;
  
  // Generate a unique discount code with timestamp
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const discountCode = `${codePrefix}${timestamp}`;
  
  const CREATE_DISCOUNT_CODE = `
    mutation CreateDiscountCode($codeAppDiscount: DiscountCodeAppInput!) {
      discountCodeAppCreate(codeAppDiscount: $codeAppDiscount) {
        codeAppDiscount {
          discountId
          codes(first: 1) {
            nodes {
              id
              code
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(CREATE_DISCOUNT_CODE, {
    variables: {
      codeAppDiscount: {
        code: discountCode,
        title: `Bundle Discount - ${codePrefix}`,
        functionId: process.env.SHOPIFY_DISCOUNT_FUNCTION_ID || "", // You'll need to set this
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        usageLimit: 1,
        appliesOncePerCustomer: true
      }
    }
  });

  const data = await response.json();

  if (data.data?.discountCodeAppCreate?.userErrors?.length > 0) {
    const error = data.data.discountCodeAppCreate.userErrors[0];
    throw new Error(`Failed to create discount code: ${error.message}`);
  }

  return json({
    success: true,
    discountCode,
    discountId: data.data?.discountCodeAppCreate?.codeAppDiscount?.discountId,
    message: "Discount code created successfully"
  });
}

export default function ConfigureDiscountFunctionBundle() {
  const { bundle, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  
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
  
  // State for product/collection selection for discount function bundles
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedBundleCollections, setSelectedBundleCollections] = useState<any[]>([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isCollectionPickerOpenForBundle, setIsCollectionPickerOpenForBundle] = useState(false);
  
  // State for product/collection management modals
  const [isProductManagementModalOpen, setIsProductManagementModalOpen] = useState(false);
  const [isCollectionManagementModalOpen, setIsCollectionManagementModalOpen] = useState(false);
  
  // State for step-specific product/collection management modals
  const [isStepProductModalOpen, setIsStepProductModalOpen] = useState(false);
  const [isStepCollectionModalOpen, setIsStepCollectionModalOpen] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  
  // State for collections
  const [selectedCollections, setSelectedCollections] = useState<Record<string, any[]>>({});
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [currentStepIdForCollection, setCurrentStepIdForCollection] = useState<string | null>(null);
  
  // State for discount & pricing
  const [discountEnabled, setDiscountEnabled] = useState(bundle.pricing?.enableDiscount || false);
  const [discountType, setDiscountType] = useState(bundle.pricing?.discountMethod || 'fixed_amount_off');
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
    discountType: bundle.pricing?.discountMethod || 'fixed_amount_off',
    discountRules: JSON.stringify(bundle.pricing?.rules || []),
    discountDisplayEnabled: true,
    discountMessagingEnabled: true,
    selectedCollections: JSON.stringify({}),
    ruleMessages: JSON.stringify({}),
    stepConditions: JSON.stringify({}),
    selectedProducts: JSON.stringify([]),
    selectedBundleCollections: JSON.stringify([]),
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
      case 'selectedProducts':
        return JSON.stringify(selectedProducts);
      case 'selectedBundleCollections':
        return JSON.stringify(selectedBundleCollections);
      default:
        return '';
    }
  }, [bundleName, bundleDescription, bundleStatus, steps, discountEnabled, discountType, discountRules, selectedCollections, stepConditions, selectedProducts, selectedBundleCollections]);

  // Check for changes whenever form values change
  useEffect(() => {
    const stepSetupChanges = (
      bundleName !== originalValues.name ||
      bundleDescription !== originalValues.description ||
      JSON.stringify(steps) !== originalValues.steps ||
      JSON.stringify(selectedCollections) !== originalValues.selectedCollections ||
      JSON.stringify(stepConditions) !== originalValues.stepConditions ||
      JSON.stringify(selectedProducts) !== originalValues.selectedProducts ||
      JSON.stringify(selectedBundleCollections) !== originalValues.selectedBundleCollections
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
    // Only interact with save bar if form is ready (originalValues initialized)
    if (originalValues.status !== undefined) {
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
    selectedCollections, stepConditions, selectedProducts, selectedBundleCollections,
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

      // Submit to server action
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update original values after successful save
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
          selectedProducts: JSON.stringify(selectedProducts),
          selectedBundleCollections: JSON.stringify(selectedBundleCollections),
        });
        
        // Reset section changes after successful save
        setSectionChanges({
          step_setup: false,
          discount_pricing: false
        });
        
        shopify.toast.show(result.message || "Changes saved successfully", { isError: false });
      } else {
        throw new Error(result.error || "Failed to save changes");
      }
    } catch (error) {
      console.error("Save failed:", error);
      shopify.toast.show(error.message || "Failed to save changes", { isError: true });
    }
  }, [bundleStatus, bundleName, bundleDescription, steps, discountEnabled, discountType, discountRules, discountDisplayEnabled, discountMessagingEnabled, ruleMessages, selectedCollections, stepConditions, selectedProducts, selectedBundleCollections, shopify]);

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
      setSelectedProducts(JSON.parse(originalValues.selectedProducts));
      setSelectedBundleCollections(JSON.parse(originalValues.selectedBundleCollections));
      
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
  }, [originalValues, shopify]);

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
        navigate("/app/bundles/discount-functions");
      } else {
        shopify.toast.show("Save or discard your changes to continue", { 
          isError: true,
          duration: 4000 
        });
      }
      return;
    }
    navigate("/app/bundles/discount-functions");
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

    // For discount function bundles, show a different message since they don't have bundle products
    shopify.toast.show("Discount function bundles apply automatic discounts when conditions are met at checkout.", { 
      isError: false,
      duration: 4000 
    });
  }, [hasUnsavedChanges, shopify]);

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


  // Product selection for bundle scope
  const handleBundleProductSelection = useCallback(async () => {
    try {
      const products = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });
      
      if (products && products.length > 0) {
        setSelectedProducts(products);
        // Trigger save bar for product selection changes
        triggerSaveBar();
        shopify.toast.show("Products updated successfully", { isError: false });
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
  }, [shopify, triggerSaveBar]);

  // Collection selection for bundle scope
  const handleBundleCollectionSelection = useCallback(async () => {
    try {
      const collections = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
      });
      
      if (collections && collections.length > 0) {
        setSelectedBundleCollections(collections);
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

  // Product management modal handlers
  const handleOpenProductManagementModal = useCallback(() => {
    setIsProductManagementModalOpen(true);
  }, []);

  const handleCloseProductManagementModal = useCallback(() => {
    setIsProductManagementModalOpen(false);
  }, []);

  const handleRemoveProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => prev.filter(product => product.id !== productId));
    triggerSaveBar();
  }, [triggerSaveBar]);

  const handleAddMoreProducts = useCallback(async () => {
    try {
      const products = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });
      
      if (products && products.length > 0) {
        // Add new products to existing selection, avoiding duplicates
        setSelectedProducts(prev => {
          const existingIds = prev.map(p => p.id);
          const newProducts = products.filter(p => !existingIds.includes(p.id));
          return [...prev, ...newProducts];
        });
        triggerSaveBar();
        shopify.toast.show("Products added successfully", { isError: false });
      }
    } catch (error) {
      console.log("Product selection cancelled or failed:", error);
    }
  }, [shopify, triggerSaveBar]);

  // Collection management modal handlers
  const handleOpenCollectionManagementModal = useCallback(() => {
    setIsCollectionManagementModalOpen(true);
  }, []);

  const handleCloseCollectionManagementModal = useCallback(() => {
    setIsCollectionManagementModalOpen(false);
  }, []);

  const handleRemoveCollection = useCallback((collectionId: string) => {
    setSelectedBundleCollections(prev => prev.filter(collection => collection.id !== collectionId));
    triggerSaveBar();
  }, [triggerSaveBar]);

  const handleAddMoreCollections = useCallback(async () => {
    try {
      const collections = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
      });
      
      if (collections && collections.length > 0) {
        // Add new collections to existing selection, avoiding duplicates
        setSelectedBundleCollections(prev => {
          const existingIds = prev.map(c => c.id);
          const newCollections = collections.filter(c => !existingIds.includes(c.id));
          return [...prev, ...newCollections];
        });
        triggerSaveBar();
        shopify.toast.show("Collections added successfully", { isError: false });
      }
    } catch (error) {
      console.log("Collection selection cancelled or failed:", error);
    }
  }, [shopify, triggerSaveBar]);

  // Step-specific product management modal handlers
  const handleOpenStepProductModal = useCallback((stepId: string) => {
    setCurrentStepId(stepId);
    setIsStepProductModalOpen(true);
  }, []);

  const handleCloseStepProductModal = useCallback(() => {
    setIsStepProductModalOpen(false);
    setCurrentStepId(null);
  }, []);

  const handleRemoveStepProduct = useCallback((productId: string) => {
    if (!currentStepId) return;
    
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === currentStepId 
          ? { ...step, StepProduct: step.StepProduct?.filter(p => p.id !== productId) || [] }
          : step
      )
    );
    triggerSaveBar();
  }, [currentStepId, triggerSaveBar]);

  const handleAddMoreStepProducts = useCallback(async () => {
    if (!currentStepId) return;
    
    try {
      const products = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });
      
      if (products && products.length > 0) {
        setSteps(prevSteps => 
          prevSteps.map(step => {
            if (step.id === currentStepId) {
              const existingIds = step.StepProduct?.map(p => p.id) || [];
              const newProducts = products.filter(p => !existingIds.includes(p.id));
              return { 
                ...step, 
                StepProduct: [...(step.StepProduct || []), ...newProducts]
              };
            }
            return step;
          })
        );
        triggerSaveBar();
        shopify.toast.show("Products added successfully", { isError: false });
      }
    } catch (error) {
      console.log("Product selection cancelled or failed:", error);
    }
  }, [currentStepId, shopify, triggerSaveBar]);

  // Step-specific collection management modal handlers
  const handleOpenStepCollectionModal = useCallback((stepId: string) => {
    setCurrentStepId(stepId);
    setIsStepCollectionModalOpen(true);
  }, []);

  const handleCloseStepCollectionModal = useCallback(() => {
    setIsStepCollectionModalOpen(false);
    setCurrentStepId(null);
  }, []);

  const handleRemoveStepCollection = useCallback((collectionId: string) => {
    if (!currentStepId) return;
    
    setSelectedCollections(prev => ({
      ...prev,
      [currentStepId]: prev[currentStepId]?.filter(c => c.id !== collectionId) || []
    }));
    triggerSaveBar();
  }, [currentStepId, triggerSaveBar]);

  const handleAddMoreStepCollections = useCallback(async () => {
    if (!currentStepId) return;
    
    try {
      const collections = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
      });
      
      if (collections && collections.length > 0) {
        setSelectedCollections(prev => {
          const existingIds = prev[currentStepId]?.map(c => c.id) || [];
          const newCollections = collections.filter(c => !existingIds.includes(c.id));
          return {
            ...prev,
            [currentStepId]: [...(prev[currentStepId] || []), ...newCollections]
          };
        });
        triggerSaveBar();
        shopify.toast.show("Collections added successfully", { isError: false });
      }
    } catch (error) {
      console.log("Collection selection cancelled or failed:", error);
    }
  }, [currentStepId, shopify, triggerSaveBar]);

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

  // Discount rule management for discount functions
  const addDiscountRule = useCallback(() => {
    const newRule = {
      id: `rule-${Date.now()}`,
      discountOn: 'quantity', // quantity or amount
      minimumQuantity: 2,
      minimumAmount: 0,
      fixedAmountOff: 0,
      percentageOff: 0,
      code: 'BUNDLE' // Custom discount code prefix
    };
    
    setDiscountRules([...discountRules, newRule]);
    
    // Initialize messaging for new rule
    setRuleMessages(prev => ({
      ...prev,
      [newRule.id]: {
        discountText: 'Add {{discountConditionDiff}} {{discountUnit}} to get {{discountValue}} off your bundle with code {{discountCode}}',
        successMessage: 'Congratulations 🎉 Your discount code {{discountCode}} has been applied!'
      }
    }));
    
    // Trigger save bar for adding discount rule
    triggerSaveBar();
  }, [discountRules, triggerSaveBar]);

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
    if (['minimumQuantity', 'minimumAmount', 'fixedAmountOff', 'percentageOff'].includes(field)) {
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

  // Function to load available pages
  const loadAvailablePages = useCallback(async () => {
    setIsLoadingPages(true);
    try {
      const formData = new FormData();
      formData.append("intent", "getPages");

      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setAvailablePages(result.pages || []);
      } else {
        throw new Error(result.error || "Failed to load pages");
      }
    } catch (error) {
      console.error("Failed to load pages:", error);
      shopify.toast.show("Failed to load pages", { isError: true });
    } finally {
      setIsLoadingPages(false);
    }
  }, [shopify]);

  // Place widget handlers with page selection modal
  const handlePlaceWidget = useCallback(async () => {
    try {
      console.log('Opening page selection modal');
      setIsPageSelectionModalOpen(true);
      await loadAvailablePages();
    } catch (error) {
      console.error('Error opening page selection:', error);
      shopify.toast.show("Failed to open page selection", { isError: true });
    }
  }, [loadAvailablePages, shopify]);

  const handlePageSelection = useCallback(async (page: any) => {
    try {
      const shopDomain = shop.includes('.myshopify.com') 
        ? shop.replace('.myshopify.com', '') 
        : shop;

      // Get current theme ID for deep linking
      const formData = new FormData();
      formData.append("intent", "getCurrentTheme");

      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      let themeEditorUrl;

      if (result.success && result.themeId) {
        // Use specific theme and page context
        themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/${result.themeId}/editor?context=templates%2Fpage&template=${page.handle}&addAppBlockId=bundle-builder`;
      } else {
        // Fallback to general theme editor
        themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?context=templates%2Fpage&template=${page.handle}`;
      }

      setSelectedPage(page);
      setIsPageSelectionModalOpen(false);

      // Open theme editor in new tab
      window.open(themeEditorUrl, '_blank', 'noopener,noreferrer');
      
      shopify.toast.show(`Theme editor opened for "${page.title}" page. Add the Bundle Builder widget from the Apps section.`, { isError: false });
      
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
    <Page
      title={`Configure: ${bundleName || 'Discount Function Bundle'}`}
      subtitle="Set up your discount function bundle configuration"
      backAction={{
        content: "Discount Function Bundles",
        onAction: handleBackClick,
      }}
      primaryAction={{
        content: "Preview Bundle",
        onAction: handlePreviewBundle,
        icon: ViewIcon,
        disabled: hasUnsavedChanges,
      }}
    >
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

            {/* Product/Collection Selection Card */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingSm" as="h3">
                  Bundle Scope
                </Text>
                <Text variant="bodyMd" tone="subdued">
                  Select products and collections where this discount function bundle should be available
                </Text>
                
                {/* Products Section */}
                <BlockStack gap="200">
                  <Text variant="headingSm" as="h4">
                    Products
                  </Text>
                  <InlineStack gap="200" align="start">
                    <Button 
                      variant="primary" 
                      size="medium"
                      icon={ProductIcon}
                      onClick={handleBundleProductSelection}
                    >
                      Select Products
                    </Button>
                    {selectedProducts.length > 0 && (
                      <Badge tone="info">
                        <Button
                          variant="plain"
                          size="micro"
                          onClick={handleOpenProductManagementModal}
                        >
                          {selectedProducts.length} Selected
                        </Button>
                      </Badge>
                    )}
                  </InlineStack>
                </BlockStack>

                {/* Collections Section */}
                <BlockStack gap="200">
                  <Text variant="headingSm" as="h4">
                    Collections
                  </Text>
                  <InlineStack gap="200" align="start">
                    <Button 
                      variant="primary" 
                      size="medium"
                      icon={CollectionIcon}
                      onClick={handleBundleCollectionSelection}
                    >
                      Select Collections
                    </Button>
                    {selectedBundleCollections.length > 0 && (
                      <Badge tone="info">
                        <Button
                          variant="plain"
                          size="micro"
                          onClick={handleOpenCollectionManagementModal}
                        >
                          {selectedBundleCollections.length} Selected
                        </Button>
                      </Badge>
                    )}
                  </InlineStack>
                </BlockStack>

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
                                        onClick={() => handleOpenStepProductModal(step.id)}
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
                                        onClick={() => handleOpenStepCollectionModal(step.id)}
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
                    Set up discount rules with automatic discount code generation for qualified purchases.
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
                        { label: 'Fixed Amount Off', value: 'fixed_amount_off' },
                        { label: 'Percentage Off', value: 'percentage_off' },
                      ]}
                      value={discountType}
                      onChange={(value) => {
                        setDiscountType(value);
                        // Clear existing rules when discount type changes since field structure might be different
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
                            
                            <InlineStack gap="200" align="start">
                              <Select
                                label="Discount on"
                                options={[
                                  { label: 'Quantity', value: 'quantity' },
                                  { label: 'Amount', value: 'amount' },
                                ]}
                                value={rule.discountOn || 'quantity'}
                                onChange={(value) => updateDiscountRule(rule.id, 'discountOn', value)}
                              />
                              
                              {rule.discountOn === 'quantity' ? (
                                <TextField
                                  label="Minimum quantity"
                                  value={String(rule.minimumQuantity || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'minimumQuantity', parseInt(value) || 0)}
                                  type="number"
                                  min="0"
                                  autoComplete="off"
                                />
                              ) : (
                                <TextField
                                  label="Minimum amount"
                                  value={String(rule.minimumAmount || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'minimumAmount', parseFloat(value) || 0)}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  prefix="₹"
                                  autoComplete="off"
                                />
                              )}

                              {discountType === 'fixed_amount_off' ? (
                                <TextField
                                  label="Fixed Amount Off"
                                  value={String(rule.fixedAmountOff || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'fixedAmountOff', parseFloat(value) || 0)}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  prefix="₹"
                                  autoComplete="off"
                                />
                              ) : (
                                <TextField
                                  label="Percentage Off (%)"
                                  value={String(rule.percentageOff || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'percentageOff', parseFloat(value) || 0)}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  suffix="%"
                                  autoComplete="off"
                                />
                              )}

                              <TextField
                                label="Code"
                                value={rule.code || ''}
                                onChange={(value) => updateDiscountRule(rule.id, 'code', value)}
                                autoComplete="off"
                                helpText="Custom discount code prefix (timestamp will be appended)"
                                placeholder="BUNDLE"
                              />
                            </InlineStack>
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
                              Variables for Discount Functions
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
                                  Discount Code
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {'{{discountCode}}'}
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
                                    value={ruleMessages[rule.id]?.discountText || 'Add {{discountConditionDiff}} {{discountUnit}} to get {{discountValue}} off your bundle with code {{discountCode}}'}
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
                                    value={ruleMessages[rule.id]?.successMessage || 'Congratulations 🎉 Your discount code {{discountCode}} has been applied!'}
                                    onChange={(value) => updateRuleMessage(rule.id, 'successMessage', value)}
                                    multiline={2}
                                    autoComplete="off"
                                    helpText="This message appears when the discount code is automatically applied"
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
        title="Select Page for Widget Placement"
        primaryAction={{
          content: "Cancel",
          onAction: () => setIsPageSelectionModalOpen(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd">
              Choose a page where you want to place the Bundle Builder widget. The theme editor will open with the selected page ready for widget configuration.
            </Text>
            
            {isLoadingPages ? (
              <BlockStack gap="200" inlineAlign="center">
                <Text variant="bodyMd" tone="subdued">Loading pages...</Text>
              </BlockStack>
            ) : availablePages.length > 0 ? (
              <BlockStack gap="200">
                {availablePages.map((page) => (
                  <Card key={page.id} sectioned>
                    <InlineStack wrap={false} gap="300" align="space-between">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="medium">
                          {page.title}
                        </Text>
                        <Text variant="bodySm" tone="subdued">
                          Handle: {page.handle}
                        </Text>
                      </BlockStack>
                      <Button
                        onClick={() => handlePageSelection(page)}
                        primary
                      >
                        Select Page
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

      {/* Product Management Modal */}
      <Modal
        open={isProductManagementModalOpen}
        onClose={handleCloseProductManagementModal}
        title="Manage Selected Products"
        primaryAction={{
          content: "Add More Products",
          onAction: handleAddMoreProducts,
        }}
        secondaryActions={[
          {
            content: "Done",
            onAction: handleCloseProductManagementModal,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            {selectedProducts.length > 0 ? (
              <BlockStack gap="200">
                <Text variant="bodyMd" fontWeight="medium">
                  {selectedProducts.length} Product{selectedProducts.length !== 1 ? 's' : ''} Selected
                </Text>
                {selectedProducts.map((product) => (
                  <Card key={product.id} sectioned>
                    <InlineStack wrap={false} gap="300" align="space-between">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="medium">
                          {product.title || 'Unnamed Product'}
                        </Text>
                        {product.handle && (
                          <Text variant="bodySm" tone="subdued">
                            Handle: {product.handle}
                          </Text>
                        )}
                        {product.vendor && (
                          <Text variant="bodySm" tone="subdued">
                            Vendor: {product.vendor}
                          </Text>
                        )}
                      </BlockStack>
                      <Button
                        variant="plain"
                        tone="critical"
                        onClick={() => handleRemoveProduct(product.id)}
                      >
                        Remove
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Card sectioned>
                <BlockStack gap="200" inlineAlign="center">
                  <Text variant="bodyMd" tone="subdued" alignment="center">
                    No products selected. Click "Add More Products" to select products for this bundle scope.
                  </Text>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Collection Management Modal */}
      <Modal
        open={isCollectionManagementModalOpen}
        onClose={handleCloseCollectionManagementModal}
        title="Manage Selected Collections"
        primaryAction={{
          content: "Add More Collections",
          onAction: handleAddMoreCollections,
        }}
        secondaryActions={[
          {
            content: "Done",
            onAction: handleCloseCollectionManagementModal,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            {selectedBundleCollections.length > 0 ? (
              <BlockStack gap="200">
                <Text variant="bodyMd" fontWeight="medium">
                  {selectedBundleCollections.length} Collection{selectedBundleCollections.length !== 1 ? 's' : ''} Selected
                </Text>
                {selectedBundleCollections.map((collection) => (
                  <Card key={collection.id} sectioned>
                    <InlineStack wrap={false} gap="300" align="space-between">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="medium">
                          {collection.title || 'Unnamed Collection'}
                        </Text>
                        {collection.handle && (
                          <Text variant="bodySm" tone="subdued">
                            Handle: {collection.handle}
                          </Text>
                        )}
                        {collection.description && (
                          <Text variant="bodySm" tone="subdued">
                            {collection.description.length > 100 
                              ? `${collection.description.substring(0, 100)}...` 
                              : collection.description}
                          </Text>
                        )}
                      </BlockStack>
                      <Button
                        variant="plain"
                        tone="critical"
                        onClick={() => handleRemoveCollection(collection.id)}
                      >
                        Remove
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Card sectioned>
                <BlockStack gap="200" inlineAlign="center">
                  <Text variant="bodyMd" tone="subdued" alignment="center">
                    No collections selected. Click "Add More Collections" to select collections for this bundle scope.
                  </Text>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Step Product Management Modal */}
      <Modal
        open={isStepProductModalOpen}
        onClose={handleCloseStepProductModal}
        title={`Manage Products - Step ${currentStepId ? steps.find(s => s.id === currentStepId)?.name || currentStepId : ''}`}
        primaryAction={{
          content: "Add More Products",
          onAction: handleAddMoreStepProducts,
        }}
        secondaryActions={[
          {
            content: "Done",
            onAction: handleCloseStepProductModal,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            {currentStepId && steps.find(s => s.id === currentStepId)?.StepProduct?.length > 0 ? (
              <BlockStack gap="200">
                <Text variant="bodyMd" fontWeight="medium">
                  {steps.find(s => s.id === currentStepId)?.StepProduct?.length || 0} Product{(steps.find(s => s.id === currentStepId)?.StepProduct?.length || 0) !== 1 ? 's' : ''} Selected
                </Text>
                {steps.find(s => s.id === currentStepId)?.StepProduct?.map((product: any) => (
                  <Card key={product.id} sectioned>
                    <InlineStack wrap={false} gap="300" align="space-between">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="medium">
                          {product.title || product.name || 'Unnamed Product'}
                        </Text>
                        {product.handle && (
                          <Text variant="bodySm" tone="subdued">
                            Handle: {product.handle}
                          </Text>
                        )}
                        {product.vendor && (
                          <Text variant="bodySm" tone="subdued">
                            Vendor: {product.vendor}
                          </Text>
                        )}
                      </BlockStack>
                      <Button
                        variant="plain"
                        tone="critical"
                        onClick={() => handleRemoveStepProduct(product.id)}
                      >
                        Remove
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Card sectioned>
                <BlockStack gap="200" inlineAlign="center">
                  <Text variant="bodyMd" tone="subdued" alignment="center">
                    No products selected for this step. Click "Add More Products" to select products.
                  </Text>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Step Collection Management Modal */}
      <Modal
        open={isStepCollectionModalOpen}
        onClose={handleCloseStepCollectionModal}
        title={`Manage Collections - Step ${currentStepId ? steps.find(s => s.id === currentStepId)?.name || currentStepId : ''}`}
        primaryAction={{
          content: "Add More Collections",
          onAction: handleAddMoreStepCollections,
        }}
        secondaryActions={[
          {
            content: "Done",
            onAction: handleCloseStepCollectionModal,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            {currentStepId && selectedCollections[currentStepId]?.length > 0 ? (
              <BlockStack gap="200">
                <Text variant="bodyMd" fontWeight="medium">
                  {selectedCollections[currentStepId]?.length || 0} Collection{(selectedCollections[currentStepId]?.length || 0) !== 1 ? 's' : ''} Selected
                </Text>
                {selectedCollections[currentStepId]?.map((collection: any) => (
                  <Card key={collection.id} sectioned>
                    <InlineStack wrap={false} gap="300" align="space-between">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="medium">
                          {collection.title || 'Unnamed Collection'}
                        </Text>
                        {collection.handle && (
                          <Text variant="bodySm" tone="subdued">
                            Handle: {collection.handle}
                          </Text>
                        )}
                        {collection.description && (
                          <Text variant="bodySm" tone="subdued">
                            {collection.description.length > 100 
                              ? `${collection.description.substring(0, 100)}...` 
                              : collection.description}
                          </Text>
                        )}
                      </BlockStack>
                      <Button
                        variant="plain"
                        tone="critical"
                        onClick={() => handleRemoveStepCollection(collection.id)}
                      >
                        Remove
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Card sectioned>
                <BlockStack gap="200" inlineAlign="center">
                  <Text variant="bodyMd" tone="subdued" alignment="center">
                    No collections selected for this step. Click "Add More Collections" to select collections.
                  </Text>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

    </Page>
  );
}