import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
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
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { EditIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
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
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();
  // const isLoading =
  //   ["loading", "submitting"].includes(fetcher.state) &&
  //   fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  // const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      <TitleBar title="Your Bundles">
        <Button variant="primary" onClick={() => {}}>
          Create Bundle
        </Button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          {/* Setup your bundles quickly */}
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
                <Button size="large" variant="primary">Quick Setup</Button>
              </BlockStack>
            </Card>
          </Layout.Section>

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
                  <Button>Get a quote</Button>
                </Card>
              </Layout.Section>

              <Layout.Section variant="oneHalf">
                {/* Your account manager */}
                <Card>
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
                        <Text as="h3" variant="headingSm">
                          Yash
                        </Text>
                        <Text variant="bodyMd" as="p">
                          Stuck? Reach out to your Account Manager!
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                  <Button>Schedule Meeting</Button>
                </Card>
              </Layout.Section>
            </Layout>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
