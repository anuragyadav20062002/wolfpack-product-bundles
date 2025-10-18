// Cart Transform Automatic Activation Service
import type { authenticate } from "~/shopify.server";

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
    console.log(`🚀 [CART TRANSFORM] Activating cart transform for shop: ${shopDomain}`);
    
    try {
      // First, check if cart transform already exists
      const existingCheck = await this.checkExistingCartTransform(admin);
      
      if (existingCheck.exists) {
        console.log(`✅ [CART TRANSFORM] Cart transform already exists for ${shopDomain}`);
        return {
          success: true,
          cartTransformId: existingCheck.id,
          alreadyExists: true
        };
      }
      
      // Create new cart transform
      const result = await this.createCartTransform(admin);
      
      if (result.success) {
        console.log(`🎉 [CART TRANSFORM] Successfully activated for ${shopDomain} - ID: ${result.cartTransformId}`);
      } else {
        console.error(`❌ [CART TRANSFORM] Failed to activate for ${shopDomain}:`, result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ [CART TRANSFORM] Error during activation for ${shopDomain}:`, error);
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
        console.warn('⚠️ [CART TRANSFORM] Error checking existing cart transforms:', data.errors);
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
      console.warn('⚠️ [CART TRANSFORM] Error checking existing cart transforms:', error);
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
    console.log(`✅ [METAFIELD] Skipping legacy metafield definition creation - using $app:bundle_config only`);
    // No metafield definitions needed - $app namespace is reserved and doesn't require definitions
  }
  
  /**
   * Complete setup - activate cart transform and ensure metafield definitions
   */
  static async completeSetup(
    admin: AdminApiContext,
    shopDomain: string
  ): Promise<CartTransformActivationResult> {
    console.log(`🔧 [SETUP] Starting complete cart transform setup for ${shopDomain}`);
    
    // Ensure metafield definitions first
    await this.ensureBundleMetafieldDefinitions(admin);
    
    // Then activate cart transform
    const result = await this.activateForNewInstallation(admin, shopDomain);
    
    if (result.success) {
      console.log(`✅ [SETUP] Complete setup finished for ${shopDomain}`);
    } else {
      console.error(`❌ [SETUP] Setup failed for ${shopDomain}:`, result.error);
    }
    
    return result;
  }
}