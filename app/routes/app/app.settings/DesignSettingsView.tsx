import { useEffect, useRef, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { DESIGN_CONFIGURATION, EXPERT_COLOR_CONTROLS } from "../../../lib/admin-configuration-surfaces";
import styles from "../../../styles/routes/admin-configuration-surfaces.module.css";
import { BundlePreviewModal, DesignFields, getDesignIconKey } from "./SettingsDesignFields";
import { buildDesignPreviewVariables } from "./settings-state";
import { SettingsContextualSaveBar, SettingsToast } from "./SettingsFeedback";

type PreviewBundle = { id: string; name: string; type: string; viewUrl: string | null };

type DesignSettingsViewProps = {
  selectedDesignTab: (typeof DESIGN_CONFIGURATION)[number];
  isExpertColorControls: boolean;
  isExpertScopeActive: boolean;
  activeDesignScope: string;
  designFieldValues: Record<string, string>;
  designGateMessage: string | null;
  isActiveSubpageDirty: boolean;
  isPreviewModalOpen: boolean;
  previewBundles: PreviewBundle[];
  saveMessage: string | null;
  setSettingsView: (view: "landing") => void;
  setIsPreviewModalOpen: (isOpen: boolean) => void;
  setActiveDesignTab: (tab: string) => void;
  setIsExpertScopeActive: (isActive: boolean) => void;
  setDesignGateMessage: (message: string | null) => void;
  setActiveDesignScope: (scope: string) => void;
  setDesignFieldValues: Dispatch<SetStateAction<Record<string, string>>>;
  setIsExpertColorControls: (isEnabled: boolean) => void;
  setSaveMessage: (message: string | null) => void;
  discardActiveSettingsChanges: () => void;
  saveActiveSettingsChanges: () => void;
};

export function DesignSettingsView({
  selectedDesignTab,
  isExpertColorControls,
  isExpertScopeActive,
  activeDesignScope,
  designFieldValues,
  designGateMessage,
  isActiveSubpageDirty,
  isPreviewModalOpen,
  previewBundles,
  saveMessage,
  setSettingsView,
  setIsPreviewModalOpen,
  setActiveDesignTab,
  setIsExpertScopeActive,
  setDesignGateMessage,
  setActiveDesignScope,
  setDesignFieldValues,
  setIsExpertColorControls,
  setSaveMessage,
  discardActiveSettingsChanges,
  saveActiveSettingsChanges,
}: DesignSettingsViewProps) {
const { t } = useTranslation();
const selectedDesignFields = isExpertColorControls && selectedDesignTab.title === "Brand Colors" && isExpertScopeActive
  ? EXPERT_COLOR_CONTROLS[activeDesignScope] ?? EXPERT_COLOR_CONTROLS.General
  : selectedDesignTab.fields;
const isBrandColorsPanelGated = isExpertColorControls && selectedDesignTab.title === "Brand Colors" && !isExpertScopeActive;
const hasPreviewableBundle = previewBundles.some((bundle) => Boolean(bundle.viewUrl));
const previewBundle = previewBundles.find((bundle) => Boolean(bundle.viewUrl));
const previewVariables = buildDesignPreviewVariables(designFieldValues) as CSSProperties;
const designSidebarRef = useRef<HTMLElement | null>(null);
const designContentRef = useRef<HTMLElement | null>(null);
useEffect(() => {
  for (const element of [designSidebarRef.current, designContentRef.current]) {
    element?.toggleAttribute("inert", !hasPreviewableBundle);
  }
}, [hasPreviewableBundle]);
const resetSelectedDesignTab = () => {
  setDesignFieldValues((current) => ({
    ...current,
    ...Object.fromEntries(selectedDesignFields.map((field) => [field.key ?? field.label, field.value ?? ""])),
  }));
};

return (
  <>
    <ui-title-bar title="Design Control Panel" />
    <main className={`${styles.page} ${styles.designPage}`}>
      <header className={styles.hero}>
        <div className={styles.settingsSubpageHeaderLeft}>
          <button
            type="button"
            className={styles.settingsSubpageBackButton}
            aria-label="Back to Settings"
            onClick={() => setSettingsView("landing")}
          >
            <s-icon type="arrow-left" size="small"></s-icon>
          </button>
          <h1 className={styles.title}>Design Control Panel</h1>
        </div>
        <button type="button" className={styles.settingsPreviewButton} onClick={() => setIsPreviewModalOpen(true)}>
          <s-icon type="view" size="small"></s-icon>
          Preview Bundle
        </button>
      </header>

      <section className={styles.designLayout} aria-label="Design">
        <aside ref={designSidebarRef} className={`${styles.designSidebar}${hasPreviewableBundle ? "" : ` ${styles.designControlsDisabled}`}`}>
          <section className={styles.designSideCard}>
            <h2>Bundle Design</h2>
            <p>Customize your bundle in a few clicks</p>
            <div className={styles.designNavList} role="tablist" aria-label="Design sections">
              {DESIGN_CONFIGURATION.map((tab) => (
                <button
                  key={tab.title}
                  type="button"
                  className={selectedDesignTab.title === tab.title && !isExpertScopeActive ? styles.designNavActive : styles.designNavButton}
                  onClick={() => {
                    setActiveDesignTab(tab.title);
                    setIsExpertScopeActive(false);
                    if (tab.title === "Brand Colors" && isExpertColorControls) {
                      setDesignGateMessage("Disable Expert Color Controls to access brand colors.");
                      return;
                    }
                    setDesignGateMessage(null);
                  }}
                >
                  <span className={styles.designNavIcon}>
                    <s-icon type={getDesignIconKey(tab.title)} />
                  </span>
                  {tab.title}
                </button>
              ))}
            </div>
          </section>
          <section className={styles.designSideCard}>
            <label className={styles.designSwitchRow}>
              <span>
                <span className={styles.designSideTitle}>Expert Color Controls</span>
                <span className={styles.designSideDescription}>Change colors of individual elements of the bundle</span>
              </span>
              <span className={styles.designExpertSwitch}>
                <input
                  type="checkbox"
                  checked={isExpertColorControls}
                  aria-label="Expert Color Controls"
                  onChange={(event) => {
                    const isChecked = event.currentTarget.checked;
                    setIsExpertColorControls(isChecked);
                    if (isChecked) {
                      setActiveDesignTab("Brand Colors");
                      setIsExpertScopeActive(false);
                    }
                    setDesignGateMessage(isChecked ? "Disable Expert Color Controls to access brand colors." : null);
                  }}
                />
                <span aria-hidden="true" />
              </span>
            </label>
            {isExpertColorControls ? (
              <div className={styles.designNavList} role="tablist" aria-label="Color control scopes">
                {["General", "Product Card", "Bundle Cart", "Upsell"].map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    className={activeDesignScope === scope && selectedDesignTab.title === "Brand Colors" && isExpertScopeActive ? styles.designScopeActive : styles.designScopeButton}
                    onClick={() => {
                      setDesignGateMessage(null);
                      setActiveDesignTab("Brand Colors");
                      setActiveDesignScope(scope);
                      setIsExpertScopeActive(true);
                    }}
                  >
                    <span className={styles.designNavIcon}>
                      <s-icon type={getDesignIconKey(scope)} />
                    </span>
                    {scope}
                  </button>
                ))}
              </div>
            ) : null}
          </section>
          <button type="button" className={styles.designResetButton} onClick={resetSelectedDesignTab}>
            Reset to default
          </button>
        </aside>
        <section ref={designContentRef} className={`${styles.designContentCard}${hasPreviewableBundle ? "" : ` ${styles.designControlsDisabled}`}`}>
          {isBrandColorsPanelGated || designGateMessage ? (
            <div className={styles.designGateAlert} role="alert" aria-live="polite">
              {designGateMessage ?? "Disable Expert Color Controls to access brand colors."}
            </div>
          ) : null}
          <div className={isBrandColorsPanelGated ? styles.designGatedPanel : undefined}>
            <DesignFields
              title={isExpertColorControls && selectedDesignTab.title === "Brand Colors" && isExpertScopeActive ? activeDesignScope : selectedDesignTab.title}
              fields={selectedDesignFields}
              values={designFieldValues}
              onFieldChange={(label, value) => {
                if (isBrandColorsPanelGated) {
                  return;
                }
                setDesignFieldValues((current) => ({ ...current, [label]: value }));
              }}
            />
          </div>
        </section>
        <section className={styles.designPreviewPanel} aria-label="Live bundle preview">
          <div className={styles.designPreviewHeader}>
            <div>
              <h2>{t("settingsDcp.preview.heading")}</h2>
              <p>{t("settingsDcp.preview.unsaved")}</p>
            </div>
          </div>
          {previewBundle ? (
            <div className={styles.designPreviewSurface} style={previewVariables}>
              <header className={styles.designPreviewHero}>
                <span>{previewBundle.type}</span>
                <h3>{previewBundle.name}</h3>
                <p>{t("settingsDcp.preview.surface.description")}</p>
              </header>
              <div className={styles.designPreviewTabs}>
                <span data-active="true">{t("settingsDcp.preview.surface.stepOne")}</span>
                <span>{t("settingsDcp.preview.surface.stepTwo")}</span>
              </div>
              <div className={styles.designPreviewProducts}>
                {["first", "second"].map((productKey) => (
                  <article key={productKey} className={styles.designPreviewProductCard}>
                    <div className={styles.designPreviewProductImage} aria-hidden="true">
                      <s-icon type="product" size="base" />
                    </div>
                    <strong>{t(`settingsDcp.preview.surface.products.${productKey}.name`)}</strong>
                    <span>{t(`settingsDcp.preview.surface.products.${productKey}.price`)}</span>
                    <button type="button" disabled aria-label="Preview only">{t("settingsDcp.preview.surface.add")}</button>
                  </article>
                ))}
              </div>
              <footer className={styles.designPreviewCart}>
                <span>
                  <strong>{t("settingsDcp.preview.surface.summary")}</strong>
                  <small>{t("settingsDcp.preview.surface.total")}</small>
                </span>
                <button type="button" disabled aria-label="Preview only">{t("settingsDcp.preview.surface.next")}</button>
              </footer>
            </div>
          ) : (
            <div className={styles.designPreviewEmpty}>
              <s-icon type="view" size="base" />
              <s-heading>{t("settingsDcp.preview.emptyHeading")}</s-heading>
              <s-text color="subdued">{t("settingsDcp.preview.emptyBody")}</s-text>
            </div>
          )}
        </section>
      </section>
      <SettingsContextualSaveBar isOpen={isActiveSubpageDirty} onDiscard={discardActiveSettingsChanges} onSave={saveActiveSettingsChanges} />
      <BundlePreviewModal
        isOpen={isPreviewModalOpen}
        bundles={previewBundles}
        onClose={() => setIsPreviewModalOpen(false)}
      />
      <SettingsToast message={saveMessage} onDismiss={() => setSaveMessage(null)} />
    </main>
  </>
);
}
