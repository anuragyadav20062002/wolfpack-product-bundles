import { PpbCategoryRulesList } from "./PpbCategoryRulesList";
import { usePpbConfigureContext } from "./PpbConfigureContext";
import { getStepCategories } from "./PpbStepSetupShared";
import { PpbStepRulesList } from "./PpbStepRulesList";

export function PpbRulesConfigurationCard({ step }: { step: any }) {
  const {
    addCategoryConditionRule,
    clearCategoryConditionRules,
    conditionsState,
    deriveControlDependencies,
    productPageBundleStyles,
    QuestionHelpTooltip,
  } = usePpbConfigureContext();
  const stepCategories = getStepCategories(step);
  const categoryRulesAvailable = deriveControlDependencies({
    categoryCount: stepCategories.length,
  }).categoryRulesVisible;
  const hasStepRules =
    (conditionsState.stepConditions[step.id] || []).length > 0;
  const hasCategoryRules = stepCategories.some(
    (category: any) => (category.conditions || []).length > 0,
  );
  const activeRuleMode = hasCategoryRules
    ? "category"
    : hasStepRules
      ? "step"
      : "none";
  const ruleModeOptions = [
    { label: "No rules", value: "none" },
    { label: "Step rules", value: "step" },
    ...(categoryRulesAvailable
      ? [{ label: "Category rules", value: "category" }]
      : []),
  ];

  const handleRuleModeChange = (nextMode: string) => {
    if (nextMode === "none") {
      conditionsState.clearStepConditions(step.id);
      clearCategoryConditionRules(step.id);
      return;
    }
    if (nextMode === "step") {
      clearCategoryConditionRules(step.id);
      if ((conditionsState.stepConditions[step.id] || []).length === 0) {
        conditionsState.addConditionRule(step.id);
      }
      return;
    }
    if (nextMode === "category" && categoryRulesAvailable) {
      conditionsState.clearStepConditions(step.id);
      if (!hasCategoryRules) {
        addCategoryConditionRule(step.id, 0);
      }
    }
  };

  return (
    <div className={productPageBundleStyles.card}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Rules Configuration
        </h3>
        <QuestionHelpTooltip tooltipKey="rulesConfiguration" />
      </div>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 14,
          color: "#6d7175",
        }}
      >
        Apply rules to the entire step or to specific categories to guide your
        customer's selections.
      </p>
      <button
        type="button"
        className={productPageBundleStyles.linkButton}
        style={{ marginBottom: 12, display: "inline-block" }}
        onClick={() => window.open("https://wolfpackapps.com", "_blank")}
      >
        Learn More
      </button>
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 12,
        }}
      >
        {ruleModeOptions.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            <input
              type="radio"
              name={`step-rule-mode-${step.id}`}
              value={opt.value}
              checked={activeRuleMode === opt.value}
              onChange={() => handleRuleModeChange(opt.value)}
              style={{ margin: 0 }}
            />
            {opt.label}
          </label>
        ))}
      </div>
      {activeRuleMode === "category" ? (
        <PpbCategoryRulesList step={step} stepCategories={stepCategories} />
      ) : (
        <PpbStepRulesList step={step} />
      )}
    </div>
  );
}
