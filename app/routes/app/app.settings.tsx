import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useState } from "react";
import { requireAdminSession } from "../../lib/auth-guards.server";
import {
  CONTROL_LAYOUTS,
  LANGUAGE_CONFIGURATION,
  SETTINGS_CARDS,
  SUPPORTED_LANGUAGE_LABELS,
  type RecoveredField,
  type SettingsCardId,
} from "../../lib/recovered-admin-surfaces";
import styles from "../../styles/routes/recovered-admin-surfaces.module.css";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdminSession(request);
  return json(null);
}

export default function SettingsRoute() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<SettingsCardId>("design");
  const [settingsView, setSettingsView] = useState<"landing" | "language" | "controls">("landing");
  const [activeControlLayout, setActiveControlLayout] = useState(CONTROL_LAYOUTS[0].label);
  const [activeControlTab, setActiveControlTab] = useState(CONTROL_LAYOUTS[0].tabs[0].title);
  const selectedControlLayout = CONTROL_LAYOUTS.find((layout) => layout.label === activeControlLayout) ?? CONTROL_LAYOUTS[0];
  const selectedControlTab = selectedControlLayout.tabs.find((tab) => tab.title === activeControlTab) ?? selectedControlLayout.tabs[0];

  if (settingsView === "language") {
    return (
      <>
        <ui-title-bar title="Language Configurations" />
        <main className={styles.page}>
          <header className={styles.hero}>
            <button type="button" className={styles.buttonLike} onClick={() => setSettingsView("landing")}>
              Settings
            </button>
            <div>
              <h1 className={styles.title}>Language Configurations</h1>
            </div>
          </header>

          <section className={styles.panel} aria-label="Language Configurations">
            <div className={styles.detailSection}>
              <DetailGroup
                title="Enable Multilanguage"
                fields={[
                  { label: "Select the language mode for your app", value: LANGUAGE_CONFIGURATION.enabled ? "Enabled" : "Disabled", kind: "toggle" },
                  { label: "Add preferred languages", value: LANGUAGE_CONFIGURATION.selectedLanguage, kind: "select" },
                ]}
              />
              <div className={styles.languageRail} aria-label="Supported languages">
                {SUPPORTED_LANGUAGE_LABELS.map((language) => (
                  <span key={language} className={styles.languageChip}>
                    {language}
                  </span>
                ))}
              </div>
              <DetailGroup
                title="Shared Components"
                description="Customize language for components across all templates"
                fields={LANGUAGE_CONFIGURATION.sharedCartFields}
              />
              <div className={styles.languageRail} aria-label="Shared Components actions">
                <span className={styles.languageChip}>Cart &amp; Checkout</span>
              </div>
              <div>
                <h3 className={styles.detailTitle}>Template Language</h3>
                <p className={styles.detailDescription}>Edit language for your landing page or product page template</p>
              </div>
              <div className={styles.languageRail} aria-label="Template Language">
                <span className={styles.languageChip}>Landing Page Layout</span>
                {LANGUAGE_CONFIGURATION.templateSections.map((section) => (
                  <span key={section} className={styles.languageChip}>
                    {section}
                  </span>
                ))}
              </div>
              <div>
                <h3 className={styles.detailTitle}>Product Card</h3>
                <p className={styles.detailDescription}>Product card button text and action labels</p>
              </div>
              <DetailGroup
                title="Button Configuration"
                description="Product card button text and action labels"
                fields={LANGUAGE_CONFIGURATION.productCardFields}
              />
            </div>
          </section>
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
            <button type="button" className={styles.buttonLike} onClick={() => setSettingsView("landing")}>
              Back
            </button>
            <div>
              <h1 className={styles.title}>Additional Configurations</h1>
            </div>
          </header>

          <section className={styles.panel} aria-label="Additional Configurations">
            <p className={styles.panelEyebrow}>App Configurations</p>
            <h2 className={styles.panelTitle}>Configure your bundle settings</h2>
            <label className={styles.layoutSelector}>
              <span>Layout selector</span>
              <select
                className={styles.layoutSelect}
                aria-label="Layout selector"
                value={activeControlLayout}
                onChange={(event) => {
                  const nextLayoutLabel = event.target.value;
                  const nextLayout = CONTROL_LAYOUTS.find((layout) => layout.label === nextLayoutLabel) ?? CONTROL_LAYOUTS[0];
                  setActiveControlLayout(nextLayout.label);
                  setActiveControlTab(nextLayout.tabs[0]?.title ?? CONTROL_LAYOUTS[0].tabs[0].title);
                }}
              >
                {CONTROL_LAYOUTS.map((layout) => (
                  <option key={layout.id} value={layout.label}>
                    {layout.label}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.tabRow} role="tablist" aria-label="Configuration tabs">
              {selectedControlLayout.tabs.map((tab) => (
                <button
                  key={tab.title}
                  type="button"
                  className={selectedControlTab.title === tab.title ? styles.tabActive : ""}
                  onClick={() => setActiveControlTab(tab.title)}
                >
                  {tab.title}
                </button>
              ))}
            </div>
            <DetailGroup
              title={selectedControlTab.contentTitle ?? selectedControlTab.title}
              description={selectedControlTab.contentDescription ?? selectedControlTab.description}
              fields={selectedControlTab.fields}
            />
          </section>
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
              className={`${styles.settingCard} ${activeCard === card.id ? styles.settingCardActive : ""}`}
              onClick={() => {
                if (card.id === "design") {
                  navigate("/app/design-control-panel");
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
              <span>
                <h2 className={styles.cardTitle}>{card.title}</h2>
                <p className={styles.cardDescription}>{card.description}</p>
              </span>
              <span className={styles.buttonLike}>{card.actionLabel}</span>
            </button>
          ))}
        </section>
      </main>
    </>
  );
}

function DetailGroup({
  title,
  description,
  fields,
}: {
  title: string;
  description?: string;
  fields: RecoveredField[];
}) {
  const fieldGroups = fields.reduce<Array<{ title: string; fields: RecoveredField[] }>>((groups, field) => {
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
