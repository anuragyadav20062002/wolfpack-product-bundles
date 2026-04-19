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
   * Safe to call repeatedly — skips shops that already have the Rust transform.
   *
   * NOTE: Does NOT pre-check shopifyFunctions — we rely on cartTransformCreate
   * to validate the handle. This avoids false "not found" errors if shopifyFunctions
   * returns a different handle format than expected.
   */
  static async backfillForShop(shopDomain: string): Promise<{
    shop: string;
    status: 'skipped' | 'replaced' | 'created' | 'error';
    cartTransformId?: string;
    error?: string;
    diagnostics?: Record<string, unknown>;
  }> {
    try {
      const { unauthenticated } = await import("../shopify.server");
      const { admin } = await unauthenticated.admin(shopDomain);

      // Diagnostic: capture what shopifyFunctions actually returns so we can debug
      const DIAG_QUERY = `
        query DiagBackfill {
          shopifyFunctions(first: 25) {
            edges { node { id handle } }
          }
          cartTransforms(first: 5) {
            edges { node { id functionId } }
          }
        }
      `;
      let diagnostics: Record<string, unknown> = {};
      try {
        const diagRes = await admin.graphql(DIAG_QUERY);
        const diagData = await diagRes.json() as any;
        const functions = diagData.data?.shopifyFunctions?.edges?.map((e: any) => e.node) || [];
        const transforms = diagData.data?.cartTransforms?.edges?.map((e: any) => e.node) || [];
        diagnostics = { functions, transforms };
      } catch { /* non-fatal */ }

      const existing = await this.checkExistingCartTransform(admin);
      const wasReplacing = existing.exists;

      if (wasReplacing && existing.id) {
        await this.deleteCartTransform(admin, existing.id);
      }

      const result = await this.createCartTransform(admin, RUST_FUNCTION_HANDLE);
      if (!result.success) {
        return { shop: shopDomain, status: 'error', error: result.error, diagnostics };
      }

      return {
        shop: shopDomain,
        status: wasReplacing ? 'replaced' : 'created',
        cartTransformId: result.cartTransformId,
        diagnostics
      };
    } catch (error) {
      return {
        shop: shopDomain,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Backfill ALL installed shops.
   * Queries every unique offline session (= installed app) from the DB and
   * runs backfillForShop for each. Includes a 300 ms delay between shops to
   * stay well within Shopify API rate limits.
   *
   * Returns per-shop results plus a summary.
   */
  static async backfillAllShops(): Promise<{
    results: Awaited<ReturnType<typeof CartTransformService.backfillForShop>>[];
    summary: { total: number; skipped: number; replaced: number; created: number; errors: number };
  }> {
    const { default: db } = await import("../db.server");

    // Offline sessions (isOnline: false) represent installed apps
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

      AppLogger.info(`Backfill result`, {
        component: 'cart-transform',
        operation: 'backfill-all'
      }, result);

      // 300 ms breathing room between shops — avoids bursting the rate limiter
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const summary = {
      total: results.length,
      skipped: results.filter(r => r.status === 'skipped').length,
      replaced: results.filter(r => r.status === 'replaced').length,
      created: results.filter(r => r.status === 'created').length,
      errors: results.filter(r => r.status === 'error').length
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
