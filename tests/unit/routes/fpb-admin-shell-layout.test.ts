import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page configure Admin shell", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
    "utf8",
  );
  const cssSource = readFileSync(
    join(process.cwd(), "app/styles/routes/full-page-bundle-configure.module.css"),
    "utf8",
  );

  it("lets the Shopify app shell title row replace the breadcrumb title bar", () => {
    const previousRouteTitle = ["title={`Configure: ", "{formState.bundleName}`}"].join("$");

    expect(routeSource).not.toContain("<ui-title-bar");
    expect(routeSource).not.toContain(previousRouteTitle);

    [
      "appShellHeader",
      "appShellBrand",
      "appShellLogo",
      "appShellTitle",
      "appShellMenu",
    ].forEach((marker) => {
      expect(routeSource).not.toContain(`fullPageBundleStyles.${marker}`);
      expect(cssSource).not.toContain(`.${marker}`);
    });

    expect(routeSource).toContain("Configure Bundle Flow");
    expect(routeSource).toContain("Readiness Score");
    expect(routeSource).toContain("Preview Bundle");
  });
});
