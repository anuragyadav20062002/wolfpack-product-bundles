import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbProgressBarOptions({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    fullPageBundleStyles,
    markAsDirty,
    pricingState,
    QuestionHelpTooltip,
    setIsProgressBarMultiLangModalOpen,
    setTierTextByRuleId,
    shopLocales,
    tierTextByRuleId,
  } = flow;

  return (
    <>
      <div className={fullPageBundleStyles.displayOptionRow}>
        <s-stack
          direction="inline"
          gap="small"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-stack direction="inline" gap="small" alignItems="center">
            <div className={fullPageBundleStyles.displayOptionText}>
              <p className={fullPageBundleStyles.displayOptionTitle}>
                Progress Bar
              </p>
              <p className={fullPageBundleStyles.displayOptionDescription}>
                Edit the progress bar content and settings.
              </p>
            </div>
            <QuestionHelpTooltip tooltipKey="discountProgressBar" />
            <s-switch
              checked={pricingState.showDiscountProgressBar || undefined}
              onChange={(e) =>
                pricingState.setShowDiscountProgressBar(
                  (e.target as HTMLInputElement).checked,
                )
              }
            />
          </s-stack>
          <s-button
            variant="secondary"
            icon="globe"
            disabled={
              !pricingState.showDiscountProgressBar ||
              (pricingState.pricingDisplayOptions.progressBar.type ||
                "step_based") !== "step_based" ||
              shopLocales.length === 0 ||
              undefined
            }
            onClick={() => setIsProgressBarMultiLangModalOpen(true)}
          >
            Multi Language
          </s-button>
        </s-stack>
        {pricingState.showDiscountProgressBar && (
          <div className={fullPageBundleStyles.nestedDisplayOptions}>
            <s-stack direction="block" gap="small">
              <s-choice-list
                label="Progress bar type"
                labelAccessibilityVisibility="exclusive"
                values={[
                  pricingState.pricingDisplayOptions.progressBar.type ||
                    "step_based",
                ]}
                onChange={(e) => {
                  const val = (
                    (e.currentTarget as any).values as string[] | undefined
                  )?.[0];
                  if (val)
                    pricingState.setProgressBarType(
                      val as "simple" | "step_based",
                    );
                }}
              >
                <s-choice value="simple">Simple Bar</s-choice>
                <s-choice value="step_based">Step-Based Bar</s-choice>
              </s-choice-list>
              {(pricingState.pricingDisplayOptions.progressBar.type ||
                "step_based") === "step_based" ? (
                <s-stack direction="block" gap="small">
                  {pricingState.discountRules.length === 0 ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: "#6d7175",
                      }}
                    >
                      Add discount rules to configure tier text.
                    </p>
                  ) : (
                    pricingState.discountRules.map((rule, index) => (
                      <div
                        key={rule.id}
                        className={fullPageBundleStyles.discountRuleCard}
                      >
                        <s-stack direction="block" gap="small-100">
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            Rule #{index + 1}
                          </p>
                          <s-stack direction="inline" gap="small">
                            <s-text-field
                              label="Tier Text"
                              value={tierTextByRuleId[rule.id]?.tierText ?? ""}
                              onInput={(e) => {
                                const val = (e.target as HTMLInputElement)
                                  .value;
                                setTierTextByRuleId((prev: Record<string, any>) => ({
                                  ...prev,
                                  [rule.id]: {
                                    tierText: val,
                                    tierSubtext:
                                      prev[rule.id]?.tierSubtext ?? "",
                                  },
                                }));
                                markAsDirty();
                              }}
                              autocomplete="off"
                            />
                            <s-text-field
                              label="Tier Subtext"
                              value={
                                tierTextByRuleId[rule.id]?.tierSubtext ?? ""
                              }
                              onInput={(e) => {
                                const val = (e.target as HTMLInputElement)
                                  .value;
                                setTierTextByRuleId((prev: Record<string, any>) => ({
                                  ...prev,
                                  [rule.id]: {
                                    tierText: prev[rule.id]?.tierText ?? "",
                                    tierSubtext: val,
                                  },
                                }));
                                markAsDirty();
                              }}
                              autocomplete="off"
                            />
                          </s-stack>
                        </s-stack>
                      </div>
                    ))
                  )}
                </s-stack>
              ) : null}
            </s-stack>
          </div>
        )}
      </div>
    </>
  );
}
