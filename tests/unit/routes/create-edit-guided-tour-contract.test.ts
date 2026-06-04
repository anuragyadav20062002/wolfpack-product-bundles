import fs from "node:fs";
import path from "node:path";

const tourStepsSource = fs.readFileSync(
  path.join(process.cwd(), "app/components/bundle-configure/tourSteps.ts"),
  "utf8",
);

const guidedTourSource = fs.readFileSync(
  path.join(process.cwd(), "app/components/bundle-configure/BundleGuidedTour.tsx"),
  "utf8",
);

const ppbRouteSource = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);

const fpbRouteSource = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);

describe("create edit-screen guided tour contract", () => {
  it("uses edit-screen section metadata for PPB and FPB tour steps", () => {
    expect(tourStepsSource).toContain('sectionId: "step_setup"');
    expect(tourStepsSource).toContain('sectionId: "bundle_visibility"');
    expect(tourStepsSource).toContain('sectionId: "bundle_widget"');
    expect(tourStepsSource).toContain('sectionId: "bundle_settings"');
    expect(tourStepsSource).not.toContain("WIZARD_CONFIGURE_TOUR_STEPS");
  });

  it("lets configure routes switch active edit sections before each tour step is measured", () => {
    for (const routeSource of [ppbRouteSource, fpbRouteSource]) {
      expect(routeSource).toContain("const handleGuidedTourStepChange = useCallback");
      expect(routeSource).toContain("step.sectionId");
      expect(routeSource).toContain("setActiveSection(step.sectionId)");
      expect(routeSource).toContain('setReadinessOpen(step.targetSection === "fpb-readiness-score")');
      expect(routeSource).toContain("onStepChange={handleGuidedTourStepChange}");
      expect(routeSource).toContain("enabled={loaderData.showFirstLoadTour === true}");
    }
  });

  it("rebuilds the tour around route-aware target lookup and stable measurement", () => {
    expect(guidedTourSource).toContain("onStepChange?: (step: TourStep, index: number) => void");
    expect(guidedTourSource).toContain("onStepChange?.(step, currentStep)");
    expect(guidedTourSource).toContain("MAX_TARGET_LOOKUP_FRAMES");
    expect(guidedTourSource).toContain("querySelector<HTMLElement>");
    expect(guidedTourSource).toContain("waitForStableTarget");
    expect(guidedTourSource).toContain("cleanupHighlightedTarget");
  });
});
