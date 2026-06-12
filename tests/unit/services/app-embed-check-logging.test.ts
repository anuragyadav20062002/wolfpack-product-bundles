import { checkAppEmbedEnabled } from "../../../app/services/theme/app-embed-check.server";
import { AppLogger } from "../../../app/lib/logger";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

function makeAdmin(responses: unknown[]) {
  let callIndex = 0;
  const graphql = jest.fn().mockImplementation(() => {
    const body = responses[callIndex++] ?? { data: null };
    return Promise.resolve({ json: async () => body });
  });
  return { graphql };
}

const THEME_ID = "gid://shopify/OnlineStoreTheme/123456";

describe("checkAppEmbedEnabled logging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fails open for malformed settings_data.json without warning logs", async () => {
    const admin = makeAdmin([
      {
        data: {
          themes: {
            nodes: [{ id: THEME_ID }],
          },
        },
      },
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

    expect(result).toEqual({ enabled: true, themeId: THEME_ID });
    expect(AppLogger.warn).not.toHaveBeenCalled();
  });
});
