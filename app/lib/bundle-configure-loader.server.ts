/**
 * Shared loader helpers for FPB and PPB configure pages.
 *
 * Both loaders share identical DB queries, Shopify GQL queries, and embed-check
 * logic. This module extracts those shared pieces so each route only handles
 * its own unique fields.
 */

import { AppLogger } from "./logger";
import { checkAppEmbedEnabled } from "../services/theme/app-embed-check.server";
import {
  deployed_shopify_app_handles,
  theme_app_extension_handle,
} from "../config/shopify-app-handles.js";

function getThemeAppEmbedHandles() {
  const handles = [
    theme_app_extension_handle,
    process.env.SHOPIFY_APP_HANDLE,
    ...deployed_shopify_app_handles,
  ];

  return Array.from(
    new Set(
      handles
        .map((handle) => handle?.trim())
        .filter((handle): handle is string => Boolean(handle)),
    ),
  );
}

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
      featuredMedia {
        ... on MediaImage {
          id
          image {
            url
            altText
          }
        }
      }
      media(first: 5) {
        nodes {
          ... on MediaImage {
            id
            alt
            image {
              url
              altText
            }
          }
        }
      }
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
  embedBlockHandle = "bundle-app-embed",
): Promise<{ appEmbedEnabled: boolean; themeEditorUrl: string | null }> {
  const embedCheck = await checkAppEmbedEnabled(admin, shop, {
    appHandles: getThemeAppEmbedHandles(),
    blockHandles: [embedBlockHandle],
  });

  const themeEditorUrl = embedCheck.themeId && apiKey
    ? buildThemeAppEmbedEditorUrl(shop, embedCheck.themeId, apiKey, embedBlockHandle)
    : null;
  return { appEmbedEnabled: embedCheck.enabled, themeEditorUrl };
}

export function buildThemeAppEmbedEditorUrl(
  shop: string,
  themeGid: string,
  apiKey: string,
  blockHandle: string,
): string {
  const themeNumericId = themeGid.split("/").pop();
  return `https://${shop}/admin/themes/${themeNumericId}/editor?context=apps&activateAppId=${apiKey}%2F${blockHandle}`;
}
