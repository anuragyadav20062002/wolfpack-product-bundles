import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbDiscountMessagingOptions({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeDiscountLocale,
    discountMessagingMultiLanguageEnabled,
    DiscountMethod,
    fullPageBundleStyles,
    getDefaultDiscountRuleSuccessMessage,
    getDefaultDiscountRuleText,
    globalSuccessMessage,
    markAsDirty,
    normalizedRuleMessages,
    pricingState,
    QuestionHelpTooltip,
    ruleMessagesByLocale,
    setActiveDiscountLocale,
    setDiscountMessagingMultiLanguageEnabled,
    setGlobalSuccessMessage,
    setIsDiscountVariablesModalOpen,
    setRuleMessagesByLocale,
    setSuccessMessageByLocale,
    shopLocales,
    successMessageByLocale,
    updateRuleMessage,
  } = flow;

  return (
    <>
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
                Discount Messaging
              </p>
              <p className={fullPageBundleStyles.displayOptionDescription}>
                Edit how discount messages appear above the subtotal.
              </p>
            </div>
            <QuestionHelpTooltip tooltipKey="discountMessaging" />
            <s-switch
              checked={pricingState.discountMessagingEnabled || undefined}
              onChange={(e) =>
                pricingState.setDiscountMessagingEnabled(
                  (e.target as HTMLInputElement).checked,
                )
              }
            />
          </s-stack>
          {shopLocales.length > 0 && (
            <s-checkbox
              label="Enable multi-language"
              checked={discountMessagingMultiLanguageEnabled || undefined}
              disabled={!pricingState.discountMessagingEnabled || undefined}
              onChange={(e) => {
                setDiscountMessagingMultiLanguageEnabled(
                  (e.target as HTMLInputElement).checked,
                );
                markAsDirty();
              }}
            />
          )}
        </s-stack>
        {pricingState.discountType === DiscountMethod.BUY_X_GET_Y && (
          <s-banner tone="info">
            Discount messaging displays the Total Quantity to Claim Offer (Buy +
            Get) to ensure customers add their rewards to the cart
          </s-banner>
        )}
        {pricingState.discountMessagingEnabled && (
          <div className={fullPageBundleStyles.nestedDisplayOptions}>
            <s-stack direction="block" gap="small">
              {discountMessagingMultiLanguageEnabled &&
                shopLocales.length > 0 && (
                  <s-stack direction="block" gap="small-100">
                    <s-select
                      label="Language"
                      value={activeDiscountLocale}
                      onChange={(e) => {
                        const locale = (e.target as HTMLSelectElement).value;
                        setActiveDiscountLocale(locale);
                        const primaryLocale =
                          shopLocales.find((l: any) => l.primary)?.locale ??
                          "en";
                        if (
                          locale !== primaryLocale &&
                          !ruleMessagesByLocale[locale]
                        ) {
                          setRuleMessagesByLocale((prev) => ({
                            ...prev,
                            [locale]: normalizedRuleMessages,
                          }));
                          markAsDirty();
                        }
                      }}
                    >
                      {shopLocales.map(
                        (loc: {
                          locale: string;
                          name: string;
                          primary: boolean;
                        }) => (
                          <s-option key={loc.locale} value={loc.locale}>
                            {loc.name}
                            {loc.primary ? " (default)" : ""}
                          </s-option>
                        ),
                      )}
                    </s-select>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      Active languages
                    </p>
                    <s-stack direction="inline" gap="small-100">
                      {shopLocales
                        .filter((l: any) => l.primary)
                        .map((l: any) => (
                          <s-chip key={l.locale}>{l.name}</s-chip>
                        ))}
                      {Object.keys(ruleMessagesByLocale)
                        .filter(
                          (locale) =>
                            !shopLocales.find(
                              (l: any) => l.locale === locale && l.primary,
                            ),
                        )
                        .map((locale) => {
                          const locName =
                            shopLocales.find((l: any) => l.locale === locale)
                              ?.name ?? locale;
                          return <s-chip key={locale}>{locName}</s-chip>;
                        })}
                    </s-stack>
                  </s-stack>
                )}
              <div style={{ textAlign: "right" }}>
                <s-button
                  variant="tertiary"
                  onClick={() => setIsDiscountVariablesModalOpen(true)}
                >
                  Show Variables
                </s-button>
              </div>
              {pricingState.discountRules.length > 0 ? (
                <s-stack direction="block" gap="small">
                  {pricingState.discountRules.map(
                    (rule: any, index: number) => {
                      const localeMessages =
                        discountMessagingMultiLanguageEnabled
                          ? (ruleMessagesByLocale[activeDiscountLocale]?.[
                              rule.id
                            ] ?? normalizedRuleMessages[rule.id])
                          : normalizedRuleMessages[rule.id];
                      const defaultDiscountText = getDefaultDiscountRuleText(
                        pricingState.discountType,
                        index,
                      );
                      return (
                        <div
                          key={rule.id}
                          className={fullPageBundleStyles.discountRuleCard}
                        >
                          <s-stack direction="block" gap="small">
                            <h5
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              Rule #{index + 1}
                            </h5>
                            <s-text-field
                              label="Discount Text"
                              value={
                                localeMessages?.discountText ||
                                defaultDiscountText
                              }
                              onInput={(e) => {
                                const val = (e.target as HTMLInputElement)
                                  .value;
                                if (discountMessagingMultiLanguageEnabled) {
                                  setRuleMessagesByLocale((prev) => ({
                                    ...prev,
                                    [activeDiscountLocale]: {
                                      ...(prev[activeDiscountLocale] || {}),
                                      [rule.id]: {
                                        ...(prev[activeDiscountLocale]?.[
                                          rule.id
                                        ] || {}),
                                        discountText: val,
                                      },
                                    },
                                  }));
                                  markAsDirty();
                                } else {
                                  updateRuleMessage(
                                    rule.id,
                                    "discountText",
                                    val,
                                  );
                                }
                              }}
                              autocomplete="off"
                            />
                          </s-stack>
                        </div>
                      );
                    },
                  )}
                  <s-section>
                    <s-stack direction="block" gap="small">
                      <s-text-field
                        label="Success Message"
                        value={(() => {
                          const defaultMsg =
                            getDefaultDiscountRuleSuccessMessage(
                              pricingState.discountType,
                            );
                          const val = discountMessagingMultiLanguageEnabled
                            ? (successMessageByLocale[activeDiscountLocale] ??
                              globalSuccessMessage)
                            : globalSuccessMessage;
                          return val || defaultMsg;
                        })()}
                        onInput={(e) => {
                          const val = (e.target as HTMLInputElement).value;
                          if (discountMessagingMultiLanguageEnabled) {
                            setSuccessMessageByLocale((prev) => ({
                              ...prev,
                              [activeDiscountLocale]: val,
                            }));
                          } else {
                            setGlobalSuccessMessage(val);
                          }
                          markAsDirty();
                        }}
                        autocomplete="off"
                      />
                    </s-stack>
                  </s-section>
                </s-stack>
              ) : (
                <s-section>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#6d7175",
                      textAlign: "center",
                    }}
                  >
                    Add discount rules to configure messaging.
                  </p>
                </s-section>
              )}
            </s-stack>
          </div>
        )}
      </div>
    </>
  );
}
