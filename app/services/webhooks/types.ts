/**
 * Type definitions for Webhook Processor
 *
 * Extracted from the main processor file for better organization.
 */

// Shopify AppSubscriptionStatus enum values
// https://shopify.dev/docs/api/admin-graphql/latest/enums/AppSubscriptionStatus
export type ShopifySubscriptionStatus =
  | "ACTIVE"
  | "CANCELLED"
  | "DECLINED"
  | "EXPIRED"
  | "FROZEN"
  | "PENDING";

export interface PubSubMessage {
  data: string; // base64 encoded JSON
  attributes: {
    "X-Shopify-Topic": string;
    "X-Shopify-Shop-Domain": string;
    "X-Shopify-Webhook-Id"?: string;
    "X-Shopify-API-Version"?: string;
  };
}

export interface WebhookProcessResult {
  success: boolean;
  message: string;
  error?: string;
}

// Payload interfaces for different webhook topics
export interface SubscriptionPayload {
  app_subscription?: {
    admin_graphql_api_id: string;
    name: string;
    status: ShopifySubscriptionStatus;
    created_at: string;
    updated_at: string;
    currency: string;
    capped_amount?: string;
  };
}

export interface PurchasePayload {
  app_purchase_one_time?: {
    admin_graphql_api_id: string;
    name: string;
    status: string;
    price: {
      amount: string;
      currency_code: string;
    };
    created_at: string;
  };
}

export interface ProductPayload {
  id?: number;
  admin_graphql_api_id?: string;
  title?: string;
  status?: string;
  variants?: Array<{
    id: number;
    inventory_quantity: number;
    inventory_policy: string;
  }>;
}

export interface CustomerDataRequestPayload {
  shop_id: number;
  shop_domain: string;
  customer: {
    id: number;
    email: string;
    phone?: string;
  };
  orders_requested?: number[];
  data_request?: {
    id: number;
  };
}

export interface CustomerRedactPayload {
  shop_id: number;
  shop_domain: string;
  customer: {
    id: number;
    email: string;
    phone?: string;
  };
  orders_to_redact?: number[];
}

export interface ShopRedactPayload {
  shop_id: number;
  shop_domain: string;
}
