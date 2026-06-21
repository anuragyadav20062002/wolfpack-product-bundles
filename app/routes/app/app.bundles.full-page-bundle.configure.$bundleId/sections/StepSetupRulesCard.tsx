import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbStepRulesCard({
  flow,
  step,
}: {
  flow: ConfigureBundleFlowContext;
  step: any;
}) {
  const {
    addCategoryConditionRule,
    CATEGORY_CONDITION_OPERATOR_OPTIONS,
    categoryRulesOpen,
    clearCategoryConditionRules,
    conditionsState,
    deriveControlDependencies,
    fullPageBundleStyles,
    QuestionHelpTooltip,
    removeCategoryConditionRule,
    setCategoryRulesOpen,
    shopify,
    STEP_CONDITION_OPERATOR_OPTIONS,
    STEP_CONDITION_TYPE_OPTIONS,
    updateCategoryAutoNextRule,
    updateCategoryConditionRule,
  } = flow;

  return (
    <>
      <div className={fullPageBundleStyles.card}>
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
          className={fullPageBundleStyles.linkButton}
          style={{ marginBottom: 12, display: "inline-block" }}
          onClick={() => window.open("https://wolfpackapps.com", "_blank")}
        >
          Learn More
        </button>
        {(() => {
          const stepCategories =
            ((step as any).StepCategory as any[] | undefined) ?? [];
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
          const handleRuleModeChange = (nextMode: string) => {
            if (nextMode === "none") {
              conditionsState.clearStepConditions(step.id);
              clearCategoryConditionRules(step.id);
              return;
            }
            if (nextMode === "step") {
              clearCategoryConditionRules(step.id);
              if (
                (conditionsState.stepConditions[step.id] || []).length === 0
              ) {
                conditionsState.addConditionRule(step.id);
              }
              return;
            }
            if (nextMode === "category" && categoryRulesAvailable) {
              conditionsState.clearStepConditions(step.id);
              if (!hasCategoryRules) {
                addCategoryConditionRule(step.id, 0);
              }
              return;
            }
          };
          const ruleModeOptions = [
            { label: "No rules", value: "none" },
            { label: "Step rules", value: "step" },
            ...(categoryRulesAvailable
              ? [{ label: "Category rules", value: "category" }]
              : []),
          ];
          return (
            <>
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
                <div className={fullPageBundleStyles.categoryRulesList}>
                  {stepCategories.map((cat: any, catIndex: number) => {
                    const catKey = `${step.id}__${cat.id ?? catIndex}`;
                    const rules = Array.isArray(cat.conditions)
                      ? cat.conditions
                      : [];
                    const isRulesOpen =
                      categoryRulesOpen[catKey] ?? catIndex === 0;
                    const categoryLabel =
                      cat.name || cat.title || `Category ${catIndex + 1}`;
                    return (
                      <div
                        key={cat.id ?? catIndex}
                        className={fullPageBundleStyles.categoryRuleAccordion}
                      >
                        <button
                          type="button"
                          className={fullPageBundleStyles.categoryRuleHeader}
                          aria-expanded={isRulesOpen}
                          onClick={() =>
                            setCategoryRulesOpen((prev) => ({
                              ...prev,
                              [catKey]: !isRulesOpen,
                            }))
                          }
                        >
                          <span>{categoryLabel} rules</span>
                          <span aria-hidden="true">
                            {isRulesOpen ? "⌃" : "⌄"}
                          </span>
                        </button>
                        {isRulesOpen && (
                          <div
                            className={fullPageBundleStyles.categoryRuleBody}
                          >
                            <p
                              className={fullPageBundleStyles.categoryRuleHelp}
                            >
                              Create Rules based on amount or quantity of
                              products added on this category. <br /> Note:
                              Rules are only valid on this category
                            </p>
                            <div className={fullPageBundleStyles.rulesList}>
                              {rules.map((rule: any, ruleIndex: number) => {
                                const ruleId = String(rule.id ?? ruleIndex);
                                return (
                                  <div
                                    key={ruleId}
                                    className={
                                      fullPageBundleStyles.categoryRuleBlock
                                    }
                                  >
                                    <div
                                      className={
                                        fullPageBundleStyles.ruleHeader
                                      }
                                    >
                                      <h4
                                        style={{
                                          margin: 0,
                                          fontSize: 14,
                                          fontWeight: 650,
                                        }}
                                      >
                                        Rule #{ruleIndex + 1}
                                      </h4>
                                      <s-button
                                        variant="tertiary"
                                        tone="critical"
                                        onClick={() =>
                                          removeCategoryConditionRule(
                                            step.id,
                                            catIndex,
                                            ruleId,
                                          )
                                        }
                                      >
                                        Remove
                                      </s-button>
                                    </div>
                                    <div
                                      className={
                                        fullPageBundleStyles.categoryRuleFields
                                      }
                                    >
                                      <select
                                        className={
                                          fullPageBundleStyles.ruleInlineSelect
                                        }
                                        value={rule.type ?? "quantity"}
                                        onChange={(e) =>
                                          updateCategoryConditionRule(
                                            step.id,
                                            catIndex,
                                            ruleId,
                                            "type",
                                            (e.target as HTMLSelectElement)
                                              .value,
                                          )
                                        }
                                        aria-label="Type"
                                      >
                                        {[...STEP_CONDITION_TYPE_OPTIONS].map(
                                          (opt) => (
                                            <option
                                              key={opt.value}
                                              value={opt.value}
                                            >
                                              {opt.label}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                      <select
                                        className={
                                          fullPageBundleStyles.ruleInlineSelect
                                        }
                                        value={
                                          rule.condition ??
                                          rule.operator ??
                                          "greaterThanOrEqualTo"
                                        }
                                        onChange={(e) =>
                                          updateCategoryConditionRule(
                                            step.id,
                                            catIndex,
                                            ruleId,
                                            "condition",
                                            (e.target as HTMLSelectElement)
                                              .value,
                                          )
                                        }
                                        aria-label="Condition"
                                      >
                                        {[
                                          ...CATEGORY_CONDITION_OPERATOR_OPTIONS,
                                        ].map((opt) => (
                                          <option
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                      <input
                                        type="number"
                                        className={
                                          fullPageBundleStyles.ruleInlineNumber
                                        }
                                        min={0}
                                        value={rule.value ?? ""}
                                        onChange={(e) =>
                                          updateCategoryConditionRule(
                                            step.id,
                                            catIndex,
                                            ruleId,
                                            "value",
                                            (e.target as HTMLInputElement)
                                              .value,
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
                                checked={
                                  cat.autoNextStepOnConditionMet === true ||
                                  undefined
                                }
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
                              className={fullPageBundleStyles.addSectionButton}
                              onClick={() =>
                                addCategoryConditionRule(step.id, catIndex)
                              }
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M7 1v12M1 7h12"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                              </svg>
                              Add Rule
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {(conditionsState.stepConditions[step.id] || []).length ===
                  0 ? (
                    <div className={fullPageBundleStyles.emptyState}>
                      No rules defined yet
                    </div>
                  ) : (
                    <div className={fullPageBundleStyles.rulesList}>
                      {(conditionsState.stepConditions[step.id] || []).map(
                        (rule: any, ruleIndex: number) => (
                          <div
                            key={rule.id}
                            className={fullPageBundleStyles.ruleCard}
                          >
                            <div className={fullPageBundleStyles.ruleHeader}>
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 650,
                                }}
                              >
                                Rule #{ruleIndex + 1}
                              </h4>
                              <s-button
                                variant="tertiary"
                                tone="critical"
                                onClick={() =>
                                  conditionsState.removeConditionRule(
                                    step.id,
                                    rule.id,
                                  )
                                }
                              >
                                Remove
                              </s-button>
                            </div>
                            <div className={fullPageBundleStyles.ruleFields}>
                              <select
                                className={
                                  fullPageBundleStyles.ruleInlineSelect
                                }
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
                                className={
                                  fullPageBundleStyles.ruleInlineSelect
                                }
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
                                {[...STEP_CONDITION_OPERATOR_OPTIONS].map(
                                  (opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ),
                                )}
                              </select>
                              <input
                                type="number"
                                className={
                                  fullPageBundleStyles.ruleInlineNumber
                                }
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
                            {(conditionsState.stepConditions[step.id] || [])
                              .length === 1 && (
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
                                    (e.target as HTMLInputElement).checked
                                      ? "true"
                                      : "false",
                                  );
                                }}
                              />
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className={fullPageBundleStyles.addSectionButton}
                    onClick={() => {
                      if (
                        (conditionsState.stepConditions[step.id] || [])
                          .length >= 2
                      ) {
                        shopify.toast.show("A step can have at most 2 rules", {
                          isError: false,
                        });
                        return;
                      }
                      conditionsState.addConditionRule(step.id);
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 1v12M1 7h12"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    Add Rule
                  </button>
                </>
              )}
            </>
          );
        })()}
      </div>
    </>
  );
}
