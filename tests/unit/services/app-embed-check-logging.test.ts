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

  it("treats malformed settings_data.json as disabled without warning logs", async () => {
    const admin = makeAdmin([
      {
        data: {
          themes: {
            nodes: [{ id: THEME_ID, name: "Main", role: "MAIN" }],
            pageInfo: { hasNextPage: false, endCursor: null },
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

    expect(result).toEqual(expect.objectContaining({ enabled: false, themeId: THEME_ID }));
    expect(AppLogger.debug).not.toHaveBeenCalled();
    expect(AppLogger.warn).not.toHaveBeenCalled();
  });
});
