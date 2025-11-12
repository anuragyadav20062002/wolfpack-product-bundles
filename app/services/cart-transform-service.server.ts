// Cart Transform Automatic Activation Service
import type { authenticate } from "~/shopify.server";
import { AppLogger } from "../lib/logger";

type AdminApiContext = Awaited<ReturnType<typeof authenticate.admin>>['admin'];

export interface CartTransformActivationResult {
  success: boolean;
  cartTransformId?: string;
  error?: string;
  alreadyExists?: boolean;
}

export class CartTransformService {
  /**
   * Get the deployed function ID for the cart transform
   * Uses the UID from environment to directly construct the function ID
   */
  private static async getDeployedFunctionId(admin: AdminApiContext): Promise<string | null> {
    // First, try to use the UID from environment (most reliable method)
    const functionUid = process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID;

    if (functionUid) {
      // Construct the function ID from the UID
      // Format: gid://shopify/ShopifyFunction/{uid}
      const functionId = `gid://shopify/ShopifyFunction/${functionUid}`;

      AppLogger.info('Using function ID from environment UID', {
        component: 'cart-transform',
        operation: 'get-function-id'
      }, { functionId, uid: functionUid });

      return functionId;
    }

    // Fallback: Query for cart transform functions if UID not in environment
    AppLogger.warn('SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID not set, querying for functions', {
      component: 'cart-transform',
      operation: 'get-function-id'
    });

    const QUERY_FUNCTIONS = `
      query GetCartTransformFunction {
        shopifyFunctions(first: 25, apiType: "cart_transform") {
          nodes {
            id
            apiType
            title
            apiVersion
            app {
              id
              title
            }
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(QUERY_FUNCTIONS);
      const data = await response.json() as any;

      if (data.errors) {
        AppLogger.error('GraphQL errors querying functions', {
          component: 'cart-transform',
          operation: 'get-function-id'
        }, { errors: data.errors });
        return null;
      }

      const functions = data.data?.shopifyFunctions?.nodes || [];

      AppLogger.info('Queried shopifyFunctions', {
        component: 'cart-transform',
        operation: 'get-function-id'
      }, {
        totalFound: functions.length,
        functions: functions.map((f: any) => ({
          id: f.id,
          title: f.title,
          apiType: f.apiType,
          appTitle: f.app?.title
        }))
      });

      // Find cart transform function - prioritize by title match
      let cartTransformFunction = functions.find(
        (fn: any) => fn.title?.toLowerCase().includes("bundle") &&
                     fn.title?.toLowerCase().includes("cart")
      );

      // Fallback: just get the first cart_transform function
      if (!cartTransformFunction && functions.length > 0) {
        cartTransformFunction = functions[0];
        AppLogger.info('Using first available cart_transform function', {
          component: 'cart-transform',
          operation: 'get-function-id'
        }, { functionId: cartTransformFunction.id, title: cartTransformFunction.title });
      }

      if (cartTransformFunction) {
        AppLogger.info('Found cart transform function via query', {
          component: 'cart-transform',
          operation: 'get-function-id'
        }, {
          functionId: cartTransformFunction.id,
          title: cartTransformFunction.title,
          apiVersion: cartTransformFunction.apiVersion
        });
        return cartTransformFunction.id;
      }

      AppLogger.warn('No cart_transform functions found for this app', {
        component: 'cart-transform',
        operation: 'get-function-id'
      }, {
        message: 'Set SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID in environment or ensure extension is deployed',
        queriedFunctionCount: functions.length
      });
      return null;

    } catch (error) {
      AppLogger.error('Exception querying deployed functions', {
        component: 'cart-transform',
        operation: 'get-function-id'
      }, error);
      return null;
    }
  }

  /**
   * Automatically activate cart transform function for a newly installed app
   * This should be called during app installation/authentication flow
   */
  static async activateForNewInstallation(
    admin: AdminApiContext,
    shopDomain: string
  ): Promise<CartTransformActivationResult> {
    AppLogger.info('Activating cart transform for shop', {
      component: 'cart-transform',
      operation: 'activate'
    }, { shopDomain });

    try {
      // First, check if cart transform already exists
      const existingCheck = await this.checkExistingCartTransform(admin);

      if (existingCheck.exists) {
        AppLogger.info('Cart transform already exists for shop', {
          component: 'cart-transform',
          operation: 'activate'
        }, { shopDomain, cartTransformId: existingCheck.id });
        return {
          success: true,
          cartTransformId: existingCheck.id,
          alreadyExists: true
        };
      }

      // Get the deployed function ID dynamically
      const functionId = await this.getDeployedFunctionId(admin);

      if (!functionId) {
        const errorMsg = 'Cart transform function not found. Please deploy the extension first using "shopify app deploy"';
        AppLogger.error(errorMsg, {
          component: 'cart-transform',
          operation: 'activate'
        });
        return {
          success: false,
          error: errorMsg
        };
      }

      // Create new cart transform
      const result = await this.createCartTransform(admin, functionId);

      if (result.success) {
        AppLogger.info('Successfully activated cart transform', {
          component: 'cart-transform',
          operation: 'activate'
        }, { shopDomain, cartTransformId: result.cartTransformId });
      } else {
        AppLogger.error('Failed to activate cart transform', {
          component: 'cart-transform',
          operation: 'activate'
        }, { shopDomain, error: result.error });
      }

      return result;

    } catch (error) {
      AppLogger.error('Error during cart transform activation', {
        component: 'cart-transform',
        operation: 'activate'
      }, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during cart transform activation'
      };
    }
  }
  
  /**
   * Check if cart transform already exists for this shop
   */
  private static async checkExistingCartTransform(admin: AdminApiContext): Promise<{ exists: boolean; id?: string; functionId?: string }> {
    const CHECK_EXISTING_QUERY = `
      query CheckExistingCartTransform {
        cartTransforms(first: 5) {
          edges {
            node {
              id
              functionId
            }
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(CHECK_EXISTING_QUERY);
      const data = await response.json() as any;

      if (data.errors) {
        AppLogger.warn('Error checking existing cart transforms', {
          component: 'cart-transform',
          operation: 'check-existing'
        }, data.errors);
        return { exists: false };
      }

      // Check if any cart transform exists (we'll match by title/type later if needed)
      const existingTransform = data.data?.cartTransforms?.edges?.[0];

      return {
        exists: !!existingTransform,
        id: existingTransform?.node?.id,
        functionId: existingTransform?.node?.functionId
      };

    } catch (error) {
      AppLogger.warn('Error checking existing cart transforms', {
        component: 'cart-transform',
        operation: 'check-existing'
      }, error);
      return { exists: false };
    }
  }
  
  /**
   * Create cart transform object
   */
  private static async createCartTransform(admin: AdminApiContext, functionId: string): Promise<CartTransformActivationResult> {
    const CREATE_CART_TRANSFORM_MUTATION = `
      mutation CreateCartTransform($functionId: String!) {
        cartTransformCreate(functionId: $functionId) {
          cartTransform {
            id
            functionId
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(CREATE_CART_TRANSFORM_MUTATION, {
        variables: {
          functionId: functionId
        }
      });
      
      const data = await response.json() as any;
      
      if (data.errors) {
        return {
          success: false,
          error: `GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`
        };
      }
      
      const { cartTransformCreate } = data.data;
      
      if (cartTransformCreate.userErrors?.length > 0) {
        const errorMessages = cartTransformCreate.userErrors.map((e: any) => e.message).join(', ');
        return {
          success: false,
          error: `User errors: ${errorMessages}`
        };
      }
      
      return {
        success: true,
        cartTransformId: cartTransformCreate.cartTransform.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during cart transform creation'
      };
    }
  }
  
  /**
   * Complete setup - activate cart transform
   */
  static async completeSetup(
    admin: AdminApiContext,
    shopDomain: string
  ): Promise<CartTransformActivationResult> {
    AppLogger.info('Starting complete cart transform setup', {
      component: 'cart-transform',
      operation: 'complete-setup'
    }, { shopDomain });

    // Activate cart transform
    const result = await this.activateForNewInstallation(admin, shopDomain);

    if (result.success) {
      AppLogger.info('Complete setup finished', {
        component: 'cart-transform',
        operation: 'complete-setup'
      }, { shopDomain });
    } else {
      AppLogger.error('Setup failed', {
        component: 'cart-transform',
        operation: 'complete-setup'
      }, { shopDomain, error: result.error });
    }

    return result;
  }
}