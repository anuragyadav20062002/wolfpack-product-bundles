/**
 * Webhook Module - Re-exports for easy importing
 */

// Main processor
export { WebhookProcessor } from './processor.server';

// Types
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
} from './types';

// Handlers (for testing/direct access)
export {
  handleSubscriptionUpdate,
  handleSubscriptionCancelled,
  handleSubscriptionApproachingCap,
  handlePurchaseUpdate,
  mapSubscriptionStatus,
  handleProductUpdate,
  handleProductDelete,
  handleCustomerDataRequest,
  handleCustomerRedact,
  handleShopRedact,
} from './handlers';
