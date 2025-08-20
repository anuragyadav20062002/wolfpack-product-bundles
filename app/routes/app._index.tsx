import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { PlusIcon, CartIcon } from "@shopify/polaris-icons";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  return json({
    message: "Welcome to Bundle Builder",
  });
}

export default function Index() {
  const navigate = useNavigate();

  const handleStartJourney = () => {
    navigate("/app/dashboard");
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <BlockStack gap="1200">
            <BlockStack gap="1200" />
            <BlockStack gap="1200" />
            <BlockStack gap="1200" />
            <BlockStack gap="1200" />
            <BlockStack gap="1200" />
            <BlockStack gap="1200" />
            <BlockStack gap="1200" />
            <InlineStack align="center">
              <div style={{ width: '100%', maxWidth: '700px' }}>
                <Card padding="800">
                  <BlockStack gap="600" align="center">
                    <BlockStack gap="400" align="center">
                      <Icon source={CartIcon} tone="primary" />
                      <BlockStack gap="200" align="center">
                        <Text variant="displayMd" as="h1" alignment="center">
                          Welcome to Wolfpack: Product Bundles
                        </Text>
                        <Text variant="bodyLg" tone="subdued" alignment="center">
                          Create powerful product bundles that increase your average order value 
                          and provide exceptional customer experiences.
                        </Text>
                      </BlockStack>
                    </BlockStack>
                    
                    <BlockStack gap="400" align="center">
                      <Button 
                        variant="primary" 
                        size="large"
                        onClick={handleStartJourney}
                      >
                        Start My Bundling Journey
                      </Button>
                      
                      <Text variant="bodySm" tone="subdued" alignment="center">
                        Set up your first bundle in just a few minutes
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </Card>
              </div>
            </InlineStack>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}