import type { ShopifyAdmin } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";

export interface AppEmbedCheckResult {
  enabled: boolean;
  themeId: string | null;
}

interface AppEmbedCheckOptions {
  blockHandles?: string[];
}

const WOLFPACK_APP_HANDLES = [
  "wolfpack-product-bundles",
  "wolfpack-product-bundles-4",
  "wolfpack-product-bundles-sit",
];

function isWolfpackEmbedBlock(
  key: string,
  value: { disabled?: boolean; type?: string } | undefined,
  blockHandles?: string[],
) {
  if (value?.disabled === true) return false;

  const blockRef = `${key} ${value?.type ?? ""}`;
  const matchesApp = WOLFPACK_APP_HANDLES.some((handle) =>
    blockRef.includes(`shopify://apps/${handle}/blocks/`),
  );
  if (!matchesApp) return false;

  if (!blockHandles?.length) return true;
  return blockHandles.some((handle) => blockRef.includes(`/blocks/${handle}`));
}

/**
 * Checks whether any Wolfpack embed block is active in the merchant's current theme.
 * Reads config/settings_data.json via Admin GraphQL and scans `current.blocks` for
 * a key starting with the Wolfpack app prefix that is not explicitly disabled.
 *
 * Never throws. On JSON parse failure (e.g. settings_data.json exceeds Shopify's
 * ~1MB response limit and arrives truncated) returns { enabled: true } — fail-open,
 * because we cannot confirm the embed is disabled.
 */
export async function checkAppEmbedEnabled(
  admin: ShopifyAdmin,
  shopDomain: string,
  options: AppEmbedCheckOptions = {},
): Promise<AppEmbedCheckResult> {
  try {
    const themeListResult = await admin.graphql(`
      query GetActiveTheme {
        themes(first: 5, roles: [MAIN]) {
          nodes { id }
        }
      }
    `);
    const themeListData = await themeListResult.json();
    const themeId: string | undefined = themeListData?.data?.themes?.nodes?.[0]?.id;

    if (!themeId) {
      AppLogger.warn("checkAppEmbedEnabled: no active theme found", { shopDomain });
      return { enabled: false, themeId: null };
    }

    const settingsResult = await admin.graphql(`
      query GetThemeSettings($themeId: ID!) {
        theme(id: $themeId) {
          files(filenames: ["config/settings_data.json"]) {
            nodes {
              filename
              body {
                ... on OnlineStoreThemeFileBodyText {
                  content
                }
              }
            }
          }
        }
      }
    `, { variables: { themeId } });

    const settingsData = await settingsResult.json();
    const fileContent: string | undefined =
      settingsData?.data?.theme?.files?.nodes?.[0]?.body?.content;

    if (!fileContent) {
      return { enabled: false, themeId };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      // settings_data.json likely truncated (exceeds Shopify ~1MB limit). Fail-open:
      // we cannot confirm embed is disabled, so do not block preview.
      AppLogger.warn("checkAppEmbedEnabled: failed to parse settings_data.json — failing open", { shopDomain });
      return { enabled: true, themeId };
    }

    const blocks = (parsed?.current as Record<string, unknown> | undefined)?.blocks as
      | Record<string, { disabled?: boolean; type?: string }>
      | undefined;

    if (!blocks || typeof blocks !== "object") {
      return { enabled: false, themeId };
    }

    const enabled = Object.entries(blocks).some(([key, value]) =>
      isWolfpackEmbedBlock(key, value, options.blockHandles),
    );

    return { enabled, themeId };
  } catch (err) {
    AppLogger.warn("checkAppEmbedEnabled: unexpected error", { shopDomain, err });
    return { enabled: false, themeId: null };
  }
}
