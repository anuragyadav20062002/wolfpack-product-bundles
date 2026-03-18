/**
 * Widget Theme Template Service
 *
 * Ensures a custom page template (page.full-page-bundle.json) exists in the
 * active theme. This template includes an 'apps' section with the
 * bundle-full-page block so the widget renders automatically.
 */

import * as fs from "fs";
import * as path from "path";
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
  accessToken?: string | null;
}

const TEMPLATE_KEY = "templates/page.full-page-bundle.json";
const BLOCK_HANDLE = "bundle-full-page";
const PRODUCT_TEMPLATE_KEY = "templates/product.product-page-bundle.json";
const PRODUCT_BLOCK_HANDLE = "bundle-product-page";
const COMPONENT = "WidgetThemeTemplate";

/**
 * Read the extension UID from extensions/bundle-builder/shopify.extension.toml.
 * The uid field is assigned by Shopify at first deploy and is stable for the
 * lifetime of the extension (changes only on shopify app deploy --reset).
 *
 * Returns null if the file cannot be read or the uid field is not found.
 */
function readExtensionUidFromToml(): string | null {
  try {
    const tomlPath = path.resolve(process.cwd(), "extensions/bundle-builder/shopify.extension.toml");
    const content = fs.readFileSync(tomlPath, "utf-8");
    const match = content.match(/^uid\s*=\s*"([^"]+)"/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

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

    // Step 3: Resolve block UUID — fail fast before reading theme assets
    const blockUuid = resolveBlockUuid();
    if (!blockUuid) {
      return { success: false, templateCreated: false, templateAlreadyExists: false, error: "Block UUID not found — set SHOPIFY_BUNDLE_BLOCK_UUID or ensure extensions/bundle-builder/shopify.extension.toml has a uid field" };
    }

    // Step 4: Read the default page.json as base
    const baseTemplate = await readBasePageTemplate(session, themeId);

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

/**
 * Ensure `templates/product.product-page-bundle.json` exists in the active theme
 * with the bundle-product-page app block in an 'apps' section.
 *
 * Called on every product-page bundle save and sync. Idempotent — skips the
 * write if the template already exists. Failure is non-fatal.
 */
export async function ensureProductBundleTemplate(
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
    const exists = await themeAssetExists(session, themeId, PRODUCT_TEMPLATE_KEY);
    if (exists) {
      AppLogger.info("[TEMPLATE] product.product-page-bundle.json already exists", { component: COMPONENT });
      return { success: true, templateCreated: false, templateAlreadyExists: true, themeId };
    }

    // Step 3: Resolve block UUID from TOML uid (or env var override) — fail fast before reading theme assets
    const blockUuid = resolveBlockUuid();
    if (!blockUuid) {
      return { success: false, templateCreated: false, templateAlreadyExists: false, error: "Block UUID not found — set SHOPIFY_BUNDLE_BLOCK_UUID or ensure extensions/bundle-builder/shopify.extension.toml has a uid field" };
    }

    // Step 4: Read the default product.json as base
    const baseTemplate = await readBaseProductTemplate(session, themeId);

    // Step 5: Construct the product bundle template
    const productTemplate = buildProductBundleTemplate(baseTemplate, apiKey, blockUuid);

    // Step 6: Write the template to the theme
    await writeThemeAsset(session, themeId, PRODUCT_TEMPLATE_KEY, JSON.stringify(productTemplate, null, 2));

    AppLogger.info("[TEMPLATE] Created product.product-page-bundle.json successfully", {
      component: COMPONENT,
      themeId,
      blockUuid,
    });

    return { success: true, templateCreated: true, templateAlreadyExists: false, themeId };
  } catch (error) {
    AppLogger.error("[TEMPLATE] Failed to ensure product bundle template", { component: COMPONENT }, error as Error);
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
 * Resolve the block UUID for the bundle-full-page extension block.
 *
 * Resolution order:
 *  1. SHOPIFY_BUNDLE_BLOCK_UUID env var — override for testing or re-deploys
 *  2. uid field in extensions/bundle-builder/shopify.extension.toml — set by
 *     Shopify at first deploy, stable for the extension's lifetime
 *
 * Returns null if neither source provides a value (prevents silent template corruption).
 *
 * The old approach of scanning theme templates is removed — it only worked if
 * the merchant had already placed the block in Theme Editor, which is the exact
 * situation we are trying to automate away.
 */
function resolveBlockUuid(): string | null {
  const envUuid = process.env.SHOPIFY_BUNDLE_BLOCK_UUID;
  if (envUuid) {
    AppLogger.info("[TEMPLATE] Using block UUID from env var", { component: COMPONENT, uuid: envUuid });
    return envUuid;
  }

  const tomlUid = readExtensionUidFromToml();
  if (tomlUid) {
    AppLogger.info("[TEMPLATE] Using block UUID from extension TOML", { component: COMPONENT, uuid: tomlUid });
    return tomlUid;
  }

  AppLogger.warn("[TEMPLATE] Could not resolve block UUID — TOML uid not found and SHOPIFY_BUNDLE_BLOCK_UUID not set", { component: COMPONENT });
  return null;
}


function buildBundleTemplate(baseTemplate: any, apiKey: string, blockUuid: string): any {
  return appendBundleWidgetSection(baseTemplate, apiKey, BLOCK_HANDLE, blockUuid);
}

function buildProductBundleTemplate(baseTemplate: any, apiKey: string, blockUuid: string): any {
  return appendBundleWidgetSection(baseTemplate, apiKey, PRODUCT_BLOCK_HANDLE, blockUuid);
}

/** Deep-clones the base template and appends an 'apps' section with the given block. */
function appendBundleWidgetSection(baseTemplate: any, apiKey: string, blockHandle: string, blockUuid: string): any {
  const template = JSON.parse(JSON.stringify(baseTemplate));

  template.sections["bundle_widget"] = {
    type: "apps",
    blocks: {
      bundle_block: {
        type: `shopify://apps/${apiKey}/blocks/${blockHandle}/${blockUuid}`,
      },
    },
    block_order: ["bundle_block"],
    settings: {},
  };

  if (!template.order) {
    template.order = Object.keys(template.sections);
  } else if (!template.order.includes("bundle_widget")) {
    template.order.push("bundle_widget");
  }

  return template;
}

async function readBaseProductTemplate(session: ShopSession, themeId: string): Promise<any> {
  const content = await readThemeAsset(session, themeId, "templates/product.json");
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      AppLogger.warn("[TEMPLATE] Could not parse templates/product.json — using minimal fallback", { component: COMPONENT });
    }
  }

  // Minimal fallback template
  return {
    sections: {
      main: { type: "main-product", settings: {} },
    },
    order: ["main"],
  };
}
