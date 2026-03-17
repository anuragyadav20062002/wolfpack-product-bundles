/**
 * Unit Tests: validateTierConfig
 *
 * Tests the server-side validator that normalises raw tier config
 * input before writing to Bundle.tierConfig in the database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateTierConfig } from "../../../app/lib/tier-config-validator.server";

// ---------------------------------------------------------------------------
// Mock Prisma client — only bundle.findMany is used by the validator.
// ---------------------------------------------------------------------------
const mockFindMany = vi.fn();
const mockDb = {
  bundle: { findMany: mockFindMany },
} as any;

beforeEach(() => {
  vi.resetAllMocks();
  // By default, return all requested IDs as valid bundles.
  mockFindMany.mockImplementation(({ where }: { where: { id: { in: string[] } } }) =>
    Promise.resolve(where.id.in.map((id: string) => ({ id })))
  );
});

// ---------------------------------------------------------------------------
// Null / empty / non-array inputs
// ---------------------------------------------------------------------------

describe("validateTierConfig — invalid inputs", () => {
  it("returns [] for null input", async () => {
    expect(await validateTierConfig(null, "shop.myshopify.com", mockDb)).toEqual([]);
  });

  it("returns [] for undefined input", async () => {
    expect(await validateTierConfig(undefined, "shop.myshopify.com", mockDb)).toEqual([]);
  });

  it("returns [] for a non-array object", async () => {
    expect(await validateTierConfig({ label: "T1", linkedBundleId: "abc" }, "shop.myshopify.com", mockDb)).toEqual([]);
  });

  it("returns [] for an empty array", async () => {
    expect(await validateTierConfig([], "shop.myshopify.com", mockDb)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Valid entries
// ---------------------------------------------------------------------------

describe("validateTierConfig — valid entries", () => {
  it("returns a single valid entry", async () => {
    const result = await validateTierConfig(
      [{ label: "Buy 2 @ ₹499", linkedBundleId: "abc" }],
      "shop.myshopify.com",
      mockDb
    );
    expect(result).toEqual([{ label: "Buy 2 @ ₹499", linkedBundleId: "abc" }]);
  });

  it("returns up to 4 entries", async () => {
    const input = [
      { label: "T1", linkedBundleId: "id1" },
      { label: "T2", linkedBundleId: "id2" },
      { label: "T3", linkedBundleId: "id3" },
      { label: "T4", linkedBundleId: "id4" },
    ];
    const result = await validateTierConfig(input, "shop.myshopify.com", mockDb);
    expect(result).toHaveLength(4);
  });

  it("trims label whitespace", async () => {
    const result = await validateTierConfig(
      [{ label: "  Buy 2  ", linkedBundleId: "abc" }],
      "shop.myshopify.com",
      mockDb
    );
    expect(result[0].label).toBe("Buy 2");
  });
});

// ---------------------------------------------------------------------------
// Filtering — invalid entries are stripped
// ---------------------------------------------------------------------------

describe("validateTierConfig — filtering", () => {
  it("strips entries with empty label", async () => {
    const result = await validateTierConfig(
      [
        { label: "", linkedBundleId: "abc" },
        { label: "T2", linkedBundleId: "id2" },
      ],
      "shop.myshopify.com",
      mockDb
    );
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("T2");
  });

  it("strips entries with whitespace-only label", async () => {
    const result = await validateTierConfig(
      [{ label: "   ", linkedBundleId: "abc" }],
      "shop.myshopify.com",
      mockDb
    );
    expect(result).toEqual([]);
  });

  it("strips entries with empty linkedBundleId", async () => {
    const result = await validateTierConfig(
      [
        { label: "T1", linkedBundleId: "" },
        { label: "T2", linkedBundleId: "id2" },
      ],
      "shop.myshopify.com",
      mockDb
    );
    expect(result).toHaveLength(1);
  });

  it("strips entries with label longer than 50 characters", async () => {
    const longLabel = "A".repeat(51);
    const result = await validateTierConfig(
      [
        { label: longLabel, linkedBundleId: "abc" },
        { label: "T2", linkedBundleId: "id2" },
      ],
      "shop.myshopify.com",
      mockDb
    );
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("T2");
  });

  it("strips non-string label entries", async () => {
    const result = await validateTierConfig(
      [
        { label: 42, linkedBundleId: "abc" },
        { label: "T2", linkedBundleId: "id2" },
      ],
      "shop.myshopify.com",
      mockDb
    );
    expect(result).toHaveLength(1);
  });

  it("strips entries with linkedBundleId not belonging to the shop", async () => {
    // mockDb returns only bundles with valid IDs in the shop
    mockFindMany.mockResolvedValueOnce([{ id: "validId" }]);

    const result = await validateTierConfig(
      [
        { label: "T1", linkedBundleId: "unknownId" },
        { label: "T2", linkedBundleId: "validId" },
      ],
      "shop.myshopify.com",
      mockDb
    );
    expect(result).toHaveLength(1);
    expect(result[0].linkedBundleId).toBe("validId");
  });

  it("slices to at most 4 entries even if more pass validation", async () => {
    const input = Array.from({ length: 6 }, (_, i) => ({ label: `T${i + 1}`, linkedBundleId: `id${i + 1}` }));
    const result = await validateTierConfig(input, "shop.myshopify.com", mockDb);
    expect(result).toHaveLength(4);
  });
});
