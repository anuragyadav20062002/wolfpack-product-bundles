import type { authenticate } from "~/shopify.server";
import { AppLogger } from "../lib/logger";

type AdminApiContext = Awaited<ReturnType<typeof authenticate.admin>>["admin"];

export interface AddOnDiscountActivationResult {
  success: boolean;
  discountId?: string;
  functionId?: string;
  error?: string;
  alreadyExists?: boolean;
}

const ADDON_DISCOUNT_FUNCTION_TITLE = "bundle-discount-function";
const ADDON_DISCOUNT_TITLE = "Add On";

export class AddOnDiscountFunctionService {
  private static async getFunctionId(admin: AdminApiContext): Promise<string | null> {
    const QUERY = `
      query GetAddOnDiscountFunction {
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
        return fn.title === ADDON_DISCOUNT_FUNCTION_TITLE
          || fn.description === ADDON_DISCOUNT_FUNCTION_TITLE;
      });

      return match?.node?.id ?? null;
    } catch (error) {
      AppLogger.warn("Failed to resolve add-on discount function", {
        component: "addon-discount-function",
        operation: "resolve-function",
      }, error);
      return null;
    }
  }

  private static async findExistingDiscount(
    admin: AdminApiContext,
    functionId: string,
  ): Promise<{ id?: string; functionId?: string }> {
    const QUERY = `
      query FindAddOnAutomaticDiscount {
        discountNodes(first: 50) {
          edges {
            node {
              id
              discount {
                __typename
                ... on DiscountAutomaticApp {
                  title
                  status
                  appDiscountType {
                    functionId
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await admin.graphql(QUERY);
      const data = await response.json() as any;
      const match = data.data?.discountNodes?.edges?.find((edge: any) => {
        const discount = edge.node?.discount;
        return discount?.__typename === "DiscountAutomaticApp"
          && discount?.title === ADDON_DISCOUNT_TITLE
          && discount?.appDiscountType?.functionId === functionId;
      });

      return {
        id: match?.node?.id,
        functionId: match?.node?.discount?.appDiscountType?.functionId,
      };
    } catch (error) {
      AppLogger.warn("Failed to check existing add-on automatic discounts", {
        component: "addon-discount-function",
        operation: "check-existing",
      }, error);
      return {};
    }
  }

  private static async createAutomaticDiscount(
    admin: AdminApiContext,
    functionId: string,
  ): Promise<AddOnDiscountActivationResult> {
    const MUTATION = `
      mutation CreateAddOnAutomaticDiscount($automaticAppDiscount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
          automaticAppDiscount {
            discountId
            title
            status
            appDiscountType {
              functionId
            }
            combinesWith {
              orderDiscounts
              productDiscounts
              shippingDiscounts
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
          automaticAppDiscount: {
            title: ADDON_DISCOUNT_TITLE,
            functionId,
            startsAt: new Date().toISOString(),
            discountClasses: ["PRODUCT"],
            combinesWith: {
              orderDiscounts: true,
              productDiscounts: true,
              shippingDiscounts: false,
            },
          },
        },
      });
      const data = await response.json() as any;

      if (data.errors) {
        return {
          success: false,
          functionId,
          error: `GraphQL errors: ${data.errors.map((error: any) => error.message).join(", ")}`,
        };
      }

      const payload = data.data?.discountAutomaticAppCreate;
      const userErrors = payload?.userErrors ?? [];
      if (userErrors.length > 0) {
        return {
          success: false,
          functionId,
          error: `User errors: ${userErrors.map((error: any) => error.message).join(", ")}`,
        };
      }

      return {
        success: true,
        functionId,
        discountId: payload?.automaticAppDiscount?.discountId,
      };
    } catch (error) {
      return {
        success: false,
        functionId,
        error: error instanceof Error ? error.message : "Unknown add-on discount activation error",
      };
    }
  }

  static async completeSetup(
    admin: AdminApiContext,
    shopDomain: string,
  ): Promise<AddOnDiscountActivationResult> {
    AppLogger.info("Starting add-on discount function setup", {
      component: "addon-discount-function",
      operation: "complete-setup",
    }, { shopDomain });

    const functionId = await this.getFunctionId(admin);
    if (!functionId) {
      const error = `Discount function '${ADDON_DISCOUNT_FUNCTION_TITLE}' not found - has the app been deployed?`;
      AppLogger.warn(error, {
        component: "addon-discount-function",
        operation: "complete-setup",
      }, { shopDomain });
      return { success: false, error };
    }

    const existing = await this.findExistingDiscount(admin, functionId);
    if (existing.id) {
      return {
        success: true,
        functionId,
        discountId: existing.id,
        alreadyExists: true,
      };
    }

    const result = await this.createAutomaticDiscount(admin, functionId);
    if (!result.success) {
      AppLogger.warn("Add-on automatic discount setup failed", {
        component: "addon-discount-function",
        operation: "complete-setup",
      }, { shopDomain, error: result.error });
    }

    return result;
  }
}
