import { VALUE_PROPS, type ValueProp } from "../../constants/pricing-data";
import valuePropStyles from "../../styles/billing/value-props.module.css";

export interface ValuePropsSectionProps {
  valueProps?: ValueProp[];
}

export function ValuePropsSection({
  valueProps = VALUE_PROPS,
}: ValuePropsSectionProps) {
  return (
    <s-section>
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" alignItems="center" gap="small-100">
          <div style={{ color: "#ffc453" }}>
            <s-icon name="star-filled" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Why Upgrade to Grow?</h3>
        </s-stack>
        <div className={valuePropStyles.grid}>
          {valueProps.map((prop, index) => (
            <div
              key={index}
              style={{
                padding: "1rem",
                backgroundColor: "#f6f6f7",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <s-stack direction="block" gap="small-100">
                <span style={{ fontSize: 28 }}>{prop.icon}</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{prop.title}</h4>
                <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>{prop.description}</p>
              </s-stack>
            </div>
          ))}
        </div>
      </s-stack>
    </s-section>
  );
}
