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

const routeSources = Object.fromEntries(
  Object.entries(routePaths).map(([key, filePath]) => [key, fs.readFileSync(filePath, "utf8")]),
);

const constantsSource = fs.readFileSync(
  path.join(process.cwd(), "app/constants/bundle.ts"),
  "utf8",
);

describe("Step Setup category rule mode contract", () => {
  it("defines the category condition enum shape used by the observed save payload", () => {
    expect(constantsSource).toContain("CATEGORY_CONDITION_OPERATOR_OPTIONS");
    expect(constantsSource).toContain('value: "greaterThanOrEqualTo"');
    expect(constantsSource).toContain('value: "lessThanOrEqualTo"');
  });
});

describe.each(Object.entries(routeSources))("%s Step Setup rule mode wiring", (_bundleType, source) => {
  it("renders category rules only when multiple categories exist", () => {
    expect(source).toContain("categoryRulesAvailable = stepCategories.length > 1");
    expect(source).toContain('...(categoryRulesAvailable ? [{ label: "Category rules", value: "category" }] : [])');
  });

  it("keeps step rules and category rules mutually exclusive", () => {
    expect(source).toContain('const activeRuleMode = hasCategoryRules ? "category" : hasStepRules ? "step" : "none";');
    expect(source).toContain("clearCategoryConditionRules(step.id)");
    expect(source).toContain("conditionsState.clearStepConditions(step.id)");
  });

  it("switches category mode into category-level conditions instead of step conditions", () => {
    expect(source).toContain("addCategoryConditionRule(step.id, 0)");
    expect(source).toContain("updateCategoryConditionRule(step.id, catIndex, ruleId, \"condition\"");
    expect(source).toContain("const ruleId = String(rule.id ?? ruleIndex);");
    expect(source).toContain("autoNextStepOnConditionMet");
    expect(source).toContain('rule.condition ?? rule.operator ?? "greaterThanOrEqualTo"');
  });

  it("renders category rule accordion copy and add/remove controls", () => {
    expect(source).toContain("Create Rules based on amount or quantity of products added on this category.");
    expect(source).toContain("Note: Rules are only valid on this category");
    expect(source).toContain("cat.name || cat.title || `Category ");
    expect(source).toContain("Add Rule");
    expect(source).toContain("Remove");
  });
});
