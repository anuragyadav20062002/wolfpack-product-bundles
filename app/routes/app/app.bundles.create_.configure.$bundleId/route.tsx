import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  Fragment,
} from "react";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import db from "../../../db.server";
import {
  BUNDLE_STATUS_OPTIONS,
  STEP_CONDITION_TYPE_OPTIONS,
  STEP_CONDITION_OPERATOR_OPTIONS,
} from "../../../constants/bundle";
import { FilePicker } from "../../../components/design-control-panel/settings/FilePicker";
import { BundleGuidedTour } from "../../../components/bundle-configure/BundleGuidedTour";
import { BundleReadinessOverlay, type BundleReadinessItem } from "../../../components/bundle-configure/BundleReadinessOverlay";
import { WIZARD_CONFIGURE_TOUR_STEPS } from "../../../components/bundle-configure/tourSteps";
import styles from "./wizard-configure.module.css";

declare const shopify: {
  resourcePicker: (opts: {
    type: string;
    multiple: boolean;
    selectionIds?: { id: string }[];
  }) => Promise<{ selection: any[] } | null>;
  toast: { show: (msg: string, opts?: { isError?: boolean }) => void };
};

// ── Types ─────────────────────────────────────────────────────────

interface FilterDef {
  id: string;
  type: "tag" | "option";
  label: string;
}

interface ConditionDef {
  id: string;
  conditionType: string;
  conditionOperator: string;
  conditionValue: string;
}

interface WizardStepState {
  tempId: string;
  dbId: string | null;
  name: string;
  pageTitle: string;
  iconUrl: string | null;
  products: any[];
  collections: any[];
  conditions: ConditionDef[];
  filters: FilterDef[];
  preSelectAll: boolean;
  activeTab: "products" | "collections";
}

// ── Helpers ───────────────────────────────────────────────────────

function newCondition(): ConditionDef {
  return {
    id: crypto.randomUUID(),
    conditionType: "quantity",
    conditionOperator: "greater_than_or_equal_to",
    conditionValue: "1",
  };
}

function newFilter(): FilterDef {
  return { id: crypto.randomUUID(), type: "tag", label: "" };
}

function emptyStep(): WizardStepState {
  return {
    tempId: crypto.randomUUID(),
    dbId: null,
    name: "",
    pageTitle: "",
    iconUrl: null,
    products: [],
    collections: [],
    conditions: [],
    filters: [],
    preSelectAll: false,
    activeTab: "products",
  };
}

function buildConditions(s: any): ConditionDef[] {
  const out: ConditionDef[] = [];
  if (s.conditionType) {
    out.push({
      id: crypto.randomUUID(),
      conditionType: s.conditionType,
      conditionOperator: s.conditionOperator ?? "greater_than_or_equal_to",
      conditionValue: String(s.conditionValue ?? 1),
    });
  }
  if (s.conditionOperator2) {
    out.push({
      id: crypto.randomUUID(),
      conditionType: s.conditionType ?? "quantity",
      conditionOperator: s.conditionOperator2,
      conditionValue: String(s.conditionValue2 ?? 1),
    });
  }
  return out;
}

function initSteps(dbSteps: any[]): WizardStepState[] {
  if (!dbSteps || dbSteps.length === 0) return [emptyStep()];
  return dbSteps.map((s) => ({
    tempId: crypto.randomUUID(),
    dbId: s.id,
    name: s.name ?? "",
    pageTitle: s.pageTitle ?? "",
    iconUrl: s.timelineIconUrl ?? null,
    products: Array.isArray(s.StepProduct)
      ? s.StepProduct.map((sp: any) => ({
          id: sp.productId,
          title: sp.title,
          imageUrl: sp.imageUrl,
          variants: sp.variants ?? [],
        }))
      : [],
    collections: Array.isArray(s.collections) ? (s.collections as any[]) : [],
    conditions: buildConditions(s),
    filters: Array.isArray(s.filters) ? (s.filters as FilterDef[]) : [],
    preSelectAll: false,
    activeTab: "products" as const,
  }));
}

const FILTER_TYPE_OPTIONS = [
  { label: "By Product Tag", value: "tag" },
  { label: "By Variant Option", value: "option" },
] as const;

const STEPS_META = [
  { num: "01", label: "Bundle name\n& Description" },
  { num: "02", label: "Configuration" },
  { num: "03", label: "Pricing" },
  { num: "04", label: "Assets" },
  { num: "05", label: "Pricing Tiers" },
];

// ── Loader ────────────────────────────────────────────────────────

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  const bundleId = params.bundleId!;

  const bundle = await db.bundle.findUnique({
    where: { id: bundleId, shopId: session.shop },
    include: {
      steps: {
        orderBy: { position: "asc" },
        include: { StepProduct: { orderBy: { position: "asc" } } },
      },
      pricing: true,
    },
  });

  if (!bundle) return redirect("/app/bundles");

  // Shop locales for multi-language modal
  let shopLocales: { locale: string; name: string; primary: boolean }[] = [];
  try {
    const resp = await admin.graphql(
      `query { shopLocales { locale name primary published } }`
    );
    const data = (await resp.json()) as any;
    shopLocales = ((data.data?.shopLocales ?? []) as any[]).filter(
      (l) => l.published
    );
  } catch {}

  // App embed check for readiness score
  let appEmbedEnabled = false;
  try {
    const { checkAppEmbedEnabled } = await import(
      "../../../services/theme/app-embed-check.server"
    );
    const result = await checkAppEmbedEnabled(admin, session.shop);
    appEmbedEnabled = result.enabled;
  } catch {}

  // Parent Shopify product status
  let parentProductActive = false;
  if (bundle.shopifyProductId) {
    try {
      const resp = await admin.graphql(
        `query { product(id: "${bundle.shopifyProductId}") { status } }`
      );
      const data = (await resp.json()) as any;
      parentProductActive = data.data?.product?.status === "ACTIVE";
    } catch {}
  }

  return json({
    bundle: {
      id: bundle.id,
      name: bundle.name,
      status: bundle.status,
      bundleType: bundle.bundleType,
      searchBarEnabled: bundle.searchBarEnabled,
      shopifyProductId: bundle.shopifyProductId,
      shopifyPageId: bundle.shopifyPageId,
      textOverridesByLocale: (bundle.textOverridesByLocale as any) ?? {},
      steps: bundle.steps as any[],
    },
    readiness: {
      appEmbedEnabled,
      hasDiscount: bundle.pricing?.enabled ?? false,
      hasBundleVisibility: !!(
        bundle.shopifyPageId || bundle.status === "active"
      ),
      parentProductActive,
    },
    shopLocales,
    shop: session.shop,
  });
};

// ── Action ────────────────────────────────────────────────────────

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await requireAdminSession(request);
  const bundleId = params.bundleId!;

  const bundle = await db.bundle.findUnique({
    where: { id: bundleId, shopId: session.shop },
    include: { steps: true },
  });
  if (!bundle) return redirect("/app/bundles");

  const formData = await request.formData();
  const stepsJson = formData.get("steps") as string;
  const bundleStatus = formData.get("bundleStatus") as string;
  const searchBarEnabled = formData.get("searchBarEnabled") === "true";
  const localeOverridesJson = formData.get("textOverridesByLocale") as string;

  const wizardSteps: WizardStepState[] = JSON.parse(stepsJson || "[]");
  const textOverridesByLocale = localeOverridesJson
    ? JSON.parse(localeOverridesJson)
    : {};

  await db.bundle.update({
    where: { id: bundleId },
    data: {
      status: bundleStatus as any,
      searchBarEnabled,
      textOverridesByLocale,
    },
  });

  // Delete removed steps
  const submittedDbIds = wizardSteps
    .filter((s) => s.dbId)
    .map((s) => s.dbId!);
  const toDelete = bundle.steps
    .map((s) => s.id)
    .filter((id) => !submittedDbIds.includes(id));
  if (toDelete.length > 0) {
    await db.bundleStep.deleteMany({ where: { id: { in: toDelete } } });
  }

  for (const [i, ws] of wizardSteps.entries()) {
    const c1 = ws.conditions?.[0];
    const c2 = ws.conditions?.[1];
    const stepData = {
      name: ws.name?.trim() || `Step ${i + 1}`,
      pageTitle: ws.pageTitle?.trim() || null,
      timelineIconUrl: ws.iconUrl || null,
      position: i,
      conditionType: c1?.conditionType || null,
      conditionOperator: c1?.conditionOperator || null,
      conditionValue: c1?.conditionValue
        ? parseInt(c1.conditionValue, 10)
        : null,
      conditionOperator2: c2?.conditionOperator || null,
      conditionValue2: c2?.conditionValue
        ? parseInt(c2.conditionValue, 10)
        : null,
      filters:
        ws.filters && ws.filters.length > 0 ? (ws.filters as any) : null,
    };

    let stepId: string;
    if (ws.dbId) {
      await db.bundleStep.update({ where: { id: ws.dbId }, data: stepData });
      stepId = ws.dbId;
    } else {
      const created = await db.bundleStep.create({
        data: { ...stepData, bundleId },
      });
      stepId = created.id;
    }

    // Sync StepProducts
    await db.stepProduct.deleteMany({ where: { stepId } });
    for (const [pi, product] of (ws.products || []).entries()) {
      await db.stepProduct.create({
        data: {
          stepId,
          productId: product.id,
          title: product.title || "",
          imageUrl:
            product.imageUrl ||
            product.images?.[0]?.originalSrc ||
            null,
          variants: product.variants ?? [],
          position: pi,
        },
      });
    }
  }

  const routeBase =
    bundle.bundleType === "full_page" ? "full-page-bundle" : "product-page-bundle";
  return redirect(`/app/bundles/${routeBase}/configure/${bundleId}`);
};

// ── Component ─────────────────────────────────────────────────────

export default function WizardConfigureStep() {
  const { bundle, readiness, shopLocales, shop } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // ── State ──────────────────────────────────────────────────────
  const [steps, setSteps] = useState<WizardStepState[]>(() =>
    initSteps(bundle.steps)
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<"forward" | "backward" | null>(null);
  const [slideKey, setSlideKey] = useState(0);

  const [bundleStatus, setBundleStatus] = useState<string>(bundle.status);
  const [searchBarEnabled] = useState<boolean>(bundle.searchBarEnabled);
  const [textOverridesByLocale, setTextOverridesByLocale] = useState<
    Record<string, Record<string, string>>
  >(bundle.textOverridesByLocale ?? {});

  const [localeModalOpen, setLocaleModalOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState(
    () => shopLocales.find((l) => !l.primary)?.locale ?? ""
  );

  const [readinessOpen, setReadinessOpen] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const submitRef = useRef<HTMLButtonElement>(null);
  const statusSelectRef = useRef<any>(null);
  const localeSelectRef = useRef<any>(null);

  // Sync Polaris web component select values
  useEffect(() => {
    if (statusSelectRef.current)
      (statusSelectRef.current as any).value = bundleStatus;
  }, [bundleStatus]);

  useEffect(() => {
    if (localeSelectRef.current && selectedLocale)
      (localeSelectRef.current as any).value = selectedLocale;
  }, [selectedLocale, localeModalOpen]);

  const currentStep = steps[currentIdx];

  // ── Step Mutations ─────────────────────────────────────────────
  const updateStep = useCallback(
    (idx: number, field: keyof WizardStepState, value: any) => {
      setSteps((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const updateCurrent = useCallback(
    (field: keyof WizardStepState, value: any) => updateStep(currentIdx, field, value),
    [currentIdx, updateStep]
  );

  const navigateTo = useCallback(
    (newIdx: number) => {
      if (newIdx === currentIdx) return;
      setSlideDir(newIdx > currentIdx ? "forward" : "backward");
      setSlideKey((k) => k + 1);
      setCurrentIdx(newIdx);
    },
    [currentIdx]
  );

  const handleAddStep = useCallback(() => {
    const newIdx = steps.length;
    setSteps((prev) => [...prev, emptyStep()]);
    setSlideDir("forward");
    setSlideKey((k) => k + 1);
    setCurrentIdx(newIdx);
  }, [steps.length]);

  const handleRemoveStep = useCallback(
    (idx: number) => {
      if (steps.length === 1) return;
      setSteps((prev) => prev.filter((_, i) => i !== idx));
      setSlideDir("backward");
      setSlideKey((k) => k + 1);
      setCurrentIdx((prev) => Math.min(prev, steps.length - 2));
    },
    [steps.length]
  );

  // ── Condition Mutations ────────────────────────────────────────
  const addRule = useCallback(() => {
    if (currentStep.conditions.length >= 2) {
      shopify.toast.show("A step can have at most 2 conditions");
      return;
    }
    updateCurrent("conditions", [...currentStep.conditions, newCondition()]);
  }, [currentStep.conditions, updateCurrent]);

  const removeRule = useCallback(
    (id: string) =>
      updateCurrent(
        "conditions",
        currentStep.conditions.filter((c) => c.id !== id)
      ),
    [currentStep.conditions, updateCurrent]
  );

  const updateRule = useCallback(
    (id: string, field: keyof ConditionDef, val: string) =>
      updateCurrent(
        "conditions",
        currentStep.conditions.map((c) =>
          c.id === id ? { ...c, [field]: val } : c
        )
      ),
    [currentStep.conditions, updateCurrent]
  );

  // ── Filter Mutations ───────────────────────────────────────────
  const addFilter = useCallback(() => {
    updateCurrent("filters", [...currentStep.filters, newFilter()]);
  }, [currentStep.filters, updateCurrent]);

  const removeFilter = useCallback(
    (id: string) =>
      updateCurrent(
        "filters",
        currentStep.filters.filter((f) => f.id !== id)
      ),
    [currentStep.filters, updateCurrent]
  );

  const updateFilter = useCallback(
    (id: string, field: keyof FilterDef, val: string) =>
      updateCurrent(
        "filters",
        currentStep.filters.map((f) =>
          f.id === id ? { ...f, [field]: val } : f
        )
      ),
    [currentStep.filters, updateCurrent]
  );

  // ── Resource Pickers ───────────────────────────────────────────
  const pickProducts = useCallback(async () => {
    const result = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      selectionIds: currentStep.products.map((p) => ({ id: p.id })),
    });
    if (result?.selection) {
      const transformed = result.selection.map((p: any) => ({
        id: p.id,
        title: p.title,
        imageUrl:
          p.images?.[0]?.originalSrc ?? p.images?.[0]?.url ?? null,
        variants: p.variants ?? [],
      }));
      updateCurrent("products", transformed);
    }
  }, [currentStep.products, updateCurrent]);

  const pickCollections = useCallback(async () => {
    const result = await shopify.resourcePicker({
      type: "collection",
      multiple: true,
      selectionIds: currentStep.collections.map((c: any) => ({ id: c.id })),
    });
    if (result?.selection) {
      updateCurrent("collections", result.selection);
    }
  }, [currentStep.collections, updateCurrent]);

  // ── Preview ────────────────────────────────────────────────────
  const handlePreview = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`wpb_preview_${bundle.id}`, "1");
    }
    const handle = bundle.shopifyProductId
      ? `products/${bundle.shopifyProductId}`
      : "";
    shopify.toast.show("Opening preview…");
    if (handle) window.open(`https://your-store.myshopify.com/${handle}`, "_blank");
  }, [bundle.id, bundle.shopifyProductId]);

  // ── Next ───────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    submitRef.current?.click();
  }, []);

  // ── Locale translation helpers ─────────────────────────────────
  const getTranslation = (locale: string) =>
    textOverridesByLocale?.[locale]?.[`step_${currentIdx}_name`] ?? "";

  const setTranslation = (locale: string, value: string) => {
    setTextOverridesByLocale((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] ?? {}),
        [`step_${currentIdx}_name`]: value,
      },
    }));
  };

  // ── Readiness items ────────────────────────────────────────────
  const hasProducts = steps.some((s) => s.products.length > 0 || s.collections.length > 0);
  const readinessItems: BundleReadinessItem[] = [
    {
      key: "embed",
      label: "App embed enabled",
      points: 15,
      done: readiness.appEmbedEnabled,
    },
    {
      key: "products",
      label: "Products added to a step",
      points: 20,
      done: hasProducts,
    },
    {
      key: "discount",
      label: "Discount configured",
      points: 15,
      done: readiness.hasDiscount,
    },
    {
      key: "visible",
      label: "Bundle placed / visible",
      points: 25,
      done: readiness.hasBundleVisibility,
    },
    {
      key: "product_active",
      label: "Parent product active",
      points: 15,
      done: readiness.parentProductActive,
    },
  ];

  // ── Derived summary values ─────────────────────────────────────
  const selectedProductCount = currentStep.products.length;
  const selectedCollectionCount = currentStep.collections.length;
  const rulesCount = currentStep.conditions.length;
  const filtersCount = currentStep.filters.length;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <ui-title-bar title="Configuration">
        <button variant="breadcrumb" onClick={() => window.history.back()}>
          Create Bundle
        </button>
      </ui-title-bar>

      <div className={styles.page}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <button
              className={styles.backBtn}
              onClick={() => window.history.back()}
              aria-label="Back"
            >
              ←
            </button>
            <h1 className={styles.pageTitle}>Configuration</h1>
          </div>
          <s-button
            variant="secondary"
            href="https://wolfpackapps.com/docs/bundle-configuration"
            target="_blank"
          >
            How to configure?
          </s-button>
        </div>

        {/* Wizard step indicator */}
        <div className={styles.stepIndicator}>
          {STEPS_META.map((step, idx) => (
            <Fragment key={step.num}>
              {idx > 0 && <div className={styles.stepConnector} />}
              <div className={styles.stepItem}>
                {idx === 0 ? (
                  <>
                    <div className={styles.stepCircleDone}>✓</div>
                    <span className={styles.stepLabelDone}>{step.label}</span>
                  </>
                ) : idx === 1 ? (
                  <>
                    <div className={styles.stepCircleActive}>{step.num}</div>
                    <span className={styles.stepLabelActive}>{step.label}</span>
                  </>
                ) : (
                  <>
                    <span className={styles.stepNumFuture}>{step.num}</span>
                    <span className={styles.stepLabelFuture}>{step.label}</span>
                  </>
                )}
              </div>
            </Fragment>
          ))}
        </div>

        {/* Step chip navigation (bundle steps) */}
        <div className={styles.stepNav}>
          {steps.map((s, i) => (
            <button
              key={s.tempId}
              className={i === currentIdx ? styles.stepChipActive : styles.stepChip}
              onClick={() => navigateTo(i)}
            >
              Step {i + 1}
              {steps.length > 1 && i === currentIdx && (
                <span
                  style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveStep(i);
                  }}
                  title="Remove this step"
                >
                  ✕
                </span>
              )}
            </button>
          ))}
          <button className={styles.addStepBtn} onClick={handleAddStep}>
            + Add Step
          </button>
        </div>

        {/* Main layout */}
        <div className={styles.layout}>
          {/* LEFT COLUMN */}
          <div className={styles.leftCol}>
            {/* Animated slide wrapper — key changes on step navigation */}
            <div
              key={slideKey}
              className={`${slideDir ? styles[`slide${slideDir.charAt(0).toUpperCase()}${slideDir.slice(1)}`] : ""}`}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* ── Step Configuration Card ── */}
                <div
                  className={styles.card}
                  data-tour-target="wizard-step-config"
                >
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Step Configuration</h2>
                    <button
                      className={styles.multiLangBtn}
                      onClick={() => setLocaleModalOpen(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="10" r="8" />
                        <path d="M10 2c0 0-4 3-4 8s4 8 4 8M10 2c0 0 4 3 4 8s-4 8-4 8M2 10h16" />
                      </svg>
                      Multi Language
                    </button>
                  </div>

                  <div className={styles.stepConfigRow}>
                    {/* Icon upload */}
                    <div className={styles.iconColumn}>
                      <div className={styles.iconBox}>
                        {currentStep.iconUrl ? (
                          <img
                            src={currentStep.iconUrl}
                            alt="Step icon"
                            className={styles.iconImg}
                          />
                        ) : (
                          <div className={styles.iconPlaceholder}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                              <path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 5l-8 4-8-4" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Hidden FilePicker — triggered by button */}
                      <div className={styles.filePickerHidden}>
                        {showIconPicker && (
                          <FilePicker
                            value={currentStep.iconUrl}
                            onChange={(url: string | null) => {
                              updateCurrent("iconUrl", url);
                              setShowIconPicker(false);
                            }}
                            label=""
                            hideCropEditor
                          />
                        )}
                      </div>

                      <button
                        className={styles.uploadIconBtn}
                        onClick={() => setShowIconPicker((v) => !v)}
                      >
                        {showIconPicker ? "Close picker" : "Upload Icon"}
                      </button>
                      <p className={styles.helperText} style={{ textAlign: "center" }}>
                        512×512 px · PNG/SVG
                      </p>
                    </div>

                    {/* Fields */}
                    <div className={styles.fieldsColumn}>
                      <s-text-field
                        label="Step Name"
                        placeholder="Eg:- Add product"
                        value={currentStep.name}
                        onInput={(e: Event) =>
                          updateCurrent("name", (e.target as HTMLInputElement).value)
                        }
                        autoComplete="off"
                      />
                      <div>
                        <s-text-field
                          label="Product Page Title"
                          placeholder="Eg:- Customized T-shirt Bundle for you"
                          value={currentStep.pageTitle}
                          onInput={(e: Event) =>
                            updateCurrent("pageTitle", (e.target as HTMLInputElement).value)
                          }
                          autoComplete="off"
                        />
                        <p className={styles.helperText}>
                          This text will appear as the page header right after the navigation bar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Select Product Card ── */}
                <div
                  className={styles.card}
                  data-tour-target="wizard-select-product"
                >
                  <div className={styles.cardHeader} style={{ marginBottom: 4 }}>
                    <h2 className={styles.cardTitle}>Select Product</h2>
                  </div>
                  <p className={styles.cardSubtitle}>
                    Select product or collection to show in step
                  </p>

                  {/* Tabs */}
                  <div className={styles.tabRow}>
                    <button
                      className={
                        currentStep.activeTab === "products"
                          ? styles.tabActive
                          : styles.tab
                      }
                      onClick={() => updateCurrent("activeTab", "products")}
                    >
                      Browse Products
                      {selectedProductCount > 0 && (
                        <span className={styles.tabBadge}>{selectedProductCount}</span>
                      )}
                    </button>
                    <button
                      className={
                        currentStep.activeTab === "collections"
                          ? styles.tabActive
                          : styles.tab
                      }
                      onClick={() => updateCurrent("activeTab", "collections")}
                    >
                      Browse Collections
                      {selectedCollectionCount > 0 && (
                        <span className={styles.tabBadge}>{selectedCollectionCount}</span>
                      )}
                    </button>
                  </div>

                  <p className={styles.tabHelperText}>
                    Select{" "}
                    {currentStep.activeTab === "products"
                      ? "product"
                      : "collection"}{" "}
                    here will be displayed on this step
                  </p>

                  <div className={styles.productActions}>
                    <button
                      className={styles.addProductBtn}
                      onClick={
                        currentStep.activeTab === "products"
                          ? pickProducts
                          : pickCollections
                      }
                    >
                      {currentStep.activeTab === "products"
                        ? "Add Product"
                        : "Add Collection"}
                    </button>

                    {currentStep.activeTab === "products" &&
                      selectedProductCount > 0 && (
                        <button
                          className={styles.selectedBadge}
                          onClick={pickProducts}
                        >
                          {selectedProductCount} Selected
                        </button>
                      )}

                    {currentStep.activeTab === "collections" &&
                      selectedCollectionCount > 0 && (
                        <button
                          className={styles.selectedBadge}
                          onClick={pickCollections}
                        >
                          {selectedCollectionCount} Selected
                        </button>
                      )}
                  </div>

                  <div className={styles.preSelectRow}>
                    <input
                      type="checkbox"
                      id={`preselect-${currentStep.tempId}`}
                      checked={currentStep.preSelectAll}
                      onChange={(e) =>
                        updateCurrent("preSelectAll", e.target.checked)
                      }
                    />
                    <label
                      htmlFor={`preselect-${currentStep.tempId}`}
                      className={styles.preSelectLabel}
                    >
                      Pre-select all products on this step
                    </label>
                  </div>
                </div>

                {/* ── Rules Card ── */}
                <div
                  className={styles.card}
                  data-tour-target="wizard-rules"
                >
                  <div className={styles.cardHeader} style={{ marginBottom: 4 }}>
                    <h2 className={styles.cardTitle}>Rules</h2>
                  </div>
                  <p className={styles.cardSubtitle}>
                    Define conditions for product selection and quantity limits.
                  </p>

                  {currentStep.conditions.length === 0 ? (
                    <div className={styles.emptyState}>No rules defined yet</div>
                  ) : (
                    <div className={styles.rulesList}>
                      {currentStep.conditions.map((rule) => (
                        <div key={rule.id} className={styles.ruleRow}>
                          <s-select
                            label="Type"
                            onChange={(e: Event) =>
                              updateRule(
                                rule.id,
                                "conditionType",
                                (e.target as HTMLSelectElement).value
                              )
                            }
                          >
                            {[...STEP_CONDITION_TYPE_OPTIONS].map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                selected={
                                  rule.conditionType === opt.value || undefined
                                }
                              >
                                {opt.label}
                              </option>
                            ))}
                          </s-select>

                          <s-select
                            label="Operator"
                            onChange={(e: Event) =>
                              updateRule(
                                rule.id,
                                "conditionOperator",
                                (e.target as HTMLSelectElement).value
                              )
                            }
                          >
                            {[...STEP_CONDITION_OPERATOR_OPTIONS].map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                selected={
                                  rule.conditionOperator === opt.value ||
                                  undefined
                                }
                              >
                                {opt.label}
                              </option>
                            ))}
                          </s-select>

                          <s-text-field
                            label="Value"
                            value={rule.conditionValue}
                            type="number"
                            min="0"
                            autoComplete="off"
                            onInput={(e: Event) =>
                              updateRule(
                                rule.id,
                                "conditionValue",
                                (e.target as HTMLInputElement).value
                              )
                            }
                          />

                          <button
                            className={styles.removeBtn}
                            onClick={() => removeRule(rule.id)}
                            title="Remove rule"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button className={styles.addRuleBtn} onClick={addRule}>
                    + Add Rule
                  </button>
                </div>

                {/* ── Filters Card ── */}
                <div className={styles.card}>
                  <div className={styles.cardHeader} style={{ marginBottom: 4 }}>
                    <h2 className={styles.cardTitle}>Filters</h2>
                  </div>
                  <p className={styles.cardSubtitle}>
                    Customer-facing filters to narrow product selection in this
                    step.
                  </p>

                  {currentStep.filters.length === 0 ? (
                    <div className={styles.emptyState}>No filters defined yet</div>
                  ) : (
                    <div className={styles.rulesList}>
                      {currentStep.filters.map((filter) => (
                        <div key={filter.id} className={styles.filterRow}>
                          <s-select
                            label="Filter by"
                            onChange={(e: Event) =>
                              updateFilter(
                                filter.id,
                                "type",
                                (e.target as HTMLSelectElement).value
                              )
                            }
                          >
                            {[...FILTER_TYPE_OPTIONS].map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                selected={filter.type === opt.value || undefined}
                              >
                                {opt.label}
                              </option>
                            ))}
                          </s-select>

                          <s-text-field
                            label={
                              filter.type === "option"
                                ? "Option name (eg. Color)"
                                : "Tag prefix (eg. size)"
                            }
                            value={filter.label}
                            autoComplete="off"
                            onInput={(e: Event) =>
                              updateFilter(
                                filter.id,
                                "label",
                                (e.target as HTMLInputElement).value
                              )
                            }
                          />

                          <button
                            className={styles.removeBtn}
                            onClick={() => removeFilter(filter.id)}
                            title="Remove filter"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button className={styles.addRuleBtn} onClick={addFilter}>
                    + Add Filter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.rightCol}>
            {/* Bundle Status */}
            <div
              className={styles.sideCard}
              data-tour-target="wizard-bundle-status"
            >
              <h3 className={styles.sideCardTitle}>Bundle Status</h3>
              <s-select
                ref={statusSelectRef}
                label=""
                onChange={(e: Event) =>
                  setBundleStatus((e.target as HTMLSelectElement).value)
                }
              >
                {BUNDLE_STATUS_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    selected={bundleStatus === opt.value || undefined}
                  >
                    {opt.label}
                  </option>
                ))}
              </s-select>
            </div>

            {/* Step Summary */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideCardTitle}>Step Summary</h3>
              <p className={styles.summaryHelperText}>
                Select product here will be displayed on this step
              </p>
              <div className={styles.summaryList}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 5l-8 4-8-4" />
                    </svg>
                  </span>
                  <span className={styles.summaryLabel}>Selected products</span>
                  <span
                    className={
                      selectedProductCount + selectedCollectionCount > 0
                        ? styles.summaryValueActive
                        : styles.summaryValue
                    }
                  >
                    {selectedProductCount + selectedCollectionCount || "—"}
                  </span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </span>
                  <span className={styles.summaryLabel}>Rules</span>
                  <span className={rulesCount > 0 ? styles.summaryValueActive : styles.summaryValue}>
                    {rulesCount > 0 ? rulesCount : "None"}
                  </span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                  </span>
                  <span className={styles.summaryLabel}>Filters</span>
                  <span className={filtersCount > 0 ? styles.summaryValueActive : styles.summaryValue}>
                    {filtersCount > 0 ? filtersCount : "None"}
                  </span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                  </span>
                  <span className={styles.summaryLabel}>Search Bar</span>
                  <span className={searchBarEnabled ? styles.summaryValueActive : styles.summaryValue}>
                    {searchBarEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </span>
                  <span className={styles.summaryLabel}>Custom Fields</span>
                  <span className={styles.summaryValue}>0</span>
                </div>
              </div>

              <button className={styles.previewBtn} onClick={handlePreview}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                Preview
              </button>
            </div>

            {/* Pro Tip */}
            <div className={styles.proTipCard}>
              <div className={styles.proTipHeader}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <path fill="white" d="M12 16v-4M12 8h.01" strokeWidth="2" stroke="white" />
                </svg>
                PRO TIP
              </div>
              <p className={styles.proTipText}>
                Bundles with 3+ products see 24% higher conversion rates when
                search filters are enabled.
              </p>
            </div>

            {/* Back + Next */}
            <div className={styles.wizardFooter}>
              <s-button variant="secondary" onClick={() => window.history.back()}>
                Back
              </s-button>
              <s-button
                variant="primary"
                loading={isSubmitting || undefined}
                onClick={handleNext}
              >
                Next
              </s-button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden submit form */}
      <Form method="post" style={{ display: "none" }}>
        <input type="hidden" name="steps" value={JSON.stringify(steps)} />
        <input type="hidden" name="bundleStatus" value={bundleStatus} />
        <input
          type="hidden"
          name="searchBarEnabled"
          value={String(searchBarEnabled)}
        />
        <input
          type="hidden"
          name="textOverridesByLocale"
          value={JSON.stringify(textOverridesByLocale)}
        />
        <button ref={submitRef} type="submit" />
      </Form>

      {/* Multi-Language Modal */}
      {localeModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setLocaleModalOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Multi Language</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setLocaleModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
                Translating: <strong>Step {currentIdx + 1}</strong> —{" "}
                {currentStep.name || "unnamed step"}
              </p>

              {shopLocales.filter((l) => !l.primary).length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 14 }}>
                  No additional locales published in your store. Enable more
                  languages in Shopify Settings → Languages.
                </p>
              ) : (
                <>
                  <div>
                    <p className={styles.modalSectionTitle}>Language</p>
                    <s-select
                      ref={localeSelectRef}
                      label=""
                      onChange={(e: Event) =>
                        setSelectedLocale(
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      {shopLocales
                        .filter((l) => !l.primary)
                        .map((l) => (
                          <option
                            key={l.locale}
                            value={l.locale}
                            selected={selectedLocale === l.locale || undefined}
                          >
                            {l.name}
                          </option>
                        ))}
                    </s-select>
                  </div>

                  {selectedLocale && (
                    <div>
                      <p className={styles.modalSectionTitle}>
                        Step Name ({selectedLocale})
                      </p>
                      <p className={styles.modalHint}>
                        Leave blank to fall back to the default English name.
                      </p>
                      <s-text-field
                        label=""
                        placeholder={currentStep.name || "Step name in English"}
                        value={getTranslation(selectedLocale)}
                        onInput={(e: Event) =>
                          setTranslation(
                            selectedLocale,
                            (e.target as HTMLInputElement).value
                          )
                        }
                        autoComplete="off"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <s-button
                variant="secondary"
                onClick={() => setLocaleModalOpen(false)}
              >
                Cancel
              </s-button>
              <s-button
                variant="primary"
                onClick={() => setLocaleModalOpen(false)}
              >
                Save
              </s-button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Tour */}
      <BundleGuidedTour
        steps={WIZARD_CONFIGURE_TOUR_STEPS}
        shop={shop}
        bundleId={bundle.id}
        onComplete={() => setReadinessOpen(true)}
        onDismiss={() => {}}
      />

      {/* Readiness Score Widget */}
      <BundleReadinessOverlay
        items={readinessItems}
        bundleId={bundle.id}
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
      />
    </>
  );
}
