import { useEffect } from "react";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
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
  Image,
  ButtonGroup,
  Divider,
  Tooltip,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  EditIcon,
  DuplicateIcon,
  DeleteIcon,
  ViewIcon,
} from "@shopify/polaris-icons";
import db from "../db.server"; // Import db
import type { action as bundlesAction } from "./app.bundles.$bundleId"; // Import the action from bundleId route

// Define a type for the bundle, matching Prisma's Bundle model
interface Bundle {
  id: string;
  name: string;
  status: string;
  active: boolean;
  publishedAt: string | null;
  matching: string | null; // Add matching property to Bundle type
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch all bundles for the current shop
  const bundles = await db.bundle.findMany({
    where: {
      shopId: shop,
    },
  });

  return { bundles };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "cloneBundle") {
    const bundleIdToClone = formData.get("bundleId") as string;

    if (typeof bundleIdToClone !== "string" || bundleIdToClone.length === 0) {
      return json(
        { error: "Bundle ID is required for cloning" },
        { status: 400 },
      );
    }

    try {
      const originalBundle = await db.bundle.findUnique({
        where: { id: bundleIdToClone },
        include: { steps: true, pricing: true },
      });

      if (!originalBundle) {
        return json({ error: "Original bundle not found" }, { status: 404 });
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
          settings: originalBundle.settings,
          matching: originalBundle.matching, // Copy matching data as is
        },
      });

      // Clone steps
      for (const step of originalBundle.steps) {
        await db.bundleStep.create({
          data: {
            bundleId: newBundle.id,
            name: step.name,
            products: step.products,
            collections: step.collections,
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
            rules: originalBundle.pricing.rules,
            showFooter: originalBundle.pricing.showFooter,
            showBar: originalBundle.pricing.showBar,
            messages: originalBundle.pricing.messages,
            published: false, // Cloned pricing starts as unpublished
          },
        });
      }

      // No need to update shop metafield for cloned bundle immediately,
      // as it's a draft. It will be updated when published.

      return json({ success: true, bundle: newBundle, intent: intent });
    } catch (error) {
      console.error("Error cloning bundle:", error);
      return json({ error: "Failed to clone bundle" }, { status: 500 });
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
  const { bundles } = useLoaderData<typeof loader>(); // Get bundles from loader data
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
        shopify.toast.show("Bundle deleted successfully!");
      } else if (data.error) {
        shopify.toast.show(`Error deleting bundle: ${data.error}`, {
          isError: true,
        });
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
        shopify.toast.show("All bundles metafield cleared successfully!");
      } else if (data.error) {
        shopify.toast.show(`Error clearing metafield: ${data.error}`, {
          isError: true,
        });
      }
    }

    // Handle success/error messages from cloneFetcher and product creation
    if (fetcher.data) {
      const data = fetcher.data as {
        success?: boolean;
        error?: string;
        intent?: string;
        bundle?: Bundle;
        product?: any;
      };
      if (data.intent === "cloneBundle") {
        if (data.success) {
          shopify.toast.show("Bundle cloned successfully!");
          // navigate to refresh the list if needed, or rely on Remix revalidation
        } else if (data.error) {
          shopify.toast.show(`Error cloning bundle: ${data.error}`, {
            isError: true,
          });
        }
      } else if (data.product) {
        // Check if it's the product creation action
        const prodId = data.product.id.replace("gid://shopify/Product/", "");
        if (prodId) {
          shopify.toast.show("Product created");
        }
      }
    }
  }, [shopify, deleteFetcher.data, clearMetafieldFetcher.data, fetcher.data]);
  // const generateProduct = () => fetcher.submit({}, { method: "POST" });

  const handleDeleteBundle = (bundleId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this bundle? This action cannot be undone.",
      )
    ) {
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleId);
      deleteFetcher.submit(formData, {
        method: "post",
        action: `/app/bundles/${bundleId}`,
      });
    }
  };

  const handleCloneBundle = (bundle: Bundle) => {
    if (
      confirm(`Are you sure you want to clone the bundle "${bundle.name}"?`)
    ) {
      const formData = new FormData();
      formData.append("intent", "cloneBundle");
      formData.append("bundleId", bundle.id);
      fetcher.submit(formData, { method: "post" }); // Use fetcher to submit to current route's action
    }
  };

  const handleViewBundle = (bundle: Bundle) => {
    if (bundle.matching) {
      try {
        const parsedMatching = JSON.parse(bundle.matching);
        const selectedProducts =
          parsedMatching.selectedVisibilityProducts as Array<{
            id: string;
            handle: string;
          }>;
        if (selectedProducts && selectedProducts.length > 0) {
          const firstProductHandle = selectedProducts[0].handle;
          if (firstProductHandle) {
            // Construct the URL to the product page
            window.open(`/products/${firstProductHandle}`, "_blank");
            return;
          }
        }
      } catch (e) {
        console.error("Error parsing bundle matching data:", e);
      }
    }
    shopify.toast.show(
      "No product found to view for this bundle or matching data is incomplete.",
      { isError: true },
    );
  };

  const handleClearAllBundlesMetafield = () => {
    if (
      confirm(
        "Are you sure you want to clear ALL bundle data from your store? This action cannot be undone.",
      )
    ) {
      const formData = new FormData();
      formData.append("intent", "clearAllBundlesMetafield");
      // A dummy bundleId is needed for the action route, though it's not used by the intent itself
      clearMetafieldFetcher.submit(formData, {
        method: "post",
        action: `/app/bundles/dummy-id`,
      });
    }
  };

  return (
    <Page>
      <TitleBar title="Your Bundles">
        <button
          variant="primary"
          onClick={() => navigate("/app/bundles/create")}
        >
          Create Bundle
        </button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          {bundles.length === 0 ? (
            /* Show setup content if no bundles exist */
            <Layout.Section>
              <Card>
                <BlockStack gap="500" inlineAlign="center" align="center">
                  <Box
                    minHeight="6rem"
                    minWidth="6rem"
                    background="bg-fill-info-secondary"
                    borderRadius="full"
                  >
                    <EditIcon width="3rem" height="3rem" color="base" />
                  </Box>
                  <BlockStack gap="200" inlineAlign="center">
                    <Text as="h2" variant="headingMd">
                      Setup your bundles quickly
                    </Text>
                    <Text variant="bodyMd" as="p" alignment="center">
                      Get your bundles up and running in 2 easy steps!
                    </Text>
                  </BlockStack>
                  <Button
                    size="large"
                    variant="primary"
                    onClick={() => navigate("/app/bundles/create")}
                  >
                    Quick Setup
                  </Button>
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
                              background={
                                bundle.publishedAt
                                  ? "bg-fill-success"
                                  : "bg-fill-warning"
                              }
                            />
                            <Text as="h3" variant="headingMd">
                              {bundle.name}
                            </Text>
                          </InlineStack>
                          <ButtonGroup variant="segmented">
                            <Tooltip content="Edit">
                              <Button
                                icon={EditIcon}
                                onClick={() =>
                                  navigate(`/app/bundles/${bundle.id}`)
                                }
                              />
                            </Tooltip>
                            <Tooltip content="Clone">
                              <Button
                                icon={DuplicateIcon}
                                onClick={() => handleCloneBundle(bundle)}
                              />
                            </Tooltip>
                            <Tooltip content="Delete">
                              <Button
                                icon={DeleteIcon}
                                onClick={() => handleDeleteBundle(bundle.id)}
                              />
                            </Tooltip>
                            <Tooltip content="View">
                              <Button
                                icon={ViewIcon}
                                onClick={() => handleViewBundle(bundle)}
                              />
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
            <div
              style={{
                display: "flex",
                gap: "var(--p-space-500)",
                alignItems: "stretch",
                width: "100%",
              }}
            >
              {/* Design services */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Card>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minHeight: "266px", // Set minimum height to ensure equal card heights
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <BlockStack gap="200" inlineAlign="start">
                        <BlockStack gap="200">
                          <Text as="h2" variant="headingMd">
                            Design services
                          </Text>
                          <Text variant="bodyMd" as="p">
                            Transform the bundle builder for your store using
                            our expert bundle design services
                          </Text>
                          <List>
                            <List.Item>
                              A fixed price of $100 (one-time cost) for any
                              advanced CSS customization.
                            </List.Item>
                            <List.Item>
                              No hidden charges, ensuring transparency.
                            </List.Item>
                            <List.Item>
                              Professional bundle design services available.
                            </List.Item>
                          </List>
                        </BlockStack>
                      </BlockStack>
                    </div>
                    <Box paddingBlockStart="400">
                      <ButtonGroup>
                        <Button>Get a quote</Button>
                        <Button
                          tone="critical"
                          onClick={handleClearAllBundlesMetafield}
                        >
                          Clear All Bundles Metafield
                        </Button>
                      </ButtonGroup>
                    </Box>
                  </div>
                </Card>
              </div>

              {/* Your account manager */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Card>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minHeight: "266px", // Set minimum height to ensure equal card heights
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <BlockStack gap="200" inlineAlign="start">
                        <BlockStack gap="200">
                          <Text as="h2" variant="headingMd">
                            Your account manager
                          </Text>
                          <InlineStack gap="200" blockAlign="center">
                            <Box
                              minHeight="6rem"
                              minWidth="6rem"
                              borderRadius="full"
                            >
                              <Image
                                source="/yash-logo.png"
                                alt="Account manager profile picture"
                                width={96}
                                height={96}
                                key="yash-profile-image"
                              />
                            </Box>
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingMd">
                                Yash{" "}
                                <Text
                                  as="span"
                                  variant="bodyXs"
                                  tone="subdued"
                                  fontWeight="regular"
                                >
                                  founder
                                </Text>
                              </Text>
                              <Text variant="bodyMd" as="p">
                                Stuck? Reach out to your Account Manager!
                              </Text>
                              <Box paddingBlockStart="100">
                                <Text variant="bodyMd" as="p" tone="subdued">
                                  Get personalized help with your bundle setup
                                  and optimization.
                                </Text>
                              </Box>
                            </BlockStack>
                          </InlineStack>
                        </BlockStack>
                      </BlockStack>
                    </div>
                    <Box paddingBlockStart="400">
                      <Button
                        onClick={() =>
                          window.open(
                            "https://tidycal.com/yashwolfpack/15-minute-meeting",
                            "_blank",
                          )
                        }
                      >
                        Schedule Meeting
                      </Button>
                    </Box>
                  </div>
                </Card>
              </div>
            </div>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
