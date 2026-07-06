import {
  buildDashboardLocaleSearchParams,
  shouldApplyDashboardLocaleSave,
} from "../../../app/routes/app/app.dashboard/dashboard-locale-state";

describe("dashboard locale state", () => {
  it("applies the first saved locale response", () => {
    expect(shouldApplyDashboardLocaleSave("fr", null)).toBe(true);
  });

  it("skips a replayed saved locale response", () => {
    expect(shouldApplyDashboardLocaleSave("fr", "fr")).toBe(false);
  });

  it("applies a different saved locale response", () => {
    expect(shouldApplyDashboardLocaleSave("de", "fr")).toBe(true);
  });

  it("does not build new URL params when the locale is already current", () => {
    expect(buildDashboardLocaleSearchParams(new URLSearchParams("locale=fr&page=2"), "fr")).toBeNull();
  });

  it("keeps existing URL params while setting a changed locale", () => {
    const next = buildDashboardLocaleSearchParams(new URLSearchParams("page=2"), "fr");

    expect(next?.toString()).toBe("page=2&locale=fr");
  });
});
