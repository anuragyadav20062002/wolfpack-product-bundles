import { useState, useCallback, useEffect } from "react";
import { Page, Layout, Card, Button, BlockStack, Text, InlineStack, Modal, TextField, Tabs, Checkbox, Select, List, Divider, Badge } from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";

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

// Extend bundle type from loader to include steps and pricing, and parsed matching
interface BundleWithSteps {
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
  parsedMatching: {
    selectedVisibilityProducts: ResourcePickerProduct[];
    selectedVisibilityCollections: ResourcePickerCollection[];
  } | null; // This will be the parsed object from `matching`
}

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
  }));

  // Parse matching rules if they exist
  const parsedMatching = bundle.matching ? JSON.parse(bundle.matching) : null;

  return json({ bundle: { ...bundle, steps: parsedSteps, parsedMatching: parsedMatching } });
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
    const displayVariantsAsIndividual = formData.get("displayVariantsAsIndividual") === "true";
    const enabled = formData.get("enabled") === "true";
    const conditionType = formData.get("conditionType") as string;
    const conditionValue = formData.get("conditionValue") as string;
    const stepId = formData.get("stepId") as string | null;

    if (typeof bundleId !== 'string' || bundleId.length === 0 || typeof stepName !== 'string' || stepName.length === 0) {
      return json({ error: 'Bundle ID and Step Name are required' }, { status: 400 });
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
      return json({ error: 'Failed to save step' }, { status: 500 });
    }
  }

  if (intent === "publishBundle") {
    const bundleId = formData.get("bundleId") as string;
    const selectedVisibilityProducts = JSON.parse(formData.get("selectedVisibilityProducts") as string || "[]");
    const selectedVisibilityCollections = JSON.parse(formData.get("selectedVisibilityCollections") as string || "[]");

    if (typeof bundleId !== 'string' || bundleId.length === 0 || (selectedVisibilityProducts.length === 0 && selectedVisibilityCollections.length === 0)) {
      return json({ error: 'At least one product or collection must be selected for visibility to publish the bundle.' }, { status: 400 });
    }

    try {
      const updatedBundle = await db.bundle.update({
        where: { id: bundleId },
        data: {
          publishedAt: new Date(),
          status: "published",
          active: true,
          matching: JSON.stringify({
            selectedVisibilityProducts,
            selectedVisibilityCollections,
          }),
        },
      });
      console.log(`[LOG] Publishing bundle ${bundleId}...`);

      // Get the shop's GID to use as the ownerId for the metafield
      const shopIdResponse = await admin.graphql(
        `#graphql
        query shopId {
          shop {
            id
          }
        }`
      );
      const shopIdData = await shopIdResponse.json();
      const shopGid = shopIdData.data.shop.id;

      // Update shop metafield with all bundles
      const allPublishedBundles = await db.bundle.findMany({
        where: { status: "published", shopId: session.shop },
        include: { steps: true },
      });

      const metafieldValue = allPublishedBundles.map(b => {
        const steps = b.steps.map(s => ({ ...s, products: s.products ? JSON.parse(s.products) : [], collections: s.collections ? JSON.parse(s.collections) : [] }));
        return {
          id: b.id,
          name: b.name,
          description: b.description,
          status: b.status,
          matching: b.matching ? JSON.parse(b.matching) : {},
          steps: steps
        };
      });

      await admin.graphql(
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
            metafields: [
              {
                ownerId: shopGid,
                namespace: "custom",
                key: "all_bundles",
                type: "json",
                value: JSON.stringify(metafieldValue),
              },
            ],
          },
        }
      );

      return json({ success: true, bundle: updatedBundle, intent: intent });
    } catch (error) {
      console.error("Error publishing bundle:", error);
      return json({ error: 'Failed to publish bundle' }, { status: 500 });
    }
  }

  if (intent === "deleteBundle") {
    const bundleId = formData.get("bundleId") as string;

    if (typeof bundleId !== 'string' || bundleId.length === 0) {
      return json({ error: 'Bundle ID is required for deletion' }, { status: 400 });
    }

    try {
      await db.bundleStep.deleteMany({ where: { bundleId: bundleId } });
      await db.bundle.delete({ where: { id: bundleId } });

      return json({ success: true, intent: intent });
    } catch (error) {
      console.error("Error deleting bundle:", error);
      return json({ error: 'Failed to delete bundle' }, { status: 500 });
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
  const [selectedProducts, setSelectedProducts] = useState<ResourcePickerProduct[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<ResourcePickerCollection[]>([]);
  const [displayVariantsAsIndividual, setDisplayVariantsAsIndividual] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [conditionType, setConditionType] = useState<string>("equal_to");
  const [conditionValue, setConditionValue] = useState<string>("");

  // State for Publish Modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedVisibilityProducts, setSelectedVisibilityProducts] = useState<ResourcePickerProduct[]>([]);
  const [selectedVisibilityCollections, setSelectedVisibilityCollections] = useState<ResourcePickerCollection[]>([]);
  const [publishTab, setPublishTab] = useState(0);

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
    setSelectedVisibilityProducts([]);
    setSelectedVisibilityCollections([]);
    setPublishTab(0);
  }, []);

  // Effect to reset modal fields when opening for add, or populate for edit
  useEffect(() => {
    // Safely check fetcher.data for success property
    if (fetcher.data) {
      if ('success' in fetcher.data && fetcher.data.success) {
        if (fetcher.data.intent === "addStep" || fetcher.data.intent === "editStep") {
          const stepData = fetcher.data as unknown as { success: true, step: BundleStep, intent: string };
          handleAddStepModalClose();
          shopify.toast.show('Step saved successfully!');
          console.log("Bundle Step Data:", stepData.step);
        } else if (fetcher.data.intent === "publishBundle") {
          const publishedBundleData = fetcher.data as unknown as { success: true, bundle: Bundle, intent: string };
          handlePublishModalClose();
          shopify.toast.show('Bundle published successfully!');
          console.log("Published Bundle Details:", publishedBundleData.bundle);
        }
      } else if ('error' in fetcher.data && fetcher.data.error) {
        const errorData = fetcher.data as unknown as { success: false, error: string, intent?: string };
        shopify.toast.show(`Error: ${errorData.error}`, { isError: true });
        console.error("Action Error:", errorData.error);
        //hello
      }
    }
  }, [fetcher.data, /* isAddStepModalOpen, */ handleAddStepModalClose, handlePublishModalClose, shopify]);

  const handleAddStep = useCallback(async () => {
    const formData = new FormData();
    formData.append("intent", currentStepId ? "editStep" : "addStep");
    if (currentStepId) {
      formData.append("stepId", currentStepId);
    }
    formData.append("bundleId", bundle.id);
    formData.append("stepName", stepName);
    formData.append("enabled", String(stepEnabled));
    formData.append("selectedProducts", JSON.stringify(selectedProducts));
    formData.append("selectedCollections", JSON.stringify(selectedCollections));
    formData.append("displayVariantsAsIndividual", String(displayVariantsAsIndividual));
    formData.append("conditionType", conditionType);
    formData.append("conditionValue", conditionValue);

    fetcher.submit(formData, { method: "post" });

  }, [currentStepId, bundle.id, stepName, stepEnabled, selectedProducts, selectedCollections, displayVariantsAsIndividual, conditionType, conditionValue, fetcher]);

  const handlePublishBundle = useCallback(async () => {
    const formData = new FormData();
    formData.append("intent", "publishBundle");
    formData.append("bundleId", bundle.id);
    formData.append("selectedVisibilityProducts", JSON.stringify(selectedVisibilityProducts));
    formData.append("selectedVisibilityCollections", JSON.stringify(selectedVisibilityCollections));

    fetcher.submit(formData, { method: "post" });
  }, [bundle.id, fetcher, selectedVisibilityProducts, selectedVisibilityCollections]);

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
      id: 'products',
      content: 'Products',
      badge: selectedProducts.length > 0 ? selectedProducts.length.toString() : undefined,
    },
    {
      id: 'collections',
      content: 'Collections',
      badge: selectedCollections.length > 0 ? selectedCollections.length.toString() : undefined,
    },
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
      </TitleBar>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">Bundle Steps</Text>
                <Button variant="primary" onClick={() => setIsAddStepModalOpen(true)}>Add step</Button>
              </InlineStack>

              {bundle.steps && bundle.steps.length > 0 ? (
                <BlockStack>
                  {bundle.steps.map((step, index) => (
                    <div key={step.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--p-space-200) 0' }}>
                        <InlineStack gap="400" blockAlign="center">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">{index + 1}.</Text>
                          <Text as="p" variant="bodyMd">{step.name}</Text>
                          <Badge tone={step.enabled ?? true ? "success" : "warning"}>
                            {step.enabled ?? true ? "Enabled" : "Disabled"}
                          </Badge>
                        </InlineStack>
                        <InlineStack gap="200">
                          <Button onClick={() => handleEditStep(step)}>Edit</Button>
                          <Button>Clone</Button>
                          <Button>Delete</Button>
                        </InlineStack>
                      </div>
                      {index < bundle.steps.length - 1 && <Divider />}
                    </div>
                  ))}
                </BlockStack>
              ) : (
                <Text as="p" variant="bodyMd">No steps yet. Click "Add Step" to create your first step.</Text>
              )}

            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Bundle Publish</Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodyMd" as="p">Make bundle available in your store</Text>
                  <Button variant="primary" onClick={() => setIsPublishModalOpen(true)}>Publish</Button>
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
            <Checkbox
              label="Enabled"
              helpText="If disabled, this step will not appear in the bundle."
              checked={stepEnabled}
              onChange={setStepEnabled}
            />
            <Divider />

            <Card padding="400">
              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
              <BlockStack gap="300">
                {selectedTab === 0 ? (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">Products selected here will be displayed on this step</Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Button onClick={handleProductSelection}>Add Products</Button>
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
                    <Text as="p" variant="bodyMd">Collections selected here will have all their products available in this step</Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Button onClick={handleCollectionSelection}>Add Collections</Button>
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
              <Text as="h3" variant="headingMd">Conditions</Text>
              <Text as="p" variant="bodyLg">Create conditions based on amount or quantity of products added on this step.</Text>
              <Text as="p" variant="bodySm">Note: Conditions are only valid on this step.</Text>

              <Card>
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="bodyMd">Quantity</Text>
                <Select
                  options={[
                    { label: 'Equal to', value: 'equal_to' },
                    { label: 'More than or equal to', value: 'at_least' },
                    { label: 'Less than or equal to', value: 'at_most' },
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
          content: 'Publish to Store',
          onAction: handlePublishBundle,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handlePublishModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">Bundle Visibility</Text>
            <Tabs tabs={[
              { id: 'products', content: 'Products' },
              { id: 'collections', content: 'Collections' },
            ]} selected={publishTab} onSelect={setPublishTab}>
              <BlockStack gap="300">
                {publishTab === 0 ? (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">Available Products</Text>
                    <Text as="p" variant="bodySm">{selectedVisibilityProducts.length} selected</Text>
                    <Button onClick={async () => {
                      const products = await shopify.resourcePicker({
                        type: 'product',
                        multiple: true,
                        selectionIds: selectedVisibilityProducts.map(p => ({ id: p.id }))
                      });
                      if (products && products.selection) {
                        setSelectedVisibilityProducts(products.selection as ResourcePickerProduct[]);
                      }
                    }}>Select products</Button>
                    {selectedVisibilityProducts.length > 0 && (
                      <Text as="p" variant="bodyMd" fontWeight="bold">
                        {selectedVisibilityProducts.length} product{selectedVisibilityProducts.length === 1 ? '' : 's'} selected
                      </Text>
                    )}
                    {selectedVisibilityProducts.length === 0 && (
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd">No products selected yet</Text>
                        <InlineStack>
                          <Text as="p" variant="bodySm" fontWeight="medium">Please select at least one product to enable bundle matching</Text>
                        </InlineStack>
                      </BlockStack>
                    )}
                  </BlockStack>
                ) : (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">Collections selected here will have all their products available in this step</Text>
                    <Button onClick={async () => {
                      const collections = await shopify.resourcePicker({
                        type: 'collection',
                        multiple: true,
                        selectionIds: selectedVisibilityCollections.map(c => ({ id: c.id }))
                      });
                      if (collections && collections.selection) {
                        setSelectedVisibilityCollections(collections.selection as ResourcePickerCollection[]);
                      }
                    }}>Select collections</Button>
                    {selectedVisibilityCollections.length > 0 && (
                      <Text as="p" variant="bodyMd" fontWeight="bold">
                        {selectedVisibilityCollections.length} collection{selectedVisibilityCollections.length === 1 ? '' : 's'} selected
                      </Text>
                    )}
                    {selectedVisibilityCollections.length === 0 && (
                      <Text as="p" variant="bodyMd">No collections selected yet</Text>
                    )}
                  </BlockStack>
                )}
              </BlockStack>
            </Tabs>

            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">What happens next?</Text>
              <List type="bullet">
                <List.Item>Bundle will be published to your store</List.Item>
                <List.Item>It will appear on products based on your selection</List.Item>
                <List.Item>You can edit the bundle settings in the theme customizer</List.Item>
              </List>
              <InlineStack>
                <Text as="p" variant="bodySm" fontWeight="medium">The bundle will appear only on the specific products you selected</Text>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
} 