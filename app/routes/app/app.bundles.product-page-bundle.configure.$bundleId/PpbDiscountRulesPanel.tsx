import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbDiscountRulesPanel() {
  const {
    amountToCents,
    centsToAmount,
    createNewPricingRule,
    DISCOUNT_METHOD_OPTIONS,
    DiscountMethod,
    pricingState,
    productPageBundleStyles,
    setGlobalSuccessMessage,
    setRuleMessages,
    setRuleMessagesByLocale,
    setSuccessMessageByLocale,
  } = usePpbConfigureContext();

  return (
    <s-section>
      <s-stack direction="block" gap="base">
        <s-stack direction="block" gap="small-400">
          <s-stack direction="inline" gap="small" alignItems="center">
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              Discount &amp; Pricing
            </h3>
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
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Set up discount rules, applied from lowest to highest.
          </p>
        </s-stack>
        <s-banner tone="info">
          Tip: Discounts are calculated based on the products in cart, make sure
          to add the &quot;Default Product&quot; quantity or amount while
          configuring discounts.
        </s-banner>
        <div
          style={{
            opacity: pricingState.discountEnabled ? 1 : 0.45,
            pointerEvents: pricingState.discountEnabled ? "auto" : "none",
          }}
        >
          <s-stack direction="block" gap="base">
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>
                Discount Type
              </p>
              <s-select
                value={pricingState.discountType}
                onChange={(e) => {
                  const nextDiscountType = (e.target as HTMLSelectElement)
                    .value as typeof pricingState.discountType;
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
            {pricingState.discountType === DiscountMethod.BUY_X_GET_Y ? (
              <PpbBuyXGetYRules />
            ) : (
              <PpbStandardDiscountRules />
            )}
          </s-stack>
        </div>
      </s-stack>
    </s-section>
  );
}

function PpbBuyXGetYRules() {
  const { pricingState, productPageBundleStyles } = usePpbConfigureContext();

  return (
    <s-stack direction="block" gap="small">
      {pricingState.discountRules.map((rule, index) => (
        <div key={rule.id} className={productPageBundleStyles.discountRuleCard}>
          <s-stack direction="block" gap="small">
            <div className={productPageBundleStyles.discountRuleHeader}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
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
            <div className={productPageBundleStyles.bxyRuleBody}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                Customer buys
              </p>
              <s-number-field
                label="Minimum quantity of items"
                value={String(rule.customerBuys ?? 2)}
                onInput={(e) =>
                  pricingState.updateDiscountRule(rule.id, {
                    customerBuys: Math.max(
                      1,
                      Number((e.target as HTMLInputElement).value) || 1,
                    ),
                  })
                }
                min={1}
              />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                Customer gets
              </p>
              <s-number-field
                label="Quantity"
                value={String(rule.customerGets ?? 1)}
                onInput={(e) =>
                  pricingState.updateDiscountRule(rule.id, {
                    customerGets: Math.max(
                      1,
                      Number((e.target as HTMLInputElement).value) || 1,
                    ),
                  })
                }
                min={1}
              />
              <div className={productPageBundleStyles.bxyRewardGrid}>
                <s-number-field
                  label="Discount value"
                  value={String(rule.discountValue ?? 0)}
                  onInput={(e) =>
                    pricingState.updateDiscountRule(rule.id, {
                      discountValue: (() => {
                        const nextValue =
                          Number((e.target as HTMLInputElement).value) || 0;
                        return (rule.bxyDiscountType ?? "percentage") ===
                          "percentage"
                          ? Math.min(100, Math.max(0, nextValue))
                          : Math.max(0, nextValue);
                      })(),
                    })
                  }
                  min={0}
                  suffix={
                    (rule.bxyDiscountType ?? "percentage") === "percentage"
                      ? "%"
                      : undefined
                  }
                  prefix={
                    (rule.bxyDiscountType ?? "percentage") === "fixed_amount"
                      ? "₹"
                      : undefined
                  }
                  max={
                    (rule.bxyDiscountType ?? "percentage") === "percentage"
                      ? 100
                      : undefined
                  }
                />
                <s-select
                  label="Discount type"
                  value={rule.bxyDiscountType ?? "percentage"}
                  onChange={(e) => {
                    const bxyDiscountType = (e.target as HTMLSelectElement)
                      .value as "percentage" | "fixed_amount";
                    const currentValue = Number(rule.discountValue ?? 0) || 0;
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
                      bxyApplyMode: (e.target as HTMLSelectElement).value as
                        | "lowest_priced"
                        | "latest_added",
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
          </s-stack>
        </div>
      ))}
      <PpbAddDiscountRuleButton />
    </s-stack>
  );
}

function PpbStandardDiscountRules() {
  const {
    amountToCents,
    centsToAmount,
    DiscountMethod,
    pricingState,
    productPageBundleStyles,
  } = usePpbConfigureContext();

  return (
    <s-stack direction="block" gap="small">
      {pricingState.discountRules.map((rule, index) => (
        <div key={rule.id} className={productPageBundleStyles.discountRuleCard}>
          <s-stack direction="block" gap="small">
            <div className={productPageBundleStyles.discountRuleHeader}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
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
            {pricingState.discountType === DiscountMethod.FIXED_BUNDLE_PRICE ? (
              <div className={productPageBundleStyles.discountFieldsRowPair}>
                <s-number-field
                  label="Number of Products in Bundle"
                  value={String(rule.conditionValue ?? 0)}
                  onInput={(e) =>
                    pricingState.updateDiscountRule(rule.id, {
                      conditionValue:
                        Number((e.target as HTMLInputElement).value) || 0,
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
                        Number((e.target as HTMLInputElement).value) || 0,
                      ),
                    })
                  }
                  min={0}
                  prefix="₹"
                />
              </div>
            ) : (
              <div className={productPageBundleStyles.discountFieldsRow}>
                <s-select
                  label="Discount on"
                  value={rule.conditionType ?? "quantity"}
                  onChange={(e) =>
                    pricingState.updateDiscountRule(rule.id, {
                      conditionType: (e.target as HTMLSelectElement).value as
                        | "quantity"
                        | "amount",
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
                      Number((e.target as HTMLInputElement).value) || 0;
                    const finalValue =
                      rule.conditionType === "amount"
                        ? amountToCents(numValue)
                        : numValue;
                    pricingState.updateDiscountRule(rule.id, {
                      conditionValue: finalValue,
                    });
                  }}
                  min={0}
                  prefix={rule.conditionType === "amount" ? "₹" : undefined}
                />
                <s-number-field
                  label={
                    pricingState.discountType === DiscountMethod.PERCENTAGE_OFF
                      ? "Percentage Off"
                      : "Fixed Amount Off"
                  }
                  value={String(
                    pricingState.discountType === DiscountMethod.PERCENTAGE_OFF
                      ? rule.discountValue
                      : centsToAmount(rule.discountValue),
                  )}
                  onInput={(e) => {
                    const numValue =
                      Number((e.target as HTMLInputElement).value) || 0;
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
                    pricingState.discountType === DiscountMethod.PERCENTAGE_OFF
                      ? 100
                      : undefined
                  }
                  suffix={
                    pricingState.discountType === DiscountMethod.PERCENTAGE_OFF
                      ? "%"
                      : undefined
                  }
                  prefix={
                    pricingState.discountType !== DiscountMethod.PERCENTAGE_OFF
                      ? "₹"
                      : undefined
                  }
                />
              </div>
            )}
          </s-stack>
        </div>
      ))}
      <PpbAddDiscountRuleButton />
    </s-stack>
  );
}

function PpbAddDiscountRuleButton() {
  const { pricingState } = usePpbConfigureContext();

  if (pricingState.discountRules.length < 4) {
    return (
      <s-button
        variant="secondary"
        icon="plus"
        inlineSize="fill"
        onClick={pricingState.addDiscountRule}
      >
        Add rule
      </s-button>
    );
  }

  return (
    <p
      style={{ margin: 0, fontSize: 14, color: "#6d7175", textAlign: "center" }}
    >
      Maximum 4 discount rules reached
    </p>
  );
}
