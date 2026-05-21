/**
 * Shared loader helpers for FPB and PPB configure pages.
 *
 * Both loaders share identical DB queries, Shopify GQL queries, and embed-check
 * logic. This module extracts those shared pieces so each route only handles
 * its own unique fields.
 */

import { AppLogger } from "./logger";
import { checkAppEmbedEnabled } from "../services/theme/app-embed-check.server";

const GET_BUNDLE_PRODUCT = `
  query GetBundleProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      status
      onlineStoreUrl
      onlineStorePreviewUrl
      description
      productType
      vendor
      tags
      variants(first: 1) {
        edges {
          node {
            id
            title
            price
          }
        }
      }
    }
  }
`;

const GET_SHOP_LOCALES = `
  query GetShopLocales {
    shopLocales {
      locale
      name
      primary
      published
    }
  }
`;

export async function fetchBundleProduct(
  admin: any,
  shopifyProductId: string,
  bundleId: string
): Promise<any> {
  try {
    const response = await admin.graphql(GET_BUNDLE_PRODUCT, {
      variables: { id: shopifyProductId },
    });
    const data = await response.json();
    return data.data?.product ?? null;
  } catch (error) {
    AppLogger.warn("Failed to fetch bundle product", {
      component: "bundle-config",
      bundleId,
      operation: "fetch-product",
    }, error);
    return null;
  }
}

export async function fetchShopLocales(
  admin: any
): Promise<{ locale: string; name: string; primary: boolean }[]> {
  try {
    const response = await admin.graphql(GET_SHOP_LOCALES);
    const data = await response.json() as {
      data?: {
        shopLocales?: {
          locale: string;
          name: string;
          primary: boolean;
          published: boolean;
        }[];
      };
    };
    return (data.data?.shopLocales ?? []).filter((l) => l.published);
  } catch {
    // Non-critical — fall back to English-only mode
    return [];
  }
}

export async function fetchEmbedData(
  admin: any,
  shop: string,
  apiKey: string,
  embedBlockHandle = "bundle-full-page-embed",
): Promise<{ appEmbedEnabled: boolean; themeEditorUrl: string | null }> {
  const embedCheck = await checkAppEmbedEnabled(admin, shop, {
    blockHandles: [embedBlockHandle],
  });
  const themeEditorUrl = embedCheck.themeId
    ? `https://${shop}/admin/themes/${embedCheck.themeId.split("/").pop()}/editor?context=apps&appEmbed=${apiKey}%2F${embedBlockHandle}`
    : null;
  return { appEmbedEnabled: embedCheck.enabled, themeEditorUrl };
}
