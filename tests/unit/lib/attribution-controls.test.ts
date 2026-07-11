import {
  analyzeCustomUtmInput,
  formatCustomUtmParameters,
  normalizeAttributionWindow,
  parseCustomUtmInput,
} from "../../../app/lib/analytics/attribution-controls";

describe("attribution controls", () => {
  const now = new Date("2026-07-11T12:00:00.000Z");

  it("defaults invalid days to a 30-day inclusive window", () => {
    const window = normalizeAttributionWindow(new URLSearchParams("days=abc"), now);

    expect(window.days).toBe(30);
    expect(window.since.toISOString()).toBe("2026-06-12T00:00:00.000Z");
    expect(window.until.toISOString()).toBe("2026-07-11T23:59:59.999Z");
  });

  it("clamps preset days to 90", () => {
    const window = normalizeAttributionWindow(new URLSearchParams("days=365"), now);

    expect(window.days).toBe(90);
    expect(window.since.toISOString()).toBe("2026-04-13T00:00:00.000Z");
    expect(window.until.toISOString()).toBe("2026-07-11T23:59:59.999Z");
  });

  it("builds seven inclusive calendar days for a 7-day preset", () => {
    const window = normalizeAttributionWindow(new URLSearchParams("days=7"), now);

    expect(window.days).toBe(7);
    expect(window.since.toISOString()).toBe("2026-07-05T00:00:00.000Z");
    expect(window.until.toISOString()).toBe("2026-07-11T23:59:59.999Z");
  });

  it("keeps custom ranges bounded to their selected to date", () => {
    const window = normalizeAttributionWindow(
      new URLSearchParams("from=2026-06-01&to=2026-06-07"),
      now,
    );

    expect(window.days).toBe(7);
    expect(window.from).toBe("2026-06-01");
    expect(window.to).toBe("2026-06-07");
    expect(window.since.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(window.until.toISOString()).toBe("2026-06-07T23:59:59.999Z");
  });

  it("falls back to default days when a custom range is reversed", () => {
    const window = normalizeAttributionWindow(
      new URLSearchParams("from=2026-06-07&to=2026-06-01&days=7"),
      now,
    );

    expect(window.days).toBe(7);
    expect(window.from).toBeUndefined();
    expect(window.to).toBeUndefined();
  });

  it("sanitizes merchant-entered custom UTM parameter names", () => {
    const result = parseCustomUtmInput(`
      utm_influencer, Partner-ID
      email
      utm_influencer
      ${Array.from({ length: 12 }, (_, index) => `extra_${index}`).join(",")}
    `);

    expect(result).toEqual([
      "utm_influencer",
      "partner-id",
      "extra_0",
      "extra_1",
      "extra_2",
      "extra_3",
      "extra_4",
      "extra_5",
      "extra_6",
      "extra_7",
    ]);
  });

  it("formats saved custom UTM parameters for a textarea", () => {
    expect(formatCustomUtmParameters(["utm_influencer", "partner-id"])).toBe(
      "utm_influencer\npartner-id",
    );
  });

  it("analyzes accepted, rejected, and capped custom UTM names for UI feedback", () => {
    const analysis = analyzeCustomUtmInput(`
      utm_influencer, partner-id
      email
      ${Array.from({ length: 12 }, (_, index) => `extra_${index}`).join("\n")}
    `);

    expect(analysis.accepted).toHaveLength(10);
    expect(analysis.accepted).toContain("utm_influencer");
    expect(analysis.accepted).toContain("partner-id");
    expect(analysis.rejected).toEqual(["email"]);
    expect(analysis.limitReached).toBe(true);
  });
});
