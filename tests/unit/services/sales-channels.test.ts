/**
 * Tests for multi-channel publication logic (Phase 2)
 */

// Mock dependencies before imports
jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("../../../app/shopify.server", () => ({
  __esModule: true,
  default: {},
  authenticate: { admin: jest.fn() },
}));

import { discoverSalesChannels } from "../../../app/routes/app/app.dashboard/handlers/handlers.server";

describe("discoverSalesChannels", () => {
  const createMockAdmin = (publications: Array<{ id: string; name: string }>) => ({
    graphql: jest.fn().mockResolvedValue({
      json: () => Promise.resolve({
        data: {
          publications: {
            edges: publications.map((pub) => ({ node: pub })),
          },
        },
      }),
    }),
  });

  it("returns all available channels", async () => {
    const channels = [
      { id: "gid://shopify/Publication/1", name: "Online Store" },
      { id: "gid://shopify/Publication/2", name: "Google & YouTube" },
      { id: "gid://shopify/Publication/3", name: "Facebook & Instagram" },
    ];
    const admin = createMockAdmin(channels);

    const result = await discoverSalesChannels(admin);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: "gid://shopify/Publication/1", name: "Online Store" });
    expect(result[1]).toEqual({ id: "gid://shopify/Publication/2", name: "Google & YouTube" });
    expect(result[2]).toEqual({ id: "gid://shopify/Publication/3", name: "Facebook & Instagram" });
  });

  it("returns empty array when no publications exist", async () => {
    const admin = createMockAdmin([]);
    const result = await discoverSalesChannels(admin);
    expect(result).toHaveLength(0);
  });

  it("returns empty array on graphql error", async () => {
    const admin = {
      graphql: jest.fn().mockRejectedValue(new Error("Network error")),
    };
    const result = await discoverSalesChannels(admin);
    expect(result).toHaveLength(0);
  });
});
