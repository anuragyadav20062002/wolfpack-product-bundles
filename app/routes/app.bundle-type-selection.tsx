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
import { CartIcon } from "@shopify/polaris-icons";
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

  return (
    <Page 
      title="Bundle Setup"
      subtitle="Set up your cart transform bundles for real-time cart updates and discounts"
      primaryAction={{
        content: "Set Up Cart Transform Bundles",
        onAction: handleCartTransformSelection,
        disabled: !shopifyPlus,
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
          <Layout>
            <Layout.Section variant="oneThird">
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
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Real-time cart transformation that merges bundle items into 
                    a single cart line with automatic discount pricing.
                  </Text>
                  
                  <BlockStack gap="200">
                    <Text variant="bodySm" fontWeight="semibold" as="p">Features:</Text>
                    <ul style={{ paddingLeft: '16px', margin: 0 }}>
                      <li><Text variant="bodySm" as="span">Real-time cart updates</Text></li>
                      <li><Text variant="bodySm" as="span">Bundle appears as single item</Text></li>
                      <li><Text variant="bodySm" as="span">Discount pricing applied automatically</Text></li>
                      <li><Text variant="bodySm" as="span">Immediate savings visibility</Text></li>
                      <li><Text variant="bodySm" as="span">Enhanced shopping experience</Text></li>
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
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    Why Cart Transform Bundles?
                  </Text>
                  
                  <BlockStack gap="300">
                    <Text variant="bodyMd" as="p">
                      Cart transform bundles provide the most seamless bundling experience for your customers. 
                      When customers select bundle items, they're automatically combined into a single cart line 
                      with discount pricing applied in real-time.
                    </Text>
                    
                    <Text variant="bodyMd" as="p">
                      This approach eliminates the need for discount codes and provides immediate visual feedback 
                      on savings, leading to higher conversion rates and better customer satisfaction.
                    </Text>
                    
                    <BlockStack gap="200">
                      <Text variant="bodySm" fontWeight="semibold" as="p">Benefits:</Text>
                      <ul style={{ paddingLeft: '16px', margin: 0 }}>
                        <li><Text variant="bodySm" as="span">✅ Real-time cart synchronization</Text></li>
                        <li><Text variant="bodySm" as="span">✅ Automatic discount application</Text></li>
                        <li><Text variant="bodySm" as="span">✅ Clean cart presentation</Text></li>
                        <li><Text variant="bodySm" as="span">✅ Better inventory management</Text></li>
                        <li><Text variant="bodySm" as="span">✅ Enhanced analytics tracking</Text></li>
                      </ul>
                    </BlockStack>
                    
                    {!shopifyPlus && (
                      <Text variant="bodyMd" tone="subdued" as="p">
                        <strong>Note:</strong> Cart transform functionality requires Shopify Plus. 
                        Please upgrade your plan to access this feature.
                      </Text>
                    )}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>
      </Layout>
    </Page>
  );
}