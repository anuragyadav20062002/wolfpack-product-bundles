/**
 * Unit tests for the Server-Timing helper.
 *
 * Issue: admin-lcp-measurement-1.
 */

import { ServerTiming, mergeServerTimingHeaders } from "../../../app/lib/server-timing.server";

describe("ServerTiming.track", () => {
  it("records a single async span and emits a Server-Timing header value", async () => {
    const t = new ServerTiming();
    const out = await t.track("auth", async () => {
      await sleep(15);
      return "ok";
    });
    expect(out).toBe("ok");
    const list = t.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("auth");
    expect(list[0].durationMs).toBeGreaterThanOrEqual(10);
    const header = t.toHeader();
    expect(header.startsWith("auth;dur=")).toBe(true);
    expect(Number.isFinite(Number(header.slice("auth;dur=".length)))).toBe(true);
  });

  it("records duration even when the inner fn throws and re-throws", async () => {
    const t = new ServerTiming();
    await expect(
      t.track("boom", async () => {
        throw new Error("nope");
      }),
    ).rejects.toThrow("nope");
    const list = t.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("boom.err");
  });
});

describe("ServerTiming.trackAll", () => {
  it("runs tasks in parallel and tags each", async () => {
    const t = new ServerTiming();
    const start = performance.now();
    const result = await t.trackAll({
      a: () => sleep(20).then(() => 1),
      b: () => sleep(20).then(() => 2),
    });
    const elapsed = performance.now() - start;
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
    // Parallel: total should be < ~30 ms (well under 2 * 20).
    expect(elapsed).toBeLessThan(35);
    expect(t.list()).toHaveLength(2);
    expect(t.toHeader()).toContain("a;dur=");
    expect(t.toHeader()).toContain("b;dur=");
  });

  it("returns a plain object keyed by task name, NOT an array (regression)", async () => {
    // This shape contract is critical for callers — destructuring as an array
    // would throw "(intermediate value) is not iterable" at runtime.
    const t = new ServerTiming();
    const result = await t.trackAll({
      "embed-check": () => Promise.resolve({ enabled: true }),
      billing: () => Promise.resolve({ plan: "free" }),
    });
    expect(Array.isArray(result)).toBe(false);
    expect(Symbol.iterator in (result as object)).toBe(false);
    expect(typeof (result as Record<string, unknown>)["embed-check"]).toBe("object");
    expect((result as { billing: { plan: string } }).billing.plan).toBe("free");
  });

  it("supports hyphenated task names so Server-Timing tokens stay W3C-compliant", async () => {
    const t = new ServerTiming();
    const result = await t.trackAll({
      "owner-name": () => Promise.resolve("Aditya"),
      "proxy-health": () => Promise.resolve(true),
    });
    expect((result as Record<string, unknown>)["owner-name"]).toBe("Aditya");
    expect((result as Record<string, unknown>)["proxy-health"]).toBe(true);
    expect(t.toHeader()).toContain("owner-name;dur=");
    expect(t.toHeader()).toContain("proxy-health;dur=");
  });
});

describe("ServerTiming.toHeader sanitization", () => {
  it("strips illegal characters from entry names", async () => {
    const t = new ServerTiming();
    await t.track("db query weird!", () => Promise.resolve(0));
    expect(t.toHeader()).toMatch(/^db_query_weird_;dur=/);
  });

  it("supports description attribute", async () => {
    const t = new ServerTiming();
    await t.track("db.bundles", () => Promise.resolve(0), "primary bundle fetch");
    expect(t.toHeader()).toMatch(/^db\.bundles;desc="primary bundle fetch";dur=/);
  });

  it("returns empty header when no entries recorded", () => {
    const t = new ServerTiming();
    expect(t.toHeader()).toBe("");
    expect(t.toHeaders()).toEqual({});
  });
});

describe("mergeServerTimingHeaders", () => {
  it("joins parent and child headers", () => {
    expect(mergeServerTimingHeaders("auth;dur=10", "db;dur=20")).toBe("auth;dur=10, db;dur=20");
  });

  it("returns single side when other is empty or undefined", () => {
    expect(mergeServerTimingHeaders(undefined, "db;dur=20")).toBe("db;dur=20");
    expect(mergeServerTimingHeaders("auth;dur=10", "")).toBe("auth;dur=10");
  });

  it("returns undefined when both empty", () => {
    expect(mergeServerTimingHeaders(null, undefined)).toBeUndefined();
    expect(mergeServerTimingHeaders("", "")).toBeUndefined();
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
