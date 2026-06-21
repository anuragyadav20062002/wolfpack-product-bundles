import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbQuantitySettings({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeTabIndex,
    DiscountMethod,
    FilePicker,
    markAsDirty,
    maxQtyPerProduct,
    pricingState,
    productSlotIconUrl,
    productSlotsEnabled,
    quantityValidationEnabled,
    QuestionHelpTooltip,
    setMaxQtyPerProduct,
    setProductSlotIconUrl,
    setProductSlotsEnabled,
    setQuantityValidationEnabled,
    setShowSlotIconPicker,
    showSlotIconPicker,
    stepsState,
  } = flow;
  const settingsStep = stepsState.steps[activeTabIndex] || stepsState.steps[0];
  const individualSellingPlanBlocked =
    pricingState.discountType === DiscountMethod.BUY_X_GET_Y;

  return (
    <>
      <s-section>
        <s-stack direction="block" gap="small">
          <s-stack direction="inline" alignItems="center" gap="small">
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                flex: 1,
              }}
            >
              Enable Quantity Validation
            </h3>
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
          </s-stack>
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
          {/* Product Slots sub-section */}
          {settingsStep && (
            <s-stack direction="block" gap="small-400">
              <s-stack direction="inline" alignItems="center" gap="small">
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  Product Slots
                  <QuestionHelpTooltip tooltipKey="productSlots" />
                </p>
                <s-switch
                  accessibilityLabel="Enable product slots display"
                  checked={productSlotsEnabled || undefined}
                  onChange={(e) => {
                    setProductSlotsEnabled(
                      (e.target as HTMLInputElement).checked,
                    );
                    markAsDirty();
                  }}
                />
              </s-stack>
              <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                This feature displays empty slots on the storefront.
              </p>
            </s-stack>
          )}
          {/* Slot Icon — nested inside EQV section */}
          <s-stack direction="block" gap="small-400">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 84px",
                  width: 84,
                  height: 84,
                  border: "1px solid #dfe3e8",
                  borderRadius: 6,
                  background: "#fff",
                  overflow: "hidden",
                }}
              >
                {productSlotIconUrl ? (
                  <img
                    src={productSlotIconUrl}
                    alt=""
                    style={{
                      display: "block",
                      width: 56,
                      height: 56,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      color: "#777",
                      fontSize: 34,
                      fontWeight: 300,
                      lineHeight: 1,
                    }}
                  >
                    +
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 650,
                    lineHeight: "20px",
                  }}
                >
                  Slot Icon
                </h3>
                <p
                  style={{
                    margin: "2px 0 10px",
                    fontSize: 13,
                    lineHeight: "18px",
                    color: "#303030",
                  }}
                >
                  You can change the default icon that renders in the empty
                  slots
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <s-button
                    variant="secondary"
                    onClick={() => setShowSlotIconPicker(true)}
                  >
                    Change Icon
                  </s-button>
                  <button
                    type="button"
                    onClick={() => {
                      setProductSlotIconUrl("");
                      markAsDirty();
                    }}
                    style={{
                      appearance: "none",
                      border: 0,
                      padding: 0,
                      background: "transparent",
                      color: "#005bd3",
                      font: "inherit",
                      fontSize: 13,
                      lineHeight: "20px",
                      cursor: "pointer",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
            {showSlotIconPicker && (
              <FilePicker
                autoOpen
                onClose={() => setShowSlotIconPicker(false)}
                value={productSlotIconUrl || null}
                onChange={(url: string | null) => {
                  setProductSlotIconUrl(url ?? "");
                  setShowSlotIconPicker(false);
                  markAsDirty();
                }}
                label="Slot Icon"
                uploadLabel="No file chosen"
              />
            )}
            <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
              Note: Only applicable when rules are based on quantity
            </p>
          </s-stack>
        </s-stack>
      </s-section>
      {/* Variant Selector + Show Text on + Button */}
    </>
  );
}
