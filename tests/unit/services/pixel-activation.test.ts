/**
 * Unit Tests: Pixel Activation Service
 *
 * Covers getPixelStatus, deactivateUtmPixel, and activateUtmPixel
 * with mocked Shopify admin graphql client.
 */

import {
  getPixelStatus,
  deactivateUtmPixel,
  activateUtmPixel,
} from "../../../app/services/pixel-activation.server";

function makeAdmin(graphqlImpl: jest.Mock) {
  return { graphql: graphqlImpl };
}

function makeResponse(body: unknown) {
  return { json: async () => body };
}

// ── getPixelStatus ─────────────────────────────────────────────

describe("getPixelStatus", () => {
  it("returns active:true with pixelId when pixel exists", async () => {
    const graphql = jest.fn().mockResolvedValue(
      makeResponse({ data: { webPixel: { id: "gid://shopify/WebPixel/1" } } })
    );
    const result = await getPixelStatus(makeAdmin(graphql));
    expect(result).toEqual({ active: true, pixelId: "gid://shopify/WebPixel/1" });
  });

  it("returns active:false when query returns null webPixel", async () => {
    const graphql = jest.fn().mockResolvedValue(
      makeResponse({ data: { webPixel: null } })
    );
    const result = await getPixelStatus(makeAdmin(graphql));
    expect(result).toEqual({ active: false, pixelId: null });
  });

  it("returns active:false when Shopify throws a GraphQL execution error", async () => {
    const graphql = jest.fn().mockRejectedValue(new Error("No web pixel was found"));
    const result = await getPixelStatus(makeAdmin(graphql));
    expect(result).toEqual({ active: false, pixelId: null });
  });
});

// ── deactivateUtmPixel ─────────────────────────────────────────

describe("deactivateUtmPixel", () => {
  it("returns success:true when pixel found and deleted", async () => {
    const graphql = jest.fn()
      // First call: query webPixel
      .mockResolvedValueOnce(
        makeResponse({ data: { webPixel: { id: "gid://shopify/WebPixel/1" } } })
      )
      // Second call: delete mutation
      .mockResolvedValueOnce(
        makeResponse({
          data: {
            webPixelDelete: {
              deletedWebPixelId: "gid://shopify/WebPixel/1",
              userErrors: [],
            },
          },
        })
      );
    const result = await deactivateUtmPixel(makeAdmin(graphql));
    expect(result).toEqual({ success: true });
    expect(graphql).toHaveBeenCalledTimes(2);
  });

  it("returns success:true when no pixel exists (already inactive)", async () => {
    const graphql = jest.fn().mockRejectedValue(new Error("No web pixel was found"));
    const result = await deactivateUtmPixel(makeAdmin(graphql));
    expect(result).toEqual({ success: true });
    // Only the query was attempted — no delete call
    expect(graphql).toHaveBeenCalledTimes(1);
  });

  it("returns success:false when delete mutation returns userErrors", async () => {
    const graphql = jest.fn()
      .mockResolvedValueOnce(
        makeResponse({ data: { webPixel: { id: "gid://shopify/WebPixel/1" } } })
      )
      .mockResolvedValueOnce(
        makeResponse({
          data: {
            webPixelDelete: {
              deletedWebPixelId: null,
              userErrors: [{ field: "id", message: "Pixel not found", code: "NOT_FOUND" }],
            },
          },
        })
      );
    const result = await deactivateUtmPixel(makeAdmin(graphql));
    expect(result.success).toBe(false);
    expect(result.error).toContain("NOT_FOUND");
  });
});

// ── activateUtmPixel ───────────────────────────────────────────

describe("activateUtmPixel", () => {
  it("returns success:true with pixelId when create succeeds", async () => {
    const graphql = jest.fn()
      // query — no existing pixel
      .mockRejectedValueOnce(new Error("No web pixel was found"))
      // create
      .mockResolvedValueOnce(
        makeResponse({
          data: {
            webPixelCreate: {
              webPixel: { id: "gid://shopify/WebPixel/2", settings: {} },
              userErrors: [],
            },
          },
        })
      );
    const result = await activateUtmPixel(makeAdmin(graphql), "https://app.example.com");
    expect(result).toEqual({ success: true, pixelId: "gid://shopify/WebPixel/2", deleted: false });
  });

  it("returns success:false when create returns userErrors", async () => {
    const graphql = jest.fn()
      .mockRejectedValueOnce(new Error("No web pixel was found"))
      .mockResolvedValueOnce(
        makeResponse({
          data: {
            webPixelCreate: {
              webPixel: null,
              userErrors: [{ field: null, message: "Extension not deployed", code: "INVALID" }],
            },
          },
        })
      );
    const result = await activateUtmPixel(makeAdmin(graphql), "https://app.example.com");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
