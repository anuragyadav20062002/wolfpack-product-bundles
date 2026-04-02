/**
 * Storefront Access Token Management Service
 *
 * Handles creation and management of delegated Storefront API access tokens
 * for shops that install the app.
 */

import db from "../db.server";
import { AppLogger } from "../lib/logger";
import type { authenticate } from "~/shopify.server";

type AdminApiContext = Awaited<ReturnType<typeof authenticate.admin>>['admin'];

// GraphQL response types
interface StorefrontAccessTokenCreateResponse {
  data?: {
    storefrontAccessTokenCreate?: {
      storefrontAccessToken?: {
        accessToken: string;
        title: string;
        accessScopes?: Array<{ handle: string }>;
      };
      userErrors?: Array<{
        field?: string[];
        message: string;
      }>;
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

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
export async function createStorefrontAccessToken(admin: AdminApiContext, shop: string) {
  AppLogger.info("[STOREFRONT_TOKEN] Creating storefront access token", { component: "storefront-token.server", shop });

  try {
    const response = await admin.graphql(CREATE_STOREFRONT_TOKEN_MUTATION, {
      variables: {
        input: {
          title: "Bundle Widget Product Fetcher"
        }
      }
    });

    const data = await response.json() as StorefrontAccessTokenCreateResponse;

    if (data.errors) {
      AppLogger.error("[STOREFRONT_TOKEN] GraphQL errors", { component: "storefront-token.server", shop }, data.errors);
      throw new Error("Failed to create storefront access token");
    }

    const result = data.data?.storefrontAccessTokenCreate;

    if (result?.userErrors && result.userErrors.length > 0) {
      AppLogger.error("[STOREFRONT_TOKEN] User errors", { component: "storefront-token.server", shop }, result.userErrors);
      throw new Error(result.userErrors[0].message);
    }

    const accessToken = result?.storefrontAccessToken?.accessToken;

    if (!accessToken) {
      AppLogger.error("[STOREFRONT_TOKEN] No access token in response", { component: "storefront-token.server", shop });
      throw new Error("No access token returned");
    }

    AppLogger.info("[STOREFRONT_TOKEN] Storefront access token created", { component: "storefront-token.server", shop });

    // Store the token in the database
    await db.session.updateMany({
      where: { shop },
      data: { storefrontAccessToken: accessToken }
    });

    return accessToken;
  } catch (error) {
    AppLogger.error("[STOREFRONT_TOKEN] Error creating storefront token", { component: "storefront-token.server", shop }, error);
    throw error;
  }
}

/**
 * Gets the storefront access token for a shop
 * Creates one if it doesn't exist
 */
export async function getStorefrontAccessToken(admin: AdminApiContext, shop: string): Promise<string> {
  // Try to get existing token from database
  const session = await db.session.findFirst({
    where: { shop },
    select: { storefrontAccessToken: true }
  });

  if (session?.storefrontAccessToken) {
    return session.storefrontAccessToken;
  }

  // Create new token if none exists
  AppLogger.info("[STOREFRONT_TOKEN] No existing token, creating new one", { component: "storefront-token.server", shop });
  return await createStorefrontAccessToken(admin, shop);
}
