import { PLANS } from "../../constants/plans";
import { useTranslation } from "react-i18next";

export interface GrowPlanCardProps {
  isCurrentPlan: boolean;
  isUpgrading: boolean;
  onSelectPlan: () => void;
}

export function GrowPlanCard({
  isCurrentPlan,
  isUpgrading,
  onSelectPlan,
}: GrowPlanCardProps) {
  const { t } = useTranslation();

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          backgroundColor: "#ffc96b",
          color: "#3d3d3d",
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <span style={{ fontSize: "14px" }}>⭐</span>
        <span>{t("billing.cards.mostPopular")}</span>
      </div>

      <s-section>
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            border: isCurrentPlan ? "none" : "2px solid #005bd3",
            borderRadius: "12px",
            margin: "-16px",
            padding: "16px",
          }}
        >
          <s-stack direction="block" gap="large">
            <s-stack direction="block" gap="small-100">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{PLANS.grow.name}</h3>
                {isCurrentPlan && <s-badge tone="success">{t("billing.cards.currentPlan")}</s-badge>}
              </s-stack>
              <s-stack direction="inline" alignItems="baseline" gap="small-400">
                <span style={{ fontSize: 28, fontWeight: 700 }}>${PLANS.grow.price}</span>
                <span style={{ fontSize: 16, color: "#6d7175" }}>{t("billing.cards.perMonth")}</span>
              </s-stack>
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                {t("billing.cards.growDescription")}
              </p>
            </s-stack>

            <s-divider />

            <s-stack direction="block" gap="small">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{t("billing.cards.growIncludes")}</p>
              <s-stack direction="block" gap="small-100">
                {PLANS.grow.features.map((feature, index) => (
                  <s-stack key={index} direction="inline" alignItems="center" gap="small-100">
                    <div style={{ color: "#008060" }}>
                      <s-icon type="check" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: index < 4 ? 600 : 400 }}>
                      {feature}
                    </span>
                  </s-stack>
                ))}
              </s-stack>
            </s-stack>
          </s-stack>

          <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
            <s-button
              variant="primary"
              disabled={isCurrentPlan || undefined}
              loading={isUpgrading || undefined}
              onClick={onSelectPlan}
              inlineSize="fill"
            >
              {isCurrentPlan ? t("billing.cards.currentPlan") : t("billing.cards.upgradeToGrow")}
            </s-button>
            {!isCurrentPlan && (
              <p style={{ textAlign: "center", marginTop: "0.5rem", fontSize: 12, color: "#6d7175" }}>
                {t("billing.cards.cancelAnytimeBilled")}
              </p>
            )}
          </div>
        </div>
      </s-section>
    </div>
  );
}
