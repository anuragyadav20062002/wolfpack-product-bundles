import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  CONTROL_LAYOUTS,
  DESIGN_CONFIGURATION,
  LANGUAGE_CONFIGURATION,
  SETTINGS_CARDS,
  SUPPORTED_LANGUAGE_LABELS,
} from "../../../lib/admin-configuration-surfaces";
import styles from "../../../styles/routes/admin-configuration-surfaces.module.css";
import type { action, loader } from "../app.settings";
import {
  getInitialControlFieldValues,
  getInitialDesignFieldValues,
  getInitialLanguageFieldValues,
} from "./settings-state";
import {
  SettingsCardIcon,
  getControlTabIcon,
} from "./SettingsDesignFields";
import {
  ControlsContentCards,
  ControlsFormGroup,
  SettingsVariablesModal,
} from "./SettingsControls";
import {
  SettingsContextualSaveBar,
  SettingsHelpModal,
  SettingsToast,
} from "./SettingsFeedback";
import { runAfterSaveBarLeaveConfirmation } from "../../../lib/admin-savebar-navigation.client";
import { createSettingsDesignState, type SettingsDesignPayload } from "../../../lib/settings-design-contract";
import { DesignSettingsView } from "./DesignSettingsView";

export function SettingsRoute({ initialView = "landing" }: { initialView?: "landing" | "design" | "language" | "controls" }) {
  const { settingsPage, previewBundles } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const shopify = useAppBridge();
  const languageNavigationRef = useRef<HTMLDetailsElement>(null);
  const controlsNavigationRef = useRef<HTMLDetailsElement>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [settingsHelpArticle, setSettingsHelpArticle] = useState<"inventory" | null>(null);
  const [settingsVariablesModal, setSettingsVariablesModal] = useState<{ title: string; variables: string[] } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const persistedLanguageState = settingsPage?.language && typeof settingsPage.language === "object"
      ? settingsPage.language as {
        isMultilanguageEnabled?: boolean;
        selectedLanguage?: string;
        activeTemplateLayout?: string;
        languageFieldValues?: Record<string, string>;
      }
    : null;
  const persistedControlState = settingsPage?.controls && typeof settingsPage.controls === "object"
    ? settingsPage.controls as Record<string, string>
    : null;
  const persistedDesignState = createSettingsDesignState(settingsPage?.design);
  const [settingsView, setSettingsView] = useState<"landing" | "design" | "language" | "controls">(initialView);
  const [isMultilanguageEnabled, setIsMultilanguageEnabled] = useState(persistedLanguageState?.isMultilanguageEnabled ?? LANGUAGE_CONFIGURATION.enabled);
  const [selectedLanguage, setSelectedLanguage] = useState(persistedLanguageState?.selectedLanguage ?? LANGUAGE_CONFIGURATION.selectedLanguage);
  const [languageFieldValues, setLanguageFieldValues] = useState<Record<string, string>>({
    ...getInitialLanguageFieldValues(),
    ...(persistedLanguageState?.languageFieldValues ?? {}),
  });
  const [activeLanguagePanel, setActiveLanguagePanel] = useState<"cartCheckout" | string>("Product Card");
  const [activeLanguageLayout, setActiveLanguageLayout] = useState(persistedLanguageState?.activeTemplateLayout ?? "Landing Page Layout");
  const [savedLanguageState, setSavedLanguageState] = useState(() => ({
    isMultilanguageEnabled: persistedLanguageState?.isMultilanguageEnabled ?? LANGUAGE_CONFIGURATION.enabled,
    selectedLanguage: persistedLanguageState?.selectedLanguage ?? LANGUAGE_CONFIGURATION.selectedLanguage,
    activeTemplateLayout: persistedLanguageState?.activeTemplateLayout ?? "Landing Page Layout",
    languageFieldValues: {
      ...getInitialLanguageFieldValues(),
      ...(persistedLanguageState?.languageFieldValues ?? {}),
    },
  }));
  const [controlFieldValues, setControlFieldValues] = useState<Record<string, string>>({
    ...getInitialControlFieldValues(),
    ...(persistedControlState ?? {}),
  });
  const [savedControlFieldValues, setSavedControlFieldValues] = useState<Record<string, string>>({
    ...getInitialControlFieldValues(),
    ...(persistedControlState ?? {}),
  });
  const [activeDesignTab, setActiveDesignTab] = useState(DESIGN_CONFIGURATION[0].title);
  const [designFieldValues, setDesignFieldValues] = useState<Record<string, string>>({
    ...getInitialDesignFieldValues(),
    ...persistedDesignState.fieldValues,
  });
  const [savedDesignFieldValues, setSavedDesignFieldValues] = useState<Record<string, string>>({
    ...getInitialDesignFieldValues(),
    ...persistedDesignState.fieldValues,
  });
  const [activeControlLayout, setActiveControlLayout] = useState(CONTROL_LAYOUTS[0].label);
  const [activeControlTab, setActiveControlTab] = useState(CONTROL_LAYOUTS[0].tabs[0].title);
  const [activeControlGroup, setActiveControlGroup] = useState("");
  const [isExpertColorControls, setIsExpertColorControls] = useState(persistedDesignState.isExpertControlsEnabled);
  const [savedIsExpertColorControls, setSavedIsExpertColorControls] = useState(persistedDesignState.isExpertControlsEnabled);
  const [activeDesignScope, setActiveDesignScope] = useState("General");
  const [isExpertScopeActive, setIsExpertScopeActive] = useState(false);
  const [designGateMessage, setDesignGateMessage] = useState<string | null>(null);
  const selectedDesignTab = DESIGN_CONFIGURATION.find((tab) => tab.title === activeDesignTab) ?? DESIGN_CONFIGURATION[0];
  const selectedControlLayout = CONTROL_LAYOUTS.find((layout) => layout.label === activeControlLayout) ?? CONTROL_LAYOUTS[0];
  const selectedControlTab = selectedControlLayout.tabs.find((tab) => tab.title === activeControlTab) ?? selectedControlLayout.tabs[0];
  const selectedControlGroupTitles = Array.from(new Set(
    selectedControlTab.fields.map((field) => field.group ?? selectedControlTab.contentTitle ?? selectedControlTab.title),
  ));
  const hasNestedControlGroups = selectedControlTab.title === "CSS & Scripts" && selectedControlGroupTitles.length > 1;
  const selectedControlGroupTitle = selectedControlGroupTitles.includes(activeControlGroup)
    ? activeControlGroup
    : selectedControlGroupTitles[0] ?? selectedControlTab.contentTitle ?? selectedControlTab.title;
  const selectedControlFields = hasNestedControlGroups
    ? selectedControlTab.fields.filter((field) => (field.group ?? selectedControlTab.contentTitle ?? selectedControlTab.title) === selectedControlGroupTitle)
    : selectedControlTab.fields;
  const currentLanguageState = { isMultilanguageEnabled, selectedLanguage, activeTemplateLayout: activeLanguageLayout, languageFieldValues };
  const isLanguageDirty = JSON.stringify(currentLanguageState) !== JSON.stringify(savedLanguageState);
  const isControlsDirty = JSON.stringify(controlFieldValues) !== JSON.stringify(savedControlFieldValues);
  const currentDesignState = { fieldValues: designFieldValues, isExpertControlsEnabled: isExpertColorControls };
  const savedDesignState = { fieldValues: savedDesignFieldValues, isExpertControlsEnabled: savedIsExpertColorControls };
  const isDesignDirty = JSON.stringify(currentDesignState) !== JSON.stringify(savedDesignState);
  const isActiveSubpageDirty =
    (settingsView === "design" && isDesignDirty) ||
    (settingsView === "language" && isLanguageDirty) ||
    (settingsView === "controls" && isControlsDirty);
  const returnToSettingsLanding = () => {
    void runAfterSaveBarLeaveConfirmation(shopify, () => setSettingsView("landing"));
  };

  const discardActiveSettingsChanges = () => {
    if (settingsView === "design") {
      setDesignFieldValues(savedDesignFieldValues);
      setIsExpertColorControls(savedIsExpertColorControls);
      setDesignGateMessage(null);
      return;
    }
    if (settingsView === "language") {
      setIsMultilanguageEnabled(savedLanguageState.isMultilanguageEnabled);
      setSelectedLanguage(savedLanguageState.selectedLanguage);
      setActiveLanguageLayout(savedLanguageState.activeTemplateLayout);
      setLanguageFieldValues(savedLanguageState.languageFieldValues);
      return;
    }
    if (settingsView === "controls") {
      setControlFieldValues(savedControlFieldValues);
    }
  };

  const saveActiveSettingsChanges = () => {
    if (settingsView === "design") {
      const designPayload: SettingsDesignPayload = createSettingsDesignState(currentDesignState);
      submit({
        intent: "saveSettingsDesign",
        payload: JSON.stringify(designPayload),
      }, { method: "post" });
      return;
    }
    if (settingsView === "language") {
      submit({
        intent: "saveSettingsLanguage",
        payload: JSON.stringify(currentLanguageState),
      }, { method: "post" });
      setSavedLanguageState(currentLanguageState);
      return;
    }
    if (settingsView === "controls") {
      submit({
        intent: "saveSettingsControls",
        payload: JSON.stringify(controlFieldValues),
      }, { method: "post" });
      setSavedControlFieldValues(controlFieldValues);
    }
  };

  useEffect(() => {
    if (!actionData) {
      return;
    }
    if (
      actionData.success
      && "intent" in actionData
      && actionData.intent === "saveSettingsDesign"
      && "savedState" in actionData
    ) {
      const confirmedState = createSettingsDesignState(actionData.savedState);
      setSavedDesignFieldValues(confirmedState.fieldValues);
      setSavedIsExpertColorControls(confirmedState.isExpertControlsEnabled);
    }
    setSaveMessage(actionData.success ? "Settings saved successfully" : actionData.message || "Something went wrong");
  }, [actionData]);

  if (settingsView === "design") {
    return (
      <DesignSettingsView
        selectedDesignTab={selectedDesignTab}
        isExpertColorControls={isExpertColorControls}
        isExpertScopeActive={isExpertScopeActive}
        activeDesignScope={activeDesignScope}
        designFieldValues={designFieldValues}
        designGateMessage={designGateMessage}
        isActiveSubpageDirty={isActiveSubpageDirty}
        isPreviewModalOpen={isPreviewModalOpen}
        previewBundles={previewBundles}
        saveMessage={saveMessage}
        setSettingsView={() => returnToSettingsLanding()}
        setIsPreviewModalOpen={setIsPreviewModalOpen}
        setActiveDesignTab={setActiveDesignTab}
        setIsExpertScopeActive={setIsExpertScopeActive}
        setDesignGateMessage={setDesignGateMessage}
        setActiveDesignScope={setActiveDesignScope}
        setDesignFieldValues={setDesignFieldValues}
        setIsExpertColorControls={setIsExpertColorControls}
        setSaveMessage={setSaveMessage}
        discardActiveSettingsChanges={discardActiveSettingsChanges}
        saveActiveSettingsChanges={saveActiveSettingsChanges}
      />
    );
  }

  if (settingsView === "language") {
    const isProductPageLanguageLayout = activeLanguageLayout === "Product Page Layout";
    const activeLanguageSections = isProductPageLanguageLayout
      ? LANGUAGE_CONFIGURATION.productPageTemplateSections
      : LANGUAGE_CONFIGURATION.templateSections;
    const activeLanguageTemplateFields = isProductPageLanguageLayout
      ? LANGUAGE_CONFIGURATION.productPageTemplateFields
      : LANGUAGE_CONFIGURATION.templateFields;
    const languageGroups = activeLanguagePanel === "cartCheckout"
      ? [{
        title: "Cart & Checkout",
        description: "Shared cart and checkout labels",
        fields: LANGUAGE_CONFIGURATION.sharedCartFields,
      }]
      : activeLanguageTemplateFields[activeLanguagePanel] ?? [];

    return (
      <>
        <ui-title-bar title="Language Configurations" />
        <main className={styles.page}>
          <header className={styles.languageHero}>
            <button
              type="button"
              className={styles.settingsSubpageBackButton}
              aria-label="Back to Settings"
              onClick={returnToSettingsLanding}
            >
              <s-icon type="arrow-left" size="small"></s-icon>
            </button>
            <h1 className={styles.title}>Language Configurations</h1>
          </header>

          <section className={styles.languageTopCard} aria-label="Language mode">
            <div className={styles.languageTopCopy}>
              <s-switch
                label="Enable Multilanguage"
                details="Select the language mode for your app"
                checked={isMultilanguageEnabled || undefined}
                onChange={(event) => setIsMultilanguageEnabled(Boolean(event.currentTarget.checked))}
              />
            </div>
            <div className={styles.languageSelectStack}>
              <s-select
                label="Add preferred languages"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.currentTarget.value || selectedLanguage)}
              >
                {SUPPORTED_LANGUAGE_LABELS.map((language) => (
                  <s-option key={language} value={language}>{language}</s-option>
                ))}
              </s-select>
            </div>
          </section>

          <section className={styles.languageEditorCard} aria-label="Language Configurations">
            <button type="button" className={styles.languageSelectedChip}>
              {selectedLanguage}
            </button>
            <div className={styles.languageContentLayout}>
              <details ref={languageNavigationRef} className={styles.responsiveSectionDisclosure}>
                <summary className={styles.responsiveSectionSummary}>
                  <span>
                    <span className={styles.responsiveSectionEyebrow}>Language section</span>
                    <strong>{activeLanguagePanel === "cartCheckout" ? "Cart & Checkout" : activeLanguagePanel}</strong>
                  </span>
                  <span aria-hidden="true">▾</span>
                </summary>
                <aside className={`${styles.languageSidebarCard} ${styles.responsiveSectionContent}`}>
                <section className={styles.languageSidebarSection}>
                  <h2 className={styles.languageSidebarTitle}>Shared Components</h2>
                  <p className={styles.languageSidebarDescription}>Customize language for components across all templates</p>
                  <button
                    type="button"
                    className={activeLanguagePanel === "cartCheckout" ? styles.languageSharedButtonActive : styles.languageSharedButton}
                    onClick={() => {
                      setActiveLanguagePanel("cartCheckout");
                      languageNavigationRef.current?.removeAttribute("open");
                    }}
                  >
                    Cart &amp; Checkout
                  </button>
                </section>
                <section className={styles.languageSidebarSection}>
                  <h2 className={styles.languageSidebarTitle}>Template Language</h2>
                  <p className={styles.languageSidebarDescription}>Edit language for your landing page or product page template</p>
                  <span className={styles.languageLayoutButton}>
                    <select
                      className={styles.languageLayoutSelect}
                      aria-label="Template language layout"
                      value={activeLanguageLayout}
                      onChange={(event) => {
                        const nextLayout = event.currentTarget.value;
                        setActiveLanguageLayout(nextLayout);
                        setActiveLanguagePanel(nextLayout === "Product Page Layout"
                          ? LANGUAGE_CONFIGURATION.productPageTemplateSections[0]
                          : LANGUAGE_CONFIGURATION.templateSections[0]);
                        languageNavigationRef.current?.removeAttribute("open");
                      }}
                    >
                      <option value="Landing Page Layout">Landing Page Layout</option>
                      <option value="Product Page Layout">Product Page Layout</option>
                    </select>
                  </span>
                  <div className={styles.languageNavList} aria-label="Template Language">
                    {activeLanguageSections.map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={activeLanguagePanel === section ? styles.languageNavActive : styles.languageNavButton}
                        onClick={() => {
                          setActiveLanguagePanel(section);
                          languageNavigationRef.current?.removeAttribute("open");
                        }}
                      >
                        <span className={styles.languageNavIcon} aria-hidden="true" />
                        {section}
                      </button>
                    ))}
                  </div>
                </section>
                </aside>
              </details>
              <section className={styles.languageFieldPanel}>
                {languageGroups.map((group) => (
                  <ControlsFormGroup
                    key={`${activeLanguagePanel}-${group.title}`}
                    title={group.title}
                    description={group.description}
                    fields={group.fields}
                    values={languageFieldValues}
                    onFieldChange={(label, value) => setLanguageFieldValues((current) => ({
                      ...current,
                      [label]: value,
                    }))}
                    onShowVariables={(title, variables) => setSettingsVariablesModal({ title, variables })}
                  />
                ))}
                {activeLanguagePanel !== "cartCheckout" && languageGroups.length === 0 && (
                  <p className={styles.emptyLanguageState}>
                    No live field list has been captured for this section yet.
                  </p>
                )}
              </section>
            </div>
          </section>
          <SettingsContextualSaveBar isOpen={isActiveSubpageDirty} onDiscard={discardActiveSettingsChanges} onSave={saveActiveSettingsChanges} />
          <SettingsVariablesModal modal={settingsVariablesModal} onClose={() => setSettingsVariablesModal(null)} />
          <SettingsToast message={saveMessage} onDismiss={() => setSaveMessage(null)} />
        </main>
      </>
    );
  }

  if (settingsView === "controls") {
    return (
      <>
        <ui-title-bar title="Additional Configurations" />
        <main className={styles.page}>
          <header className={styles.hero}>
            <div className={styles.settingsSubpageHeaderLeft}>
              <button
                type="button"
                className={styles.settingsSubpageBackButton}
                aria-label="Back to Settings"
                onClick={returnToSettingsLanding}
              >
                <s-icon type="arrow-left" size="small"></s-icon>
              </button>
              <h1 className={styles.title}>Additional Configurations</h1>
            </div>
          </header>

          <section className={styles.controlsLayout} aria-label="Additional Configurations">
            <details ref={controlsNavigationRef} className={styles.responsiveSectionDisclosure}>
              <summary className={styles.responsiveSectionSummary}>
                <span>
                  <span className={styles.responsiveSectionEyebrow}>Configuration section</span>
                  <strong>{hasNestedControlGroups ? selectedControlGroupTitle : selectedControlTab.title}</strong>
                </span>
                <span aria-hidden="true">▾</span>
              </summary>
              <aside className={`${styles.controlsSidebarCard} ${styles.responsiveSectionContent}`}>
              <h2>App Configurations</h2>
              <p>Configure your bundle settings</p>
              <span className={styles.controlsLayoutSelectWrap}>
                <select
                  className={styles.controlsLayoutSelect}
                  aria-label="Layout selector"
                  value={activeControlLayout}
                  onChange={(event) => {
                    const nextLayoutLabel = event.target.value;
                    const nextLayout = CONTROL_LAYOUTS.find((layout) => layout.label === nextLayoutLabel) ?? CONTROL_LAYOUTS[0];
                    setActiveControlLayout(nextLayout.label);
                    setActiveControlTab(nextLayout.tabs[0]?.title ?? CONTROL_LAYOUTS[0].tabs[0].title);
                    setActiveControlGroup("");
                    controlsNavigationRef.current?.removeAttribute("open");
                  }}
                >
                  {CONTROL_LAYOUTS.map((layout) => (
                    <option key={layout.id} value={layout.label}>
                      {layout.label}
                    </option>
                  ))}
                </select>
              </span>
              <div className={styles.controlsNavList} role="tablist" aria-label="Configuration tabs">
                {selectedControlLayout.tabs.map((tab) => (
                  <button
                    key={tab.title}
                    type="button"
                    className={selectedControlTab.title === tab.title ? styles.controlsNavActive : styles.controlsNavButton}
                    onClick={() => {
                      setActiveControlTab(tab.title);
                      setActiveControlGroup("");
                      controlsNavigationRef.current?.removeAttribute("open");
                    }}
                  >
                    <s-icon type={getControlTabIcon(tab.title)} size="small"></s-icon>
                    {tab.title}
                  </button>
                ))}
              </div>
              {hasNestedControlGroups ? (
                <div className={styles.controlsSubNavList} aria-label={`${selectedControlTab.title} sections`}>
                  {selectedControlGroupTitles.map((groupTitle) => (
                    <button
                      key={groupTitle}
                      type="button"
                      className={selectedControlGroupTitle === groupTitle ? styles.controlsSubNavActive : styles.controlsSubNavButton}
                      onClick={() => {
                        setActiveControlGroup(groupTitle);
                        controlsNavigationRef.current?.removeAttribute("open");
                      }}
                    >
                      {groupTitle}
                    </button>
                  ))}
                </div>
              ) : null}
              </aside>
            </details>
            <section className={styles.controlsContentColumn}>
              <ControlsContentCards
                title={hasNestedControlGroups ? selectedControlGroupTitle : selectedControlTab.contentTitle ?? selectedControlTab.title}
                description={hasNestedControlGroups ? undefined : selectedControlTab.contentDescription ?? selectedControlTab.description}
                fields={selectedControlFields}
                values={controlFieldValues}
                onFieldChange={(label, value) => setControlFieldValues((current) => ({ ...current, [label]: value }))}
                onFieldAction={(label) => {
                  if (label === "Cart Messaging") {
                    setSettingsView("language");
                    setActiveLanguagePanel("cartCheckout");
                    return;
                  }
                  if (label === "Track inventory on Add To Cart (in beta)") {
                    setSettingsHelpArticle("inventory");
                  }
                }}
              />
            </section>
          </section>
          <SettingsContextualSaveBar isOpen={isActiveSubpageDirty} onDiscard={discardActiveSettingsChanges} onSave={saveActiveSettingsChanges} />
          <SettingsHelpModal article={settingsHelpArticle} onClose={() => setSettingsHelpArticle(null)} />
          <SettingsVariablesModal modal={settingsVariablesModal} onClose={() => setSettingsVariablesModal(null)} />
          <SettingsToast message={saveMessage} onDismiss={() => setSaveMessage(null)} />
        </main>
      </>
    );
  }

  return (
    <>
      <ui-title-bar title="Settings" />
      <main className={styles.page}>
        <header className={styles.hero}>
          <div>
            <h1 className={styles.title}>Settings</h1>
          </div>
        </header>

        <section className={styles.cardGrid} aria-label="Settings sections">
          {SETTINGS_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              className={styles.settingCard}
              aria-label={`Open ${card.title} settings`}
              onClick={() => setSettingsView(card.id)}
            >
              <span className={styles.settingsCardContent}>
                <SettingsCardIcon icon={card.icon} />
                <h2 className={styles.cardTitle}>{card.title}</h2>
                <p className={styles.cardDescription}>{card.description}</p>
              </span>
            </button>
          ))}
        </section>
        <SettingsToast message={saveMessage} onDismiss={() => setSaveMessage(null)} />
      </main>
    </>
  );
}
