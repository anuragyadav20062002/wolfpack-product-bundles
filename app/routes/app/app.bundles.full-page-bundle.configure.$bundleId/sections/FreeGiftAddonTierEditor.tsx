import {
  getNextAddonTierAccordionIndex,
  normalizeAddonTierAccordionIndex,
} from "../../../../lib/addon-tier-accordion";
import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbAddonTierEditor({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeAddonTierIndex,
    addonDraft,
    CATEGORY_CONDITION_OPERATOR_OPTIONS,
    createDefaultAddonDraftTier,
    createDefaultAddonTierCondition,
    fullPageBundleStyles,
    handleAddonSelectedProductAdd,
    openAddonSelectedProductsModal,
    setActiveAddonTierIndex,
    updateAddonDraft,
  } = flow;

  return (
    <>
      {(() => {
        const addonTiers: any[] = Array.isArray(addonDraft.addonTiers)
          ? (addonDraft.addonTiers as any[])
          : [createDefaultAddonDraftTier()];
        const updateAddonTiers = (updated: any[]) => {
          updateAddonDraft({ addonTiers: updated });
        };
        const getAddonConditions = (tier: any) =>
          Array.isArray(tier?.conditions) ? tier.conditions : [];
        const addAddonTierCondition = (tierIndex: number) => {
          const updated = addonTiers.map((tier, i) => {
            if (i !== tierIndex) return tier;
            const conditions = getAddonConditions(tier);
            const defaultRule = {
              ...createDefaultAddonTierCondition(),
            };
            return {
              ...tier,
              conditions: [...conditions, defaultRule],
            };
          });
          updateAddonTiers(updated);
        };
        const removeAddonTierCondition = (
          tierIndex: number,
          ruleId: string,
        ) => {
          const updated = addonTiers.map((tier, i) => {
            if (i !== tierIndex) return tier;
            const conditions = getAddonConditions(tier);
            return {
              ...tier,
              conditions: conditions.filter(
                (rule: any, idx: number) => String(rule.id ?? idx) !== ruleId,
              ),
            };
          });
          updateAddonTiers(updated);
        };
        const updateAddonTierCondition = (
          tierIndex: number,
          ruleId: string,
          field: string,
          value: string,
        ) => {
          const updated = addonTiers.map((tier, i) => {
            if (i !== tierIndex) return tier;
            const conditions = getAddonConditions(tier);
            return {
              ...tier,
              conditions: conditions.map((rule: any, idx: number) =>
                String(rule.id ?? idx) === ruleId
                  ? { ...rule, [field]: value }
                  : rule,
              ),
            };
          });
          updateAddonTiers(updated);
        };
        return (
          <>
            {addonTiers.map((tier, idx) => {
              const isActiveTier = activeAddonTierIndex === idx;
              return (
                <div
                  key={idx}
                  className={`${fullPageBundleStyles.addonsTierCard} ${isActiveTier ? fullPageBundleStyles.addonsTierCardActive : ""}`}
                >
                  <div
                    className={`${fullPageBundleStyles.addonsTierHeader} ${isActiveTier ? fullPageBundleStyles.addonsTierHeaderActive : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isActiveTier}
                    onClick={() =>
                      setActiveAddonTierIndex((currentIndex: number | null) =>
                        getNextAddonTierAccordionIndex(currentIndex, idx),
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveAddonTierIndex(
                          (currentIndex: number | null) =>
                            getNextAddonTierAccordionIndex(currentIndex, idx),
                        );
                      }
                    }}
                  >
                    <h4 className={fullPageBundleStyles.addonsTierTitle}>
                      Tier {idx + 1}
                    </h4>
                    <span
                      className={fullPageBundleStyles.addonsTierHeaderActions}
                    >
                      <span
                        className={fullPageBundleStyles.addonsTierDeleteButton}
                        title={`Delete Tier ${idx + 1}`}
                      >
                        <s-button
                          variant="tertiary"
                          icon="delete"
                          tone="critical"
                          accessibilityLabel={`Delete Tier ${idx + 1}`}
                          disabled={addonTiers.length <= 1 || undefined}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (addonTiers.length > 1) {
                              const updated = addonTiers.filter(
                                (_, i) => i !== idx,
                              );
                              updateAddonTiers(updated);
                              setActiveAddonTierIndex(
                                (currentIndex: number | null) =>
                                  normalizeAddonTierAccordionIndex(
                                    currentIndex,
                                    updated.length,
                                  ),
                              );
                            }
                          }}
                        />
                      </span>
                      <span
                        className={fullPageBundleStyles.addonsTierChevron}
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                  {isActiveTier && (
                    <div className={fullPageBundleStyles.addonsTierBody}>
                      <s-stack direction="block" gap="small">
                        <s-text-field
                          label="Tier title"
                          value={tier.title ?? `Tier ${idx + 1}`}
                          onInput={(e) => {
                            const updated = addonTiers.map((t, i) =>
                              i === idx
                                ? {
                                    ...t,
                                    title: (e.target as HTMLInputElement).value,
                                  }
                                : t,
                            );
                            updateAddonTiers(updated);
                          }}
                          autocomplete="off"
                        />
                        <div
                          className={
                            fullPageBundleStyles.addonsProductSelectionRow
                          }
                        >
                          <s-button
                            variant="primary"
                            onClick={() => handleAddonSelectedProductAdd(idx)}
                          >
                            Add Products
                          </s-button>
                          {Array.isArray(tier.selectedAddonProducts) &&
                            tier.selectedAddonProducts.length > 0 && (
                              <button
                                type="button"
                                className={`${fullPageBundleStyles.addonsSelectedCount} ${fullPageBundleStyles.addonsSelectedButton}`}
                                onClick={() =>
                                  openAddonSelectedProductsModal(idx)
                                }
                              >
                                {tier.selectedAddonProducts.length}
                                Selected
                              </button>
                            )}
                        </div>
                        <s-checkbox
                          label="Display Variants as Individual Products"
                          checked={
                            tier.displayVariantsAsIndividualProducts_addons ===
                              true || undefined
                          }
                          onChange={(e) => {
                            const updated = addonTiers.map((t, i) =>
                              i === idx
                                ? {
                                    ...t,
                                    displayVariantsAsIndividualProducts_addons:
                                      (e.target as HTMLInputElement).checked,
                                  }
                                : t,
                            );
                            updateAddonTiers(updated);
                          }}
                        />
                        <div
                          className={fullPageBundleStyles.addonsDiscountGrid}
                        >
                          <s-select
                            label="Discount Based on"
                            value={
                              tier.eligibilityType ||
                              tier.eligibilityCondition?.type ||
                              "QUANTITY"
                            }
                            onChange={(e) => {
                              const updated = addonTiers.map((t, i) =>
                                i === idx
                                  ? {
                                      ...t,
                                      eligibilityType: (
                                        e.target as HTMLSelectElement
                                      ).value,
                                    }
                                  : t,
                              );
                              updateAddonTiers(updated);
                            }}
                          >
                            <s-option value="QUANTITY">
                              Bundle Product Quantity
                            </s-option>
                            <s-option value="AMOUNT">Bundle Value</s-option>
                          </s-select>
                          <s-number-field
                            label={
                              (tier.eligibilityType ||
                                tier.eligibilityCondition?.type) === "AMOUNT"
                                ? "Value"
                                : "Qty"
                            }
                            value={String(
                              tier.eligibilityValue ??
                                tier.eligibilityCondition?.value ??
                                1,
                            )}
                            onInput={(e) => {
                              const updated = addonTiers.map((t, i) =>
                                i === idx
                                  ? {
                                      ...t,
                                      eligibilityValue:
                                        Number(
                                          (e.target as HTMLInputElement).value,
                                        ) || 0,
                                    }
                                  : t,
                              );
                              updateAddonTiers(updated);
                            }}
                            min={0}
                          />
                          <s-number-field
                            label="Discount on Add-ons"
                            value={String(
                              tier.discountValue ?? tier.discount?.value ?? 0,
                            )}
                            onInput={(e) => {
                              const updated = addonTiers.map((t, i) =>
                                i === idx
                                  ? {
                                      ...t,
                                      discountType: "PERCENTAGE",
                                      discountValue:
                                        Number(
                                          (e.target as HTMLInputElement).value,
                                        ) || 0,
                                    }
                                  : t,
                              );
                              updateAddonTiers(updated);
                            }}
                            min={0}
                            max={100}
                            suffix="%"
                          />
                        </div>
                        <div className={fullPageBundleStyles.addonsTierRules}>
                          <h5>Tier Rules</h5>
                          <p>
                            Create Rules based on quantity of products added on
                            this tier.
                          </p>
                          <p>Note: Rules are only valid on this tier.</p>
                          {getAddonConditions(tier).length > 0 && (
                            <div className={fullPageBundleStyles.rulesList}>
                              {getAddonConditions(tier).map(
                                (rule: any, ruleIndex: number) => (
                                  <div
                                    key={rule.id || ruleIndex}
                                    className={fullPageBundleStyles.ruleCard}
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
                                          removeAddonTierCondition(
                                            idx,
                                            String(rule.id ?? ruleIndex),
                                          )
                                        }
                                      >
                                        Remove
                                      </s-button>
                                    </div>
                                    <div
                                      className={
                                        fullPageBundleStyles.ruleFields
                                      }
                                    >
                                      <s-select
                                        label="Type"
                                        value={rule.type || "quantity"}
                                        onChange={(e) =>
                                          updateAddonTierCondition(
                                            idx,
                                            String(rule.id ?? ruleIndex),
                                            "type",
                                            (e.target as HTMLSelectElement)
                                              .value,
                                          )
                                        }
                                      >
                                        <s-option value="quantity">
                                          Quantity
                                        </s-option>
                                        <s-option value="amount">
                                          Amount
                                        </s-option>
                                      </s-select>
                                      <s-select
                                        label="Condition"
                                        value={
                                          rule.condition || "lessThanOrEqualTo"
                                        }
                                        onChange={(e) =>
                                          updateAddonTierCondition(
                                            idx,
                                            String(rule.id ?? ruleIndex),
                                            "condition",
                                            (e.target as HTMLSelectElement)
                                              .value,
                                          )
                                        }
                                      >
                                        {[
                                          ...CATEGORY_CONDITION_OPERATOR_OPTIONS,
                                        ].map((opt) => (
                                          <s-option
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </s-option>
                                        ))}
                                      </s-select>
                                      <s-number-field
                                        label="Value"
                                        value={rule.value ?? ""}
                                        onInput={(e) => {
                                          updateAddonTierCondition(
                                            idx,
                                            String(rule.id ?? ruleIndex),
                                            "value",
                                            (e.target as HTMLInputElement)
                                              .value,
                                          );
                                        }}
                                        autocomplete="off"
                                      />
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                          <div
                            className={
                              fullPageBundleStyles.addonsTierRuleAction
                            }
                          >
                            <button
                              type="button"
                              className={
                                fullPageBundleStyles.addonsTierFullWidthButton
                              }
                              onClick={() => addAddonTierCondition(idx)}
                            >
                              Add Tier Rule
                            </button>
                          </div>
                        </div>
                      </s-stack>
                    </div>
                  )}
                </div>
              );
            })}
            <div className={fullPageBundleStyles.addonsTierAddAction}>
              <button
                type="button"
                className={fullPageBundleStyles.addonsTierFullWidthButton}
                onClick={() => {
                  updateAddonTiers([
                    ...addonTiers,
                    {
                      ...createDefaultAddonDraftTier(addonTiers.length),
                    },
                  ]);
                  setActiveAddonTierIndex(addonTiers.length);
                }}
              >
                Add Add Ons Tier
              </button>
            </div>
          </>
        );
      })()}
    </>
  );
}
