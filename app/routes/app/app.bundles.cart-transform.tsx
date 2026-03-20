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
  Box,
  Icon,
} from "@shopify/polaris";
import { PlusIcon, EditIcon, DuplicateIcon, DeleteIcon, CheckCircleIcon } from "@shopify/polaris-icons";
import { authenticate } from "../../shopify.server";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { MetafieldCleanupService } from "../../services/metafield-cleanup.server";
import { SubscriptionGuard } from "../../services/subscription-guard.server";
import { BillingService } from "../../services/billing.server";
import { BundleStatus, BundleType } from "../../constants/bundle";
import { useCallback, useRef, useEffect } from "react";
import { BundleSetupInstructions } from "../../components/BundleSetupInstructions";
import { UpgradePromptBanner } from "../../components/UpgradePromptBanner";
import { useCartTransformState } from "../../hooks/useCartTransformState";
import cartTransformStyles from "../../styles/routes/cart-transform.module.css";

/**
 * Add image to a product using productCreateMedia mutation
 * This is the recommended approach for API version 2025-04+
 */
async function addProductImage(admin: any, productId: string, imageUrl: string, altText?: string) {
  const CREATE_MEDIA = `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          alt
          mediaContentType
          status
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(CREATE_MEDIA, {
      variables: {
        productId: productId,
        media: [
          {
            originalSource: imageUrl,
            alt: altText || "Bundle product image",
            mediaContentType: "IMAGE"
          }
        ]
      }
    });

    const data = await response.json();

    if (data.data?.productCreateMedia?.mediaUserErrors?.length > 0) {
      const errors = data.data.productCreateMedia.mediaUserErrors;
      AppLogger.error("Failed to add product image", {
        component: "app.bundles.cart-transform",
        operation: "add-product-image"
      }, { errors, productId, imageUrl });
      return { success: false, errors };
    }

    AppLogger.info("Product image added successfully", {
      component: "app.bundles.cart-transform",
      productId,
      imageUrl
    });

    return { success: true };
  } catch (error) {
    AppLogger.error("Error adding product image", {
      component: "app.bundles.cart-transform",
      operation: "add-product-image"
    }, error);
    return { success: false, error };
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  // Get all bundles (exclude archived)
  const cartTransformBundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      // Note: bundleType filter removed - showing all bundle display types
      status: {
        in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] // Only show active and draft bundles, exclude archived
      }
    },
    include: {
      steps: true,
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get subscription info for upgrade prompt
  const subscriptionInfo = await BillingService.getSubscriptionInfo(session.shop);

  return json({
    bundles: cartTransformBundles,
    subscription: subscriptionInfo ? {
      plan: subscriptionInfo.plan,
      currentBundleCount: subscriptionInfo.currentBundleCount,
      bundleLimit: subscriptionInfo.bundleLimit,
      canCreateBundle: subscriptionInfo.canCreateBundle,
    } : null,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle different actions
  if (intent === "cloneBundle") {
    // Check subscription limits before cloning
    const limitCheck = await SubscriptionGuard.enforceBundleLimit(shop);
    if (limitCheck) {
      return limitCheck; // Return 403 response if limit reached
    }

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

      // Calculate bundle price from component products
      let bundlePrice = "1.00";
      try {
        const { calculateBundlePrice } = await import("../../services/bundles/pricing-calculation.server");
        bundlePrice = await calculateBundlePrice(admin, originalBundle);
      } catch (priceError) {
        AppLogger.warn("Failed to calculate bundle price for clone, using fallback", {
          component: "app.bundles.cart-transform", operation: "clone-bundle"
        }, priceError);
      }

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
                price: bundlePrice,
                inventoryPolicy: "CONTINUE",
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
          bundleType: BundleType.PRODUCT_PAGE, // Default to product-page bundle
          status: BundleStatus.DRAFT,
          shopifyProductId: shopifyProductId,
          templateName: originalBundle.templateName,
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
  // Check subscription limits before creating new bundle
  const limitCheck = await SubscriptionGuard.enforceBundleLimit(shop);
  if (limitCheck) {
    return limitCheck; // Return 403 response if limit reached
  }

  const bundleName = formData.get("bundleName");
  const description = formData.get("description");

  if (typeof bundleName !== 'string' || bundleName.length === 0) {
    return json({ error: 'Bundle name is required' }, { status: 400 });
  }

  try {
    // Create bundle product in Shopify with optional media
    // API 2025-04 uses ProductCreateInput (ProductInput is deprecated)
    const CREATE_BUNDLE_PRODUCT = `
      mutation CreateBundleProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
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

    // Product input for bundle creation
    const productInput: any = {
      title: bundleName,
      descriptionHtml: description || `<h2>${bundleName}</h2><p>${description || 'Complete bundle package with curated products.'}</p><p>Build your perfect bundle by selecting from our hand-picked collection of products.</p>`,
      productType: "Bundle",
      vendor: "Bundle Builder",
      status: "ACTIVE",
      tags: ["bundle", "cart-transform"],
    };

    // Prepare media input if app URL is configured
    const appUrl = process.env.SHOPIFY_APP_URL;
    const mediaInput = appUrl ? [
      {
        originalSource: `${appUrl}/bundle.png`,
        alt: `${bundleName} - Bundle`,
        mediaContentType: "IMAGE"
      }
    ] : undefined;

    const productResponse = await admin.graphql(CREATE_BUNDLE_PRODUCT, {
      variables: {
        product: productInput,
        ...(mediaInput && { media: mediaInput })
      }
    });

    const productData = await productResponse.json();

    if (productData.data?.productCreate?.userErrors?.length > 0) {
      const errors = productData.data.productCreate.userErrors;
      const errorMessages = errors.map((e: any) => e.message).join(', ');
      AppLogger.error("Product creation failed", { component: "app.bundles.cart-transform", operation: "create-bundle" }, { errors });
      return json({ error: `Shopify API error: ${errorMessages}` }, { status: 500 });
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
        description: typeof description === 'string' ? description : `${bundleName} - Bundle Product`,
        shopId: shop,
        bundleType: BundleType.PRODUCT_PAGE, // Default to product-page bundle
        status: BundleStatus.DRAFT,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    AppLogger.error("Failed to create cart transform bundle", { component: "app.bundles.cart-transform", operation: "create-bundle" }, error);
    return json({ error: `Failed to create bundle: ${errorMessage}` }, { status: 500 });
  }
}

export default function CartTransformBundles() {
  const { bundles, subscription } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const fetcher = useFetcher();

  // If we're on a nested route (like configure), render the outlet
  const isNestedRoute = location.pathname.includes('/configure/');

  // Use centralized cart transform state hook
  const cartTransformState = useCartTransformState();
  const {
    modalOpen,
    openModal,
    closeModal,
    bundleName,
    setBundleName,
    description,
    setDescription,
  } = cartTransformState;

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const isSubmitting = navigation.state === "submitting";

  // Handle successful bundle creation
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success && 'redirectTo' in actionData && actionData.redirectTo) {
      closeModal();
      navigate(actionData.redirectTo);
    }
  }, [actionData, navigate, closeModal]);

  // Handle other action responses
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success && 'message' in actionData && actionData.message) {
      // Show success message for clone/delete operations
    }
  }, [actionData]);

  const handleCreateBundle = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleCloseModal = useCallback(() => {
    closeModal();
  }, [closeModal]);

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
    <Badge tone={bundle.status === BundleStatus.ACTIVE ? "success" : "info"} key={`status-${bundle.id}`}>
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
                className={cartTransformStyles.hiddenSubmit}
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
        {/* Upgrade Prompt Banner for Free Users */}
        {subscription && (
          <Layout.Section>
            <UpgradePromptBanner
              plan={subscription.plan}
              currentBundleCount={subscription.currentBundleCount}
              bundleLimit={subscription.bundleLimit}
              canCreateBundle={subscription.canCreateBundle}
            />
          </Layout.Section>
        )}

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
            <div className={cartTransformStyles.flexContainer}>
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
            <div className={cartTransformStyles.flexContainer}>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="100">
                    <Text variant="headingSm" fontWeight="semibold" as="h4">
                      How Cart Transform works
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Creates a parent bundle in your Shopify catalog while pulling real-time stock from your existing component products at checkout — no duplicate inventory tracking needed.
                    </Text>
                  </BlockStack>
                  <BlockStack gap="200">
                    {[
                      "One parent bundle product in your Shopify catalog",
                      "Stock pulled from component products at checkout",
                      "No duplicate inventory tracking required",
                      "Discounts applied automatically at cart level",
                      "Cart transform merges components into the bundle",
                    ].map((feature) => (
                      <InlineStack key={feature} gap="200" blockAlign="center">
                        <Box>
                          <Icon source={CheckCircleIcon} tone="success" />
                        </Box>
                        <Text variant="bodySm" as="span">{feature}</Text>
                      </InlineStack>
                    ))}
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