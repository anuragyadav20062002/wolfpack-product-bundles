import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbBundleQuantityOptions({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    bundle,
    bundleQuantityOptionsEligible,
    DiscountMethod,
    fullPageBundleStyles,
    normalizedPricingDisplayOptions,
    pricingState,
    QuestionHelpTooltip,
    setIsBundleQuantityMultiLangModalOpen,
    shopLocales,
  } = flow;

  return (
    <>
      {pricingState.discountType !== DiscountMethod.BUY_X_GET_Y && (
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
                  Bundle Quantity Options
                </p>
                <p className={fullPageBundleStyles.displayOptionDescription}>
                  Configure this section to enable quantity options.
                </p>
              </div>
              <QuestionHelpTooltip tooltipKey="bundleQuantityOptions" />
              <s-switch
                checked={
                  pricingState.pricingDisplayOptions.bundleQuantityOptions
                    .enabled || undefined
                }
                disabled={!bundleQuantityOptionsEligible || undefined}
                onChange={(e) =>
                  pricingState.setBundleQuantityOptionsEnabled(
                    (e.target as HTMLInputElement).checked,
                  )
                }
              />
            </s-stack>
            <s-button
              variant="secondary"
              icon="globe"
              disabled={
                !pricingState.pricingDisplayOptions.bundleQuantityOptions
                  .enabled ||
                shopLocales.length === 0 ||
                undefined
              }
              onClick={() => setIsBundleQuantityMultiLangModalOpen(true)}
            >
              Multi Language
            </s-button>
          </s-stack>
          <p className={fullPageBundleStyles.optionNote}>
            <strong>Note:</strong> Bundle Quantity Options can only be enabled
            when discount rules are based on quantity.
          </p>
          {pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled && (
            <div className={fullPageBundleStyles.nestedDisplayOptions}>
              <s-stack direction="block" gap="small">
                {normalizedPricingDisplayOptions.bundleQuantityOptions.options
                  .length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#6d7175",
                    }}
                  >
                    Add quantity-based discount rules to configure bundle
                    quantity options.
                  </p>
                ) : (
                  normalizedPricingDisplayOptions.bundleQuantityOptions.options.map(
                    (option: any, index: number) => (
                      <div
                        key={option.ruleId}
                        className={fullPageBundleStyles.discountRuleCard}
                      >
                        <s-stack direction="block" gap="small-100">
                          <s-stack
                            direction="inline"
                            gap="small"
                            alignItems="center"
                          >
                            <h5
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 600,
                                flex: 1,
                              }}
                            >
                              Rule #{index + 1}
                            </h5>
                            <s-button
                              variant="tertiary"
                              accessibilityLabel="Make this rule default"
                              onClick={() =>
                                pricingState.setBundleQuantityDefaultRule(
                                  option.ruleId,
                                )
                              }
                            >
                              {option.isDefault ? "\u2605" : "\u2606"} Make this
                              rule default
                            </s-button>
                          </s-stack>
                          {option.compatibility.status === "blocked" && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                color: "#8a6116",
                              }}
                            >
                              {option.compatibility.reason}
                            </p>
                          )}
                          <s-stack direction="inline" gap="small">
                            <s-text-field
                              label="Box Label"
                              value={option.label}
                              onInput={(e) =>
                                pricingState.updateBundleQuantityOption(
                                  option.ruleId,
                                  {
                                    label: (e.target as HTMLInputElement).value,
                                  },
                                )
                              }
                              autocomplete="off"
                            />
                            <s-text-field
                              label="Box Subtext"
                              value={option.subtext}
                              onInput={(e) =>
                                pricingState.updateBundleQuantityOption(
                                  option.ruleId,
                                  {
                                    subtext: (e.target as HTMLInputElement)
                                      .value,
                                  },
                                )
                              }
                              autocomplete="off"
                            />
                          </s-stack>
                        </s-stack>
                      </div>
                    ),
                  )
                )}
              </s-stack>
            </div>
          )}
        </div>
      )}
    </>
  );
}
