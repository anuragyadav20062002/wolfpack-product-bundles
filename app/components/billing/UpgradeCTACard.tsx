import { PLANS } from "../../constants/plans";
import { useTranslation } from "react-i18next";

export interface UpgradeCTACardProps {
  onUpgrade: () => void;
}

export function UpgradeCTACard({ onUpgrade }: UpgradeCTACardProps) {
  const { t } = useTranslation();
  const highlights = [
    t("billing.cta.highlights.bundles"),
    t("billing.cta.highlights.design"),
    t("billing.cta.highlights.support"),
  ];

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
              <s-icon type="check" />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {t("billing.cta.heading")}
            </h3>
          </s-stack>

          <p style={{ margin: 0, fontSize: 14 }}>
            {t("billing.cta.body")}
          </p>

          <s-stack direction="inline" gap="small-100">
            {highlights.map((label) => (
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
              {t("billing.cta.upgrade", { price: PLANS.grow.price })}
            </s-button>
            <span style={{ fontSize: 12, color: "#6d7175" }}>{t("billing.cta.cancelAnytime")}</span>
          </s-stack>
        </s-stack>
      </div>
    </s-section>
  );
}
