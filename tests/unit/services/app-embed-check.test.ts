/**
 * Unit Tests: App Embed Check Service
 *
 * Covers checkAppEmbedEnabled: detecting whether the Wolfpack
 * theme app extension embed block is active in the merchant's theme.
 */

import { checkAppEmbedEnabled } from "../../../app/services/theme/app-embed-check.server";

const originalFetch = global.fetch;

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
    currentAppInstallation: {
      app: {
        handle: "current-test-app",
      },
    },
    themes: {
      nodes: [{ id: "gid://shopify/OnlineStoreTheme/123456", name: "Main", role: "MAIN" }],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  },
};

function makeSettingsResponse(blocks: Record<string, unknown>) {
  return {
    data: {
      theme: {
        files: {
          nodes: [
            {
              filename: "config/settings_data.json",
              body: {
                content: JSON.stringify({ current: { blocks } }),
              },
            },
          ],
        },
      },
    },
  };
}

function makeThemeNode(
  id: string,
  role: string,
  blocks: Record<string, unknown>,
  name = role,
) {
  return {
    id,
    name,
    role,
    files: {
      nodes: [
        {
          filename: "config/settings_data.json",
          body: {
            content: JSON.stringify({ current: { blocks } }),
          },
        },
      ],
    },
  };
}

const EMBED_KEY =
  "shopify://apps/current-test-app/blocks/bundle-full-page-embed/uid-abc";
const SINGLE_EMBED_KEY =
  "shopify://apps/current-test-app/blocks/bundle-app-embed/uid-single";
const EXTENSION_HANDLE_EMBED_KEY =
  "shopify://apps/bundle-builder/blocks/bundle-app-embed/uid-single";

describe("checkAppEmbedEnabled", () => {
  const currentAppOptions = {
    appHandle: "current-test-app",
  };

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns true when Wolfpack embed block is present and not disabled", async () => {
    const admin = makeAdmin([
      {
        data: {
          currentAppInstallation: THEME_LIST_RESPONSE.data.currentAppInstallation,
          themes: {
            nodes: [
              makeThemeNode("gid://shopify/OnlineStoreTheme/123456", "MAIN", {
                [EMBED_KEY]: { type: EMBED_KEY, disabled: false },
              }),
            ],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(true);
    expect(result.themeId).toBe("gid://shopify/OnlineStoreTheme/123456");
  });

  it("keeps enabled false when the app embed is enabled only on a non-main theme", async () => {
    const mainThemeId = "gid://shopify/OnlineStoreTheme/111";
    const draftThemeId = "gid://shopify/OnlineStoreTheme/222";
    const admin = makeAdmin([
      {
        data: {
          currentAppInstallation: THEME_LIST_RESPONSE.data.currentAppInstallation,
          themes: {
            nodes: [
              makeThemeNode(mainThemeId, "MAIN", {
                "17878678986028907411": {
                  type: SINGLE_EMBED_KEY,
                  disabled: true,
                },
              }),
              makeThemeNode(draftThemeId, "UNPUBLISHED", {
                "17878678986028907412": {
                  type: SINGLE_EMBED_KEY,
                  disabled: false,
                },
              }),
            ],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(false);
    expect(result.themeId).toBe(mainThemeId);
    expect(result.enabledThemeIds).toEqual([draftThemeId]);
    expect(result.checkedThemes).toEqual([
      expect.objectContaining({ id: mainThemeId, role: "MAIN", enabled: false }),
      expect.objectContaining({ id: draftThemeId, role: "UNPUBLISHED", enabled: true }),
    ]);
  });

  it("scans paginated theme lists instead of only the first page", async () => {
    const mainThemeId = "gid://shopify/OnlineStoreTheme/111";
    const draftThemeId = "gid://shopify/OnlineStoreTheme/222";
    const admin = makeAdmin([
      {
        data: {
          currentAppInstallation: THEME_LIST_RESPONSE.data.currentAppInstallation,
          themes: {
            nodes: [
              makeThemeNode(mainThemeId, "MAIN", {
                "17878678986028907411": {
                  type: SINGLE_EMBED_KEY,
                  disabled: true,
                },
              }),
            ],
            pageInfo: { hasNextPage: true, endCursor: "cursor-1" },
          },
        },
      },
      {
        data: {
          currentAppInstallation: THEME_LIST_RESPONSE.data.currentAppInstallation,
          themes: {
            nodes: [
              makeThemeNode(draftThemeId, "UNPUBLISHED", {
                "17878678986028907412": {
                  type: SINGLE_EMBED_KEY,
                  disabled: false,
                },
              }),
            ],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(false);
    expect(result.themeId).toBe(mainThemeId);
    expect(result.enabledThemeIds).toEqual([draftThemeId]);
    expect(admin.graphql).toHaveBeenCalledTimes(2);
    expect(admin.graphql).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({ variables: { after: "cursor-1" } }),
    );
  });

  it("returns true for the single bundle app embed when Shopify stores a numeric block ID", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        "17878678986028907411": { type: SINGLE_EMBED_KEY, disabled: false },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      ...currentAppOptions,
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(true);
  });

  it("returns true when embed block key is present with no 'disabled' field (defaults to active)", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        [EMBED_KEY]: { type: EMBED_KEY },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(true);
  });

  it("returns false when embed block is present but disabled: true", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        "17878678986028907411": { type: SINGLE_EMBED_KEY, disabled: true },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      ...currentAppOptions,
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(false);
  });

  it("returns false when Shopify serializes disabled as a string", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        "17878678986028907411": { type: SINGLE_EMBED_KEY, disabled: "true" },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      ...currentAppOptions,
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(false);
  });

  it("returns false for another Wolfpack app handle based on currentAppInstallation app handle", async () => {
    const otherAppEmbedType =
      "shopify://apps/other-test-app/blocks/bundle-app-embed/uid-prod";
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        "17878678986028907411": { type: otherAppEmbedType, disabled: false },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(false);
  });

  it("uses Shopify's current app handle when an optional configured handle does not match", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        "17878678986028907411": { type: SINGLE_EMBED_KEY, disabled: false },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      appHandle: "stale-configured-handle",
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(true);
  });

  it("preserves configured app handles when matching Shopify's settings_data block type", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        "17878678986028907411": {
          type: EXTENSION_HANDLE_EMBED_KEY,
          disabled: false,
        },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      appHandles: ["bundle-builder"],
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(true);
  });

  it("returns false when no Wolfpack embed block key is in settings_data.json", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        "shopify://apps/some-other-app/blocks/widget/uid-xyz": { disabled: false },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(false);
  });

  it("returns false when blocks is absent from settings_data.json current section", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      {
        data: {
          theme: {
            files: {
              nodes: [
                {
                  filename: "config/settings_data.json",
                  body: {
                    content: JSON.stringify({ current: { colors: {} } }),
                  },
                },
              ],
            },
          },
        },
      },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(false);
  });

  it("returns false when settings_data.json is malformed JSON", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      {
        data: {
          theme: {
            files: {
              nodes: [
                {
                  filename: "config/settings_data.json",
                  body: { content: "{ not valid json" },
                },
              ],
            },
          },
        },
      },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(false);
    expect(result.themeId).toBe("gid://shopify/OnlineStoreTheme/123456");
  });

  it("detects enabled app embed blocks when Shopify returns settings_data.json with theme comments", async () => {
    const content = `/*
 * ------------------------------------------------------------
 * IMPORTANT: This file is generated by Shopify.
 * ------------------------------------------------------------
 */
{
  "current": {
    "blocks": {
      "17878678986028907411": {
        "type": "${SINGLE_EMBED_KEY}",
        "disabled": false,
        "settings": {
          "label": "Text containing /* not a real comment */"
        }
      }
    }
  }
}`;
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      {
        data: {
          theme: {
            files: {
              nodes: [
                {
                  filename: "config/settings_data.json",
                  body: { content },
                },
              ],
            },
          },
        },
      },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(true);
  });

  it("returns false and null themeId when no active theme exists", async () => {
    const admin = makeAdmin([
      { data: { themes: { nodes: [] } } },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(false);
    expect(result.themeId).toBeNull();
  });

  it("returns false when settings_data.json file is not found in theme", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      { data: { theme: { files: { nodes: [] } } } },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(false);
  });

  it("detects enabled app embed blocks when Shopify returns settings_data.json as base64", async () => {
    const content = JSON.stringify({
      current: {
        blocks: {
          "17878678986028907411": {
            type: SINGLE_EMBED_KEY,
            disabled: false,
          },
        },
      },
    });
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      {
        data: {
          theme: {
            files: {
              nodes: [
                {
                  filename: "config/settings_data.json",
                  body: {
                    contentBase64: Buffer.from(content, "utf8").toString("base64"),
                  },
                },
              ],
            },
          },
        },
      },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(true);
  });

  it("detects enabled app embed blocks when Shopify returns settings_data.json as a download URL", async () => {
    const content = JSON.stringify({
      current: {
        blocks: {
          "17878678986028907411": {
            type: SINGLE_EMBED_KEY,
            disabled: false,
          },
        },
      },
    });
    global.fetch = jest.fn().mockResolvedValue(
      new Response(content, { status: 200 }),
    ) as jest.Mock;
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      {
        data: {
          theme: {
            files: {
              nodes: [
                {
                  filename: "config/settings_data.json",
                  body: {
                    url: "https://cdn.shopify.com/theme-settings/settings_data.json",
                  },
                },
              ],
            },
          },
        },
      },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://cdn.shopify.com/theme-settings/settings_data.json",
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    );
  });

  it("selects config/settings_data.json by filename before parsing returned theme files", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      {
        data: {
          theme: {
            files: {
              nodes: [
                {
                  filename: "templates/index.json",
                  body: { content: "{ not settings data" },
                },
                {
                  filename: "config/settings_data.json",
                  body: {
                    content: JSON.stringify({
                      current: {
                        blocks: {
                          "17878678986028907411": {
                            type: SINGLE_EMBED_KEY,
                            disabled: false,
                          },
                        },
                      },
                    }),
                  },
                },
              ],
            },
          },
        },
      },
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com", {
      blockHandles: ["bundle-app-embed"],
    });

    expect(result.enabled).toBe(true);
  });

  it("returns false without throwing when Admin graphql call throws", async () => {
    const admin = {
      graphql: jest.fn().mockRejectedValue(new Error("network failure")),
    };

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(false);
    expect(result.themeId).toBeNull();
  });

  it("detects the product-page embed block key as well", async () => {
    const ppbEmbedKey =
      "shopify://apps/current-test-app/blocks/bundle-product-page-embed/uid-ppb";

    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        [ppbEmbedKey]: { type: ppbEmbedKey, disabled: false },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(true);
  });
});
