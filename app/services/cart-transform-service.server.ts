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
   * This queries Shopify to find the function by handle
   */
  private static async getDeployedFunctionId(admin: AdminApiContext): Promise<string | null> {
    const QUERY_FUNCTIONS = `
      query {
        shopifyFunctions(first: 50) {
          nodes {
            id
            apiType
            title
            appTitle
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(QUERY_FUNCTIONS);
      const data = await response.json() as any;

      if (data.errors) {
        AppLogger.warn('Error querying functions', {
          component: 'cart-transform',
          operation: 'get-function-id'
        }, data.errors);
        return null;
      }

      // Find cart transform function
      const cartTransformFunction = data.data?.shopifyFunctions?.nodes?.find(
        (fn: any) => fn.apiType === "cart_transform" || fn.title?.includes("Bundle Cart Transform")
      );

      if (cartTransformFunction) {
        AppLogger.info('Found deployed cart transform function', {
          component: 'cart-transform',
          operation: 'get-function-id'
        }, { functionId: cartTransformFunction.id, title: cartTransformFunction.title });
        return cartTransformFunction.id;
      }

      AppLogger.warn('No cart transform function found in deployed functions', {
        component: 'cart-transform',
        operation: 'get-function-id'
      });
      return null;

    } catch (error) {
      AppLogger.warn('Error querying deployed functions', {
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