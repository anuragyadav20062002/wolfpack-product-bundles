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
  Banner,
  Icon,
  ChoiceList,
} from "@shopify/polaris";
import { PlusIcon, EditIcon, DuplicateIcon, DeleteIcon, AlertCircleIcon, CheckCircleIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppLogger } from "../lib/logger";
import { MetafieldCleanupService } from "../services/metafield-cleanup.server";
import { SubscriptionGuard } from "../services/subscription-guard.server";
import { BillingService } from "../services/billing.server";
import { WidgetInstallationService } from "../services/widget-installation.server";
import { WidgetInstallationFlagsService } from "../services/widget-installation-flags.server";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { BundleSetupInstructions } from "../components/BundleSetupInstructions";
import { UpgradePromptBanner } from "../components/UpgradePromptBanner";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // Get active and draft bundles for the shop (exclude archived/deleted)
  // Only select fields needed for dashboard display to avoid over-fetching
  const bundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      status: {
        in: ['active', 'draft']
      }
    },
    select: {
      id: true,
      name: true,
      status: true,
      bundleType: true,
      createdAt: true,
      pricing: {
        select: {
          enabled: true
        }
      },
      _count: {
        select: {
          steps: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  // Get subscription info for upgrade prompt
  const subscriptionInfo = await BillingService.getSubscriptionInfo(session.shop);

  // Check widget installation status using metafield flags (Built for Shopify compliant!)
  const widgetFlags = await WidgetInstallationFlagsService.getInstallationFlags(admin, session.shop);

  // Get API key for deep linking
  const apiKey = process.env.SHOPIFY_API_KEY || '';

  return json({
    bundles,
    shop: session.shop,
    subscription: subscriptionInfo ? {
      plan: subscriptionInfo.plan,
      currentBundleCount: subscriptionInfo.currentBundleCount,
      bundleLimit: subscriptionInfo.bundleLimit,
      canCreateBundle: subscriptionInfo.canCreateBundle,
    } : null,
    widgetInstallation: {
      productPageInstalled: widgetFlags.productPageWidgetInstalled,
      fullPageInstalled: widgetFlags.fullPageWidgetInstalled,
      showPrompt: !widgetFlags.productPageWidgetInstalled && !widgetFlags.fullPageWidgetInstalled,
    },
    apiKey,
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
            vendor: "Wolfpack: Product Bundles",
            status: "DRAFT",
            tags: ["bundle", "Wolfpack: Product Bundles"],
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

      // Publish to Online Store sales channel
      try {
        // Get Online Store publication ID
        const GET_PUBLICATIONS = `
          query {
            publications(first: 10) {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        `;

        const publicationsResponse = await admin.graphql(GET_PUBLICATIONS);
        const publicationsData = await publicationsResponse.json();

        // Find Online Store publication
        const onlineStorePublication = publicationsData.data?.publications?.edges?.find(
          (edge: any) => edge.node.name === 'Online Store'
        );

        if (onlineStorePublication) {
          const PUBLISH_PRODUCT = `
            mutation publishToOnlineStore($id: ID!, $input: [PublicationInput!]!) {
              publishablePublish(id: $id, input: $input) {
                publishable {
                  availablePublicationsCount {
                    count
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          await admin.graphql(PUBLISH_PRODUCT, {
            variables: {
              id: shopifyProductId,
              input: [
                {
                  publicationId: onlineStorePublication.node.id
                }
              ]
            }
          });

          AppLogger.info('Product published to Online Store', {
            component: 'app.dashboard',
            operation: 'clone-bundle',
            productId: shopifyProductId
          });
        }
      } catch (publishError) {
        AppLogger.error('Failed to publish product to Online Store', {
          component: 'app.dashboard',
          operation: 'clone-bundle'
        }, publishError);
        // Continue even if publishing fails
      }

      // Clone the bundle
      const clonedBundle = await db.bundle.create({
        data: {
          name: clonedBundleName,
          description: originalBundle.description,
          shopId: session.shop,
          bundleType: 'product_page',
          status: 'draft',
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
  const bundleType = (formData.get("bundleType") as string) || 'product_page';

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
      vendor: "Wolfpack: Product Bundles",
      status: "DRAFT",
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

    // Publish to Online Store sales channel
    try {
      // Get Online Store publication ID
      const GET_PUBLICATIONS = `
        query {
          publications(first: 10) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      `;

      const publicationsResponse = await admin.graphql(GET_PUBLICATIONS);
      const publicationsData = await publicationsResponse.json();

      // Find Online Store publication
      const onlineStorePublication = publicationsData.data?.publications?.edges?.find(
        (edge: any) => edge.node.name === 'Online Store'
      );

      if (onlineStorePublication) {
        const PUBLISH_PRODUCT = `
          mutation publishToOnlineStore($id: ID!, $input: [PublicationInput!]!) {
            publishablePublish(id: $id, input: $input) {
              publishable {
                availablePublicationsCount {
                  count
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const publishResponse = await admin.graphql(PUBLISH_PRODUCT, {
          variables: {
            id: shopifyProductId,
            input: [
              {
                publicationId: onlineStorePublication.node.id
              }
            ]
          }
        });

        const publishData = await publishResponse.json();

        if (publishData.data?.publishablePublish?.userErrors?.length > 0) {
          AppLogger.warn('Product publish had errors', {
            component: 'app.dashboard',
            operation: 'create-bundle',
            errors: publishData.data.publishablePublish.userErrors
          });
        } else {
          AppLogger.info('Product published to Online Store', {
            component: 'app.dashboard',
            operation: 'create-bundle',
            productId: shopifyProductId
          });
        }
      }
    } catch (publishError) {
      AppLogger.error('Failed to publish product to Online Store', {
        component: 'app.dashboard',
        operation: 'create-bundle'
      }, publishError);
      // Continue even if publishing fails - user can manually publish later
    }

    // Check if this is the first bundle (for auto-placement)
    const existingBundleCount = await db.bundle.count({
      where: {
        shopId: session.shop,
        status: {
          in: ['active', 'draft']
        }
      }
    });

    const isFirstBundle = existingBundleCount === 0;

    const newBundle = await db.bundle.create({
      data: {
        name: bundleName,
        description: typeof description === 'string' ? description : `${bundleName} - Bundle Product`,
        shopId: session.shop,
        bundleType: bundleType as any, // 'product_page' | 'full_page'
        status: 'draft',
        shopifyProductId: shopifyProductId,
      },
    });

    // Check widget installation status for product bundles (production mode)
    // NO auto-placement - just check and provide guidance
    let widgetCheckResult = null;
    if (isFirstBundle) {
      const apiKey = process.env.SHOPIFY_API_KEY || '';
      AppLogger.info('Checking widget installation for first bundle', {
        component: 'app.dashboard',
        operation: 'create-bundle',
        bundleId: newBundle.id
      });

      widgetCheckResult = await WidgetInstallationService.validateProductBundleWidgetSetup(
        admin,
        session.shop,
        apiKey,
        newBundle.id,
        shopifyProductId
      );

      AppLogger.info('Widget check result', {
        component: 'app.dashboard',
        operation: 'create-bundle',
        widgetInstalled: widgetCheckResult.widgetInstalled,
        requiresOneTimeSetup: widgetCheckResult.requiresOneTimeSetup,
        message: widgetCheckResult.message
      });
    }

    // Build redirect URL based on bundle type
    const routeBase = bundleType === 'full_page' ? 'full-page-bundle' : 'product-page-bundle';
    const redirectUrl = `/app/bundles/${routeBase}/configure/${newBundle.id}`;

    return json({
      success: true,
      bundleId: newBundle.id,
      bundleProductId: shopifyProductId,
      redirectTo: redirectUrl,
      widgetStatus: widgetCheckResult ? {
        checked: true,
        widgetInstalled: widgetCheckResult.widgetInstalled,
        requiresOneTimeSetup: widgetCheckResult.requiresOneTimeSetup,
        message: widgetCheckResult.message,
        installationLink: widgetCheckResult.installationLink,
        productUrl: widgetCheckResult.productUrl
      } : {
        checked: false
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    AppLogger.error("Failed to create bundle", { component: "app.dashboard", operation: "create-bundle" }, error);
    return json({ error: `Failed to create bundle: ${errorMessage}` }, { status: 500 });
  }
};

export default function Dashboard() {
  const { bundles, subscription, widgetInstallation, apiKey } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  // Modal state for creating bundle
  const [modalOpen, setModalOpen] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [description, setDescription] = useState("");
  const [bundleType, setBundleType] = useState<string[]>(["product_page"]);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const isSubmitting = navigation.state === "submitting";

  // Handle successful bundle creation
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success && 'redirectTo' in actionData && actionData.redirectTo) {
      setModalOpen(false);
      setBundleName("");
      setDescription("");
      setBundleType(["product_page"]);
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
    setBundleType(["product_page"]); // Reset to default
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

  const handleEditBundle = (bundle: typeof bundles[number]) => {
    const routeBase = bundle.bundleType === 'full_page' ? 'full-page-bundle' : 'product-page-bundle';
    navigate(`/app/bundles/${routeBase}/configure/${bundle.id}`);
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

  // Memoize bundleRows to prevent unnecessary re-renders
  const bundleRows = useMemo(() => bundles.map((bundle) => [
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
  ]), [bundles, handleCloneBundle]);

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

              {/* Bundle Type Selection */}
              <BlockStack gap="200">
                <style>{`
                  .bundle-type-card {
                    border-radius: 8px;
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                  }
                  .bundle-type-card:hover {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                  }
                  .bundle-thumbnail-link {
                    display: block;
                    position: relative;
                    border-radius: 6px;
                    overflow: hidden;
                    cursor: pointer;
                  }
                  .bundle-thumbnail-img {
                    width: 100%;
                    height: auto;
                    display: block;
                    transition: transform 0.2s ease;
                  }
                  .bundle-thumbnail-link:hover .bundle-thumbnail-img {
                    transform: scale(1.02);
                  }
                  .bundle-play-button {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(0, 0, 0, 0.7);
                    border-radius: 50%;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                  }
                  .bundle-thumbnail-link:hover .bundle-play-button {
                    opacity: 1;
                  }
                `}</style>
                <Text variant="headingSm" as="h4">Bundle Type</Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Click on the thumbnails to watch demo videos
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Product Page Bundle */}
                  <div
                    className="bundle-type-card"
                    onClick={() => setBundleType(['product_page'])}
                    style={{
                      border: bundleType[0] === 'product_page' ? '2px solid #005BD3' : '1px solid #c9cccf',
                      backgroundColor: bundleType[0] === 'product_page' ? '#f6f6f7' : 'white'
                    }}
                  >
                    <BlockStack gap="200">
                      <a
                        href="https://www.loom.com/share/6eda102958f3453f9379ac4c70fcda29"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bundle-thumbnail-link"
                      >
                        <img
                          src="/pdp.jpeg"
                          alt="Product Page Bundle Demo"
                          className="bundle-thumbnail-img"
                        />
                        <div className="bundle-play-button">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                            <path d="M5 3l12 7-12 7V3z" />
                          </svg>
                        </div>
                      </a>
                      <BlockStack gap="100">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          Product Page Bundle
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          Display bundle builder on existing product pages (recommended for most stores)
                        </Text>
                      </BlockStack>
                    </BlockStack>
                  </div>

                  {/* Full Page Bundle */}
                  <div
                    className="bundle-type-card"
                    onClick={() => setBundleType(['full_page'])}
                    style={{
                      border: bundleType[0] === 'full_page' ? '2px solid #005BD3' : '1px solid #c9cccf',
                      backgroundColor: bundleType[0] === 'full_page' ? '#f6f6f7' : 'white'
                    }}
                  >
                    <BlockStack gap="200">
                      <a
                        href="https://www.loom.com/share/dc6b075589df45eead93edaa7acfb08c"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bundle-thumbnail-link"
                      >
                        <img
                          src="/full.jpeg"
                          alt="Full Page Bundle Demo"
                          className="bundle-thumbnail-img"
                        />
                        <div className="bundle-play-button">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                            <path d="M5 3l12 7-12 7V3z" />
                          </svg>
                        </div>
                      </a>
                      <BlockStack gap="100">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          Full Page Bundle
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          Create a dedicated landing page for your bundle with tabs and full customization
                        </Text>
                      </BlockStack>
                    </BlockStack>
                  </div>
                </div>
              </BlockStack>

              {/* Hidden input to pass bundleType to form */}
              <input type="hidden" name="bundleType" value={bundleType[0]} />

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

          {/* Widget Installation Success - Informational Only */}
          {(widgetInstallation?.productPageInstalled || widgetInstallation?.fullPageInstalled) && (
            <Layout.Section>
              <Banner
                title="✅ Bundle Widgets Installed"
                tone="success"
              >
                <BlockStack gap="200">
                  {widgetInstallation.productPageInstalled && (
                    <Text as="p" variant="bodyMd">
                      ✓ Product Page Widget is active
                    </Text>
                  )}
                  {widgetInstallation.fullPageInstalled && (
                    <Text as="p" variant="bodyMd">
                      ✓ Full-Page Widget is active
                    </Text>
                  )}
                  <Text as="p" variant="bodySm" tone="subdued">
                    Edit any bundle to configure display settings.
                  </Text>
                </BlockStack>
              </Banner>
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
                      onClick: () => {
                        if (bundles.length > 0) {
                          const routeBase = bundles[0].bundleType === 'full_page' ? 'full-page-bundle' : 'product-page-bundle';
                          navigate(`/app/bundles/${routeBase}/configure/${bundles[0].id}`);
                        }
                      },
                    },
                    {
                      id: "setup_pricing",
                      title: "Set discount rules and pricing",
                      description: "Choose how discounts and pricing should work for your bundle.",
                      isClickable: bundles.length > 0,
                      onClick: () => {
                        if (bundles.length > 0) {
                          const routeBase = bundles[0].bundleType === 'full_page' ? 'full-page-bundle' : 'product-page-bundle';
                          navigate(`/app/bundles/${routeBase}/configure/${bundles[0].id}`);
                        }
                      },
                    },
                    {
                      id: "publish",
                      title: "Save and publish your bundle",
                      description: "Save your settings to make your bundle live on your store.",
                      isClickable: bundles.length > 0,
                      onClick: () => {
                        if (bundles.length > 0) {
                          const routeBase = bundles[0].bundleType === 'full_page' ? 'full-page-bundle' : 'product-page-bundle';
                          navigate(`/app/bundles/${routeBase}/configure/${bundles[0].id}`);
                        }
                      },
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
