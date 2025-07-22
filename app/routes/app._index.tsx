import { useEffect } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useNavigate, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  InlineStack,
  ButtonGroup,
  Divider,
  Tooltip,
  Avatar,
  Image,
  // Modal,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { EditIcon, DuplicateIcon, DeleteIcon, ViewIcon } from "@shopify/polaris-icons";
import db from "../db.server"; // Import db
import type { action as bundlesAction } from './app.bundles.$bundleId'; // Import the action from bundleId route

// Define a type for the bundle, matching Prisma's Bundle model
interface Bundle {
  id: string;
  name: string;
  status: string;
  active: boolean;
  publishedAt: string | null;
  matching: any; // Change type to any
  settings: any; // Change type to any
  viewUrl?: string; // Add optional viewUrl property
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch all bundles for the current shop
  const bundles = await db.bundle.findMany({
    where: {
      shopId: shop,
    },
  });

  const bundlesWithUrls = await Promise.all(
    bundles.map(async (bundle) => {
      let viewUrl: string | undefined = undefined;
      if (bundle.status === 'active' && bundle.matching) {
        try {
          const matchingData = bundle.matching; // Use bundle.matching directly as it's already JsonValue
          const firstProduct = (matchingData as any).selectedVisibilityProducts?.[0];
          const firstCollection = (matchingData as any).selectedVisibilityCollections?.[0];

          if (firstProduct?.handle) {
            viewUrl = `https://${shop}/products/${firstProduct.handle}`;
          } else if (firstCollection?.id) {
            const response = await admin.graphql(
              `#graphql
              query getCollectionProducts($id: ID!) {
                collection(id: $id) {
                  products(first: 1) {
                    edges {
                      node {
                        handle
                      }
                    }
                  }
                }
              }`,
              {
                variables: {
                  id: firstCollection.id,
                },
              },
            );
            const responseJson = await response.json();
            const firstProductInCollection =
              responseJson.data?.collection?.products?.edges?.[0]?.node;

            if (firstProductInCollection?.handle) {
              viewUrl = `https://${shop}/products/${firstProductInCollection.handle}`;
            }
          }
        } catch (e) {
          console.error(`Failed to process matching for bundle ${bundle.id}`, e);
        }
      }
      return { ...bundle, viewUrl };
    }),
  );

  return json({ bundles: bundlesWithUrls });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "cloneBundle") {
    const bundleIdToClone = formData.get("bundleId") as string;

    if (typeof bundleIdToClone !== 'string' || bundleIdToClone.length === 0) {
      return json({ error: 'Bundle ID is required for cloning' }, { status: 400 });
    }

    try {
      const originalBundle = await db.bundle.findUnique({
        where: { id: bundleIdToClone },
        include: { steps: true, pricing: true },
      });

      if (!originalBundle) {
        return json({ error: 'Original bundle not found' }, { status: 404 });
      }

      // Create new bundle with copied data
      const newBundle = await db.bundle.create({
        data: {
          name: `${originalBundle.name} (Clone)`,
          description: originalBundle.description,
          shopId: originalBundle.shopId,
          status: "draft", // Cloned bundle starts as draft
          active: false,
          publishedAt: null,
          settings: originalBundle.settings as any,
          matching: originalBundle.matching as any, // Copy matching data as is
        },
      });

      // Clone steps
      for (const step of originalBundle.steps) {
        await db.bundleStep.create({
          data: {
            bundleId: newBundle.id,
            name: step.name,
            products: step.products as any,
            collections: step.collections as any,
            displayVariantsAsIndividual: step.displayVariantsAsIndividual,
            conditionType: step.conditionType,
            conditionValue: step.conditionValue,
            icon: step.icon,
            position: step.position,
            minQuantity: step.minQuantity,
            maxQuantity: step.maxQuantity,
            enabled: step.enabled,
            productCategory: step.productCategory,
          },
        });
      }

      // Clone pricing if it exists
      if (originalBundle.pricing) {
        await db.bundlePricing.create({
          data: {
            bundleId: newBundle.id,
            type: originalBundle.pricing.type,
            status: originalBundle.pricing.status,
            rules: originalBundle.pricing.rules as any,
            showFooter: originalBundle.pricing.showFooter,
            showBar: originalBundle.pricing.showBar,
            messages: originalBundle.pricing.messages as any,
            published: false, // Cloned pricing starts as unpublished
          },
        });
      }
      
      // No need to update shop metafield for cloned bundle immediately,
      // as it's a draft. It will be updated when published.

      return json({ success: true, bundle: newBundle, intent: intent });
    } catch (error) {
      console.error("Error cloning bundle:", error);
      return json({ error: 'Failed to clone bundle' }, { status: 500 });
    }
  }
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const { bundles } = useLoaderData<typeof loader>() as { bundles: Bundle[] }; // Get bundles from loader data and cast to Bundle[]
  const fetcher = useFetcher<typeof action>();
  // Explicitly type the fetchers for actions from app.bundles.$bundleId.tsx
  const deleteFetcher = useFetcher<typeof bundlesAction>(); // New fetcher for deletion
  const clearMetafieldFetcher = useFetcher<typeof bundlesAction>(); // New fetcher for clearing all metafields

  const navigate = useNavigate();
 

  const shopify = useAppBridge();
  // const isLoading =
  //   ["loading", "submitting"].includes(fetcher.state) &&
  //   fetcher.formMethod === "POST";

  useEffect(() => {
    // if (productId) {
    //   shopify.toast.show("Product created");
    // }
    // Handle success/error messages from deleteFetcher and clearMetafieldFetcher
    if (deleteFetcher.data) {
      // Use type assertion to tell TypeScript the expected structure
      const data = deleteFetcher.data as {
        success?: boolean; // Optional property
        error?: string;
        intent?: string;
      };

      if (data.success) {
        shopify.toast.show('Bundle deleted successfully!');
      } else if (data.error) {
        shopify.toast.show(`Error deleting bundle: ${data.error}`, { isError: true });
      }
    }

    if (clearMetafieldFetcher.data) {
      // Use type assertion to tell TypeScript the expected structure
      const data = clearMetafieldFetcher.data as {
        success?: boolean; // Optional property
        error?: string;
        intent?: string;
      };

      if (data.success) {
        shopify.toast.show('All bundles metafield cleared successfully!');
      } else if (data.error) {
        shopify.toast.show(`Error clearing metafield: ${data.error}`, { isError: true });
      }
    }

    // Handle success/error messages from cloneFetcher and product creation
    if (fetcher.data && fetcher.state === 'idle') {
      const data = fetcher.data as {
        success?: boolean; // Optional property
        error?: string;
        intent?: string;
        bundle?: Bundle; // Optional property
      };

      if (data.success && data.intent === 'cloneBundle' && data.bundle) {
        shopify.toast.show('Bundle cloned successfully!');
        // Optionally navigate to the new bundle's page
        navigate(`/app/bundles/${data.bundle.id}`);
      } else if (data.error) {
        shopify.toast.show(`Error: ${data.error}`, { isError: true });
      }
    }

  }, [
    fetcher.data,
    fetcher.state,
    deleteFetcher.data,
    clearMetafieldFetcher.data,
    shopify,
    navigate,
  ]);
  // const generateProduct = () => fetcher.submit({}, { method: "POST" });

  const handleDeleteBundle = (bundleId: string) => {
    const confirmation = window.confirm("Are you sure you want to delete this bundle?");
    if (confirmation) {
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleId);
      // Use the appropriate fetcher for the request
      deleteFetcher.submit(formData, { method: "post", action: `/app/bundles/${bundleId}` });
    }
  };

  const handleCloneBundle = (bundle: Bundle) => {
    const formData = new FormData();
    formData.append("intent", "cloneBundle");
    formData.append("bundleId", bundle.id);
    fetcher.submit(formData, { method: "post" });
  };

  const handleViewBundle = (bundle: Bundle) => {
    if (bundle.viewUrl) {
      window.open(bundle.viewUrl, "_blank");
    } else {
      shopify.toast.show("This bundle has no visible products to view.", { isError: true });
    }
  };

  // Function to create a new bundle
  const handleCreateNewBundle = async () => {
    // You can call your API to create a new bundle here
    // For now, let's just navigate to the bundle creation page with a 'new' ID
    navigate('/app/bundles/create');
  };

  // const handleClearAllBundlesMetafield = () => {
  //   const confirmation = window.confirm("Are you sure you want to clear all bundle metafields? This can't be undone.");
  //   if (confirmation) {
  //     const formData = new FormData();
  //     formData.append("intent", "clearAllBundlesMetafield");
  //     clearMetafieldFetcher.submit(formData, { method: "post", action: '/app/clear-metafield' });
  //   }
  // };

  return (
    <Page
      title="Your Bundles"
      primaryAction={{
        content: "Create New Bundle",
        onAction: handleCreateNewBundle,
      }}
    >
      <BlockStack gap="500">
        <Layout>
          {bundles.length === 0 ? (
            /* Show setup content if no bundles exist */
            <Layout.Section>
              <Card>
                <BlockStack gap="500" inlineAlign="center" align="center">
                  <Box
                    minHeight="3rem"
                    minWidth="3rem"
                    background="bg-fill-info-secondary"
                    borderRadius="full"
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      <Image source="/bundle2.png" alt="Bundle Icon" width="100%" height="100%" />
                    </div>
                  </Box>
                  <BlockStack gap="200" inlineAlign="center">
                    <Text as="h2" variant="headingMd">
                      Setup your bundles quickly
                    </Text>
                    <Text variant="bodyMd" as="p" alignment="center">
                      Get your bundles up and running in 2 easy steps!
                    </Text>
                  </BlockStack>
                  <Button size="large" variant="primary" onClick={() => navigate('/app/bundles/create')}>Quick Setup</Button>
                </BlockStack>
              </Card>
            </Layout.Section>
          ) : (
            /* Show list of bundles if bundles exist */
            <Layout.Section>
              <Card>
                <BlockStack gap="0">
                  {bundles.map((bundle: Bundle, index) => (
                    <div key={bundle.id}>
                      <Box padding="400">
                        <InlineStack align="space-between" blockAlign="center">
                          <InlineStack gap="200" blockAlign="center">
                            <Box
                              minWidth="15px"
                              minHeight="15px"
                              borderRadius="full"
                              background={bundle.publishedAt ? "bg-fill-success" : "bg-fill-warning"}
                            />
                            <Text as="h3" variant="headingMd">{bundle.name}</Text>
                          </InlineStack>
                          <ButtonGroup variant="segmented">
                            <Tooltip content="Edit">
                              <Button icon={EditIcon} onClick={() => navigate(`/app/bundles/${bundle.id}`)} />
                            </Tooltip>
                            <Tooltip content="Clone">
                              <Button icon={DuplicateIcon} onClick={() => handleCloneBundle(bundle)} />
                            </Tooltip>
                            <Tooltip content="Delete">
                              <Button icon={DeleteIcon} onClick={() => handleDeleteBundle(bundle.id)} />
                            </Tooltip>
                            <Tooltip content="Please refresh the page after publishing to view the bundle. Sometimes it takes a moment for the system to sync.">
                              <Button icon={ViewIcon} onClick={() => handleViewBundle(bundle)} />
                            </Tooltip>
                          </ButtonGroup>
                        </InlineStack>
                      </Box>
                      {index < bundles.length - 1 && <Divider />} 
                    </div>
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>
          )}

          {/* Design services and Your account manager */}
          <Layout.Section>
            <Layout>
              <Layout.Section variant="oneHalf">
                {/* Design services */}
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      Bundle Setup Instructions
                    </Text>
                    <Text variant="bodyMd" as="p">
                      Follow these steps to set up the best bundle experience for your users
                    </Text>
                    <List>
                      <List.Item>
                        Click on Create New Bundle
                      </List.Item>
                      <List.Item>
                        Name and Description
                      </List.Item>
                      <List.Item>
                        Click on Create Bundle
                      </List.Item>
                      <List.Item>
                        Click on Add Step
                      </List.Item>
                      <List.Item>
                        Add the Products or Collection you want to display in that step
                      </List.Item>
                      <List.Item>
                        Click Publish
                      </List.Item>
                      <List.Item>
                        Preview the bundle
                      </List.Item>
                    </List>
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section variant="oneHalf">
                {/* Your account manager */}
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      Your account manager
                    </Text>
                    <InlineStack gap="200" blockAlign="start">
                      <Avatar
                        source="/yash-logo.png"
                        name="Yash (Founder)"
                        size="xl"
                        initials="YF"
                      />
                      <BlockStack gap="0">
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          Yash (Founder)
                        </Text>
                        <List>
                          <List.Item>
                            For setting up and publishing bundle
                          </List.Item>
                          <List.Item>
                            For customizing the design of the bundle
                          </List.Item>
                        </List>
                        <Button variant="primary"
                          onClick={() => window.open('https://tidycal.com/yashwolfpack/15-minute-meeting', '_blank')}
                        >
                          Schedule Meeting
                        </Button>
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>
          </Layout.Section>
        </Layout>
      </BlockStack>
      {/*
      <Modal
        open={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Confirm Action"
        primaryAction={{
          content: 'Clear All Bundles',
          onAction: handleConfirmClearAllBundlesMetafield,
          tone: 'critical',
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowClearAllModal(false),
          },
        ]}
      >
        <Modal.Section>
          <Text variant="bodyMd" as="p">
            Are you sure you want to clear ALL bundle data from your store? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
      */}
    </Page>
  );
}
