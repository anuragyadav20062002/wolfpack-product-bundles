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
import { CartIcon, PageIcon } from "@shopify/polaris-icons";
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

  const handleFullPageSelection = () => {
    navigate("/app/bundles/full-page");
  };

  return (
    <Page
      title="Choose Your Bundle Type"
      subtitle="Select the type of bundle you want to create"
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

            <Layout.Section variant="oneThird">
              {/* Full-Page Bundles Card */}
              <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="space-between">
                  <InlineStack gap="200" align="start">
                    <Icon source={PageIcon} tone="success" />
                    <Text variant="headingMd" as="h3">
                      Full-Page Bundles
                    </Text>
                  </InlineStack>
                  <Badge tone="success">All Plans</Badge>
                </InlineStack>

                <BlockStack gap="300">
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Dedicated bundle builder pages with category tabs,
                    allowing customers to build custom bundles from multiple product categories.
                  </Text>

                  <BlockStack gap="200">
                    <Text variant="bodySm" fontWeight="semibold" as="p">Features:</Text>
                    <ul style={{ paddingLeft: '16px', margin: 0 }}>
                      <li><Text variant="bodySm" as="span">Dedicated bundle pages</Text></li>
                      <li><Text variant="bodySm" as="span">Category-based navigation</Text></li>
                      <li><Text variant="bodySm" as="span">Real-time bundle preview</Text></li>
                      <li><Text variant="bodySm" as="span">Customizable layouts</Text></li>
                      <li><Text variant="bodySm" as="span">Flexible discount rules</Text></li>
                    </ul>
                  </BlockStack>

                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={handleFullPageSelection}
                  >
                    Set Up Full-Page Bundles
                  </Button>
                </BlockStack>
              </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneHalf">
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    Which Bundle Type Should You Choose?
                  </Text>

                  <BlockStack gap="300">
                    <div>
                      <Text variant="bodyMd" fontWeight="semibold" as="p">
                        Cart Transform Bundles
                      </Text>
                      <Text variant="bodyMd" as="p">
                        Best for simple, fixed bundles embedded on product pages. Items automatically merge
                        into a single cart line with real-time discount application. Requires Shopify Plus.
                      </Text>
                    </div>

                    <div>
                      <Text variant="bodyMd" fontWeight="semibold" as="p">
                        Full-Page Bundles
                      </Text>
                      <Text variant="bodyMd" as="p">
                        Ideal for customizable bundles with multiple categories. Create dedicated bundle builder
                        pages where customers can mix and match products. Works on all Shopify plans.
                      </Text>
                    </div>

                    <BlockStack gap="200">
                      <Text variant="bodySm" fontWeight="semibold" as="p">Common Benefits:</Text>
                      <ul style={{ paddingLeft: '16px', margin: 0 }}>
                        <li><Text variant="bodySm" as="span">✅ Flexible discount rules</Text></li>
                        <li><Text variant="bodySm" as="span">✅ Cart transform integration</Text></li>
                        <li><Text variant="bodySm" as="span">✅ Clean checkout experience</Text></li>
                        <li><Text variant="bodySm" as="span">✅ Inventory management</Text></li>
                        <li><Text variant="bodySm" as="span">✅ Increased average order value</Text></li>
                      </ul>
                    </BlockStack>

                    {!shopifyPlus && (
                      <Text variant="bodyMd" tone="subdued" as="p">
                        <strong>Note:</strong> Cart transform functionality requires Shopify Plus.
                        Full-Page Bundles are available on all plans.
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