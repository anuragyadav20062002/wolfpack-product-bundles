import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { OptimisedImage } from "../../../components/OptimisedImage";
import type {
  BundleContractType,
  TemplateKey,
} from "../../../lib/bundle-config/template-selection";
import {
  DESIGN_PREVIEW_FIXTURE,
  DESIGN_PREVIEW_TEMPLATES,
  buildDesignPreviewTheme,
  getDesignPreviewFieldTarget,
  getSupportedDesignPreviewSurfaces,
  isDesignPreviewFieldApplicable,
  type DesignPreviewFixtureProduct,
  type DesignPreviewSurface,
  type DesignPreviewTemplateDescriptor,
  type DesignPreviewViewport,
} from "./design-preview-model";
import styles from "./DesignSettingsView.module.css";

export { DESIGN_PREVIEW_TEMPLATES } from "./design-preview-model";
export type { DesignPreviewViewport } from "./design-preview-model";

export type DesignPreviewState = {
  bundleType: BundleContractType;
  templateKey: TemplateKey;
  viewport: DesignPreviewViewport;
  surface: DesignPreviewSurface;
};

type Translate = (key: string) => string;

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

export function isDesignPreviewSurfaceSupported(
  templateKey: TemplateKey,
  surface: DesignPreviewSurface,
) {
  return getSupportedDesignPreviewSurfaces(templateKey).includes(surface);
}

export function createDesignPreviewState(
  bundleType: BundleContractType = "full_page",
): DesignPreviewState {
  return {
    bundleType,
    templateKey: getDefaultTemplateKey(bundleType),
    viewport: "desktop",
    surface: "builder",
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
    surface: "builder",
  };
}

export function setDesignPreviewTemplate(
  state: DesignPreviewState,
  templateKey: TemplateKey,
): DesignPreviewState {
  if (!isTemplateValidForBundleType(state.bundleType, templateKey)) {
    throw new Error(`Invalid Design preview template "${templateKey}" for ${state.bundleType}`);
  }
  return {
    ...state,
    templateKey,
    surface: isDesignPreviewSurfaceSupported(templateKey, state.surface)
      ? state.surface
      : "builder",
  };
}

export function setDesignPreviewViewport(
  state: DesignPreviewState,
  viewport: DesignPreviewViewport,
): DesignPreviewState {
  return { ...state, viewport };
}

export function setDesignPreviewSurface(
  state: DesignPreviewState,
  surface: DesignPreviewSurface,
): DesignPreviewState {
  return isDesignPreviewSurfaceSupported(state.templateKey, surface)
    ? { ...state, surface }
    : state;
}

function ProductImage({
  product = DESIGN_PREVIEW_FIXTURE.products[0],
  compact = false,
}: {
  product?: DesignPreviewFixtureProduct;
  compact?: boolean;
}) {
  return (
    <span className={compact ? styles.previewProductImageCompact : styles.previewProductImage}>
      <OptimisedImage
        src={product.imageUrl}
        width={compact ? 72 : 320}
        height={compact ? 72 : 320}
        loading="lazy"
        alt=""
      />
    </span>
  );
}

function ProductCard({
  product,
  variant,
  t,
}: {
  product: DesignPreviewFixtureProduct;
  variant: "grid" | "compact" | "row";
  t: Translate;
}) {
  return (
    <article
      className={styles.previewProductCard}
      data-card-variant={variant}
      data-selected={product.selected || undefined}
    >
      <ProductImage product={product} compact={variant === "row"} />
      <span className={styles.previewProductCopy}>
        <strong>{t(`${product.translationKey}.name`)}</strong>
        <small>{t("settingsDcp.preview.surface.variant")}</small>
        <span className={styles.previewPrices}>
          <strong>{t(`${product.translationKey}.price`)}</strong>
          <del>{t(`${product.translationKey}.compareAt`)}</del>
        </span>
      </span>
      {product.selected ? (
        <span className={styles.previewQuantity} aria-label={t("settingsDcp.preview.previewOnly")}>
          <button type="button" disabled>−</button>
          <strong>{product.quantity}</strong>
          <button type="button" disabled>+</button>
        </span>
      ) : (
        <button type="button" disabled aria-label={t("settingsDcp.preview.previewOnly")}>
          {t("settingsDcp.preview.surface.add")}
        </button>
      )}
    </article>
  );
}

function StepNavigation({
  descriptor,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  t: Translate;
}) {
  if (descriptor.navigation === "none") return null;
  const region = descriptor.navigation === "cascade-steps"
    ? "cascade-step-flow"
    : descriptor.navigation === "cognive-steps"
      ? "cognive-step-headers"
      : descriptor.navigation;

  if (descriptor.navigation === "cascade-steps" || descriptor.navigation === "cognive-steps") {
    return (
      <div className={styles.previewStepHeaders} data-preview-region={region}>
        {DESIGN_PREVIEW_FIXTURE.steps.map((step, index) => (
          <span key={step.id} data-active={index === 0 || undefined}>
            <b>{index + 1}</b>
            <span><strong>{t(step.translationKey)}</strong><small>{t("settingsDcp.preview.surface.selectionRule")}</small></span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <nav
      className={styles.previewTimeline}
      data-navigation={descriptor.navigation}
      data-preview-region={region}
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

function CategoryNavigation({
  descriptor,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  t: Translate;
}) {
  if (descriptor.categories === "none") return null;
  const region = descriptor.categories === "accordion"
    ? "category-accordion"
    : descriptor.categories === "pills"
      ? "pill-categories"
      : descriptor.categories === "underline"
        ? "underline-categories"
        : "category-tabs";

  if (descriptor.categories === "accordion") {
    return (
      <div className={styles.previewCategoryAccordion} data-preview-region={region}>
        <span><strong>{t("settingsDcp.preview.surface.categoryOne")}</strong><small>{t("settingsDcp.preview.surface.selectionRule")}</small><b>⌃</b></span>
      </div>
    );
  }

  return (
    <nav
      className={styles.previewTabs}
      data-category-mode={descriptor.categories}
      data-preview-region={region}
      aria-label={t("settingsDcp.preview.surface.navigationLabel")}
    >
      {DESIGN_PREVIEW_FIXTURE.categories.map((category, index) => (
        <span key={category.id} data-active={index === 0 || undefined}>{t(category.translationKey)}</span>
      ))}
    </nav>
  );
}

function DiscountProgress({ t }: { t: Translate }) {
  return (
    <div className={styles.previewDiscount}>
      <span>{t("settingsDcp.preview.surface.discount")}</span>
      <i><b /></i>
      <small>{DESIGN_PREVIEW_FIXTURE.discountTiers.map((tier) => `${tier.percentage}%`).join(" · ")}</small>
    </div>
  );
}

function BundleSummary({
  descriptor,
  viewport,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  viewport: DesignPreviewViewport;
  t: Translate;
}) {
  const usesSlots = descriptor.summary === "slot-grid" || descriptor.summary === "compact-slots";
  const viewportRegions = viewport === "mobile"
    ? descriptor.sceneRegions.mobile
    : descriptor.sceneRegions.desktop;
  const region = descriptor.family === "full-page"
    ? viewportRegions.at(-1) ?? "summary-sidebar"
    : descriptor.summary === "cascade-drawer" ? "cascade-selected-drawer" : descriptor.summary;

  return (
    <aside className={styles.previewSummary} data-summary={descriptor.summary} data-preview-region={region}>
      <header>
        <strong>{t("settingsDcp.preview.surface.summary")}</strong>
        <small>{t("settingsDcp.preview.surface.selectedCount")}</small>
      </header>
      <DiscountProgress t={t} />
      {usesSlots ? (
        <div className={styles.previewSummarySlots}>
          <ProductImage product={DESIGN_PREVIEW_FIXTURE.products[0]} compact />
          {DESIGN_PREVIEW_FIXTURE.emptySlots.map((slot) => <span key={slot.id} className={styles.previewEmptySlot}>+</span>)}
        </div>
      ) : (
        <div className={styles.previewSummaryRows}>
          {DESIGN_PREVIEW_FIXTURE.products.filter((product) => product.selected).map((product) => (
            <span key={product.id}><ProductImage product={product} compact /><small>{t(`${product.translationKey}.name`)}</small></span>
          ))}
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

function ProductGrid({
  descriptor,
  limit,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  limit?: number;
  t: Translate;
}) {
  const region = descriptor.productCard.mode === "row" ? "product-rows" : "product-grid";
  return (
    <div
      className={styles.previewProducts}
      data-product-mode={descriptor.productCard.mode}
      data-columns-desktop={descriptor.productCard.columns.desktop}
      data-columns-mobile={descriptor.productCard.columns.mobile}
      data-preview-region={region}
    >
      {DESIGN_PREVIEW_FIXTURE.products.slice(0, limit).map((product) => (
        <ProductCard key={product.id} product={product} variant={descriptor.productCard.mode} t={t} />
      ))}
    </div>
  );
}

function FullPageBuilder({
  descriptor,
  viewport,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  viewport: DesignPreviewViewport;
  t: Translate;
}) {
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
          <CategoryNavigation descriptor={descriptor} t={t} />
          <ProductGrid descriptor={descriptor} t={t} />
        </main>
        <BundleSummary descriptor={descriptor} viewport={viewport} t={t} />
      </div>
    </div>
  );
}

function Slot({
  index,
  filled,
  orientation,
  t,
}: {
  index: number;
  filled?: boolean;
  orientation: "horizontal" | "vertical";
  t: Translate;
}) {
  const product = DESIGN_PREVIEW_FIXTURE.products[index - 1] ?? DESIGN_PREVIEW_FIXTURE.products[0];
  return (
    <span className={styles.previewSlot} data-filled={filled ? true : undefined} data-slot-orientation={orientation}>
      {filled ? <ProductImage product={product} compact /> : <b>+</b>}
      <span>
        <strong>{filled ? t(`${product.translationKey}.name`) : t("settingsDcp.preview.surface.emptySlot")}</strong>
        <small>{t("settingsDcp.preview.surface.slotNumber").replace("{{number}}", String(index))}</small>
      </span>
      {filled ? <small>×</small> : null}
    </span>
  );
}

function ProductPageBuilder({
  descriptor,
  viewport,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  viewport: DesignPreviewViewport;
  t: Translate;
}) {
  const slotsRegion = descriptor.slotOrientation ? `${descriptor.slotOrientation}-slots` : null;
  return (
    <div className={styles.previewProductPage} data-product-page-template={descriptor.key} data-preview-region="neutral-pdp-shell">
      <section className={styles.previewPdpMedia}>
        <ProductImage product={DESIGN_PREVIEW_FIXTURE.products[0]} />
        <div>{DESIGN_PREVIEW_FIXTURE.products.slice(1).map((product) => <ProductImage key={product.id} product={product} compact />)}</div>
      </section>
      <section className={styles.previewPdpDetails}>
        <small>{t("settingsDcp.preview.bundleType.productPage")}</small>
        <h3>{t("settingsDcp.preview.surface.bundleName")}</h3>
        <p>{t("settingsDcp.preview.surface.description")}</p>
        <DiscountProgress t={t} />
        <StepNavigation descriptor={descriptor} t={t} />
        <CategoryNavigation descriptor={descriptor} t={t} />
        {descriptor.slotOrientation && slotsRegion ? (
          <div className={styles.previewSlots} data-slot-direction={descriptor.slotOrientation} data-preview-region={slotsRegion}>
            <Slot index={1} filled orientation={descriptor.slotOrientation} t={t} />
            <Slot index={2} orientation={descriptor.slotOrientation} t={t} />
            <Slot index={3} orientation={descriptor.slotOrientation} t={t} />
          </div>
        ) : (
          <ProductGrid descriptor={descriptor} t={t} />
        )}
        <footer
          className={styles.previewPdpFooter}
          data-preview-region={descriptor.summary === "modal-footer" ? "modal-footer" : "pdp-footer"}
        >
          <span><small>{t("settingsDcp.preview.surface.totalLabel")}</small><strong>{t("settingsDcp.preview.surface.totalPrice")}</strong></span>
          <button type="button" disabled>{t("settingsDcp.preview.surface.addBundle")}</button>
        </footer>
        {descriptor.summary === "cascade-drawer" && viewport === "desktop" ? (
          <BundleSummary descriptor={descriptor} viewport={viewport} t={t} />
        ) : null}
      </section>
    </div>
  );
}

function BuilderPreview({
  descriptor,
  viewport,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  viewport: DesignPreviewViewport;
  t: Translate;
}) {
  return descriptor.family === "full-page"
    ? <FullPageBuilder descriptor={descriptor} viewport={viewport} t={t} />
    : <ProductPageBuilder descriptor={descriptor} viewport={viewport} t={t} />;
}

function ProductPicker({
  descriptor,
  viewport,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  viewport: DesignPreviewViewport;
  t: Translate;
}) {
  const region = viewport === "mobile" ? "product-picker-bottom-sheet" : "product-picker-modal";
  return (
    <section className={styles.previewProductPicker} data-preview-region={region}>
      <header><strong>{t("settingsDcp.preview.surface.chooseProduct")}</strong><button type="button" disabled>×</button></header>
      <ProductGrid descriptor={descriptor} limit={3} t={t} />
    </section>
  );
}

function CartSummarySurface({
  descriptor,
  viewport,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  viewport: DesignPreviewViewport;
  t: Translate;
}) {
  if (descriptor.family === "full-page") {
    return <FullPageBuilder descriptor={descriptor} viewport={viewport} t={t} />;
  }
  return (
    <div className={styles.previewCartFocus} data-preview-region="neutral-pdp-shell">
      <BundleSummary descriptor={descriptor} viewport={viewport} t={t} />
      <footer className={styles.previewPdpFooter} data-preview-region={descriptor.summary === "modal-footer" ? "modal-footer" : "pdp-footer"}>
        <span><small>{t("settingsDcp.preview.surface.totalLabel")}</small><strong>{t("settingsDcp.preview.surface.totalPrice")}</strong></span>
        <button type="button" disabled>{t("settingsDcp.preview.surface.addBundle")}</button>
      </footer>
    </div>
  );
}

function UpsellPreview({ t }: { t: Translate }) {
  return (
    <section className={styles.previewUpsellState} data-preview-region="upsell-overlay">
      <ProductImage product={DESIGN_PREVIEW_FIXTURE.upsell} />
      <span>
        <small>{t("settingsDcp.preview.surface.upsellEyebrow")}</small>
        <h3>{t("settingsDcp.preview.surface.upsellTitle")}</h3>
        <p>{t("settingsDcp.preview.surface.upsellBody")}</p>
        <strong>{t(`${DESIGN_PREVIEW_FIXTURE.upsell.translationKey}.price`)}</strong>
      </span>
      <button type="button" disabled>{t("settingsDcp.preview.surface.add")}</button>
    </section>
  );
}

function PreviewSurface({
  descriptor,
  surface,
  viewport,
  t,
}: {
  descriptor: DesignPreviewTemplateDescriptor;
  surface: DesignPreviewSurface;
  viewport: DesignPreviewViewport;
  t: Translate;
}) {
  if (surface === "upsell") return <UpsellPreview t={t} />;
  if (surface === "cart-summary") return <CartSummarySurface descriptor={descriptor} viewport={viewport} t={t} />;

  return (
    <>
      <BuilderPreview descriptor={descriptor} viewport={viewport} t={t} />
      {surface === "product-picker" ? <ProductPicker descriptor={descriptor} viewport={viewport} t={t} /> : null}
      {surface === "loading" ? (
        <div className={styles.previewLoadingState} data-preview-region="loading-overlay">
          <div className={styles.previewLoadingSkeleton}><i /><i /><i /></div>
          <s-spinner size="base" accessibilityLabel={t("settingsDcp.preview.loading")} />
          <strong>{t("settingsDcp.preview.surface.loadingBody")}</strong>
        </div>
      ) : null}
      {surface === "validation" ? (
        <div className={styles.previewValidationToast} data-preview-region="validation-overlay" role="alert">
          {t(DESIGN_PREVIEW_FIXTURE.validationMessage)}
        </div>
      ) : null}
    </>
  );
}

export function DesignLivePreview({
  fieldValues,
  isExpertControlsEnabled,
  activeFieldKey,
  initialState,
}: {
  fieldValues: Record<string, string>;
  isExpertControlsEnabled: boolean;
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
  const supportedSurfaces = activeTemplate.supportedSurfaces;
  const fieldTarget = activeFieldKey
    ? getDesignPreviewFieldTarget(activeFieldKey, activeTemplate.key)
    : undefined;
  const fieldTargetSurface = fieldTarget?.surface;
  const isApplicable = !activeFieldKey || isDesignPreviewFieldApplicable(activeFieldKey, activeTemplate.key);
  const previewTheme = useMemo(
    () => buildDesignPreviewTheme(fieldValues, isExpertControlsEnabled, activeTemplate.key),
    [activeTemplate.key, fieldValues, isExpertControlsEnabled],
  );

  useEffect(() => {
    if (!fieldTargetSurface || !isApplicable) return;
    setPreviewState((current) => setDesignPreviewSurface(current, fieldTargetSurface));
  }, [activeFieldKey, fieldTargetSurface, isApplicable]);

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
            label={t("settingsDcp.preview.surfaceSelector.label")}
            value={previewState.surface}
            onChange={(event: Event) => {
              const surface = (event.target as HTMLSelectElement).value as DesignPreviewSurface;
              setPreviewState((current) => setDesignPreviewSurface(current, surface));
            }}
          >
            {supportedSurfaces.map((surface) => (
              <s-option key={surface} value={surface}>{t(`settingsDcp.preview.surfaceSelector.${surface}`)}</s-option>
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
          data-preview-surface={previewState.surface}
          style={previewTheme}
        >
          <PreviewSurface
            descriptor={activeTemplate}
            surface={previewState.surface}
            viewport={previewState.viewport}
            t={t}
          />
        </div>
      </div>
    </section>
  );
}
