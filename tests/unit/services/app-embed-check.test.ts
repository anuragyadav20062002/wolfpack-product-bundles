/**
 * Unit Tests: App Embed Check Service
 *
 * Covers checkAppEmbedEnabled: detecting whether the Wolfpack
 * theme app extension embed block is active in the merchant's theme.
 */

import { checkAppEmbedEnabled } from "../../../app/services/theme/app-embed-check.server";

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

const EMBED_KEY =
  "shopify://apps/wolfpack-product-bundles/blocks/bundle-full-page-embed/uid-abc";

describe("checkAppEmbedEnabled", () => {
  it("returns true when Wolfpack embed block is present and not disabled", async () => {
    const admin = makeAdmin([
      THEME_LIST_RESPONSE,
      makeSettingsResponse({
        [EMBED_KEY]: { type: EMBED_KEY, disabled: false },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(true);
    expect(result.themeId).toBe("gid://shopify/OnlineStoreTheme/123456");
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
        [EMBED_KEY]: { type: EMBED_KEY, disabled: true },
      }),
    ]);

    const result = await checkAppEmbedEnabled(admin as any, "test.myshopify.com");

    expect(result.enabled).toBe(false);
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
      "shopify://apps/wolfpack-product-bundles/blocks/bundle-product-page-embed/uid-ppb";

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
