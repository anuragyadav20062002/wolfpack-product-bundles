/**
 * Embedded Admin UI i18n contract.
 *
 * Issue: admin-ui-i18n-1
 * Spec : test-spec/admin-ui-i18n.spec.md
 */
import fs from "node:fs";
import path from "node:path";
import {
  SUPPORTED_LOCALES,
  normalizeAdminLocale,
} from "../../../app/i18n/config";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value)
    .flatMap(([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key))
    .sort();
}

describe("embedded Admin locale configuration", () => {
  it("supports the Polaris-compatible dashboard locales", () => {
    expect(SUPPORTED_LOCALES).toEqual([
      "en",
      "fr",
      "de",
      "es",
      "ja",
      "pt-BR",
    ]);
  });

  it("preserves supported locales and defaults unsupported locales to English", () => {
    expect(normalizeAdminLocale("fr")).toBe("fr");
    expect(normalizeAdminLocale("xx")).toBe("en");
    expect(normalizeAdminLocale(null)).toBe("en");
  });

  it("keeps every supported locale catalog key-compatible with English", () => {
    const localeDir = path.join(process.cwd(), "app/i18n/locales");
    const english = JSON.parse(fs.readFileSync(path.join(localeDir, "en.json"), "utf8"));
    const englishKeys = flattenKeys(english);

    for (const locale of SUPPORTED_LOCALES) {
      const file = path.join(localeDir, `${locale}.json`);
      expect(fs.existsSync(file)).toBe(true);
      const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
      expect(flattenKeys(catalog)).toEqual(englishKeys);
    }
  });

});

describe("shop-wide Admin locale wiring contract", () => {
  const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
  const appShell = fs.readFileSync(path.join(process.cwd(), "app/routes/app/app.tsx"), "utf8");
  const dashboard = fs.readFileSync(
    path.join(process.cwd(), "app/routes/app/app.dashboard/route.tsx"),
    "utf8",
  );

  it("stores the Admin locale on Shop rather than Session", () => {
    expect(schema).toMatch(/model Shop \{[\s\S]*?adminLocale\s+String\?/);
  });

  it("loads the authoritative shop-wide locale in the app shell", () => {
    expect(appShell).toContain("loadShopAdminLocale");
    expect(appShell).toContain("const locale = await loadShopAdminLocale(session.shop)");
  });

  it("translates the global embedded Admin navigation", () => {
    expect(appShell).toContain('t("nav.dashboard")');
    expect(appShell).toContain('t("nav.designControlPanel")');
    expect(appShell).toContain('t("nav.analytics")');
    expect(appShell).toContain('t("nav.pricing")');
    expect(appShell).toContain('t("nav.events")');
  });

  it("adds a dashboard save intent for shop-wide locale persistence", () => {
    expect(dashboard).toContain('intent === "saveAdminLocale"');
    expect(dashboard).toContain('formData.append("intent", "saveAdminLocale")');
  });

  it("does not write browser cache from the unsaved dropdown change handler", () => {
    const handler = dashboard.match(
      /const handleLanguageChange = useCallback\([\s\S]*?\n  \}, \[[^\]]*\]\);/,
    )?.[0];
    expect(handler).toBeDefined();
    expect(handler).not.toContain("localStorage.setItem");
  });

  it("updates browser cache only after the save response confirms the locale", () => {
    expect(dashboard).toContain('localStorage.setItem("wolfpack-locale", data.locale)');
  });
});
