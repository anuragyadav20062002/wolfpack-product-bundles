import { useState, useCallback } from "react"; // Import useState and useCallback
import { Page, Layout, Card, Button, BlockStack, Text, InlineStack, Modal, TextField, Tabs, Checkbox, Select } from "@shopify/polaris"; // Removed ButtonGroup
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react"; // Consolidated imports
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import db from "../db.server"; // Import db
import { authenticate } from "../shopify.server"; // Import authenticate
import { ArrowLeftIcon } from '@shopify/polaris-icons'; // Import ArrowLeftIcon icon

// This loader will fetch the bundle details based on the bundleId in the URL
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request); // Authenticate the request
  const shop = session.shop;
  const bundleId = params.bundleId;

  // TODO: Fetch bundle data from your database using Prisma based on bundleId
  // Fetch bundle data from your database using Prisma
  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: shop, // Ensure the bundle belongs to the current shop
    },
  });

  if (!bundle) {
    throw new Response("Bundle not found", { status: 404 });
  }

  return json({ bundle });
}

export default function BundleBuilderPage() {
  const { bundle } = useLoaderData<typeof loader>();
  const navigate = useNavigate(); // Initialize useNavigate
  const shopify = useAppBridge(); // Initialize useAppBridge

  // State for Add Step Modal
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [stepName, setStepName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<any[]>([]);
  const [displayVariantsAsIndividual, setDisplayVariantsAsIndividual] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [conditionType, setConditionType] = useState("equal_to");
  const [conditionValue, setConditionValue] = useState("");

  const handleModalClose = useCallback(() => {
    setIsAddStepModalOpen(false);
    // Reset form fields when modal closes
    setStepName("");
    setSelectedProducts([]);
    setSelectedCollections([]);
    setDisplayVariantsAsIndividual(false);
    setSelectedTab(0);
    setConditionType("equal_to");
    setConditionValue("");
  }, []);

  const handleAddStep = async () => {
    // TODO: Implement logic to save the step data
    console.log("Adding step:", { stepName, selectedProducts, selectedCollections, displayVariantsAsIndividual, conditionType, conditionValue });
    handleModalClose();
  };

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
      setSelectedProducts(products.selection);
    }
  }, [shopify, selectedProducts]);

  const handleCollectionSelection = useCallback(async () => {
    const collections = await shopify.resourcePicker({
      type: 'collection',
      multiple: true,
      selectionIds: selectedCollections.map(c => ({ id: c.id }))
    });
    if (collections && collections.selection) {
      setSelectedCollections(collections.selection);
    }
  }, [shopify, selectedCollections]);

  return (
    <Page>
      <TitleBar title={bundle.name}>
        {/* Open modal when Add step button is clicked */}
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
              <Text as="p" variant="bodyMd">No steps yet. Click "Add Step" to create your first step.</Text>
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
                  <Button variant="secondary">Configure Pricing</Button>
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

      {/* Add Step Modal */}
      <Modal
        open={isAddStepModalOpen}
        onClose={handleModalClose}
        title="Add Step"
        primaryAction={{
          content: 'Add Step',
          onAction: handleAddStep,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleModalClose,
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
                    // Products Tab Content
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
                    // Collections Tab Content
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
    </Page>
  );
} 