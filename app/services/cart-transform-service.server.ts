// Cart Transform Automatic Activation Service
import type { authenticate } from "~/shopify.server";
import { AppLogger } from "../lib/logger";
import { generateCartTransformRuntimeTokenSecret } from "./cart-transform-runtime-token.server";

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
      const deletion = data.data?.cartTransformDelete;
      if (
        data.errors
        || deletion?.userErrors?.length > 0
        || deletion?.deletedId !== id
      ) {
        AppLogger.warn('Failed to delete CartTransform', {
          component: 'cart-transform',
          operation: 'delete'
        }, {
          id,
          deletedId: deletion?.deletedId,
          errors: data.errors ?? deletion?.userErrors,
        });
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
  ): Promise<{ exists: boolean; id?: string; functionId?: string; blockOnFailure?: boolean }> {
    const CHECK_EXISTING_QUERY = `
      query CheckExistingCartTransform {
        cartTransforms(first: 5) {
          edges {
            node {
              id
              functionId
              blockOnFailure
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
        functionId: existingTransform?.node?.functionId,
        blockOnFailure: existingTransform?.node?.blockOnFailure,
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
      mutation CreateCartTransform($functionHandle: String!, $blockOnFailure: Boolean!) {
        cartTransformCreate(
          functionHandle: $functionHandle
          blockOnFailure: $blockOnFailure
        ) {
          cartTransform {
            id
            functionId
            blockOnFailure
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
        variables: { functionHandle, blockOnFailure: true }
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
   * Force one delete/recreate cycle for a deployment-backfill shop.
   * This intentionally replaces even an already-compliant transform so the
   * backfill establishes the current fail-closed contract deterministically.
   */
  static async replaceForDeploymentBackfill(
    admin: AdminApiContext,
    shopDomain: string,
  ): Promise<CartTransformActivationResult> {
    try {
      const rustFunctionId = await this.getRustFunctionId(admin);
      if (!rustFunctionId) {
        return {
          success: false,
          error: `Rust function handle '${RUST_FUNCTION_HANDLE}' not found — has the app been deployed?`,
        };
      }

      const existing = await this.checkExistingCartTransform(admin);
      if (existing.exists && existing.id) {
        const deleted = await this.deleteCartTransform(admin, existing.id);
        if (!deleted) {
          return {
            success: false,
            cartTransformId: existing.id,
            error: 'Could not delete CartTransform for deployment backfill',
          };
        }
      }

      const created = await this.createCartTransform(admin, RUST_FUNCTION_HANDLE);
      if (!created.success || !created.cartTransformId) {
        return created;
      }

      const secretSync = await this.syncRuntimeTokenSecret(
        admin,
        shopDomain,
        created.cartTransformId,
      );
      if (!secretSync.success) {
        return {
          success: false,
          cartTransformId: created.cartTransformId,
          error: secretSync.error ?? 'Runtime token secret sync failed',
        };
      }

      return created;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Unknown error replacing CartTransform for deployment backfill',
      };
    }
  }

  /**
   * Activate the Rust cart transform for a shop.
   *
   * Handles three cases:
   * 1. No CartTransform exists → create new with Rust handle
   * 2. CartTransform uses Rust with failure blocking → skip (already correct)
   * 3. CartTransform uses Rust without failure blocking → delete and recreate safely
   * 4. CartTransform points to another function → delete stale and recreate safely
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
        if (
          existingCheck.functionId === rustFunctionId &&
          existingCheck.blockOnFailure === true
        ) {
          AppLogger.info('Cart transform already uses fail-closed Rust function', {
            component: 'cart-transform',
            operation: 'activate'
          }, { shopDomain, cartTransformId: existingCheck.id });
          return { success: true, cartTransformId: existingCheck.id, alreadyExists: true };
        }

        AppLogger.info('Unsafe or stale CartTransform found — replacing with fail-closed Rust version', {
          component: 'cart-transform',
          operation: 'activate'
        }, {
          shopDomain,
          staleId: existingCheck.id,
          staleFunctionId: existingCheck.functionId,
          staleBlockOnFailure: existingCheck.blockOnFailure,
        });

        const deleted = await this.deleteCartTransform(admin, existingCheck.id!);
        if (!deleted) {
          return {
            success: false,
            cartTransformId: existingCheck.id,
            error: 'Could not replace unsafe CartTransform',
          };
        }
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

    if (result.success && result.cartTransformId) {
      const secretSync = await this.syncRuntimeTokenSecret(admin, shopDomain, result.cartTransformId);
      if (!secretSync.success) {
        return {
          success: false,
          cartTransformId: result.cartTransformId,
          error: secretSync.error ?? 'Runtime token secret sync failed',
        };
      }
    }

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

  private static async syncRuntimeTokenSecret(
    admin: AdminApiContext,
    shopDomain: string,
    cartTransformId: string,
  ): Promise<CartTransformMetafieldSyncResult> {
    try {
      const secret = generateCartTransformRuntimeTokenSecret(shopDomain);
      const MUTATION = `
        mutation SyncRuntimeTokenSecret($metafields: [MetafieldsSetInput!]!) {
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
            key: 'runtime_token_secret',
            type: 'single_line_text_field',
            value: secret,
          }],
        },
      });
      const data = await response.json() as any;
      const errors = data.data?.metafieldsSet?.userErrors ?? [];
      if (data.errors || errors.length > 0) {
        const message = data.errors
          ? data.errors.map((error: any) => error.message).join(', ')
          : errors.map((error: any) => error.message).join(', ');
        AppLogger.error('Failed to sync runtime token secret metafield', {
          component: 'cart-transform',
          operation: 'sync-runtime-token-secret'
        }, { shopDomain, errors: data.errors ?? errors });
        return { success: false, cartTransformId, error: message };
      }
      return { success: true, cartTransformId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown runtime token secret sync error';
      AppLogger.error('Error syncing runtime token secret metafield', {
        component: 'cart-transform',
        operation: 'sync-runtime-token-secret'
      }, { shopDomain, error: message });
      return { success: false, cartTransformId, error: message };
    }
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

      const runtimeTokenSecret = generateCartTransformRuntimeTokenSecret(shopDomain);
      const response = await admin.graphql(MUTATION, {
        variables: {
          metafields: [
            {
              ownerId: cartTransformId,
              namespace: '$app',
              key: 'bundle_cart_line_messaging',
              type: 'json',
              value: JSON.stringify(settings ?? null),
            },
            {
              ownerId: cartTransformId,
              namespace: '$app',
              key: 'runtime_token_secret',
              type: 'single_line_text_field',
              value: runtimeTokenSecret,
            },
          ],
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
