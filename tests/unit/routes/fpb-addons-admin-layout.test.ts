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
});
