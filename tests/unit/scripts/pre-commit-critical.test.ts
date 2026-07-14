const core = require("../../../scripts/pre-commit-critical-core.cjs");

describe("pre-commit critical hook planner", () => {
  it("classifies staged source files into fast critical checks", () => {
    const plan = core.createCheckPlan([
      "app/routes/app/app.billing.tsx",
      "app/assets/widgets/full-page/methods/step-footer-methods.js",
      "app/assets/widgets/product-page-css/templates/inpage-cascade.css",
      "extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js",
    ]);

    expect(plan.lintFiles).toContain("app/routes/app/app.billing.tsx");
    expect(plan.lintFiles).toContain("app/assets/widgets/full-page/methods/step-footer-methods.js");
    expect(plan.lintFiles).not.toContain("extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js");
    expect(plan.syntaxFiles).toContain("app/assets/widgets/full-page/methods/step-footer-methods.js");
    expect(plan.widgetBuildTargets).toEqual(["full-page"]);
    expect(plan.shouldMinifyCss).toBe(true);
    expect(plan.shouldRunGraphify).toBe(true);
  });

  it("blocks partially staged checked files", () => {
    const plan = core.createCheckPlan(
      ["app/lib/pricing-display-options.ts", "docs/readme.md"],
      ["app/lib/pricing-display-options.ts", "docs/readme.md"],
    );

    expect(plan.partialFiles).toEqual(["app/lib/pricing-display-options.ts"]);
  });

  it("reports banned UI styling unit-test patterns", () => {
    const findings = core.findBannedTestPatterns({
      "tests/unit/routes/foo-layout.test.ts": "expect(source).toContain('className=\"hero\"');",
      "tests/unit/routes/behavior.test.ts": "expect(result.success).toBe(true);",
    });

    expect(findings).toEqual([
      {
        file: "tests/unit/routes/foo-layout.test.ts",
        reason: expect.stringContaining("layout/ui-contract test filename"),
      },
      {
        file: "tests/unit/routes/foo-layout.test.ts",
        reason: expect.stringContaining("className/style source assertion"),
      },
    ]);
  });

  it("treats graphify local runtime failures as warn-only configuration failures", () => {
    expect(
      core.isGraphifyConfigurationFailure(
        "Graphify rebuild failed with /Users/dev/.local/share/uv/tools/graphifyy/bin/python. If this is a runtime selection issue, set GRAPHIFY_PYTHON",
      ),
    ).toBe(true);
    expect(core.isGraphifyConfigurationFailure("[Errno 1] Operation not permitted")).toBe(true);
    expect(core.isGraphifyConfigurationFailure("graphify graph contains 2 invalid file_type value(s)")).toBe(false);
  });
});
