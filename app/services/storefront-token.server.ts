/**
 * Storefront Access Token Management Service
 *
 * Handles creation and management of delegated Storefront API access tokens
 * for shops that install the app.
 */

import db from "../db.server";

const CREATE_STOREFRONT_TOKEN_MUTATION = `
  mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
    storefrontAccessTokenCreate(input: $input) {
      storefrontAccessToken {
        accessToken
        title
        accessScopes {
          handle
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Creates a delegated Storefront Access Token for a shop
 * This token allows the app to query the Storefront API on behalf of the shop
 */
export async function createStorefrontAccessToken(admin: any, shop: string) {
  console.log(`[STOREFRONT_TOKEN] Creating storefront access token for shop: ${shop}`);

  try {
    const response = await admin.graphql(CREATE_STOREFRONT_TOKEN_MUTATION, {
      variables: {
        input: {
          title: "Bundle Widget Product Fetcher"
        }
      }
    });

    const data = await response.json();

    if (data.errors) {
      console.error("[STOREFRONT_TOKEN] GraphQL errors:", data.errors);
      throw new Error("Failed to create storefront access token");
    }

    const result = data.data?.storefrontAccessTokenCreate;

    if (result?.userErrors && result.userErrors.length > 0) {
      console.error("[STOREFRONT_TOKEN] User errors:", result.userErrors);
      throw new Error(result.userErrors[0].message);
    }

    const accessToken = result?.storefrontAccessToken?.accessToken;

    if (!accessToken) {
      console.error("[STOREFRONT_TOKEN] No access token in response");
      throw new Error("No access token returned");
    }

    console.log(`[STOREFRONT_TOKEN] Successfully created storefront access token`);

    // Store the token in the database
    await db.session.updateMany({
      where: { shop },
      data: { storefrontAccessToken: accessToken }
    });

    console.log(`[STOREFRONT_TOKEN] Token stored in database for shop: ${shop}`);

    return accessToken;
  } catch (error: any) {
    console.error("[STOREFRONT_TOKEN] Error creating storefront token:", error);
    throw error;
  }
}

/**
 * Gets the storefront access token for a shop
 * Creates one if it doesn't exist
 */
export async function getStorefrontAccessToken(admin: any, shop: string): Promise<string> {
  // Try to get existing token from database
  const session = await db.session.findFirst({
    where: { shop },
    select: { storefrontAccessToken: true }
  });

  if (session?.storefrontAccessToken) {
    console.log(`[STOREFRONT_TOKEN] Using existing token for shop: ${shop}`);
    return session.storefrontAccessToken;
  }

  // Create new token if none exists
  console.log(`[STOREFRONT_TOKEN] No existing token found, creating new one for shop: ${shop}`);
  return await createStorefrontAccessToken(admin, shop);
}
