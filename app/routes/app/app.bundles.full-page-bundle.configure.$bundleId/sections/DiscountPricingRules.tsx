import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { DiscountMethod } from "../../../../types/pricing";

export function FpbDiscountRulesSection({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    amountToCents,
    centsToAmount,
    createNewPricingRule,
    DISCOUNT_METHOD_OPTIONS,
    fullPageBundleStyles,
    pricingState,
    setGlobalSuccessMessage,
    setRuleMessages,
    setRuleMessagesByLocale,
    setSuccessMessageByLocale,
  } = flow;

  return (
    <>
      <s-section>
        <s-stack direction="block" gap="base">
          {/* Q1: Header with s-switch */}
          <s-stack direction="inline" gap="small">
            <s-stack direction="block" gap="small-400" inlineSize="100%">
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                Discount &amp; Pricing
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                Set up discount rules, applied from lowest to highest.
              </p>
            </s-stack>
            <s-switch
              accessibilityLabel="Enable discount pricing"
              label="Enable"
              checked={pricingState.discountEnabled || undefined}
              onChange={(e) =>
                pricingState.setDiscountEnabled(
                  (e.target as HTMLInputElement).checked,
                )
              }
            />
          </s-stack>
          <s-banner tone="info">
            Tip: Discounts are calculated based on the products in cart, make
            sure to add the &quot;Default Product&quot; quantity or amount while
            configuring discounts.
          </s-banner>
          {/* Q2: Discount Type — always visible, grayed when disabled */}
          <div
            style={{
              opacity: pricingState.discountEnabled ? 1 : 0.45,
              pointerEvents: pricingState.discountEnabled ? "auto" : "none",
            }}
          >
            <s-select
              label="Discount Type"
              value={pricingState.discountType}
              onChange={(e) => {
                const nextDiscountType = (e.target as HTMLSelectElement)
                  .value as DiscountMethod;
                const nextRule = createNewPricingRule(nextDiscountType);
                pricingState.setDiscountType(nextDiscountType);
                pricingState.setDiscountRules([nextRule]);
                setRuleMessages({});
                setRuleMessagesByLocale({});
                setGlobalSuccessMessage("");
                setSuccessMessageByLocale({});
              }}
            >
              {[...DISCOUNT_METHOD_OPTIONS].map((opt) => (
                <s-option key={opt.value} value={opt.value}>
                  {opt.label}
                </s-option>
              ))}
            </s-select>
          </div>
          {/* Q2: Discount Rules — always visible, grayed when disabled */}
          <div
            style={{
              opacity: pricingState.discountEnabled ? 1 : 0.45,
              pointerEvents: pricingState.discountEnabled ? "auto" : "none",
            }}
          >
            <s-stack direction="block" gap="small">
              {pricingState.discountRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className={fullPageBundleStyles.discountRuleCard}
                >
                  <s-stack direction="block" gap="small">
                    <div className={fullPageBundleStyles.discountRuleHeader}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        Rule #{index + 1}
                      </h4>
                      <s-button
                        variant="tertiary"
                        tone="critical"
                        onClick={() => pricingState.removeDiscountRule(rule.id)}
                      >
                        Remove
                      </s-button>
                    </div>
                    {pricingState.discountType ===
                    DiscountMethod.BUY_X_GET_Y ? (
                      <div className={fullPageBundleStyles.bxyRuleBody}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Customer buys
                        </p>
                        <s-number-field
                          label="Minimum quantity of items"
                          value={String(rule.customerBuys ?? 2)}
                          onInput={(e) =>
                            pricingState.updateDiscountRule(rule.id, {
                              customerBuys: Math.max(
                                1,
                                Number((e.target as HTMLInputElement).value) ||
                                  1,
                              ),
                            })
                          }
                          min={1}
                        />
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Customer gets
                        </p>
                        <s-number-field
                          label="Quantity"
                          value={String(rule.customerGets ?? 1)}
                          onInput={(e) =>
                            pricingState.updateDiscountRule(rule.id, {
                              customerGets: Math.max(
                                1,
                                Number((e.target as HTMLInputElement).value) ||
                                  1,
                              ),
                            })
                          }
                          min={1}
                        />
                        <div className={fullPageBundleStyles.bxyRewardGrid}>
                          <s-number-field
                            label="Discount value"
                            value={String(rule.discountValue ?? 0)}
                            onInput={(e) =>
                              pricingState.updateDiscountRule(rule.id, {
                                discountValue: (() => {
                                  const nextValue =
                                    Number(
                                      (e.target as HTMLInputElement).value,
                                    ) || 0;
                                  return (rule.bxyDiscountType ??
                                    "percentage") === "percentage"
                                    ? Math.min(100, Math.max(0, nextValue))
                                    : Math.max(0, nextValue);
                                })(),
                              })
                            }
                            min={0}
                            suffix={
                              (rule.bxyDiscountType ?? "percentage") ===
                              "percentage"
                                ? "%"
                                : undefined
                            }
                            prefix={
                              (rule.bxyDiscountType ?? "percentage") ===
                              "fixed_amount"
                                ? "₹"
                                : undefined
                            }
                            max={
                              (rule.bxyDiscountType ?? "percentage") ===
                              "percentage"
                                ? 100
                                : undefined
                            }
                          />
                          <s-select
                            label="Discount type"
                            value={rule.bxyDiscountType ?? "percentage"}
                            onChange={(e) => {
                              const bxyDiscountType = (
                                e.target as HTMLSelectElement
                              ).value as "percentage" | "fixed_amount";
                              const currentValue =
                                Number(rule.discountValue ?? 0) || 0;
                              pricingState.updateDiscountRule(rule.id, {
                                bxyDiscountType,
                                discountValue:
                                  bxyDiscountType === "percentage"
                                    ? Math.min(100, Math.max(0, currentValue))
                                    : Math.max(0, currentValue),
                              });
                            }}
                          >
                            <s-option value="percentage">% off</s-option>
                            <s-option value="fixed_amount">₹ off</s-option>
                          </s-select>
                          <s-select
                            label="Apply Discount to"
                            value={rule.bxyApplyMode ?? "lowest_priced"}
                            onChange={(e) =>
                              pricingState.updateDiscountRule(rule.id, {
                                bxyApplyMode: (e.target as HTMLSelectElement)
                                  .value as "lowest_priced" | "latest_added",
                              })
                            }
                          >
                            <s-option value="lowest_priced">
                              The lowest priced items
                            </s-option>
                            <s-option value="latest_added">
                              The latest added items
                            </s-option>
                          </s-select>
                        </div>
                      </div>
                    ) : (
                      <s-stack direction="block" gap="small-100">
                        {pricingState.discountType ===
                        DiscountMethod.FIXED_BUNDLE_PRICE ? (
                          <div
                            className={
                              fullPageBundleStyles.discountFieldsRowPair
                            }
                          >
                            <s-number-field
                              label="Number of Products in Bundle"
                              value={String(rule.conditionValue ?? 0)}
                              onInput={(e) =>
                                pricingState.updateDiscountRule(rule.id, {
                                  conditionValue:
                                    Number(
                                      (e.target as HTMLInputElement).value,
                                    ) || 0,
                                })
                              }
                              min={0}
                            />
                            <s-number-field
                              label="Price"
                              value={String(centsToAmount(rule.discountValue))}
                              onInput={(e) =>
                                pricingState.updateDiscountRule(rule.id, {
                                  discountValue: amountToCents(
                                    Number(
                                      (e.target as HTMLInputElement).value,
                                    ) || 0,
                                  ),
                                })
                              }
                              min={0}
                              prefix="₹"
                            />
                          </div>
                        ) : (
                          <div
                            className={fullPageBundleStyles.discountFieldsRow}
                          >
                            <s-select
                              label="Discount on"
                              value={rule.conditionType ?? "quantity"}
                              onChange={(e) =>
                                pricingState.updateDiscountRule(rule.id, {
                                  conditionType: (e.target as HTMLSelectElement)
                                    .value as "quantity" | "amount",
                                })
                              }
                            >
                              <s-option value="quantity">Quantity</s-option>
                              <s-option value="amount">Amount</s-option>
                            </s-select>
                            <s-number-field
                              label="is greater than or equal to"
                              value={String(
                                rule.conditionType === "amount"
                                  ? centsToAmount(rule.conditionValue)
                                  : rule.conditionValue,
                              )}
                              onInput={(e) => {
                                const numValue =
                                  Number(
                                    (e.target as HTMLInputElement).value,
                                  ) || 0;
                                const finalValue =
                                  rule.conditionType === "amount"
                                    ? amountToCents(numValue)
                                    : numValue;
                                pricingState.updateDiscountRule(rule.id, {
                                  conditionValue: finalValue,
                                });
                              }}
                              min={0}
                              prefix={
                                rule.conditionType === "amount"
                                  ? "₹"
                                  : undefined
                              }
                            />
                            <s-number-field
                              label={
                                pricingState.discountType ===
                                DiscountMethod.PERCENTAGE_OFF
                                  ? "Percentage Off"
                                  : "Fixed Amount Off"
                              }
                              value={String(
                                pricingState.discountType ===
                                  DiscountMethod.PERCENTAGE_OFF
                                  ? rule.discountValue
                                  : centsToAmount(rule.discountValue),
                              )}
                              onInput={(e) => {
                                const numValue =
                                  Number(
                                    (e.target as HTMLInputElement).value,
                                  ) || 0;
                                const finalValue =
                                  pricingState.discountType ===
                                  DiscountMethod.PERCENTAGE_OFF
                                    ? numValue
                                    : amountToCents(Math.max(0, numValue));
                                const safeValue =
                                  pricingState.discountType ===
                                  DiscountMethod.PERCENTAGE_OFF
                                    ? Math.min(100, Math.max(0, finalValue))
                                    : finalValue;
                                pricingState.updateDiscountRule(rule.id, {
                                  discountValue: safeValue,
                                });
                              }}
                              min={0}
                              max={
                                pricingState.discountType ===
                                DiscountMethod.PERCENTAGE_OFF
                                  ? 100
                                  : undefined
                              }
                              suffix={
                                pricingState.discountType ===
                                DiscountMethod.PERCENTAGE_OFF
                                  ? "%"
                                  : undefined
                              }
                              prefix={
                                pricingState.discountType !==
                                DiscountMethod.PERCENTAGE_OFF
                                  ? "₹"
                                  : undefined
                              }
                            />
                          </div>
                        )}
                      </s-stack>
                    )}
                  </s-stack>
                </div>
              ))}
              {pricingState.discountRules.length < 4 ? (
                <s-button
                  variant="secondary"
                  icon="plus"
                  inlineSize="fill"
                  onClick={pricingState.addDiscountRule}
                >
                  Add rule
                </s-button>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#6d7175",
                    textAlign: "center",
                  }}
                >
                  Maximum 4 discount rules reached
                </p>
              )}
            </s-stack>
          </div>
        </s-stack>
      </s-section>
    </>
  );
}
