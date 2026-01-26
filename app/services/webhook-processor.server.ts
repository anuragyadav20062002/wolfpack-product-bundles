/**
 * Webhook Processor Service
 *
 * Re-exports from the refactored webhooks module for backward compatibility.
 *
 * @see ./webhooks/processor.server.ts for the main implementation
 * @see ./webhooks/handlers/ for individual webhook handlers
 */

export { WebhookProcessor } from './webhooks';
export type {
  ShopifySubscriptionStatus,
  PubSubMessage,
  WebhookProcessResult,
  SubscriptionPayload,
  PurchasePayload,
  ProductPayload,
  CustomerDataRequestPayload,
  CustomerRedactPayload,
  ShopRedactPayload,
} from './webhooks';
