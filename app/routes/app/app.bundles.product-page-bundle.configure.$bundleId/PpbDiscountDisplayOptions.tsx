import { usePpbConfigureContext } from "./PpbConfigureContext";
import { PpbDiscountMessageRuleFields } from "./PpbDiscountMessageRuleFields";

export function PpbDiscountDisplayOptions() {
  const { displayOptionsInactive, productPageBundleStyles } =
    usePpbConfigureContext();

  return (
    <s-section>
      <div
        className={
          displayOptionsInactive
            ? productPageBundleStyles.displayOptionsInactive
            : undefined
        }
      >
        <s-stack direction="block" gap="small">
          <s-stack direction="block" gap="small-400">
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              Discount Display Options
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
              Choose how discounts are displayed
            </p>
          </s-stack>
          <PpbBundleQuantityOptions />
          <PpbProgressBarOptions />
          <PpbDiscountMessagingOptions />
        </s-stack>
      </div>
    </s-section>
  );
}

function PpbBundleQuantityOptions() {
  const {
    bundleQuantityOptionsEligible,
    DiscountMethod,
    markAsDirty,
    pricingState,
    productPageBundleStyles,
    qtyOptionsDefaultRuleId,
    qtyOptionsEnabled,
    qtyRuleLabels,
    qtyRuleSubtexts,
    QuestionHelpTooltip,
    setIsBundleQuantityMultiLangModalOpen,
    setQtyOptionsDefaultRuleId,
    setQtyOptionsEnabled,
    setQtyRuleLabels,
    setQtyRuleSubtexts,
    shopLocales,
  } = usePpbConfigureContext();

  if (pricingState.discountType === DiscountMethod.BUY_X_GET_Y) {
    return null;
  }

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
              Bundle Quantity Options
            </p>
            <p className={productPageBundleStyles.displayOptionDescription}>
              Configure this section to enable quantity options.
            </p>
          </div>
          <QuestionHelpTooltip tooltipKey="bundleQuantityOptions" />
          <s-switch
            checked={qtyOptionsEnabled || undefined}
            disabled={!bundleQuantityOptionsEligible || undefined}
            onChange={(e) => {
              setQtyOptionsEnabled((e.target as HTMLInputElement).checked);
              markAsDirty();
            }}
          />
        </s-stack>
        <s-button
          variant="secondary"
          icon="globe"
          disabled={!qtyOptionsEnabled || shopLocales.length === 0 || undefined}
          onClick={() => setIsBundleQuantityMultiLangModalOpen(true)}
        >
          Multi Language
        </s-button>
      </s-stack>
      <p className={productPageBundleStyles.optionNote}>
        <strong>Note:</strong> Bundle Quantity Options can only be enabled when
        discount rules are based on quantity.
      </p>
      {qtyOptionsEnabled && (
        <div className={productPageBundleStyles.nestedDisplayOptions}>
          <s-stack direction="block" gap="small">
            {pricingState.discountRules.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                Add quantity-based discount rules to configure bundle quantity
                options.
              </p>
            ) : (
              <s-stack direction="block" gap="small">
                {pricingState.discountRules.map((rule: any, index: number) => (
                  <div
                    key={rule.id}
                    className={productPageBundleStyles.discountRuleCard}
                  >
                    <s-stack direction="block" gap="small-100">
                      <s-stack
                        direction="inline"
                        gap="small"
                        alignItems="center"
                      >
                        <h5
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          Rule #{index + 1}
                        </h5>
                        <s-button
                          variant="tertiary"
                          accessibilityLabel="Make this rule default"
                          onClick={() => {
                            setQtyOptionsDefaultRuleId(rule.id);
                            markAsDirty();
                          }}
                        >
                          {rule.id === qtyOptionsDefaultRuleId
                            ? "\u2605"
                            : "\u2606"}
                          Make this rule default
                        </s-button>
                      </s-stack>
                      <s-stack direction="inline" gap="small">
                        <s-text-field
                          label="Box Label"
                          placeholder={`Box of ${rule.conditionValue ?? ""}`}
                          value={qtyRuleLabels[rule.id] ?? ""}
                          onInput={(e) => {
                            setQtyRuleLabels((prev) => ({
                              ...prev,
                              [rule.id]: (e.target as HTMLInputElement).value,
                            }));
                            markAsDirty();
                          }}
                          autocomplete="off"
                        />
                        <s-text-field
                          label="Box Subtext"
                          placeholder="e.g. 20% off"
                          value={qtyRuleSubtexts[rule.id] ?? ""}
                          onInput={(e) => {
                            setQtyRuleSubtexts((prev) => ({
                              ...prev,
                              [rule.id]: (e.target as HTMLInputElement).value,
                            }));
                            markAsDirty();
                          }}
                          autocomplete="off"
                        />
                      </s-stack>
                    </s-stack>
                  </div>
                ))}
              </s-stack>
            )}
          </s-stack>
        </div>
      )}
    </div>
  );
}

function PpbProgressBarOptions() {
  const {
    markAsDirty,
    pricingState,
    productPageBundleStyles,
    progressBarEnabled,
    progressBarType,
    QuestionHelpTooltip,
    setIsProgressBarMultiLangModalOpen,
    setProgressBarEnabled,
    setProgressBarType,
    setTierTextByRuleId,
    shopLocales,
    tierTextByRuleId,
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
              Progress Bar
            </p>
            <p className={productPageBundleStyles.displayOptionDescription}>
              Edit the progress bar content and settings.
            </p>
          </div>
          <QuestionHelpTooltip tooltipKey="discountProgressBar" />
          <s-switch
            checked={progressBarEnabled || undefined}
            onChange={(e) => {
              setProgressBarEnabled((e.target as HTMLInputElement).checked);
              markAsDirty();
            }}
          />
        </s-stack>
        <s-button
          variant="secondary"
          icon="globe"
          disabled={
            !progressBarEnabled ||
            progressBarType !== "step_based" ||
            shopLocales.length === 0 ||
            undefined
          }
          onClick={() => setIsProgressBarMultiLangModalOpen(true)}
        >
          Multi Language
        </s-button>
      </s-stack>
      {progressBarEnabled && (
        <div className={productPageBundleStyles.nestedDisplayOptions}>
          <s-stack direction="block" gap="small">
            <s-choice-list
              label="Progress bar type"
              labelAccessibilityVisibility="exclusive"
              values={[progressBarType]}
              onChange={(e) => {
                const value = (
                  (e.currentTarget as any).values as string[] | undefined
                )?.[0];
                if (value) setProgressBarType(value);
              }}
            >
              <s-choice value="simple">Simple Bar</s-choice>
              <s-choice value="step_based">Step-Based Bar</s-choice>
            </s-choice-list>
            {progressBarType === "step_based" ? (
              <PpbProgressTierTextFields
                setTierTextByRuleId={setTierTextByRuleId}
                tierTextByRuleId={tierTextByRuleId}
              />
            ) : null}
          </s-stack>
        </div>
      )}
    </div>
  );
}

function PpbProgressTierTextFields({
  setTierTextByRuleId,
  tierTextByRuleId,
}: {
  setTierTextByRuleId: (updater: any) => void;
  tierTextByRuleId: Record<string, { tierText: string; tierSubtext: string }>;
}) {
  const { markAsDirty, pricingState, productPageBundleStyles } =
    usePpbConfigureContext();

  if (pricingState.discountRules.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
        Add discount rules to configure tier text.
      </p>
    );
  }

  return (
    <s-stack direction="block" gap="small">
      {pricingState.discountRules.map((rule: any, index: number) => (
        <div key={rule.id} className={productPageBundleStyles.discountRuleCard}>
          <s-stack direction="block" gap="small-100">
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
              Rule #{index + 1}
            </p>
            <s-stack direction="inline" gap="small">
              <s-text-field
                label="Tier Text"
                value={tierTextByRuleId[rule.id]?.tierText ?? ""}
                onInput={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  setTierTextByRuleId((prev: typeof tierTextByRuleId) => ({
                    ...prev,
                    [rule.id]: {
                      tierText: value,
                      tierSubtext: prev[rule.id]?.tierSubtext ?? "",
                    },
                  }));
                  markAsDirty();
                }}
                autocomplete="off"
              />
              <s-text-field
                label="Tier Subtext"
                value={tierTextByRuleId[rule.id]?.tierSubtext ?? ""}
                onInput={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  setTierTextByRuleId((prev: typeof tierTextByRuleId) => ({
                    ...prev,
                    [rule.id]: {
                      tierText: prev[rule.id]?.tierText ?? "",
                      tierSubtext: value,
                    },
                  }));
                  markAsDirty();
                }}
                autocomplete="off"
              />
            </s-stack>
          </s-stack>
        </div>
      ))}
    </s-stack>
  );
}

function PpbDiscountMessagingOptions() {
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
