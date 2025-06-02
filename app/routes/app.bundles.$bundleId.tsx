import { useState, useCallback, useEffect } from "react";
import { Page, Layout, Card, Button, BlockStack, Text, InlineStack, Modal, TextField, Tabs, Checkbox, Select } from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import { ArrowLeftIcon } from '@shopify/polaris-icons';

// Define types for products and collections coming from ResourcePicker
interface ResourcePickerProduct {
  id: string;
  title: string;
  handle?: string;
  variants?: Array<{ id: string; title: string; price?: string; }>;
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

// Extend bundle type from loader to include steps and pricing
interface BundleWithStepsAndPricing extends Bundle {
  steps: BundleStep[];
  pricing: BundlePricing | null; // Add pricing to the bundle type
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const bundleId = params.bundleId;

  const bundle = await db.bundle.findUnique({
    where: {
    id: bundleId,
      shopId: shop,
    },
    include: {
      steps: true,
      pricing: true, // Include pricing data
    },
  });

  if (!bundle) {
    throw new Response("Bundle not found", { status: 404 });
  }

  // Parse JSON strings back to objects for products and collections, and Date strings to Date objects
  const parsedSteps = bundle.steps.map(step => ({
    ...step,
    products: step.products ? JSON.parse(step.products) : [],
    collections: step.collections ? JSON.parse(step.collections) : [],
    // createdAt: new Date(step.createdAt), // No longer parsing to Date here for type compatibility
    // updatedAt: new Date(step.updatedAt), // No longer parsing to Date here for type compatibility
  }));

  // Parse pricing rules if they exist
  const parsedPricing = bundle.pricing ? {
    ...bundle.pricing,
    rules: bundle.pricing.rules ? JSON.parse(bundle.pricing.rules) : null,
  } : null;

  return json({ bundle: { ...bundle, steps: parsedSteps, pricing: parsedPricing } });
}

// Action to handle adding or updating a step or pricing
export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "addStep" || intent === "editStep") {
    const bundleId = formData.get("bundleId") as string;
    const stepName = formData.get("stepName") as string;
    const selectedProductsString = formData.get("selectedProducts") as string;
    const selectedCollectionsString = formData.get("selectedCollections") as string;
    const displayVariantsAsIndividual = formData.get("displayVariantsAsIndividual") === "true";
    const conditionType = formData.get("conditionType") as string | null;
    const conditionValue = formData.get("conditionValue");
    const stepId = formData.get("stepId") as string | null;

    if (typeof bundleId !== 'string' || bundleId.length === 0 || typeof stepName !== 'string' || stepName.length === 0) {
      return json({ error: 'Bundle ID and Step Name are required' }, { status: 400 });
    }

    const parsedConditionValue = conditionValue ? parseInt(conditionValue as string, 10) : null;

    try {
      const stepData = {
        bundleId: bundleId,
        name: stepName,
        products: selectedProductsString ? selectedProductsString : null,
        collections: selectedCollectionsString ? selectedCollectionsString : null,
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
      return json({ success: true, step: resultStep });
    } catch (error) {
      console.error("Error saving bundle step:", error);
      return json({ error: 'Failed to save bundle step' }, { status: 500 });
    }
  }

  if (intent === "savePricing") {
    const bundleId = formData.get("bundleId") as string;
    const enableDiscounts = formData.get("enableDiscounts") === "true";
    const discountType = formData.get("discountType") as string;
    const pricingRulesString = formData.get("pricingRules") as string;
    const showDiscountBar = formData.get("showDiscountBar") === "true";
    const showInFooter = formData.get("showInFooter") === "true";

    if (typeof bundleId !== 'string' || bundleId.length === 0) {
      return json({ error: 'Bundle ID is required' }, { status: 400 });
    }

    const parsedPricingRules = pricingRulesString ? JSON.parse(pricingRulesString) : null;

    try {
      const existingPricing = await db.bundlePricing.findUnique({
        where: { bundleId: bundleId },
      });

      const pricingData = {
        type: discountType,
        status: enableDiscounts, // Assuming 'status' in schema maps to 'enableDiscounts'
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
      return json({ success: true, pricing: resultPricing });
    } catch (error) {
      console.error("Error saving bundle pricing:", error);
      return json({ error: 'Failed to save bundle pricing' }, { status: 500 });
    }
  }
  return null;
}

export default function BundleBuilderPage() {
  const { bundle } = useLoaderData<{ bundle: BundleWithStepsAndPricing }>();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  // State for Add/Edit Step Modal
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [stepName, setStepName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<ResourcePickerProduct[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<ResourcePickerCollection[]>([]);
  const [displayVariantsAsIndividual, setDisplayVariantsAsIndividual] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [conditionType, setConditionType] = useState<string>("equal_to");
  const [conditionValue, setConditionValue] = useState<string>("");

  // State for Bundle Pricing Modal
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [enableDiscounts, setEnableDiscounts] = useState(false);
  const [discountType, setDiscountType] = useState("fixed_amount_off");
  const [pricingRules, setPricingRules] = useState<Array<{ minQuantity: string; value: string }>>([{ minQuantity: "", value: "" }]);
  const [showDiscountBar, setShowDiscountBar] = useState(false);
  const [showInFooter, setShowInFooter] = useState(false);

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
    // Reset pricing form fields here if needed
    setEnableDiscounts(false);
    setDiscountType("fixed_amount_off");
    setPricingRules([{ minQuantity: "", value: "" }]);
    setShowDiscountBar(false);
    setShowInFooter(false);
  }, []);


  // Effect to reset modal fields when opening for add, or populate for edit
  useEffect(() => {
    // Safely check fetcher.data for success property
    if (fetcher.data && 'success' in fetcher.data && fetcher.data.success && isAddStepModalOpen) {
      handleAddStepModalClose();
      // Remix's default revalidation should handle updating the UI after a successful action
    }
  }, [fetcher.data, isAddStepModalOpen, handleAddStepModalClose]);

  // Effect to populate pricing modal state when bundle data changes
  useEffect(() => {
    if (bundle.pricing) {
      setEnableDiscounts(bundle.pricing.status);
      setDiscountType(bundle.pricing.type);
      // Ensure rules are not null before setting
      if (bundle.pricing.rules) {
        setPricingRules(bundle.pricing.rules);
      } else {
        setPricingRules([{ minQuantity: "", value: "" }]);
      }
      setShowDiscountBar(bundle.pricing.showBar);
      setShowInFooter(bundle.pricing.showFooter);
    }
  }, [bundle.pricing]);


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
    formData.append("displayVariantsAsIndividual", String(displayVariantsAsIndividual));
    formData.append("conditionType", conditionType);
    formData.append("conditionValue", conditionValue);

    fetcher.submit(formData, { method: "post" });

  }, [currentStepId, bundle.id, stepName, selectedProducts, selectedCollections, displayVariantsAsIndividual, conditionType, conditionValue, fetcher]);

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
  }, [bundle.id, enableDiscounts, discountType, pricingRules, showDiscountBar, showInFooter, fetcher]);


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
    { id: 'products', content: 'Products' },
    { id: 'collections', content: 'Collections' },
  ];

  const handleProductSelection = useCallback(async () => {
    const products = await shopify.resourcePicker({
      type: 'product',
      multiple: true,
      selectionIds: selectedProducts.map(p => ({ id: p.id }))
    });
    if (products && products.selection) {
      setSelectedProducts(products.selection as ResourcePickerProduct[]);
    }
  }, [shopify, selectedProducts]);

  const handleCollectionSelection = useCallback(async () => {
    const collections = await shopify.resourcePicker({
      type: 'collection',
      multiple: true,
      selectionIds: selectedCollections.map(c => ({ id: c.id }))
    });
    if (collections && collections.selection) {
      setSelectedCollections(collections.selection as ResourcePickerCollection[]);
    }
  }, [shopify, selectedCollections]);

  return (
    <Page>
      <TitleBar title={bundle.name}>
        <button variant="primary" onClick={() => setIsAddStepModalOpen(true)}>Add step</button>
      </TitleBar>
      <Layout>
        <Layout.Section>
          <Button
            onClick={() => navigate('/app')}
            icon={ArrowLeftIcon}
            variant="plain"
          >
            Back to Bundles
          </Button>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Bundle Steps</Text>

              {bundle.steps && bundle.steps.length > 0 ? (
                <BlockStack gap="300">
                  {bundle.steps.map((step) => ( /* Removed explicit cast here */
                    <Card key={step.id}>
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingMd">{step.name}</Text>
                        <InlineStack gap="200">
                          <Button variant="tertiary" onClick={() => handleEditStep(step)}>Edit</Button>
                          <Button variant="tertiary">Clone</Button>
                          <Button variant="tertiary">Delete</Button> {/* Reverted to tertiary variant */}
                        </InlineStack>
                      </InlineStack>
                    </Card>
                  ))}
                </BlockStack>
              ) : (
                <Text as="p" variant="bodyMd">No steps yet. Click "Add Step" to create your first step.</Text>
              )}

            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Bundle Pricing</Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodyMd" as="p">Configure discounts and pricing rules</Text>
                  <Button variant="secondary" onClick={() => setIsPricingModalOpen(true)}>Configure Pricing</Button>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Bundle Publish</Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodyMd" as="p">Make bundle available in your store</Text>
                  <Button variant="primary">Publish</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Modal
        open={isAddStepModalOpen}
        onClose={handleAddStepModalClose}
        title={currentStepId ? "Edit Step" : "Add Step"}
        primaryAction={{
          content: currentStepId ? 'Save Changes' : 'Add Step',
          onAction: handleAddStep,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
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
              <Text as="h3" variant="headingMd">Products / Collections</Text>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
                <BlockStack gap="300">
                  {selectedTab === 0 ? (
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">Products selected here will be displayed on this step</Text>
                      <Button onClick={handleProductSelection}>Add Products</Button>
                      {selectedProducts.length > 0 && (
                        <BlockStack gap="200">
                          {selectedProducts.map((product) => (
                            <InlineStack key={product.id} align="space-between">
                              <Text as="p" variant="bodyMd">{product.title}</Text>
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
                      <Text as="p" variant="bodyMd">Collections selected here will have all their products available in this step</Text>
                      <Button onClick={handleCollectionSelection}>Add Collections</Button>
                      {selectedCollections.length > 0 && (
                        <BlockStack gap="200">
                          {selectedCollections.map((collection) => (
                            <InlineStack key={collection.id} align="space-between">
                              <Text as="p" variant="bodyMd">{collection.title}</Text>
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
              <Text as="h3" variant="headingMd">Conditions</Text>
              <Text as="p" variant="bodyMd">Create conditions based on amount or quantity of products added on this step.</Text>
              <Text as="p" variant="bodySm">Note: Conditions are only valid on this step.</Text>

              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="bodyMd">Quantity</Text>
                <Select
                  options={[
                    { label: 'is equal to', value: 'equal_to' },
                    { label: 'at most', value: 'at_most' },
                    { label: 'at least', value: 'at_least' },
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
          content: 'Save Changes',
          onAction: handleSavePricing,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handlePricingModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingMd">Discount Settings</Text>
              <Checkbox
                label="Enable discounts"
                checked={enableDiscounts}
                onChange={setEnableDiscounts}
              />
            </InlineStack>

            {enableDiscounts && (
              <BlockStack gap="200">
                <InlineStack>
                  <Text as="p" variant="bodyMd">Tip: Discounts are calculated based on the products in cart. Configure your rules from lowest to highest discount.</Text>
                </InlineStack>
                <Select
                  label="Discount Type"
                  options={[
                    { label: 'Fixed Amount Off', value: 'fixed_amount_off' },
                    { label: 'Percentage Off', value: 'percentage_off' },
                    { label: 'Fixed Price Only', value: 'fixed_price_only' },
                  ]}
                  value={discountType}
                  onChange={setDiscountType}
                />
                
                {/* Pricing Rules */}
                {pricingRules.map((rule, index) => (
                  <Card key={index} >
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">Rule #{index + 1}</Text>
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
                          label={discountType === 'percentage_off' ? "Percentage Off" : "Amount Off"}
                          value={rule.value}
                          onChange={(value) => {
                            const newRules = [...pricingRules];
                            newRules[index].value = value;
                            setPricingRules(newRules);
                          }}
                          type="number"
                          prefix={discountType === 'fixed_amount_off' ? "$" : undefined}
                          suffix={discountType === 'percentage_off' ? "%" : undefined}
                          autoComplete="off"
                        />
                      </InlineStack>
                    </BlockStack>
                  </Card>
                ))}
                <Button onClick={() => setPricingRules([...pricingRules, { minQuantity: "", value: "" }])}>Add new rule</Button>
              </BlockStack>
            )}

            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">Display Settings</Text>
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
    </Page>
  );
} 