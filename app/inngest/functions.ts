import { inngest } from "./client";
import { WebhookProcessor } from "../services/webhooks/processor.server";
import type { ShopifyWebhookEventData } from "./types";

/**
 * Inngest function: shopify-webhook
 *
 * Single durable function that handles all Shopify webhook topics.
 * Topic routing is handled inside WebhookProcessor — unchanged from the
 * existing direct-processing path.
 *
 * Retry behaviour: if the processor returns { success: false } or throws,
 * this function throws so Inngest marks the run as failed and retries it
 * (up to 3 attempts with exponential backoff).
 */
export const webhookFunction = inngest.createFunction(
  {
    id: "shopify-webhook",
    retries: 3,
  },
  { event: "shopify/webhook" as const },
  async ({ event }: { event: { data: ShopifyWebhookEventData } }) => {
    const { rawPayload, topic, shopDomain, webhookId, apiVersion } = event.data;

    const result = await WebhookProcessor.processPubSubMessage({
      data: rawPayload,
      attributes: {
        "X-Shopify-Topic": topic,
        "X-Shopify-Shop-Domain": shopDomain,
        ...(webhookId !== undefined && { "X-Shopify-Webhook-Id": webhookId }),
        ...(apiVersion !== undefined && { "X-Shopify-API-Version": apiVersion }),
      },
    });

    if (!result.success) {
      // Throw so Inngest marks this run as failed and schedules a retry.
      throw new Error(result.error ?? result.message ?? "Webhook processing failed");
    }

    return { processed: true, message: result.message };
  },
);
