/**
 * Unit Tests for writeBundleConfigPageMetafield
 *
 * Tests: happy path, userErrors warning (non-fatal), null pageId skip
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock logger
vi.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    startTimer: vi.fn(() => vi.fn()),
  },
}));

// Mock formatBundleForWidget to return a predictable shape
vi.mock("../../../app/lib/bundle-formatter.server", () => ({
  formatBundleForWidget: vi.fn((bundle: any) => ({
    id: bundle.id,
    name: bundle.name,
    steps: [],
    pricing: null,
  })),
}));

import { writeBundleConfigPageMetafield } from "../../../app/services/widget-installation/widget-full-page-bundle.server";
import { AppLogger } from "../../../app/lib/logger";

const makeBundle = (overrides: Record<string, unknown> = {}) => ({
  id: "bundle-1",
  name: "Test Bundle",
  description: "desc",
  status: "ACTIVE",
  bundleType: "full_page",
  steps: [],
  pricing: null,
  ...overrides,
});

function makeAdmin(opts: {
  userErrors?: { field: string; message: string }[];
  throws?: boolean;
} = {}) {
  const graphql = vi.fn();

  if (opts.throws) {
    graphql.mockRejectedValue(new Error("GraphQL network failure"));
  } else {
    graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            metafieldsSet: {
              metafields: [{ id: "gid://shopify/Metafield/1", key: "bundle_config" }],
              userErrors: opts.userErrors ?? [],
            },
          },
        }),
    });
  }

  return { graphql };
}

describe("writeBundleConfigPageMetafield", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns early without calling graphql when pageId is null", async () => {
    const admin = makeAdmin();
    await writeBundleConfigPageMetafield(admin, null, makeBundle());
    expect(admin.graphql).not.toHaveBeenCalled();
  });

  it("returns early without calling graphql when pageId is undefined", async () => {
    const admin = makeAdmin();
    await writeBundleConfigPageMetafield(admin, undefined as any, makeBundle());
    expect(admin.graphql).not.toHaveBeenCalled();
  });

  it("calls metafieldsSet with bundle_config JSON on the page", async () => {
    const admin = makeAdmin();
    const pageId = "gid://shopify/Page/42";
    const bundle = makeBundle();

    await writeBundleConfigPageMetafield(admin, pageId, bundle);

    expect(admin.graphql).toHaveBeenCalledOnce();
    const call = admin.graphql.mock.calls[0];
    const variables = call[1].variables;
    expect(variables.metafields[0].ownerId).toBe(pageId);
    expect(variables.metafields[0].namespace).toBe("custom");
    expect(variables.metafields[0].key).toBe("bundle_config");
    expect(variables.metafields[0].type).toBe("json");
    // Value should be valid JSON containing bundle id
    const parsed = JSON.parse(variables.metafields[0].value);
    expect(parsed.id).toBe("bundle-1");
    expect(parsed.name).toBe("Test Bundle");
  });

  it("logs a warning (non-fatal) when userErrors are returned", async () => {
    const admin = makeAdmin({
      userErrors: [{ field: "value", message: "Value too large" }],
    });
    const pageId = "gid://shopify/Page/99";

    // Should not throw
    await expect(
      writeBundleConfigPageMetafield(admin, pageId, makeBundle())
    ).resolves.toBeUndefined();

    expect(AppLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("bundle_config"),
      expect.objectContaining({ pageId }),
      expect.anything()
    );
  });

  it("logs an error (non-fatal) when graphql throws", async () => {
    const admin = makeAdmin({ throws: true });
    const pageId = "gid://shopify/Page/77";

    // Should not throw — errors are caught internally
    await expect(
      writeBundleConfigPageMetafield(admin, pageId, makeBundle())
    ).resolves.toBeUndefined();

    expect(AppLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("bundle_config"),
      expect.objectContaining({ pageId }),
      expect.any(Error)
    );
  });
});
