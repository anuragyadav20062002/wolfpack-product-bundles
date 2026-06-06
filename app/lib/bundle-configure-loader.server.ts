/**
 * Shared loader helpers for FPB and PPB configure pages.
 *
 * Both loaders share identical DB queries, Shopify GQL queries, and embed-check
 * logic. This module extracts those shared pieces so each route only handles
 * its own unique fields.
 */

import { AppLogger } from "./logger";
import { checkAppEmbedEnabled } from "../services/theme/app-embed-check.server";
import db from "../db.server";

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

const EMBED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — matches EB's HTTP ETag cache pattern

export async function fetchEmbedData(
  admin: any,
  shop: string,
  apiKey: string,
  embedBlockHandle = "bundle-app-embed",
): Promise<{ appEmbedEnabled: boolean; themeEditorUrl: string | null }> {
  // Check DB cache first — avoids hitting Shopify's settings_data.json on every page load
  const shopRecord = await db.shop.findUnique({
    where: { shopDomain: shop },
    select: { appEmbedEnabled: true, appEmbedCheckedAt: true, appEmbedThemeId: true },
  });

  const isCacheFresh =
    shopRecord?.appEmbedCheckedAt !== null &&
    shopRecord?.appEmbedEnabled !== null &&
    shopRecord?.appEmbedCheckedAt !== undefined &&
    Date.now() - shopRecord.appEmbedCheckedAt.getTime() < EMBED_CACHE_TTL_MS;

  if (isCacheFresh) {
    const themeEditorUrl = shopRecord!.appEmbedThemeId
      ? buildThemeEditorUrl(shop, shopRecord!.appEmbedThemeId, apiKey, embedBlockHandle)
      : null;
    return { appEmbedEnabled: shopRecord!.appEmbedEnabled!, themeEditorUrl };
  }

  // Cache miss or stale — fetch from Shopify
  const embedCheck = await checkAppEmbedEnabled(admin, shop, {
    blockHandles: [embedBlockHandle],
  });

  // Only persist when Shopify returned a valid theme ID (guards against network errors
  // returning { enabled: false, themeId: null } which would poison the cache)
  if (embedCheck.themeId !== null) {
    try {
      await db.shop.update({
        where: { shopDomain: shop },
        data: {
          appEmbedEnabled: embedCheck.enabled,
          appEmbedCheckedAt: new Date(),
          appEmbedThemeId: embedCheck.themeId,
        },
      });
    } catch (err) {
      AppLogger.warn("fetchEmbedData: failed to update app embed cache", { shop, err });
    }
  }

  const themeEditorUrl = embedCheck.themeId
    ? buildThemeEditorUrl(shop, embedCheck.themeId, apiKey, embedBlockHandle)
    : null;
  return { appEmbedEnabled: embedCheck.enabled, themeEditorUrl };
}

function buildThemeEditorUrl(
  shop: string,
  themeGid: string,
  apiKey: string,
  blockHandle: string,
): string {
  const themeNumericId = themeGid.split("/").pop();
  return `https://${shop}/admin/themes/${themeNumericId}/editor?context=apps&appEmbed=${apiKey}%2F${blockHandle}`;
}
