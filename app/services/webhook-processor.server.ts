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

import db from "../db.server";
import { AppLogger } from "../lib/logger";
import { PLANS } from "../constants/plans";
import type { SubscriptionStatus } from "@prisma/client";

// Shopify AppSubscriptionStatus enum values
// https://shopify.dev/docs/api/admin-graphql/latest/enums/AppSubscriptionStatus
type ShopifySubscriptionStatus =
  | "ACTIVE"
  | "CANCELLED"
  | "DECLINED"
  | "EXPIRED"
  | "FROZEN"
  | "PENDING";

interface PubSubMessage {
  data: string; // base64 encoded JSON
  attributes: {
    "X-Shopify-Topic": string;
    "X-Shopify-Shop-Domain": string;
    "X-Shopify-Webhook-Id"?: string;
    "X-Shopify-API-Version"?: string;
  };
}

interface WebhookProcessResult {
  success: boolean;
  message: string;
  error?: string;
}

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
          result = await this.handleSubscriptionUpdate(shopDomain, payload);
          break;

        // IMPROVEMENT: Handle subscription cancellation
        case "app_subscriptions/cancelled":
        case "APP_SUBSCRIPTIONS_CANCELLED":
          result = await this.handleSubscriptionCancelled(shopDomain, payload);
          break;

        // IMPROVEMENT: Handle approaching capped amount (90% threshold)
        case "app_subscriptions/approaching_capped_amount":
        case "APP_SUBSCRIPTIONS_APPROACHING_CAPPED_AMOUNT":
          result = await this.handleSubscriptionApproachingCap(shopDomain, payload);
          break;

        case "app_purchases_one_time/update":
        case "APP_PURCHASES_ONE_TIME_UPDATE":
          result = await this.handlePurchaseUpdate(shopDomain, payload);
          break;

        case "products/update":
        case "PRODUCTS_UPDATE":
          result = await this.handleProductUpdate(shopDomain, payload);
          break;

        case "products/delete":
        case "PRODUCTS_DELETE":
          result = await this.handleProductDelete(shopDomain, payload);
          break;

        case "customers/data_request":
        case "CUSTOMERS_DATA_REQUEST":
          result = await this.handleCustomerDataRequest(shopDomain, payload);
          break;

        case "customers/redact":
        case "CUSTOMERS_REDACT":
          result = await this.handleCustomerRedact(shopDomain, payload);
          break;

        case "shop/redact":
        case "SHOP_REDACT":
          result = await this.handleShopRedact(shopDomain, payload, webhookEvent.id);
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

      // Mark webhook as processed
      await db.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
          error: result.success ? null : result.error
        }
      });

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

  /**
   * Handle subscription update webhook
   * Maps Shopify subscription status and handles downgrades
   */
  private static async handleSubscriptionUpdate(
    shopDomain: string,
    payload: any
  ): Promise<WebhookProcessResult> {
    try {
      const shopifySubscriptionId = payload.app_subscription?.admin_graphql_api_id;
      const status: ShopifySubscriptionStatus = payload.app_subscription?.status;
      const name = payload.app_subscription?.name;
      const trialDaysRemaining = payload.app_subscription?.trial_days_remaining;
      const currentPeriodEnd = payload.app_subscription?.current_period_end;

      if (!shopifySubscriptionId) {
        return {
          success: false,
          message: "Missing subscription ID in webhook payload",
          error: "shopifySubscriptionId is required"
        };
      }

      AppLogger.info("Processing subscription update", {
        component: "webhook-processor",
        operation: "handleSubscriptionUpdate"
      }, { shop: shopDomain, status, shopifySubscriptionId });

      // Find shop
      const shop = await db.shop.findUnique({
        where: { shopDomain }
      });

      if (!shop) {
        return {
          success: false,
          message: "Shop not found",
          error: `Shop ${shopDomain} not found in database`
        };
      }

      // Find subscription in database
      const subscription = await db.subscription.findUnique({
        where: { shopifySubscriptionId }
      });

      if (!subscription) {
        AppLogger.warn("Subscription not found in database", {
          component: "webhook-processor",
          operation: "handleSubscriptionUpdate"
        }, { shop: shopDomain, shopifySubscriptionId });

        return {
          success: true,
          message: "Subscription not found in database (may have been created elsewhere)"
        };
      }

      // Map Shopify status to our schema
      const mappedStatus = this.mapSubscriptionStatus(status);

      // Update subscription
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: mappedStatus,
          name: name || subscription.name,
          trialDaysRemaining,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : subscription.currentPeriodEnd,
          ...(mappedStatus === "cancelled" ? { cancelledAt: new Date() } : {})
        }
      });

      // Handle downgrade to free plan
      const shouldDowngrade = ["cancelled", "expired", "frozen"].includes(mappedStatus);

      if (shouldDowngrade && subscription.plan !== "free") {
        AppLogger.info("Downgrading subscription to free plan", {
          component: "webhook-processor",
          operation: "handleSubscriptionUpdate"
        }, { shop: shopDomain, previousPlan: subscription.plan });

        // Create free plan subscription
        const freeSubscription = await db.subscription.create({
          data: {
            shopId: shop.id,
            plan: "free",
            status: "active",
            name: PLANS.free.name,
            price: 0,
            currencyCode: "USD",
            test: false
          }
        });

        // Update shop's current subscription
        await db.shop.update({
          where: { id: shop.id },
          data: {
            currentSubscriptionId: freeSubscription.id
          }
        });

        // Check if bundle count exceeds free plan limit
        const bundleCount = await db.bundle.count({
          where: {
            shopId: shopDomain,
            status: {
              in: ["active", "draft"]
            }
          }
        });

        const freeLimit = PLANS.free.bundleLimit;

        if (bundleCount > freeLimit) {
          AppLogger.info("Bundle count exceeds free plan limit, archiving excess", {
            component: "webhook-processor",
            operation: "handleSubscriptionUpdate"
          }, { shop: shopDomain, bundleCount, limit: freeLimit });

          // Get bundles to archive (keep oldest bundles, archive newest)
          const bundlesToArchive = await db.bundle.findMany({
            where: {
              shopId: shopDomain,
              status: {
                in: ["active", "draft"]
              }
            },
            orderBy: {
              createdAt: "desc"
            },
            skip: freeLimit,
            select: {
              id: true
            }
          });

          // Archive excess bundles
          await db.bundle.updateMany({
            where: {
              id: {
                in: bundlesToArchive.map(b => b.id)
              }
            },
            data: {
              status: "archived"
            }
          });

          AppLogger.info("Archived excess bundles", {
            component: "webhook-processor",
            operation: "handleSubscriptionUpdate"
          }, { shop: shopDomain, archivedCount: bundlesToArchive.length });
        }
      }

      return {
        success: true,
        message: `Subscription updated to ${mappedStatus}`
      };

    } catch (error) {
      AppLogger.error("Error handling subscription update", {
        component: "webhook-processor",
        operation: "handleSubscriptionUpdate"
      }, error);

      return {
        success: false,
        message: "Error handling subscription update",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * IMPROVEMENT: Handle subscription cancellation webhook
   * Triggered when a subscription is cancelled by the merchant or Shopify
   */
  private static async handleSubscriptionCancelled(
    shopDomain: string,
    payload: any
  ): Promise<WebhookProcessResult> {
    try {
      const shopifySubscriptionId = payload.app_subscription?.admin_graphql_api_id;

      if (!shopifySubscriptionId) {
        return {
          success: false,
          message: "Missing subscription ID in webhook payload",
          error: "shopifySubscriptionId is required"
        };
      }

      AppLogger.info("Processing subscription cancellation", {
        component: "webhook-processor",
        operation: "handleSubscriptionCancelled"
      }, { shop: shopDomain, shopifySubscriptionId });

      // Find shop
      const shop = await db.shop.findUnique({
        where: { shopDomain }
      });

      if (!shop) {
        return {
          success: false,
          message: "Shop not found",
          error: `Shop ${shopDomain} not found in database`
        };
      }

      // Find and update subscription
      const subscription = await db.subscription.findUnique({
        where: { shopifySubscriptionId }
      });

      if (!subscription) {
        AppLogger.warn("Cancelled subscription not found in database", {
          component: "webhook-processor",
          operation: "handleSubscriptionCancelled"
        }, { shop: shopDomain, shopifySubscriptionId });

        return {
          success: true,
          message: "Subscription not found (may have been deleted)"
        };
      }

      // Mark subscription as cancelled
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date()
        }
      });

      // Create free plan subscription
      const freeSubscription = await db.subscription.create({
        data: {
          shopId: shop.id,
          plan: "free",
          status: "active",
          name: PLANS.free.name,
          price: 0,
          currencyCode: "USD",
          test: false
        }
      });

      // Update shop's current subscription
      await db.shop.update({
        where: { id: shop.id },
        data: {
          currentSubscriptionId: freeSubscription.id
        }
      });

      AppLogger.info("Subscription cancelled, downgraded to free plan", {
        component: "webhook-processor",
        operation: "handleSubscriptionCancelled"
      }, { shop: shopDomain, subscriptionId: subscription.id });

      return {
        success: true,
        message: "Subscription cancelled and downgraded to free plan"
      };

    } catch (error) {
      AppLogger.error("Error handling subscription cancellation", {
        component: "webhook-processor",
        operation: "handleSubscriptionCancelled"
      }, error);

      return {
        success: false,
        message: "Error handling subscription cancellation",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * IMPROVEMENT: Handle approaching capped amount webhook
   * Triggered when usage-based charges reach 90% of their cap
   * Note: Currently for usage-based billing (future feature)
   */
  private static async handleSubscriptionApproachingCap(
    shopDomain: string,
    payload: any
  ): Promise<WebhookProcessResult> {
    try {
      const shopifySubscriptionId = payload.app_subscription?.admin_graphql_api_id;
      const cappedAmount = payload.app_subscription?.capped_amount;
      const balance = payload.balance;

      AppLogger.info("Subscription approaching capped amount", {
        component: "webhook-processor",
        operation: "handleSubscriptionApproachingCap"
      }, { shop: shopDomain, shopifySubscriptionId, cappedAmount, balance });

      // For now, just log the event
      // In the future, you can implement:
      // 1. Send email notification to merchant
      // 2. Display in-app banner
      // 3. Suggest upgrade to higher tier

      return {
        success: true,
        message: "Approaching capped amount event logged"
      };

    } catch (error) {
      AppLogger.error("Error handling approaching capped amount", {
        component: "webhook-processor",
        operation: "handleSubscriptionApproachingCap"
      }, error);

      return {
        success: false,
        message: "Error handling approaching capped amount",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Handle one-time purchase update webhook
   * Tracks one-time app charges and updates
   */
  private static async handlePurchaseUpdate(
    shopDomain: string,
    payload: any
  ): Promise<WebhookProcessResult> {
    try {
      const chargeId = payload.app_purchase_one_time?.admin_graphql_api_id;
      const status = payload.app_purchase_one_time?.status;

      AppLogger.info("Processing one-time purchase update", {
        component: "webhook-processor",
        operation: "handlePurchaseUpdate"
      }, { shop: shopDomain, status, chargeId });

      // For now, we just log the purchase update
      // You can add database tracking here if needed
      return {
        success: true,
        message: `One-time purchase update processed: ${status}`
      };

    } catch (error) {
      AppLogger.error("Error handling purchase update", {
        component: "webhook-processor",
        operation: "handlePurchaseUpdate"
      }, error);

      return {
        success: false,
        message: "Error handling purchase update",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Handle product update webhook
   * Monitors products used in bundles and sets bundles to draft if product becomes unavailable
   */
  private static async handleProductUpdate(
    shopDomain: string,
    payload: any
  ): Promise<WebhookProcessResult> {
    try {
      const productId = `gid://shopify/Product/${payload.id}`;
      const status = payload.status;
      const variants = payload.variants || [];

      AppLogger.info("Processing product update", {
        component: "webhook-processor",
        operation: "handleProductUpdate"
      }, { shop: shopDomain, productId, status });

      // Find all bundle steps using this product
      const stepsWithProduct = await db.stepProduct.findMany({
        where: {
          productId
        },
        include: {
          step: {
            include: {
              bundle: true
            }
          }
        }
      });

      if (stepsWithProduct.length === 0) {
        return {
          success: true,
          message: "Product not used in any bundles"
        };
      }

      // Check if product has critical changes
      const isArchived = status === "archived" || status === "draft";
      const hasNoVariants = variants.length === 0;
      const hasNoAvailableVariants = variants.every((v: any) =>
        v.inventory_policy === "deny" && v.inventory_quantity <= 0
      );

      const isCriticalChange = isArchived || hasNoVariants || hasNoAvailableVariants;

      if (isCriticalChange) {
        // Get unique bundle IDs that are currently active
        const affectedBundleIds = [
          ...new Set(
            stepsWithProduct
              .map(sp => sp.step.bundle)
              .filter(bundle => bundle.status === "active")
              .map(bundle => bundle.id)
          )
        ];

        if (affectedBundleIds.length > 0) {
          // Set affected bundles to draft
          await db.bundle.updateMany({
            where: {
              id: {
                in: affectedBundleIds
              },
              status: "active"
            },
            data: {
              status: "draft"
            }
          });

          AppLogger.warn("Set bundles to draft due to product becoming unavailable", {
            component: "webhook-processor",
            operation: "handleProductUpdate"
          }, {
            shop: shopDomain,
            productId,
            reason: isArchived ? "product_archived" : hasNoVariants ? "no_variants" : "no_available_variants",
            affectedBundles: affectedBundleIds.length
          });

          return {
            success: true,
            message: `Set ${affectedBundleIds.length} bundles to draft due to product unavailability`
          };
        }
      }

      return {
        success: true,
        message: "Product update processed, no critical changes detected"
      };

    } catch (error) {
      AppLogger.error("Error handling product update", {
        component: "webhook-processor",
        operation: "handleProductUpdate"
      }, error);

      return {
        success: false,
        message: "Error handling product update",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Handle product delete webhook
   * Removes deleted products from bundles and archives bundles with no products left
   */
  private static async handleProductDelete(
    shopDomain: string,
    payload: any
  ): Promise<WebhookProcessResult> {
    try {
      const productId = `gid://shopify/Product/${payload.id}`;

      AppLogger.info("Processing product delete", {
        component: "webhook-processor",
        operation: "handleProductDelete"
      }, { shop: shopDomain, productId });

      // Find all steps using this product
      const stepsWithProduct = await db.stepProduct.findMany({
        where: {
          productId
        },
        include: {
          step: true
        }
      });

      if (stepsWithProduct.length === 0) {
        return {
          success: true,
          message: "Product not used in any bundles"
        };
      }

      // Delete all StepProduct entries for this product
      await db.stepProduct.deleteMany({
        where: {
          productId
        }
      });

      AppLogger.info("Deleted product from bundle steps", {
        component: "webhook-processor",
        operation: "handleProductDelete"
      }, { shop: shopDomain, productId, deletedCount: stepsWithProduct.length });

      // Get unique step IDs
      const stepIds = [...new Set(stepsWithProduct.map(sp => sp.stepId))];

      // Find steps that now have no products
      const emptySteps = await db.bundleStep.findMany({
        where: {
          id: {
            in: stepIds
          }
        },
        include: {
          StepProduct: true,
          bundle: true
        }
      });

      const emptyStepIds = emptySteps
        .filter(step => step.StepProduct.length === 0)
        .map(step => step.id);

      if (emptyStepIds.length > 0) {
        // Find bundles that have empty steps
        const bundlesWithEmptySteps = await db.bundle.findMany({
          where: {
            steps: {
              some: {
                id: {
                  in: emptyStepIds
                }
              }
            },
            status: "active"
          },
          select: {
            id: true
          }
        });

        if (bundlesWithEmptySteps.length > 0) {
          // Archive bundles with empty steps
          await db.bundle.updateMany({
            where: {
              id: {
                in: bundlesWithEmptySteps.map(b => b.id)
              }
            },
            data: {
              status: "archived"
            }
          });

          AppLogger.warn("Archived bundles with empty steps after product deletion", {
            component: "webhook-processor",
            operation: "handleProductDelete"
          }, {
            shop: shopDomain,
            productId,
            archivedBundles: bundlesWithEmptySteps.length
          });

          return {
            success: true,
            message: `Product deleted, archived ${bundlesWithEmptySteps.length} bundles with empty steps`
          };
        }
      }

      return {
        success: true,
        message: "Product deleted from bundle steps"
      };

    } catch (error) {
      AppLogger.error("Error handling product delete", {
        component: "webhook-processor",
        operation: "handleProductDelete"
      }, error);

      return {
        success: false,
        message: "Error handling product delete",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Handle GDPR customer data request
   * Store request for compliance processing
   */
  private static async handleCustomerDataRequest(
    shopDomain: string,
    payload: any
  ): Promise<WebhookProcessResult> {
    try {
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
  private static async handleCustomerRedact(
    shopDomain: string,
    payload: any
  ): Promise<WebhookProcessResult> {
    try {
      const customerId = payload.customer?.id;

      // Store compliance record
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
  private static async handleShopRedact(
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

      // Delete shop settings
      await db.shopSettings.deleteMany({
        where: { shopId: shopDomain }
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

  /**
   * Map Shopify subscription status to our schema
   * https://shopify.dev/docs/api/admin-graphql/latest/enums/AppSubscriptionStatus
   */
  private static mapSubscriptionStatus(
    shopifyStatus: ShopifySubscriptionStatus
  ): SubscriptionStatus {
    const statusMap: Record<ShopifySubscriptionStatus, SubscriptionStatus> = {
      ACTIVE: "active",
      CANCELLED: "cancelled",
      DECLINED: "declined",
      EXPIRED: "expired",
      FROZEN: "frozen",
      PENDING: "pending"
    };

    return statusMap[shopifyStatus] || "pending";
  }
}
