import { SHOPIFY_REST_API_VERSION } from "../../constants/api";

/**
 * Writes the DCP storefront iframe preview templates to the merchant's active theme
 * via the Shopify Admin REST API (Theme Asset resource).
 *
 * Templates written:
 *   templates/product.product-page-bundle.json  — for ?view=product-page-bundle
 *   templates/page.full-page-bundle.json        — for ?view=full-page-bundle
 *
 * Both templates contain only our app block as the sole section, making them
 * theme-agnostic and always available on any product or page URL.
 *
 * Idempotent — safe to call on every DCP load. Uses an in-memory per-shop cache
 * to avoid redundant API calls within the same server process lifecycle.
 *
 * Requires SHOPIFY_APP_HANDLE env var — the app handle from the Shopify Partner
 * Dashboard (e.g. "wolfpack-product-bundles-4" for PROD, "wolfpack-product-bundles-sit" for SIT).
 */

const GET_ACTIVE_THEME_QUERY = `#graphql
  query GetActiveTheme {
    themes(first: 1, roles: MAIN) {
      nodes { id }
    }
  }
`;

// In-memory cache: skip re-writing templates for shops already processed this session.
const writtenForShop = new Set<string>();

export async function ensurePreviewTemplates(
  admin: { graphql: (query: string) => Promise<Response> },
  session: { shop: string; accessToken?: string | null },
): Promise<void> {
  const appHandle = process.env.SHOPIFY_APP_HANDLE;
  if (!appHandle) {
    console.warn("[ensurePreviewTemplates] SHOPIFY_APP_HANDLE not set — skipping preview template write");
    return;
  }

  if (writtenForShop.has(session.shop)) return;

  try {
    // 1. Get active theme ID via GraphQL
    const themeRes = await admin.graphql(GET_ACTIVE_THEME_QUERY);
    const themeData = await themeRes.json() as { data?: { themes?: { nodes?: Array<{ id: string }> } } };
    const themeGid = themeData.data?.themes?.nodes?.[0]?.id;
    if (!themeGid) return;

    const themeId = themeGid.split("/").pop();
    const { shop, accessToken } = session;
    const headers = {
      "X-Shopify-Access-Token": accessToken ?? "",
      "Content-Type": "application/json",
    };
    const baseUrl = `https://${shop}/admin/api/${SHOPIFY_REST_API_VERSION}/themes/${themeId}/assets.json`;

    // 2. Write both preview templates via REST Asset API
    const templates: Array<{ key: string; blockType: string }> = [
      {
        key: "templates/product.product-page-bundle.json",
        blockType: `shopify://apps/${appHandle}/blocks/bundle-product-page`,
      },
      {
        key: "templates/page.full-page-bundle.json",
        blockType: `shopify://apps/${appHandle}/blocks/bundle-full-page`,
      },
    ];

    await Promise.all(
      templates.map(({ key, blockType }) =>
        fetch(baseUrl, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            asset: {
              key,
              value: JSON.stringify(
                {
                  sections: {
                    bundle: { type: blockType, settings: {} },
                  },
                  order: ["bundle"],
                },
                null,
                2,
              ),
            },
          }),
        }),
      ),
    );

    writtenForShop.add(session.shop);
  } catch (err) {
    // Non-fatal — DCP still works without the iframe preview
    console.error("[ensurePreviewTemplates] Failed to write preview templates:", err);
  }
}
