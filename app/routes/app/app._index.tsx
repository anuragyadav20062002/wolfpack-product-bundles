import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { AppLogger } from "../../lib/logger";

export async function loader({ request }: LoaderFunctionArgs) {
  // authenticate.admin() throws if not authenticated; if it returns, user is authed.
  const { admin } = await authenticate.admin(request);

  // Sync app URL to shop metafield for theme extension access
  const appUrl = process.env.SHOPIFY_APP_URL;

  if (appUrl) {
    try {
      const GET_SHOP_ID = `
        query getShopId {
          shop {
            id
          }
        }
      `;

      const shopResponse = await admin.graphql(GET_SHOP_ID);

      if (shopResponse.ok && shopResponse.status !== 302) {
        const shopData = await shopResponse.json();
        const shopGlobalId = shopData.data?.shop?.id;

        if (shopGlobalId) {
          const UPDATE_APP_URL_METAFIELD = `
            mutation UpdateAppUrlMetafield($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields { id }
                userErrors { field message }
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

          if (response.ok) {
            const data = await response.json();
            if (data.data?.metafieldsSet?.userErrors?.length > 0) {
              AppLogger.error("Metafield set error", { component: "app._index", operation: "sync-app-url" }, { errors: data.data.metafieldsSet.userErrors });
            }
          }
        }
      }
    } catch (error) {
      AppLogger.error("Failed to sync app URL to metafield", { component: "app._index", operation: "sync-app-url" }, error);
    }
  }

  // Always redirect authenticated users to the dashboard
  throw redirect("/app/dashboard");
}

// This component should never render (loader always redirects),
// but Remix requires a default export for route modules.
export default function AppIndex() {
  return null;
}
