import { DISCOUNT_METHOD_OPTIONS } from "../../../constants/bundle";
import { DiscountMethod, amountToCents, centsToAmount, createNewPricingRule } from "../../../types/pricing";
import type { PricingRule } from "../../../types/pricing";
import styles from "./wizard-configure.module.css";

type Props = { ctx: any };

export function PricingStep({ ctx }: Props) {
  const { pricing, showProgressBar, setShowProgressBar, discountMessagingEnabled, setDiscountMessagingEnabled, progressMessage, setProgressMessage, qualifiedMessage, setQualifiedMessage, handleBack, handleNext, isAnyWizardSaveInFlight } = ctx;
  return (
  <div className={styles.assetsLayout}>
      {/* Bundle pricing & Discounts */}
      <div className={styles.card}>
        <div className={styles.pricingCardHeader}>
          <div>
            <s-heading>Bundle pricing &amp; Discounts</s-heading>
            <s-text color="subdued">
              Set up discount rules, applied from lowest to highest.
            </s-text>
          </div>
          <s-switch
            accessibilityLabel="Enable bundle discounts"
            checked={pricing.discountEnabled || undefined}
            onChange={(e) =>
              pricing.toggleDiscountEnabled(
                (e.target as HTMLInputElement).checked
              )
            }
          />
        </div>

        <div className={styles.pricingContent}>
            {/* Tip banner */}
            <div className={styles.tipBanner}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Tip: Discounts are calculated based on the products in
                cart, make sure to add the &ldquo;Default Product&rdquo;
                quantity or amount while configuring discounts.
              </span>
            </div>

            {/* Discount Type */}
            <s-select
              label="Discount Type"
              onChange={(e) => {
                const nextType = (e.target as HTMLSelectElement).value as DiscountMethod;
                pricing.changeDiscountType(nextType);
                pricing.setDiscountRules([createNewPricingRule(nextType)]);
              }}
            >
              <s-option
                value=""
                disabled={true}
                selected={!pricing.discountType || undefined}
              >
                Select discount type
              </s-option>
              {[...DISCOUNT_METHOD_OPTIONS].map((opt) => (
                <s-option
                  key={opt.value}
                  value={opt.value}
                  selected={
                    pricing.discountType === opt.value || undefined
                  }
                >
                  {opt.label}
                </s-option>
              ))}
            </s-select>

            {/* Discount Rules */}
              {pricing.discountRules.length > 0 && (
              <div className={styles.rulesList}>
                {pricing.discountRules.map((rule: PricingRule, index: number) => (
                  <div key={rule.id} className={styles.discountRuleRow}>
                    <div className={styles.discountRuleHeader}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                        Rule #{index + 1}
                      </h4>
                      <s-button
                        variant="tertiary"
                        tone="critical"
                        accessibilityLabel={`Remove rule ${index + 1}`}
                        onClick={() =>
                          pricing.removeDiscountRule(rule.id)
                        }
                      >
                        Remove
                      </s-button>
                    </div>
                    <div className={styles.discountRuleFields}>
                      {pricing.discountType === DiscountMethod.BUY_X_GET_Y ? (
                        <div className={styles.bxyRuleBody}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Customer buys</p>
                          <s-number-field
                            label="Minimum quantity of items"
                            value={String(rule.customerBuys ?? 2)}
                            min={1}
                            onInput={(e) => pricing.updateDiscountRule(rule.id, {
                              customerBuys: Math.max(1, Number((e.target as HTMLInputElement).value) || 1)
                            })}
                          />
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Customer gets</p>
                          <s-number-field
                            label="Quantity"
                            value={String(rule.customerGets ?? 1)}
                            min={1}
                            onInput={(e) => pricing.updateDiscountRule(rule.id, {
                              customerGets: Math.max(1, Number((e.target as HTMLInputElement).value) || 1)
                            })}
                          />
                          <s-text color="subdued">Customer must add the quantity of items specified above to their cart</s-text>
                        <div className={styles.bxyRewardGrid}>
                          <s-number-field
                            label="Discount value"
                            value={String(rule.discountValue ?? 0)}
                            min={0}
                            suffix={(rule.bxyDiscountType ?? 'percentage') === 'percentage' ? "%" : undefined}
                            prefix={(rule.bxyDiscountType ?? 'percentage') === 'fixed_amount' ? "₹" : undefined}
                            max={(rule.bxyDiscountType ?? 'percentage') === 'percentage' ? 100 : undefined}
                            onInput={(e) => pricing.updateDiscountRule(rule.id, {
                              discountValue: (() => {
                                const nextValue = Number((e.target as HTMLInputElement).value) || 0;
                                return (rule.bxyDiscountType ?? 'percentage') === 'percentage'
                                  ? Math.min(100, Math.max(0, nextValue))
                                  : Math.max(0, nextValue);
                              })()
                            })}
                          />
                          <s-select
                            label="Discount type"
                            value={rule.bxyDiscountType ?? 'percentage'}
                            onChange={(e) => {
                              const bxyDiscountType = (e.target as HTMLSelectElement).value as 'percentage' | 'fixed_amount';
                              const currentValue = Number(rule.discountValue ?? 0) || 0;
                              pricing.updateDiscountRule(rule.id, {
                                bxyDiscountType,
                                discountValue: bxyDiscountType === 'percentage'
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
                              value={rule.bxyApplyMode ?? 'lowest_priced'}
                              onChange={(e) => pricing.updateDiscountRule(rule.id, {
                                bxyApplyMode: (e.target as HTMLSelectElement).value as 'lowest_priced' | 'latest_added'
                              })}
                            >
                              <s-option value="lowest_priced">The lowest priced items</s-option>
                              <s-option value="latest_added">The latest added items</s-option>
                            </s-select>
                          </div>
                        </div>
                      ) : pricing.discountType === DiscountMethod.FIXED_BUNDLE_PRICE ? (
                        <div className={styles.fixedBundleRuleBody}>
                          <s-number-field
                            label="Number of Products in Bundle"
                            value={String(rule.conditionValue ?? 0)}
                            onInput={(e) => pricing.updateDiscountRule(rule.id, {
                              conditionValue: Number((e.target as HTMLInputElement).value) || 0
                            })}
                            min={0}
                          />
                          <s-number-field
                            label="Price"
                            value={String(centsToAmount(rule.discountValue))}
                            min={0}
                            prefix="₹"
                            onInput={(e) => pricing.updateDiscountRule(rule.id, {
                              discountValue: amountToCents(Number((e.target as HTMLInputElement).value) || 0)
                            })}
                          />
                        </div>
                      ) : (
                        <>
                          <s-select
                            label="Discount on"
                            value={rule.conditionType ?? 'quantity'}
                            onChange={(e) => pricing.updateDiscountRule(rule.id, {
                              conditionType: (e.target as HTMLSelectElement).value as 'quantity' | 'amount'
                            })}
                          >
                            <s-option value="quantity">Quantity</s-option>
                            <s-option value="amount">Amount</s-option>
                          </s-select>
                          <s-number-field
                            label={"is greater than or equal to"}
                            value={String(rule.conditionType === 'amount' ? centsToAmount(rule.conditionValue) : rule.conditionValue)}
                            min={0}
                            prefix={rule.conditionType === 'amount' ? "₹" : undefined}
                            onInput={(e) => {
                              const num = Number((e.target as HTMLInputElement).value) || 0;
                              pricing.updateDiscountRule(rule.id, {
                                conditionValue: rule.conditionType === 'amount' ? amountToCents(num) : num
                              });
                            }}
                          />
                            <s-number-field
                              label={
                                pricing.discountType === DiscountMethod.PERCENTAGE_OFF ? "Percentage Off" :
                                  pricing.discountType === DiscountMethod.FIXED_BUNDLE_PRICE ? "Bundle Price" :
                                    "Fixed Amount Off"
                              }
                              value={String(
                                pricing.discountType === DiscountMethod.PERCENTAGE_OFF
                                  ? rule.discountValue
                                  : centsToAmount(rule.discountValue)
                              )}
                              min={0}
                              max={pricing.discountType === DiscountMethod.PERCENTAGE_OFF ? 100 : undefined}
                              suffix={pricing.discountType === DiscountMethod.PERCENTAGE_OFF ? "%" : undefined}
                              prefix={pricing.discountType !== DiscountMethod.PERCENTAGE_OFF ? "₹" : undefined}
                              onInput={(e) => {
                              const num = Number((e.target as HTMLInputElement).value) || 0;
                              pricing.updateDiscountRule(rule.id, {
                                discountValue: pricing.discountType === DiscountMethod.PERCENTAGE_OFF
                                  ? Math.min(100, Math.max(0, num))
                                  : amountToCents(Math.max(0, num))
                              });
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

              {pricing.discountRules.length < 4 ? (
                <s-button
                  icon="plus"
                  variant="secondary"
	                          inlineSize="fill"
                  onClick={pricing.addDiscountRule}
                >
                  Add rule
                </s-button>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}>
                  Maximum 4 discount rules reached
                </p>
              )}
            </div>
          </div>

      {/* Discount Display Options */}
      <div
        className={`${styles.card} ${
          !pricing.discountEnabled ? styles.cardDisabled : ""
        }`}
      >
        <div style={{ marginBottom: 16 }}>
          <s-heading>Discount Display Options</s-heading>
          <s-text color="subdued">
            Choose how discounts are displayed
          </s-text>
        </div>

        <div className={styles.displayOptionRow}>
          <s-text>Progress bar</s-text>
          <s-switch
            accessibilityLabel="Show discount progress bar"
            checked={showProgressBar || undefined}
            onChange={(e) =>
              setShowProgressBar(
                (e.target as HTMLInputElement).checked
              )
            }
          />
        </div>

        <div className={styles.displayOptionDivider} />

        <div className={styles.displayOptionRow}>
          <div className={styles.displayOptionInfo}>
            <s-text>Discount Messaging</s-text>
            <s-text color="subdued">
              Edit how discount message appear above the subtotal.
            </s-text>
          </div>
          <s-switch
            accessibilityLabel="Enable discount messaging"
            checked={discountMessagingEnabled || undefined}
            onChange={(e) =>
              setDiscountMessagingEnabled(
                (e.target as HTMLInputElement).checked
              )
            }
          />
        </div>

        {discountMessagingEnabled && pricing.discountEnabled && (
          <div className={styles.messageTemplateSection}>
            <s-text-field
              label="Progress message"
              placeholder="Add {{conditionText}} to get {{discountText}}"
              value={progressMessage}
              onInput={(e) =>
                setProgressMessage(
                  (e.target as HTMLInputElement).value
                )
              }
              autocomplete="off"
            />
            <s-text-field
              label="Qualified message"
              placeholder="Congratulations! You got {{discountText}}!"
              value={qualifiedMessage}
              onInput={(e) =>
                setQualifiedMessage(
                  (e.target as HTMLInputElement).value
                )
              }
              autocomplete="off"
            />
            <s-text color="subdued">
              {"Variables: {{conditionText}}, {{discountText}}, {{bundleName}}"}
            </s-text>
          </div>
        )}
      </div>

    <div className={styles.wizardFooter}>
      <s-button variant="secondary" onClick={handleBack}>
        Back
      </s-button>
      <s-button
        variant="primary"
        disabled={isAnyWizardSaveInFlight || undefined}
        onClick={handleNext}
      >
        Next
      </s-button>
    </div>
  </div>
  );
}
