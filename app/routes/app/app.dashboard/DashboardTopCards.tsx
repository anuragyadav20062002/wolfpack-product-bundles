import { useTranslation } from "react-i18next";
import { OptimisedImage } from "../../../components/OptimisedImage";
import dashboardStyles from "./dashboard.module.css";

type DashboardTopCardsProps = {
  handleDirectChat: () => void;
  handleAppEmbedCardClick: () => void;
};

export function DashboardTopCards({
  handleDirectChat,
  handleAppEmbedCardClick,
}: DashboardTopCardsProps) {
  const { t } = useTranslation();
  return (
  <div className={dashboardStyles.topCardsGrid}>
    <div className={dashboardStyles.topCardSection}>
      <div className={dashboardStyles.supportCard}>
        <div className={dashboardStyles.supportCardHero}>
          <p className={dashboardStyles.supportCardHeroTitle}>{t("dashboard.support.heroTitle")}</p>
          <p className={dashboardStyles.supportCardHeroDesc}>{t("dashboard.support.heroDesc")}</p>
        </div>
        <div className={dashboardStyles.supportCardBody}>
          <div className={dashboardStyles.supportAvatarWrap}>
            <OptimisedImage
              src="/Parth.jpeg"
              alt={t("dashboard.support.imageAlt")}
              className={dashboardStyles.supportAvatarImage}
              width={120}
              height={120}
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className={dashboardStyles.supportContent}>
            <s-stack direction="block" gap="base">
              <s-stack direction="block" gap="small-100">
                <s-heading>{t("dashboard.support.heading")}</s-heading>
                <s-text color="subdued">{t("dashboard.support.body")}</s-text>
              </s-stack>
              <s-text color="subdued">
                <span className={dashboardStyles.onlineNow}>{t("dashboard.support.onlineNow")}</span> • {t("dashboard.support.availability")}
              </s-text>
            </s-stack>
          </div>
          <div className={dashboardStyles.supportCta}>
            <s-button variant="primary" inlineSize="fill" onClick={handleDirectChat}>{t("dashboard.support.cta")}</s-button>
          </div>
        </div>
      </div>
    </div>

    <button
      type="button"
      className={dashboardStyles.appEmbedCard}
      onClick={handleAppEmbedCardClick}
    >
      <s-stack direction="block" gap="base">
        <div className={dashboardStyles.appEmbedCardHeader}>
          <s-heading>{t("dashboard.appEmbeds.headingMain")} <span className={dashboardStyles.appEmbedHeadingHint}>{t("dashboard.appEmbeds.headingHint")}</span></s-heading>
          <s-icon type="external" color="subdued" />
        </div>
        <div className={dashboardStyles.appEmbedImage} aria-hidden="true" />
        <s-text color="subdued">{t("dashboard.appEmbeds.instruction")}</s-text>
      </s-stack>
    </button>
  </div>
  );
}
