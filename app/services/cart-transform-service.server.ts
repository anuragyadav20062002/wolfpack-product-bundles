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

export interface CartTransformMetafieldSyncResult {
  success: boolean;
  cartTransformId?: string;
  error?: string;
}

const RUST_FUNCTION_HANDLE = 'bundle-cart-transform-rs';
const RUST_FUNCTION_TITLE = 'Bundle Cart Transform (Rust)';

export class CartTransformService {
  /**
   * Resolve the live Shopify function ID for the Rust cart transform handle.
   * Uses the stable `shopifyFunctions` query — avoids hardcoding a UUID that
   * changes between app deployments.
   */
  private static async getRustFunctionId(admin: AdminApiContext): Promise<string | null> {
    const QUERY = `
      query GetShopifyFunctions {
        shopifyFunctions(first: 25) {
          edges {
            node {
              id
              title
              apiType
              description
            }
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(QUERY);
      const data = await response.json() as any;
      const edges = data.data?.shopifyFunctions?.edges || [];
      const match = edges.find((e: any) => {
        const fn = e.node;
        return fn.apiType === 'cart_transform' && (
          fn.title === RUST_FUNCTION_TITLE ||
          fn.description?.includes('Rust/WASM port')
        );
      });
      return match?.node?.id ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Delete a CartTransform by its Shopify GID.
   */
  private static async deleteCartTransform(admin: AdminApiContext, id: string): Promise<boolean> {
    const MUTATION = `
      mutation DeleteCartTransform($id: ID!) {
        cartTransformDelete(id: $id) {
          deletedId
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(MUTATION, { variables: { id } });
      const data = await response.json() as any;
      if (data.errors || data.data?.cartTransformDelete?.userErrors?.length > 0) {
        AppLogger.warn('Failed to delete CartTransform', {
          component: 'cart-transform',
          operation: 'delete'
        }, { id, errors: data.errors ?? data.data?.cartTransformDelete?.userErrors });
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check existing CartTransforms for this shop.
   * Returns all transforms so the caller can decide whether to replace them.
   */
  private static async checkExistingCartTransform(
    admin: AdminApiContext
  ): Promise<{ exists: boolean; id?: string; functionId?: string }> {
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

  private static async findCartTransformByFunctionId(
    admin: AdminApiContext,
    functionId: string
  ): Promise<{ id?: string; functionId?: string }> {
    const QUERY = `
      query FindCartTransformByFunctionId {
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

    try {
      const response = await admin.graphql(QUERY);
      const data = await response.json() as any;
      const match = data.data?.cartTransforms?.edges?.find((edge: any) => {
        return edge.node?.functionId === functionId;
      });
      return {
        id: match?.node?.id,
        functionId: match?.node?.functionId,
      };
    } catch (error) {
      AppLogger.warn('Error finding cart transform by function ID', {
        component: 'cart-transform',
        operation: 'find-by-function-id'
      }, error);
      return {};
    }
  }

  /**
   * Create cart transform object using functionHandle (2025-10+ API).
   */
  private static async createCartTransform(
    admin: AdminApiContext,
    functionHandle: string
  ): Promise<CartTransformActivationResult> {
    const CREATE_CART_TRANSFORM_MUTATION = `
      mutation CreateCartTransform($functionHandle: String!) {
        cartTransformCreate(functionHandle: $functionHandle) {
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
        variables: { functionHandle }
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
        return {
          success: false,
          error: `User errors: ${cartTransformCreate.userErrors.map((e: any) => e.message).join(', ')}`
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
   * Activate the Rust cart transform for a shop.
   *
   * Handles three cases:
   * 1. No CartTransform exists → create new with Rust handle
   * 2. CartTransform exists and points to Rust function → skip (already correct)
   * 3. CartTransform exists but points to old TS function → delete stale → create new
   *
   * This replaces the old "exists → skip" logic which silently left merchants
   * on the dead TS function after the Rust migration.
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
      // Resolve live Rust function ID so we can detect stale transforms
      const rustFunctionId = await this.getRustFunctionId(admin);

      if (!rustFunctionId) {
        const errorMsg = `Rust function handle '${RUST_FUNCTION_HANDLE}' not found — has the app been deployed?`;
        AppLogger.error(errorMsg, { component: 'cart-transform', operation: 'activate' });
        return { success: false, error: errorMsg };
      }

      const existingCheck = await this.checkExistingCartTransform(admin);

      if (existingCheck.exists) {
        if (existingCheck.functionId === rustFunctionId) {
          // Already on Rust function — nothing to do
          AppLogger.info('Cart transform already uses Rust function', {
            component: 'cart-transform',
            operation: 'activate'
          }, { shopDomain, cartTransformId: existingCheck.id });
          return { success: true, cartTransformId: existingCheck.id, alreadyExists: true };
        }

        // Stale transform (old TS function or unknown) — delete before recreating
        AppLogger.info('Stale CartTransform found — deleting and replacing with Rust version', {
          component: 'cart-transform',
          operation: 'activate'
        }, { shopDomain, staleId: existingCheck.id, staleFunctionId: existingCheck.functionId });

        await this.deleteCartTransform(admin, existingCheck.id!);
      }

      // Create fresh CartTransform for the Rust function
      const result = await this.createCartTransform(admin, RUST_FUNCTION_HANDLE);

      if (result.success) {
        AppLogger.info('Successfully activated Rust cart transform', {
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

  static async syncCartLineMessagingSettings(
    admin: AdminApiContext,
    shopDomain: string,
    settings: unknown
  ): Promise<CartTransformMetafieldSyncResult> {
    try {
      const rustFunctionId = await this.getRustFunctionId(admin);
      if (!rustFunctionId) {
        const errorMsg = `Rust function handle '${RUST_FUNCTION_HANDLE}' not found — has the app been deployed?`;
        AppLogger.error(errorMsg, {
          component: 'cart-transform',
          operation: 'sync-cart-line-messaging'
        }, { shopDomain });
        return { success: false, error: errorMsg };
      }

      let cartTransformId = (await this.findCartTransformByFunctionId(admin, rustFunctionId)).id;
      if (!cartTransformId) {
        const activation = await this.activateForNewInstallation(admin, shopDomain);
        if (!activation.success || !activation.cartTransformId) {
          return { success: false, error: activation.error ?? 'Cart transform activation failed' };
        }
        cartTransformId = activation.cartTransformId;
      }

      const MUTATION = `
        mutation SyncCartLineMessagingSettings($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              key
              namespace
              value
            }
            userErrors {
              field
              message
              code
            }
          }
        }
      `;

      const response = await admin.graphql(MUTATION, {
        variables: {
          metafields: [{
            ownerId: cartTransformId,
            namespace: '$app',
            key: 'bundle_cart_line_messaging',
            type: 'json',
            value: JSON.stringify(settings ?? null),
          }],
        },
      });
      const data = await response.json() as any;
      const errors = data.data?.metafieldsSet?.userErrors ?? [];
      if (data.errors || errors.length > 0) {
        const message = data.errors
          ? data.errors.map((error: any) => error.message).join(', ')
          : errors.map((error: any) => error.message).join(', ');
        AppLogger.error('Failed to sync cart line messaging metafield', {
          component: 'cart-transform',
          operation: 'sync-cart-line-messaging'
        }, { shopDomain, errors: data.errors ?? errors });
        return { success: false, cartTransformId, error: message };
      }

      return { success: true, cartTransformId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown cart transform metafield sync error';
      AppLogger.error('Error syncing cart line messaging metafield', {
        component: 'cart-transform',
        operation: 'sync-cart-line-messaging'
      }, { shopDomain, error: message });
      return { success: false, error: message };
    }
  }
}
