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
    expect(constantsSource).toContain('value: "equalTo"');
    expect(constantsSource).toContain('value: "greaterThanOrEqualTo"');
    expect(constantsSource).toContain('value: "lessThanOrEqualTo"');
    expect(constantsSource).not.toContain('value: "greaterThan"');
    expect(constantsSource).not.toContain('value: "lessThan"');
  });

  it("limits step rule operator options to equal, greater-or-equal, and less-or-equal", () => {
    expect(constantsSource).toContain("STEP_CONDITION_OPERATOR_OPTIONS");
    expect(constantsSource).toContain('value: "equal_to"');
    expect(constantsSource).toContain('value: "greater_than_or_equal_to"');
    expect(constantsSource).toContain('value: "less_than_or_equal_to"');
    expect(constantsSource).not.toContain('value: "greater_than"');
    expect(constantsSource).not.toContain('value: "less_than"');
  });
});

describe.each(Object.entries(routeSources))("%s Step Setup rule mode wiring", (_bundleType, source) => {
  it("derives category rule visibility from the current draft category count", () => {
    expect(source).toContain("deriveControlDependencies({");
    expect(source).toContain("categoryCount: stepCategories.length");
    expect(source).not.toContain("categoryRulesAvailable = stepCategories.length > 0");
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

  it("renders Step Rules fields without visible Type, Condition, or Value labels", () => {
    const stepRulesStart = source.indexOf("(conditionsState.stepConditions[step.id] || []).map((rule: any, ruleIndex: number)");
    expect(stepRulesStart).toBeGreaterThan(-1);
    const addRuleEnd = source.indexOf("conditionsState.addConditionRule(step.id)", stepRulesStart);
    expect(addRuleEnd).toBeGreaterThan(stepRulesStart);
    const stepRulesBlock = source.slice(stepRulesStart, addRuleEnd);

    expect(stepRulesBlock).not.toContain("<s-select");
    expect(stepRulesBlock).not.toContain("<s-number-field");
    expect(stepRulesBlock).not.toContain('label="Operator"');
    expect(stepRulesBlock).toContain('aria-label="Type"');
    expect(stepRulesBlock).toContain('aria-label="Condition"');
    expect(stepRulesBlock).toContain('aria-label="Value"');
    expect(stepRulesBlock).toContain('className={');
    expect(stepRulesBlock).toContain("ruleInlineSelect");
    expect(stepRulesBlock).toContain("ruleInlineNumber");
  });
});
