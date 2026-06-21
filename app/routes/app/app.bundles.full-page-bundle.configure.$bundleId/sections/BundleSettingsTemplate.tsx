import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbBundleTemplateSettings({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeTabIndex,
    bundle,
    DiscountMethod,
    handleSectionChange,
    markAsDirty,
    pricingState,
    QuestionHelpTooltip,
    setTextOverrides,
    stepsState,
    textOverrides,
  } = flow;
  const settingsStep = stepsState.steps[activeTabIndex] || stepsState.steps[0];
  const individualSellingPlanBlocked =
    pricingState.discountType === DiscountMethod.BUY_X_GET_Y;

  return (
    <>
      <s-section>
        <s-stack direction="block" gap="small">
          <s-stack direction="inline" alignItems="center" gap="small">
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                flex: 1,
              }}
            >
              Cart line item discount display
            </p>
            <QuestionHelpTooltip tooltipKey="cartLineItemDiscountDisplay" />
            <s-button
              variant="secondary"
              onClick={() => handleSectionChange("discount_pricing")}
            >
              Edit Defaults
            </s-button>
          </s-stack>
          <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
            Shows how much the customer is saving on the bundle in cart
          </p>
          {[
            {
              value: "defaults",
              label: "Use app defaults",
              description:
                "Uses the discount format and label configured in your app settings.",
            },
            {
              value: "custom",
              label: "Customize for this bundle",
              description:
                "Set a different discount format or label for this bundle only.",
            },
          ].map(({ value, label, description }) => (
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
                name="cartDiscountDisplay"
                value={value}
                checked={
                  (textOverrides.cartDiscountDisplay ?? "defaults") === value
                }
                onChange={() => {
                  setTextOverrides((prev) => ({
                    ...prev,
                    cartDiscountDisplay: value,
                  }));
                  markAsDirty();
                }}
                style={{ marginTop: 3 }}
              />
              <span>
                <span style={{ display: "block", fontSize: 14 }}>{label}</span>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: "#6d7175",
                  }}
                >
                  {description}
                </span>
              </span>
            </label>
          ))}
        </s-stack>
      </s-section>
      {/* Bundle Banner — 2-column side-by-side layout */}
    </>
  );
}
