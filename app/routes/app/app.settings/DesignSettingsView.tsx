import { useState, type Dispatch, type SetStateAction } from "react";
import { DESIGN_CONFIGURATION, EXPERT_COLOR_CONTROLS } from "../../../lib/admin-configuration-surfaces";
import { BundlePreviewModal, DesignFields, getDesignIconKey } from "./SettingsDesignFields";
import { DesignLivePreview } from "./DesignLivePreview";
import styles from "./DesignSettingsView.module.css";
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
  const selectedDesignFields = isExpertColorControls && selectedDesignTab.title === "Brand Colors" && isExpertScopeActive
    ? EXPERT_COLOR_CONTROLS[activeDesignScope] ?? EXPERT_COLOR_CONTROLS.General
    : selectedDesignTab.fields;
  const isBrandColorsPanelGated = isExpertColorControls && selectedDesignTab.title === "Brand Colors" && !isExpertScopeActive;
  const hasPreviewableBundle = previewBundles.some((bundle) => Boolean(bundle.viewUrl));
  const [activePreviewFieldKey, setActivePreviewFieldKey] = useState<string | null>(null);
  const resetSelectedDesignTab = () => {
    setDesignFieldValues((current) => ({
      ...current,
      ...Object.fromEntries(selectedDesignFields.map((field) => [field.key ?? field.label, field.value ?? ""])),
    }));
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-button
            variant="tertiary"
            icon="arrow-left"
            accessibilityLabel="Back to Settings"
            onClick={() => setSettingsView("landing")}
          />
          <s-heading>Design Control Panel</s-heading>
        </s-stack>
        <s-button icon="view" disabled={!hasPreviewableBundle} onClick={() => setIsPreviewModalOpen(true)}>
          Preview Bundle
        </s-button>
      </header>

      <section className={styles.layout} aria-label="Design">
        <aside className={styles.inspectorNavigation}>
          <section className={styles.navigationSection}>
            <h2>Bundle Design</h2>
            <p>Customize your bundle in a few clicks</p>
            <div className={styles.navList} role="tablist" aria-label="Design sections">
              {DESIGN_CONFIGURATION.map((tab) => (
                <button
                  key={tab.title}
                  type="button"
                  className={selectedDesignTab.title === tab.title && !isExpertScopeActive ? styles.navActive : styles.navButton}
                  onClick={() => {
                    setActiveDesignTab(tab.title);
                    setIsExpertScopeActive(false);
                    setActivePreviewFieldKey(tab.fields[0] ? tab.fields[0].key ?? tab.fields[0].label : null);
                    if (tab.title === "Brand Colors" && isExpertColorControls) {
                      setDesignGateMessage("Disable Expert Color Controls to access brand colors.");
                      return;
                    }
                    setDesignGateMessage(null);
                  }}
                >
                  <span className={styles.navIcon}>
                    <s-icon type={getDesignIconKey(tab.title)} />
                  </span>
                  {tab.title}
                </button>
              ))}
            </div>
          </section>
          <section className={`${styles.navigationSection} ${styles.expertControl}`}>
            <s-switch
              label="Expert Color Controls"
              details="Change colors of individual elements of the bundle"
              checked={isExpertColorControls}
              onChange={(event: Event) => {
                const isChecked = (event.target as HTMLInputElement).checked;
                setIsExpertColorControls(isChecked);
                if (isChecked) {
                  setActiveDesignTab("Brand Colors");
                  setIsExpertScopeActive(false);
                  setActivePreviewFieldKey(null);
                } else {
                  setActivePreviewFieldKey("Primary Color");
                }
                setDesignGateMessage(isChecked ? "Disable Expert Color Controls to access brand colors." : null);
              }}
            />
            {isExpertColorControls ? (
              <div className={`${styles.navList} ${styles.expertScopes}`} role="tablist" aria-label="Color control scopes">
                {["General", "Product Card", "Bundle Cart", "Upsell"].map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    className={activeDesignScope === scope && selectedDesignTab.title === "Brand Colors" && isExpertScopeActive ? styles.scopeActive : styles.scopeButton}
                    onClick={() => {
                      setDesignGateMessage(null);
                      setActiveDesignTab("Brand Colors");
                      setActiveDesignScope(scope);
                      setIsExpertScopeActive(true);
                      const firstField = EXPERT_COLOR_CONTROLS[scope]?.[0];
                      setActivePreviewFieldKey(firstField ? firstField.key ?? firstField.label : null);
                    }}
                  >
                    <span className={styles.navIcon}>
                      <s-icon type={getDesignIconKey(scope)} />
                    </span>
                    {scope}
                  </button>
                ))}
              </div>
            ) : null}
          </section>
          <s-button variant="tertiary" tone="critical" onClick={resetSelectedDesignTab}>
            Reset to default
          </s-button>
        </aside>
        <DesignLivePreview
          fieldValues={designFieldValues}
          isExpertControlsEnabled={isExpertColorControls}
          activeFieldKey={activePreviewFieldKey}
        />
        <section className={styles.inspectorContent}>
          {isBrandColorsPanelGated || designGateMessage ? (
            <s-banner tone="warning">
              {designGateMessage ?? "Disable Expert Color Controls to access brand colors."}
            </s-banner>
          ) : null}
          <div className={isBrandColorsPanelGated ? styles.gatedPanel : undefined}>
            <DesignFields
              title={isExpertColorControls && selectedDesignTab.title === "Brand Colors" && isExpertScopeActive ? activeDesignScope : selectedDesignTab.title}
              fields={selectedDesignFields}
              values={designFieldValues}
              onFieldChange={(label, value) => {
                if (isBrandColorsPanelGated) {
                  return;
                }
                setActivePreviewFieldKey(label);
                setDesignFieldValues((current) => ({ ...current, [label]: value }));
              }}
            />
          </div>
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
  );
}
