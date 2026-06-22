import { usePpbConfigureContext } from "./PpbConfigureContext";
import { PlusIcon } from "./PpbStepSetupShared";

export function PpbStepRulesList({ step }: { step: any }) {
  const {
    conditionsState,
    productPageBundleStyles,
    shopify,
    STEP_CONDITION_OPERATOR_OPTIONS,
    STEP_CONDITION_TYPE_OPTIONS,
  } = usePpbConfigureContext();
  const rules = conditionsState.stepConditions[step.id] || [];

  return (
    <>
      {rules.length === 0 ? (
        <div className={productPageBundleStyles.emptyState}>
          No rules defined yet
        </div>
      ) : (
        <div className={productPageBundleStyles.rulesList}>
          {rules.map((rule: any, ruleIndex: number) => (
            <div key={rule.id} className={productPageBundleStyles.ruleCard}>
              <div className={productPageBundleStyles.ruleHeader}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>
                  Rule #{ruleIndex + 1}
                </h4>
                <s-button
                  variant="tertiary"
                  tone="critical"
                  onClick={() =>
                    conditionsState.removeConditionRule(step.id, rule.id)
                  }
                >
                  Remove
                </s-button>
              </div>
              <div className={productPageBundleStyles.ruleFields}>
                <select
                  className={productPageBundleStyles.ruleInlineSelect}
                  value={rule.type ?? ""}
                  onChange={(e) =>
                    conditionsState.updateConditionRule(
                      step.id,
                      rule.id,
                      "type",
                      (e.target as HTMLSelectElement).value,
                    )
                  }
                  aria-label="Type"
                >
                  <option value="" disabled>
                    Type
                  </option>
                  {[...STEP_CONDITION_TYPE_OPTIONS].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  className={productPageBundleStyles.ruleInlineSelect}
                  value={rule.operator ?? ""}
                  onChange={(e) =>
                    conditionsState.updateConditionRule(
                      step.id,
                      rule.id,
                      "operator",
                      (e.target as HTMLSelectElement).value,
                    )
                  }
                  aria-label="Condition"
                >
                  <option value="" disabled>
                    Condition
                  </option>
                  {[...STEP_CONDITION_OPERATOR_OPTIONS].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className={productPageBundleStyles.ruleInlineNumber}
                  min={0}
                  placeholder="0"
                  value={rule.value ?? ""}
                  onInput={(e) =>
                    conditionsState.updateConditionRule(
                      step.id,
                      rule.id,
                      "value",
                      (e.target as HTMLInputElement).value,
                    )
                  }
                  autoComplete="off"
                  aria-label="Value"
                />
              </div>
              {rules.length === 1 && (
                <s-checkbox
                  label="Auto Next When rule is met"
                  checked={
                    rule.autoNext === true ||
                    rule.autoNext === "true" ||
                    undefined
                  }
                  onChange={(e) => {
                    conditionsState.updateConditionRule(
                      step.id,
                      rule.id,
                      "autoNext",
                      (e.target as HTMLInputElement).checked ? "true" : "false",
                    );
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className={productPageBundleStyles.addSectionButton}
        onClick={() => {
          if (rules.length >= 2) {
            shopify.toast.show("A step can have at most 2 rules", {
              isError: false,
            });
            return;
          }
          conditionsState.addConditionRule(step.id);
        }}
      >
        <PlusIcon />
        Add Rule
      </button>
    </>
  );
}
