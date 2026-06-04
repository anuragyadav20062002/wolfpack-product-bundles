import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page Add-ons Admin layout", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
    "utf8",
  );
  const cssSource = readFileSync(
    join(process.cwd(), "app/styles/routes/full-page-bundle-configure.module.css"),
    "utf8",
  );

  it("uses dedicated visual markers for the evidence-backed Add-ons card", () => {
    [
      "addonsCard",
      "addonsHeaderLine",
      "addonsHeaderActions",
      "addonsLanguageButton",
      "addonsTierCard",
      "addonsProductSelectionRow",
      "addonsDiscountGrid",
      "addonsTierRules",
      "addonsTierButton",
    ].forEach((marker) => {
      expect(routeSource).toContain(`fullPageBundleStyles.${marker}`);
      expect(cssSource).toContain(`.${marker}`);
    });
  });

  it("wires add-on tier rule contract hooks", () => {
    expect(routeSource).toContain("getAddonConditions = (tier: any) =>");
    expect(routeSource).toContain("addAddonTierCondition");
    expect(routeSource).toContain("removeAddonTierCondition");
    expect(routeSource).toContain("updateAddonTierCondition");
    expect(routeSource).toContain("createDefaultAddonTierCondition");
    expect(routeSource).toContain("value: String(condition?.value ?? \"01\")");
    expect(routeSource).toContain("conditions: Array.isArray(tier?.conditions)");
  });

});
