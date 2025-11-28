/**
 * Google Cloud Pub/Sub Worker
 *
 * Pulls webhook messages from Google Cloud Pub/Sub subscription
 * and processes them through the webhook processor
 *
 * This worker should run as a separate background process:
 * - In development: Run with `npm run pubsub-worker`
 * - In production: Run as a separate worker service on Render
 *
 * Configuration via environment variables:
 * - GOOGLE_CLOUD_PROJECT: GCP project ID
 * - PUBSUB_SUBSCRIPTION: Subscription name
 * - GOOGLE_APPLICATION_CREDENTIALS_JSON: Service account credentials
 */

import { PubSub, Message } from "@google-cloud/pubsub";
import { WebhookProcessor } from "./webhook-processor.server";
import { AppLogger } from "../lib/logger";

// Environment validation
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const PUBSUB_SUBSCRIPTION = process.env.PUBSUB_SUBSCRIPTION;
const GOOGLE_APPLICATION_CREDENTIALS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

if (!GOOGLE_CLOUD_PROJECT) {
  throw new Error("GOOGLE_CLOUD_PROJECT environment variable is required");
}

if (!PUBSUB_SUBSCRIPTION) {
  throw new Error("PUBSUB_SUBSCRIPTION environment variable is required");
}

if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is required");
}

// Parse credentials from JSON string
let credentials;
try {
  credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
} catch (error) {
  throw new Error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON: " + error);
}

// Initialize Pub/Sub client
const pubSubClient = new PubSub({
  projectId: GOOGLE_CLOUD_PROJECT,
  credentials
});

// Get subscription
const subscription = pubSubClient.subscription(PUBSUB_SUBSCRIPTION);

// Worker configuration
const WORKER_CONFIG = {
  maxMessages: 10, // Process up to 10 messages at once
  maxExtension: 300, // Extend ack deadline by 5 minutes if needed
  ackDeadline: 600, // 10 minute ack deadline
  flowControl: {
    maxMessages: 100, // Max outstanding messages
    allowExcessMessages: false
  }
};

// Apply configuration
subscription.setOptions({
  flowControl: WORKER_CONFIG.flowControl,
  ackDeadline: WORKER_CONFIG.ackDeadline
});

/**
 * Message handler
 * Processes each Pub/Sub message through webhook processor
 */
async function messageHandler(message: Message) {
  const messageId = message.id;
  const publishTime = message.publishTime;

  try {
    // Extract Shopify webhook attributes
    const messageAttributes = message.attributes || {};
    const topic = messageAttributes["X-Shopify-Topic"];
    const shopDomain = messageAttributes["X-Shopify-Shop-Domain"];
    const webhookId = messageAttributes["X-Shopify-Webhook-Id"];

    AppLogger.info("Processing Pub/Sub message", {
      component: "pubsub-worker",
      operation: "messageHandler"
    }, {
      messageId,
      publishTime: publishTime.toISOString(),
      topic,
      shop: shopDomain,
      webhookId
    });

    // Convert message data to base64 string
    const data = message.data.toString("base64");

    // Construct attributes object matching WebhookProcessor interface
    const attributes = {
      "X-Shopify-Topic": topic || "",
      "X-Shopify-Shop-Domain": shopDomain || "",
      "X-Shopify-Webhook-Id": webhookId,
      "X-Shopify-API-Version": messageAttributes["X-Shopify-API-Version"]
    };

    // Process through webhook processor
    const result = await WebhookProcessor.processPubSubMessage({
      data,
      attributes
    });

    if (result.success) {
      // Acknowledge the message
      message.ack();

      AppLogger.info("Message processed successfully", {
        component: "pubsub-worker",
        operation: "messageHandler"
      }, {
        messageId,
        topic,
        shop: shopDomain
      });
    } else {
      // Failed to process - nack to retry
      message.nack();

      AppLogger.error("Message processing failed, will retry", {
        component: "pubsub-worker",
        operation: "messageHandler"
      }, {
        messageId,
        topic,
        shop: shopDomain,
        error: result.error
      });
    }

  } catch (error) {
    // Error processing message
    AppLogger.error("Error in message handler", {
      component: "pubsub-worker",
      operation: "messageHandler"
    }, error);

    // Nack to retry
    message.nack();
  }
}

/**
 * Error handler for subscription
 */
function errorHandler(error: Error) {
  AppLogger.error("Pub/Sub subscription error", {
    component: "pubsub-worker",
    operation: "errorHandler"
  }, error);
}

/**
 * Start the Pub/Sub worker
 */
export function startPubSubWorker() {
  AppLogger.info("Starting Pub/Sub worker", {
    component: "pubsub-worker",
    operation: "startPubSubWorker"
  }, {
    project: GOOGLE_CLOUD_PROJECT,
    subscription: PUBSUB_SUBSCRIPTION,
    config: WORKER_CONFIG
  });

  // Listen for messages
  subscription.on("message", messageHandler);

  // Listen for errors
  subscription.on("error", errorHandler);

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    AppLogger.info("Received SIGTERM, shutting down gracefully", {
      component: "pubsub-worker",
      operation: "shutdown"
    });

    try {
      await subscription.close();
      AppLogger.info("Pub/Sub worker stopped", {
        component: "pubsub-worker",
        operation: "shutdown"
      });
      process.exit(0);
    } catch (error) {
      AppLogger.error("Error during shutdown", {
        component: "pubsub-worker",
        operation: "shutdown"
      }, error);
      process.exit(1);
    }
  });

  AppLogger.info("Pub/Sub worker started and listening for messages", {
    component: "pubsub-worker",
    operation: "startPubSubWorker"
  });
}

/**
 * Stop the Pub/Sub worker
 */
export async function stopPubSubWorker() {
  AppLogger.info("Stopping Pub/Sub worker", {
    component: "pubsub-worker",
    operation: "stopPubSubWorker"
  });

  try {
    await subscription.close();
    AppLogger.info("Pub/Sub worker stopped", {
      component: "pubsub-worker",
      operation: "stopPubSubWorker"
    });
  } catch (error) {
    AppLogger.error("Error stopping Pub/Sub worker", {
      component: "pubsub-worker",
      operation: "stopPubSubWorker"
    }, error);
    throw error;
  }
}

// If running directly (not imported)
if (require.main === module) {
  startPubSubWorker();
}
