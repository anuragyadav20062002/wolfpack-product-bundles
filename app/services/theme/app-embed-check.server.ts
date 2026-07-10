import type { ShopifyAdmin } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";

export interface AppEmbedCheckResult {
  enabled: boolean;
  themeId: string | null;
  checkedThemes?: AppEmbedThemeCheck[];
  enabledThemeIds?: string[];
}

export interface AppEmbedThemeCheck {
  id: string;
  name: string | null;
  role: string | null;
  enabled: boolean;
}

interface AppEmbedCheckOptions {
  appHandle?: string;
  appHandles?: string[];
  blockHandles?: string[];
}

interface ThemeNode {
  id?: string;
  name?: string | null;
  role?: string | null;
  files?: {
    nodes?: Array<{
      filename?: string;
      body?: { content?: string; contentBase64?: string; url?: string };
    }>;
  };
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

function getThemeSettingsBodyFromFiles(files: ThemeNode["files"]) {
  const settingsFiles = files?.nodes ?? [];
  const settingsFile = settingsFiles.find(
    (node) => node?.filename === "config/settings_data.json",
  ) ?? settingsFiles[0];
  return settingsFile?.body;
}

async function listThemesWithSettings(
  admin: ShopifyAdmin,
): Promise<{ currentAppHandle?: string; themes: ThemeNode[] }> {
  const themes: ThemeNode[] = [];
  let currentAppHandle: string | undefined;
  let after: string | null = null;

  do {
    const themeListResult = await admin.graphql(`
      query GetAppEmbedStatusSeed($after: String) {
        currentAppInstallation {
          app {
            handle
          }
        }
        themes(first: 50, after: $after) {
          nodes {
            id
            name
            role
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
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `, { variables: { after } });
    const themeListData = await themeListResult.json();
    currentAppHandle ??= themeListData?.data?.currentAppInstallation?.app?.handle;

    const nextThemes = themeListData?.data?.themes?.nodes ?? [];
    if (Array.isArray(nextThemes)) {
      themes.push(...nextThemes);
    }

    const pageInfo = themeListData?.data?.themes?.pageInfo;
    after = pageInfo?.hasNextPage ? pageInfo?.endCursor ?? null : null;
  } while (after);

  return { currentAppHandle, themes };
}

async function getThemeSettingsBody(
  admin: ShopifyAdmin,
  theme: ThemeNode,
) {
  const nestedBody = getThemeSettingsBodyFromFiles(theme.files);
  if (nestedBody) return nestedBody;
  if (!theme.id) return undefined;

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
  `, { variables: { themeId: theme.id } });

  const settingsData = await settingsResult.json();
  return getThemeSettingsBodyFromFiles(settingsData?.data?.theme?.files);
}

async function inspectThemeEmbed(
  admin: ShopifyAdmin,
  theme: ThemeNode,
  options: AppEmbedCheckOptions,
): Promise<AppEmbedThemeCheck | null> {
  if (!theme.id) return null;

  const fileContent = await getThemeSettingsFileContent(
    await getThemeSettingsBody(admin, theme),
  );

  if (!fileContent) {
    return {
      id: theme.id,
      name: theme.name ?? null,
      role: theme.role ?? null,
      enabled: false,
    };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = parseThemeSettingsData(fileContent);
  } catch {
    return {
      id: theme.id,
      name: theme.name ?? null,
      role: theme.role ?? null,
      enabled: false,
    };
  }

  const blocks = (parsed?.current as Record<string, unknown> | undefined)?.blocks as
    | Record<string, { disabled?: unknown; type?: string }>
    | undefined;

  const enabled = Boolean(blocks && typeof blocks === "object" && Object.values(blocks).some((value) =>
    isWolfpackEmbedBlock(value, options),
  ));

  return {
    id: theme.id,
    name: theme.name ?? null,
    role: theme.role ?? null,
    enabled,
  };
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
    const { currentAppHandle, themes } = await listThemesWithSettings(admin);
    const mainTheme = themes.find((theme) => theme.role === "MAIN");

    if (!mainTheme?.id) {
      AppLogger.warn("checkAppEmbedEnabled: no active theme found", { shopDomain });
      return { enabled: false, themeId: null };
    }

    const effectiveOptions = {
      ...options,
      appHandles: [
        options.appHandle,
        ...(options.appHandles ?? []),
        currentAppHandle,
      ].filter((handle): handle is string => Boolean(handle?.trim())),
    };
    const checkedThemes = (
      await Promise.all(themes.map((theme) => inspectThemeEmbed(admin, theme, effectiveOptions)))
    ).filter((theme): theme is AppEmbedThemeCheck => Boolean(theme));
    const mainThemeCheck = checkedThemes.find((theme) => theme.id === mainTheme.id);
    const enabledThemeIds = checkedThemes
      .filter((theme) => theme.enabled)
      .map((theme) => theme.id);
    const enabled = mainThemeCheck?.enabled === true;

    if (!enabled && enabledThemeIds.length > 0) {
      AppLogger.info("checkAppEmbedEnabled: app embed enabled only on non-main theme", {
        shopDomain,
        mainThemeId: mainTheme.id,
        enabledThemeIds,
      });
    }

    return {
      enabled,
      themeId: mainTheme.id,
      checkedThemes,
      enabledThemeIds,
    };
  } catch (err) {
    AppLogger.warn("checkAppEmbedEnabled: unexpected error", { shopDomain, err });
    return { enabled: false, themeId: null };
  }
}
