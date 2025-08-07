import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Banner,
  List,
  BlockStack,
} from "@shopify/polaris";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  try {
    // Check existing automatic discounts
    const response = await admin.graphql(
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

    const data = await response.json();
    
    return json({
      existingDiscounts: data.data?.automaticDiscountNodes?.edges || [],
      functionId: "1a554c48-0d1c-4c77-8971-12152d1613d3"
    });

  } catch (error: any) {
    return json(
      {
        error: error.message || "Failed to check automatic discounts",
      },
      { status: 500 }
    );
  }
}

export default function DiscountsPage() {
  const { existingDiscounts, functionId, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const createDiscounts = () => {
    fetcher.submit({}, { method: "post", action: "/api/create-automatic-discounts" });
  };

  const bundleDiscounts = existingDiscounts.filter((edge: any) => 
    edge.node?.automaticDiscount?.functionId === functionId
  );

  const isCreating = fetcher.state === "submitting";

  return (
    <Page title="Bundle Discount Functions">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingSm">Automatic Discount Status</Text>
              
              {error && (
                <Banner status="critical">
                  <Text>Error: {error}</Text>
                </Banner>
              )}

              {bundleDiscounts.length === 0 ? (
                <Banner status="warning">
                  <BlockStack gap="200">
                    <Text>No automatic discounts found for bundle functions.</Text>
                    <Text>
                      Shopify Functions require automatic discounts to be active. 
                      Click the button below to create them.
                    </Text>
                  </BlockStack>
                </Banner>
              ) : (
                <Banner status="success">
                  <Text>Found {bundleDiscounts.length} active automatic discount(s)</Text>
                </Banner>
              )}

              <Text variant="bodyMd">
                <strong>Function ID:</strong> {functionId}
              </Text>

              {bundleDiscounts.length > 0 && (
                <BlockStack gap="200">
                  <Text variant="headingSm">Active Discounts:</Text>
                  <List>
                    {bundleDiscounts.map((edge: any, index: number) => (
                      <List.Item key={index}>
                        <Text>
                          {edge.node.automaticDiscount.title} - {edge.node.automaticDiscount.status}
                        </Text>
                      </List.Item>
                    ))}
                  </List>
                </BlockStack>
              )}

              <Button
                primary
                loading={isCreating}
                onClick={createDiscounts}
                disabled={bundleDiscounts.length > 0}
              >
                {bundleDiscounts.length > 0 
                  ? "Automatic Discounts Already Created" 
                  : "Create Automatic Discounts"
                }
              </Button>

              {fetcher.data && (
                <Banner status={fetcher.data.success ? "success" : "critical"}>
                  {fetcher.data.success ? (
                    <Text>Automatic discounts created successfully!</Text>
                  ) : (
                    <Text>Error: {fetcher.data.error || "Failed to create discounts"}</Text>
                  )}
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}