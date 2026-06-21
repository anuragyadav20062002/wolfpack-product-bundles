import { usePpbConfigureContext } from "./PpbConfigureContext";

const CART_DISCOUNT_DISPLAY_OPTIONS = [
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
];

export function PpbCartDiscountDisplaySettings() {
  const {
    markAsDirty,
    PRODUCT_PAGE_EDIT_DEFAULTS_HREF,
    QuestionHelpTooltip,
    setTextOverrides,
    textOverrides,
  } = usePpbConfigureContext();

  return (
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
            Cart line item discount display
          </h3>
          <QuestionHelpTooltip tooltipKey="cartLineItemDiscountDisplay" />
          <button
            type="button"
            onClick={() => {
              const authSearch = window.location.search.replace(/^\?/, "");
              const targetHref = authSearch
                ? `${PRODUCT_PAGE_EDIT_DEFAULTS_HREF}&${authSearch}`
                : PRODUCT_PAGE_EDIT_DEFAULTS_HREF;
              window.location.assign(targetHref);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 32,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid #c9cccf",
              color: "#202223",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            Edit Defaults
          </button>
        </s-stack>
        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
          Shows how much the customer is saving on the bundle in cart
        </p>
        {CART_DISCOUNT_DISPLAY_OPTIONS.map(({ value, label, description }) => (
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
              checked={(textOverrides.cartDiscountDisplay ?? "defaults") === value}
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
  );
}
