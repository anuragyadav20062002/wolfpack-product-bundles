import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import db from "../../../../db.server";
import { BundleType } from "../../../../constants/bundle";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import {
  deriveCommonSellingPlanGroups,
  extractSellingPlanValidationSources,
  SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
} from "../../../../lib/bundle-config/product-page-admin-sections";

async function fetchProductsWithSellingPlanGroups(admin: ShopifyAdmin, productIds: string[]) {
  const products: Array<{
    id: string;
    title: string;
    sellingPlanGroups: { nodes: Array<{ id: string; name: string }> };
  }> = [];

  const query = `
    query ProductsWithSellingPlanGroups($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          title
          sellingPlanGroups(first: 50) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  `;

  for (let index = 0; index < productIds.length; index += 50) {
    const ids = productIds.slice(index, index + 50);
    const response = await admin.graphql(query, { variables: { ids } });
    const data = await response.json() as {
      data?: {
        nodes?: Array<{
          id?: string;
          title?: string;
          sellingPlanGroups?: { nodes?: Array<{ id?: string; name?: string }> };
        } | null>;
      };
    };

    for (const product of data.data?.nodes ?? []) {
      if (!product?.id) continue;
      products.push({
        id: product.id,
        title: product.title ?? "",
        sellingPlanGroups: {
          nodes: (product.sellingPlanGroups?.nodes ?? [])
            .filter((group): group is { id: string; name: string } => (
              typeof group?.id === "string" && typeof group?.name === "string"
            )),
        },
      });
    }
  }

  return products;
}

async function fetchCollectionProductIds(admin: ShopifyAdmin, collectionIds: string[]) {
  const products: string[] = [];
  const seen = new Set<string>();

  const query = `
    query CollectionProductsForSellingPlanValidation($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Collection {
          products(first: 250) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  `;

  for (let index = 0; index < collectionIds.length; index += 50) {
    const ids = collectionIds.slice(index, index + 50);
    const response = await admin.graphql(query, { variables: { ids } });
    const data = await response.json() as {
      data?: {
        nodes?: Array<{
          id?: string;
          products?: {
            edges?: Array<{ node?: { id?: string } }>;
          };
        }>;
      };
    };

    for (const collection of data.data?.nodes ?? []) {
      if (!collection) continue;
      const edges = collection?.products?.edges ?? [];
      for (const edge of edges) {
        const productId = edge.node?.id;
        if (typeof productId !== "string" || productId.trim() === "") continue;
        if (seen.has(productId)) continue;
        seen.add(productId);
        products.push(productId);
      }
    }
  }

  return products;
}

export async function handleValidateSellingPlanGroups(admin: ShopifyAdmin, session: Session, bundleId: string) {
  const bundle = await db.bundle.findFirst({
    where: {
      id: bundleId,
      shopId: session.shop,
      bundleType: BundleType.PRODUCT_PAGE,
    },
    include: {
      steps: {
        include: {
          StepProduct: true,
          StepCategory: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!bundle) {
    return json({ success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND }, { status: 404 });
  }

  const sources = extractSellingPlanValidationSources(bundle);
  const collectionProductIds = await fetchCollectionProductIds(admin, sources.collectionIds);
  const allProductIds = Array.from(new Set([...sources.productIds, ...collectionProductIds]));
  if (allProductIds.length === 0) {
    return json({
      success: true,
      isValid: false,
      productCount: 0,
      plans: [],
      message: SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
    });
  }

  const products = await fetchProductsWithSellingPlanGroups(admin, allProductIds);
  const plans = deriveCommonSellingPlanGroups(products);
  const isValid = allProductIds.length > 0 && products.length === allProductIds.length && plans.length > 0;

  return json({
    success: true,
    isValid,
    productCount: products.length,
    plans,
    message: isValid ? null : SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
  });
}
