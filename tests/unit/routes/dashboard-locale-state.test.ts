import {
  applyDashboardLocaleSelection,
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

  it("switches i18n immediately before submitting the locale save", async () => {
    const events: string[] = [];
    const setSelectedLanguage = jest.fn((locale: string) => {
      events.push(`set:${locale}`);
    });
    const changeLanguage = jest.fn(async (locale: string) => {
      events.push(`change:${locale}`);
    });
    const submit = jest.fn(() => {
      events.push("submit");
    });

    await applyDashboardLocaleSelection({
      locale: "fr",
      activeLanguage: "en",
      setSelectedLanguage,
      changeLanguage,
      submit,
    });

    expect(setSelectedLanguage).toHaveBeenCalledWith("fr");
    expect(changeLanguage).toHaveBeenCalledWith("fr");
    expect(submit).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["set:fr", "change:fr", "submit"]);
  });

  it("does not resubmit or switch i18n when selecting the active locale", async () => {
    const setSelectedLanguage = jest.fn();
    const changeLanguage = jest.fn();
    const submit = jest.fn();

    await applyDashboardLocaleSelection({
      locale: "en",
      activeLanguage: "en",
      setSelectedLanguage,
      changeLanguage,
      submit,
    });

    expect(setSelectedLanguage).toHaveBeenCalledWith("en");
    expect(changeLanguage).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });
});
