import type { ShopifyAdmin } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";

export interface AppEmbedCheckResult {
  enabled: boolean;
  themeId: string | null;
}

interface AppEmbedCheckOptions {
  appHandle?: string;
  appHandles?: string[];
  blockHandles?: string[];
}

function getThemeSettingsContent(
  body: { content?: string; contentBase64?: string } | undefined,
) {
  if (typeof body?.content === "string") return body.content;
  if (typeof body?.contentBase64 !== "string") return undefined;

  try {
    return Buffer.from(body.contentBase64, "base64").toString("utf8");
  } catch {
    return undefined;
  }
}

function isWolfpackEmbedBlock(
  value: { disabled?: boolean; type?: string } | undefined,
  options: AppEmbedCheckOptions,
) {
  if (value?.disabled === true) return false;
  if (typeof value?.type !== "string") return false;

  const appHandles = [
    options.appHandle,
    ...(options.appHandles ?? []),
  ]
    .map((handle) => handle?.trim())
    .filter((handle): handle is string => Boolean(handle));

  if (appHandles.length) {
    const matchesKnownApp = appHandles.some((handle) =>
      value.type?.startsWith(`shopify://apps/${handle}/blocks/`),
    );
    if (!matchesKnownApp) return false;
  } else if (!value.type.startsWith("shopify://apps/")) {
    return false;
  }

  if (!options.blockHandles?.length) return true;
  const blockType = value.type;
  return options.blockHandles.some((handle) =>
    blockType.includes(`/blocks/${handle}/`),
  );
}

/**
 * Checks whether any Wolfpack embed block is active in the merchant's current theme.
 * Reads config/settings_data.json via Admin GraphQL and scans `current.blocks` for
 * the current app's app-embed block type that is not explicitly disabled.
 *
 * Never throws. If the theme settings cannot be read, fail closed. If the
 * settings payload is malformed or truncated, fail open because we cannot
 * confirm that the app embed is disabled.
 */
export async function checkAppEmbedEnabled(
  admin: ShopifyAdmin,
  shopDomain: string,
  options: AppEmbedCheckOptions = {},
): Promise<AppEmbedCheckResult> {
  try {
    const themeListResult = await admin.graphql(`
      query GetAppEmbedStatusSeed {
        currentAppInstallation {
          app {
            handle
          }
        }
        themes(first: 5, roles: [MAIN]) {
          nodes { id }
        }
      }
    `);
    const themeListData = await themeListResult.json();
    const themeId: string | undefined = themeListData?.data?.themes?.nodes?.[0]?.id;
    const currentAppHandle: string | undefined =
      themeListData?.data?.currentAppInstallation?.app?.handle;

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
                ... on OnlineStoreThemeFileBodyBase64 {
                  contentBase64
                }
              }
            }
          }
        }
      }
    `, { variables: { themeId } });

    const settingsData = await settingsResult.json();
    const fileContent = getThemeSettingsContent(
      settingsData?.data?.theme?.files?.nodes?.[0]?.body,
    );

    if (!fileContent) {
      return { enabled: false, themeId };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      AppLogger.debug("checkAppEmbedEnabled: failed to parse settings_data.json", { shopDomain });
      return { enabled: true, themeId };
    }

    const blocks = (parsed?.current as Record<string, unknown> | undefined)?.blocks as
      | Record<string, { disabled?: boolean; type?: string }>
      | undefined;

    if (!blocks || typeof blocks !== "object") {
      return { enabled: false, themeId };
    }

    const enabled = Object.values(blocks).some((value) =>
      isWolfpackEmbedBlock(value, {
        ...options,
        appHandles: [
          options.appHandle,
          ...(options.appHandles ?? []),
          currentAppHandle,
        ].filter((handle): handle is string => Boolean(handle?.trim())),
      }),
    );

    return { enabled, themeId };
  } catch (err) {
    AppLogger.warn("checkAppEmbedEnabled: unexpected error", { shopDomain, err });
    return { enabled: false, themeId: null };
  }
}