/**
 * Unit tests for the loader cache.
 *
 * Issue: admin-lcp-phase4-loaders-1.
 */

import { loaderCache } from "../../../app/lib/loader-cache.server";

beforeEach(() => loaderCache.reset());

describe("LoaderCache.get / set", () => {
  it("returns undefined for missing keys", () => {
    expect(loaderCache.get("nope")).toBeUndefined();
  });

  it("returns the value for unexpired keys", () => {
    loaderCache.set("k", { hello: "world" }, 30_000);
    expect(loaderCache.get("k")).toEqual({ hello: "world" });
  });

  it("returns undefined once TTL has elapsed", () => {
    loaderCache.set("k", 1, 1);
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(loaderCache.get("k")).toBeUndefined();
        resolve();
      }, 10);
    });
  });
});

describe("LoaderCache.memo", () => {
  it("invokes the loader fn exactly once on a cache miss", async () => {
    let calls = 0;
    const result1 = await loaderCache.memo("m", async () => { calls += 1; return 42; });
    const result2 = await loaderCache.memo("m", async () => { calls += 1; return 99; });
    expect(result1).toBe(42);
    expect(result2).toBe(42);
    expect(calls).toBe(1);
  });

  it("dedupes concurrent in-flight calls to the same key", async () => {
    let calls = 0;
    const slow = () => new Promise<number>(resolve => {
      calls += 1;
      setTimeout(() => resolve(calls), 30);
    });
    const [a, b, c] = await Promise.all([
      loaderCache.memo("slow", slow),
      loaderCache.memo("slow", slow),
      loaderCache.memo("slow", slow),
    ]);
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(1);
    expect(calls).toBe(1);
  });

  it("re-runs the loader after invalidate()", async () => {
    let calls = 0;
    await loaderCache.memo("x", async () => { calls += 1; return calls; });
    loaderCache.invalidate("x");
    const result = await loaderCache.memo("x", async () => { calls += 1; return calls; });
    expect(result).toBe(2);
    expect(calls).toBe(2);
  });
});

describe("LoaderCache.invalidatePrefix", () => {
  it("removes every key matching the prefix", () => {
    loaderCache.set("shop:s1:a", 1);
    loaderCache.set("shop:s1:b", 2);
    loaderCache.set("shop:s2:a", 3);
    loaderCache.invalidatePrefix("shop:s1:");
    expect(loaderCache.get("shop:s1:a")).toBeUndefined();
    expect(loaderCache.get("shop:s1:b")).toBeUndefined();
    expect(loaderCache.get("shop:s2:a")).toBe(3);
  });
});
