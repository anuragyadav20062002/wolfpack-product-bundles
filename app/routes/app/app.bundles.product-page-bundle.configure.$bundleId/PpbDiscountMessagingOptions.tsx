import { usePpbConfigureContext } from "./PpbConfigureContext";
import { PpbDiscountMessageRuleFields } from "./PpbDiscountMessageRuleFields";

export function PpbDiscountMessagingOptions() {
  const {
    DiscountMethod,
    discountMessagingMultiLanguageEnabled,
    markAsDirty,
    pricingState,
    productPageBundleStyles,
    QuestionHelpTooltip,
    ruleMessages,
    ruleMessagesByLocale,
    setActiveDiscountLocale,
    setDiscountMessagingMultiLanguageEnabled,
    setIsDiscountVariablesModalOpen,
    setRuleMessagesByLocale,
    shopLocales,
    activeDiscountLocale,
  } = usePpbConfigureContext();

  return (
    <div className={productPageBundleStyles.displayOptionRow}>
      <s-stack
        direction="inline"
        gap="small"
        alignItems="center"
        justifyContent="space-between"
      >
        <s-stack direction="inline" gap="small" alignItems="center">
          <div className={productPageBundleStyles.displayOptionText}>
            <p className={productPageBundleStyles.displayOptionTitle}>
              Discount Messaging
            </p>
            <p className={productPageBundleStyles.displayOptionDescription}>
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
        <div className={productPageBundleStyles.nestedDisplayOptions}>
          <s-stack direction="block" gap="small">
            {discountMessagingMultiLanguageEnabled &&
              shopLocales.length > 0 && (
                <PpbDiscountLanguageSelector
                  activeDiscountLocale={activeDiscountLocale}
                  markAsDirty={markAsDirty}
                  ruleMessages={ruleMessages}
                  ruleMessagesByLocale={ruleMessagesByLocale}
                  setActiveDiscountLocale={setActiveDiscountLocale}
                  setRuleMessagesByLocale={setRuleMessagesByLocale}
                  shopLocales={shopLocales}
                />
              )}
            <div style={{ textAlign: "right" }}>
              <s-button
                variant="tertiary"
                onClick={() => setIsDiscountVariablesModalOpen(true)}
              >
                Show Variables
              </s-button>
            </div>
            <PpbDiscountMessageRuleFields />
          </s-stack>
        </div>
      )}
    </div>
  );
}

function PpbDiscountLanguageSelector({
  activeDiscountLocale,
  markAsDirty,
  ruleMessages,
  ruleMessagesByLocale,
  setActiveDiscountLocale,
  setRuleMessagesByLocale,
  shopLocales,
}: {
  activeDiscountLocale: string;
  markAsDirty: () => void;
  ruleMessages: Record<string, any>;
  ruleMessagesByLocale: Record<string, Record<string, any>>;
  setActiveDiscountLocale: (locale: string) => void;
  setRuleMessagesByLocale: (updater: any) => void;
  shopLocales: Array<{ locale: string; name: string; primary: boolean }>;
}) {
  return (
    <s-stack direction="block" gap="small-100">
      <s-select
        label="Language"
        value={activeDiscountLocale}
        onChange={(e) => {
          const locale = (e.target as HTMLSelectElement).value;
          setActiveDiscountLocale(locale);
          const primaryLocale =
            shopLocales.find((localeOption) => localeOption.primary)?.locale ??
            "en";
          if (locale !== primaryLocale && !ruleMessagesByLocale[locale]) {
            setRuleMessagesByLocale((prev: typeof ruleMessagesByLocale) => ({
              ...prev,
              [locale]: ruleMessages,
            }));
            markAsDirty();
          }
        }}
      >
        {shopLocales.map((localeOption) => (
          <s-option key={localeOption.locale} value={localeOption.locale}>
            {localeOption.name}
            {localeOption.primary ? " (default)" : ""}
          </s-option>
        ))}
      </s-select>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
        Active languages
      </p>
      <s-stack direction="inline" gap="small-100">
        {shopLocales
          .filter((localeOption) => localeOption.primary)
          .map((localeOption) => (
            <s-chip key={localeOption.locale}>{localeOption.name}</s-chip>
          ))}
        {Object.keys(ruleMessagesByLocale)
          .filter(
            (locale) =>
              !shopLocales.find(
                (localeOption) =>
                  localeOption.locale === locale && localeOption.primary,
              ),
          )
          .map((locale) => {
            const localeName =
              shopLocales.find((localeOption) => localeOption.locale === locale)
                ?.name ?? locale;
            return <s-chip key={locale}>{localeName}</s-chip>;
          })}
      </s-stack>
    </s-stack>
  );
}
