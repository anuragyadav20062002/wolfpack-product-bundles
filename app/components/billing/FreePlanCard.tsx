import { PLANS } from "../../constants/plans";

export interface FreePlanCardProps {
  isCurrentPlan: boolean;
}

export function FreePlanCard({ isCurrentPlan }: FreePlanCardProps) {
  return (
    <s-section>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <s-stack direction="block" gap="loose">
          <s-stack direction="block" gap="small-100">
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{PLANS.free.name}</h3>
              {isCurrentPlan && <s-badge tone="success">Current Plan</s-badge>}
            </s-stack>
            <s-stack direction="inline" alignItems="baseline" gap="small-400">
              <span style={{ fontSize: 28, fontWeight: 700 }}>Free</span>
            </s-stack>
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
              For bundle sales up to $500/month — free until you grow
            </p>
          </s-stack>

          <s-divider />

          <s-stack direction="block" gap="small">
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Includes:</p>
            <s-stack direction="block" gap="small-100">
              {PLANS.free.features.map((feature, index) => (
                <s-stack key={index} direction="inline" alignItems="center" gap="small-100">
                  <div style={{ color: "#008060" }}>
                    <s-icon name="check-minor" />
                  </div>
                  <span style={{ fontSize: 14 }}>{feature}</span>
                </s-stack>
              ))}
            </s-stack>
          </s-stack>
        </s-stack>

        <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
          <s-button variant={isCurrentPlan ? "secondary" : "primary"} disabled inlineSize="100%">
            {isCurrentPlan ? "Current Plan" : "Free Plan"}
          </s-button>
        </div>
      </div>
    </s-section>
  );
}
