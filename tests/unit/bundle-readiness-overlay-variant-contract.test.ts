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

const fpbRouteSource = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);

const ppbRouteSource = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);

describe("BundleReadinessOverlay variant contract", () => {
  it("lets the create wizard opt into the compact gauge-only overlay", () => {
    const overlayStart = createRouteSource.indexOf("<BundleReadinessOverlay");
    const overlayEnd = createRouteSource.indexOf("/>", overlayStart);
    const overlaySource = createRouteSource.slice(overlayStart, overlayEnd);

    expect(overlaySource).toContain('variant="compact"');
  });

  it("keeps configure pages on the detailed readiness overlay", () => {
    for (const routeSource of [fpbRouteSource, ppbRouteSource]) {
      const overlayStart = routeSource.indexOf("<BundleReadinessOverlay");
      const overlayEnd = routeSource.indexOf("/>", overlayStart);
      const overlaySource = routeSource.slice(overlayStart, overlayEnd);

      expect(overlaySource).not.toContain('variant="compact"');
    }
  });

  it("prevents compact overlays from rendering checklist rows or chevrons", () => {
    expect(componentSource).toContain('variant?: "detailed" | "compact";');
    expect(componentSource).toContain('const isCompact = variant === "compact";');
    expect(componentSource).toContain("{!isCompact && expanded && <div className={styles.dimOverlay} onClick={toggle} />}");
    expect(componentSource).toContain("{!isCompact && (");
    expect(componentSource).toContain("{!isCompact && chevron}");
  });
});
