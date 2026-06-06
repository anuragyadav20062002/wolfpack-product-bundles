import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import type { Prisma } from "@prisma/client";
import { useEffect, useState } from "react";
import { BundleType } from "../../constants/bundle";
import { prisma } from "../../db.server";
import { requireAdminSession } from "../../lib/auth-guards.server";
import {
  CONTROL_LAYOUTS,
  DESIGN_CONFIGURATION,
  EXPERT_COLOR_CONTROLS,
  LANGUAGE_CONFIGURATION,
  SETTINGS_CARDS,
  SUPPORTED_LANGUAGE_LABELS,
  type SettingsField,
  type SettingsCardId,
} from "../../lib/admin-configuration-surfaces";
import { SETTINGS_CONTROLS_BUNDLE_TYPES, buildSettingsControlsRuntime } from "../../lib/settings-controls-runtime";
import { SETTINGS_DESIGN_BUNDLE_TYPES, buildSettingsDesignRuntime } from "../../lib/settings-design-runtime";
import { SETTINGS_LANGUAGE_BUNDLE_TYPES, buildSettingsLanguageRuntime } from "../../lib/settings-language-runtime";
import styles from "../../styles/routes/admin-configuration-surfaces.module.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await requireAdminSession(request);
  const settings = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId: session.shop, bundleType: "product_page" } },
  });
  const previewBundles = await prisma.bundle.findMany({
    where: {
      shopId: session.shop,
      OR: [
        { shopifyProductHandle: { not: null } },
        { shopifyPageHandle: { not: null } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: {
      id: true,
      name: true,
      bundleType: true,
      shopifyProductHandle: true,
      shopifyPageHandle: true,
    },
  });
  const generalSettings = settings?.generalSettings && typeof settings.generalSettings === "object"
    ? settings.generalSettings as Record<string, unknown>
    : {};
  return json({
    settingsPage: generalSettings.settingsPage && typeof generalSettings.settingsPage === "object"
      ? generalSettings.settingsPage as Record<string, unknown>
      : null,
    previewBundles: previewBundles.map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      type: bundle.bundleType === "full_page" ? "Landing Page" : "Product Page",
      viewUrl: bundle.bundleType === "full_page"
        ? bundle.shopifyPageHandle
          ? `https://${session.shop}/pages/${bundle.shopifyPageHandle}`
          : null
        : bundle.shopifyProductHandle
          ? `https://${session.shop}/products/${bundle.shopifyProductHandle}`
          : null,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await requireAdminSession(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const payloadValue = String(formData.get("payload") ?? "{}");
  const payload = JSON.parse(payloadValue) as Record<string, unknown>;

  if (
    intent !== "saveSettingsDesign"
    && intent !== "saveSettingsLanguage"
    && intent !== "saveSettingsControls"
  ) {
    return json({ success: false, message: "Unsupported Settings action" }, { status: 400 });
  }

  const current = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId: session.shop, bundleType: "product_page" } },
  });
  const currentGeneralSettings = current?.generalSettings && typeof current.generalSettings === "object"
    ? current.generalSettings as Record<string, unknown>
    : {};
  const currentSettingsPage = currentGeneralSettings.settingsPage && typeof currentGeneralSettings.settingsPage === "object"
    ? currentGeneralSettings.settingsPage as Record<string, unknown>
    : {};
  const nextSettingsPage = {
    ...currentSettingsPage,
    ...(intent === "saveSettingsDesign" ? { design: payload } : {}),
    ...(intent === "saveSettingsLanguage" ? { language: payload } : {}),
    ...(intent === "saveSettingsControls" ? { controls: payload } : {}),
  };
  if (intent === "saveSettingsDesign") {
    const designRuntime = buildSettingsDesignRuntime(payload);

    await Promise.all(SETTINGS_DESIGN_BUNDLE_TYPES.map(async (bundleType) => {
      const currentForBundleType = bundleType === BundleType.PRODUCT_PAGE
        ? current
        : await prisma.designSettings.findUnique({
          where: { shopId_bundleType: { shopId: session.shop, bundleType } },
        });
      const currentBundleGeneralSettings = currentForBundleType?.generalSettings && typeof currentForBundleType.generalSettings === "object"
        ? currentForBundleType.generalSettings as Record<string, unknown>
        : {};
      const nextBundleGeneralSettings = {
        ...currentBundleGeneralSettings,
        ...(designRuntime.designSettings.generalSettings as Record<string, unknown>),
        settingsPage: nextSettingsPage,
      };
      const updateData = {
        ...designRuntime.designSettings,
        generalSettings: nextBundleGeneralSettings as Prisma.InputJsonValue,
      } as Prisma.DesignSettingsUncheckedUpdateInput;

      await prisma.designSettings.upsert({
        where: { shopId_bundleType: { shopId: session.shop, bundleType } },
        create: {
          shopId: session.shop,
          bundleType,
          ...updateData,
        } as Prisma.DesignSettingsUncheckedCreateInput,
        update: updateData,
      });
    }));

    return json({ success: true, message: "Settings saved successfully" });
  }

  if (intent === "saveSettingsLanguage") {
    const languageRuntime = buildSettingsLanguageRuntime(payload);

    await Promise.all(SETTINGS_LANGUAGE_BUNDLE_TYPES.map(async (bundleType) => {
      const currentForBundleType = bundleType === BundleType.PRODUCT_PAGE
        ? current
        : await prisma.designSettings.findUnique({
          where: { shopId_bundleType: { shopId: session.shop, bundleType } },
        });
      const currentBundleGeneralSettings = currentForBundleType?.generalSettings && typeof currentForBundleType.generalSettings === "object"
        ? currentForBundleType.generalSettings as Record<string, unknown>
        : {};
      const nextBundleSettingsPage = {
        ...(currentBundleGeneralSettings.settingsPage && typeof currentBundleGeneralSettings.settingsPage === "object"
          ? currentBundleGeneralSettings.settingsPage as Record<string, unknown>
          : {}),
        language: payload,
      };
      const nextBundleGeneralSettings = {
        ...currentBundleGeneralSettings,
        settingsLanguage: languageRuntime.settingsLanguage,
        settingsPage: nextBundleSettingsPage,
      };
      const updateData = {
        buttonAddToCartText: languageRuntime.buttonAddToCartText,
        generalSettings: nextBundleGeneralSettings as Prisma.InputJsonValue,
      } as Prisma.DesignSettingsUncheckedUpdateInput;

      await prisma.designSettings.upsert({
        where: { shopId_bundleType: { shopId: session.shop, bundleType } },
        create: {
          shopId: session.shop,
          bundleType,
          ...updateData,
        } as Prisma.DesignSettingsUncheckedCreateInput,
        update: updateData,
      });
    }));

    return json({ success: true, message: "Settings saved successfully" });
  }

  if (intent === "saveSettingsControls") {
    const controlsRuntime = buildSettingsControlsRuntime(payload);

    await Promise.all(SETTINGS_CONTROLS_BUNDLE_TYPES.map(async (bundleType) => {
      const currentForBundleType = bundleType === BundleType.PRODUCT_PAGE
        ? current
        : await prisma.designSettings.findUnique({
          where: { shopId_bundleType: { shopId: session.shop, bundleType } },
        });
      const currentBundleGeneralSettings = currentForBundleType?.generalSettings && typeof currentForBundleType.generalSettings === "object"
        ? currentForBundleType.generalSettings as Record<string, unknown>
        : {};
      const nextBundleSettingsPage = {
        ...(currentBundleGeneralSettings.settingsPage && typeof currentBundleGeneralSettings.settingsPage === "object"
          ? currentBundleGeneralSettings.settingsPage as Record<string, unknown>
          : {}),
        controls: payload,
      };
      const nextBundleGeneralSettings = {
        ...currentBundleGeneralSettings,
        settingsControls: controlsRuntime.settingsControls,
        settingsPage: nextBundleSettingsPage,
      };
      const updateData = {
        customCss: bundleType === BundleType.FULL_PAGE
          ? controlsRuntime.fullPageCustomCss
          : controlsRuntime.productPageCustomCss,
        bundleCartLineMessaging: controlsRuntime.bundleCartLineMessaging as Prisma.InputJsonValue,
        generalSettings: nextBundleGeneralSettings as Prisma.InputJsonValue,
      } as Prisma.DesignSettingsUncheckedUpdateInput;

      await prisma.designSettings.upsert({
        where: { shopId_bundleType: { shopId: session.shop, bundleType } },
        create: {
          shopId: session.shop,
          bundleType,
          ...updateData,
        } as Prisma.DesignSettingsUncheckedCreateInput,
        update: updateData,
      });
    }));
  }

  return json({ success: true, message: "Settings saved successfully" });
}

function getInitialLanguageFieldValues() {
  return Object.fromEntries(
    [
      ...LANGUAGE_CONFIGURATION.sharedCartFields,
      ...LANGUAGE_CONFIGURATION.productCardFields,
      ...Object.values(LANGUAGE_CONFIGURATION.templateFields).flatMap((groups) =>
        groups.flatMap((group) => group.fields),
      ),
      ...Object.values(LANGUAGE_CONFIGURATION.productPageTemplateFields).flatMap((groups) =>
        groups.flatMap((group) => group.fields),
      ),
    ].map((field) => [
      getFieldValueKey(field),
      field.value ?? "",
    ]),
  ) as Record<string, string>;
}

function getInitialControlFieldValues() {
  return Object.fromEntries(
    CONTROL_LAYOUTS.flatMap((layout) => layout.tabs.flatMap((tab) => tab.fields.map((field) => [
      field.label,
      field.value ?? "",
    ]))),
  ) as Record<string, string>;
}

function getInitialDesignFieldValues() {
  return Object.fromEntries(
    [
      ...DESIGN_CONFIGURATION.flatMap((tab) => tab.fields),
      ...Object.values(EXPERT_COLOR_CONTROLS).flat(),
    ].map((field) => [
      field.key ?? field.label,
      field.value ?? "",
    ]),
  ) as Record<string, string>;
}

function getFieldValueKey(field: SettingsField) {
  return field.key ?? field.label;
}

export default function SettingsRoute() {
  const { settingsPage, previewBundles } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
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
  const persistedDesignState = settingsPage?.design && typeof settingsPage.design === "object"
    ? settingsPage.design as { fieldValues?: Record<string, string>; isExpertControlsEnabled?: boolean }
    : null;
  const [activeCard, setActiveCard] = useState<SettingsCardId>("design");
  const [settingsView, setSettingsView] = useState<"landing" | "design" | "language" | "controls">("landing");
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
    ...(persistedDesignState?.fieldValues ?? {}),
  });
  const [savedDesignFieldValues, setSavedDesignFieldValues] = useState<Record<string, string>>({
    ...getInitialDesignFieldValues(),
    ...(persistedDesignState?.fieldValues ?? {}),
  });
  const [activeControlLayout, setActiveControlLayout] = useState(CONTROL_LAYOUTS[0].label);
  const [activeControlTab, setActiveControlTab] = useState(CONTROL_LAYOUTS[0].tabs[0].title);
  const [activeControlGroup, setActiveControlGroup] = useState("");
  const [isExpertColorControls, setIsExpertColorControls] = useState(persistedDesignState?.isExpertControlsEnabled ?? false);
  const [savedIsExpertColorControls, setSavedIsExpertColorControls] = useState(persistedDesignState?.isExpertControlsEnabled ?? false);
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
      submit({
        intent: "saveSettingsDesign",
        payload: JSON.stringify(currentDesignState),
      }, { method: "post" });
      setSavedDesignFieldValues(designFieldValues);
      setSavedIsExpertColorControls(isExpertColorControls);
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
    setSaveMessage(actionData.success ? "Settings saved successfully" : actionData.message || "Something went wrong");
  }, [actionData]);

  if (settingsView === "design") {
    const selectedDesignFields = isExpertColorControls && selectedDesignTab.title === "Brand Colors" && isExpertScopeActive
      ? EXPERT_COLOR_CONTROLS[activeDesignScope] ?? EXPERT_COLOR_CONTROLS.General
      : selectedDesignTab.fields;
    const isBrandColorsPanelGated = isExpertColorControls && selectedDesignTab.title === "Brand Colors" && !isExpertScopeActive;
    const resetSelectedDesignTab = () => {
      setDesignFieldValues((current) => ({
        ...current,
        ...Object.fromEntries(selectedDesignFields.map((field) => [field.key ?? field.label, field.value ?? ""])),
      }));
    };

    return (
      <>
        <ui-title-bar title="Design Control Panel" />
        <main className={styles.page}>
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
            <aside className={styles.designSidebar}>
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
            <section className={styles.designContentCard}>
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
              onClick={() => setSettingsView("landing")}
            >
              <s-icon type="arrow-left" size="small"></s-icon>
            </button>
            <h1 className={styles.title}>Language Configurations</h1>
          </header>

          <section className={styles.languageTopCard} aria-label="Language mode">
            <div className={styles.languageTopCopy}>
              <label className={styles.languageSwitchRow}>
                <span>
                  <span className={styles.languageTopTitle}>Enable Multilanguage</span>
                  <span className={styles.languageTopHelp}>Select the language mode for your app</span>
                </span>
                <input
                  className={styles.languageSwitch}
                  type="checkbox"
                  checked={isMultilanguageEnabled}
                  onChange={(event) => setIsMultilanguageEnabled(event.currentTarget.checked)}
                />
              </label>
            </div>
            <label className={styles.languageSelectStack}>
              <span>Add preferred languages</span>
              <span className={styles.ebSelectWrap}>
                <select
                  className={styles.ebSelect}
                  value={selectedLanguage}
                  onChange={(event) => setSelectedLanguage(event.currentTarget.value)}
                >
                  {SUPPORTED_LANGUAGE_LABELS.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </section>

          <section className={styles.languageEditorCard} aria-label="Language Configurations">
            <button type="button" className={styles.languageSelectedChip}>
              {selectedLanguage}
            </button>
            <div className={styles.languageContentLayout}>
              <aside className={styles.languageSidebarCard}>
                <section className={styles.languageSidebarSection}>
                  <h2 className={styles.languageSidebarTitle}>Shared Components</h2>
                  <p className={styles.languageSidebarDescription}>Customize language for components across all templates</p>
                  <button
                    type="button"
                    className={activeLanguagePanel === "cartCheckout" ? styles.languageSharedButtonActive : styles.languageSharedButton}
                    onClick={() => setActiveLanguagePanel("cartCheckout")}
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
                        onClick={() => setActiveLanguagePanel(section)}
                      >
                        <span className={styles.languageNavIcon} aria-hidden="true" />
                        {section}
                      </button>
                    ))}
                  </div>
                </section>
              </aside>
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
                onClick={() => setSettingsView("landing")}
              >
                <s-icon type="arrow-left" size="small"></s-icon>
              </button>
              <h1 className={styles.title}>Additional Configurations</h1>
            </div>
          </header>

          <section className={styles.controlsLayout} aria-label="Additional Configurations">
            <aside className={styles.controlsSidebarCard}>
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
                      onClick={() => setActiveControlGroup(groupTitle)}
                    >
                      {groupTitle}
                    </button>
                  ))}
                </div>
              ) : null}
            </aside>
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
              onClick={() => {
                if (card.id === "design") {
                  setActiveCard(card.id);
                  setSettingsView("design");
                  return;
                }
                if (card.id === "language") {
                  setActiveCard(card.id);
                  setSettingsView("language");
                  return;
                }
                if (card.id === "controls") {
                  setActiveCard(card.id);
                  setSettingsView("controls");
                  return;
                }
                setActiveCard(card.id);
              }}
            >
              <span className={styles.settingsCardContent}>
                <SettingsCardIcon icon={card.icon} />
                <h2 className={styles.cardTitle}>{card.title}</h2>
                <p className={styles.cardDescription}>{card.description}</p>
              </span>
              <span className={styles.settingsConfigureButton}>{card.actionLabel}</span>
            </button>
          ))}
        </section>
        <SettingsToast message={saveMessage} onDismiss={() => setSaveMessage(null)} />
      </main>
    </>
  );
}

function SettingsCardIcon({ icon }: { icon: string }) {
  return (
    <span className={styles.settingsCardIcon} aria-hidden="true">
      <s-icon type={icon as any} size="base"></s-icon>
    </span>
  );
}

function DesignFields({
  title,
  fields,
  values,
  onFieldChange,
}: {
  title?: string;
  fields: SettingsField[];
  values: Record<string, string>;
  onFieldChange: (label: string, value: string) => void;
}) {
  const defaultGroup = title ?? "";
  const groupedFields = fields.reduce<Array<{ title: string; fields: SettingsField[] }>>((groups, field) => {
    const groupTitle = field.group ?? defaultGroup;
    const existing = groups.find((group) => group.title === groupTitle);
    if (existing) {
      existing.fields.push(field);
    } else {
      groups.push({ title: groupTitle, fields: [field] });
    }
    return groups;
  }, []);
  const colorPickerValue = (value: string, fallback: string) => {
    const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
      return hex;
    }
    const shortHex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
    return shortHex ? `#${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}${shortHex[3]}${shortHex[3]}` : "#000000";
  };

  return (
    <div className={styles.designFieldStack}>
      {groupedFields.map((group) => {
        const guideUrl = group.fields.find((field) => field.guideUrl)?.guideUrl;

        return (
          <section key={group.title} className={styles.designFieldGroup}>
            {group.title ? (
              <div className={styles.designFieldPanelHeader}>
                <h2>{group.title}</h2>
                {guideUrl ? (
                  <a href={guideUrl} target="_blank" rel="noreferrer" className={styles.designGuideLink}>
                    Show Color Guide
                  </a>
                ) : null}
              </div>
            ) : null}
            {group.fields.map((field) => {
              const fieldKey = field.key ?? field.label;
              const value = values[fieldKey] ?? field.value ?? "";
              const colorValue = colorPickerValue(value, field.value || "#000000");

              return (
                <label key={`${group.title}:${field.label}`} className={styles.designFieldRow}>
                  <span className={styles.designFieldCopy}>
                    <span className={styles.designFieldLabel}>{field.label}</span>
                    {field.description && <span className={styles.designFieldHelp}>{field.description}</span>}
                  </span>
                  {field.kind === "color" ? (
                    <span className={styles.designColorControl}>
                      <input
                        type="color"
                        value={colorValue}
                        aria-label={`${field.label} color`}
                        onChange={(event) => onFieldChange(fieldKey, event.currentTarget.value)}
                      />
                      <input
                        value={value}
                        aria-label={`${field.label} Hex Code`}
                        onChange={(event) => onFieldChange(fieldKey, event.currentTarget.value)}
                      />
                    </span>
                  ) : field.kind === "select" ? (
                    <select
                      className={styles.designInput}
                      value={value || field.options?.[0] || ""}
                      onChange={(event) => onFieldChange(fieldKey, event.currentTarget.value)}
                    >
                      {(field.options?.length ? field.options : [field.value ?? ""]).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={styles.designInput}
                      value={value}
                      onChange={(event) => onFieldChange(fieldKey, event.currentTarget.value)}
                    />
                  )}
                </label>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

function BundlePreviewModal({
  isOpen,
  bundles,
  onClose,
}: {
  isOpen: boolean;
  bundles: Array<{ id: string; name: string; type: string; viewUrl: string | null }>;
  onClose: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.settingsModalBackdrop} role="presentation">
      <section className={styles.bundlePreviewModal} role="dialog" aria-modal="true" aria-labelledby="bundle-preview-title">
        <div className={styles.bundlePreviewHeader}>
          <h2 id="bundle-preview-title">Bundle Preview</h2>
          <button type="button" className={styles.settingsModalDismiss} aria-label="Dismiss Bundle Preview" onClick={onClose}>
            X
          </button>
        </div>
        <div className={styles.bundlePreviewGridHeader}>
          <span>Bundle Name</span>
          <span>Type</span>
          <span aria-hidden="true" />
        </div>
        <div className={styles.bundlePreviewRows}>
          {bundles.length === 0 ? (
            <p className={styles.emptyLanguageState}>No storefront-ready bundles are available for preview.</p>
          ) : bundles.map((bundle) => (
            <div key={bundle.id} className={styles.bundlePreviewRow}>
              <span className={styles.bundlePreviewName}>{bundle.name}</span>
              <span>{bundle.type}</span>
              <button
                type="button"
                className={styles.bundlePreviewViewButton}
                disabled={!bundle.viewUrl}
                onClick={() => {
                  if (bundle.viewUrl) {
                    window.open(bundle.viewUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function getControlTabIcon(title: string) {
  if (title === "CSS & Scripts") {
    return "note";
  }
  if (title === "Integrations") {
    return "plus";
  }
  if (title === "Advanced") {
    return "filter";
  }
  return "info";
}

function getDesignIconKey(title: string) {
  if (title === "Brand Colors") {
    return "edit";
  }
  if (title === "Typography") {
    return "note";
  }
  if (title === "Corners") {
    return "edit";
  }
  if (title === "Images & GIFs") {
    return "upload";
  }
  if (title === "Product Card") {
    return "product";
  }
  if (title === "Bundle Cart") {
    return "product";
  }
  if (title === "Upsell") {
    return "plus";
  }
  return "info";
}

function ControlsContentCards({
  title,
  description,
  fields,
  values,
  onFieldChange,
  onFieldAction,
}: {
  title: string;
  description?: string;
  fields: SettingsField[];
  values: Record<string, string>;
  onFieldChange: (label: string, value: string) => void;
  onFieldAction?: (label: string) => void;
}) {
  const fieldGroups = fields.reduce<Array<{ title: string; fields: SettingsField[] }>>((groups, field) => {
    const groupTitle = field.group || title;
    const existingGroup = groups.find((group) => group.title === groupTitle);
    if (existingGroup) {
      existingGroup.fields.push(field);
      return groups;
    }
    groups.push({ title: groupTitle, fields: [field] });
    return groups;
  }, []);

  return (
    <>
      {fieldGroups.map((group, index) => (
        <section key={`${title}-${group.title}`} className={styles.controlsContentCard}>
          <div className={styles.controlsCardHeader}>
            <div>
              <h3>{group.title}</h3>
              {index === 0 && description && <p>{description}</p>}
            </div>
            {group.title === "Cart Messaging" && (
              <button
                type="button"
                className={styles.controlsEditLanguageButton}
                onClick={() => onFieldAction?.("Cart Messaging")}
              >
                Edit Language
              </button>
            )}
          </div>
          <div className={styles.controlsCardFields}>
            {group.fields.map((field) => {
              const displayField = group.title === "Cart Messaging" && field.label === "Cart Messaging"
                ? { ...field, description: undefined }
                : field;

              return (
                <ControlsField
                  key={`${title}-${field.label}`}
                  field={displayField}
                  value={values[field.label] ?? ""}
                  onChange={(value) => onFieldChange(field.label, value)}
                  onAction={onFieldAction ? () => onFieldAction(field.label) : undefined}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function getSettingsVariables(fields: SettingsField[], values: Record<string, string>) {
  const variables = new Set<string>();
  for (const field of fields) {
    const value = String(values[getFieldValueKey(field)] ?? field.value ?? "");
    const matches = value.match(/\{\{[^{}]+\}\}/g) ?? [];
    for (const match of matches) {
      variables.add(match);
    }
  }
  return Array.from(variables);
}

function SettingsVariablesModal({
  modal,
  onClose,
}: {
  modal: { title: string; variables: string[] } | null;
  onClose: () => void;
}) {
  if (!modal) {
    return null;
  }

  return (
    <div className={styles.settingsModalBackdrop} role="presentation">
      <section className={styles.settingsVariablesModal} role="dialog" aria-modal="true" aria-labelledby="settings-variables-title">
        <div className={styles.settingsVariablesHeader}>
          <h2 id="settings-variables-title">Variables</h2>
          <button type="button" className={styles.settingsModalDismiss} aria-label="Dismiss variables modal" onClick={onClose}>
            <s-icon type="x" size="small"></s-icon>
          </button>
        </div>
        <p className={styles.settingsVariablesDescription}>{modal.title}</p>
        <div className={styles.settingsVariablesList}>
          {modal.variables.map((variable) => (
            <code key={variable}>{variable}</code>
          ))}
        </div>
      </section>
    </div>
  );
}

function ControlsFormGroup({
  title,
  description,
  fields,
  values,
  onFieldChange,
  onFieldAction,
  onShowVariables,
}: {
  title: string;
  description?: string;
  fields: SettingsField[];
  values: Record<string, string>;
  onFieldChange: (label: string, value: string) => void;
  onFieldAction?: (label: string) => void;
  onShowVariables?: (title: string, variables: string[]) => void;
}) {
  const fieldGroups = fields.reduce<Array<{ title: string; fields: SettingsField[] }>>((groups, field) => {
    const groupTitle = field.group ?? "";
    const existingGroup = groups.find((group) => group.title === groupTitle);
    if (existingGroup) {
      existingGroup.fields.push(field);
      return groups;
    }
    groups.push({ title: groupTitle, fields: [field] });
    return groups;
  }, []);
  const variables = getSettingsVariables(fields, values);
  const hasVariables = variables.length > 0;

  return (
    <section className={styles.ebControlsPanel}>
      <div>
        <div className={styles.ebSectionHeader}>
          <h3 className={styles.detailTitle}>{title}</h3>
          {hasVariables && (
            <button
              type="button"
              className={styles.ebVariablesButton}
              onClick={() => onShowVariables?.(title, variables)}
            >
              Show Variables
            </button>
          )}
        </div>
        {description && <p className={styles.detailDescription}>{description}</p>}
      </div>
      {fieldGroups.map((group) => (
        <div key={`${title}-${group.title || "default"}`} className={styles.ebControlsSection}>
          {group.title && <h4 className={styles.fieldGroupTitle}>{group.title}</h4>}
          <div className={styles.ebControlsStack}>
            {group.fields.map((field) => (
              <ControlsField
                key={`${title}-${getFieldValueKey(field)}`}
                field={field}
                value={values[getFieldValueKey(field)] ?? ""}
                onChange={(value) => onFieldChange(getFieldValueKey(field), value)}
                onAction={onFieldAction ? () => onFieldAction(field.label) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ControlsField({
  field,
  value,
  onChange,
  onAction,
}: {
  field: SettingsField;
  value: string;
  onChange: (value: string) => void;
  onAction?: () => void;
}) {
  const isChecked = value === "Checked";
  const inputId = `settings-${field.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const hasInlineAction = field.description === "Edit Language" || field.description === "Know More";

  if (field.kind === "toggle") {
    return (
      <label className={styles.ebSettingRow} htmlFor={inputId}>
        <input
          id={inputId}
          className={styles.ebSwitchInput}
          type="checkbox"
          checked={isChecked}
          onChange={(event) => onChange(event.currentTarget.checked ? "Checked" : "")}
        />
        <span className={styles.ebSwitchVisual} aria-hidden="true">
          <s-icon type={isChecked ? "toggle-on" : "toggle-off"} size="small"></s-icon>
        </span>
        <span>
          <span className={hasInlineAction ? styles.ebSettingLabelLine : undefined}>
            <span className={styles.ebSettingLabel}>{field.label}</span>
            {hasInlineAction ? (
            <button
              type="button"
              className={styles.ebInlineAction}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onAction?.();
              }}
            >
              {field.description}
            </button>
            ) : null}
          </span>
          {!hasInlineAction && field.description ? (
            <span className={styles.ebSettingHelp}>{field.description}</span>
          ) : null}
        </span>
      </label>
    );
  }

  if (field.kind === "color") {
    const colorValue = /^#[0-9a-f]{6}$/i.test(value) ? value : field.value || "#000000";

    return (
      <label className={styles.ebFieldStack}>
        <span>{field.label}</span>
        {field.description && <span className={styles.ebSettingHelp}>{field.description}</span>}
        <span className={styles.ebColorInputRow}>
          <input
            className={styles.ebTextInput}
            aria-label={`${field.label} Hex Code`}
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
          <input
            className={styles.ebColorWell}
            type="color"
            value={colorValue}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        </span>
      </label>
    );
  }

  if (field.kind === "select") {
    return (
      <label className={styles.ebFieldStack}>
        <span>{field.label}</span>
            <span className={styles.ebSelectWrap}>
              <select className={styles.ebSelect} value={value || field.options?.[0] || ""} onChange={(event) => onChange(event.currentTarget.value)}>
                {(field.options?.length ? field.options : [field.value ?? ""]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </span>
        {field.description && <span className={styles.ebSettingHelp}>{field.description}</span>}
      </label>
    );
  }

  if (field.kind === "radio") {
    return (
      <fieldset className={styles.ebRadioGroup}>
        <legend>{field.label}</legend>
        {field.description && <span className={styles.ebSettingHelp}>{field.description}</span>}
        {(field.options?.length ? field.options : [field.value ?? ""]).map((option) => (
          <label key={option} className={styles.ebSettingRow}>
            <input
              type="radio"
              name={inputId}
              checked={(value || field.value) === option}
              onChange={() => onChange(option)}
            />
            <span className={styles.ebSettingLabel}>{option}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (field.kind === "script" || field.kind === "css") {
    return (
      <label className={styles.ebFieldStack}>
        <span>{field.label}</span>
        <textarea className={styles.ebTextArea} value={value} rows={4} onChange={(event) => onChange(event.currentTarget.value)} />
        {field.description && <span className={styles.ebSettingHelp}>{field.description}</span>}
        {field.note && <span className={styles.ebFieldNote}>Note: {field.note}</span>}
      </label>
    );
  }

  if (field.kind === "image") {
    return (
      <div className={styles.ebFieldStack}>
        <span>{field.label}</span>
        <img className={styles.ebPreviewImage} src={value || field.value} alt={field.label} />
        {field.description && <span className={styles.ebSettingHelp}>{field.description}</span>}
      </div>
    );
  }

  if (field.kind === "file") {
    return (
      <label className={styles.ebFieldStack}>
        <span>{field.label}</span>
        <input className={styles.ebTextInput} type="file" onChange={() => onChange("Selected")} />
        {field.description && <span className={styles.ebSettingHelp}>{field.description}</span>}
      </label>
    );
  }

  if (field.kind === "button") {
    return (
      <div className={styles.ebFieldStack}>
        <button type="button" className={styles.settingsSecondaryButton} onClick={onAction}>
          {field.value || field.label}
        </button>
        {field.description && <span className={styles.ebSettingHelp}>{field.description}</span>}
      </div>
    );
  }

  return (
    <label className={styles.ebFieldStack}>
      <span>{field.label}</span>
      <input className={styles.ebTextInput} value={value} onChange={(event) => onChange(event.currentTarget.value)} />
      {field.description && <span className={styles.ebSettingHelp}>{field.description}</span>}
      {field.note && <span className={styles.ebFieldNote}>Note: {field.note}</span>}
    </label>
  );
}

function SettingsContextualSaveBar({ isOpen, onDiscard, onSave }: { isOpen: boolean; onDiscard: () => void; onSave: () => void }) {
  useEffect(() => {
    const shopify = (window as typeof window & {
      shopify?: { saveBar?: { show: (id: string) => void; hide: (id: string) => void } };
    }).shopify;

    if (!shopify?.saveBar) {
      return;
    }

    if (isOpen) {
      shopify.saveBar.show("settings-contextual-save-bar");
    } else {
      shopify.saveBar.hide("settings-contextual-save-bar");
    }
  }, [isOpen]);

  return (
    <ui-save-bar id="settings-contextual-save-bar">
      <button type="button" onClick={onDiscard}>
        Discard
      </button>
      <button type="button" variant="primary" onClick={onSave}>
        Save
      </button>
    </ui-save-bar>
  );
}

function SettingsHelpModal({
  article,
  onClose,
}: {
  article: "inventory" | null;
  onClose: () => void;
}) {
  if (!article) {
    return null;
  }

  return (
    <div className={styles.settingsModalBackdrop} role="presentation">
      <section className={styles.settingsModal} role="dialog" aria-modal="true" aria-labelledby="settings-help-title">
        <div className={styles.ebSectionHeader}>
          <h2 id="settings-help-title">Product-level inventory tracking</h2>
          <button type="button" className={styles.settingsModalDismiss} aria-label="Dismiss help modal" onClick={onClose}>
            X
          </button>
        </div>
        <div className={styles.settingsHelpBody}>
          <p>Enable the inventory tracking toggle in Additional Configurations to apply product-level inventory tracking globally to all bundles.</p>
          <ul>
            <li>Each child product should have Shopify Track Quantity enabled.</li>
            <li>Products with zero inventory are not shown in the bundle.</li>
            <li>Digital products should use inventory 0 or below so they are recognized correctly.</li>
            <li>If Track Quantity is disabled, the product may still appear but cannot be added to cart when out of stock.</li>
            <li>If out-of-stock selling is enabled and inventory is above 0, digital-product detection can be restricted.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function SettingsToast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) {
    return null;
  }

  return (
    <div className={styles.settingsToast} role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss save message">
        x
      </button>
    </div>
  );
}

function DetailGroup({
  title,
  description,
  fields,
}: {
  title: string;
  description?: string;
  fields: SettingsField[];
}) {
  const fieldGroups = fields.reduce<Array<{ title: string; fields: SettingsField[] }>>((groups, field) => {
    const groupTitle = field.group ?? "";
    const existingGroup = groups.find((group) => group.title === groupTitle);
    if (existingGroup) {
      existingGroup.fields.push(field);
      return groups;
    }
    groups.push({ title: groupTitle, fields: [field] });
    return groups;
  }, []);

  return (
    <section className={styles.detailGroup}>
      <div>
        <h3 className={styles.detailTitle}>{title}</h3>
        {description && <p className={styles.detailDescription}>{description}</p>}
      </div>
      {fieldGroups.map((group) => (
        <div key={`${title}-${group.title || "default"}`} className={styles.fieldGroup}>
          {group.title && <h4 className={styles.fieldGroupTitle}>{group.title}</h4>}
          <div className={styles.detailGrid}>
            {group.fields.map((field) => (
              <div key={`${title}-${field.label}`} className={styles.fieldCard}>
                <div className={styles.fieldTopLine}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  {field.state && <span className={styles.statePill}>{field.state}</span>}
                </div>
                {field.value !== undefined && (
                  <div className={styles.fieldValue}>{field.value || "Blank"}</div>
                )}
                {field.description && <p className={styles.fieldDescription}>{field.description}</p>}
                {field.options && (
                  <div className={styles.optionRail}>
                    {field.options.map((option) => (
                      <span key={option} className={styles.optionChip}>{option}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
