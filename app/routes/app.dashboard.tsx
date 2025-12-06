import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useNavigate, useLoaderData, Form, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  ButtonGroup,
  Badge,
  DataTable,
  Modal,
  FormLayout,
  TextField,
} from "@shopify/polaris";
import { PlusIcon, EditIcon, DuplicateIcon, DeleteIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppLogger } from "../lib/logger";
import { MetafieldCleanupService } from "../services/metafield-cleanup.server";
import { SubscriptionGuard } from "../services/subscription-guard.server";
import { BillingService } from "../services/billing.server";
import { useState, useCallback, useRef, useEffect } from "react";
import { BundleSetupInstructions } from "../components/BundleSetupInstructions";
import { UpgradePromptBanner } from "../components/UpgradePromptBanner";

// Define a type for the bundle
interface Bundle {
  id: string;
  name: string;
  description?: string | null;
  shopId: string;
  shopifyProductId?: string | null;
  bundleType: 'product_page' | 'full_page';
  status: 'draft' | 'active' | 'archived';
  active: boolean;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  steps: any[];
  pricing?: any;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get active and draft bundles for the shop (exclude archived/deleted)
  const bundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      status: {
        in: ['active', 'draft']
      }
    },
    include: {
      steps: {
        include: {
          StepProduct: true
        }
      },
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get subscription info for upgrade prompt
  const subscriptionInfo = await BillingService.getSubscriptionInfo(session.shop);

  return json({
    bundles,
    shop: session.shop,
    subscription: subscriptionInfo ? {
      plan: subscriptionInfo.plan,
      currentBundleCount: subscriptionInfo.currentBundleCount,
      bundleLimit: subscriptionInfo.bundleLimit,
      canCreateBundle: subscriptionInfo.canCreateBundle,
    } : null,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Clone bundle
  if (intent === "cloneBundle") {
    const limitCheck = await SubscriptionGuard.enforceBundleLimit(session.shop);
    if (limitCheck) {
      return limitCheck;
    }

    const bundleId = formData.get("bundleId") as string;

    try {
      const originalBundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: session.shop },
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
        AppLogger.error("Product creation failed", { component: "app.dashboard", operation: "clone-bundle" }, { errors: productData.data.productCreate.userErrors });
        return json({ error: 'Failed to create bundle product in Shopify' }, { status: 500 });
      }

      const shopifyProductId = productData.data?.productCreate?.product?.id;

      // Clone the bundle
      const clonedBundle = await db.bundle.create({
        data: {
          name: clonedBundleName,
          description: originalBundle.description,
          shopId: session.shop,
          bundleType: 'product_page',
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
          },
        });
      }

      return json({
        success: true,
        message: 'Bundle cloned successfully',
        bundleId: clonedBundle.id
      });

    } catch (error) {
      AppLogger.error("Failed to clone bundle", { component: "app.dashboard", operation: "clone-bundle" }, error);
      return json({ error: 'Failed to clone bundle' }, { status: 500 });
    }
  }

  // Delete bundle
  if (intent === "deleteBundle") {
    const bundleId = formData.get("bundleId") as string;

    try {
      const bundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: session.shop },
        include: {
          steps: {
            include: {
              StepProduct: true
            }
          }
        }
      });

      if (!bundle) {
        return json({ success: false, error: "Bundle not found" }, { status: 404 });
      }

      // Collect component product IDs for metafield cleanup
      const componentProductIds = Array.from(new Set(
        bundle.steps
          .flatMap(step => step.StepProduct || [])
          .map(sp => sp.productId)
          .filter(Boolean)
      ));

      // Clean up metafields and set product to draft
      if (bundle.shopifyProductId) {
        await MetafieldCleanupService.updateShopMetafieldsAfterDeletion(admin, bundleId);

        try {
          const UPDATE_PRODUCT_STATUS = `
            mutation UpdateProductStatus($id: ID!) {
              productUpdate(input: {id: $id, status: DRAFT}) {
                product {
                  id
                  status
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          await admin.graphql(UPDATE_PRODUCT_STATUS, {
            variables: { id: bundle.shopifyProductId }
          });
        } catch (productError) {
          AppLogger.error("Error updating Shopify product status",
            { component: "app.dashboard", operation: "delete-bundle" },
            productError);
        }
      }

      // Delete the bundle from database (cascade will handle related records)
      await db.bundle.delete({
        where: { id: bundleId, shopId: session.shop },
      });

      AppLogger.info("Bundle deleted successfully",
        { component: "app.dashboard", operation: "delete-bundle", bundleId });

      return json({ success: true, message: "Bundle deleted successfully" });
    } catch (error) {
      AppLogger.error("Failed to delete bundle", { component: "app.dashboard", operation: "delete-bundle" }, error);
      return json({ success: false, error: "Failed to delete bundle" }, { status: 500 });
    }
  }

  // Create new bundle
  const limitCheck = await SubscriptionGuard.enforceBundleLimit(session.shop);
  if (limitCheck) {
    return limitCheck;
  }

  const bundleName = formData.get("bundleName");
  const description = formData.get("description");

  if (typeof bundleName !== 'string' || bundleName.length === 0) {
    return json({ error: 'Bundle name is required' }, { status: 400 });
  }

  try {
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

    const productInput: any = {
      title: bundleName,
      descriptionHtml: description || `<h2>${bundleName}</h2><p>${description || 'Complete bundle package with curated products.'}</p><p>Build your perfect bundle by selecting from our hand-picked collection of products.</p>`,
      productType: "Bundle",
      vendor: "Bundle Builder",
      status: "ACTIVE",
      tags: ["bundle", "cart-transform"],
    };

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
      AppLogger.error("Product creation failed", { component: "app.dashboard", operation: "create-bundle" }, { errors });
      return json({ error: `Shopify API error: ${errorMessages}` }, { status: 500 });
    }

    const shopifyProductId = productData.data?.productCreate?.product?.id;

    if (!shopifyProductId) {
      AppLogger.error("No product ID returned from Shopify", { component: "app.dashboard", operation: "create-bundle" });
      return json({ error: 'Failed to get product ID from Shopify' }, { status: 500 });
    }

    const newBundle = await db.bundle.create({
      data: {
        name: bundleName,
        description: typeof description === 'string' ? description : null,
        shopId: session.shop,
        bundleType: 'product_page',
        status: 'draft',
        active: false,
        shopifyProductId: shopifyProductId,
      },
    });

    return json({
      success: true,
      bundleId: newBundle.id,
      bundleProductId: shopifyProductId,
      redirectTo: `/app/bundles/cart-transform/configure/${newBundle.id}`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    AppLogger.error("Failed to create bundle", { component: "app.dashboard", operation: "create-bundle" }, error);
    return json({ error: `Failed to create bundle: ${errorMessage}` }, { status: 500 });
  }
};

export default function Dashboard() {
  const { bundles, subscription } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  // Modal state for creating bundle
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

  const handleCreateBundle = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setBundleName("");
    setDescription("");
  }, []);

  const handleSubmit = useCallback(() => {
    if (submitButtonRef.current) {
      submitButtonRef.current.click();
    }
  }, []);

  const handleDirectChat = () => {
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
    }
  };

  const handleEditBundle = (bundle: Bundle) => {
    navigate(`/app/bundles/cart-transform/configure/${bundle.id}`);
  };

  const handleCloneBundle = useCallback((bundleId: string) => {
    if (confirm("Are you sure you want to clone this bundle?")) {
      const formData = new FormData();
      formData.append("intent", "cloneBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  }, [fetcher]);

  const handleDeleteBundle = (bundleId: string) => {
    if (confirm("⚠️ PERMANENTLY DELETE this bundle?\n\nThis action CANNOT be undone!\n\nThis will delete:\n• Bundle configuration & all steps\n• All discount rules\n• Component associations\n\nThis will NOT delete:\n• The Shopify product (delete manually if needed)\n• Analytics data")) {
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "active":
        return <Badge tone="success">active</Badge>;
      case "draft":
        return <Badge tone="info">draft</Badge>;
      case "archived":
        return <Badge tone="critical">archived</Badge>;
      default:
        return <Badge tone="info">{status}</Badge>;
    }
  };

  const bundleRows = bundles.map((bundle) => [
    bundle.name,
    getStatusDisplay(bundle.status),
    bundle.pricing?.enabled ? "Enabled" : "Disabled",
    <ButtonGroup key={bundle.id}>
      <Button
        size="micro"
        icon={EditIcon}
        onClick={() => handleEditBundle(bundle)}
      >
        Edit
      </Button>
      <Button
        size="micro"
        icon={DuplicateIcon}
        onClick={() => handleCloneBundle(bundle.id)}
      >
        Clone
      </Button>
      <Button
        size="micro"
        tone="critical"
        icon={DeleteIcon}
        onClick={() => handleDeleteBundle(bundle.id)}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <>
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Create New Bundle"
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
        title="Welcome to Wolfpack: Product Bundles"
        subtitle="Upgrade your store for maximum earning potential"
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
              <BlockStack gap="400">
                <InlineStack gap="200" align="space-between">
                  <Text variant="headingSm" as="h3">
                    Your Bundles
                  </Text>
                  <InlineStack gap="200">
                    <Button
                      variant="primary"
                      icon={PlusIcon}
                      onClick={handleCreateBundle}
                    >
                      Create Bundle
                    </Button>
                  </InlineStack>
                </InlineStack>

                {bundles.length === 0 ? (
                  <Card>
                    <BlockStack gap="400" align="center" inlineAlign="center">
                      <BlockStack gap="200" align="center" inlineAlign="center">
                        <Text variant="headingLg" as="h2" alignment="center">
                          Create your first bundle
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                          Our bundles provide real-time cart updates and merge
                          bundle items into a single cart line with automatic price adjustments.
                        </Text>
                      </BlockStack>
                      <Button variant="primary" size="large" onClick={handleCreateBundle}>
                        Create Bundle
                      </Button>
                    </BlockStack>
                  </Card>
                ) : (
                  <div style={{ width: '100%' }}>
                    <style>{`
                      .Polaris-DataTable__Table {
                        width: 100%;
                        table-layout: fixed;
                      }
                      .Polaris-DataTable__Cell {
                        width: 25%;
                      }
                    `}</style>
                    <DataTable
                      columnContentTypes={["text", "text", "text", "text"]}
                      headings={["Bundle Name", "Status", "Discount", "Actions"]}
                      rows={bundleRows}
                    />
                  </div>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Bottom section with setup instructions and account manager */}
          <Layout.Section>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
              {/* Cart Transform Bundle Setup Instructions */}
              <div style={{ flex: '1' }}>
                <BundleSetupInstructions
                  title="Bundle Setup Steps"
                  subtitle="Follow these steps to create your bundle"
                  bundlesExist={bundles.length > 0}
                  steps={[
                    {
                      id: "create_bundle",
                      title: 'Click "Create Bundle"',
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

              {/* Your Account Manager Card */}
              <div style={{ flex: '1' }}>
                <Card>
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '320px', position: 'relative' }}>
                    {/* Header with gradient background */}
                    <div style={{
                      padding: '1rem 1.5rem',
                      background: 'linear-gradient(135deg, #006fbb 0%, #004d87 100%)',
                      borderRadius: '8px 8px 0 0',
                      marginBottom: '1rem'
                    }}>
                      <Text variant="headingSm" as="h4" tone="text-inverse">
                        Your Account Manager
                      </Text>
                    </div>

                    {/* Content area */}
                    <div style={{ padding: '0 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <InlineStack gap="400" align="start" blockAlign="start">
                        <div style={{ position: 'relative', minWidth: '120px' }}>
                          <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                            <img
                              src="/shrey_pfp.jpg"
                              alt="Shrey (Founder)"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          {/* Online status indicator */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-3px',
                            right: '-3px',
                            width: '18px',
                            height: '18px',
                            backgroundColor: '#00A047',
                            borderRadius: '50%',
                            border: '3px solid white',
                            zIndex: 10
                          }} />
                        </div>

                        <BlockStack gap="200" align="start">
                          <BlockStack gap="100">
                            <Text as="h4" variant="bodyLg" fontWeight="semibold">
                              Shrey
                            </Text>
                            <Text as="span" variant="bodySm" tone="subdued">
                              Founder
                            </Text>
                          </BlockStack>

                          {/* Services offered with icons */}
                          <BlockStack gap="150">
                            <InlineStack gap="200" align="start">
                              <div style={{ width: '16px', height: '16px', backgroundColor: '#006fbb', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }} />
                              <Text as="span" variant="bodySm">
                                Bundle setup & publishing
                              </Text>
                            </InlineStack>
                            <InlineStack gap="200" align="start">
                              <div style={{ width: '16px', height: '16px', backgroundColor: '#006fbb', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }} />
                              <Text as="span" variant="bodySm">
                                Custom design & styling
                              </Text>
                            </InlineStack>
                            <InlineStack gap="200" align="start">
                              <div style={{ width: '16px', height: '16px', backgroundColor: '#006fbb', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }} />
                              <Text as="span" variant="bodySm">
                                Technical support
                              </Text>
                            </InlineStack>
                          </BlockStack>
                        </BlockStack>
                      </InlineStack>
                    </div>

                    {/* CTA Section */}
                    <div style={{ padding: '1.5rem', marginTop: 'auto' }}>
                      <InlineStack gap="300" align="center">
                        <div style={{ flex: 1 }}>
                          <Text as="span" variant="bodySm" tone="subdued">
                            Available Mon-Fri • Responds within 1hr
                          </Text>
                        </div>
                      </InlineStack>
                      <div style={{ marginTop: '12px' }}>
                        <Button variant="primary" fullWidth onClick={handleDirectChat}>
                          Chat Directly with Shrey
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Layout.Section>

          {/* Demo Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text variant="headingSm" as="h4">
                  Your bundles appear as products in your store, but they automatically sync with your existing inventory — no duplicate stock tracking needed!
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
                    alt="Bundle Demo"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}
