import { useState, useCallback, useRef, useEffect } from "react";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, Form, useActionData, useNavigation, Outlet, useLocation, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  EmptyState,
  DataTable,
  Modal,
  FormLayout,
  TextField,
  ButtonGroup,
} from "@shopify/polaris";
import { PlusIcon, EditIcon, DuplicateIcon, DeleteIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { BundleSetupInstructions } from "../components/BundleSetupInstructions";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Get discount function bundles only
  const discountFunctionBundles = await db.bundle.findMany({
    where: { 
      shopId: session.shop,
      bundleType: "discount_function",
    },
    include: {
      steps: true,
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    bundles: discountFunctionBundles,
    bundleType: "discount_function",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle different actions
  if (intent === "cloneBundle") {
    const bundleId = formData.get("bundleId") as string;
    
    try {
      // Get the original bundle with all its relations
      const originalBundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: shop },
        include: {
          steps: {
            include: {
              StepProduct: true,
            }
          },
          pricing: true,
        }
      });

      if (!originalBundle) {
        return json({ error: 'Bundle not found' }, { status: 404 });
      }

      const clonedBundleName = `${originalBundle.name} (Copy)`;
      
      // Clone the bundle
      const clonedBundle = await db.bundle.create({
        data: {
          name: clonedBundleName,
          description: originalBundle.description,
          shopId: shop,
          bundleType: "discount_function",
          status: "draft",
          settings: originalBundle.settings,
          matching: originalBundle.matching,
        },
      });

      // Clone steps if they exist
      if (originalBundle.steps && originalBundle.steps.length > 0) {
        for (const step of originalBundle.steps) {
          const clonedStep = await db.bundleStep.create({
            data: {
              bundleId: clonedBundle.id,
              name: step.name,
              pageTitle: step.pageTitle,
              minimumProducts: step.minimumProducts,
              maximumProducts: step.maximumProducts,
              allowDuplicates: step.allowDuplicates,
              products: step.products,
              collections: step.collections,
            },
          });

          // Clone step products if they exist
          if (step.StepProduct && step.StepProduct.length > 0) {
            for (const stepProduct of step.StepProduct) {
              await db.stepProduct.create({
                data: {
                  stepId: clonedStep.id,
                  id: stepProduct.id,
                  title: stepProduct.title,
                  handle: stepProduct.handle,
                  images: stepProduct.images,
                  variants: stepProduct.variants,
                  vendor: stepProduct.vendor,
                  productType: stepProduct.productType,
                },
              });
            }
          }
        }
      }

      // Clone pricing if it exists
      if (originalBundle.pricing) {
        await db.bundlePricing.create({
          data: {
            bundleId: clonedBundle.id,
            enableDiscount: originalBundle.pricing.enableDiscount,
            discountMethod: originalBundle.pricing.discountMethod,
            rules: originalBundle.pricing.rules,
            messages: originalBundle.pricing.messages,
          },
        });
      }

      return json({ 
        success: true, 
        message: 'Bundle cloned successfully',
        bundleId: clonedBundle.id 
      });

    } catch (error) {
      console.error("Error cloning bundle:", error);
      return json({ error: 'Failed to clone bundle' }, { status: 500 });
    }
  }

  if (intent === "deleteBundle") {
    const bundleId = formData.get("bundleId") as string;
    
    try {
      // Get the bundle to find the associated Shopify product
      const bundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: shop },
      });

      if (!bundle) {
        return json({ error: 'Bundle not found' }, { status: 404 });
      }

      // Delete the bundle from database (cascade will handle related records)
      await db.bundle.delete({
        where: { id: bundleId, shopId: shop },
      });

      return json({ 
        success: true, 
        message: 'Bundle deleted successfully' 
      });

    } catch (error) {
      console.error("Error deleting bundle:", error);
      return json({ error: 'Failed to delete bundle' }, { status: 500 });
    }
  }

  // Original create bundle logic
  if (intent === "createBundle") {
    const bundleName = formData.get("bundleName");
    const description = formData.get("description");

    if (typeof bundleName !== 'string' || bundleName.length === 0) {
      return json({ success: false, error: 'Bundle name is required' }, { status: 400 });
    }

    try {
      const newBundle = await db.bundle.create({
        data: {
          name: bundleName,
          description: typeof description === 'string' ? description : null,
          shopId: shop,
          bundleType: "discount_function",
          status: "draft",
        },
      });

      return json({ 
        success: true, 
        redirectTo: `/app/bundles/discount-functions/configure/${newBundle.id}`,
        message: "Discount function bundle created successfully"
      });

    } catch (error) {
      console.error("Error creating discount function bundle:", error);
      return json({ success: false, error: 'Failed to create discount function bundle' }, { status: 500 });
    }
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
}

export default function DiscountFunctionBundles() {
  const { bundles } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const fetcher = useFetcher();
  
  // If we're on a nested route (like configure), render the outlet
  const isNestedRoute = location.pathname.includes('/configure/');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [description, setDescription] = useState("");
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  const isSubmitting = navigation.state === "submitting";

  // Handle successful bundle creation
  useEffect(() => {
    if (actionData?.success && actionData?.redirectTo) {
      setModalOpen(false);
      setBundleName("");
      setDescription("");
      navigate(actionData.redirectTo);
    }
  }, [actionData, navigate]);
  
  // Handle successful clone/delete operations
  useEffect(() => {
    if (actionData?.success && actionData?.message) {
      // Show success message for clone/delete operations
      console.log(actionData.message);
    }
  }, [actionData]);

  const handleCreateBundle = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setBundleName("");
    setDescription("");
  }, []);

  const handleEditBundle = (bundleId: string) => {
    navigate(`/app/bundles/discount-functions/configure/${bundleId}`);
  };

  const handleCloneBundle = useCallback((bundleId: string) => {
    if (confirm("Are you sure you want to clone this bundle?")) {
      const formData = new FormData();
      formData.append("intent", "cloneBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  }, [fetcher]);

  const handleDeleteBundle = useCallback((bundleId: string) => {
    if (confirm("Are you sure you want to delete this bundle? This action cannot be undone.")) {
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  }, [fetcher]);

  const bundleRows = bundles.map((bundle) => [
    bundle.name,
    <Badge tone={bundle.status === "active" ? "success" : "subdued"} key={`status-${bundle.id}`}>
      {bundle.status}
    </Badge>,
    bundle.steps.length,
    bundle.pricing?.enableDiscount ? "Enabled" : "Disabled",
    bundle.createdAt ? new Date(bundle.createdAt).toLocaleDateString() : "",
    <ButtonGroup key={`actions-${bundle.id}`}>
      <Button 
        size="micro"
        variant="plain" 
        icon={EditIcon}
        onClick={() => handleEditBundle(bundle.id)}
      >
        Edit
      </Button>
      <Button 
        size="micro"
        variant="plain" 
        icon={DuplicateIcon}
        onClick={() => handleCloneBundle(bundle.id)}
      >
        Clone
      </Button>
      <Button 
        size="micro"
        variant="plain" 
        tone="critical"
        icon={DeleteIcon}
        onClick={() => handleDeleteBundle(bundle.id)}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  // If on a nested route, render the nested component
  if (isNestedRoute) {
    return <Outlet />;
  }

  return (
    <>
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Create Discount Function Bundle"
        primaryAction={{
          content: "Create Bundle",
          onAction: () => submitButtonRef.current?.click(),
          disabled: !bundleName.trim(),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCloseModal,
          },
        ]}
      >
        <Modal.Section>
          <Form method="post">
            <FormLayout>
              <TextField
                label="Bundle name"
                helpText="Choose a descriptive name for your discount function bundle"
                name="bundleName"
                value={bundleName}
                onChange={setBundleName}
                autoComplete="off"
                requiredIndicator
              />
              <TextField
                label="Description"
                helpText="Optional: Add more details about what this bundle offers"
                name="description"
                value={description}
                onChange={setDescription}
                multiline={3}
                autoComplete="off"
              />
              <input type="hidden" name="intent" value="createBundle" />
              <button
                ref={submitButtonRef}
                type="submit"
                style={{ display: "none" }}
                aria-hidden="true"
              />
            </FormLayout>
          </Form>
        </Modal.Section>
      </Modal>

      <Page 
      title="Discount Function Bundles"
      subtitle="Manage bundles that use automatic discount functions"
      primaryAction={{
        content: "Create Discount Function Bundle",
        icon: PlusIcon,
        onAction: handleCreateBundle,
      }}
      secondaryActions={[
        {
          content: "Back to Bundle Types",
          onAction: () => navigate("/app/bundle-type-selection"),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200" align="space-between">
                <Text variant="headingSm" as="h3">
                  Active Discount Function Bundles
                </Text>
                <Badge tone="success">Discount Function Mode</Badge>
              </InlineStack>
              
              {bundles.length === 0 ? (
                <EmptyState
                  heading="Create your first discount function bundle"
                  action={{
                    content: "Create Discount Function Bundle",
                    onAction: handleCreateBundle,
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text variant="bodyMd" tone="subdued">
                    Discount function bundles apply automatic discounts when bundle 
                    conditions are met. Compatible with all Shopify plans.
                  </Text>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "numeric", "text", "text", "text"]}
                  headings={["Bundle Name", "Status", "Steps", "Discount", "Created", "Actions"]}
                  rows={bundleRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <InlineStack gap="400" align="start" blockAlign="start">
            {/* Discount Function Bundle Setup Instructions */}
            <div style={{ flex: '1' }}>
              <BundleSetupInstructions
                title="Discount Function Bundle Setup"
                subtitle="Follow these steps to create your discount function bundle"
                bundlesExist={bundles.length > 0}
                steps={[
                  {
                    id: "create_bundle",
                    title: 'Click "Create Discount Function Bundle"',
                    description: "Start by clicking the create button above",
                    isClickable: true,
                    onClick: handleCreateBundle,
                  },
                  {
                    id: "name_description",
                    title: "Enter bundle name and description",
                    description: "Give your bundle a descriptive name and optional description",
                  },
                  {
                    id: "create_bundle_modal",
                    title: 'Click "Create Bundle" in modal',
                    description: "This will create the bundle and navigate to configuration",
                  },
                  {
                    id: "select_scope",
                    title: "Select bundle scope and add products",
                    description: "Choose products/collections that qualify for the bundle discount",
                    isClickable: bundles.length > 0,
                    onClick: () => bundles.length > 0 && navigate(`/app/bundles/discount-functions/configure/${bundles[0].id}`),
                  },
                  {
                    id: "setup_pricing",
                    title: "Configure discount rules and pricing",
                    description: "Set up automatic discount conditions and amounts",
                    isClickable: bundles.length > 0,
                    onClick: () => bundles.length > 0 && navigate(`/app/bundles/discount-functions/configure/${bundles[0].id}`),
                  },
                  {
                    id: "publish",
                    title: "Save and publish your bundle",
                    description: "Save your changes and publish to activate discount function",
                    isClickable: bundles.length > 0,
                    onClick: () => bundles.length > 0 && navigate(`/app/bundles/discount-functions/configure/${bundles[0].id}`),
                  },
                ]}
              />
            </div>

            {/* Discount Function Bundle Features */}
            <div style={{ flex: '1' }}>
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h4">
                    Discount Function Features
                  </Text>
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p">
                      <strong>Automatic Discounts:</strong> Discounts are applied automatically 
                      when customers meet bundle requirements.
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Multiple Discount Types:</strong> Support for fixed amount discounts, 
                      percentage discounts, and free shipping offers.
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Universal Compatibility:</strong> Works on all Shopify plans 
                      without requiring Shopify Plus.
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Flexible Conditions:</strong> Set minimum quantities and 
                      customize discount rules for different bundle scenarios.
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
    </>
  );
}