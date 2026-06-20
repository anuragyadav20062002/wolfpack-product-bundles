import { Link } from "@remix-run/react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { OptimisedImage } from "../../../components/OptimisedImage";
import dashboardStyles from "./dashboard.module.css";

type DashboardResourcesCardProps = {
  activeResource: string;
  setActiveResource: Dispatch<SetStateAction<string>>;
  handleDirectChat: () => void;
};

export function DashboardResourcesCard({ activeResource, setActiveResource, handleDirectChat }: DashboardResourcesCardProps) {
  const { t } = useTranslation();
  return (
  <div className={dashboardStyles.resourcesCard}>
    <div className={dashboardStyles.resourcesLayout}>
      <div className={dashboardStyles.resourcesList}>
        <button
          type="button"
          className={`${dashboardStyles.resourceItem} ${activeResource === 'bundle-inspirations' ? dashboardStyles.resourceItemActive : ''}`}
          onClick={() => setActiveResource('bundle-inspirations')}
        >
          <div className={dashboardStyles.resourceItemIcon}><s-icon type="image" /></div>
          <span className={dashboardStyles.resourceItemLabel}>{t("dashboard.resources.bundleInspiration")}</span>
        </button>
        <button type="button" className={dashboardStyles.resourceItem} onClick={handleDirectChat}>
          <div className={dashboardStyles.resourceItemIcon}><s-icon type="question-circle" /></div>
          <span className={dashboardStyles.resourceItemLabel}>{t("dashboard.resources.support")}</span>
        </button>
        <Link to="/app/events" className={dashboardStyles.resourceItem}>
          <div className={dashboardStyles.resourceItemIcon}><s-icon type="notification" /></div>
          <span className={dashboardStyles.resourceItemLabel}>{t("dashboard.resources.exploreUpdate")}</span>
        </Link>
        <a href="https://wolfpackapps.com/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.resourceItem}>
          <div className={dashboardStyles.resourceItemIcon}><s-icon type="code" /></div>
          <span className={dashboardStyles.resourceItemLabel}>{t("dashboard.resources.sdkDocumentation")}</span>
        </a>
      </div>

      <div className={dashboardStyles.resourcesThumbnails}>
        <a href="https://wolfpackapps.com/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.resourceThumbnailCard}>
          <OptimisedImage
            src="/bundleGallery.png"
            alt={t("dashboard.resources.bundleGallery")}
            className={dashboardStyles.resourceThumbnailImage}
            width={320}
            height={180}
            loading="lazy"
          />
          <div className={dashboardStyles.resourceThumbnailFooter}>
            <span>{t("dashboard.resources.bundleGallery")}</span>
            <s-icon type="external" color="subdued" />
          </div>
        </a>
        <a href="https://wolfpackapps.com/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.resourceThumbnailCard}>
          <OptimisedImage
            src="/bundleGallery.png"
            alt={t("dashboard.resources.bundleGallery")}
            className={dashboardStyles.resourceThumbnailImage}
            width={320}
            height={180}
            loading="lazy"
          />
          <div className={dashboardStyles.resourceThumbnailFooter}>
            <span>{t("dashboard.resources.bundleGallery")}</span>
            <s-icon type="external" color="subdued" />
          </div>
        </a>
      </div>
    </div>
  </div>
  );
}
