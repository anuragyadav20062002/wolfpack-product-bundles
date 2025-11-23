import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
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
import { AppLogger } from "../lib/logger";
import { MetafieldCleanupService } from "../services/metafield-cleanup.server";
import { useState, useCallback, useRef, useEffect } from "react";
import { BundleSetupInstructions } from "../components/BundleSetupInstructions";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Get all bundles (exclude archived)
  const cartTransformBundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      // Note: bundleType filter removed - showing all bundle display types
      status: {
        in: ['active', 'draft'] // Only show active and draft bundles, exclude archived
      }
    },
    include: {
      steps: true,
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    bundles: cartTransformBundles,
    bundleType: "product_page", // Default display mode
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
            tags: ["bundle", "cart-transform"],
            variants: [
              {
                price: "0.00",
                inventoryPolicy: "DENY",
                inventoryManagement: null,
                requiresShipping: true,
                taxable: true,
                weight: 0,
                weightUnit: "POUNDS"
              }
            ]
          }
        }
      });

      const productData = await productResponse.json();

      if (productData.data?.productCreate?.userErrors?.length > 0) {
        AppLogger.error("Product creation failed", { component: "app.bundles.cart-transform", operation: "clone-bundle" }, { errors: productData.data.productCreate.userErrors });
        return json({ error: 'Failed to create bundle product in Shopify' }, { status: 500 });
      }

      const shopifyProductId = productData.data?.productCreate?.product?.id;

      // Clone the bundle
      const clonedBundle = await db.bundle.create({
        data: {
          name: clonedBundleName,
          description: originalBundle.description,
          shopId: shop,
          bundleType: 'product_page', // Default to product-page bundle
          status: 'draft',
          active: false,
          shopifyProductId: shopifyProductId,
          templateName: originalBundle.templateName,
          settings: originalBundle.settings as any,
          matching: originalBundle.matching as any,
        },
      });

      // Clone steps if they exist
      if (originalBundle.steps && originalBundle.steps.length > 0) {
        for (const step of originalBundle.steps) {
          const clonedStep = await db.bundleStep.create({
            data: {
              bundleId: clonedBundle.id,
              name: step.name,
              products: step.products || [],
              collections: step.collections || [],
              displayVariantsAsIndividual: step.displayVariantsAsIndividual,
              icon: step.icon,
              position: step.position,
              minQuantity: step.minQuantity,
              maxQuantity: step.maxQuantity,
              enabled: step.enabled,
              productCategory: step.productCategory,
              conditionType: step.conditionType,
              conditionOperator: step.conditionOperator,
              conditionValue: step.conditionValue,
            },
          });

          // Clone step products if they exist
          if (step.StepProduct && step.StepProduct.length > 0) {
            for (const stepProduct of step.StepProduct) {
              await db.stepProduct.create({
                data: {
                  stepId: clonedStep.id,
                  productId: stepProduct.productId,
                  title: stepProduct.title,
                  variants: stepProduct.variants || [],
                  imageUrl: stepProduct.imageUrl,
                  minQuantity: stepProduct.minQuantity,
                  maxQuantity: stepProduct.maxQuantity,
                  position: stepProduct.position,
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
            enabled: originalBundle.pricing.enabled,
            method: originalBundle.pricing.method,
            rules: originalBundle.pricing.rules || [],
            messages: originalBundle.pricing.messages || [],
            showFooter: originalBundle.pricing.showFooter,
            showProgressBar: originalBundle.pricing.showProgressBar,
            // Don't clone: discountId (Shopify ID), published (should start unpublished)
          },
        });
      }

      return json({ 
        success: true, 
        message: 'Bundle cloned successfully',
        bundleId: clonedBundle.id 
      });

    } catch (error) {
      AppLogger.error("Failed to clone bundle", { component: "app.bundles.cart-transform", operation: "clone-bundle" }, error);
      return json({ error: 'Failed to clone bundle' }, { status: 500 });
    }
  }

  if (intent === "deleteBundle") {
    const bundleId = formData.get("bundleId") as string;

    try {
      // Get bundle data before deletion (needed for metafield cleanup)
      const bundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: shop },
        include: {
          steps: {
            include: {
              StepProduct: true
            }
          }
        }
      });

      if (!bundle) {
        return json({ error: 'Bundle not found' }, { status: 404 });
      }

      // Collect component product IDs for metafield cleanup
      const componentProductIds = Array.from(new Set(
        bundle.steps
          .flatMap(step => step.StepProduct || [])
          .map(sp => sp.productId)
          .filter(Boolean)
      ));

      // Clean up metafields BEFORE deleting from database
      if (bundle.shopifyProductId) {
        await MetafieldCleanupService.cleanupBundleMetafields(
          admin,
          bundleId,
          bundle.shopifyProductId,
          componentProductIds
        );
      }

      // Delete the bundle from database (cascade will handle related records)
      await db.bundle.delete({
        where: { id: bundleId, shopId: shop },
      });

      AppLogger.info("Bundle deleted successfully",
        { component: "app.bundles.cart-transform", operation: "delete-bundle", bundleId });

      return json({
        success: true,
        message: 'Bundle deleted successfully'
      });

    } catch (error) {
      AppLogger.error("Failed to delete bundle", { component: "app.bundles.cart-transform", operation: "delete-bundle" }, error);
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
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Get app URL for default bundle image
    const appUrl = process.env.SHOPIFY_APP_URL || `https://${shop}`;
    const defaultBundleImageUrl = `${appUrl}/bundle.png`;

    const productResponse = await admin.graphql(CREATE_BUNDLE_PRODUCT, {
      variables: {
        input: {
          title: bundleName,
          descriptionHtml: description || `<h2>${bundleName}</h2><p>${description || 'Complete bundle package with curated products.'}</p><p>Build your perfect bundle by selecting from our hand-picked collection of products.</p>`,
          productType: "Bundle",
          vendor: "Bundle Builder",
          status: "ACTIVE",
          tags: ["bundle", "cart-transform"],
          images: [
            {
              src: defaultBundleImageUrl,
              altText: `${bundleName} - Bundle`
            }
          ]
        }
      }
    });

    const productData = await productResponse.json();

    if (productData.data?.productCreate?.userErrors?.length > 0) {
      AppLogger.error("Product creation failed", { component: "app.bundles.cart-transform", operation: "create-bundle" }, { errors: productData.data.productCreate.userErrors });
      return json({ error: 'Failed to create bundle product in Shopify' }, { status: 500 });
    }

    const shopifyProductId = productData.data?.productCreate?.product?.id;

    if (!shopifyProductId) {
      AppLogger.error("No product ID returned from Shopify", { component: "app.bundles.cart-transform", operation: "create-bundle" });
      return json({ error: 'Failed to get product ID from Shopify' }, { status: 500 });
    }

    // Create bundle in database with linked Shopify product
    const newBundle = await db.bundle.create({
      data: {
        name: bundleName,
        description: typeof description === 'string' ? description : null,
        shopId: shop,
        bundleType: 'product_page', // Default to product-page bundle
        status: 'draft',
        active: false,
        shopifyProductId: shopifyProductId, // Link the Shopify product
      },
    });


    // Return success with the bundle ID to allow client-side navigation
    return json({ 
      success: true, 
      bundleId: newBundle.id,
      bundleProductId: shopifyProductId,
      redirectTo: `/app/bundles/cart-transform/configure/${newBundle.id}`
    });

  } catch (error) {
    AppLogger.error("Failed to create cart transform bundle", { component: "app.bundles.cart-transform", operation: "create-bundle" }, error);
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
    if (actionData && 'success' in actionData && actionData.success && 'redirectTo' in actionData && actionData.redirectTo) {
      setModalOpen(false);
      setBundleName("");
      setDescription("");
      navigate(actionData.redirectTo);
    }
  }, [actionData, navigate]);

  // Handle other action responses
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success && 'message' in actionData && actionData.message) {
      // Show success message for clone/delete operations
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
    if (confirm("⚠️ PERMANENTLY DELETE this bundle?\n\nThis action CANNOT be undone!\n\nThis will delete:\n• Bundle configuration & all steps\n• All discount rules\n• Component associations\n\nThis will NOT delete:\n• The Shopify product (delete manually if needed)\n• Analytics data")) {
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  }, [fetcher]);

  const bundleRows = bundles.map((bundle) => [
    bundle.name,
    <Badge tone={bundle.status === "active" ? "success" : "info"} key={`status-${bundle.id}`}>
      {bundle.status}
    </Badge>,
    bundle.steps.length,
    bundle.pricing?.enabled ? "Enabled" : "Disabled",
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
                error={actionData && 'error' in actionData ? actionData.error : undefined}
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
            content: "Back to Dashboard",
            onAction: () => navigate("/app/dashboard"),
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
                  <Text variant="bodyMd" tone="subdued" as="p">
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
                    description: "Click the \"Create\" button to start making your bundle.",
                    isClickable: true,
                    onClick: handleCreateBundle,
                  },
                  {
                    id: "name_description",
                    title: "Enter bundle name and description",
                    description: "Type a clear name and an optional description for your bundle.",
                    onClick: () =>  {},
                  },
                  {
                    id: "create_bundle_modal",
                    title: 'Click "Create Bundle" in the popup',
                    description: "This will create your bundle and take you to the setup page.",
                    onClick: () =>  {},
                  },
                  {
                    id: "add_steps",
                    title: "Add bundle steps and choose products",
                    description: "Add steps to your bundle, select products/collections you want.",
                    isClickable: bundles.length > 0,
                    onClick: () => bundles.length > 0 && navigate(`/app/bundles/cart-transform/configure/${bundles[0].id}`),
                  },
                  {
                    id: "setup_pricing",
                    title: "Set discount rules and pricing",
                    description: "Choose how discounts and pricing should work for your bundle.",
                    isClickable: bundles.length > 0,
                    onClick: () => bundles.length > 0 && navigate(`/app/bundles/cart-transform/configure/${bundles[0].id}`),
                  },
                  {
                    id: "publish",
                    title: "Save and publish your bundle",
                    description: "Save your settings to make your bundle live on your store.",
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
                  It will create a Parent bundle product in Shopify, but during checkout, it will pull stock from your regular Shopify inventory in real time.

                  </Text>
                  <div style={{
                    border: '2px solid #e1e3e5',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}>
                    <img
                      src="/demo.png"
                      alt="Bundle Cart Transform Demo"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                  </div>
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