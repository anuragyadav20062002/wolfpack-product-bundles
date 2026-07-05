import type { authenticate } from "~/shopify.server";
import {
  CHECKOUT_INTEGRATION_PROVIDER_LABELS,
  type DiscountCodeCheckoutIntegrationProviderId,
} from "../lib/checkout-integrations";
import { AppLogger } from "../lib/logger";

type AdminApiContext = Awaited<ReturnType<typeof authenticate.admin>>["admin"];

export interface CheckoutIntegrationDiscountCodeResult {
  success: boolean;
  providerId: DiscountCodeCheckoutIntegrationProviderId;
  discountId?: string;
  code?: string;
  expiresAt?: string;
  functionId?: string;
  error?: string;
}

const DISCOUNT_FUNCTION_TITLE = "bundle-discount-function";

export const CHECKOUT_INTEGRATION_DISCOUNT_PREFIX = "WPB-";
export const CHECKOUT_INTEGRATION_DISCOUNT_CODE_TTL_MS = 30 * 60 * 1000;

export class CheckoutIntegrationDiscountCodeService {
  private static async getFunctionId(admin: AdminApiContext): Promise<string | null> {
    const QUERY = `
      query GetCheckoutIntegrationDiscountFunction {
        shopifyFunctions(first: 50) {
          edges {
            node {
              id
              title
              apiType
              description
            }
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(QUERY);
      const data = await response.json() as any;
      const edges = data.data?.shopifyFunctions?.edges ?? [];
      const match = edges.find((edge: any) => {
        const fn = edge.node;
        return fn.title === DISCOUNT_FUNCTION_TITLE
          || fn.description === DISCOUNT_FUNCTION_TITLE;
      });

      return match?.node?.id ?? null;
    } catch (error) {
      AppLogger.warn("Failed to resolve checkout integration discount function", {
        component: "checkout-integration-discount-code",
        operation: "resolve-function",
      }, error);
      return null;
    }
  }

  private static buildCode(providerId: DiscountCodeCheckoutIntegrationProviderId): string {
    const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    return `${CHECKOUT_INTEGRATION_DISCOUNT_PREFIX}${providerId.toUpperCase()}-${randomPart}`;
  }

  static async createForProvider(
    admin: AdminApiContext,
    shopDomain: string,
    providerId: DiscountCodeCheckoutIntegrationProviderId,
  ): Promise<CheckoutIntegrationDiscountCodeResult> {
    const functionId = await this.getFunctionId(admin);
    if (!functionId) {
      return {
        success: false,
        providerId,
        error: `Discount function '${DISCOUNT_FUNCTION_TITLE}' not found - has the app been deployed?`,
      };
    }

    const now = Date.now();
    const startsAt = new Date(now - 60 * 1000).toISOString();
    const expiresAt = new Date(now + CHECKOUT_INTEGRATION_DISCOUNT_CODE_TTL_MS).toISOString();
    const code = this.buildCode(providerId);
    const providerLabel = CHECKOUT_INTEGRATION_PROVIDER_LABELS[providerId];

    const MUTATION = `
      mutation CreateCheckoutIntegrationCode($codeAppDiscount: DiscountCodeAppInput!) {
        discountCodeAppCreate(codeAppDiscount: $codeAppDiscount) {
          codeAppDiscount {
            discountId
            endsAt
            codes(first: 1) {
              nodes {
                code
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(MUTATION, {
        variables: {
          codeAppDiscount: {
            title: `WPB checkout integration - ${providerLabel}`,
            code,
            functionId,
            startsAt,
            endsAt: expiresAt,
            usageLimit: 1,
            appliesOncePerCustomer: false,
            discountClasses: ["PRODUCT"],
            combinesWith: {
              orderDiscounts: true,
              productDiscounts: true,
              shippingDiscounts: false,
            },
            metafields: [{
              namespace: "$app",
              key: "checkout_integration_config",
              type: "json",
              value: JSON.stringify({
                mode: "checkout_integration",
                providerId,
                shopDomain,
                ttlMs: CHECKOUT_INTEGRATION_DISCOUNT_CODE_TTL_MS,
              }),
            }],
          },
        },
      });
      const data = await response.json() as any;

      if (data.errors) {
        return {
          success: false,
          providerId,
          functionId,
          error: `GraphQL errors: ${data.errors.map((error: any) => error.message).join(", ")}`,
        };
      }

      const payload = data.data?.discountCodeAppCreate;
      const userErrors = payload?.userErrors ?? [];
      if (userErrors.length > 0) {
        return {
          success: false,
          providerId,
          functionId,
          error: `User errors: ${userErrors.map((error: any) => error.message).join(", ")}`,
        };
      }

      return {
        success: true,
        providerId,
        functionId,
        discountId: payload?.codeAppDiscount?.discountId,
        code: payload?.codeAppDiscount?.codes?.nodes?.[0]?.code ?? code,
        expiresAt: payload?.codeAppDiscount?.endsAt ?? expiresAt,
      };
    } catch (error) {
      return {
        success: false,
        providerId,
        functionId,
        error: error instanceof Error ? error.message : "Unknown checkout integration discount code error",
      };
    }
  }
}
