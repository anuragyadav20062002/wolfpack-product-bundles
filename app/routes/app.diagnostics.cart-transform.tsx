import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Divider,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { CartTransformService } from "../services/cart-transform-service.server";

interface CartTransformStatus {
  isActivated: boolean;
  cartTransformId?: string;
  functionId: string;
  error?: string;
  existingTransforms?: any[];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  let status: CartTransformStatus = {
    isActivated: false,
    functionId: process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID || "527a500e-5386-4a67-a61b-9cb4cb8973f8"
  };

  try {
    // Check existing cart transforms
    const CHECK_EXISTING_QUERY = `
      query CheckExistingCartTransform {
        cartTransforms(first: 10) {
          edges {
            node {
              id
              functionId
            }
          }
        }
      }
    `;

    const response = await admin.graphql(CHECK_EXISTING_QUERY);
    const data = await response.json() as any;

    if (data.errors) {
      status.error = `GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`;
    } else {
      status.existingTransforms = data.data.cartTransforms.edges;
      
      // Check if our function is already activated
      const ourTransform = data.data.cartTransforms.edges.find(
        (edge: any) => edge.node.functionId === status.functionId
      );
      
      if (ourTransform) {
        status.isActivated = true;
        status.cartTransformId = ourTransform.node.id;
      }
    }
  } catch (error) {
    status.error = error instanceof Error ? error.message : 'Unknown error checking cart transforms';
  }

  return json({ 
    status,
    shop: session.shop,
    timestamp: new Date().toISOString()
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "activate") {
    try {
      console.log(`🔧 [DIAGNOSTICS] Manually activating cart transform for shop: ${session.shop}`);
      
      const result = await CartTransformService.completeSetup(admin, session.shop);
      
      if (result.success) {
        return json({ 
          success: true, 
          message: "Cart transform activated successfully!",
          cartTransformId: result.cartTransformId,
          alreadyExists: result.alreadyExists
        });
      } else {
        return json({ 
          success: false, 
          error: result.error || "Failed to activate cart transform"
        });
      }
    } catch (error) {
      console.error("❌ [DIAGNOSTICS] Error during manual activation:", error);
      return json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error during activation"
      }, { status: 500 });
    }
  }

  if (intent === "test_logs") {
    try {
      console.log("🔍 [DIAGNOSTICS] Testing cart transform function logs...");
      console.log("🔍 [DIAGNOSTICS] Function ID:", process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID);
      console.log("🔍 [DIAGNOSTICS] Shop Domain:", session.shop);
      console.log("🔍 [DIAGNOSTICS] Timestamp:", new Date().toISOString());
      
      return json({ 
        success: true, 
        message: "Test logs sent - check your development console for diagnostic information"
      });
    } catch (error) {
      return json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error during log test"
      }, { status: 500 });
    }
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
};

export default function CartTransformDiagnostics() {
  const { status, shop, timestamp } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const handleActivate = () => {
    const formData = new FormData();
    formData.append("intent", "activate");
    fetcher.submit(formData, { method: "post" });
  };

  const handleTestLogs = () => {
    const formData = new FormData();
    formData.append("intent", "test_logs");
    fetcher.submit(formData, { method: "post" });
  };

  const isLoading = fetcher.state !== "idle";

  return (
    <Page 
      title="Cart Transform Diagnostics"
      subtitle="Debug and verify cart transform activation status"
      backAction={{ content: "Back to Dashboard", url: "/app" }}
    >
      <Layout>
        <Layout.Section>
          {(() => {
            if (fetcher.data && typeof fetcher.data === 'object' && 'success' in fetcher.data && fetcher.data.success === false) {
              return (
                <Banner tone="critical" title="Error">
                  <Text as="p">{String('error' in fetcher.data ? fetcher.data.error : 'Unknown error')}</Text>
                </Banner>
              );
            }
            return null;
          })()}
          
          {(() => {
            if (fetcher.data && typeof fetcher.data === 'object' && 'success' in fetcher.data && fetcher.data.success === true) {
              return (
                <Banner tone="success" title="Success">
                  <Text as="p">{String('message' in fetcher.data ? fetcher.data.message : 'Success')}</Text>
                  {(() => {
                    if (typeof fetcher.data === 'object' && 'cartTransformId' in fetcher.data && fetcher.data.cartTransformId) {
                      return <Text as="p">Cart Transform ID: {String(fetcher.data.cartTransformId)}</Text>;
                    }
                    return null;
                  })()}
                </Banner>
              );
            }
            return null;
          })()}

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Current Status</Text>
              
              <InlineStack gap="300" align="space-between">
                <Text as="p" variant="bodyMd">Shop Domain:</Text>
                <Text as="p" variant="bodyMd" fontWeight="semibold">{shop}</Text>
              </InlineStack>

              <InlineStack gap="300" align="space-between">
                <Text as="p" variant="bodyMd">Function ID:</Text>
                <Text as="p" variant="bodyMd" fontWeight="medium">{status.functionId}</Text>
              </InlineStack>

              <InlineStack gap="300" align="space-between">
                <Text as="p" variant="bodyMd">Activation Status:</Text>
                <Badge tone={status.isActivated ? "success" : "critical"}>
                  {status.isActivated ? "ACTIVATED" : "NOT ACTIVATED"}
                </Badge>
              </InlineStack>

              {status.cartTransformId && (
                <InlineStack gap="300" align="space-between">
                  <Text as="p" variant="bodyMd">Cart Transform ID:</Text>
                  <Text as="p" variant="bodyMd" fontWeight="medium">{status.cartTransformId}</Text>
                </InlineStack>
              )}

              <InlineStack gap="300" align="space-between">
                <Text as="p" variant="bodyMd">Last Checked:</Text>
                <Text as="p" variant="bodyMd">{new Date(timestamp).toLocaleString()}</Text>
              </InlineStack>

              {status.error && (
                <>
                  <Divider />
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" tone="critical" fontWeight="semibold">Error Details:</Text>
                    <Text as="p" variant="bodyMd" tone="critical">{status.error}</Text>
                  </BlockStack>
                </>
              )}

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">Actions</Text>
                
                <InlineStack gap="200">
                  <Button 
                    variant="primary"
                    loading={isLoading && fetcher.formData?.get("intent") === "activate"}
                    onClick={handleActivate}
                    disabled={isLoading}
                  >
                    {status.isActivated ? "Re-activate" : "Activate"} Cart Transform
                  </Button>
                  
                  <Button 
                    loading={isLoading && fetcher.formData?.get("intent") === "test_logs"}
                    onClick={handleTestLogs}
                    disabled={isLoading}
                  >
                    Test Debug Logs
                  </Button>
                  
                  <Button 
                    url="/app/diagnostics/cart-transform"
                    disabled={isLoading}
                  >
                    Refresh Status
                  </Button>
                </InlineStack>
              </BlockStack>

              {status.existingTransforms && status.existingTransforms.length > 0 && (
                <>
                  <Divider />
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">All Cart Transforms ({status.existingTransforms.length})</Text>
                    {status.existingTransforms.map((transform: any, index: number) => (
                      <Card key={index} background="bg-surface-secondary">
                        <BlockStack gap="200">
                          <InlineStack gap="300" align="space-between">
                            <Text as="p" variant="bodyMd">Transform ID:</Text>
                            <Text as="p" variant="bodyMd" fontWeight="medium">{transform.node.id}</Text>
                          </InlineStack>
                          <InlineStack gap="300" align="space-between">
                            <Text as="p" variant="bodyMd">Function ID:</Text>
                            <Text as="p" variant="bodyMd" fontWeight="medium">{transform.node.functionId}</Text>
                          </InlineStack>
                          <InlineStack gap="300" align="space-between">
                            <Text as="p" variant="bodyMd">Is Our Function:</Text>
                            <Badge tone={transform.node.functionId === status.functionId ? "success" : "info"}>
                              {transform.node.functionId === status.functionId ? "YES" : "NO"}
                            </Badge>
                          </InlineStack>
                        </BlockStack>
                      </Card>
                    ))}
                  </BlockStack>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Debug Information</Text>
              
              <Text as="p" variant="bodyMd" tone="subdued">
                This diagnostic page helps you verify that the cart transform function is properly 
                activated for automatic bundle merging and discount application.
              </Text>

              <BlockStack gap="200">
                <Text as="p" variant="bodySm" fontWeight="semibold">Expected Behavior:</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  • Cart transform should auto-activate during app installation
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  • Bundle products should merge in cart automatically
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  • Debug logs should appear in development console
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  • No manual activation should be required for users
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="p" variant="bodySm" fontWeight="semibold">Troubleshooting:</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  1. Check if cart transform is activated above
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  2. Test debug logs to verify function deployment
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  3. Manually activate if needed (temporary fix)
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  4. Check bundle configuration has proper metafields
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}