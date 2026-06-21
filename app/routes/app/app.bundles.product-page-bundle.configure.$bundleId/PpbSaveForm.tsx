import { usePpbConfigureContext } from "./PpbConfigureContext";
import type { PricingRule } from "../../../types/pricing";

export function PpbSaveForm() {
  const {
    SaveBar,
    bundleProduct,
    conditionsState,
    discountMessagingMultiLanguageEnabled,
    fetcher,
    formState,
    handleSave,
    isDirty,
    pricingState,
    progressBarEnabled,
    progressBarProgressText,
    progressBarSuccessText,
    progressBarType,
    qtyOptionsDefaultRuleId,
    qtyOptionsEnabled,
    qtyRuleLabels,
    qtyRuleSubtexts,
    qtyRuleTextsByLocaleByRuleId,
    ruleMessages,
    ruleMessagesByLocale,
    saveBarRef,
    setShowDiscardModal,
    stepsState,
    tierTextByLocaleByRuleId,
    tierTextByRuleId,
  } = usePpbConfigureContext();

  return (
    <>
      {/* Modern App Bridge SaveBar with declarative React state management */}
      <form
        data-save-lock-allow="true"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        onReset={(e) => {
          e.preventDefault();
          setShowDiscardModal(true);
        }}
      >
        {/* SaveBar component - visibility controlled declaratively via 'open' prop */}
        {/* Loading state properly shows spinner during save operation */}
        <SaveBar ref={saveBarRef} id="bundle-save-bar" open={isDirty}>
          <button
            type="submit"
            variant="primary"
            loading={fetcher.state !== "idle" ? "" : undefined}
            disabled={fetcher.state !== "idle"}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            disabled={fetcher.state !== "idle"}
          >
            Discard
          </button>
        </SaveBar>
        {/* Hidden inputs for form submission - values will be updated by React state changes */}
        <input type="hidden" name="bundleName" value={formState.bundleName} />
        <input
          type="hidden"
          name="bundleDescription"
          value={formState.bundleDescription}
        />
        <input
          type="hidden"
          name="templateName"
          value={formState.templateName}
        />
        <input
          type="hidden"
          name="bundleStatus"
          value={formState.bundleStatus}
        />
        <input
          type="hidden"
          name="bundleProduct"
          value={JSON.stringify(bundleProduct)}
        />
        <input
          type="hidden"
          name="stepsData"
          value={JSON.stringify(stepsState.steps)}
        />
        <input
          type="hidden"
          name="discountData"
          value={JSON.stringify({
            discountEnabled: pricingState.discountEnabled,
            discountType: pricingState.discountType,
            discountRules: pricingState.discountRules,
            showFooter: pricingState.showFooter,
            discountMessagingEnabled: pricingState.discountMessagingEnabled,
            ruleMessages,
            discountMessagingMultiLanguageEnabled,
            ruleMessagesByLocale: discountMessagingMultiLanguageEnabled
              ? ruleMessagesByLocale
              : null,
            tierTextByRuleId:
              Object.keys(tierTextByRuleId).length > 0
                ? tierTextByRuleId
                : null,
            tierTextByLocaleByRuleId:
              Object.keys(tierTextByLocaleByRuleId).length > 0
                ? tierTextByLocaleByRuleId
                : null,
            displayOptions: {
              bundleQuantityOptions: {
                enabled: qtyOptionsEnabled,
                defaultRuleId: qtyOptionsDefaultRuleId,
                optionsByRuleId: Object.fromEntries(
                  pricingState.discountRules.map((rule: PricingRule) => [
                    rule.id,
                    {
                      label:
                        qtyRuleLabels[rule.id] ??
                        `Box of ${rule.conditionValue ?? ""}`,
                      subtext: qtyRuleSubtexts[rule.id] ?? "",
                    },
                  ]),
                ),
                optionsByLocaleByRuleId: qtyRuleTextsByLocaleByRuleId,
              },
              progressBar: {
                enabled: progressBarEnabled,
                type: progressBarType,
                progressText: progressBarProgressText,
                successText: progressBarSuccessText,
              },
            },
          })}
        />
        <input
          type="hidden"
          name="stepConditions"
          value={JSON.stringify(conditionsState.stepConditions)}
        />
      </form>
    </>
  );
}
