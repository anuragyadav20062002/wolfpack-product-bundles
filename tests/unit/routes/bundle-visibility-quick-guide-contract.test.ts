import { readFileSync } from "node:fs";
import { join } from "node:path";

const routePaths = [
  "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
];

describe("Bundle Visibility quick-guide contract", () => {
  it("renders sanitized in-app guide details instead of placeholder external links", () => {
    for (const routePath of routePaths) {
      const source = readFileSync(join(process.cwd(), routePath), "utf8");
      const sectionStart = source.indexOf("Publishing Best Practices");
      const sectionEnd = source.indexOf("Your Bundle Link", sectionStart);
      const visibilityGuidesSection = source.slice(sectionStart, sectionEnd);

      expect(sectionStart).toBeGreaterThan(-1);
      expect(sectionEnd).toBeGreaterThan(sectionStart);
      expect(visibilityGuidesSection).toContain("Quick Setup Guide");
      expect(visibilityGuidesSection).toContain("5 min setup");
      expect(visibilityGuidesSection).toContain("Copy your bundle link, open the theme editor");
      expect(visibilityGuidesSection).toContain("Content > Menus");
      expect(visibilityGuidesSection).toContain("enable the announcement bar");
      expect(visibilityGuidesSection).toContain("select Featured Collection");
      expect(visibilityGuidesSection).not.toContain("https://wolfpackapps.com");
    }
  });
});
