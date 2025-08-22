import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Icon,
} from "@shopify/polaris";
import { CartIcon, DiscountIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  return json({
    shopifyPlus: true, // You can determine this based on shop plan
  });
}

export default function BundleTypeSelection() {
  const { shopifyPlus } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleCartTransformSelection = () => {
    navigate("/app/bundles/cart-transform");
  };

  const handleDiscountFunctionSelection = () => {
    navigate("/app/bundles/discount-functions");
  };

  return (
    <Page 
      title="Choose Your Bundle Type"
      subtitle="Select the bundle implementation that best fits your store's needs"
      secondaryActions={[
        {
          content: "Back to Dashboard",
          onAction: () => navigate("/app/dashboard"),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Layout>
            <Layout.Section variant="oneHalf">
              {/* Cart Transform Bundles Card */}
              <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="space-between">
                  <InlineStack gap="200" align="start">
                    <Icon source={CartIcon} tone="primary" />
                    <Text variant="headingMd" as="h3">
                      Cart Transform Bundles
                    </Text>
                  </InlineStack>
                  {shopifyPlus ? (
                    <Badge tone="success">Shopify Plus</Badge>
                  ) : (
                    <Badge tone="critical">Requires Shopify Plus</Badge>
                  )}
                </InlineStack>
                
                <BlockStack gap="300">
                  <Text variant="bodyMd" tone="subdued">
                    Real-time cart transformation that merges bundle items into 
                    a single cart line with automatic discount pricing.
                  </Text>
                  
                  <BlockStack gap="200">
                    <Text variant="bodySm" fontWeight="semibold">Features:</Text>
                    <ul style={{ paddingLeft: '16px', margin: 0 }}>
                      <li><Text variant="bodySm">Real-time cart updates</Text></li>
                      <li><Text variant="bodySm">Bundle appears as single item</Text></li>
                      <li><Text variant="bodySm">No discount codes needed</Text></li>
                      <li><Text variant="bodySm">Immediate savings visibility</Text></li>
                    </ul>
                  </BlockStack>
                  
                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={handleCartTransformSelection}
                    disabled={!shopifyPlus}
                  >
                    {shopifyPlus ? "Set Up Cart Transform Bundles" : "Upgrade to Shopify Plus"}
                  </Button>
                </BlockStack>
              </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneHalf">
              {/* Discount Function Bundles Card */}
              <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="space-between">
                  <InlineStack gap="200" align="start">
                    <Icon source={DiscountIcon} tone="primary" />
                    <Text variant="headingMd" as="h3">
                      Discount Function Bundles
                    </Text>
                  </InlineStack>
                  <Badge tone="info">All Plans</Badge>
                </InlineStack>
                
                <BlockStack gap="300">
                  <Text variant="bodyMd" tone="subdued">
                    Traditional discount functions that apply automatic discounts 
                    when bundle conditions are met.
                  </Text>
                  
                  <BlockStack gap="200">
                    <Text variant="bodySm" fontWeight="semibold">Features:</Text>
                    <ul style={{ paddingLeft: '16px', margin: 0 }}>
                      <li><Text variant="bodySm">Works on all Shopify plans</Text></li>
                      <li><Text variant="bodySm">Automatic discount application</Text></li>
                      <li><Text variant="bodySm">Fixed amount & percentage discounts</Text></li>
                      <li><Text variant="bodySm">Free shipping options</Text></li>
                    </ul>
                  </BlockStack>
                  
                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={handleDiscountFunctionSelection}
                  >
                    Set Up Discount Function Bundles
                  </Button>
                </BlockStack>
              </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingSm" as="h4">
                Need Help Choosing?
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                <strong>Cart Transform Bundles</strong> provide the best user experience with real-time 
                cart updates but require Shopify Plus.
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                <strong>Discount Function Bundles</strong> are more flexible and work on all Shopify plans, 
                but don't offer the same real-time cart updates.
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                You can switch between bundle types later, but we recommend starting with the 
                implementation that best matches your current Shopify plan.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}