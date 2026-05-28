import fs from "node:fs";
import path from "node:path";

const routePaths = {
  fullPage: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
  ),
  productPage: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
};

const handlerPaths = {
  fullPage: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts",
  ),
  productPage: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts",
  ),
};

const routeSources = Object.fromEntries(
  Object.entries(routePaths).map(([key, filePath]) => [key, fs.readFileSync(filePath, "utf8")]),
);

const handlerSources = Object.fromEntries(
  Object.entries(handlerPaths).map(([key, filePath]) => [key, fs.readFileSync(filePath, "utf8")]),
);

function getStepConfigCardSource(source: string) {
  const start = source.indexOf("{/* ── Step Config card ── */");
  expect(start).toBeGreaterThan(-1);

  const endCandidates = [
    source.indexOf("{/* Bundle Settings", start),
    source.indexOf("{activeSection === \"free_gift_addons\"", start),
    source.indexOf("</div>\n                ))}", start),
  ].filter((index) => index > start);
  expect(endCandidates.length).toBeGreaterThan(0);

  return source.slice(start, Math.min(...endCandidates));
}

function getOptimizedStepsSource(source: string) {
  const start = source.indexOf("const optimizedSteps = (stepsData || []).map");
  expect(start).toBeGreaterThan(-1);
  const endCandidates = [
    source.indexOf("const savedPricingMessages", start),
    source.indexOf("const firstRuleId", start),
  ].filter((index) => index > start);
  expect(endCandidates.length).toBeGreaterThan(0);
  return source.slice(start, Math.min(...endCandidates));
}

describe.each(Object.entries(routeSources))("%s Step Config image Admin contract", (_bundleType, source) => {
  it("uses the direct stepImage key for preview, picker value, and upload changes", () => {
    const stepConfigCard = getStepConfigCardSource(source);

    expect(stepConfigCard).toContain("(step as any).stepImage");
    expect(stepConfigCard).toContain("value={(step as any).stepImage ?? null}");
    expect(stepConfigCard).toContain("stepsState.updateStepField(step.id, 'stepImage', url)");
    expect(stepConfigCard).not.toContain("timelineIconUrl");
  });
});

describe.each(Object.entries(handlerSources))("%s Step Config image persistence contract", (_bundleType, source) => {
  it("stores the direct stepImage input and emits stepImage into the optimized metafield payload", () => {
    expect(source).toContain("timelineIconUrl: step.stepImage ?? null");
    expect(getOptimizedStepsSource(source)).toContain("stepImage: step.stepImage ?? null");
    expect(source).toContain("stepImage: timelineIconUrl ?? null");
  });
});
