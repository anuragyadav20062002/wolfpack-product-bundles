/**
 * Widget Theme Template Service
 *
 * Ensures a custom page template (page.full-page-bundle.json) exists in the
 * active theme. This template includes an 'apps' section with the
 * bundle-full-page block so the widget renders automatically.
 *
 * All Shopify API calls use Admin GraphQL (admin.graphql) — NOT the REST API.
 * The app is configured with removeRest: true and unstable_newEmbeddedAuthStrategy,
 * which means session.accessToken may not be populated. The admin GraphQL client
 * handles token management internally and is always valid.
 */

import * as fs from "fs";
import * as path from "path";
import { AppLogger } from "../../lib/logger";

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
    // Step 1: Get the active (MAIN) theme GID
    const themeGid = await getActiveThemeGid(admin);
    if (!themeGid) {
      return { success: false, templateCreated: false, templateAlreadyExists: false, error: "No active theme found" };
    }
    const themeId = themeGid.split("/").pop() as string;

    // Step 2: Check if template already exists
    const exists = await themeAssetExists(admin, themeGid, TEMPLATE_KEY);
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
    const baseTemplate = await readBasePageTemplate(admin, themeGid);

    // Step 5: Construct the bundle template
    const bundleTemplate = buildBundleTemplate(baseTemplate, apiKey, blockUuid);

    // Step 6: Write the template to the theme via GraphQL mutation
    await writeThemeAsset(admin, themeGid, TEMPLATE_KEY, JSON.stringify(bundleTemplate, null, 2));

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
    // Step 1: Get the active (MAIN) theme GID
    const themeGid = await getActiveThemeGid(admin);
    if (!themeGid) {
      return { success: false, templateCreated: false, templateAlreadyExists: false, error: "No active theme found" };
    }
    const themeId = themeGid.split("/").pop() as string;

    // Step 2: Check if template already exists
    const exists = await themeAssetExists(admin, themeGid, PRODUCT_TEMPLATE_KEY);
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
    const baseTemplate = await readBaseProductTemplate(admin, themeGid);

    // Step 5: Construct the product bundle template
    const productTemplate = buildProductBundleTemplate(baseTemplate, apiKey, blockUuid);

    // Step 6: Write the template to the theme via GraphQL mutation
    await writeThemeAsset(admin, themeGid, PRODUCT_TEMPLATE_KEY, JSON.stringify(productTemplate, null, 2));

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
// Internal helpers — all use admin.graphql (not REST)
// ---------------------------------------------------------------------------

/**
 * Returns the full GID of the active (MAIN) theme, e.g.
 * "gid://shopify/OnlineStoreTheme/12345678".
 * Used for GraphQL mutations that require an ID input.
 */
async function getActiveThemeGid(admin: any): Promise<string | null> {
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
  return theme?.id ?? null;
}

async function themeAssetExists(admin: any, themeGid: string, filename: string): Promise<boolean> {
  const QUERY = `
    query themeFileExists($themeId: ID!, $filenames: [String!]!) {
      theme(id: $themeId) {
        files(filenames: $filenames) {
          nodes { filename }
        }
      }
    }
  `;
  const response = await admin.graphql(QUERY, { variables: { themeId: themeGid, filenames: [filename] } });
  const data = await response.json();
  const nodes = data.data?.theme?.files?.nodes ?? [];
  return nodes.some((n: any) => n.filename === filename);
}

async function readThemeAsset(admin: any, themeGid: string, filename: string): Promise<string | null> {
  const QUERY = `
    query themeFileContent($themeId: ID!, $filenames: [String!]!) {
      theme(id: $themeId) {
        files(filenames: $filenames) {
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
  `;
  const response = await admin.graphql(QUERY, { variables: { themeId: themeGid, filenames: [filename] } });
  const data = await response.json();
  const nodes = data.data?.theme?.files?.nodes ?? [];
  const file = nodes.find((n: any) => n.filename === filename);
  return file?.body?.content ?? null;
}

async function writeThemeAsset(admin: any, themeGid: string, filename: string, content: string): Promise<void> {
  const MUTATION = `
    mutation themeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
      themeFilesUpsert(themeId: $themeId, files: $files) {
        upsertedThemeFiles { filename }
        userErrors { filename message }
      }
    }
  `;
  const response = await admin.graphql(MUTATION, {
    variables: {
      themeId: themeGid,
      files: [{ filename, body: { asString: content } }],
    },
  });
  const data = await response.json();
  const userErrors = data.data?.themeFilesUpsert?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(`Failed to write theme asset ${filename}: ${userErrors.map((e: any) => e.message).join(", ")}`);
  }
}

async function readBasePageTemplate(admin: any, themeGid: string): Promise<any> {
  const content = await readThemeAsset(admin, themeGid, "templates/page.json");
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

/**
 * Build the product bundle template by injecting the app block into the
 * section that owns the buy-buttons block (preferred) or the title block
 * (fallback), immediately after the anchor block in its block_order.
 *
 * We deliberately do NOT use section type ("main-product") as a signal —
 * theme authors name sections differently. The presence of buy-buttons or
 * title blocks is the reliable indicator of the product information section.
 *
 * Falls back to a top-level "apps" section only when neither anchor is found
 * in any section (very old themes that pre-date app blocks in sections).
 */
function buildProductBundleTemplate(baseTemplate: any, apiKey: string, blockUuid: string): any {
  const template = JSON.parse(JSON.stringify(baseTemplate));
  const blockType = `shopify://apps/${apiKey}/blocks/${PRODUCT_BLOCK_HANDLE}/${blockUuid}`;
  const blockKey = "wolfpack_bundle";

  // Try buy-buttons first, then title.
  const result =
    findSectionAndBlockKey(template, "buy-buttons") ??
    findSectionAndBlockKey(template, "title");

  if (result) {
    const { sectionKey, anchorKey } = result;
    const section = template.sections[sectionKey];
    if (!section.blocks) section.blocks = {};
    if (!section.block_order) section.block_order = [];

    section.blocks[blockKey] = { type: blockType };

    const idx = section.block_order.indexOf(anchorKey);
    if (idx !== -1) {
      section.block_order.splice(idx + 1, 0, blockKey);
    } else {
      section.block_order.push(blockKey);
    }
  } else {
    // Fallback: old themes with no sections that have buy-buttons or title blocks.
    appendBundleWidgetSection(template, apiKey, PRODUCT_BLOCK_HANDLE, blockUuid);
  }

  return template;
}

/**
 * Scan all sections for the first one that contains a block of the given type.
 * Returns both the section key and the matched block key, or null if not found.
 */
function findSectionAndBlockKey(
  template: any,
  blockType: string,
): { sectionKey: string; anchorKey: string } | null {
  for (const [sectionKey, section] of Object.entries(template.sections ?? {})) {
    for (const [blockKey, block] of Object.entries((section as any).blocks ?? {})) {
      if ((block as any).type === blockType) {
        return { sectionKey, anchorKey: blockKey };
      }
    }
  }
  return null;
}

/** Deep-clones the base template and appends an 'apps' section with the given block. */
function appendBundleWidgetSection(baseTemplate: any, apiKey: string, blockHandle: string, blockUuid: string): any {
  const template = typeof baseTemplate === "string"
    ? JSON.parse(baseTemplate)
    : JSON.parse(JSON.stringify(baseTemplate));

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

async function readBaseProductTemplate(admin: any, themeGid: string): Promise<any> {
  const content = await readThemeAsset(admin, themeGid, "templates/product.json");
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
