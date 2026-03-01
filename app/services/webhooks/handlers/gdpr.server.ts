/**
 * GDPR Webhook Handlers
 *
 * Handles GDPR compliance webhooks:
 * - customers/data_request
 * - customers/redact
 * - shop/redact
 */

import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import type { WebhookProcessResult } from "../types";

/**
 * Handle GDPR customer data request
 * Store request for compliance processing
 */
export async function handleCustomerDataRequest(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    // SAFETY: Validate payload exists
    if (!payload || typeof payload !== "object") {
      return {
        success: false,
        message: "Invalid webhook payload",
        error: "payload is required and must be an object"
      };
    }

    await db.complianceRecord.create({
      data: {
        shop: shopDomain,
        type: "customer_data_request",
        payload,
        status: "pending"
      }
    });

    AppLogger.info("Customer data request recorded", {
      component: "webhook-processor",
      operation: "handleCustomerDataRequest"
    }, { shop: shopDomain });

    // NOTE: This creates a compliance record with status "pending"
    // Manual processing may be required to fulfill the data request

    return {
      success: true,
      message: "Customer data request recorded"
    };

  } catch (error) {
    AppLogger.error("Error handling customer data request", {
      component: "webhook-processor",
      operation: "handleCustomerDataRequest"
    }, error);

    return {
      success: false,
      message: "Error handling customer data request",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Handle GDPR customer redact request
 * Remove customer data for compliance
 */
export async function handleCustomerRedact(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    // SAFETY: Validate payload exists
    if (!payload || typeof payload !== "object") {
      return {
        success: false,
        message: "Invalid webhook payload",
        error: "payload is required and must be an object"
      };
    }

    const customerId = payload.customer?.id;

    // Store compliance record
    // NOTE: We mark this as "completed" immediately because this app
    // doesn't store customer PII - only the compliance record itself
    await db.complianceRecord.create({
      data: {
        shop: shopDomain,
        type: "customer_redact",
        payload,
        status: "completed",
        processedAt: new Date()
      }
    });

    AppLogger.info("Customer redact request processed", {
      component: "webhook-processor",
      operation: "handleCustomerRedact"
    }, { shop: shopDomain, customerId });

    return {
      success: true,
      message: "Customer data redacted"
    };

  } catch (error) {
    AppLogger.error("Error handling customer redact", {
      component: "webhook-processor",
      operation: "handleCustomerRedact"
    }, error);

    return {
      success: false,
      message: "Error handling customer redact",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Handle GDPR shop redact request
 * Remove all shop data for compliance
 */
export async function handleShopRedact(
  shopDomain: string,
  payload: any,
  currentWebhookEventId?: string
): Promise<WebhookProcessResult> {
  try {
    // Store compliance record first
    await db.complianceRecord.create({
      data: {
        shop: shopDomain,
        type: "shop_redact",
        payload,
        status: "processing"
      }
    });

    // Delete all shop data (cascading deletes will handle related records)
    const shop = await db.shop.findUnique({
      where: { shopDomain }
    });

    if (shop) {
      await db.shop.delete({
        where: { id: shop.id }
      });
    }

    // Delete bundles for this shop
    await db.bundle.deleteMany({
      where: { shopId: shopDomain }
    });

    // Delete sessions
    await db.session.deleteMany({
      where: { shop: shopDomain }
    });

    // Delete queued jobs
    await db.queuedJob.deleteMany({
      where: { shopId: shopDomain }
    });

    // Delete webhook events (excluding current event being processed)
    // SAFETY: Explicitly handle the case where we need to exclude current webhook
    if (currentWebhookEventId) {
      // Safe: Delete all webhook events for this shop EXCEPT the current one
      await db.webhookEvent.deleteMany({
        where: {
          shopDomain,
          id: { not: currentWebhookEventId }
        }
      });
    } else {
      // Fallback: If no current webhook ID provided, delete all
      // This should rarely happen, but is safe for cleanup scenarios
      await db.webhookEvent.deleteMany({
        where: { shopDomain }
      });
    }

    // Update compliance record
    await db.complianceRecord.updateMany({
      where: {
        shop: shopDomain,
        type: "shop_redact"
      },
      data: {
        status: "completed",
        processedAt: new Date()
      }
    });

    AppLogger.info("Shop data redacted", {
      component: "webhook-processor",
      operation: "handleShopRedact"
    }, { shop: shopDomain });

    return {
      success: true,
      message: "Shop data redacted"
    };

  } catch (error) {
    AppLogger.error("Error handling shop redact", {
      component: "webhook-processor",
      operation: "handleShopRedact"
    }, error);

    return {
      success: false,
      message: "Error handling shop redact",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
