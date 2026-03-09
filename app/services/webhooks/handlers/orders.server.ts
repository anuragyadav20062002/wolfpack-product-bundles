/**
 * Orders Webhook Handler
 *
 * Handles `orders/create` webhook to extract UTM attribution data
 * from cart attributes (set by Web Pixel) and create OrderAttribution records.
 *
 * This is a backup attribution path — the Web Pixel sends data directly
 * via the attribution API route on checkout_completed. The webhook catches
 * any attributions that the pixel may have missed (e.g., ad blockers).
 */

import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import type { WebhookProcessResult } from "../types";

/** Cart attribute keys set by the Wolfpack UTM pixel */
const UTM_ATTRIBUTE_KEYS = {
  source: "_wolfpack_utm_source",
  medium: "_wolfpack_utm_medium",
  campaign: "_wolfpack_utm_campaign",
  content: "_wolfpack_utm_content",
  term: "_wolfpack_utm_term",
  landingPage: "_wolfpack_landing_page",
};

/**
 * Handle orders/create webhook
 * Extracts UTM data from order note_attributes and creates OrderAttribution records.
 */
export async function handleOrderCreate(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    if (!payload) {
      return { success: true, message: "No payload — skipping" };
    }

    // Extract UTM data from note_attributes (cart attributes carry over to order)
    const noteAttributes: Array<{ name: string; value: string }> =
      payload.note_attributes || [];

    const utmSource = noteAttributes.find(
      (a) => a.name === UTM_ATTRIBUTE_KEYS.source
    )?.value;

    // No UTM data — nothing to attribute
    if (!utmSource) {
      return { success: true, message: "No UTM attribution data in order" };
    }

    const utmMedium = noteAttributes.find(
      (a) => a.name === UTM_ATTRIBUTE_KEYS.medium
    )?.value;
    const utmCampaign = noteAttributes.find(
      (a) => a.name === UTM_ATTRIBUTE_KEYS.campaign
    )?.value;
    const utmContent = noteAttributes.find(
      (a) => a.name === UTM_ATTRIBUTE_KEYS.content
    )?.value;
    const utmTerm = noteAttributes.find(
      (a) => a.name === UTM_ATTRIBUTE_KEYS.term
    )?.value;
    const landingPage = noteAttributes.find(
      (a) => a.name === UTM_ATTRIBUTE_KEYS.landingPage
    )?.value;

    const orderId = payload.admin_graphql_api_id || `gid://shopify/Order/${payload.id}`;
    const orderNumber = payload.name || payload.order_number?.toString() || null;

    // Calculate revenue in cents from total_price
    const totalPrice = parseFloat(payload.total_price || "0");
    const revenue = Math.round(totalPrice * 100);
    const currency = payload.currency || "USD";

    // Check if attribution already exists for this order (pixel may have sent it first)
    const existing = await db.orderAttribution.findFirst({
      where: { orderId, shopId: shopDomain },
    });

    if (existing) {
      AppLogger.debug("[ORDERS] Attribution already exists for order, skipping webhook path", {
        orderId,
        shopId: shopDomain,
      });
      return { success: true, message: "Attribution already recorded via pixel" };
    }

    // Find bundle products in the order line items
    const lineItems: Array<{ product_id: number }> = payload.line_items || [];
    const productGids = lineItems
      .filter((item) => item.product_id)
      .map((item) => `gid://shopify/Product/${item.product_id}`);

    const bundleIds: string[] = [];
    if (productGids.length > 0) {
      const bundles = await db.bundle.findMany({
        where: {
          shopId: shopDomain,
          shopifyProductId: { in: productGids },
        },
        select: { id: true },
      });
      bundleIds.push(...bundles.map((b) => b.id));
    }

    // Create attribution record(s)
    if (bundleIds.length > 0) {
      await db.orderAttribution.createMany({
        data: bundleIds.map((bundleId) => ({
          shopId: shopDomain,
          bundleId,
          orderId,
          orderNumber,
          utmSource,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          utmContent: utmContent || null,
          utmTerm: utmTerm || null,
          landingPage: landingPage || null,
          revenue,
          currency,
        })),
      });
    } else {
      await db.orderAttribution.create({
        data: {
          shopId: shopDomain,
          bundleId: null,
          orderId,
          orderNumber,
          utmSource,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          utmContent: utmContent || null,
          utmTerm: utmTerm || null,
          landingPage: landingPage || null,
          revenue,
          currency,
        },
      });
    }

    AppLogger.info("[ORDERS] Attribution recorded from webhook", {
      orderId,
      shopId: shopDomain,
      utmSource,
      bundleCount: bundleIds.length,
    });

    return {
      success: true,
      message: `Attribution recorded for order ${orderNumber || orderId}`,
    };
  } catch (error) {
    AppLogger.error("[ORDERS] Failed to process order attribution", {
      shopId: shopDomain,
    }, error);
    return {
      success: false,
      message: "Failed to process order attribution",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
