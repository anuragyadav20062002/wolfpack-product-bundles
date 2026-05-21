import { PLANS } from "../../constants/plans";

export interface UpgradeCTACardProps {
  onUpgrade: () => void;
}

export function UpgradeCTACard({ onUpgrade }: UpgradeCTACardProps) {
  return (
    <s-section>
      <div
        style={{
          background: "linear-gradient(135deg, #f6f6f7 0%, #ebeced 100%)",
          borderRadius: "8px",
          padding: "20px",
          margin: "-16px",
        }}
      >
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" alignItems="center" gap="small-100">
            <div
              style={{
                backgroundColor: "#ffc96b",
                borderRadius: "50%",
                padding: "8px",
                display: "flex",
              }}
            >
              <s-icon name="star-filled" />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Ready to grow your bundle business?
            </h3>
          </s-stack>

          <p style={{ margin: 0, fontSize: 14 }}>
            Upgrade to the Grow plan for double the bundles, full design customization, and
            priority support.
          </p>

          <s-stack direction="inline" gap="small-100">
            {["20 bundles", "Design Control Panel", "Priority Support"].map((label) => (
              <div
                key={label}
                style={{ backgroundColor: "white", borderRadius: "6px", padding: "8px 12px" }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </s-stack>

          <s-stack direction="inline" justifyContent="space-between" alignItems="center">
            <s-button variant="primary" onClick={onUpgrade}>
              {`Upgrade to Grow - $${PLANS.grow.price}/month`}
            </s-button>
            <span style={{ fontSize: 12, color: "#6d7175" }}>Cancel anytime</span>
          </s-stack>
        </s-stack>
      </div>
    </s-section>
  );
}
