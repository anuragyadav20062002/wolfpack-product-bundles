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
  Banner,
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
  matching: string | null; // Add matching property to Bundle type
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
          const matchingData = JSON.parse(bundle.matching);
          const firstProduct = matchingData.selectedVisibilityProducts?.[0];
          const firstCollection = matchingData.selectedVisibilityCollections?.[0];

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

  // Check existing automatic discounts for bundle functions
  const FUNCTION_ID = "1a554c48-0d1c-4c77-8971-12152d1613d3";
  let automaticDiscounts = [];
  try {
    const discountResponse = await admin.graphql(
      `#graphql
      query {
        automaticDiscountNodes(first: 50) {
          edges {
            node {
              id
              automaticDiscount {
                ... on DiscountAutomaticApp {
                  title
                  status
                  createdAt
                  functionId
                  discountId
                }
              }
            }
          }
        }
      }`
    );
    const discountData = await discountResponse.json();
    automaticDiscounts = discountData.data?.automaticDiscountNodes?.edges?.filter((edge: any) =>
      edge.node?.automaticDiscount?.functionId === FUNCTION_ID
    ) || [];
  } catch (error) {
    console.error("Error fetching automatic discounts:", error);
  }

  return json({ 
    bundles: bundlesWithUrls, 
    automaticDiscounts,
    functionId: FUNCTION_ID,
    needsDiscounts: automaticDiscounts.length === 0
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "createAutomaticDiscounts") {
    try {
      const FUNCTION_ID = "1a554c48-0d1c-4c77-8971-12152d1613d3";

      // First check if discounts already exist
      const existingDiscountsResponse = await admin.graphql(
        `#graphql
        query {
          automaticDiscountNodes(first: 50) {
            edges {
              node {
                id
                automaticDiscount {
                  ... on DiscountAutomaticApp {
                    title
                    status
                  }
                }
              }
            }
          }
        }`
      );

      const existingData = await existingDiscountsResponse.json();
      console.log("🔥 Full existing discounts response:", JSON.stringify(existingData, null, 2));
      
      const existingTitles = existingData.data?.automaticDiscountNodes?.edges
        ?.map((edge: any) => edge.node?.automaticDiscount?.title)
        ?.filter(Boolean) || [];

      console.log("🔥 Existing discount titles:", existingTitles);

      // Skip creation if discounts already exist
      const timestamp = new Date().toISOString().slice(0, 19).replace(/T/, ' ').replace(/:/g, '-');
      const cartLinesTitle = "Bundle Discounts - Cart Lines";
      const shippingTitle = "Bundle Discounts - Free Shipping";
      
      // If we need to create new ones, use unique titles
      const uniqueCartLinesTitle = `Bundle Discounts - Cart Lines ${timestamp}`;
      const uniqueShippingTitle = `Bundle Discounts - Free Shipping ${timestamp}`;
      
      console.log("🔥 Checking for cart lines title:", cartLinesTitle, "exists:", existingTitles.includes(cartLinesTitle));
      console.log("🔥 Checking for shipping title:", shippingTitle, "exists:", existingTitles.includes(shippingTitle));
      
      if (existingTitles.includes(cartLinesTitle) && existingTitles.includes(shippingTitle)) {
        console.log("🔥 Both discounts already exist, returning early");
        return json({
          success: true,
          message: "Bundle discounts already exist",
          skipped: true
        });
      }

      let cartLinesData = null;
      let deliveryData = null;

      // Create automatic discount for cart lines (ORDER/PRODUCT discounts) only if it doesn't exist
      if (!existingTitles.includes(cartLinesTitle)) {
        console.log("🔥 Creating cart lines discount:", cartLinesTitle);
        const cartLinesDiscountResponse = await admin.graphql(
          `#graphql
          mutation automaticDiscountCreate($discount: DiscountAutomaticAppInput!) {
            discountAutomaticAppCreate(automaticAppDiscount: $discount) {
              automaticAppDiscount {
                discountId
                title
                status
                createdAt
              }
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              discount: {
                title: uniqueCartLinesTitle,
                functionId: FUNCTION_ID,
                startsAt: new Date().toISOString(),
                discountClasses: ["ORDER", "PRODUCT"],
                combinesWith: {
                  orderDiscounts: false,
                  productDiscounts: false,
                  shippingDiscounts: true
                },
              },
            },
          }
        );
        cartLinesData = await cartLinesDiscountResponse.json();
      } else {
        console.log("🔥 Cart Lines discount already exists, skipping...");
        cartLinesData = { data: { discountAutomaticAppCreate: { userErrors: [] } } };
      }

      // Create automatic discount for delivery options (SHIPPING discounts) only if it doesn't exist
      if (!existingTitles.includes(shippingTitle)) {
        console.log("🔥 Creating shipping discount:", shippingTitle);
        const deliveryDiscountResponse = await admin.graphql(
          `#graphql
          mutation automaticDiscountCreate($discount: DiscountAutomaticAppInput!) {
            discountAutomaticAppCreate(automaticAppDiscount: $discount) {
              automaticAppDiscount {
                discountId
                title
                status
                createdAt
              }
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              discount: {
                title: uniqueShippingTitle,
                functionId: FUNCTION_ID,
                startsAt: new Date().toISOString(),
                discountClasses: ["SHIPPING"],
                combinesWith: {
                  orderDiscounts: true,
                  productDiscounts: true,
                  shippingDiscounts: false
                },
              },
            },
          }
        );
        deliveryData = await deliveryDiscountResponse.json();
      } else {
        console.log("🔥 Shipping discount already exists, skipping...");
        deliveryData = { data: { discountAutomaticAppCreate: { userErrors: [] } } };
      }

      // Check for errors
      const cartLinesErrors = cartLinesData.data?.discountAutomaticAppCreate?.userErrors || [];
      const deliveryErrors = deliveryData.data?.discountAutomaticAppCreate?.userErrors || [];
      const graphqlErrors = [...(cartLinesData.errors || []), ...(deliveryData.errors || [])];

      console.log("🔥 Cart Lines Response:", JSON.stringify(cartLinesData, null, 2));
      console.log("🔥 Delivery Response:", JSON.stringify(deliveryData, null, 2));

      if (cartLinesErrors.length > 0 || deliveryErrors.length > 0 || graphqlErrors.length > 0) {
        const allErrors = [...cartLinesErrors, ...deliveryErrors, ...graphqlErrors];
        console.log("🔥 All Errors:", allErrors);
        
        return json({
          success: false,
          error: `Failed to create automatic discounts: ${allErrors.map((e: any) => e.message || e).join(", ")}`,
          errors: allErrors,
          cartLinesData,
          deliveryData,
        });
      }

      return json({
        success: true,
        message: "Automatic discounts created successfully!",
        cartLinesDiscount: cartLinesData.data?.discountAutomaticAppCreate?.automaticAppDiscount,
        deliveryDiscount: deliveryData.data?.discountAutomaticAppCreate?.automaticAppDiscount,
      });

    } catch (error: any) {
      console.error("Error creating automatic discounts:", error);
      return json(
        {
          success: false,
          error: error.message || "Failed to create automatic discounts",
        },
        { status: 500 }
      );
    }
  }

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
  const { bundles, automaticDiscounts, functionId, needsDiscounts } = useLoaderData<typeof loader>(); // Get bundles from loader data
  const fetcher = useFetcher<typeof action>();
  const discountFetcher = useFetcher<typeof action>();
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

  const handleClearAllBundlesMetafield = () => {
    const confirmation = window.confirm("Are you sure you want to clear all bundle metafields? This can't be undone.");
    if (confirmation) {
      const formData = new FormData();
      formData.append("intent", "clearAllBundlesMetafield");
      clearMetafieldFetcher.submit(formData, { method: "post", action: '/app/clear-metafield' });
    }
  };

  return (
    <Page
      title="Your Bundles"
      primaryAction={{
        content: "Create New Bundle",
        onAction: handleCreateNewBundle,
      }}
      secondaryActions={[
        {
          content: "Clear Rogue Bundles",
          onAction: handleClearAllBundlesMetafield,
          destructive: true,
          helpText: "Use this if you have deleted a bundle from the app but it still appears on your storefront. This cleans up any leftover bundle data."
        },
      ]}
    >
      <BlockStack gap="500">
        {/* Automatic Discount Banner */}
        {needsDiscounts && (
          <Banner
            title="Bundle Discounts Not Active"
            status="warning"
            action={{
              content: "Activate Discounts",
              onAction: () => {
                const formData = new FormData();
                formData.append("intent", "createAutomaticDiscounts");
                discountFetcher.submit(formData, { method: "post" });
              },
              loading: discountFetcher.state === "submitting",
            }}
          >
            <Text>
              Your bundle discounts won't work until you activate the automatic discounts. 
              This is required for Shopify Functions to run.
            </Text>
          </Banner>
        )}

        {!needsDiscounts && automaticDiscounts.length > 0 && (
          <Banner title="Bundle Discounts Active" status="success">
            <Text>
              ✅ {automaticDiscounts.length} automatic discount(s) are active. 
              Your bundle discounts should now work in the cart/checkout!
            </Text>
          </Banner>
        )}

        {discountFetcher.data && (
          <Banner 
            title={discountFetcher.data.success ? "Success!" : "Error"} 
            status={discountFetcher.data.success ? "success" : "critical"}
          >
            <Text>
              {discountFetcher.data.success 
                ? discountFetcher.data.message 
                : discountFetcher.data.error
              }
            </Text>
          </Banner>
        )}

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
                            <Tooltip content="View">
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
                      Design services
                    </Text>
                    <Text variant="bodyMd" as="p">
                      Transform the bundle builder for your store using our
                      expert bundle design services
                    </Text>
                    <List>
                      <List.Item>
                        A fixed price of $100 (one-time cost) for any advanced
                        CSS customization.
                      </List.Item>
                      <List.Item>
                        No hidden charges, ensuring transparency.
                      </List.Item>
                      <List.Item>
                        Professional bundle design services available.
                      </List.Item>
                    </List>
                  </BlockStack>
                  <ButtonGroup>
                    <Button>Get a quote</Button>
                  </ButtonGroup>
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
                      <BlockStack gap="100">
                        <InlineStack gap="100" blockAlign="center">
                            <Box
                              minWidth="10px"
                              minHeight="10px"
                              borderRadius="full"
                              background="bg-fill-success"
                            />
                            <Text as="h3" variant="headingMd">
                              Yash (Founder)
                            </Text>
                        </InlineStack>
                        <Text variant="bodyMd" as="p">
                          Stuck? Reach out to your Account Manager!
                        </Text>
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
