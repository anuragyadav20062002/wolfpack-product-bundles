/**
 * Orders Webhook Handler
 *
 * Handles `orders/create` webhook as a no-op stub.
 *
 * UTM attribution is handled entirely by the Web Pixel extension, which
 * POSTs directly to /api/attribution on checkout_completed. Web pixels
 * run in a sandboxed worker and cannot write cart attributes, so there
 * are no note_attributes to extract here.
 *
 * This handler exists to prevent "unhandled webhook topic" warnings and
 * can be extended in the future if a theme app embed is added to write
 * UTM data into cart attributes.
 */

import { AppLogger } from "../../../lib/logger";
import type { WebhookProcessResult } from "../types";

/**
 * Handle orders/create webhook — currently a no-op.
 * Attribution is handled by the Web Pixel → /api/attribution POST path.
 */
export async function handleOrderCreate(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  if (!payload) {
    return { success: true, message: "No payload — skipping" };
  }

  AppLogger.debug("[ORDERS] orders/create received — attribution handled by pixel", {
    shopId: shopDomain,
    orderId: payload.admin_graphql_api_id || payload.id,
  });

  return {
    success: true,
    message: "Order received — attribution handled by web pixel",
  };
}
