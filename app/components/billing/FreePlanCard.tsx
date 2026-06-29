import { PLANS } from "../../constants/plans";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface FreePlanCardProps {
  isCurrentPlan: boolean;
}

export function FreePlanCard({ isCurrentPlan }: FreePlanCardProps) {
  const { t } = useTranslation();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <s-section>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <s-stack direction="block" gap="large">
          <s-stack direction="block" gap="small-100">
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{PLANS.free.name}</h3>
              {isCurrentPlan && <s-badge tone="success">{t("billing.cards.currentPlan")}</s-badge>}
            </s-stack>
            <s-stack direction="inline" alignItems="baseline" gap="small-400">
              <span style={{ fontSize: 28, fontWeight: 700 }}>{t("billing.cards.freePrice")}</span>
            </s-stack>
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
              {t("billing.cards.freeDescription")}
            </p>
          </s-stack>

          <s-divider />

          <s-stack direction="block" gap="small">
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{t("billing.cards.includes")}</p>
            <s-stack direction="block" gap="small-100">
              {PLANS.free.features.map((feature, index) => (
                <s-stack key={index} direction="inline" alignItems="center" gap="small-100">
                  <div style={{ color: "#008060" }}>
                    <s-icon type="check" />
                  </div>
                  <span style={{ fontSize: 14 }}>{feature}</span>
                </s-stack>
              ))}
            </s-stack>
          </s-stack>
        </s-stack>

        <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
          <s-button
            variant={isCurrentPlan ? "secondary" : "primary"}
            disabled={isHydrated || undefined}
            inlineSize="fill"
          >
              {isCurrentPlan ? t("billing.cards.currentPlan") : t("billing.cards.freePlan")}
          </s-button>
        </div>
      </div>
    </s-section>
  );
}
