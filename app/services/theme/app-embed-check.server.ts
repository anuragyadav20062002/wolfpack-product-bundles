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

async function getThemeSettingsFileContent(
  body: { content?: string; contentBase64?: string; url?: string } | undefined,
) {
  const inlineContent = getThemeSettingsContent(body);
  if (inlineContent) return inlineContent;
  if (typeof body?.url !== "string") return undefined;

  try {
    const response = await fetch(body.url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return undefined;
    return await response.text();
  } catch {
    return undefined;
  }
}

function stripJsonComments(input: string) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      output += char;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      const commentEnd = input.indexOf("*/", index + 2);
      if (commentEnd === -1) return input;
      index = commentEnd + 1;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      const lineEnd = input.indexOf("\n", index + 2);
      if (lineEnd === -1) break;
      output += "\n";
      index = lineEnd;
      continue;
    }

    output += char;
  }

  return output;
}

function parseThemeSettingsData(fileContent: string): Record<string, unknown> {
  return JSON.parse(stripJsonComments(fileContent.replace(/^\uFEFF/, "")));
}

function isDisabledAppEmbedSetting(disabled: unknown) {
  return disabled === true || (
    typeof disabled === "string" && disabled.trim().toLowerCase() === "true"
  );
}

function isWolfpackEmbedBlock(
  value: { disabled?: unknown; type?: string } | undefined,
  options: AppEmbedCheckOptions,
) {
  if (isDisabledAppEmbedSetting(value?.disabled)) return false;
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
 * Never throws. If the theme settings cannot be read or parsed, fail closed
 * so the merchant sees the setup banner instead of a false active state.
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
                ... on OnlineStoreThemeFileBodyUrl {
                  url
                }
              }
            }
          }
        }
      }
    `, { variables: { themeId } });

    const settingsData = await settingsResult.json();
    const settingsFiles = settingsData?.data?.theme?.files?.nodes ?? [];
    const settingsFile = settingsFiles.find(
      (node: { filename?: string }) => node?.filename === "config/settings_data.json",
    ) ?? settingsFiles[0];
    const fileContent = await getThemeSettingsFileContent(
      settingsFile?.body,
    );

    if (!fileContent) {
      return { enabled: false, themeId };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parseThemeSettingsData(fileContent);
    } catch {
      return { enabled: false, themeId };
    }

    const blocks = (parsed?.current as Record<string, unknown> | undefined)?.blocks as
      | Record<string, { disabled?: unknown; type?: string }>
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
