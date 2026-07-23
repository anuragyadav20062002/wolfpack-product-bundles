import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbSyncAndLanguageModals({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeBundleQuantityLocale,
    activeProgressBarLocale,
    bundle,
    bundleQuantityMultiLangModalRef,
    enablePreviewGate,
    EnablePreviewModal,
    fetcher,
    fullPageBundleStyles,
    handleSyncBundleConfirm,
    markAsDirty,
    normalizedPricingDisplayOptions,
    pricingState,
    progressBarMultiLangModalRef,
    setActiveBundleQuantityLocale,
    setActiveProgressBarLocale,
    setIsBundleQuantityMultiLangModalOpen,
    setIsProgressBarMultiLangModalOpen,
    setIsSyncModalOpen,
    setTierTextByLocaleByRuleId,
    shopLocales,
    syncModalRef,
    tierTextByLocaleByRuleId,
    tierTextByRuleId,
  } = flow;

  return (
    <>
      {/* Sync Bundle Confirmation Modal */}
      <s-modal ref={syncModalRef} heading="Sync Wolfpack bundle?">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14 }}>
            Syncing refreshes the Shopify data used by this Wolfpack Bundles
            configuration.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>The Shopify page will be deleted and re-created</li>
            <li>All bundle and component metafields will be rewritten</li>
          </ul>
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Bundle analytics are preserved. This action cannot be undone.
          </p>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          loading={fetcher.state === "submitting" || undefined}
          onClick={handleSyncBundleConfirm}
        >
          Sync bundle
        </s-button>
        <s-button
          slot="secondary-actions"
          onClick={() => setIsSyncModalOpen(false)}
        >
          Cancel
        </s-button>
      </s-modal>
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
          {normalizedPricingDisplayOptions.bundleQuantityOptions.options.map(
            (option: any, index: number) => {
              const localizedOption =
                pricingState.pricingDisplayOptions.bundleQuantityOptions
                  .optionsByLocaleByRuleId?.[activeBundleQuantityLocale]?.[
                  option.ruleId
                ];
              return (
                <s-section key={option.ruleId}>
                  <s-stack direction="block" gap="small-100">
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                      Rule #{index + 1}
                    </p>
                    <s-text-field
                      label="Box Label"
                      value={localizedOption?.label ?? option.label}
                      onInput={(e) =>
                        pricingState.updateLocalizedBundleQuantityOption(
                          activeBundleQuantityLocale,
                          option.ruleId,
                          { label: (e.target as HTMLInputElement).value },
                        )
                      }
                      autocomplete="off"
                    />
                    <s-text-field
                      label="Box Subtext"
                      value={localizedOption?.subtext ?? option.subtext}
                      onInput={(e) =>
                        pricingState.updateLocalizedBundleQuantityOption(
                          activeBundleQuantityLocale,
                          option.ruleId,
                          { subtext: (e.target as HTMLInputElement).value },
                        )
                      }
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
          variant="primary"
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
              <div
                key={rule.id}
                className={fullPageBundleStyles.discountRuleCard}
              >
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
                        setTierTextByLocaleByRuleId((prev: any) => ({
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
                        setTierTextByLocaleByRuleId((prev: any) => ({
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
              </div>
            ))
          )}
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          onClick={() => setIsProgressBarMultiLangModalOpen(false)}
        >
          Save and close
        </s-button>
      </s-modal>
      <EnablePreviewModal {...enablePreviewGate.modalProps} />
    </>
  );
}
