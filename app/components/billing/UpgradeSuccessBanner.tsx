export interface UpgradeSuccessBannerProps {
  showCelebration: boolean;
  onDismiss: () => void;
}

export function UpgradeSuccessBanner({
  showCelebration,
  onDismiss,
}: UpgradeSuccessBannerProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #008060 0%, #00a47c 100%)",
        borderRadius: "12px",
        padding: "24px",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {showCelebration && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            background: `
              radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 2px, transparent 2px),
              radial-gradient(circle at 40% 70%, rgba(255,255,255,0.15) 3px, transparent 3px),
              radial-gradient(circle at 60% 20%, rgba(255,255,255,0.1) 2px, transparent 2px),
              radial-gradient(circle at 80% 50%, rgba(255,255,255,0.12) 2px, transparent 2px)
            `,
          }}
        />
      )}

      <s-stack direction="block" gap="small">
        <s-stack direction="inline" alignItems="center" gap="small">
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "50%",
              padding: "8px",
              display: "flex",
            }}
          >
            <s-icon name="check-circle" />
          </div>
          <s-stack direction="block" gap="small-400">
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "white" }}>
              Welcome to the Grow Plan! 🎉
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
              Your subscription has been activated. You now have access to all premium features.
            </p>
          </s-stack>
        </s-stack>

        <s-stack direction="inline" gap="base">
          {[
            { label: "Bundle Limit", value: "20 bundles" },
            { label: "Design Control", value: "Full Access" },
            { label: "Support", value: "Priority" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: "8px",
                padding: "12px 16px",
                flex: 1,
              }}
            >
              <s-stack direction="block" gap="small-400">
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{value}</span>
              </s-stack>
            </div>
          ))}
        </s-stack>

        <s-button variant="tertiary" onClick={onDismiss}>
          Dismiss
        </s-button>
      </s-stack>
    </div>
  );
}
