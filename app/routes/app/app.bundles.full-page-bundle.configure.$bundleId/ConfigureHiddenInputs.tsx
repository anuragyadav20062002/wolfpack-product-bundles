import type { ConfigureBundleFlowContext } from "./useConfigureBundleFlow";

export function ConfigureHiddenInputs({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    bundleProduct,
    conditionsState,
    discountMessagingMultiLanguageEnabled,
    formState,
    normalizedPricingDisplayOptions,
    normalizedRuleMessages,
    pricingState,
    ruleMessages,
    ruleMessagesByLocale,
    serializePricingDisplayOptions,
    stepsState,
    tierTextByLocaleByRuleId,
    tierTextByRuleId,
  } = flow;

  return (
    <>
      <input type="hidden" name="bundleName" value={formState.bundleName} />
      <input
        type="hidden"
        name="bundleDescription"
        value={formState.bundleDescription}
      />
      <input type="hidden" name="templateName" value={formState.templateName} />
      <input type="hidden" name="bundleStatus" value={formState.bundleStatus} />
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
          showDiscountProgressBar: pricingState.showDiscountProgressBar,
          discountMessagingEnabled: pricingState.discountMessagingEnabled,
          ruleMessages: normalizedRuleMessages,
          pricingDisplayOptions: serializePricingDisplayOptions({
            existingMessages: {
              showDiscountMessaging: pricingState.discountMessagingEnabled,
              ruleMessages: normalizedRuleMessages,
            },
            options: normalizedPricingDisplayOptions,
          }).displayOptions,
          discountMessagingMultiLanguageEnabled,
          ruleMessagesByLocale: discountMessagingMultiLanguageEnabled
            ? ruleMessagesByLocale
            : null,
          tierTextByRuleId:
            Object.keys(tierTextByRuleId).length > 0 ? tierTextByRuleId : null,
          tierTextByLocaleByRuleId:
            Object.keys(tierTextByLocaleByRuleId).length > 0
              ? tierTextByLocaleByRuleId
              : null,
        })}
      />
      <input
        type="hidden"
        name="stepConditions"
        value={JSON.stringify(conditionsState.stepConditions)}
      />
    </>
  );
}
