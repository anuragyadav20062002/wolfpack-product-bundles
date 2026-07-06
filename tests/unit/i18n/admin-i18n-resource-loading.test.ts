import {
  SUPPORTED_LOCALES,
  i18n,
  loadAdminLocaleResources,
} from "../../../app/i18n/config";

describe("Admin i18n resource loading", () => {
  it("boots with only the English Admin catalog on the critical path", () => {
    expect(i18n.hasResourceBundle("en", "translation")).toBe(true);

    for (const locale of SUPPORTED_LOCALES.filter(locale => locale !== "en")) {
      expect(i18n.hasResourceBundle(locale, "translation")).toBe(false);
    }
  });

  it("refreshes stale in-memory English copy before server rendering", async () => {
    const translation = i18n.getResourceBundle("en", "translation") as {
      common: { actions: Record<string, string> };
    };
    delete translation.common.actions.learnMore;
    expect(i18n.t("common.actions.learnMore", { lng: "en" }))
      .toBe("common.actions.learnMore");

    await loadAdminLocaleResources("en");

    expect(i18n.t("common.actions.learnMore", { lng: "en" })).toBe("Learn More");
  });

  it("loads a non-English Admin catalog on demand", async () => {
    await loadAdminLocaleResources("fr");

    expect(i18n.hasResourceBundle("fr", "translation")).toBe(true);
    expect(i18n.t("nav.dashboard", { lng: "fr" })).toBe("Tableau de bord");
  });
});
