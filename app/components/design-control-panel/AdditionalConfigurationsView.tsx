import type { DesignSettings } from "../../types/state.types";
import { PRODUCT_PAGE_LAYOUT_BUNDLE_SETTING_ROWS } from "../../lib/bundle-config/product-page-layout-settings";
import { CartLineMessagingSettings } from "./settings/CartLineMessagingSettings";
import designControlPanelStyles from "../../styles/routes/design-control-panel.module.css";

interface AdditionalConfigurationsViewProps {
  settings: DesignSettings;
  onUpdate: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => void;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  onBack: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

function ReadOnlyCheckbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-disabled="true"
      aria-label={label}
      className={
        checked
          ? designControlPanelStyles.additionalConfigCheckboxChecked
          : designControlPanelStyles.additionalConfigCheckbox
      }
    >
      {checked && <span className={designControlPanelStyles.additionalConfigCheckboxMark} />}
    </span>
  );
}

export function AdditionalConfigurationsView({
  settings,
  onUpdate,
  hasUnsavedChanges,
  isLoading,
  onBack,
  onDiscard,
  onSave,
}: AdditionalConfigurationsViewProps) {
  return (
    <div className={designControlPanelStyles.additionalConfigShell}>
      <main className={designControlPanelStyles.additionalConfigContent}>
        <div className={designControlPanelStyles.additionalConfigHeadingRow}>
          <button
            type="button"
            className={designControlPanelStyles.additionalConfigBackButton}
            onClick={onBack}
            aria-label="Back"
          >
            &lt;
          </button>
          <h2 className={designControlPanelStyles.additionalConfigTitle}>Additional Configurations</h2>
        </div>

        <div className={designControlPanelStyles.additionalConfigGrid}>
          <aside className={designControlPanelStyles.additionalConfigSideCard}>
            <h3 className={designControlPanelStyles.additionalConfigCardTitle}>App Configurations</h3>
            <p className={designControlPanelStyles.additionalConfigSubText}>Configure your bundle settings</p>
            <button
              type="button"
              className={designControlPanelStyles.additionalConfigLayoutButton}
              aria-label="Product Page Layout"
            >
              <span>Product Page Layout</span>
              <span className={designControlPanelStyles.additionalConfigChevron} aria-hidden="true" />
            </button>
            <div className={designControlPanelStyles.additionalConfigNavList}>
              <div className={designControlPanelStyles.additionalConfigNavItemActive}>
                <span className={designControlPanelStyles.additionalConfigNavIcon} aria-hidden="true" />
                <span>Configuration</span>
              </div>
              <div className={designControlPanelStyles.additionalConfigNavItem}>
                <span className={designControlPanelStyles.additionalConfigCodeIcon} aria-hidden="true" />
                <span>CSS &amp; Scripts</span>
              </div>
            </div>
          </aside>

          <section className={designControlPanelStyles.additionalConfigMainColumn}>
            <div className={designControlPanelStyles.additionalConfigBundleSettingsCard}>
              <h3 className={designControlPanelStyles.additionalConfigCardTitle}>Bundle Settings</h3>
              <p className={designControlPanelStyles.additionalConfigSubText}>
                Additional bundle level settings applicable to all bundles created
              </p>
              <div className={designControlPanelStyles.additionalConfigDivider} />
              <div className={designControlPanelStyles.additionalConfigBundleRows}>
                {PRODUCT_PAGE_LAYOUT_BUNDLE_SETTING_ROWS.map((row) => (
                  <div key={row.label} className={designControlPanelStyles.additionalConfigBundleRow}>
                    <ReadOnlyCheckbox checked={row.checked} label={row.label} />
                    <span>{row.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <CartLineMessagingSettings settings={settings} onUpdate={onUpdate} />
          </section>
        </div>
      </main>

      {hasUnsavedChanges && (
        <div className={designControlPanelStyles.additionalConfigFooter}>
          <span className={designControlPanelStyles.unsavedLabel}>Unsaved changes</span>
          <div className={designControlPanelStyles.modalFooterActions}>
            <button
              type="button"
              className={designControlPanelStyles.secondaryActionButton}
              onClick={onDiscard}
              disabled={isLoading}
            >
              Discard
            </button>
            <button
              type="button"
              className={designControlPanelStyles.primaryActionButton}
              onClick={onSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
