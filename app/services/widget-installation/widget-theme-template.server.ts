/**
 * Widget Theme Template Service
 *
 * Ensures a custom page template (page.full-page-bundle.json) exists in the
 * active theme. This template includes an 'apps' section with the
 * bundle-full-page block so the widget renders automatically.
 */

import { AppLogger } from "../../lib/logger";
import { SHOPIFY_REST_API_VERSION } from "../../constants/api";

export interface TemplateEnsureResult {
  success: boolean;
  templateCreated: boolean;
  templateAlreadyExists: boolean;
  themeId?: string;
  error?: string;
}

interface ShopSession {
  shop: string;
  accessToken: string | null | undefined;
}

const TEMPLATE_KEY = "templates/page.full-page-bundle.json";
const BLOCK_HANDLE = "bundle-full-page";
const COMPONENT = "WidgetThemeTemplate";

/**
 * Ensure `templates/page.full-page-bundle.json` exists in the active theme
 * with the bundle-full-page app block in an 'apps' section.
 *
 * This is idempotent — if the template already exists, it returns early.
 * Failure is non-fatal: the page is still created, just without auto-rendering.
 */
export async function ensureBundlePageTemplate(
  admin: any,
  session: ShopSession,
  apiKey: string,
): Promise<TemplateEnsureResult> {
  try {
    // Step 1: Get the active (MAIN) theme
    const themeId = await getActiveThemeId(admin);
    if (!themeId) {
      return { success: false, templateCreated: false, templateAlreadyExists: false, error: "No active theme found" };
    }

    // Step 2: Check if template already exists
    const exists = await themeAssetExists(session, themeId, TEMPLATE_KEY);
    if (exists) {
      AppLogger.info("[TEMPLATE] page.full-page-bundle.json already exists", { component: COMPONENT });
      return { success: true, templateCreated: false, templateAlreadyExists: true, themeId };
    }

    // Step 3: Read the default page.json as base
    const baseTemplate = await readBasePageTemplate(session, themeId);

    // Step 4: Discover block UUID from existing theme templates
    const blockUuid = await discoverBlockUuid(session, themeId, apiKey);

    if (!blockUuid) {
      AppLogger.warn("[TEMPLATE] Could not discover block UUID — cannot create template with app block", { component: COMPONENT });
      return { success: false, templateCreated: false, templateAlreadyExists: false, error: "Block UUID not found" };
    }

    // Step 5: Construct the bundle template
    const bundleTemplate = buildBundleTemplate(baseTemplate, apiKey, blockUuid);

    // Step 6: Write the template to the theme
    await writeThemeAsset(session, themeId, TEMPLATE_KEY, JSON.stringify(bundleTemplate, null, 2));

    AppLogger.info("[TEMPLATE] Created page.full-page-bundle.json successfully", {
      component: COMPONENT,
      themeId,
      blockUuid,
    });

    return { success: true, templateCreated: true, templateAlreadyExists: false, themeId };
  } catch (error) {
    AppLogger.error("[TEMPLATE] Failed to ensure bundle page template", { component: COMPONENT }, error as Error);
    return {
      success: false,
      templateCreated: false,
      templateAlreadyExists: false,
      error: (error as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getActiveThemeId(admin: any): Promise<string | null> {
  const GET_THEME = `
    query getPublishedTheme {
      themes(first: 1, roles: [MAIN]) {
        nodes { id name role }
      }
    }
  `;

  const response = await admin.graphql(GET_THEME);
  const data = await response.json();
  const theme = data.data?.themes?.nodes?.[0];
  if (!theme) return null;

  // Extract numeric ID from GID for REST API
  return theme.id.split("/").pop() as string;
}

function restHeaders(session: ShopSession) {
  return {
    "X-Shopify-Access-Token": session.accessToken ?? "",
    "Content-Type": "application/json",
  };
}

function assetUrl(session: ShopSession, themeId: string, key?: string): string {
  const base = `https://${session.shop}/admin/api/${SHOPIFY_REST_API_VERSION}/themes/${themeId}/assets.json`;
  return key ? `${base}?asset[key]=${encodeURIComponent(key)}` : base;
}

async function themeAssetExists(session: ShopSession, themeId: string, key: string): Promise<boolean> {
  const response = await fetch(assetUrl(session, themeId, key), { headers: restHeaders(session) });
  return response.ok;
}

async function readThemeAsset(session: ShopSession, themeId: string, key: string): Promise<string | null> {
  const response = await fetch(assetUrl(session, themeId, key), { headers: restHeaders(session) });
  if (!response.ok) return null;
  const data = await response.json();
  return data.asset?.value ?? null;
}

async function writeThemeAsset(session: ShopSession, themeId: string, key: string, value: string): Promise<void> {
  const response = await fetch(assetUrl(session, themeId), {
    method: "PUT",
    headers: restHeaders(session),
    body: JSON.stringify({ asset: { key, value } }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to write theme asset ${key}: ${response.status} ${errorText}`);
  }
}

async function readBasePageTemplate(session: ShopSession, themeId: string): Promise<any> {
  const content = await readThemeAsset(session, themeId, "templates/page.json");
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      AppLogger.warn("[TEMPLATE] Could not parse templates/page.json — using minimal fallback", { component: COMPONENT });
    }
  }

  // Minimal fallback template
  return {
    sections: {
      main: { type: "main-page", settings: {} },
    },
    order: ["main"],
  };
}

/**
 * Scan existing theme template files for the bundle-full-page block reference
 * to discover the block UUID assigned by Shopify during deployment.
 *
 * Block references in template JSON look like:
 *   shopify://apps/{apiKey}/blocks/bundle-full-page/{uuid}
 */
async function discoverBlockUuid(
  session: ShopSession,
  themeId: string,
  apiKey: string,
): Promise<string | null> {
  // First check env var (fastest path)
  const envUuid = process.env.SHOPIFY_BUNDLE_BLOCK_UUID;
  if (envUuid) {
    AppLogger.info("[TEMPLATE] Using block UUID from env var", { component: COMPONENT, uuid: envUuid });
    return envUuid;
  }

  // Scan theme templates for existing block reference
  try {
    const response = await fetch(assetUrl(session, themeId), { headers: restHeaders(session) });
    if (!response.ok) return null;

    const data = await response.json();
    const templateKeys: string[] = (data.assets || [])
      .filter((a: any) => a.key.startsWith("templates/") && a.key.endsWith(".json"))
      .map((a: any) => a.key);

    // Also check config/settings_data.json which may contain block references from theme customizations
    const configKeys = (data.assets || [])
      .filter((a: any) => a.key === "config/settings_data.json")
      .map((a: any) => a.key);

    const keysToScan = [...templateKeys, ...configKeys];
    const pattern = new RegExp(`shopify://apps/${escapeRegex(apiKey)}/blocks/${escapeRegex(BLOCK_HANDLE)}/([a-f0-9-]+)`);

    for (const key of keysToScan) {
      const content = await readThemeAsset(session, themeId, key);
      if (!content) continue;

      const match = content.match(pattern);
      if (match) {
        AppLogger.info("[TEMPLATE] Discovered block UUID from theme asset", {
          component: COMPONENT,
          sourceAsset: key,
          uuid: match[1],
        });
        return match[1];
      }
    }
  } catch (error) {
    AppLogger.warn("[TEMPLATE] Error scanning theme templates for block UUID", { component: COMPONENT }, error as Error);
  }

  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildBundleTemplate(baseTemplate: any, apiKey: string, blockUuid: string): any {
  // Deep-clone the base template
  const template = JSON.parse(JSON.stringify(baseTemplate));

  // Add the apps section with the bundle-full-page block
  template.sections["bundle_widget"] = {
    type: "apps",
    blocks: {
      bundle_block: {
        type: `shopify://apps/${apiKey}/blocks/${BLOCK_HANDLE}/${blockUuid}`,
      },
    },
    block_order: ["bundle_block"],
    settings: {},
  };

  // Ensure section order includes the new section
  if (!template.order) {
    template.order = Object.keys(template.sections);
  } else if (!template.order.includes("bundle_widget")) {
    template.order.push("bundle_widget");
  }

  return template;
}
