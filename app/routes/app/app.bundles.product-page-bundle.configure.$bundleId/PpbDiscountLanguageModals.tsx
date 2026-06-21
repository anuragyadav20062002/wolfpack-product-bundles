import { usePpbConfigureContext } from "./PpbConfigureContext";
import type { PricingRule } from "../../../types/pricing";

export function PpbDiscountLanguageModals() {
  const {
    activeBundleQuantityLocale,
    activeProgressBarLocale,
    bundleQuantityMultiLangModalRef,
    markAsDirty,
    pricingState,
    progressBarMultiLangModalRef,
    qtyRuleLabels,
    qtyRuleSubtexts,
    qtyRuleTextsByLocaleByRuleId,
    setActiveBundleQuantityLocale,
    setActiveProgressBarLocale,
    setIsBundleQuantityMultiLangModalOpen,
    setIsProgressBarMultiLangModalOpen,
    setQtyRuleTextsByLocaleByRuleId,
    setTierTextByLocaleByRuleId,
    shopLocales,
    tierTextByLocaleByRuleId,
    tierTextByRuleId,
  } = usePpbConfigureContext();

  return (
    <>
      {/* Bundle Quantity Options Multi Language Modal */}
      <s-modal
        id="discount-bundle-quantity-language-modal"
        ref={bundleQuantityMultiLangModalRef}
        heading="Customize Text for Multiple Languages"
      >
        <s-stack direction="block" gap="small">
          {shopLocales.length > 0 && (
            <s-select
              label="Select Language"
              value={activeBundleQuantityLocale}
              onChange={(e) =>
                setActiveBundleQuantityLocale(
                  (e.target as HTMLSelectElement).value,
                )
              }
            >
              {shopLocales.map(
                (loc: { locale: string; name: string; primary: boolean }) => (
                  <s-option key={loc.locale} value={loc.locale}>
                    {loc.name}
                    {loc.primary ? " (default)" : ""}
                  </s-option>
                ),
              )}
            </s-select>
          )}
          {pricingState.discountRules.map(
            (rule: PricingRule, index: number) => {
              const localizedOption =
                qtyRuleTextsByLocaleByRuleId[activeBundleQuantityLocale]?.[
                  rule.id
                ];
              return (
                <s-section key={rule.id}>
                  <s-stack direction="block" gap="small-100">
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                      Rule #{index + 1}
                    </p>
                    <s-text-field
                      label="Box Label"
                      value={
                        localizedOption?.label ??
                        qtyRuleLabels[rule.id] ??
                        `Box of ${rule.conditionValue ?? ""}`
                      }
                      onInput={(e) => {
                        const label = (e.target as HTMLInputElement).value;
                        setQtyRuleTextsByLocaleByRuleId((prev) => ({
                          ...prev,
                          [activeBundleQuantityLocale]: {
                            ...(prev[activeBundleQuantityLocale] ?? {}),
                            [rule.id]: {
                              label,
                              subtext:
                                prev[activeBundleQuantityLocale]?.[rule.id]
                                  ?.subtext ??
                                qtyRuleSubtexts[rule.id] ??
                                "",
                            },
                          },
                        }));
                        markAsDirty();
                      }}
                      autocomplete="off"
                    />
                    <s-text-field
                      label="Box Subtext"
                      value={
                        localizedOption?.subtext ??
                        qtyRuleSubtexts[rule.id] ??
                        ""
                      }
                      onInput={(e) => {
                        const subtext = (e.target as HTMLInputElement).value;
                        setQtyRuleTextsByLocaleByRuleId((prev) => ({
                          ...prev,
                          [activeBundleQuantityLocale]: {
                            ...(prev[activeBundleQuantityLocale] ?? {}),
                            [rule.id]: {
                              label:
                                prev[activeBundleQuantityLocale]?.[rule.id]
                                  ?.label ??
                                qtyRuleLabels[rule.id] ??
                                `Box of ${rule.conditionValue ?? ""}`,
                              subtext,
                            },
                          },
                        }));
                        markAsDirty();
                      }}
                      autocomplete="off"
                    />
                  </s-stack>
                </s-section>
              );
            },
          )}
        </s-stack>
        <s-button
          slot="primary-action"
          onClick={() => setIsBundleQuantityMultiLangModalOpen(false)}
        >
          Save and close
        </s-button>
      </s-modal>
      {/* Progress Bar Multi Language Modal */}
      <s-modal
        id="discount-progress-language-modal"
        ref={progressBarMultiLangModalRef}
        heading="Customize Text for Multiple Languages"
      >
        <s-stack direction="block" gap="small">
          {shopLocales.length > 0 && (
            <s-select
              label="Select Language"
              value={activeProgressBarLocale}
              onChange={(e) =>
                setActiveProgressBarLocale(
                  (e.target as HTMLSelectElement).value,
                )
              }
            >
              {shopLocales.map(
                (loc: { locale: string; name: string; primary: boolean }) => (
                  <s-option key={loc.locale} value={loc.locale}>
                    {loc.name}
                    {loc.primary ? " (default)" : ""}
                  </s-option>
                ),
              )}
            </s-select>
          )}
          {pricingState.discountRules.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
              Add discount rules to configure tier text.
            </p>
          ) : (
            pricingState.discountRules.map((rule: any, index: number) => (
              <s-section key={rule.id}>
                <s-stack direction="block" gap="small-100">
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                    Rule #{index + 1}
                  </p>
                  <s-stack direction="inline" gap="small">
                    <s-text-area
                      label="Tier Text"
                      value={
                        tierTextByLocaleByRuleId[activeProgressBarLocale]?.[
                          rule.id
                        ]?.tierText ??
                        tierTextByRuleId[rule.id]?.tierText ??
                        ""
                      }
                      onInput={(e) => {
                        const val = (e.target as HTMLTextAreaElement).value;
                        setTierTextByLocaleByRuleId((prev) => ({
                          ...prev,
                          [activeProgressBarLocale]: {
                            ...(prev[activeProgressBarLocale] || {}),
                            [rule.id]: {
                              tierText: val,
                              tierSubtext:
                                prev[activeProgressBarLocale]?.[rule.id]
                                  ?.tierSubtext ??
                                tierTextByRuleId[rule.id]?.tierSubtext ??
                                "",
                            },
                          },
                        }));
                        markAsDirty();
                      }}
                      autocomplete="off"
                    />
                    <s-text-area
                      label="Tier Subtext"
                      value={
                        tierTextByLocaleByRuleId[activeProgressBarLocale]?.[
                          rule.id
                        ]?.tierSubtext ??
                        tierTextByRuleId[rule.id]?.tierSubtext ??
                        ""
                      }
                      onInput={(e) => {
                        const val = (e.target as HTMLTextAreaElement).value;
                        setTierTextByLocaleByRuleId((prev) => ({
                          ...prev,
                          [activeProgressBarLocale]: {
                            ...(prev[activeProgressBarLocale] || {}),
                            [rule.id]: {
                              tierText:
                                prev[activeProgressBarLocale]?.[rule.id]
                                  ?.tierText ??
                                tierTextByRuleId[rule.id]?.tierText ??
                                "",
                              tierSubtext: val,
                            },
                          },
                        }));
                        markAsDirty();
                      }}
                      autocomplete="off"
                    />
                  </s-stack>
                </s-stack>
              </s-section>
            ))
          )}
        </s-stack>
        <s-button
          slot="primary-action"
          onClick={() => setIsProgressBarMultiLangModalOpen(false)}
        >
          Save and close
        </s-button>
      </s-modal>
    </>
  );
}
