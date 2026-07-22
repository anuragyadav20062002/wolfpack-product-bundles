import { useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type {
  BundleContractType,
  TemplateKey,
} from "../../../lib/bundle-config/template-selection";
import styles from "./DesignSettingsView.module.css";

export type DesignPreviewViewport = "desktop" | "mobile";

export type DesignPreviewState = {
  bundleType: BundleContractType;
  templateKey: TemplateKey;
  viewport: DesignPreviewViewport;
};

type PreviewBundle = {
  id: string;
  name: string;
  type: string;
  viewUrl: string | null;
};

type DesignPreviewTemplate = {
  key: TemplateKey;
  bundleType: BundleContractType;
  translationKey: string;
  layout: "sidebar" | "stacked" | "compact" | "horizontal" | "list" | "grid" | "horizontal-slots" | "vertical-slots";
};

export const DESIGN_PREVIEW_TEMPLATES: readonly DesignPreviewTemplate[] = [
  { key: "standard", bundleType: "full_page", translationKey: "settingsDcp.preview.templates.standard", layout: "sidebar" },
  { key: "classic", bundleType: "full_page", translationKey: "settingsDcp.preview.templates.classic", layout: "stacked" },
  { key: "compact", bundleType: "full_page", translationKey: "settingsDcp.preview.templates.compact", layout: "compact" },
  { key: "horizontal", bundleType: "full_page", translationKey: "settingsDcp.preview.templates.horizontal", layout: "horizontal" },
  { key: "product-list", bundleType: "product_page", translationKey: "settingsDcp.preview.templates.productList", layout: "list" },
  { key: "product-grid", bundleType: "product_page", translationKey: "settingsDcp.preview.templates.productGrid", layout: "grid" },
  { key: "horizontal-slots", bundleType: "product_page", translationKey: "settingsDcp.preview.templates.horizontalSlots", layout: "horizontal-slots" },
  { key: "vertical-slots", bundleType: "product_page", translationKey: "settingsDcp.preview.templates.verticalSlots", layout: "vertical-slots" },
] as const;

export function getDefaultTemplateKey(bundleType: BundleContractType): TemplateKey {
  return bundleType === "full_page" ? "standard" : "product-list";
}

export function isTemplateValidForBundleType(
  bundleType: BundleContractType,
  templateKey: TemplateKey,
) {
  return DESIGN_PREVIEW_TEMPLATES.some(
    (template) => template.bundleType === bundleType && template.key === templateKey,
  );
}

export function createDesignPreviewState(
  bundleType: BundleContractType = "full_page",
): DesignPreviewState {
  return {
    bundleType,
    templateKey: getDefaultTemplateKey(bundleType),
    viewport: "desktop",
  };
}

export function setDesignPreviewBundleType(
  state: DesignPreviewState,
  bundleType: BundleContractType,
): DesignPreviewState {
  return {
    ...state,
    bundleType,
    templateKey: getDefaultTemplateKey(bundleType),
  };
}

export function setDesignPreviewTemplate(
  state: DesignPreviewState,
  templateKey: TemplateKey,
): DesignPreviewState {
  if (!isTemplateValidForBundleType(state.bundleType, templateKey)) {
    throw new Error(`Invalid Design preview template "${templateKey}" for ${state.bundleType}`);
  }
  return { ...state, templateKey };
}

export function setDesignPreviewViewport(
  state: DesignPreviewState,
  viewport: DesignPreviewViewport,
): DesignPreviewState {
  return { ...state, viewport };
}

export function DesignLivePreview({
  previewBundle,
  previewVariables,
  initialState,
}: {
  previewBundle: PreviewBundle;
  previewVariables: CSSProperties;
  initialState?: DesignPreviewState;
}) {
  const { t } = useTranslation();
  const [previewState, setPreviewState] = useState<DesignPreviewState>(
    initialState ?? createDesignPreviewState(),
  );
  const availableTemplates = DESIGN_PREVIEW_TEMPLATES.filter(
    (template) => template.bundleType === previewState.bundleType,
  );
  const activeTemplate = DESIGN_PREVIEW_TEMPLATES.find(
    (template) => template.key === previewState.templateKey,
  ) ?? DESIGN_PREVIEW_TEMPLATES[0];
  const isSlotTemplate = activeTemplate.layout === "horizontal-slots"
    || activeTemplate.layout === "vertical-slots";

  return (
    <section className={styles.previewPanel} aria-label="Live bundle preview">
      <div className={styles.previewHeader}>
        <div>
          <h2>{t("settingsDcp.preview.heading")}</h2>
          <p>{t("settingsDcp.preview.unsaved")}</p>
        </div>
        <div className={styles.previewControls}>
          <s-select
            label={t("settingsDcp.preview.bundleType.label")}
            value={previewState.bundleType}
            onChange={(event: Event) => {
              const bundleType = (event.target as HTMLSelectElement).value as BundleContractType;
              setPreviewState((current) => setDesignPreviewBundleType(current, bundleType));
            }}
          >
            <s-option value="full_page">{t("settingsDcp.preview.bundleType.landingPage")}</s-option>
            <s-option value="product_page">{t("settingsDcp.preview.bundleType.productPage")}</s-option>
          </s-select>
          <s-select
            label={t("settingsDcp.preview.templateLabel")}
            value={previewState.templateKey}
            onChange={(event: Event) => {
              const templateKey = (event.target as HTMLSelectElement).value as TemplateKey;
              setPreviewState((current) => setDesignPreviewTemplate(current, templateKey));
            }}
          >
            {availableTemplates.map((template) => (
              <s-option key={template.key} value={template.key}>
                {t(template.translationKey)}
              </s-option>
            ))}
          </s-select>
          <div className={styles.viewportButtons} aria-label={t("settingsDcp.preview.viewport.label")}>
            {(["desktop", "mobile"] as const).map((viewport) => {
              const isActive = previewState.viewport === viewport;
              const label = t(`settingsDcp.preview.viewport.${viewport}`);
              const tooltipId = `settings-design-preview-${viewport}-tooltip`;
              return (
                <span key={viewport} className={styles.viewportButton} data-selected={isActive || undefined}>
                  <s-button
                    icon={viewport}
                    variant={isActive ? "primary" : "secondary"}
                    accessibilityLabel={label}
                    interestFor={tooltipId}
                    aria-pressed={isActive}
                    onClick={() => setPreviewState((current) => setDesignPreviewViewport(current, viewport))}
                  />
                  <s-tooltip id={tooltipId}>{label}</s-tooltip>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.previewStage} data-preview-viewport={previewState.viewport}>
        <div
          className={styles.previewSurface}
          data-template-key={previewState.templateKey}
          data-template-layout={activeTemplate.layout}
          style={previewVariables}
        >
          <header className={styles.previewHero}>
            <span>{t(previewState.bundleType === "full_page"
              ? "settingsDcp.preview.bundleType.landingPage"
              : "settingsDcp.preview.bundleType.productPage")}</span>
            <h3>{previewBundle.name}</h3>
            <p>{t("settingsDcp.preview.surface.description")}</p>
          </header>
          <nav className={styles.previewTabs} aria-label={t("settingsDcp.preview.surface.navigationLabel")}>
            <span data-active="true">{t("settingsDcp.preview.surface.stepOne")}</span>
            <span>{t("settingsDcp.preview.surface.stepTwo")}</span>
          </nav>
          <div className={styles.previewBody}>
            <div className={styles.previewProducts}>
              {["first", "second"].map((productKey) => (
                <article key={productKey} className={styles.previewProductCard}>
                  <div className={styles.previewProductImage} aria-hidden="true">
                    <s-icon type="product" size="base" />
                  </div>
                  <span className={styles.previewProductCopy}>
                    <strong>{t(`settingsDcp.preview.surface.products.${productKey}.name`)}</strong>
                    <span>{t(`settingsDcp.preview.surface.products.${productKey}.price`)}</span>
                  </span>
                  <button type="button" disabled aria-label={t("settingsDcp.preview.previewOnly")}>
                    {t("settingsDcp.preview.surface.add")}
                  </button>
                </article>
              ))}
            </div>
            {isSlotTemplate ? (
              <div className={styles.previewSlots} aria-label={t("settingsDcp.preview.surface.slotsLabel")}>
                {[1, 2, 3].map((slot) => (
                  <span key={slot}><s-icon type="plus" size="small" /></span>
                ))}
              </div>
            ) : null}
            <aside className={styles.previewUpsell}>
              <span>
                <strong>{t("settingsDcp.preview.surface.upsellTitle")}</strong>
                <small>{t("settingsDcp.preview.surface.upsellBody")}</small>
              </span>
              <button type="button" disabled aria-label={t("settingsDcp.preview.previewOnly")}>
                {t("settingsDcp.preview.surface.add")}
              </button>
            </aside>
          </div>
          <footer className={styles.previewCart}>
            <span>
              <strong>{t("settingsDcp.preview.surface.summary")}</strong>
              <small>{t("settingsDcp.preview.surface.total")}</small>
            </span>
            <button type="button" disabled aria-label={t("settingsDcp.preview.previewOnly")}>
              {t("settingsDcp.preview.surface.next")}
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}
