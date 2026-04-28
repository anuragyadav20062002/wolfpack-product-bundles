import type { ShopifyAdmin } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";

export interface AppEmbedCheckResult {
  enabled: boolean;
  themeId: string | null;
}

const WOLFPACK_APP_PREFIX = "shopify://apps/wolfpack-product-bundles/blocks/";

/**
 * Checks whether any Wolfpack embed block is active in the merchant's current theme.
 * Reads config/settings_data.json via Admin GraphQL and scans `current.blocks` for
 * a key starting with the Wolfpack app prefix that is not explicitly disabled.
 *
 * Never throws — returns { enabled: false, themeId: null } on any error.
 */
export async function checkAppEmbedEnabled(
  admin: ShopifyAdmin,
  shopDomain: string,
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
      AppLogger.warn("checkAppEmbedEnabled: failed to parse settings_data.json", { shopDomain });
      return { enabled: false, themeId };
    }

    const blocks = (parsed?.current as Record<string, unknown> | undefined)?.blocks as
      | Record<string, { disabled?: boolean }>
      | undefined;

    if (!blocks || typeof blocks !== "object") {
      return { enabled: false, themeId };
    }

    const enabled = Object.entries(blocks).some(
      ([key, value]) =>
        key.startsWith(WOLFPACK_APP_PREFIX) && value?.disabled !== true,
    );

    return { enabled, themeId };
  } catch (err) {
    AppLogger.warn("checkAppEmbedEnabled: unexpected error", { shopDomain, err });
    return { enabled: false, themeId: null };
  }
}
