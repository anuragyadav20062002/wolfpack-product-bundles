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
  private static FUNCTION_ID = process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID || "527a500e-5386-4a67-a61b-9cb4cb8973f8";
  
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
      
      // Create new cart transform
      const result = await this.createCartTransform(admin);

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
  private static async checkExistingCartTransform(admin: AdminApiContext): Promise<{ exists: boolean; id?: string }> {
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
      
      const existingTransform = data.data.cartTransforms.edges.find(
        (edge: any) => edge.node.functionId === this.FUNCTION_ID
      );
      
      return {
        exists: !!existingTransform,
        id: existingTransform?.node.id
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
  private static async createCartTransform(admin: AdminApiContext): Promise<CartTransformActivationResult> {
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
          functionId: this.FUNCTION_ID
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
   * Ensure metafield definitions exist for bundle configuration
   * Legacy metafield definitions removed - now using $app:bundle_config only
   */
  static async ensureBundleMetafieldDefinitions(admin: AdminApiContext): Promise<void> {
    AppLogger.info('Skipping legacy metafield definition creation - using $app:bundle_config only', {
      component: 'cart-transform',
      operation: 'ensure-metafields'
    });
    // No metafield definitions needed - $app namespace is reserved and doesn't require definitions
  }
  
  /**
   * Complete setup - activate cart transform and ensure metafield definitions
   */
  static async completeSetup(
    admin: AdminApiContext,
    shopDomain: string
  ): Promise<CartTransformActivationResult> {
    AppLogger.info('Starting complete cart transform setup', {
      component: 'cart-transform',
      operation: 'complete-setup'
    }, { shopDomain });
    
    // Ensure metafield definitions first
    await this.ensureBundleMetafieldDefinitions(admin);
    
    // Then activate cart transform
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