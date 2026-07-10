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

interface ThemeNode {
  id?: string;
  name?: string | null;
  role?: string | null;
  files?: {
    nodes?: ThemeFileNode[];
  };
}

interface ThemeFileBody {
  content?: string;
  contentBase64?: string;
  url?: string;
}

interface ThemeFileNode {
  filename?: string;
  body?: ThemeFileBody;
}

interface AppEmbedStatusSeedResponse {
  data?: {
    currentAppInstallation?: {
      app?: {
        handle?: string | null;
      } | null;
    } | null;
    themes?: {
      nodes?: ThemeNode[];
    } | null;
  } | null;
}

interface ThemeSettingsResponse {
  data?: {
    theme?: {
      files?: ThemeNode["files"];
    } | null;
  } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getThemeSettingsContent(
  body: Pick<ThemeFileBody, "content" | "contentBase64"> | undefined,
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
  body: ThemeFileBody | undefined,
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
  const parsed = JSON.parse(stripJsonComments(fileContent.replace(/^\uFEFF/, ""))) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("Theme settings data is not a JSON object");
  }
  return parsed;
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

async function getMainThemeWithSettings(
  admin: ShopifyAdmin,
): Promise<{ currentAppHandle?: string; theme?: ThemeNode }> {
  const themeListResult = await admin.graphql(`
    query GetAppEmbedStatusSeed {
      currentAppInstallation {
        app {
          handle
        }
      }
      themes(first: 1, roles: [MAIN]) {
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
      }
    }
  `);
  const themeListData = await themeListResult.json();
  const data = themeListData as AppEmbedStatusSeedResponse;
  return {
    currentAppHandle: data.data?.currentAppInstallation?.app?.handle ?? undefined,
    theme: data.data?.themes?.nodes?.[0],
  };
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
  const data = settingsData as ThemeSettingsResponse;
  return getThemeSettingsBodyFromFiles(data.data?.theme?.files);
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
    const { currentAppHandle, theme } = await getMainThemeWithSettings(admin);

    if (!theme?.id) {
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

    const fileContent = await getThemeSettingsFileContent(
      await getThemeSettingsBody(admin, theme),
    );

    if (!fileContent) {
      return { enabled: false, themeId: theme.id };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parseThemeSettingsData(fileContent);
    } catch {
      return { enabled: false, themeId: theme.id };
    }

    const current = parsed.current;
    if (!isRecord(current) || !isRecord(current.blocks)) {
      return { enabled: false, themeId: theme.id };
    }

    const enabled = Object.values(current.blocks).some((value) =>
      isWolfpackEmbedBlock(
        isRecord(value) ? {
          disabled: value.disabled,
          type: typeof value.type === "string" ? value.type : undefined,
        } : undefined,
        effectiveOptions,
      ),
    );

    return { enabled, themeId: theme.id };
  } catch (err) {
    AppLogger.warn("checkAppEmbedEnabled: unexpected error", { shopDomain, err });
    return { enabled: false, themeId: null };
  }
}
