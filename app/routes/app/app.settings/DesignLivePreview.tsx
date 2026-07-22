import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  BundleContractType,
  TemplateKey,
} from "../../../lib/bundle-config/template-selection";
import {
  DESIGN_PREVIEW_TEMPLATES,
  getDesignPreviewFieldTarget,
  isDesignPreviewFieldApplicable,
  type DesignPreviewMode,
  type DesignPreviewTemplateDescriptor,
  type DesignPreviewTheme,
} from "./design-preview-model";
import styles from "./DesignSettingsView.module.css";

export { DESIGN_PREVIEW_TEMPLATES } from "./design-preview-model";
export type DesignPreviewViewport = "desktop" | "mobile";

export type DesignPreviewState = {
  bundleType: BundleContractType;
  templateKey: TemplateKey;
  viewport: DesignPreviewViewport;
  mode: DesignPreviewMode;
};

type Translate = (key: string) => string;

const PREVIEW_MODES: readonly DesignPreviewMode[] = ["builder", "loading", "validation", "upsell"];
const PRODUCT_KEYS = ["first", "second", "third", "fourth"] as const;

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
    mode: "builder",
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

export function setDesignPreviewMode(
  state: DesignPreviewState,
  mode: DesignPreviewMode,
): DesignPreviewState {
  return { ...state, mode };
}

function ProductImage({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? styles.previewProductImageCompact : styles.previewProductImage}>
      <img src="/bundle-product-placeholder.png" alt="" />
    </span>
  );
}

function ProductCard({
  productKey,
  variant = "card",
  selected = false,
  t,
}: {
  productKey: (typeof PRODUCT_KEYS)[number];
  variant?: "card" | "row" | "overlay" | "mini";
  selected?: boolean;
  t: Translate;
}) {
  return (
    <article className={styles.previewProductCard} data-card-variant={variant} data-selected={selected || undefined}>
      <ProductImage compact={variant === "row" || variant === "mini"} />
      <span className={styles.previewProductCopy}>
        <strong>{t(`settingsDcp.preview.surface.products.${productKey}.name`)}</strong>
        <small>{t("settingsDcp.preview.surface.variant")}</small>
        <span className={styles.previewPrices}>
          <strong>{t(`settingsDcp.preview.surface.products.${productKey}.price`)}</strong>
          <del>{t(`settingsDcp.preview.surface.products.${productKey}.compareAt`)}</del>
        </span>
      </span>
      <button type="button" disabled aria-label={t("settingsDcp.preview.previewOnly")}>
        {t(selected ? "settingsDcp.preview.surface.added" : "settingsDcp.preview.surface.add")}
      </button>
    </article>
  );
}

function StepNavigation({ descriptor, t }: { descriptor: DesignPreviewTemplateDescriptor; t: Translate }) {
  if (descriptor.navigation === "none") return null;

  if (descriptor.navigation === "accordion") {
    return (
      <div className={styles.previewAccordion} aria-label={t("settingsDcp.preview.surface.navigationLabel")}>
        <span data-complete="true"><b>✓</b>{t("settingsDcp.preview.surface.stepOne")}</span>
        <span data-active="true"><b>2</b>{t("settingsDcp.preview.surface.stepTwo")}</span>
      </div>
    );
  }

  if (descriptor.navigation === "tabs") {
    return (
      <nav className={styles.previewTabs} aria-label={t("settingsDcp.preview.surface.navigationLabel")}>
        <span data-active="true">{t("settingsDcp.preview.surface.categoryOne")}</span>
        <span>{t("settingsDcp.preview.surface.categoryTwo")}</span>
        <span>{t("settingsDcp.preview.surface.categoryThree")}</span>
      </nav>
    );
  }

  return (
    <nav
      className={styles.previewTimeline}
      data-compact={descriptor.navigation === "compact-timeline" || undefined}
      aria-label={t("settingsDcp.preview.surface.navigationLabel")}
    >
      <span data-complete="true"><b>✓</b>{t("settingsDcp.preview.surface.stepOneShort")}</span>
      <i aria-hidden="true" />
      <span data-active="true"><b>2</b>{t("settingsDcp.preview.surface.stepTwoShort")}</span>
      <i aria-hidden="true" />
      <span><b>3</b>{t("settingsDcp.preview.surface.stepThreeShort")}</span>
    </nav>
  );
}

function DiscountProgress({ t }: { t: Translate }) {
  return (
    <div className={styles.previewDiscount}>
      <span>{t("settingsDcp.preview.surface.discount")}</span>
      <i><b /></i>
    </div>
  );
}

function BundleSummary({
  descriptor,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  t: Translate;
}) {
  const usesSlots = descriptor.summary === "slot-grid" || descriptor.summary === "compact-slots";
  return (
    <aside className={styles.previewSummary} data-summary={descriptor.summary}>
      <header>
        <strong>{t("settingsDcp.preview.surface.summary")}</strong>
        <small>{t("settingsDcp.preview.surface.selectedCount")}</small>
      </header>
      <DiscountProgress t={t} />
      {usesSlots ? (
        <div className={styles.previewSummarySlots}>
          <ProductImage compact />
          <span className={styles.previewEmptySlot}>+</span>
          <span className={styles.previewEmptySlot}>+</span>
        </div>
      ) : (
        <div className={styles.previewSummaryRows}>
          <span><ProductImage compact /><small>{t("settingsDcp.preview.surface.products.first.name")}</small></span>
          <span><ProductImage compact /><small>{t("settingsDcp.preview.surface.products.second.name")}</small></span>
        </div>
      )}
      <footer>
        <span><small>{t("settingsDcp.preview.surface.totalLabel")}</small><strong>{t("settingsDcp.preview.surface.totalPrice")}</strong></span>
        <div>
          <button type="button" disabled>{t("settingsDcp.preview.surface.back")}</button>
          <button type="button" disabled>{t("settingsDcp.preview.surface.next")}</button>
        </div>
      </footer>
    </aside>
  );
}

function FullPagePreview({ descriptor, t }: { descriptor: DesignPreviewTemplateDescriptor; t: Translate }) {
  const cardVariant = descriptor.products === "card-rows"
    ? "row"
    : descriptor.products === "overlay-grid"
      ? "overlay"
      : "card";
  const productCount = descriptor.key === "classic" ? 4 : 3;

  return (
    <div className={styles.previewFullPage} data-full-page-template={descriptor.key}>
      <header className={styles.previewHero}>
        <small>{t("settingsDcp.preview.bundleType.landingPage")}</small>
        <h3>{t("settingsDcp.preview.surface.bundleName")}</h3>
        <p>{t("settingsDcp.preview.surface.description")}</p>
      </header>
      <StepNavigation descriptor={descriptor} t={t} />
      <div className={styles.previewFullPageShell}>
        <main>
          <div className={styles.previewSectionHeading}>
            <span><strong>{t("settingsDcp.preview.surface.categoryOne")}</strong><small>{t("settingsDcp.preview.surface.selectionRule")}</small></span>
            <span>{t("settingsDcp.preview.surface.progressCount")}</span>
          </div>
          {descriptor.key === "compact" ? (
            <nav className={styles.previewTabs} aria-label={t("settingsDcp.preview.surface.navigationLabel")}>
              <span data-active="true">{t("settingsDcp.preview.surface.categoryOne")}</span>
              <span>{t("settingsDcp.preview.surface.categoryTwo")}</span>
            </nav>
          ) : null}
          <div className={styles.previewProducts} data-products={descriptor.products}>
            {PRODUCT_KEYS.slice(0, productCount).map((productKey, index) => (
              <ProductCard key={productKey} productKey={productKey} variant={cardVariant} selected={index === 0} t={t} />
            ))}
          </div>
        </main>
        <BundleSummary descriptor={descriptor} t={t} />
      </div>
    </div>
  );
}

function Slot({ index, filled, vertical, t }: { index: number; filled?: boolean; vertical?: boolean; t: Translate }) {
  return (
    <span className={styles.previewSlot} data-filled={filled ? true : undefined} data-vertical={vertical ? true : undefined}>
      {filled ? <ProductImage compact /> : <b>+</b>}
      <span>
        <strong>{filled ? t("settingsDcp.preview.surface.products.first.name") : t("settingsDcp.preview.surface.emptySlot")}</strong>
        <small>{t("settingsDcp.preview.surface.slotNumber").replace("{{number}}", String(index))}</small>
      </span>
      {filled ? <small>×</small> : null}
    </span>
  );
}

function ProductPageBuilder({ descriptor, t }: { descriptor: DesignPreviewTemplateDescriptor; t: Translate }) {
  let productSelection;
  if (descriptor.products === "product-list") {
    productSelection = (
      <div className={styles.previewProducts} data-products="product-list">
        {PRODUCT_KEYS.slice(0, 3).map((key, index) => <ProductCard key={key} productKey={key} variant="row" selected={index === 0} t={t} />)}
      </div>
    );
  } else if (descriptor.products === "product-grid") {
    productSelection = (
      <>
        <StepNavigation descriptor={descriptor} t={t} />
        <div className={styles.previewProducts} data-products="product-grid">
          {PRODUCT_KEYS.map((key, index) => <ProductCard key={key} productKey={key} variant="mini" selected={index === 0} t={t} />)}
        </div>
      </>
    );
  } else {
    const vertical = descriptor.products === "vertical-slots";
    productSelection = (
      <div className={styles.previewSlots} data-slot-direction={vertical ? "vertical" : "horizontal"}>
        <Slot index={1} filled vertical={vertical} t={t} />
        <Slot index={2} vertical={vertical} t={t} />
        <Slot index={3} vertical={vertical} t={t} />
      </div>
    );
  }

  return (
    <div className={styles.previewProductPage} data-product-page-template={descriptor.key}>
      <section className={styles.previewPdpMedia}>
        <ProductImage />
        <div><ProductImage compact /><ProductImage compact /><ProductImage compact /></div>
      </section>
      <section className={styles.previewPdpDetails}>
        <small>{t("settingsDcp.preview.bundleType.productPage")}</small>
        <h3>{t("settingsDcp.preview.surface.bundleName")}</h3>
        <p>{t("settingsDcp.preview.surface.description")}</p>
        <DiscountProgress t={t} />
        {productSelection}
        <footer className={styles.previewPdpFooter}>
          <span><small>{t("settingsDcp.preview.surface.totalLabel")}</small><strong>{t("settingsDcp.preview.surface.totalPrice")}</strong></span>
          <button type="button" disabled>{t("settingsDcp.preview.surface.addBundle")}</button>
        </footer>
      </section>
    </div>
  );
}

function BuilderPreview({ descriptor, t }: { descriptor: DesignPreviewTemplateDescriptor; t: Translate }) {
  return descriptor.family === "full-page"
    ? <FullPagePreview descriptor={descriptor} t={t} />
    : <ProductPageBuilder descriptor={descriptor} t={t} />;
}

function UpsellPreview({ t }: { t: Translate }) {
  return (
    <section className={styles.previewUpsellState}>
      <ProductImage />
      <span>
        <small>{t("settingsDcp.preview.surface.upsellEyebrow")}</small>
        <h3>{t("settingsDcp.preview.surface.upsellTitle")}</h3>
        <p>{t("settingsDcp.preview.surface.upsellBody")}</p>
        <strong>{t("settingsDcp.preview.surface.products.fourth.price")}</strong>
      </span>
      <button type="button" disabled>{t("settingsDcp.preview.surface.add")}</button>
    </section>
  );
}

function PreviewSurface({
  descriptor,
  mode,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  mode: DesignPreviewMode;
  t: Translate;
}) {
  if (mode === "upsell") return <UpsellPreview t={t} />;

  return (
    <>
      <BuilderPreview descriptor={descriptor} t={t} />
      {mode === "loading" ? (
        <div className={styles.previewLoadingState}>
          <s-spinner size="base" accessibilityLabel={t("settingsDcp.preview.loading")} />
          <strong>{t("settingsDcp.preview.surface.loadingBody")}</strong>
        </div>
      ) : null}
      {mode === "validation" ? (
        <div className={styles.previewValidationToast} role="alert">
          {t("settingsDcp.preview.surface.validationMessage")}
        </div>
      ) : null}
    </>
  );
}

export function DesignLivePreview({
  previewTheme,
  activeFieldKey,
  initialState,
}: {
  previewTheme: DesignPreviewTheme | React.CSSProperties;
  activeFieldKey?: string | null;
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
  const fieldTarget = activeFieldKey ? getDesignPreviewFieldTarget(activeFieldKey) : undefined;
  const isApplicable = !activeFieldKey || isDesignPreviewFieldApplicable(activeFieldKey, activeTemplate.key);

  useEffect(() => {
    if (!fieldTarget) return;
    setPreviewState((current) => setDesignPreviewMode(current, fieldTarget.mode));
  }, [activeFieldKey, fieldTarget]);

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
              <s-option key={template.key} value={template.key}>{t(template.translationKey)}</s-option>
            ))}
          </s-select>
          <s-select
            label={t("settingsDcp.preview.mode.label")}
            value={previewState.mode}
            onChange={(event: Event) => {
              const mode = (event.target as HTMLSelectElement).value as DesignPreviewMode;
              setPreviewState((current) => setDesignPreviewMode(current, mode));
            }}
          >
            {PREVIEW_MODES.map((mode) => (
              <s-option key={mode} value={mode}>{t(`settingsDcp.preview.mode.${mode}`)}</s-option>
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

      {!isApplicable ? (
        <div className={styles.previewApplicability}>
          <s-icon type="info" size="small" />
          <span>{t("settingsDcp.preview.notApplicable")}</span>
        </div>
      ) : null}

      <div className={styles.previewStage} data-preview-viewport={previewState.viewport}>
        <div
          className={styles.previewSurface}
          data-template-key={previewState.templateKey}
          data-preview-mode={previewState.mode}
          style={previewTheme}
        >
          <PreviewSurface descriptor={activeTemplate} mode={previewState.mode} t={t} />
        </div>
      </div>
    </section>
  );
}
