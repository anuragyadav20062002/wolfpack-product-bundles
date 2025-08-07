import { useState, useCallback, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Text,
  InlineStack,
  Modal,
  TextField,
  Tabs,
  Checkbox,
  Select,
  List,
  Divider,
  Badge,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type LinksFunction,
} from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import bundlePreviewStyles from "../styles/bundle-preview.css?url";
import bundlePreviewGif from "../bundleprev.gif";
import type { Prisma, DiscountMethodType, BundlePricing } from "@prisma/client"; // Import Prisma types

// Define types for products and collections coming from ResourcePicker
interface ResourcePickerProduct {
  id: string;
  title: string;
  handle?: string;
  variants?: Array<{ id: string; title: string; price?: string }>;
  images?: Array<{ originalSrc: string }>;
}

interface ResourcePickerCollection {
  id: string;
  title: string;
  handle?: string;
}

// Define a type for Bundle, matching Prisma's Bundle model (used only for `publishBundle` data in action)
interface Bundle {
  id: string;
  name: string;
  description: string | null;
  shopId: string;
  status: string;
  active: boolean;
  publishedAt: Date | null;
  settings: Prisma.JsonValue | null; // Use Prisma.JsonValue for raw JSON
  matching: Prisma.JsonValue | null; // Use Prisma.JsonValue for raw JSON
  createdAt: Date;
  updatedAt: Date;
  shopifyProductId: string | null;
}

// Define a type for BundleStep, matching Prisma schema for raw data
interface BundleStepRaw {
  id: string;
  name: string;
  products: Prisma.JsonValue; // Raw JSON from DB
  collections: Prisma.JsonValue; // Raw JSON from DB
  displayVariantsAsIndividual: boolean;
  conditionType: string | null;
  conditionValue: number | null;
  bundleId: string;
  icon?: string | null;
  position?: number;
  minQuantity?: number;
  maxQuantity?: number;
  enabled?: boolean;
  productCategory?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define a type for BundleStep as passed to the UI component (after parsing)
interface BundleStep {
  id: string;
  name: string;
  products: ResourcePickerProduct[];
  collections: ResourcePickerCollection[];
  displayVariantsAsIndividual: boolean;
  conditionType: string | null;
  conditionValue: number | null;
  bundleId: string;
  icon?: string | null;
  position?: number;
  minQuantity?: number;
  maxQuantity?: number;
  enabled?: boolean;
  productCategory?: string | null;
  createdAt: string; // Converted to string for client-side
  updatedAt: string; // Converted to string for client-side
}

// Extend bundle type from loader to include steps and pricing, and parsed matching
interface BundleWithSteps {
  id: string;
  name: string;
  description: string | null;
  shopId: string;
  status: string;
  active: boolean;
  publishedAt: Date | null;
  settings: Prisma.JsonValue | null;
  createdAt: string; // Converted to string for client-side
  updatedAt: string; // Converted to string for client-side
  shopifyProductId: string | null;

  steps: BundleStep[]; // These steps have 'products' and 'collections' already parsed
  matching: Prisma.JsonValue | null; // Keep original matching string as it comes from Prisma directly
  parsedMatching: {
    selectedVisibilityProducts: ResourcePickerProduct[];
    selectedVisibilityCollections: ResourcePickerCollection[];
  } | null; // This will be the parsed object from `matching`
  pricing: {
    enableDiscount: boolean;
    discountMethod: DiscountMethodType;
    rules: DiscountRule[] | null; // These rules are already parsed
    discountId: string | null;
  } | null;
}

// Define DiscountRule interface here as it's used by BundleWithSteps and functions
interface DiscountRule {
  discountOn: string;
  minimumQuantity: number;
  fixedAmountOff: number;
  percentageOff: number;
}

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: bundlePreviewStyles }];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const bundleId = params.bundleId;

  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: session.shop,
    },
    include: {
      steps: true,
      pricing: true, // Include pricing data
    },
  });

  if (!bundle) {
    throw new Response("Bundle not found", { status: 404 });
  }

  // Helper function to safely parse JSON
  const safeJsonParse = (value: any, defaultValue: any = []) => {
    if (!value) return defaultValue;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.error("JSON parse error:", error);
        return defaultValue;
      }
    }
    return defaultValue;
  };

  // Parse JSON strings back to objects for products and collections
  const parsedSteps: BundleStep[] = bundle.steps.map((step: BundleStepRaw) => {
    console.log("Raw step.products before parse:", step.products);
    console.log("Raw step.collections before parse:", step.collections);

    return {
      ...step,
      products: safeJsonParse(step.products, []) as ResourcePickerProduct[],
      collections: safeJsonParse(
        step.collections,
        [],
      ) as ResourcePickerCollection[],
      createdAt: new Date(step.createdAt).toISOString(), // Convert Date to string for client-side
      updatedAt: new Date(step.updatedAt).toISOString(), // Convert Date to string for client-side
    };
  });

  // Parse matching rules if they exist
  console.log("Raw bundle.matching before parse:", bundle.matching);
  const parsedMatching = bundle.matching
    ? (safeJsonParse(
        bundle.matching,
        null,
      ) as BundleWithSteps["parsedMatching"])
    : null;

  // Parse pricing rules if they exist
  console.log("Raw bundle.pricing.rules before parse:", bundle.pricing?.rules);
  const parsedPricing = bundle.pricing
    ? {
        ...bundle.pricing,
        rules: bundle.pricing.rules
          ? (safeJsonParse(bundle.pricing.rules, null) as DiscountRule[])
          : null,
      }
    : null;

  return json({
    bundle: {
      ...bundle,
      steps: parsedSteps,
      parsedMatching: parsedMatching,
      pricing: parsedPricing,
      createdAt: bundle.createdAt.toISOString(),
      updatedAt: bundle.updatedAt.toISOString(),
    },
  });
}

// Action to handle adding or updating a step or pricing
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "addStep" || intent === "editStep") {
    const bundleId = formData.get("bundleId") as string;
    const stepName = formData.get("stepName") as string;
    const selectedProducts = formData.get("selectedProducts") as string;
    const selectedCollections = formData.get("selectedCollections") as string;
    const displayVariantsAsIndividual =
      formData.get("displayVariantsAsIndividual") === "true";
    const enabled = formData.get("enabled") === "true";
    const conditionType = formData.get("conditionType") as string;
    const conditionValue = formData.get("conditionValue") as string;
    const stepId = formData.get("stepId") as string | null;

    if (
      typeof bundleId !== "string" ||
      bundleId.length === 0 ||
      typeof stepName !== "string" ||
      stepName.length === 0
    ) {
      return json(
        { error: "Bundle ID and Step Name are required" },
        { status: 400 },
      );
    }

    const data = {
      bundleId,
      name: stepName,
      products: selectedProducts,
      collections: selectedCollections,
      displayVariantsAsIndividual,
      enabled,
      conditionType,
      conditionValue: parseInt(conditionValue, 10) || null,
    };

    try {
      const step = stepId
        ? await db.bundleStep.update({ where: { id: stepId }, data })
        : await db.bundleStep.create({ data });
      return json({ success: true, step: step, intent: intent });
    } catch (error) {
      console.error("Error saving step:", error);
      return json({ error: "Failed to save step" }, { status: 500 });
    }
  }

  if (intent === "publishBundle") {
    const bundleId = formData.get("bundleId") as string;

    // Safely parse the visibility data
    let selectedVisibilityProducts: ResourcePickerProduct[] = [];
    let selectedVisibilityCollections: ResourcePickerCollection[] = [];

    try {
      const productsData = formData.get("selectedVisibilityProducts");
      console.log("Products data type:", typeof productsData);
      console.log("Products data:", productsData);

      if (productsData) {
        if (typeof productsData === "string") {
          selectedVisibilityProducts = JSON.parse(productsData);
        } else {
          // If it's already an object, use it directly
          selectedVisibilityProducts = productsData as any;
        }
      }

      const collectionsData = formData.get("selectedVisibilityCollections");
      console.log("Collections data type:", typeof collectionsData);
      console.log("Collections data:", collectionsData);

      if (collectionsData) {
        if (typeof collectionsData === "string") {
          selectedVisibilityCollections = JSON.parse(collectionsData);
        } else {
          // If it's already an object, use it directly
          selectedVisibilityCollections = collectionsData as any;
        }
      }
    } catch (error) {
      console.error("Error parsing visibility data:", error);
      return json({ error: "Invalid visibility data format" }, { status: 400 });
    }

    if (
      typeof bundleId !== "string" ||
      bundleId.length === 0 ||
      (selectedVisibilityProducts.length === 0 &&
        selectedVisibilityCollections.length === 0)
    ) {
      return json(
        {
          error:
            "At least one product or collection must be selected for visibility to publish the bundle.",
        },
        { status: 400 },
      );
    }

    try {
      const updatedBundle = await db.bundle.update({
        where: { id: bundleId },
        data: {
          publishedAt: new Date(),
          status: "active",
          active: true,
          matching: JSON.stringify({
            selectedVisibilityProducts,
            selectedVisibilityCollections,
          }),
        },
      });

      // Get the shop's GID to use as the ownerId for the metafield
      const shopIdResponse = await admin.graphql(
        `#graphql
        query shopId {
          shop {
            id
          }
        }`,
      );
      const shopIdData = await shopIdResponse.json();
      const shopGid = shopIdData.data.shop.id;

      // Store bundle discount settings on individual products
      const allPublishedBundles = await db.bundle.findMany({
        where: { status: "active", shopId: session.shop },
        include: { steps: true, pricing: true },
      });

      // Helper function to safely parse JSON (same as in loader)
      const safeJsonParse = (value: any, defaultValue: any = []) => {
        if (!value) return defaultValue;
        if (typeof value === "object") return value;
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (error) {
            console.error("JSON parse error:", error);
            return defaultValue;
          }
        }
        return defaultValue;
      };

      // Collect all product IDs that need bundle data
      const productMetafields: Array<{ ownerId: string; bundleData: any }> = [];

      for (const bundle of allPublishedBundles) {
        const steps = bundle.steps.map((s: BundleStepRaw) => ({
          ...s,
          products: safeJsonParse(s.products, []),
          collections: safeJsonParse(s.collections, []),
        }));
        
        const bundleData = {
          id: bundle.id,
          name: bundle.name,
          description: bundle.description,
          status: bundle.status,
          matching: safeJsonParse(bundle.matching, {}),
          steps: steps,
          pricing: bundle.pricing
            ? {
                ...bundle.pricing,
                rules: safeJsonParse(bundle.pricing.rules, null),
              }
            : null,
        };

        // Add metafield for each product in each step
        for (const step of steps) {
          for (const product of step.products) {
            productMetafields.push({
              ownerId: product.id,
              bundleData: bundleData,
            });
          }
        }
      }

      // Debug: Log what we're about to create
      console.log("🔥🔥🔥 BUNDLE DEBUG START 🔥🔥🔥");
      console.log("🔍 Active bundles found:", allPublishedBundles.length);
      console.log("📝 Product metafields to create:", productMetafields.length);
      
      // Log each bundle's details
      allPublishedBundles.forEach((bundle, bundleIndex) => {
        const bundleSteps = bundle.steps.map((s: BundleStepRaw) => ({
          ...s,
          products: safeJsonParse(s.products, []),
          collections: safeJsonParse(s.collections, []),
        }));
        
        console.log(`🔥 Bundle: "${bundle.name}" (${bundle.status})`);
        console.log(`🔥   Steps: ${bundleSteps.length}, Pricing: ${bundle.pricing?.enableDiscount ? 'ENABLED' : 'DISABLED'}`);
        
        bundleSteps.forEach((step, stepIndex) => {
          console.log(`🔥   Step ${stepIndex + 1}: "${step.name}" (${step.products.length} products)`);
          if (step.products.length === 0) {
            console.log(`🔥     ❌ NO PRODUCTS IN THIS STEP!`);
          } else {
            step.products.forEach((product: any, productIndex) => {
              const hasValidGid = product.id && product.id.startsWith('gid://shopify/Product/');
              console.log(`🔥     Product ${productIndex + 1}: ${product.title || 'No title'}`);
              console.log(`🔥       ID: ${product.id || 'No ID'} ${hasValidGid ? '✅' : '❌ INVALID GID'}`);
            });
          }
        });
      });
      
      if (productMetafields.length === 0) {
        console.log("🔥🔥🔥 ❌ NO METAFIELDS WILL BE CREATED! 🔥🔥🔥");
        console.log("🔥 This means your bundles have no valid products in their steps");
      } else {
        console.log(`🔥🔥🔥 ✅ WILL CREATE ${productMetafields.length} METAFIELDS 🔥🔥🔥`);
        productMetafields.forEach((pm, index) => {
          console.log(`🔥 Metafield ${index + 1}: ${pm.ownerId} → ${pm.bundleData.name}`);
        });
      }
      console.log("🔥🔥🔥 BUNDLE DEBUG END 🔥🔥🔥");

      // Store bundle data on products and also keep shop metafield for backwards compatibility
      const metafieldInputs = [
        // Shop metafield for backwards compatibility
        {
          ownerId: shopGid,
          namespace: "custom",
          key: "all_bundles",
          type: "json",
          value: JSON.stringify(allPublishedBundles.map((b) => {
            const steps = b.steps.map((s: BundleStepRaw) => ({
              ...s,
              products: safeJsonParse(s.products, []),
              collections: safeJsonParse(s.collections, []),
            }));
            return {
              id: b.id,
              name: b.name,
              description: b.description,
              status: b.status,
              matching: safeJsonParse(b.matching, {}),
              steps: steps,
              pricing: b.pricing
                ? {
                    ...b.pricing,
                    rules: safeJsonParse(b.pricing.rules, null),
                  }
                : null,
            };
          })),
        },
        // Product metafields for discount functions
        ...productMetafields.map((pm) => ({
          ownerId: pm.ownerId,
          namespace: "custom",
          key: "bundle_discount_data",
          type: "json",
          value: JSON.stringify(pm.bundleData),
        })),
      ];

      // Only proceed with metafield creation if we have inputs
      let metafieldData = null;
      if (metafieldInputs.length === 0) {
        console.warn("⚠️  No metafields to create - skipping GraphQL mutation");
        metafieldData = { data: { metafieldsSet: { metafields: [], userErrors: [] } } };
      } else {
        console.log(`📝 Creating ${metafieldInputs.length} metafields...`);
        
        const metafieldResponse = await admin.graphql(
          `#graphql
            mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields {
                  id
                  key
                  namespace
                  value
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
          {
            variables: {
              metafields: metafieldInputs,
            },
          },
        );

        metafieldData = (await metafieldResponse.json()) as any;
      }

      // Debug: Log metafield creation response
      if (metafieldData.data?.metafieldsSet?.metafields?.length > 0) {
        console.log("🔥🔥🔥 ✅ METAFIELDS CREATED SUCCESSFULLY! 🔥🔥🔥");
        console.log(`🔥 Created ${metafieldData.data.metafieldsSet.metafields.length} metafields`);
      } else {
        console.log("🔥🔥🔥 ❌ NO METAFIELDS WERE CREATED! 🔥🔥🔥");
      }

      if (metafieldData.errors && metafieldData.errors.length > 0) {
        console.log("🔥🔥🔥 ❌ GRAPHQL ERRORS 🔥🔥🔥");
        metafieldData.errors.forEach((error: any) => console.log("🔥 Error:", error.message));
        throw new Error(`Failed to save bundle metafield: ${metafieldData.errors.map((e: any) => e.message).join(", ")}`);
      }

      if (metafieldData.data?.metafieldsSet?.userErrors?.length > 0) {
        console.log("🔥🔥🔥 ❌ USER ERRORS 🔥🔥🔥");
        metafieldData.data.metafieldsSet.userErrors.forEach((error: any) => console.log("🔥 Error:", error.message));
        throw new Error(`Failed to save bundle metafield: ${metafieldData.data.metafieldsSet.userErrors.map((e: any) => e.message).join(", ")}`);
      }

      // Remove all Shopify Admin GraphQL API discount creation logic
      // Prepare for future Shopify Functions-based discount logic
      // (No discount creation logic here for now)
      return json({ success: true, bundle: updatedBundle, intent: intent });
    } catch (error: any) {
      console.error("Error publishing bundle:", error);
      return json(
        {
          error: error.message || "Failed to publish bundle",
        },
        { status: 500 },
      );
    }
  }

  if (intent === "deleteBundle") {
    const bundleId = formData.get("bundleId") as string;

    if (typeof bundleId !== "string" || bundleId.length === 0) {
      return json(
        { error: "Bundle ID is required for deletion" },
        { status: 400 },
      );
    }

    try {
      await db.bundleStep.deleteMany({ where: { bundleId: bundleId } });
      await db.bundle.delete({ where: { id: bundleId } });

      return json({ success: true, intent: intent });
    } catch (error) {
      console.error("Error deleting bundle:", error);
      return json({ error: "Failed to delete bundle" }, { status: 500 });
    }
  }

  if (intent === "updateDiscount") {
    const bundleId = formData.get("bundleId") as string;
    const enableDiscount = formData.get("enableDiscount") === "true";
    const discountMethod = formData.get("discountMethod") as DiscountMethodType; // Cast to Prisma enum type
    const discountOn = formData.get("discountOn") as string;
    const minimumQuantity = formData.get("minimumQuantity") as string;
    const fixedAmountOff = formData.get("fixedAmountOff") as string;
    const percentageOff = formData.get("percentageOff") as string;

    if (typeof bundleId !== "string" || bundleId.length === 0) {
      return json(
        { error: "Bundle ID is required to update discount" },
        { status: 400 },
      );
    }

    let rules: DiscountRule[] | null = null;
    if (enableDiscount) {
      rules = [
        {
          discountOn,
          minimumQuantity: parseInt(minimumQuantity, 10),
          fixedAmountOff: parseFloat(fixedAmountOff),
          percentageOff: parseFloat(percentageOff),
        },
      ];
    }

    try {
      const existingPricing = await db.bundlePricing.findUnique({
        where: { bundleId: bundleId },
      });

      let updatedPricing;
      if (existingPricing) {
        updatedPricing = await db.bundlePricing.update({
          where: { bundleId: bundleId },
          data: {
            enableDiscount,
            discountMethod,
            rules: rules as any, // Temporary cast to any to bypass linter
          },
        });
      } else {
        updatedPricing = await db.bundlePricing.create({
          data: {
            bundleId,
            enableDiscount,
            discountMethod,
            rules: rules as any, // Temporary cast to any to bypass linter
          },
        });
      }

      // Discount settings are now stored in the database via BundlePricing
      // No need to create Shopify products or metafields for discount settings
      // The discount settings will be included in the bundle data when published

      return json({ success: true, pricing: updatedPricing, intent: intent });
    } catch (error: any) {
      console.error("Error saving discount settings:", error.message);
      return json(
        { error: `Failed to save discount settings: ${error.message}` },
        { status: 500 },
      );
    }
  }

  return null;
}

export default function BundleBuilderPage() {
  const { bundle } = useLoaderData<{ bundle: BundleWithSteps }>();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  // State for Add/Edit Step Modal
  // Initialize modal state
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [stepName, setStepName] = useState("");
  const [stepEnabled, setStepEnabled] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<
    ResourcePickerProduct[]
  >([]);
  const [selectedCollections, setSelectedCollections] = useState<
    ResourcePickerCollection[]
  >([]);
  const [displayVariantsAsIndividual, setDisplayVariantsAsIndividual] =
    useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [conditionType, setConditionType] = useState<string>("equal_to");
  const [conditionValue, setConditionValue] = useState<string>("");

  // State for Publish Modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedVisibilityProducts, setSelectedVisibilityProducts] = useState<
    ResourcePickerProduct[]
  >([]);
  const [selectedVisibilityCollections, setSelectedVisibilityCollections] =
    useState<ResourcePickerCollection[]>([]);
  const [publishTab, setPublishTab] = useState(0);

  // State for Discount & Pricing
  const [enableDiscount, setEnableDiscount] = useState(false);
  const [discountType, setDiscountType] = useState("fixed_amount_off"); // Default to Fixed Amount Off
  const [discountOn, setDiscountOn] = useState("quantity");
  const [minimumQuantity, setMinimumQuantity] = useState("0");
  const [fixedAmountOff, setFixedAmountOff] = useState("0"); // New state for Fixed Amount Off
  const [percentageOff, setPercentageOff] = useState("0"); // New state for Percentage Off

  // Initialize discount states from loader data
  useEffect(() => {
    if (bundle.pricing) {
      setEnableDiscount(bundle.pricing.enableDiscount);
      setDiscountType(bundle.pricing.discountMethod);
      if (bundle.pricing.rules && bundle.pricing.rules.length > 0) {
        setDiscountOn(bundle.pricing.rules[0].discountOn || "quantity");
        setMinimumQuantity(
          String(bundle.pricing.rules[0].minimumQuantity || "0"),
        );
        setFixedAmountOff(
          String(bundle.pricing.rules[0].fixedAmountOff || "0"),
        );
        setPercentageOff(String(bundle.pricing.rules[0].percentageOff || "0"));
      }
    }
  }, [bundle.pricing]);

  // Initialize publish modal with existing bundle matching data
  useEffect(() => {
    if (bundle.parsedMatching) {
      setSelectedVisibilityProducts(
        bundle.parsedMatching.selectedVisibilityProducts || [],
      );
      setSelectedVisibilityCollections(
        bundle.parsedMatching.selectedVisibilityCollections || [],
      );
    }
  }, [bundle.parsedMatching]);

  // handleModalClose definition moved above useEffect for proper order
  const handleAddStepModalClose = useCallback(() => {
    setIsAddStepModalOpen(false);
    setCurrentStepId(null);
    setStepName("");
    setStepEnabled(true);
    setSelectedProducts([]);
    setSelectedCollections([]);
    setDisplayVariantsAsIndividual(false);
    setSelectedTab(0);
    setConditionType("equal_to");
    setConditionValue("");
  }, []);

  const handlePublishModalClose = useCallback(() => {
    setIsPublishModalOpen(false);
    setPublishTab(0);
  }, []);

  // Effect to reset modal fields when opening for add, or populate for edit
  useEffect(() => {
    // Safely check fetcher.data for success property
    if (fetcher.data) {
      if ("success" in fetcher.data && fetcher.data.success) {
        if (
          fetcher.data.intent === "addStep" ||
          fetcher.data.intent === "editStep"
        ) {
          const stepData = fetcher.data as {
            success: true;
            step: BundleStep;
            intent: string;
          };
          handleAddStepModalClose();
          shopify.toast.show("Step saved successfully!");
          console.log("Bundle Step Data:", stepData.step);
        } else if (fetcher.data.intent === "publishBundle") {
          const publishedBundleData = fetcher.data as {
            success: true;
            bundle: Bundle;
            intent: string;
          };
          handlePublishModalClose();
          shopify.toast.show("Bundle published successfully!");
          console.log("Published Bundle Details:", publishedBundleData.bundle);
        } else if (fetcher.data.intent === "updateDiscount") {
          const updatedPricingData = fetcher.data as {
            success: true;
            pricing: BundlePricing;
            intent: string;
          };
          shopify.toast.show("Discount settings saved successfully!");
          console.log("Updated Pricing Data:", updatedPricingData.pricing);
        }
      } else if ("error" in fetcher.data && fetcher.data.error) {
        const errorData = fetcher.data as {
          success: false;
          error: string;
          intent?: string;
        };
        shopify.toast.show(`Error: ${errorData.error}`, { isError: true });
        console.error("Action Error:", errorData.error);
        //hello
      }
    }
  }, [
    fetcher.data,
    /* isAddStepModalOpen, */ handleAddStepModalClose,
    handlePublishModalClose,
    shopify,
  ]);

  const handleAddStep = useCallback(async () => {
    const formData = new FormData();
    formData.append("intent", currentStepId ? "editStep" : "addStep");
    if (currentStepId) {
      formData.append("stepId", currentStepId);
    }
    formData.append("bundleId", bundle.id);
    formData.append("stepName", stepName);
    formData.append("enabled", String(stepEnabled));
    formData.append("selectedProducts", JSON.stringify(selectedProducts)); // Stringify for FormData
    formData.append("selectedCollections", JSON.stringify(selectedCollections)); // Stringify for FormData
    formData.append(
      "displayVariantsAsIndividual",
      String(displayVariantsAsIndividual),
    );
    formData.append("conditionType", conditionType);
    formData.append("conditionValue", conditionValue);

    fetcher.submit(formData, { method: "post" });
  }, [
    currentStepId,
    bundle.id,
    stepName,
    stepEnabled,
    selectedProducts,
    selectedCollections,
    displayVariantsAsIndividual,
    conditionType,
    conditionValue,
    fetcher,
  ]);

  const handlePublishBundle = useCallback(async () => {
    const formData = new FormData();
    formData.append("intent", "publishBundle");
    formData.append("bundleId", bundle.id);
    formData.append(
      "selectedVisibilityProducts",
      JSON.stringify(selectedVisibilityProducts),
    );
    formData.append(
      "selectedVisibilityCollections",
      JSON.stringify(selectedVisibilityCollections),
    );

    fetcher.submit(formData, { method: "post" });
  }, [
    bundle.id,
    fetcher,
    selectedVisibilityProducts,
    selectedVisibilityCollections,
  ]);

  const handleEditStep = useCallback((step: BundleStep) => {
    setCurrentStepId(step.id);
    setStepName(step.name);
    setStepEnabled(step.enabled ?? true);
    setSelectedProducts(step.products);
    setSelectedCollections(step.collections);
    setDisplayVariantsAsIndividual(step.displayVariantsAsIndividual);
    if (step.products.length > 0) {
      setSelectedTab(0);
    } else if (step.collections.length > 0) {
      setSelectedTab(1);
    } else {
      setSelectedTab(0);
    }
    setConditionType(step.conditionType || "equal_to");
    setConditionValue(String(step.conditionValue || ""));
    setIsAddStepModalOpen(true);
  }, []);

  const tabs = [
    {
      id: "products",
      content: "Products",
      badge:
        selectedProducts.length > 0
          ? selectedProducts.length.toString()
          : undefined,
    },
    {
      id: "collections",
      content: "Collections",
      badge:
        selectedCollections.length > 0
          ? selectedCollections.length.toString()
          : undefined,
    },
  ];

  const handleProductSelection = useCallback(async () => {
    const products = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      selectionIds: selectedProducts.map((p) => ({ id: p.id })),
    });
    if (products && products.selection) {
      setSelectedProducts(products.selection as ResourcePickerProduct[]);
    }
  }, [shopify, selectedProducts]);

  const handleCollectionSelection = useCallback(async () => {
    const collections = await shopify.resourcePicker({
      type: "collection",
      multiple: true,
      selectionIds: selectedCollections.map((c) => ({ id: c.id })),
    });
    if (collections && collections.selection) {
      setSelectedCollections(
        collections.selection as ResourcePickerCollection[],
      );
    }
  }, [shopify, selectedCollections]);

  const handleSaveDiscount = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "updateDiscount");
    formData.append("bundleId", bundle.id);
    formData.append("enableDiscount", String(enableDiscount));
    formData.append("discountMethod", discountType);
    formData.append("discountOn", discountOn);
    formData.append("minimumQuantity", minimumQuantity);
    formData.append("fixedAmountOff", fixedAmountOff);
    formData.append("percentageOff", percentageOff);
    fetcher.submit(formData, { method: "post" });
  }, [
    bundle.id,
    enableDiscount,
    discountType,
    discountOn,
    minimumQuantity,
    fixedAmountOff,
    percentageOff,
    fetcher,
  ]);

  return (
    <Page>
      <TitleBar title={bundle.name}></TitleBar>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Bundle Steps
                </Text>
                <Button
                  variant="primary"
                  onClick={() => setIsAddStepModalOpen(true)}
                >
                  Add step
                </Button>
              </InlineStack>

              {bundle.steps && bundle.steps.length > 0 ? (
                <BlockStack>
                  {bundle.steps.map((step, index) => (
                    <div key={step.id}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "var(--p-space-200) 0",
                        }}
                      >
                        <InlineStack gap="400" blockAlign="center">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {index + 1}.
                          </Text>
                          <Text as="p" variant="bodyMd">
                            {step.name}
                          </Text>
                          <Badge
                            tone={
                              (step.enabled ?? true) ? "success" : "warning"
                            }
                          >
                            {(step.enabled ?? true) ? "Enabled" : "Disabled"}
                          </Badge>
                        </InlineStack>
                        <InlineStack gap="200">
                          <Button onClick={() => handleEditStep(step)}>
                            Edit
                          </Button>
                          <Button>Clone</Button>
                          <Button>Delete</Button>
                        </InlineStack>
                      </div>
                      {index < bundle.steps.length - 1 && <Divider />}
                    </div>
                  ))}
                </BlockStack>
              ) : (
                <Text as="p" variant="bodyMd">
                  No steps yet. Click "Add Step" to create your first step.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Discount & Pricing
                </Text>
                <Checkbox
                  label="Enable discount"
                  checked={enableDiscount}
                  onChange={setEnableDiscount}
                />
              </InlineStack>

              {enableDiscount && (
                <BlockStack gap="400">
                  <Text as="p" variant="bodyMd">
                    Set up to 4 discount rules, applied from lowest to highest.
                  </Text>
                  <InlineStack>
                    <Text as="span" variant="bodySm">
                      <Badge tone="info">Tip:</Badge> Discounts are calculated
                      based on the products in cart, make sure to add the
                      "Default Product" quantity or amount while configuring
                      discounts.
                    </Text>
                  </InlineStack>

                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Discount Type
                    </Text>
                    <Select
                      label="Discount Type"
                      labelHidden
                      options={[
                        {
                          label: "Fixed Amount Off",
                          value: "fixed_amount_off",
                        },
                        { label: "Percentage Off", value: "percentage_off" },
                        { label: "Free Shipping", value: "free_shipping" },
                      ]}
                      value={discountType}
                      onChange={setDiscountType}
                    />
                  </BlockStack>

                  <Card>
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingMd">
                          Rule #1
                        </Text>
                        <Button variant="plain" tone="critical">
                          Remove
                        </Button>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Select
                          label="Discount on"
                          options={[
                            { label: "Quantity", value: "quantity" },
                            { label: "Amount", value: "amount" },
                          ]}
                          value={discountOn}
                          onChange={setDiscountOn}
                        />
                        <TextField
                          label="Minimum quantity"
                          value={minimumQuantity}
                          onChange={setMinimumQuantity}
                          autoComplete="off"
                          type="number"
                        />
                        {discountType === "fixed_amount_off" && (
                          <TextField
                            label="Fixed Amount Off"
                            value={fixedAmountOff}
                            onChange={setFixedAmountOff}
                            autoComplete="off"
                            type="number"
                            prefix="$"
                          />
                        )}
                        {discountType === "percentage_off" && (
                          <TextField
                            label="Percentage Off"
                            value={percentageOff}
                            onChange={setPercentageOff}
                            autoComplete="off"
                            type="number"
                            suffix="%"
                          />
                        )}
                        {discountType === "free_shipping" && (
                          // No additional fields needed for Free Shipping based on the image,
                          // but we keep the structure for consistency if future fields are added.
                          <></>
                        )}
                      </InlineStack>
                    </BlockStack>
                  </Card>

                  <Button fullWidth icon="CirclePlusIcon">
                    Add rule
                  </Button>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Bundle Publish
                </Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodyMd" as="p">
                    Make bundle available in your store
                  </Text>
                  <Button
                    variant="primary"
                    onClick={() => setIsPublishModalOpen(true)}
                  >
                    Publish
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
            <Card>
              <Button fullWidth variant="primary" onClick={handleSaveDiscount}>
                Save Discount Settings
              </Button>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Modal
        open={isAddStepModalOpen}
        onClose={handleAddStepModalClose}
        title={currentStepId ? "Edit Step" : "Add Step"}
        primaryAction={{
          content: currentStepId ? "Save Changes" : "Add Step",
          onAction: handleAddStep,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleAddStepModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField
              label="Step Name"
              helpText="e.g. Select Monitor"
              value={stepName}
              onChange={setStepName}
              autoComplete="off"
            />
            <Checkbox
              label="Enabled"
              helpText="If disabled, this step will not appear in the bundle."
              checked={stepEnabled}
              onChange={setStepEnabled}
            />
            <Divider />

            <Card padding="400">
              <Tabs
                tabs={tabs}
                selected={selectedTab}
                onSelect={setSelectedTab}
              />
              <BlockStack gap="300">
                {selectedTab === 0 ? (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Products selected here will be displayed on this step
                    </Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Button onClick={handleProductSelection}>
                        Add Products
                      </Button>
                      {selectedProducts.length > 0 && (
                        <Text as="p" variant="bodyMd" fontWeight="bold">
                          {selectedProducts.length} Selected
                        </Text>
                      )}
                    </InlineStack>
                    <Checkbox
                      label="Display variants as individual products"
                      checked={displayVariantsAsIndividual}
                      onChange={setDisplayVariantsAsIndividual}
                    />
                  </BlockStack>
                ) : (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Collections selected here will have all their products
                      available in this step
                    </Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Button onClick={handleCollectionSelection}>
                        Add Collections
                      </Button>
                      {selectedCollections.length > 0 && (
                        <Text as="p" variant="bodyMd" fontWeight="bold">
                          {selectedCollections.length} Selected
                        </Text>
                      )}
                    </InlineStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>

            <Divider />

            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Conditions
              </Text>
              <Text as="p" variant="bodyLg">
                Create conditions based on amount or quantity of products added
                on this step.
              </Text>
              <Text as="p" variant="bodySm">
                Note: Conditions are only valid on this step.
              </Text>

              <Card>
                <InlineStack gap="200" blockAlign="center">
                  <Text as="span" variant="bodyMd">
                    Quantity
                  </Text>
                  <Select
                    options={[
                      { label: "Equal to", value: "equal_to" },
                      { label: "More than or equal to", value: "at_least" },
                      { label: "Less than or equal to", value: "at_most" },
                    ]}
                    value={conditionType}
                    onChange={setConditionType}
                    label="Condition type"
                  />
                  <TextField
                    label="Value"
                    value={conditionValue}
                    onChange={setConditionValue}
                    autoComplete="off"
                    type="number"
                  />
                </InlineStack>
              </Card>
              <Button variant="primary">Add another condition</Button>
            </BlockStack>
            <Divider />
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Publish Bundle Modal */}
      <Modal
        open={isPublishModalOpen}
        onClose={handlePublishModalClose}
        title="Publish Bundle"
        primaryAction={{
          content: "Publish to Store",
          onAction: handlePublishBundle,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handlePublishModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              Bundle Visibility
            </Text>
            <Tabs
              tabs={[
                { id: "products", content: "Products" },
                { id: "collections", content: "Collections" },
              ]}
              selected={publishTab}
              onSelect={setPublishTab}
            >
              <BlockStack gap="300">
                {publishTab === 0 ? (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Available Products
                    </Text>
                    <Text as="p" variant="bodySm">
                      {selectedVisibilityProducts.length} selected
                    </Text>
                    <Button
                      onClick={async () => {
                        const products = await shopify.resourcePicker({
                          type: "product",
                          multiple: true,
                          selectionIds: selectedVisibilityProducts.map((p) => ({
                            id: p.id,
                          })),
                        });
                        if (products && products.selection) {
                          setSelectedVisibilityProducts(
                            products.selection as ResourcePickerProduct[],
                          );
                        }
                      }}
                    >
                      Select products
                    </Button>
                    {selectedVisibilityProducts.length > 0 && (
                      <Text as="p" variant="bodyMd" fontWeight="bold">
                        {selectedVisibilityProducts.length} product
                        {selectedVisibilityProducts.length === 1
                          ? ""
                          : "s"}{" "}
                        selected
                      </Text>
                    )}
                    {selectedVisibilityProducts.length === 0 && (
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd">
                          No products selected yet
                        </Text>
                        <InlineStack>
                          <Text as="p" variant="bodySm" fontWeight="medium">
                            Please select at least one product to enable bundle
                            matching
                          </Text>
                        </InlineStack>
                      </BlockStack>
                    )}
                  </BlockStack>
                ) : (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Collections selected here will have all their products
                      available in this step
                    </Text>
                    <Button
                      onClick={async () => {
                        const collections = await shopify.resourcePicker({
                          type: "collection",
                          multiple: true,
                          selectionIds: selectedVisibilityCollections.map(
                            (c) => ({ id: c.id }),
                          ),
                        });
                        if (collections && collections.selection) {
                          setSelectedVisibilityCollections(
                            collections.selection as ResourcePickerCollection[],
                          );
                        }
                      }}
                    >
                      Select collections
                    </Button>
                    {selectedVisibilityCollections.length > 0 && (
                      <Text as="p" variant="bodyMd" fontWeight="bold">
                        {selectedVisibilityCollections.length} collection
                        {selectedVisibilityCollections.length === 1
                          ? ""
                          : "s"}{" "}
                        selected
                      </Text>
                    )}
                    {selectedVisibilityCollections.length === 0 && (
                      <Text as="p" variant="bodyMd">
                        No collections selected yet
                      </Text>
                    )}
                  </BlockStack>
                )}
              </BlockStack>
            </Tabs>

            <InlineStack
              blockAlign="start"
              gap="400"
              align="space-between"
              wrap={false}
            >
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  What happens next?
                </Text>
                <List type="bullet">
                  <List.Item>
                    Bundle product cards will appear only on products and
                    collections selected here
                  </List.Item>
                  <List.Item>
                    Bundles will be LIVE directly once you click on publish
                  </List.Item>
                  <List.Item>
                    This is how a Bundle would look on your product pages
                    selected
                  </List.Item>
                </List>
                <InlineStack>
                  <Text as="p" variant="bodySm" fontWeight="medium">
                    The bundle will appear only on the specific products you
                    selected
                  </Text>
                </InlineStack>
              </BlockStack>
              <div style={{ flexShrink: 0 }}>
                <div className="bundle-preview-container">
                  <img
                    src={bundlePreviewGif}
                    alt="Bundle Preview"
                    className="bundle-preview-image"
                  />
                </div>
              </div>
            </InlineStack>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
