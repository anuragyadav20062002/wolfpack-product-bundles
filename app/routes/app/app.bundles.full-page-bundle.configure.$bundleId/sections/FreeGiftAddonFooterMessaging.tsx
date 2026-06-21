import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbAddonFooterMessaging({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    ADDON_MESSAGE_KEY,
    bundle,
    fullPageBundleStyles,
    markAsDirty,
    openAddonFooterMultiLanguageModal,
    ruleMessages,
    setIsAddonVariablesModalOpen,
    setRuleMessages,
  } = flow;
  const savedAddonMessages =
    (bundle as any).personalizationData?.addonProducts?.addonsMessaging
      ?.tier1 || {};
  const addonMessages = ruleMessages[ADDON_MESSAGE_KEY] || {
    discountText: savedAddonMessages.ineligibleState || "",
    successMessage: savedAddonMessages.eligibleState || "",
  };

  return (
    <>
      <div
        className={`${fullPageBundleStyles.card} ${fullPageBundleStyles.addonsFooterCard}`}
      >
        <div className={fullPageBundleStyles.panelHeader}>
          <h3 className={fullPageBundleStyles.panelTitle}>Footer Messaging</h3>
          <s-stack direction="inline" gap="small-100">
            <s-button
              variant="tertiary"
              onClick={() => setIsAddonVariablesModalOpen(true)}
            >
              Show Variables
            </s-button>
            <s-button
              variant="secondary"
              icon="globe"
              onClick={openAddonFooterMultiLanguageModal}
            >
              Multi Language
            </s-button>
          </s-stack>
        </div>
        <s-stack direction="block" gap="small">
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>Tier 1</h4>
          <s-text-field
            label="Message when rule not met"
            value={addonMessages.discountText}
            placeholder="Add {{addonsConditionDiff}} more product(s) to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons"
            onInput={(e) => {
              const value = (e.target as HTMLInputElement).value;
              setRuleMessages((prev) => ({
                ...prev,
                [ADDON_MESSAGE_KEY]: {
                  ...(prev[ADDON_MESSAGE_KEY] || addonMessages),
                  discountText: value,
                },
              }));
              markAsDirty();
            }}
            autocomplete="off"
          />
          <s-text-field
            label="Success Message"
            value={addonMessages.successMessage}
            placeholder="Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons"
            onInput={(e) => {
              const value = (e.target as HTMLInputElement).value;
              setRuleMessages((prev) => ({
                ...prev,
                [ADDON_MESSAGE_KEY]: {
                  ...(prev[ADDON_MESSAGE_KEY] || addonMessages),
                  successMessage: value,
                },
              }));
              markAsDirty();
            }}
            autocomplete="off"
          />
        </s-stack>
      </div>
    </>
  );
}
