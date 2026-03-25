/**
 * Theme Colors Service
 *
 * Fetches the active Shopify theme's color palette via Admin GraphQL
 * and caches the 6 global color anchors in DesignSettings.themeColors.
 *
 * These cached colors are used by the CSS endpoint as fallback values
 * when no explicit DCP customization has been saved, ensuring Free plan
 * bundle widgets inherit the store's brand colors automatically.
 */

import type { ShopifyAdmin } from "../lib/auth-guards.server";
import prisma from "../db.server";
import { AppLogger } from "../lib/logger";
import { BundleType } from "../constants/bundle";

export interface ThemeColors {
  globalPrimaryButton: string;
  globalButtonText: string;
  globalPrimaryText: string;
  globalSecondaryText: string;
  globalFooterBg: string;
  globalFooterText: string;
  syncedAt: string;
}

// Maps Shopify settings_data.json color keys to bundle global color anchor names
const COLOR_MAP: Record<string, keyof Omit<ThemeColors, "syncedAt">> = {
  colors_accent_1: "globalPrimaryButton",
  colors_solid_button_labels: "globalButtonText",
  colors_text: "globalPrimaryText",
  colors_secondary_button_labels: "globalSecondaryText",
  colors_background_1: "globalFooterBg",
};

const HARDCODED_DEFAULTS: Record<keyof Omit<ThemeColors, "syncedAt">, string> = {
  globalPrimaryButton: "#000000",
  globalButtonText: "#FFFFFF",
  globalPrimaryText: "#000000",
  globalSecondaryText: "#6B7280",
  globalFooterBg: "#FFFFFF",
  globalFooterText: "#000000",
};

/** Validates a CSS hex color (3, 4, 6, or 8 hex chars) */
function isValidHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(value.trim());
}

/**
 * Fetches the active Shopify theme's color settings and stores them
 * in the DesignSettings records for both bundle types for the shop.
 *
 * - Never throws: errors are logged as warnings and the function returns gracefully.
 * - Idempotent: safe to call multiple times.
 * - Called from afterAuth (install/reinstall) and handleSyncBundle.
 */
export async function syncThemeColors(admin: ShopifyAdmin, shopDomain: string): Promise<void> {
  try {
    // Step 1: Find the active (MAIN role) theme
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
      AppLogger.warn("syncThemeColors: no active theme found", {
        component: "theme-colors.server",
        shopDomain,
      });
      return;
    }

    // Step 2: Fetch config/settings_data.json from the active theme
    const settingsResult = await admin.graphql(`
      query GetThemeColors($themeId: ID!) {
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
      AppLogger.warn("syncThemeColors: settings_data.json not found in theme", {
        component: "theme-colors.server",
        shopDomain,
        themeId,
      });
      return;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      AppLogger.warn("syncThemeColors: failed to parse settings_data.json", {
        component: "theme-colors.server",
        shopDomain,
      });
      return;
    }

    const current = (parsed?.current ?? {}) as Record<string, unknown>;

    // Build themeColors: per-key fallback for missing or invalid values
    const themeColors: ThemeColors = {
      ...HARDCODED_DEFAULTS,
      syncedAt: new Date().toISOString(),
    };

    for (const [shopifyKey, anchor] of Object.entries(COLOR_MAP)) {
      const val = current[shopifyKey];
      if (isValidHexColor(val)) {
        themeColors[anchor] = val;
      }
    }

    // globalFooterText mirrors globalPrimaryText (both derived from colors_text)
    themeColors.globalFooterText = themeColors.globalPrimaryText;

    // Step 3: Upsert themeColors on DesignSettings for both bundle types
    for (const bundleType of [BundleType.PRODUCT_PAGE, BundleType.FULL_PAGE]) {
      await prisma.designSettings.upsert({
        where: { shopId_bundleType: { shopId: shopDomain, bundleType } },
        create: { shopId: shopDomain, bundleType, themeColors },
        update: { themeColors },
      });
    }

    AppLogger.info("syncThemeColors: theme colors synced successfully", {
      component: "theme-colors.server",
      shopDomain,
    });
  } catch (error: unknown) {
    // Non-critical — never propagate; widget falls back to hardcoded defaults
    AppLogger.warn("syncThemeColors: unexpected error (non-critical, using defaults)", {
      component: "theme-colors.server",
      shopDomain,
    }, error as Error);
  }
}
