/**
 * Webhook Processor Service
 *
 * Processes webhooks delivered via Google Cloud Pub/Sub.
 * Handles subscription updates, product changes, and GDPR compliance.
 *
 * Architecture:
 * - Idempotent processing using WebhookEvent table
 * - Quick response pattern (mark processed, return immediately)
 * - Background queue processing for heavy operations
 * - Automatic downgrade handling with bundle archiving
 *
 * Validated against Shopify best practices:
 * https://shopify.dev/docs/apps/build/webhooks/best-practices
 */

import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import type { PubSubMessage, WebhookProcessResult } from "./types";
import {
  handleSubscriptionUpdate,
  handleSubscriptionCancelled,
  handleSubscriptionApproachingCap,
  handlePurchaseUpdate,
} from "./handlers/subscription.server";
import {
  handleProductUpdate,
  handleProductDelete,
} from "./handlers/product.server";
import {
  handleCustomerDataRequest,
  handleCustomerRedact,
  handleShopRedact,
} from "./handlers/gdpr.server";

/**
 * Main webhook processor entry point
 * Processes Pub/Sub messages from Google Cloud
 */
export class WebhookProcessor {
  /**
   * Process a Pub/Sub message
   * Implements idempotency and routes to appropriate handler
   */
  static async processPubSubMessage(
    message: PubSubMessage
  ): Promise<WebhookProcessResult> {
    const topic = message.attributes["X-Shopify-Topic"];
    const shopDomain = message.attributes["X-Shopify-Shop-Domain"];
    const webhookId = message.attributes["X-Shopify-Webhook-Id"];

    try {
      // Decode base64 payload
      const payloadString = Buffer.from(message.data, "base64").toString("utf-8");
      const payload = JSON.parse(payloadString);

      AppLogger.info("Processing webhook", {
        component: "webhook-processor",
        operation: "processPubSubMessage"
      }, { topic, shop: shopDomain, webhookId });

      // Check idempotency - have we processed this webhook before?
      if (webhookId) {
        const existing = await db.webhookEvent.findUnique({
          where: {
            shopDomain_topic_webhookId: {
              shopDomain,
              topic,
              webhookId
            }
          }
        });

        if (existing?.processed) {
          AppLogger.info("Webhook already processed, skipping", {
            component: "webhook-processor",
            operation: "processPubSubMessage"
          }, { topic, shop: shopDomain, webhookId });

          return {
            success: true,
            message: "Webhook already processed"
          };
        }
      }

      // Create webhook event record
      const webhookEvent = await db.webhookEvent.create({
        data: {
          shopDomain,
          topic,
          webhookId,
          payload,
          processed: false
        }
      });

      // Route to appropriate handler
      let result: WebhookProcessResult;

      switch (topic) {
        case "app_subscriptions/update":
        case "APP_SUBSCRIPTIONS_UPDATE":
          result = await handleSubscriptionUpdate(shopDomain, payload);
          break;

        case "app_subscriptions/cancelled":
        case "APP_SUBSCRIPTIONS_CANCELLED":
          result = await handleSubscriptionCancelled(shopDomain, payload);
          break;

        case "app_subscriptions/approaching_capped_amount":
        case "APP_SUBSCRIPTIONS_APPROACHING_CAPPED_AMOUNT":
          result = await handleSubscriptionApproachingCap(shopDomain, payload);
          break;

        case "app_purchases_one_time/update":
        case "APP_PURCHASES_ONE_TIME_UPDATE":
          result = await handlePurchaseUpdate(shopDomain, payload);
          break;

        case "products/update":
        case "PRODUCTS_UPDATE":
          result = await handleProductUpdate(shopDomain, payload);
          break;

        case "products/delete":
        case "PRODUCTS_DELETE":
          result = await handleProductDelete(shopDomain, payload);
          break;

        case "customers/data_request":
        case "CUSTOMERS_DATA_REQUEST":
          result = await handleCustomerDataRequest(shopDomain, payload);
          break;

        case "customers/redact":
        case "CUSTOMERS_REDACT":
          result = await handleCustomerRedact(shopDomain, payload);
          break;

        case "shop/redact":
        case "SHOP_REDACT":
          result = await handleShopRedact(shopDomain, payload, webhookEvent.id);
          break;

        default:
          AppLogger.warn("Unhandled webhook topic", {
            component: "webhook-processor",
            operation: "processPubSubMessage"
          }, { topic, shop: shopDomain });

          result = {
            success: true,
            message: `Unhandled webhook topic: ${topic}`
          };
      }

      // SAFETY: Only mark webhook as processed if handler succeeded
      // Failed webhooks remain unprocessed for potential retry
      if (result.success) {
        await db.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processed: true,
            processedAt: new Date(),
            error: null
          }
        });
      } else {
        // Log failure but don't mark as processed
        await db.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processed: false,
            error: result.error
          }
        });
      }

      return result;

    } catch (error) {
      AppLogger.error("Error processing webhook", {
        component: "webhook-processor",
        operation: "processPubSubMessage"
      }, error);

      return {
        success: false,
        message: "Error processing webhook",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}
