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
  Box,
  Badge,
  Icon,
  Divider,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import {
  ArrowLeftIcon,
  XIcon,
  EditIcon,
  DeleteIcon,
  SettingsIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DragHandleIcon,
} from "@shopify/polaris-icons";

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

// Define a type for Bundle, matching Prisma's Bundle model
interface Bundle {
  id: string;
  name: string;
  description: string | null;
  shopId: string;
  status: string;
  active: boolean;
  publishedAt: Date | null;
  settings: string | null;
  matching: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define a type for BundleStep, matching Prisma schema and parsed JSON
interface BundleStep {
  id: string;
  name: string;
  products: ResourcePickerProduct[]; // Parsed from JSON string
  collections: ResourcePickerCollection[]; // Parsed from JSON string
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
  createdAt: string; // Changed to string
  updatedAt: string; // Changed to string
}

// Define a type for BundlePricing, matching Prisma schema and parsed JSON
interface BundlePricing {
  id: string;
  bundleId: string;
  type: string;
  status: boolean;
  rules: Array<{ minQuantity: string; value: string }> | null; // Parsed from JSON string
  showFooter: boolean;
  showBar: boolean;
  messages: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extend bundle type from loader to include steps and pricing, and parsed matching
interface BundleWithStepsAndPricing {
  id: string;
  name: string;
  description: string | null;
  shopId: string;
  status: string;
  active: boolean;
  publishedAt: Date | null;
  settings: string | null;
  createdAt: Date;
  updatedAt: Date;

  steps: BundleStep[];
  pricing: BundlePricing | null;
  parsedMatching: {
    selectedVisibilityProducts: ResourcePickerProduct[];
    selectedVisibilityCollections: ResourcePickerCollection[];
  } | null; // This will be the parsed object from `matching`
}

// GraphQL Mutations
const SET_SHOP_METAFIELD_MUTATION = `#graphql
  mutation SetShopMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_SHOP_METAFIELD_QUERY = `#graphql
  query GetShopMetafield($namespace: String!, $key: String!) {
    shop {
      metafield(namespace: $namespace, key: $key) {
        id
        namespace
        key
        value
      }
    }
  }
`;

const GET_SHOP_GID_QUERY = `#graphql
  query GetShopGid {
    shop {
      id
    }
  }
`;

// Helper function to update shop metafields
async function updateShopMetafield(
  admin: any,
  shopIdGid: string,
  bundleId: string,
  bundleData: any,
) {
  const metafieldNamespace = "custom";
  const metafieldKey = "all_bundles";

  let allBundles: { [key: string]: any } = {};

  try {
    const response = await admin.graphql(GET_SHOP_METAFIELD_QUERY, {
      variables: {
        namespace: metafieldNamespace,
        key: metafieldKey,
      },
    });
    const responseJson = await response.json();

    if (responseJson.data?.shop?.metafield?.value) {
      allBundles = JSON.parse(responseJson.data.shop.metafield.value);
    }
  } catch (error) {
    console.error("Error fetching existing metafield:", error);
  }

  // Update the specific bundle data
  allBundles[bundleId] = bundleData;

  const metafieldInput: {
    ownerId: string;
    namespace: string;
    key: string;
    value: string;
    type: string;
  } = {
    ownerId: shopIdGid,
    namespace: metafieldNamespace,
    key: metafieldKey,
    value: JSON.stringify(allBundles),
    type: "json",
  };

  console.log("Metafield Input being sent:", metafieldInput);

  try {
    const setMetafieldResponse = await admin.graphql(
      SET_SHOP_METAFIELD_MUTATION,
      {
        variables: {
          metafields: [metafieldInput],
        },
      },
    );
    const setMetafieldJson: any = await setMetafieldResponse.json();

    if (setMetafieldJson.errors) {
      console.error("Error setting shop metafield:", setMetafieldJson.errors);
    } else if (setMetafieldJson.data?.metafieldsSet?.userErrors.length > 0) {
      console.error(
        "Shopify User Errors:",
        setMetafieldJson.data.metafieldsSet.userErrors,
      );
    } else {
      console.log("Shop metafield updated successfully for bundle:", bundleId);
    }
  } catch (error) {
    console.error("Error saving metafield:", error);
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  console.log("🏗️ BUNDLE BUILDER LOADER CALLED - URL:", request.url);
  const { session } = await authenticate.admin(request);
  const bundleId = params.bundleId;

  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: session.shop,
    },
    include: {
      steps: true,
      pricing: true,
    },
  });

  if (!bundle) {
    throw new Response("Bundle not found", { status: 404 });
  }

  // Parse JSON strings back to objects for products and collections
  const parsedSteps = bundle.steps.map((step) => ({
    ...step,
    products: step.products ? JSON.parse(step.products) : [],
    collections: step.collections ? JSON.parse(step.collections) : [],
  }));

  // Parse pricing rules if they exist
  const parsedPricing = bundle.pricing
    ? {
        ...bundle.pricing,
        rules: bundle.pricing.rules ? JSON.parse(bundle.pricing.rules) : null,
      }
    : null;

  // Parse matching rules if they exist
  const parsedMatching = bundle.matching ? JSON.parse(bundle.matching) : null;

  return json({
    bundle: {
      ...bundle,
      steps: parsedSteps,
      pricing: parsedPricing,
      parsedMatching: parsedMatching,
    },
  });
}

// Action to handle adding or updating a step or pricing
export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  let shopIdGid: string;
  try {
    const shopGidResponse = await admin.graphql(GET_SHOP_GID_QUERY);
    const shopGidJson = await shopGidResponse.json();
    shopIdGid = shopGidJson.data.shop.id;
  } catch (error) {
    console.error("Error fetching shop GID:", error);
    return json({ error: "Failed to fetch shop ID" }, { status: 500 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "addStep" || intent === "editStep") {
    const bundleId = formData.get("bundleId") as string;
    const stepName = formData.get("stepName") as string;
    const selectedProductsString = formData.get("selectedProducts") as string;
    const selectedCollectionsString = formData.get(
      "selectedCollections",
    ) as string;
    const displayVariantsAsIndividual =
      formData.get("displayVariantsAsIndividual") === "true";
    const conditionType = formData.get("conditionType") as string | null;
    const conditionValue = formData.get("conditionValue");
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

    const parsedConditionValue = conditionValue
      ? parseInt(conditionValue as string, 10)
      : null;

    try {
      const stepData = {
        bundleId: bundleId,
        name: stepName,
        products: selectedProductsString ? selectedProductsString : null,
        collections: selectedCollectionsString
          ? selectedCollectionsString
          : null,
        displayVariantsAsIndividual: displayVariantsAsIndividual,
        conditionType: conditionType,
        conditionValue: parsedConditionValue,
      };

      let resultStep;
      if (intent === "addStep") {
        resultStep = await db.bundleStep.create({ data: stepData });
      } else if (intent === "editStep" && stepId) {
        resultStep = await db.bundleStep.update({
          where: { id: stepId },
          data: stepData,
        });
      }

      // After saving the step, retrieve the full bundle and update the metafield
      const updatedBundle = await db.bundle.findUnique({
        where: { id: bundleId },
        include: { steps: true, pricing: true },
      });
      if (updatedBundle) {
        const parsedBundleSteps = updatedBundle.steps.map((step) => ({
          ...step,
          products: step.products ? JSON.parse(step.products) : [],
          collections: step.collections ? JSON.parse(step.collections) : [],
        }));
        const parsedBundlePricing = updatedBundle.pricing
          ? {
              ...updatedBundle.pricing,
              rules: updatedBundle.pricing.rules
                ? JSON.parse(updatedBundle.pricing.rules)
                : null,
            }
          : null;
        await updateShopMetafield(admin, shopIdGid, bundleId, {
          ...updatedBundle,
          steps: parsedBundleSteps,
          pricing: parsedBundlePricing,
        });
      }

      return json({ success: true, step: resultStep, intent: intent });
    } catch (error) {
      console.error("Error saving bundle step:", error);
      return json({ error: "Failed to save bundle step" }, { status: 500 });
    }
  }

  if (intent === "deleteStep") {
    const stepId = formData.get("stepId") as string;
    const bundleId = formData.get("bundleId") as string;

    if (typeof stepId !== "string" || stepId.length === 0) {
      return json(
        { error: "Step ID is required for deletion" },
        { status: 400 },
      );
    }

    try {
      await db.bundleStep.delete({ where: { id: stepId } });

      // After deleting the step, retrieve the full bundle and update the metafield
      const updatedBundle = await db.bundle.findUnique({
        where: { id: bundleId },
        include: { steps: true, pricing: true },
      });
      if (updatedBundle) {
        const parsedBundleSteps = updatedBundle.steps.map((step) => ({
          ...step,
          products: step.products ? JSON.parse(step.products) : [],
          collections: step.collections ? JSON.parse(step.collections) : [],
        }));
        const parsedBundlePricing = updatedBundle.pricing
          ? {
              ...updatedBundle.pricing,
              rules: updatedBundle.pricing.rules
                ? JSON.parse(updatedBundle.pricing.rules)
                : null,
            }
          : null;
        await updateShopMetafield(admin, shopIdGid, bundleId, {
          ...updatedBundle,
          steps: parsedBundleSteps,
          pricing: parsedBundlePricing,
        });
      }

      return json({ success: true, intent: intent });
    } catch (error) {
      console.error("Error deleting bundle step:", error);
      return json({ error: "Failed to delete bundle step" }, { status: 500 });
    }
  }

  if (intent === "savePricing") {
    const bundleId = formData.get("bundleId") as string;
    const enableDiscounts = formData.get("enableDiscounts") === "true";
    const discountType = formData.get("discountType") as string;
    const pricingRulesString = formData.get("pricingRules") as string;
    const showDiscountBar = formData.get("showDiscountBar") === "true";
    const showInFooter = formData.get("showInFooter") === "true";

    if (typeof bundleId !== "string" || bundleId.length === 0) {
      return json({ error: "Bundle ID is required" }, { status: 400 });
    }

    const parsedPricingRules = pricingRulesString
      ? JSON.parse(pricingRulesString)
      : null;

    try {
      const existingPricing = await db.bundlePricing.findUnique({
        where: { bundleId: bundleId },
      });

      const pricingData = {
        type: discountType,
        status: enableDiscounts,
        rules: parsedPricingRules ? JSON.stringify(parsedPricingRules) : null,
        showBar: showDiscountBar,
        showFooter: showInFooter,
      };

      let resultPricing;
      if (existingPricing) {
        resultPricing = await db.bundlePricing.update({
          where: { id: existingPricing.id },
          data: pricingData,
        });
      } else {
        resultPricing = await db.bundlePricing.create({
          data: { bundleId: bundleId, ...pricingData },
        });
      }

      // After saving pricing, retrieve the full bundle and update the metafield
      const updatedBundle = await db.bundle.findUnique({
        where: { id: bundleId },
        include: { steps: true, pricing: true },
      });
      if (updatedBundle) {
        const parsedBundleSteps = updatedBundle.steps.map((step) => ({
          ...step,
          products: step.products ? JSON.parse(step.products) : [],
          collections: step.collections ? JSON.parse(step.collections) : [],
        }));
        const parsedBundlePricing = updatedBundle.pricing
          ? {
              ...updatedBundle.pricing,
              rules: updatedBundle.pricing.rules
                ? JSON.parse(updatedBundle.pricing.rules)
                : null,
            }
          : null;
        await updateShopMetafield(admin, shopIdGid, bundleId, {
          ...updatedBundle,
          steps: parsedBundleSteps,
          pricing: parsedBundlePricing,
        });
      }

      return json({ success: true, pricing: resultPricing, intent: intent });
    } catch (error) {
      console.error("Error saving bundle pricing:", error);
      return json({ error: "Failed to save bundle pricing" }, { status: 500 });
    }
  }

  if (intent === "publishBundle") {
    const bundleId = formData.get("bundleId") as string;
    const selectedVisibilityProductsString = formData.get(
      "selectedVisibilityProducts",
    ) as string;
    const selectedVisibilityCollectionsString = formData.get(
      "selectedVisibilityCollections",
    ) as string;

    if (
      typeof bundleId !== "string" ||
      bundleId.length === 0 ||
      !selectedVisibilityProductsString ||
      !selectedVisibilityCollectionsString
    ) {
      return json(
        {
          error:
            "Bundle ID and selected visibility products/collections are required for publishing",
        },
        { status: 400 },
      );
    }

    const selectedVisibilityProducts = JSON.parse(
      selectedVisibilityProductsString,
    ) as ResourcePickerProduct[];
    const selectedVisibilityCollections = JSON.parse(
      selectedVisibilityCollectionsString,
    ) as ResourcePickerCollection[];

    try {
      const updatedBundle = await db.bundle.update({
        where: { id: bundleId },
        data: {
          publishedAt: new Date(),
          status: "published",
          active: true,
          matching: JSON.stringify({
            selectedVisibilityProducts: selectedVisibilityProducts,
            selectedVisibilityCollections: selectedVisibilityCollections,
          }),
        },
      });

      // After publishing, retrieve the full bundle and update the metafield
      const fullBundle = await db.bundle.findUnique({
        where: { id: bundleId },
        include: { steps: true, pricing: true },
      });
      if (fullBundle) {
        const parsedBundleSteps = fullBundle.steps.map((step) => ({
          ...step,
          products: step.products ? JSON.parse(step.products) : [],
          collections: step.collections ? JSON.parse(step.collections) : [],
        }));
        const parsedBundlePricing = fullBundle.pricing
          ? {
              ...fullBundle.pricing,
              rules: fullBundle.pricing.rules
                ? JSON.parse(fullBundle.pricing.rules)
                : null,
            }
          : null;
        await updateShopMetafield(admin, shopIdGid, bundleId, {
          ...fullBundle,
          steps: parsedBundleSteps,
          pricing: parsedBundlePricing,
        });
      }

      return json({ success: true, bundle: updatedBundle, intent: intent });
    } catch (error) {
      console.error("Error publishing bundle:", error);
      return json({ error: "Failed to publish bundle" }, { status: 500 });
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
      // Delete associated steps and pricing first due to foreign key constraints
      await db.bundleStep.deleteMany({ where: { bundleId: bundleId } });
      await db.bundlePricing.deleteMany({ where: { bundleId: bundleId } });
      await db.bundle.delete({ where: { id: bundleId } });

      // After deleting the bundle, remove it from the shop metafield using the helper
      await updateShopMetafield(admin, shopIdGid, bundleId, null);

      return json({ success: true, intent: intent });
    } catch (error) {
      console.error("Error deleting bundle:", error);
      return json({ error: "Failed to delete bundle" }, { status: 500 });
    }
  }

  if (intent === "clearAllBundlesMetafield") {
    try {
      const metafieldNamespace = "custom";
      const metafieldKey = "all_bundles";

      const metafieldInput: {
        ownerId: string;
        namespace: string;
        key: string;
        value: string;
        type: string;
      } = {
        ownerId: shopIdGid,
        namespace: metafieldNamespace,
        key: metafieldKey,
        value: JSON.stringify({}),
        type: "json",
      };

      const setMetafieldResponse = await admin.graphql(
        SET_SHOP_METAFIELD_MUTATION,
        {
          variables: {
            metafields: [metafieldInput],
          },
        },
      );
      const setMetafieldJson: any = await setMetafieldResponse.json();

      if (setMetafieldJson.errors) {
        console.error(
          "Error clearing all bundles from shop metafield:",
          setMetafieldJson.errors,
        );
        return json(
          { error: "Failed to clear all bundles metafield" },
          { status: 500 },
        );
      } else if (setMetafieldJson.data?.metafieldsSet?.userErrors.length > 0) {
        console.error(
          "Shopify User Errors clearing all bundles from metafield:",
          setMetafieldJson.data.metafieldsSet.userErrors,
        );
        return json(
          {
            error:
              "Failed to clear all bundles metafield due to Shopify errors",
          },
          { status: 500 },
        );
      } else {
        console.log("All bundles metafield cleared successfully.");
        return json({
          success: true,
          intent: intent,
          message: "All bundle metafields cleared.",
        });
      }
    } catch (error) {
      console.error("Error in clearAllBundlesMetafield intent:", error);
      return json(
        { error: "An unexpected error occurred while clearing metafields" },
        { status: 500 },
      );
    }
  }

  return null;
}

export default function BundleBuilderPage() {
  const { bundle } = useLoaderData<{ bundle: BundleWithStepsAndPricing }>();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  // State for expanded steps
  const [expandedSteps, setExpandedSteps] = useState<{
    [key: string]: boolean;
  }>({});

  // State for Add/Edit Step Modal
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [stepName, setStepName] = useState("");
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

  // State for Bundle Pricing Modal
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [enableDiscounts, setEnableDiscounts] = useState(false);
  const [discountType, setDiscountType] = useState("fixed_amount_off");
  const [pricingRules, setPricingRules] = useState<
    Array<{ minQuantity: string; value: string }>
  >([{ minQuantity: "", value: "" }]);
  const [showDiscountBar, setShowDiscountBar] = useState(false);
  const [showInFooter, setShowInFooter] = useState(false);

  // State for Publish Modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedVisibilityProducts, setSelectedVisibilityProducts] = useState<
    ResourcePickerProduct[]
  >([]);
  const [selectedVisibilityCollections, setSelectedVisibilityCollections] =
    useState<ResourcePickerCollection[]>([]);
  const [publishTab, setPublishTab] = useState(0);

  // State for selected products modal
  const [selectedProductsModal, setSelectedProductsModal] = useState(false);

  // State for step editing
  const [editingSteps, setEditingSteps] = useState<{
    [key: string]: { name: string; pageTitle: string };
  }>({});

  // Initialize editing states for existing steps
  useEffect(() => {
    const initialEditingStates: {
      [key: string]: { name: string; pageTitle: string };
    } = {};
    bundle.steps.forEach((step) => {
      initialEditingStates[step.id] = {
        name: step.name,
        pageTitle: step.name, // Using same value for page title
      };
    });
    setEditingSteps(initialEditingStates);
  }, [bundle.steps]);

  // handleModalClose definition moved above useEffect for proper order
  const handleAddStepModalClose = useCallback(() => {
    setIsAddStepModalOpen(false);
    setCurrentStepId(null);
    setStepName("");
    setSelectedProducts([]);
    setSelectedCollections([]);
    setDisplayVariantsAsIndividual(false);
    setSelectedTab(0);
    setConditionType("equal_to");
    setConditionValue("");
  }, []);

  const handlePricingModalClose = useCallback(() => {
    setIsPricingModalOpen(false);
    setEnableDiscounts(false);
    setDiscountType("fixed_amount_off");
    setPricingRules([{ minQuantity: "", value: "" }]);
    setShowDiscountBar(false);
    setShowInFooter(false);
  }, []);

  const handlePublishModalClose = useCallback(() => {
    setIsPublishModalOpen(false);
    setSelectedVisibilityProducts([]);
    setSelectedVisibilityCollections([]);
    setPublishTab(0);
  }, []);

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleStepNameChange = (
    stepId: string,
    field: "name" | "pageTitle",
    value: string,
  ) => {
    setEditingSteps((prev) => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [field]: value,
      },
    }));
  };

  const handleAddStep = useCallback(async () => {
    const formData = new FormData();
    formData.append("intent", currentStepId ? "editStep" : "addStep");
    if (currentStepId) {
      formData.append("stepId", currentStepId);
    }
    formData.append("bundleId", bundle.id);
    formData.append("stepName", stepName);
    formData.append("selectedProducts", JSON.stringify(selectedProducts));
    formData.append("selectedCollections", JSON.stringify(selectedCollections));
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
    selectedProducts,
    selectedCollections,
    displayVariantsAsIndividual,
    conditionType,
    conditionValue,
    fetcher,
  ]);

  const handleDeleteStep = useCallback(
    (stepId: string) => {
      if (
        confirm(
          "Are you sure you want to delete this step? This action cannot be undone.",
        )
      ) {
        const formData = new FormData();
        formData.append("intent", "deleteStep");
        formData.append("stepId", stepId);
        formData.append("bundleId", bundle.id);
        fetcher.submit(formData, { method: "post" });
      }
    },
    [bundle.id, fetcher],
  );

  const handleSavePricing = useCallback(async () => {
    const formData = new FormData();
    formData.append("intent", "savePricing");
    formData.append("bundleId", bundle.id);
    formData.append("enableDiscounts", String(enableDiscounts));
    formData.append("discountType", discountType);
    formData.append("pricingRules", JSON.stringify(pricingRules));
    formData.append("showDiscountBar", String(showDiscountBar));
    formData.append("showInFooter", String(showInFooter));

    fetcher.submit(formData, { method: "post" });
  }, [
    bundle.id,
    enableDiscounts,
    discountType,
    pricingRules,
    showDiscountBar,
    showInFooter,
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
    { id: "products", content: "Products" },
    { id: "collections", content: "Collections" },
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

  // Effect to reset modal fields when opening for add, or populate for edit
  useEffect(() => {
    if (fetcher.data) {
      if ("success" in fetcher.data && fetcher.data.success) {
        if (
          fetcher.data.intent === "addStep" ||
          fetcher.data.intent === "editStep"
        ) {
          const stepData = fetcher.data as unknown as {
            success: true;
            step: BundleStep;
            intent: string;
          };
          handleAddStepModalClose();
          shopify.toast.show("Step saved successfully!");
          console.log("Bundle Step Data:", stepData.step);
        } else if (fetcher.data.intent === "deleteStep") {
          shopify.toast.show("Step deleted successfully!");
        } else if (fetcher.data.intent === "savePricing") {
          const pricingData = fetcher.data as unknown as {
            success: true;
            pricing: BundlePricing;
            intent: string;
          };
          handlePricingModalClose();
          shopify.toast.show("Pricing saved successfully!");
          console.log("Bundle Pricing Data:", pricingData.pricing);
        } else if (fetcher.data.intent === "publishBundle") {
          const publishedBundleData = fetcher.data as unknown as {
            success: true;
            bundle: Bundle;
            intent: string;
          };
          handlePublishModalClose();
          shopify.toast.show("Bundle published successfully!");
          console.log("Published Bundle Details:", publishedBundleData.bundle);
        }
      } else if ("error" in fetcher.data && fetcher.data.error) {
        const errorData = fetcher.data as unknown as {
          success: false;
          error: string;
          intent?: string;
        };
        shopify.toast.show(`Error: ${errorData.error}`, { isError: true });
        console.error("Action Error:", errorData.error);
      }
    }
  }, [
    fetcher.data,
    handleAddStepModalClose,
    handlePricingModalClose,
    handlePublishModalClose,
    shopify,
  ]);

  // Effect to populate pricing modal state when bundle data changes
  useEffect(() => {
    if (bundle.pricing) {
      setEnableDiscounts(bundle.pricing.status);
      setDiscountType(bundle.pricing.type);
      if (bundle.pricing.rules) {
        setPricingRules(bundle.pricing.rules);
      } else {
        setPricingRules([{ minQuantity: "", value: "" }]);
      }
      setShowDiscountBar(bundle.pricing.showBar);
      setShowInFooter(bundle.pricing.showFooter);
    }
  }, [bundle.pricing]);

  return (
    <Page>
      <TitleBar title="Configure Bundle Flow">
        <button variant="primary">Preview Bundle</button>
      </TitleBar>

      <Layout>
        <Layout.Section>
          <Button
            onClick={() => navigate("/app")}
            icon={ArrowLeftIcon}
            variant="plain"
          >
            Back
          </Button>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          {/* Bundle Setup Section */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Bundle Setup
              </Text>

              <Text as="p" variant="bodyMd" tone="subdued">
                Set-up your bundle builder
              </Text>

              {/* Step Setup */}
              <Box>
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={SettingsIcon} tone="base" />
                    <Text as="h3" variant="headingMd">
                      Step Setup
                    </Text>
                  </InlineStack>
                </InlineStack>
              </Box>

              {/* Discount & Pricing */}
              <Box>
                <div
                  onClick={() => setIsPricingModalOpen(true)}
                  style={{ cursor: "pointer" }}
                >
                  <Box>
                    <InlineStack gap="200" blockAlign="center">
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "#e3e3e3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                        }}
                      >
                        %
                      </div>
                      <Text as="h3" variant="headingMd">
                        Discount & Pricing
                      </Text>
                    </InlineStack>
                  </Box>
                </div>
              </Box>

              {/* Bundle Upsell */}
              <Box>
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "#e3e3e3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                      }}
                    >
                      ↗
                    </div>
                    <Text as="h3" variant="headingMd">
                      Bundle Upsell
                    </Text>
                  </InlineStack>
                </InlineStack>
              </Box>

              {/* Bundle Settings */}
              <Box>
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "#e3e3e3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                      }}
                    >
                      #
                    </div>
                    <Text as="h3" variant="headingMd">
                      Bundle Settings
                    </Text>
                  </InlineStack>
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>

          {/* Bundle Product */}
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">
                  Bundle Product
                </Text>
                <Button variant="plain" tone="critical">
                  Sync Product
                </Button>
              </InlineStack>

              <InlineStack gap="300" blockAlign="center">
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#6B46C1",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "24px",
                  }}
                >
                  📦
                </div>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    New pdp builder
                  </Text>
                  <Button variant="plain" size="slim">
                    ↗
                  </Button>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Bundle Status */}
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                Bundle Status
              </Text>
              <Select
                label="Status"
                options={[
                  { label: "Active", value: "active" },
                  { label: "Draft", value: "draft" },
                  { label: "Archived", value: "archived" },
                ]}
                value="active"
                onChange={() => {}}
              />
            </BlockStack>
          </Card>

          {/* Take your bundle live */}
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                Take your bundle live
              </Text>
              <InlineStack gap="200">
                <Button onClick={() => setIsPublishModalOpen(true)}>
                  Place on theme
                </Button>
                <Button variant="plain">Place Widget ↗</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Bundle Steps Section */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg">
                  Bundle Steps
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Create steps for your multi-step bundle here. Select product
                  options for each step below
                </Text>
              </BlockStack>

              {bundle.steps && bundle.steps.length > 0 ? (
                <BlockStack gap="300">
                  {bundle.steps.map((step, index) => (
                    <Card key={step.id} padding="0">
                      <Box padding="400">
                        <InlineStack align="space-between" blockAlign="center">
                          <InlineStack gap="200" blockAlign="center">
                            <Icon source={DragHandleIcon} tone="subdued" />
                            <Text as="h3" variant="headingMd">
                              Step {index + 1}
                            </Text>
                          </InlineStack>
                          <InlineStack gap="200">
                            <Button
                              icon={EditIcon}
                              variant="tertiary"
                              size="slim"
                              onClick={() => handleEditStep(step)}
                            />
                            <Button
                              icon={DeleteIcon}
                              variant="tertiary"
                              size="slim"
                              tone="critical"
                              onClick={() => handleDeleteStep(step.id)}
                            />
                            <Button
                              icon={
                                expandedSteps[step.id]
                                  ? ChevronUpIcon
                                  : ChevronDownIcon
                              }
                              variant="tertiary"
                              size="slim"
                              onClick={() => toggleStepExpansion(step.id)}
                            />
                          </InlineStack>
                        </InlineStack>
                      </Box>

                      {expandedSteps[step.id] && (
                        <>
                          <Divider />
                          <Box padding="400">
                            <BlockStack gap="400">
                              {/* Step Name */}
                              <Box>
                                <TextField
                                  label="Step Name"
                                  value={
                                    editingSteps[step.id]?.name || step.name
                                  }
                                  onChange={(value) =>
                                    handleStepNameChange(step.id, "name", value)
                                  }
                                  autoComplete="off"
                                  placeholder="Step 1"
                                />
                              </Box>

                              {/* Step Page Title */}
                              <Box>
                                <TextField
                                  label="Step Page Title"
                                  value={
                                    editingSteps[step.id]?.pageTitle ||
                                    step.name
                                  }
                                  onChange={(value) =>
                                    handleStepNameChange(
                                      step.id,
                                      "pageTitle",
                                      value,
                                    )
                                  }
                                  autoComplete="off"
                                  placeholder="Step 1"
                                />
                              </Box>

                              {/* Products/Collections Tabs */}
                              <Box>
                                <Tabs
                                  tabs={[
                                    {
                                      id: "products",
                                      content: "Products",
                                      badge:
                                        step.products.length > 0
                                          ? step.products.length.toString()
                                          : undefined,
                                    },
                                    {
                                      id: "collections",
                                      content: "Collections",
                                    },
                                  ]}
                                  selected={0}
                                  onSelect={() => {}}
                                >
                                  <Box paddingBlockStart="400">
                                    <BlockStack gap="300">
                                      <Text
                                        as="p"
                                        variant="bodyMd"
                                        tone="subdued"
                                      >
                                        Products selected here will be displayed
                                        on this step
                                      </Text>

                                      <InlineStack
                                        gap="200"
                                        blockAlign="center"
                                      >
                                        <Button
                                          onClick={() => {
                                            setSelectedProducts(step.products);
                                            setSelectedProductsModal(true);
                                          }}
                                        >
                                          Add Products
                                        </Button>
                                        {step.products.length > 0 && (
                                          <Text
                                            as="span"
                                            variant="bodyMd"
                                            fontWeight="semibold"
                                          >
                                            {step.products.length.toString()}{" "}
                                            Selected
                                          </Text>
                                        )}
                                      </InlineStack>

                                      <Checkbox
                                        label="Display variants as individual products"
                                        checked={
                                          step.displayVariantsAsIndividual
                                        }
                                        onChange={() => {}}
                                      />
                                    </BlockStack>
                                  </Box>
                                </Tabs>
                              </Box>

                              {/* Conditions */}
                              <Box>
                                <BlockStack gap="300">
                                  <Text
                                    as="h4"
                                    variant="headingSm"
                                    fontWeight="medium"
                                  >
                                    Conditions
                                  </Text>
                                  <Text as="p" variant="bodyMd" tone="subdued">
                                    Create Conditions based on amount or
                                    quantity of products added on this step.
                                  </Text>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Note: Conditions are only valid on this step
                                  </Text>

                                  <Button icon={PlusIcon} variant="plain">
                                    Add Rule
                                  </Button>
                                </BlockStack>
                              </Box>
                            </BlockStack>
                          </Box>
                        </>
                      )}
                    </Card>
                  ))}

                  <Button
                    icon={PlusIcon}
                    variant="plain"
                    onClick={() => setIsAddStepModalOpen(true)}
                  >
                    Add Step
                  </Button>
                </BlockStack>
              ) : (
                <Button
                  icon={PlusIcon}
                  variant="primary"
                  onClick={() => setIsAddStepModalOpen(true)}
                >
                  Add Step
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Add/Edit Step Modal */}
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

            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Products / Collections
              </Text>
              <Tabs
                tabs={tabs}
                selected={selectedTab}
                onSelect={setSelectedTab}
              >
                <BlockStack gap="300">
                  {selectedTab === 0 ? (
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        Products selected here will be displayed on this step
                      </Text>
                      <Button onClick={handleProductSelection}>
                        Add Products
                      </Button>
                      {selectedProducts.length > 0 && (
                        <BlockStack gap="200">
                          {selectedProducts.map((product) => (
                            <InlineStack key={product.id} align="space-between">
                              <Text as="p" variant="bodyMd">
                                {product.title}
                              </Text>
                            </InlineStack>
                          ))}
                        </BlockStack>
                      )}
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
                      <Button onClick={handleCollectionSelection}>
                        Add Collections
                      </Button>
                      {selectedCollections.length > 0 && (
                        <BlockStack gap="200">
                          {selectedCollections.map((collection) => (
                            <InlineStack
                              key={collection.id}
                              align="space-between"
                            >
                              <Text as="p" variant="bodyMd">
                                {collection.title}
                              </Text>
                            </InlineStack>
                          ))}
                        </BlockStack>
                      )}
                    </BlockStack>
                  )}
                </BlockStack>
              </Tabs>
            </BlockStack>

            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Conditions
              </Text>
              <Text as="p" variant="bodyMd">
                Create conditions based on amount or quantity of products added
                on this step.
              </Text>
              <Text as="p" variant="bodySm">
                Note: Conditions are only valid on this step.
              </Text>

              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="bodyMd">
                  Quantity
                </Text>
                <Select
                  options={[
                    { label: "is equal to", value: "equal_to" },
                    { label: "at most", value: "at_most" },
                    { label: "at least", value: "at_least" },
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
              <Button>Add another condition</Button>
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Bundle Pricing Modal */}
      <Modal
        open={isPricingModalOpen}
        onClose={handlePricingModalClose}
        title="Bundle Pricing & Discounts"
        primaryAction={{
          content: "Save Changes",
          onAction: handleSavePricing,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handlePricingModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingMd">
                Discount Settings
              </Text>
              <Checkbox
                label="Enable discounts"
                checked={enableDiscounts}
                onChange={setEnableDiscounts}
              />
            </InlineStack>

            {enableDiscounts && (
              <BlockStack gap="200">
                <InlineStack>
                  <Text as="p" variant="bodyMd">
                    Tip: Discounts are calculated based on the products in cart.
                    Configure your rules from lowest to highest discount.
                  </Text>
                </InlineStack>
                <Select
                  label="Discount Type"
                  options={[
                    { label: "Fixed Amount Off", value: "fixed_amount_off" },
                    { label: "Percentage Off", value: "percentage_off" },
                    { label: "Fixed Price Only", value: "fixed_price_only" },
                  ]}
                  value={discountType}
                  onChange={setDiscountType}
                />

                {/* Pricing Rules */}
                {pricingRules.map((rule, index) => (
                  <Card key={index}>
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">
                        Rule #{index + 1}
                      </Text>
                      <InlineStack gap="200" blockAlign="center">
                        <TextField
                          label="Minimum quantity"
                          value={rule.minQuantity}
                          onChange={(value) => {
                            const newRules = [...pricingRules];
                            newRules[index].minQuantity = value;
                            setPricingRules(newRules);
                          }}
                          type="number"
                          autoComplete="off"
                        />
                        <TextField
                          label={
                            discountType === "percentage_off"
                              ? "Percentage Off"
                              : discountType === "fixed_price_only"
                                ? "Fixed Price"
                                : "Amount Off"
                          }
                          value={rule.value}
                          onChange={(value) => {
                            const newRules = [...pricingRules];
                            newRules[index].value = value;
                            setPricingRules(newRules);
                          }}
                          type="number"
                          prefix={
                            discountType === "fixed_amount_off" ||
                            discountType === "fixed_price_only"
                              ? "$"
                              : undefined
                          }
                          suffix={
                            discountType === "percentage_off" ? "%" : undefined
                          }
                          autoComplete="off"
                        />
                      </InlineStack>
                    </BlockStack>
                  </Card>
                ))}
                <Button
                  onClick={() =>
                    setPricingRules([
                      ...pricingRules,
                      { minQuantity: "", value: "" },
                    ])
                  }
                >
                  Add new rule
                </Button>
              </BlockStack>
            )}

            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Display Settings
              </Text>
              <Checkbox
                label="Show discount bar"
                checked={showDiscountBar}
                onChange={setShowDiscountBar}
              />
              <Checkbox
                label="Show in footer"
                checked={showInFooter}
                onChange={setShowInFooter}
              />
            </BlockStack>
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
                      {selectedVisibilityProducts.length.toString()} selected
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
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd">
                          Selected Products:
                        </Text>
                        {selectedVisibilityProducts.map((product) => (
                          <InlineStack key={product.id} align="space-between">
                            <Text as="p" variant="bodyMd">
                              {product.title}
                            </Text>
                          </InlineStack>
                        ))}
                      </BlockStack>
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
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd">
                          Selected Collections:
                        </Text>
                        <InlineStack gap="200" wrap={true}>
                          {selectedVisibilityCollections.map((collection) => (
                            <Button
                              key={collection.id}
                              onClick={() =>
                                setSelectedVisibilityCollections(
                                  selectedVisibilityCollections.filter(
                                    (c) => c.id !== collection.id,
                                  ),
                                )
                              }
                              variant="plain"
                              icon={XIcon}
                            >
                              {collection.title}
                            </Button>
                          ))}
                        </InlineStack>
                      </BlockStack>
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

            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                What happens next?
              </Text>
              <List type="bullet">
                <List.Item>Bundle will be published to your store</List.Item>
                <List.Item>
                  It will appear on products based on your selection
                </List.Item>
                <List.Item>
                  You can edit the bundle settings in the theme customizer
                </List.Item>
              </List>
              <InlineStack>
                <Text as="p" variant="bodySm" fontWeight="medium">
                  The bundle will appear only on the specific products you
                  selected
                </Text>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Selected Products Modal */}
      <Modal
        open={selectedProductsModal}
        onClose={() => setSelectedProductsModal(false)}
        title="Selected Products"
        primaryAction={{
          content: "Add Products",
          onAction: () => setSelectedProductsModal(false),
        }}
        secondaryActions={[
          {
            content: "Close",
            onAction: () => setSelectedProductsModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            {selectedProducts.map((product) => (
              <InlineStack
                key={product.id}
                align="space-between"
                blockAlign="center"
              >
                <InlineStack gap="300" blockAlign="center">
                  <Icon source={DragHandleIcon} tone="subdued" />
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: "#8B5CF6",
                      borderRadius: "50%",
                    }}
                  />
                  <Text as="p" variant="bodyMd">
                    {product.title}
                  </Text>
                </InlineStack>
                <Button
                  icon={DeleteIcon}
                  variant="tertiary"
                  tone="critical"
                  onClick={() => {
                    setSelectedProducts((prev) =>
                      prev.filter((p) => p.id !== product.id),
                    );
                  }}
                />
              </InlineStack>
            ))}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
