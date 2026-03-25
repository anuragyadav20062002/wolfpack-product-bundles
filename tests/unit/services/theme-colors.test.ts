/**
 * Unit Tests: Theme Colors Service
 *
 * Covers syncThemeColors: color extraction from settings_data.json,
 * per-key fallback, invalid hex rejection, and silent error handling.
 */

// Mock db.server before importing the module under test
jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    designSettings: {
      upsert: jest.fn(),
    },
  },
}));

import db from "../../../app/db.server";
import { syncThemeColors } from "../../../app/services/theme-colors.server";

function makeAdmin(responses: unknown[]) {
  let callIndex = 0;
  const graphql = jest.fn().mockImplementation(() => {
    const body = responses[callIndex++] ?? { data: null };
    return Promise.resolve({ json: async () => body });
  });
  return { graphql };
}

const THEME_LIST_RESPONSE = {
  data: {
    themes: {
      nodes: [{ id: "gid://shopify/OnlineStoreTheme/123456" }],
    },
  },
};

function makeSettingsResponse(colors: Record<string, string>) {
  return {
    data: {
      theme: {
        files: {
          nodes: [
            {
              filename: "config/settings_data.json",
              body: {
                content: JSON.stringify({ current: colors }),
              },
            },
          ],
        },
      },
    },
  };
}

const FULL_DAWN_COLORS = {
  colors_accent_1: "#1A56DB",
  colors_solid_button_labels: "#FFFFFF",
  colors_text: "#111827",
  colors_secondary_button_labels: "#6B7280",
  colors_background_1: "#F9FAFB",
};

describe("syncThemeColors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("extracts all 6 anchors from a full Dawn color set", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse(FULL_DAWN_COLORS),
    ]);

    await syncThemeColors(admin as any, "test-shop.myshopify.com");

    expect(db.designSettings.upsert).toHaveBeenCalledTimes(2);
    const firstCall = (db.designSettings.upsert as jest.Mock).mock.calls[0][0];
    const stored = firstCall.create.themeColors;

    expect(stored.globalPrimaryButton).toBe("#1A56DB");
    expect(stored.globalButtonText).toBe("#FFFFFF");
    expect(stored.globalPrimaryText).toBe("#111827");
    expect(stored.globalSecondaryText).toBe("#6B7280");
    expect(stored.globalFooterBg).toBe("#F9FAFB");
    expect(stored.globalFooterText).toBe("#111827"); // mirrors globalPrimaryText
    expect(stored.syncedAt).toBeDefined();
  });

  it("mirrors colors_text to both globalPrimaryText and globalFooterText", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({ ...FULL_DAWN_COLORS, colors_text: "#334155" }),
    ]);

    await syncThemeColors(admin as any, "test-shop.myshopify.com");

    const stored = (db.designSettings.upsert as jest.Mock).mock.calls[0][0].create.themeColors;
    expect(stored.globalPrimaryText).toBe("#334155");
    expect(stored.globalFooterText).toBe("#334155");
  });

  it("falls back to hardcoded defaults for missing color keys", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({ colors_accent_1: "#E91E8C" }), // only one key
    ]);

    await syncThemeColors(admin as any, "test-shop.myshopify.com");

    const stored = (db.designSettings.upsert as jest.Mock).mock.calls[0][0].create.themeColors;
    expect(stored.globalPrimaryButton).toBe("#E91E8C"); // from theme
    expect(stored.globalButtonText).toBe("#FFFFFF");    // hardcoded default
    expect(stored.globalPrimaryText).toBe("#000000");   // hardcoded default
    expect(stored.globalSecondaryText).toBe("#6B7280"); // hardcoded default
    expect(stored.globalFooterBg).toBe("#FFFFFF");      // hardcoded default
  });

  it("rejects invalid hex values and falls back to defaults", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        colors_accent_1: "rgb(26, 86, 219)",  // not hex — invalid
        colors_text: "",                        // empty — invalid
        colors_background_1: "#F9FAFB",        // valid
      }),
    ]);

    await syncThemeColors(admin as any, "test-shop.myshopify.com");

    const stored = (db.designSettings.upsert as jest.Mock).mock.calls[0][0].create.themeColors;
    expect(stored.globalPrimaryButton).toBe("#000000");  // invalid → default
    expect(stored.globalPrimaryText).toBe("#000000");    // invalid → default
    expect(stored.globalFooterBg).toBe("#F9FAFB");       // valid → theme
  });

  it("accepts 3-digit and 8-digit hex values", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        colors_accent_1: "#FFF",         // 3-digit hex
        colors_background_1: "#F9FAFB88", // 8-digit hex (with alpha)
      }),
    ]);

    await syncThemeColors(admin as any, "test-shop.myshopify.com");

    const stored = (db.designSettings.upsert as jest.Mock).mock.calls[0][0].create.themeColors;
    expect(stored.globalPrimaryButton).toBe("#FFF");
    expect(stored.globalFooterBg).toBe("#F9FAFB88");
  });

  it("upserts both product_page and full_page bundle types", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse(FULL_DAWN_COLORS),
    ]);

    await syncThemeColors(admin as any, "test-shop.myshopify.com");

    expect(db.designSettings.upsert).toHaveBeenCalledTimes(2);
    const bundleTypes = (db.designSettings.upsert as jest.Mock).mock.calls.map(
      (call) => call[0].where.shopId_bundleType.bundleType
    );
    expect(bundleTypes).toContain("product_page");
    expect(bundleTypes).toContain("full_page");
  });

  it("returns without upserting when no active theme exists", async () => {
    const admin = makeAdmin([
      { data: { themes: { nodes: [] } } }, // no themes
    ]);

    await syncThemeColors(admin as any, "test-shop.myshopify.com");

    expect(db.designSettings.upsert).not.toHaveBeenCalled();
  });

  it("returns without upserting when settings_data.json is not found", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      { data: { theme: { files: { nodes: [] } } } }, // no file
    ]);

    await syncThemeColors(admin as any, "test-shop.myshopify.com");

    expect(db.designSettings.upsert).not.toHaveBeenCalled();
  });

  it("returns without upserting when settings_data.json is malformed JSON", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      {
        data: {
          theme: {
            files: {
              nodes: [
                {
                  filename: "config/settings_data.json",
                  body: { content: "{ this is not json" },
                },
              ],
            },
          },
        },
      },
    ]);

    await syncThemeColors(admin as any, "test-shop.myshopify.com");

    expect(db.designSettings.upsert).not.toHaveBeenCalled();
  });

  it("swallows errors when Admin API graphql throws", async () => {
    const admin = {
      graphql: jest.fn().mockRejectedValue(new Error("Network error")),
    };

    await expect(
      syncThemeColors(admin as any, "test-shop.myshopify.com")
    ).resolves.toBeUndefined(); // never throws

    expect(db.designSettings.upsert).not.toHaveBeenCalled();
  });

  it("swallows errors when Prisma upsert throws", async () => {
    (db.designSettings.upsert as jest.Mock).mockRejectedValue(new Error("DB error"));

    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse(FULL_DAWN_COLORS),
    ]);

    await expect(
      syncThemeColors(admin as any, "test-shop.myshopify.com")
    ).resolves.toBeUndefined(); // never throws
  });
});
