import fs from "node:fs";
import path from "node:path";

const componentSource = fs.readFileSync(
  path.join(process.cwd(), "app/components/bundle-configure/BundleReadinessOverlay.tsx"),
  "utf8",
);

const createRouteSource = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx"),
  "utf8",
);

const configureRouteSources = [
  fs.readFileSync(
    path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
    "utf8",
  ),
  fs.readFileSync(
    path.join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
    "utf8",
  ),
];

describe("Bundle readiness score state contract", () => {
  it("maps low, medium, and high scores to distinct EB-style score colors", () => {
    expect(componentSource).toContain('if (score >= 80) return "#008060";');
    expect(componentSource).toContain('if (score >= 40) return "#005bd3";');
    expect(componentSource).toContain('return "#d82c0d";');
  });

  it("uses separate low, near-complete, and ready footer copy states", () => {
    expect(componentSource).toContain('if (allDone) return "Your bundle is ready to sell!";');
    expect(componentSource).toContain('if (score >= 80) return "Almost there. A few more steps to go.";');
    expect(componentSource).toContain('if (score >= 40) return "Almost there. A few more steps to go.";');
    expect(componentSource).toContain('return "Complete the remaining steps to get your bundle ready.";');
  });

  it("keeps create wizard compact and configure pages detailed", () => {
    const createOverlayStart = createRouteSource.indexOf("<BundleReadinessOverlay");
    const createOverlayEnd = createRouteSource.indexOf("/>", createOverlayStart);
    const createOverlaySource = createRouteSource.slice(createOverlayStart, createOverlayEnd);
    expect(createOverlaySource).toContain('variant="compact"');

    for (const routeSource of configureRouteSources) {
      const configureOverlayStart = routeSource.indexOf("<BundleReadinessOverlay");
      const configureOverlayEnd = routeSource.indexOf("/>", configureOverlayStart);
      const configureOverlaySource = routeSource.slice(configureOverlayStart, configureOverlayEnd);
      expect(configureOverlaySource).not.toContain('variant="compact"');
    }
  });
});
