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

  it("loads a non-English Admin catalog on demand", async () => {
    await loadAdminLocaleResources("fr");

    expect(i18n.hasResourceBundle("fr", "translation")).toBe(true);
    expect(i18n.t("nav.dashboard", { lng: "fr" })).toBe("Tableau de bord");
  });
});
