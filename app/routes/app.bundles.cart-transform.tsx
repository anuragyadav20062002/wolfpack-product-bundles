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
import { useState, useCallback, useRef, useEffect } from "react";
import { BundleSetupInstructions } from "../components/BundleSetupInstructions";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Get cart transform bundles only
  const cartTransformBundles = await db.bundle.findMany({
    where: { 
      shopId: session.shop,
      bundleType: "cart_transform",
    },
    include: {
      steps: true,
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    bundles: cartTransformBundles,
    bundleType: "cart_transform",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle different actions
  if (intent === "cloneBundle") {
    const bundleId = formData.get("bundleId") as string;
    
    try {
      // Fetch the original bundle with all related data
      const originalBundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: shop },
        include: { 
          steps: {
            include: {
              StepProduct: true
            }
          }, 
          pricing: true 
        },
      });

      if (!originalBundle) {
        return json({ error: 'Bundle not found' }, { status: 404 });
      }

      // Create new bundle product in Shopify
      const CREATE_BUNDLE_PRODUCT = `
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

      const clonedBundleName = `${originalBundle.name} (Copy)`;
      const productResponse = await admin.graphql(CREATE_BUNDLE_PRODUCT, {
        variables: {
          input: {
            title: clonedBundleName,
            descriptionHtml: originalBundle.description || `${clonedBundleName} - Bundle Product`,
            productType: "Bundle",
            vendor: "Bundle Builder",
            status: "DRAFT",
            tags: ["bundle", "cart-transform"]
          }
        }
      });

      const productData = await productResponse.json();
      
      if (productData.data?.productCreate?.userErrors?.length > 0) {
        console.error("Product creation errors:", productData.data.productCreate.userErrors);
        return json({ error: 'Failed to create bundle product in Shopify' }, { status: 500 });
      }

      const shopifyProductId = productData.data?.productCreate?.product?.id;

      // Clone the bundle
      const clonedBundle = await db.bundle.create({
        data: {
          name: clonedBundleName,
          description: originalBundle.description,
          shopId: shop,
          bundleType: 'cart_transform',
          status: 'draft',
          active: false,
          shopifyProductId: shopifyProductId,
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
              products: step.products,
              collections: step.collections,
              conditions: step.conditions,
              displayVariantsAsIndividual: step.displayVariantsAsIndividual,
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

      // Optionally delete the Shopify product (commented out for safety)
      // You might want to keep the product for reference or delete it
      /*
      if (bundle.shopifyProductId) {
        const DELETE_PRODUCT = `
          mutation DeleteProduct($id: ID!) {
            productDelete(input: {id: $id}) {
              deletedProductId
              userErrors {
                field
                message
              }
            }
          }
        `;
        
        await admin.graphql(DELETE_PRODUCT, {
          variables: {
            id: bundle.shopifyProductId
          }
        });
      }
      */

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
  const bundleName = formData.get("bundleName");
  const description = formData.get("description");

  if (typeof bundleName !== 'string' || bundleName.length === 0) {
    return json({ error: 'Bundle name is required' }, { status: 400 });
  }

  try {
    // Create bundle product in Shopify first
    const CREATE_BUNDLE_PRODUCT = `
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

    const productResponse = await admin.graphql(CREATE_BUNDLE_PRODUCT, {
      variables: {
        input: {
          title: bundleName,
          descriptionHtml: description || `${bundleName} - Bundle Product`,
          productType: "Bundle",
          vendor: "Bundle Builder",
          status: "DRAFT",
          tags: ["bundle", "cart-transform"]
        }
      }
    });

    const productData = await productResponse.json();
    
    if (productData.data?.productCreate?.userErrors?.length > 0) {
      console.error("Product creation errors:", productData.data.productCreate.userErrors);
      return json({ error: 'Failed to create bundle product in Shopify' }, { status: 500 });
    }

    const shopifyProductId = productData.data?.productCreate?.product?.id;
    
    if (!shopifyProductId) {
      console.error("No product ID returned from Shopify");
      return json({ error: 'Failed to get product ID from Shopify' }, { status: 500 });
    }

    // Create bundle in database with linked Shopify product
    const newBundle = await db.bundle.create({
      data: {
        name: bundleName,
        description: typeof description === 'string' ? description : null,
        shopId: shop,
        bundleType: 'cart_transform',
        status: 'draft',
        active: false,
        shopifyProductId: shopifyProductId, // Link the Shopify product
      },
    });

    console.log(`✅ Created bundle product: ${shopifyProductId} for bundle: ${newBundle.id}`);

    // Return success with the bundle ID to allow client-side navigation
    return json({ 
      success: true, 
      bundleId: newBundle.id,
      bundleProductId: shopifyProductId,
      redirectTo: `/app/bundles/cart-transform/configure/${newBundle.id}`
    });

  } catch (error) {
    console.error("Error creating cart transform bundle:", error);
    return json({ error: 'Failed to create cart transform bundle' }, { status: 500 });
  }
}

export default function CartTransformBundles() {
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

  // Handle other action responses
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

  const handleSubmit = useCallback(() => {
    // Trigger the hidden submit button
    if (submitButtonRef.current) {
      submitButtonRef.current.click();
    }
  }, []);

  const handleEditBundle = (bundleId: string) => {
    navigate(`/app/bundles/cart-transform/configure/${bundleId}`);
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
        icon={EditIcon}
        onClick={() => handleEditBundle(bundle.id)}
        accessibilityLabel={`Edit ${bundle.name}`}
      >
        Edit
      </Button>
      <Button 
        size="micro"
        icon={DuplicateIcon}
        onClick={() => handleCloneBundle(bundle.id)}
        accessibilityLabel={`Clone ${bundle.name}`}
      >
        Clone
      </Button>
      <Button 
        size="micro"
        tone="critical"
        icon={DeleteIcon}
        onClick={() => handleDeleteBundle(bundle.id)}
        accessibilityLabel={`Delete ${bundle.name}`}
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
        title="Create Cart Transform Bundle"
        primaryAction={{
          content: "Create Bundle",
          onAction: handleSubmit,
          loading: isSubmitting,
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
                value={bundleName}
                onChange={setBundleName}
                name="bundleName"
                autoComplete="off"
                error={actionData?.error}
                helpText="Choose a descriptive name for your bundle"
                requiredIndicator
              />
              <TextField
                label="Description"
                value={description}
                onChange={setDescription}
                name="description"
                multiline={3}
                autoComplete="off"
                helpText="Optional: Add more details about what this bundle offers"
              />
              {/* Hidden submit button triggered by modal primary action */}
              <button 
                ref={submitButtonRef}
                type="submit" 
                style={{ display: 'none' }}
                aria-hidden="true"
              />
            </FormLayout>
          </Form>
        </Modal.Section>
      </Modal>

      <Page 
        title="Cart Transform Bundles"
        subtitle="Manage bundles that use real-time cart transformation"
        primaryAction={{
          content: "Create Cart Transform Bundle",
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
                  Active Cart Transform Bundles
                </Text>
                <Badge tone="info">Cart Transform Mode</Badge>
              </InlineStack>
              
              {bundles.length === 0 ? (
                <EmptyState
                  heading="Create your first cart transform bundle"
                  action={{
                    content: "Create Cart Transform Bundle",
                    onAction: handleCreateBundle,
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text variant="bodyMd" tone="subdued">
                    Cart transform bundles provide real-time cart updates and merge 
                    bundle items into a single cart line with automatic pricing.
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
            {/* Cart Transform Bundle Setup Instructions */}
            <div style={{ flex: '1' }}>
              <BundleSetupInstructions
                title="Cart Transform Bundle Setup"
                subtitle="Follow these steps to create your cart transform bundle"
                bundlesExist={bundles.length > 0}
                steps={[
                  {
                    id: "create_bundle",
                    title: 'Click "Create Cart Transform Bundle"',
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
                    id: "add_steps",
                    title: "Add bundle steps and select products",
                    description: "Configure your bundle steps and add products/collections",
                    isClickable: bundles.length > 0,
                    onClick: () => bundles.length > 0 && navigate(`/app/bundles/cart-transform/configure/${bundles[0].id}`),
                  },
                  {
                    id: "setup_pricing",
                    title: "Set up discount rules and pricing",
                    description: "Configure discount methods and pricing rules",
                    isClickable: bundles.length > 0,
                    onClick: () => bundles.length > 0 && navigate(`/app/bundles/cart-transform/configure/${bundles[0].id}`),
                  },
                  {
                    id: "publish",
                    title: "Save and publish your bundle",
                    description: "Save your changes and publish to make it live",
                    isClickable: bundles.length > 0,
                    onClick: () => bundles.length > 0 && navigate(`/app/bundles/cart-transform/configure/${bundles[0].id}`),
                  },
                ]}
              />
            </div>

            {/* Cart Transform Bundle Features */}
            <div style={{ flex: '1' }}>
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h4">
                    Cart Transform Features
                  </Text>
                  <BlockStack gap="200">
                    <Text variant="bodyMd">
                      <strong>Real-time Updates:</strong> Bundle items are automatically merged 
                      in the cart as customers add products.
                    </Text>
                    <Text variant="bodyMd">
                      <strong>Single Cart Line:</strong> Multiple bundle components appear as 
                      one item with combined pricing and savings display.
                    </Text>
                    <Text variant="bodyMd">
                      <strong>Immediate Savings:</strong> Customers see discounts applied 
                      instantly without needing discount codes.
                    </Text>
                    <Text variant="bodyMd">
                      <strong>Professional Presentation:</strong> Bundle appears cohesively 
                      with the first product's image and combined title.
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