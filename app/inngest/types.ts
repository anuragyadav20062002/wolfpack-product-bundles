/**
 * Inngest event types for Shopify webhook queue.
 */

export interface ShopifyWebhookEventData {
  /** Raw Shopify webhook body, base64-encoded — matches PubSubMessage.data format */
  rawPayload: string;
  /** Shopify topic, e.g. "inventory_levels/update" */
  topic: string;
  /** Shop domain, e.g. "store.myshopify.com" */
  shopDomain: string;
  /** Shopify webhook ID for idempotency (undefined for older webhook formats) */
  webhookId?: string;
  /** Shopify API version from X-Shopify-API-Version header */
  apiVersion?: string;
}

export type ShopifyWebhookEvents = {
  "shopify/webhook": { data: ShopifyWebhookEventData };
};
