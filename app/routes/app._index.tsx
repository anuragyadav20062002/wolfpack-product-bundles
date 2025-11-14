import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Icon,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { CartIcon } from "@shopify/polaris-icons";
import { AppLogger } from "../lib/logger";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  // Sync app URL to shop metafield for theme extension access
  const appUrl = process.env.SHOPIFY_APP_URL;

  if (appUrl) {
    try {
      // Get shop GID
      const GET_SHOP_ID = `
        query getShopId {
          shop {
            id
          }
        }
      `;

      const shopResponse = await admin.graphql(GET_SHOP_ID);
      const shopData = await shopResponse.json();

      if (!shopData.data?.shop?.id) {
        AppLogger.error("Failed to get shop global ID", { component: "app._index", operation: "sync-app-url" });
        return json({ message: "Welcome to Bundle Builder" });
      }

      const shopGlobalId = shopData.data.shop.id;

      // Update shop metafield with app URL
      const UPDATE_APP_URL_METAFIELD = `
        mutation UpdateAppUrlMetafield($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await admin.graphql(UPDATE_APP_URL_METAFIELD, {
        variables: {
          metafields: [{
            ownerId: shopGlobalId,
            namespace: "$app",
            key: "serverUrl",
            type: "single_line_text_field",
            value: appUrl
          }]
        }
      });

      const data = await response.json();

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        AppLogger.error("Metafield set error", { component: "app._index", operation: "sync-app-url" }, { errors: data.data.metafieldsSet.userErrors });
      } else {
        AppLogger.info("Synced app URL to shop metafield", { component: "app._index", operation: "sync-app-url", appUrl });
      }
    } catch (error) {
      AppLogger.error("Failed to sync app URL to metafield", { component: "app._index", operation: "sync-app-url" }, error);
    }
  }

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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '70vh',
            width: '100%'
          }}>
            <div style={{ width: '100%', maxWidth: '700px' }}>
              <Card padding="800">
                <BlockStack gap="600" align="center">
                  <BlockStack gap="400" align="center">
                    <Icon source={CartIcon} tone="primary" />
                    <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h1" alignment="center">
                        Welcome to Wolfpack: Product Bundles
                      </Text>
                      <Text variant="bodyLg" tone="subdued" alignment="center" as="p">
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
                    
                    <Text variant="bodySm" tone="subdued" alignment="center" as="p">
                      Set up your first bundle in just a few minutes
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}