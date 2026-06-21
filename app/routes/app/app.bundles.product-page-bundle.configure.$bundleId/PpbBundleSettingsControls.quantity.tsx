import { usePpbConfigureContext } from "./PpbConfigureContext";
import type { IndividualSellingPlanShowFor } from "./usePpbBundleSettingsState";

const SELLING_PLAN_OPTIONS: {
  value: IndividualSellingPlanShowFor;
  label: string;
  description: string;
}[] = [
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
];

export function PpbQuantityAndSellingPlanSettings() {
  const {
    DiscountMethod,
    INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE,
    individualSellingPlanEnabled,
    individualSellingPlanShowFor,
    markAsDirty,
    maxQtyPerProduct,
    pricingState,
    productPageBundleStyles,
    quantityValidationEnabled,
    QuestionHelpTooltip,
    setIndividualSellingPlanEnabled,
    setIndividualSellingPlanShowFor,
    setMaxQtyPerProduct,
    setQuantityValidationEnabled,
    setVariantSelectorEnabled,
    variantSelectorEnabled,
  } = usePpbConfigureContext();

  const individualSellingPlanBlocked =
    pricingState.discountType === DiscountMethod.BUY_X_GET_Y;

  return (
    <s-section>
      <s-stack direction="block" gap="small">
        <div className={productPageBundleStyles.settingTitleRow}>
          <h3 className={productPageBundleStyles.settingTitle}>
            Enable Quantity Validation
          </h3>
          <span className={productPageBundleStyles.settingInlineSwitch}>
            <s-switch
              accessibilityLabel="Enable quantity validation"
              checked={quantityValidationEnabled || undefined}
              onChange={(e) => {
                setQuantityValidationEnabled(
                  (e.target as HTMLInputElement).checked,
                );
                markAsDirty();
              }}
            />
          </span>
        </div>
        <s-number-field
          label="Maximum allowed quantity per product"
          min={1}
          value={maxQtyPerProduct || "1"}
          disabled={!quantityValidationEnabled}
          onInput={(e) => {
            setMaxQtyPerProduct((e.target as HTMLInputElement).value);
            markAsDirty();
          }}
          autocomplete="off"
        />
        <s-banner tone="info">
          Bundles with 3+ products see 24% higher conversion rates when search
          filters are enabled.
        </s-banner>
        {individualSellingPlanBlocked && (
          <s-banner tone="warning">
            {INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE}
          </s-banner>
        )}
        <div className={productPageBundleStyles.settingTitleRow}>
          <h3
            className={`${productPageBundleStyles.settingTitle} ${
              individualSellingPlanBlocked
                ? productPageBundleStyles.settingTitleMuted
                : ""
            }`}
          >
            Pre-order &amp; Subscription Integration
          </h3>
          <span className={productPageBundleStyles.settingInlineSwitch}>
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
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#8c9196" }}>
          Let customers select a unique selling plan (subscription, pre-order,
          etc.) for each product in the bundle.
        </p>
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
            {SELLING_PLAN_OPTIONS.map(({ value, label, description }) => (
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
        <div className={productPageBundleStyles.settingTitleRow}>
          <div>
            <h3 className={productPageBundleStyles.settingTitle}>
              Variant Selector
              <QuestionHelpTooltip tooltipKey="variantSelector" />
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
              Enable variant selection within the product cards instead of the
              quick look
            </p>
          </div>
          <span className={productPageBundleStyles.settingInlineSwitch}>
            <s-switch
              accessibilityLabel="Variant selector"
              checked={variantSelectorEnabled || undefined}
              onChange={(e) => {
                setVariantSelectorEnabled(
                  (e.target as HTMLInputElement).checked,
                );
                markAsDirty();
              }}
            />
          </span>
        </div>
      </s-stack>
    </s-section>
  );
}
