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

const RUST_FUNCTION_HANDLE = 'bundle-cart-transform-rs';

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
              handle
            }
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(QUERY);
      const data = await response.json() as any;
      const edges = data.data?.shopifyFunctions?.edges || [];
      const match = edges.find((e: any) => e.node.handle === RUST_FUNCTION_HANDLE);
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
   * Run the backfill for a single shop using its stored offline session.
   * Returns status 'dead' for shops whose token is invalid (401/402/missing token)
   * so the caller can purge their sessions.
   */
  static async backfillForShop(shopDomain: string): Promise<{
    shop: string;
    status: 'skipped' | 'replaced' | 'created' | 'dead' | 'error';
    cartTransformId?: string;
    error?: string;
  }> {
    try {
      const { unauthenticated } = await import("../shopify.server");
      const { admin } = await unauthenticated.admin(shopDomain);

      const existing = await this.checkExistingCartTransform(admin);
      const wasReplacing = existing.exists;

      if (wasReplacing && existing.id) {
        await this.deleteCartTransform(admin, existing.id);
      }

      const result = await this.createCartTransform(admin, RUST_FUNCTION_HANDLE);
      if (!result.success) {
        return { shop: shopDomain, status: 'error', error: result.error };
      }

      return {
        shop: shopDomain,
        status: wasReplacing ? 'replaced' : 'created',
        cartTransformId: result.cartTransformId
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      // 401 = app uninstalled / token revoked, 402 = merchant billing lapsed,
      // missing token = session record has no token — all indicate a dead install
      const isDead = /401|402|Missing access token/i.test(msg);
      return {
        shop: shopDomain,
        status: isDead ? 'dead' : 'error',
        error: msg
      };
    }
  }

  /**
   * Delete all DB sessions (online + offline) for a list of shop domains.
   * Used to purge dead installs detected during backfill.
   */
  static async purgeDeadSessions(shops: string[]): Promise<number> {
    if (shops.length === 0) return 0;
    const { default: db } = await import("../db.server");
    const { count } = await db.session.deleteMany({
      where: { shop: { in: shops } }
    });
    return count;
  }

  /**
   * Backfill ALL installed shops, then purge sessions for dead installs.
   * Queries every unique offline session (= installed app) from the DB and
   * runs backfillForShop for each. Includes a 300 ms delay between shops to
   * stay well within Shopify API rate limits.
   */
  static async backfillAllShops(): Promise<{
    results: Awaited<ReturnType<typeof CartTransformService.backfillForShop>>[];
    summary: {
      total: number;
      skipped: number;
      replaced: number;
      created: number;
      dead: number;
      errors: number;
      sessionsPurged: number;
    };
  }> {
    const { default: db } = await import("../db.server");

    const sessions = await db.session.findMany({
      where: { isOnline: false },
      select: { shop: true },
      distinct: ['shop']
    });

    AppLogger.info(`Starting cart transform backfill for ${sessions.length} shops`, {
      component: 'cart-transform',
      operation: 'backfill-all'
    });

    const results: Awaited<ReturnType<typeof CartTransformService.backfillForShop>>[] = [];

    for (const { shop } of sessions) {
      const result = await this.backfillForShop(shop);
      results.push(result);
      AppLogger.info('Backfill result', { component: 'cart-transform', operation: 'backfill-all' }, result);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Purge dead installs from the DB
    const deadShops = results.filter(r => r.status === 'dead').map(r => r.shop);
    const sessionsPurged = await this.purgeDeadSessions(deadShops);

    const summary = {
      total: results.length,
      skipped: results.filter(r => r.status === 'skipped').length,
      replaced: results.filter(r => r.status === 'replaced').length,
      created: results.filter(r => r.status === 'created').length,
      dead: deadShops.length,
      errors: results.filter(r => r.status === 'error').length,
      sessionsPurged
    };

    AppLogger.info('Cart transform backfill complete', {
      component: 'cart-transform',
      operation: 'backfill-all'
    }, summary);

    return { results, summary };
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
}
