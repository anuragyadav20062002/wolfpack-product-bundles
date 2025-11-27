import { json, type ActionFunctionArgs } from "@remix-run/node";
import { WebhookProcessor } from "../services/webhook-processor.server";
import { AppLogger } from "../lib/logger";

/**
 * API Route: Pub/Sub Webhook Handler
 *
 * POST /api/webhooks/pubsub
 *
 * Receives webhooks from Google Cloud Pub/Sub
 * This endpoint is called by a background worker that pulls
 * messages from the Pub/Sub subscription
 *
 * Message format from Pub/Sub:
 * {
 *   message: {
 *     data: "base64-encoded-json",
 *     attributes: {
 *       "X-Shopify-Topic": "app/subscriptions_update",
 *       "X-Shopify-Shop-Domain": "store.myshopify.com",
 *       "X-Shopify-Webhook-Id": "unique-webhook-id"
 *     }
 *   }
 * }
 *
 * Note: This route does NOT authenticate with Shopify because
 * Pub/Sub messages come from Google Cloud, not directly from Shopify.
 * Security is handled by:
 * 1. Google Cloud IAM permissions
 * 2. Idempotency checks in WebhookProcessor
 * 3. Webhook ID validation
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();

    // Validate Pub/Sub message structure
    if (!body.message) {
      AppLogger.error("Invalid Pub/Sub message format", {
        component: "api.webhooks.pubsub",
        operation: "action"
      }, { body });

      return json(
        {
          success: false,
          error: "Invalid message format"
        },
        { status: 400 }
      );
    }

    const { message } = body;

    // Extract message components
    const data = message.data;
    const attributes = message.attributes || {};

    if (!data) {
      AppLogger.error("Missing message data", {
        component: "api.webhooks.pubsub",
        operation: "action"
      }, { attributes });

      return json(
        {
          success: false,
          error: "Missing message data"
        },
        { status: 400 }
      );
    }

    if (!attributes["X-Shopify-Topic"]) {
      AppLogger.error("Missing X-Shopify-Topic attribute", {
        component: "api.webhooks.pubsub",
        operation: "action"
      }, { attributes });

      return json(
        {
          success: false,
          error: "Missing webhook topic"
        },
        { status: 400 }
      );
    }

    if (!attributes["X-Shopify-Shop-Domain"]) {
      AppLogger.error("Missing X-Shopify-Shop-Domain attribute", {
        component: "api.webhooks.pubsub",
        operation: "action"
      }, { attributes });

      return json(
        {
          success: false,
          error: "Missing shop domain"
        },
        { status: 400 }
      );
    }

    // Log webhook receipt
    AppLogger.info("Received Pub/Sub webhook", {
      component: "api.webhooks.pubsub",
      operation: "action"
    }, {
      topic: attributes["X-Shopify-Topic"],
      shop: attributes["X-Shopify-Shop-Domain"],
      webhookId: attributes["X-Shopify-Webhook-Id"]
    });

    // Process webhook
    const result = await WebhookProcessor.processPubSubMessage({
      data,
      attributes
    });

    // Return 200 quickly (Shopify best practice)
    // Actual processing happens in background
    return json(
      {
        success: result.success,
        message: result.message
      },
      { status: 200 }
    );

  } catch (error) {
    AppLogger.error("Error processing Pub/Sub webhook", {
      component: "api.webhooks.pubsub",
      operation: "action"
    }, error);

    // Still return 200 to prevent retries for malformed messages
    // Actual errors are logged for monitoring
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}
