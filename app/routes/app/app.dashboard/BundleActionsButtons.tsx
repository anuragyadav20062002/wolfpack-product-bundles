import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { BundleActionsButtonsProps } from "./types";
import { shouldRenderDashboardActionMenu } from "./dashboard-action-menu-state";
import dashboardStyles from "./dashboard.module.css";

export const BundleActionsButtons = memo(({
  bundleId,
  onEdit,
  onClone,
  onDelete,
  onPreview,
  activeActionMenuBundleId,
  onActionMenuRequest,
  isPreviewing = false,
  isEditing = false,
  bundle,
}: Omit<BundleActionsButtonsProps, 'moreOpen' | 'onMoreToggle'>) => {
  const { t } = useTranslation();
  const renderActionMenu = shouldRenderDashboardActionMenu({
    activeMenuBundleId: activeActionMenuBundleId,
    bundleId,
  });
  return (
    <div className={dashboardStyles.bundleActions}>
      <s-button
        id={`edit-${bundleId}`}
        icon="edit"
        variant="tertiary"
        loading={isEditing || undefined}
        disabled={isEditing || undefined}
        interestFor={`tooltip-edit-${bundleId}`}
        onClick={() => onEdit(bundle)}
        accessibilityLabel={t("dashboard.actions.editBundle")}
      />
      <s-tooltip id={`tooltip-edit-${bundleId}`}>{t("dashboard.actions.editBundle")}</s-tooltip>

      <s-button
        id={`preview-${bundleId}`}
        icon="view"
        variant="tertiary"
        interestFor={`tooltip-preview-${bundleId}`}
        onClick={() => onPreview(bundle)}
        loading={isPreviewing || undefined}
        disabled={isPreviewing || undefined}
        accessibilityLabel={t("dashboard.actions.previewBundle")}
      />
      <s-tooltip id={`tooltip-preview-${bundleId}`}>
        {t("dashboard.actions.previewBundle")}
      </s-tooltip>

      <s-button
        id={`more-${bundleId}`}
        icon="menu-horizontal"
        variant="tertiary"
        commandFor={`more-popover-${bundleId}`}
        command="--toggle"
        onClick={() => onActionMenuRequest(bundleId)}
        accessibilityLabel={t("dashboard.actions.moreActions")}
      />
      <s-popover id={`more-popover-${bundleId}`}>
        {renderActionMenu && (
          <s-stack direction="block" gap="none">
            <s-button variant="tertiary" icon="duplicate" onClick={() => onClone(bundleId)}>{t("dashboard.actions.cloneBundle")}</s-button>
            <s-button variant="tertiary" tone="critical" icon="delete" onClick={() => onDelete(bundleId)}>{t("dashboard.actions.deleteBundle")}</s-button>
          </s-stack>
        )}
      </s-popover>
    </div>
  );
});

BundleActionsButtons.displayName = 'BundleActionsButtons';
