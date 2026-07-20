import { useTranslation } from "react-i18next";
import { OptimisedImage } from "../../../components/OptimisedImage";
import dashboardStyles from "./dashboard.module.css";

type DashboardTopCardsProps = {
  handleDirectChat: () => void;
};

export function DashboardTopCards({
  handleDirectChat,
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

    <div className={`${dashboardStyles.supportCard} ${dashboardStyles.supportIssuesCard}`}>
      <div className={`${dashboardStyles.supportCardHero} ${dashboardStyles.supportIssuesHero}`}>
        <p className={dashboardStyles.supportCardHeroTitle}>{t("dashboard.supportIssues.title")}</p>
        <p className={dashboardStyles.supportCardHeroDesc}>{t("dashboard.supportIssues.description")}</p>
      </div>
      <div className={dashboardStyles.supportIssuesBody}>
        <s-stack direction="block" gap="small-100">
          <s-stack direction="inline" alignItems="center" gap="small-100">
            <s-icon type="question-circle" color="subdued" />
            <s-text>{t("dashboard.supportIssues.featureNotWorking")}</s-text>
          </s-stack>
          <s-stack direction="inline" alignItems="center" gap="small-100">
            <s-icon type="question-circle" color="subdued" />
            <s-text>{t("dashboard.supportIssues.bundleNotShowing")}</s-text>
          </s-stack>
          <s-stack direction="inline" alignItems="center" gap="small-100">
            <s-icon type="question-circle" color="subdued" />
            <s-text>{t("dashboard.supportIssues.uninstallHelp")}</s-text>
          </s-stack>
          <s-stack direction="inline" alignItems="center" gap="small-100">
            <s-icon type="question-circle" color="subdued" />
            <s-text>{t("dashboard.supportIssues.storeDesignHelp")}</s-text>
          </s-stack>
          <s-stack direction="inline" alignItems="center" gap="small-100">
            <s-icon type="question-circle" color="subdued" />
            <s-text>{t("dashboard.supportIssues.analyticsNotWorking")}</s-text>
          </s-stack>
        </s-stack>
        <div className={dashboardStyles.supportIssuesCta}>
          <s-button
            icon="chat"
            inlineSize="fill"
            onClick={handleDirectChat}
          >
            {t("dashboard.supportIssues.cta")}
          </s-button>
          <span className={dashboardStyles.supportIssuesExternalIcon} aria-hidden="true">
            <s-icon type="external" color="subdued" />
          </span>
        </div>
      </div>
    </div>
  </div>
  );
}
