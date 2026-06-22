import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import type { IndividualSellingPlanShowFor } from "../configure-constants";

export function FpbSummaryTextSettings({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeTabIndex,
    bundle,
    DiscountMethod,
    INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE,
    individualSellingPlanEnabled,
    individualSellingPlanShowFor,
    markAsDirty,
    openMultiLanguageModal,
    pricingState,
    setIndividualSellingPlanEnabled,
    setIndividualSellingPlanShowFor,
    setShowTextOnPlusEnabled,
    setTextOverrides,
    SettingsRow,
    setVariantSelectorEnabled,
    showTextOnPlusEnabled,
    stepsState,
    textOverrides,
    variantSelectorEnabled,
  } = flow;
  const settingsStep = stepsState.steps[activeTabIndex] || stepsState.steps[0];
  const individualSellingPlanBlocked =
    pricingState.discountType === DiscountMethod.BUY_X_GET_Y;

  return (
    <>
      <s-section>
        <s-stack direction="block" gap="small">
          <SettingsRow
            title="Variant Selector"
            description="Enable variant selection within the product cards instead of the quick look"
            tooltipKey="variantSelector"
          >
            <s-switch
              accessibilityLabel="Variant selector"
              checked={variantSelectorEnabled || undefined}
              onChange={(e) => {
                const checked = (e.target as HTMLInputElement).checked;
                setVariantSelectorEnabled(checked);
                markAsDirty();
              }}
            />
          </SettingsRow>
          <SettingsRow
            title="Show Text on + Button"
            description="Replaces the + icon with a text button and moves it below the price."
            tooltipKey="showTextOnAddButton"
          >
            <s-switch
              accessibilityLabel="Show text on plus button"
              checked={showTextOnPlusEnabled || undefined}
              onChange={(e) => {
                const enabled = (e.target as HTMLInputElement).checked;
                setShowTextOnPlusEnabled(enabled);
                if (!enabled) {
                  setTextOverrides((prev) => ({
                    ...prev,
                    addToCartButton: "",
                  }));
                }
                markAsDirty();
              }}
            />
          </SettingsRow>
          {showTextOnPlusEnabled && (
            <s-stack direction="inline" gap="small" alignItems="end">
              <s-text-field
                label="Button text"
                value={textOverrides.addToCartButton ?? ""}
                placeholder="Add to Cart"
                autocomplete="off"
                onInput={(e) => {
                  setTextOverrides((prev) => ({
                    ...prev,
                    addToCartButton: (e.target as HTMLInputElement).value,
                  }));
                  markAsDirty();
                }}
              />
              <s-button
                variant="secondary"
                icon="globe"
                onClick={() =>
                  openMultiLanguageModal("Add Button Text", [
                    {
                      key: "addToCartButton",
                      label: "Button text",
                      fallback: textOverrides.addToCartButton ?? "Add to Cart",
                    },
                  ])
                }
              >
                Multi Language
              </s-button>
            </s-stack>
          )}
          {individualSellingPlanBlocked && (
            <s-banner tone="warning">
              {INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE}
            </s-banner>
          )}
          <SettingsRow
            title="Pre-order &amp; Subscription Integration"
            description="Let customers select a unique selling plan (subscription, pre-order, etc.) for each product in the bundle."
          >
            <s-switch
              accessibilityLabel="Enable pre-order and subscription integration"
              checked={
                (!individualSellingPlanBlocked &&
                  individualSellingPlanEnabled) ||
                undefined
              }
              disabled={individualSellingPlanBlocked || undefined}
              onChange={(e) => {
                setIndividualSellingPlanEnabled(
                  (e.target as HTMLInputElement).checked,
                );
                markAsDirty();
              }}
            />
          </SettingsRow>
          {!individualSellingPlanBlocked && individualSellingPlanEnabled && (
            <s-stack direction="block" gap="small-200">
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#202223",
                }}
              >
                Apply to products
              </p>
              {(
                [
                  {
                    value: "ALL_PRODUCTS",
                    label: "Show for all products",
                    description:
                      "Display selling plan options on every product in the bundle.",
                  },
                  {
                    value: "OOS_PRODUCTS",
                    label: "Show only for out of stock products",
                    description:
                      "Display selling plan options only when a product is out of stock (e.g. for pre-orders).",
                  },
                ] as {
                  value: IndividualSellingPlanShowFor;
                  label: string;
                  description: string;
                }[]
              ).map(({ value, label, description }) => (
                <label
                  key={value}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="individualSellingPlanShowFor"
                    value={value}
                    checked={individualSellingPlanShowFor === value}
                    onChange={() => {
                      setIndividualSellingPlanShowFor(value);
                      markAsDirty();
                    }}
                    style={{ marginTop: 3, flexShrink: 0 }}
                  />
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#202223",
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ fontSize: 12, color: "#6d7175" }}>
                      {description}
                    </span>
                  </span>
                </label>
              ))}
            </s-stack>
          )}
        </s-stack>
      </s-section>
      {/* Bundle Cart */}
    </>
  );
}
