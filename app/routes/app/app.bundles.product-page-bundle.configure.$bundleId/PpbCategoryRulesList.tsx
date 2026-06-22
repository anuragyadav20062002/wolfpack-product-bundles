import { usePpbConfigureContext } from "./PpbConfigureContext";
import { PlusIcon } from "./PpbStepSetupShared";

export function PpbCategoryRulesList({
  step,
  stepCategories,
}: {
  step: any;
  stepCategories: any[];
}) {
  const { categoryRulesOpen, productPageBundleStyles, setCategoryRulesOpen } =
    usePpbConfigureContext();

  return (
    <div className={productPageBundleStyles.categoryRulesList}>
      {stepCategories.map((cat: any, catIndex: number) => {
        const catKey = `${step.id}__${cat.id ?? catIndex}`;
        const rules = Array.isArray(cat.conditions) ? cat.conditions : [];
        const isRulesOpen = categoryRulesOpen[catKey] ?? catIndex === 0;
        const categoryLabel =
          cat.name || cat.title || `Category ${catIndex + 1}`;

        return (
          <div
            key={cat.id ?? catIndex}
            className={productPageBundleStyles.categoryRuleAccordion}
          >
            <button
              type="button"
              className={productPageBundleStyles.categoryRuleHeader}
              aria-expanded={isRulesOpen}
              onClick={() =>
                setCategoryRulesOpen((prev) => ({
                  ...prev,
                  [catKey]: !isRulesOpen,
                }))
              }
            >
              <span>{categoryLabel} rules</span>
              <span aria-hidden="true">{isRulesOpen ? "⌃" : "⌄"}</span>
            </button>
            {isRulesOpen && (
              <PpbCategoryRuleBody
                step={step}
                cat={cat}
                catIndex={catIndex}
                rules={rules}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PpbCategoryRuleBody({
  step,
  cat,
  catIndex,
  rules,
}: {
  step: any;
  cat: any;
  catIndex: number;
  rules: any[];
}) {
  const {
    addCategoryConditionRule,
    CATEGORY_CONDITION_OPERATOR_OPTIONS,
    productPageBundleStyles,
    removeCategoryConditionRule,
    STEP_CONDITION_TYPE_OPTIONS,
    updateCategoryAutoNextRule,
    updateCategoryConditionRule,
  } = usePpbConfigureContext();

  return (
    <div className={productPageBundleStyles.categoryRuleBody}>
      <p className={productPageBundleStyles.categoryRuleHelp}>
        Create Rules based on amount or quantity of products added on this
        category. <br /> Note: Rules are only valid on this category
      </p>
      <div className={productPageBundleStyles.rulesList}>
        {rules.map((rule: any, ruleIndex: number) => {
          const ruleId = String(rule.id ?? ruleIndex);

          return (
            <div
              key={ruleId}
              className={productPageBundleStyles.categoryRuleBlock}
            >
              <div className={productPageBundleStyles.ruleHeader}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>
                  Rule #{ruleIndex + 1}
                </h4>
                <s-button
                  variant="tertiary"
                  tone="critical"
                  onClick={() =>
                    removeCategoryConditionRule(step.id, catIndex, ruleId)
                  }
                >
                  Remove
                </s-button>
              </div>
              <div className={productPageBundleStyles.categoryRuleFields}>
                <select
                  className={productPageBundleStyles.ruleInlineSelect}
                  value={rule.type ?? "quantity"}
                  onChange={(e) =>
                    updateCategoryConditionRule(
                      step.id,
                      catIndex,
                      ruleId,
                      "type",
                      (e.target as HTMLSelectElement).value,
                    )
                  }
                  aria-label="Type"
                >
                  {[...STEP_CONDITION_TYPE_OPTIONS].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  className={productPageBundleStyles.ruleInlineSelect}
                  value={
                    rule.condition ?? rule.operator ?? "greaterThanOrEqualTo"
                  }
                  onChange={(e) =>
                    updateCategoryConditionRule(
                      step.id,
                      catIndex,
                      ruleId,
                      "condition",
                      (e.target as HTMLSelectElement).value,
                    )
                  }
                  aria-label="Condition"
                >
                  {[...CATEGORY_CONDITION_OPERATOR_OPTIONS].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className={productPageBundleStyles.ruleInlineNumber}
                  min={0}
                  value={rule.value ?? ""}
                  onChange={(e) =>
                    updateCategoryConditionRule(
                      step.id,
                      catIndex,
                      ruleId,
                      "value",
                      (e.target as HTMLInputElement).value,
                    )
                  }
                  autoComplete="off"
                  aria-label="Value"
                />
              </div>
            </div>
          );
        })}
      </div>
      {rules.length === 1 && (
        <s-checkbox
          label="Auto Next When rule is met"
          checked={cat.autoNextStepOnConditionMet === true || undefined}
          onChange={(e) =>
            updateCategoryAutoNextRule(
              step.id,
              catIndex,
              (e.target as HTMLInputElement).checked,
            )
          }
        />
      )}
      <button
        type="button"
        className={productPageBundleStyles.addSectionButton}
        onClick={() => addCategoryConditionRule(step.id, catIndex)}
      >
        <PlusIcon />
        Add Rule
      </button>
    </div>
  );
}
