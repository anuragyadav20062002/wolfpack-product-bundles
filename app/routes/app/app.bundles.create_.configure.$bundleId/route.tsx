import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
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
  DISCOUNT_METHOD_OPTIONS,
  DISCOUNT_CONDITION_TYPE_OPTIONS,
  DISCOUNT_OPERATOR_OPTIONS,
} from "../../../constants/bundle";
import {
  DiscountMethod,
  ConditionType,
  amountToCents,
  centsToAmount,
} from "../../../types/pricing";
import { useBundlePricing } from "../../../hooks/useBundlePricing";
import { FilePicker } from "../../../components/design-control-panel/settings/FilePicker";
import { BundleGuidedTour } from "../../../components/bundle-configure/BundleGuidedTour";
import { BundleReadinessOverlay, type BundleReadinessItem } from "../../../components/bundle-configure/BundleReadinessOverlay";
import { WIZARD_CONFIGURE_TOUR_STEPS } from "../../../components/bundle-configure/tourSteps";
import { StepSummary } from "./StepSummary";
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

interface CustomFieldDef {
  id: string;
  dbId: string | null;
  label: string;
  fieldType: "text" | "select" | "checkbox" | "number";
  required: boolean;
  options: string[];
}

interface TierDef {
  id: string;
  label: string;
  linkedBundleId: string;
}

type TierErrors = Record<string, { label?: string; linkedBundleId?: string }>;

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

const STEPS_META = [
  { num: "01", label: "Bundle name\n& Description" },
  { num: "02", label: "Configuration" },
  { num: "03", label: "Pricing" },
  { num: "04", label: "Assets" },
  { num: "05", label: "Pricing Tiers" },
];

const FILTER_TYPE_OPTIONS = [
  { value: "tag", label: "Tag" },
  { value: "option", label: "Product Option" },
];

const CUSTOM_FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "number", label: "Number" },
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
      customFields: { orderBy: { position: "asc" } },
    },
  });

  if (!bundle) return redirect("/app/bundles");

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

  let appEmbedEnabled = false;
  try {
    const { checkAppEmbedEnabled } = await import(
      "../../../services/theme/app-embed-check.server"
    );
    const result = await checkAppEmbedEnabled(admin, session.shop);
    appEmbedEnabled = result.enabled;
  } catch {}

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

  const routeBase =
    bundle.bundleType === "full_page" ? "full-page-bundle" : "product-page-bundle";

  // Fetch sibling FPB bundles for the Pricing Tiers "Linked Bundle" dropdown
  const fpbBundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      bundleType: "full_page",
      id: { not: bundleId },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return json({
    bundle: {
      id: bundle.id,
      name: bundle.name,
      status: bundle.status,
      bundleType: bundle.bundleType,
      searchBarEnabled: bundle.searchBarEnabled,
      promoBannerBgImage: bundle.promoBannerBgImage ?? null,
      promoBannerBgImageCrop: bundle.promoBannerBgImageCrop ?? null,
      loadingGif: bundle.loadingGif ?? null,
      tierConfig: (bundle.tierConfig as Array<{ label: string; linkedBundleId: string }> | null) ?? [],
      shopifyProductId: bundle.shopifyProductId,
      shopifyPageId: bundle.shopifyPageId,
      textOverridesByLocale: (bundle.textOverridesByLocale as any) ?? {},
      steps: bundle.steps as any[],
      customFields: bundle.customFields.map((cf) => ({
        id: cf.id,
        label: cf.label,
        fieldType: cf.fieldType,
        required: cf.required,
        options: (cf.options as string[] | null) ?? [],
      })),
      pricing: bundle.pricing
        ? {
            enabled: bundle.pricing.enabled,
            method: bundle.pricing.method as string,
            rules: bundle.pricing.rules,
            showFooter: bundle.pricing.showFooter,
            showProgressBar: bundle.pricing.showProgressBar,
            messages: bundle.pricing.messages,
          }
        : null,
    },
    readiness: {
      appEmbedEnabled,
      hasDiscount: bundle.pricing?.enabled ?? false,
      hasBundleVisibility: !!(
        bundle.shopifyPageId || bundle.status === "active"
      ),
      parentProductActive,
    },
    configureUrl: `/app/bundles/${routeBase}/configure/${bundle.id}`,
    shopLocales,
    shop: session.shop,
    fpbBundles,
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
  const intent = formData.get("_intent") as string | null;

  // ── Save Pricing (Step 03) ───────────────────────────────────
  if (intent === "savePricing") {
    const raw = formData.get("pricingData") as string;
    const p = JSON.parse(raw || "{}");

    await db.bundlePricing.upsert({
      where: { bundleId },
      create: {
        bundleId,
        enabled: p.discountEnabled ?? false,
        method: p.discountType ?? "percentage_off",
        rules: p.discountRules ?? [],
        showFooter: p.discountMessagingEnabled ?? true,
        showProgressBar: p.showProgressBar ?? true,
        messages: p.messages ?? null,
      },
      update: {
        enabled: p.discountEnabled ?? false,
        method: p.discountType ?? "percentage_off",
        rules: p.discountRules ?? [],
        showFooter: p.discountMessagingEnabled ?? true,
        showProgressBar: p.showProgressBar ?? true,
        messages: p.messages ?? null,
      },
    });

    return json({ ok: true, intent: "savePricing" });
  }

  // ── Save Tiers (Step 05) ────────────────────────────────────
  if (intent === "saveTiers") {
    const tiersJson = formData.get("tiers") as string;
    const tiers: Array<{ label: string; linkedBundleId: string }> = JSON.parse(
      tiersJson || "[]"
    );
    await db.bundle.update({
      where: { id: bundleId },
      data: { tierConfig: tiers },
    });
    const routeBase =
      bundle.bundleType === "full_page"
        ? "full-page-bundle"
        : "product-page-bundle";
    return json({
      ok: true,
      intent: "saveTiers",
      redirectTo: `/app/bundles/${routeBase}/configure/${bundle.id}`,
    });
  }

  // ── Save Assets (Step 04) ───────────────────────────────────
  if (intent === "saveAssets") {
    const promoBannerBgImage =
      (formData.get("promoBannerBgImage") as string) || null;
    const promoBannerBgImageCrop =
      (formData.get("promoBannerBgImageCrop") as string) || null;
    const loadingGif = (formData.get("loadingGif") as string) || null;
    const searchBarEnabled = formData.get("searchBarEnabled") === "true";
    const stepsFiltersJson = formData.get("stepsFilters") as string;
    const customFieldsJson = formData.get("customFields") as string;

    await db.bundle.update({
      where: { id: bundleId },
      data: {
        promoBannerBgImage: promoBannerBgImage || null,
        promoBannerBgImageCrop: promoBannerBgImageCrop || null,
        loadingGif: loadingGif || null,
        searchBarEnabled,
      },
    });

    const stepsFilters: Array<{ stepDbId: string; filters: FilterDef[] }> =
      JSON.parse(stepsFiltersJson || "[]");
    for (const sf of stepsFilters) {
      if (sf.stepDbId) {
        await db.bundleStep.update({
          where: { id: sf.stepDbId },
          data: {
            filters:
              sf.filters && sf.filters.length > 0
                ? (sf.filters as any)
                : null,
          },
        });
      }
    }

    const customFieldsData: Array<{
      label: string;
      fieldType: string;
      required: boolean;
      options: string[];
    }> = JSON.parse(customFieldsJson || "[]");
    await db.bundleCustomField.deleteMany({ where: { bundleId } });
    for (const [i, cf] of customFieldsData.entries()) {
      await db.bundleCustomField.create({
        data: {
          bundleId,
          label: cf.label,
          fieldType: cf.fieldType,
          required: cf.required,
          position: i,
          options:
            cf.options && cf.options.length > 0 ? cf.options : null,
        },
      });
    }

    const routeBase =
      bundle.bundleType === "full_page"
        ? "full-page-bundle"
        : "product-page-bundle";
    return json({
      ok: true,
      intent: "saveAssets",
      redirectTo: `/app/bundles/${routeBase}/configure/${bundle.id}`,
    });
  }

  // ── Save Config (Step 02) ────────────────────────────────────
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
    data: { status: bundleStatus as any, searchBarEnabled, textOverridesByLocale },
  });

  const submittedDbIds = wizardSteps.filter((s) => s.dbId).map((s) => s.dbId!);
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
      conditionValue: c1?.conditionValue ? parseInt(c1.conditionValue, 10) : null,
      conditionOperator2: c2?.conditionOperator || null,
      conditionValue2: c2?.conditionValue ? parseInt(c2.conditionValue, 10) : null,
      filters: ws.filters && ws.filters.length > 0 ? (ws.filters as any) : null,
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

    await db.stepProduct.deleteMany({ where: { stepId } });
    for (const [pi, product] of (ws.products || []).entries()) {
      await db.stepProduct.create({
        data: {
          stepId,
          productId: product.id,
          title: product.title || "",
          imageUrl:
            product.imageUrl || product.images?.[0]?.originalSrc || null,
          variants: product.variants ?? [],
          position: pi,
        },
      });
    }
  }

  return json({ ok: true, intent: "saveConfig" });
};

// ── Component ─────────────────────────────────────────────────────

export default function WizardConfigureStep() {
  const { bundle, readiness, shopLocales, shop, fpbBundles } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // ── Fetchers ───────────────────────────────────────────────────
  const configFetcher = useFetcher<{ ok: boolean; intent: string }>();
  const pricingFetcher = useFetcher<{ ok: boolean; intent: string }>();
  const assetsFetcher = useFetcher<{
    ok: boolean;
    intent: string;
    redirectTo: string;
  }>();
  const tiersFetcher = useFetcher<{
    ok: boolean;
    intent: string;
    redirectTo: string;
  }>();

  // ── Wizard step (1=Config 02, 2=Pricing 03) ───────────────────
  const [wizardStep, setWizardStep] = useState(1);

  // ── Step 02 state ──────────────────────────────────────────────
  const [steps, setSteps] = useState<WizardStepState[]>(() =>
    initSteps(bundle.steps)
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<"forward" | "backward" | null>(null);
  const [slideKey, setSlideKey] = useState(0);
  const [bundleStatus, setBundleStatus] = useState<string>(bundle.status);
  const [searchBarEnabled, setSearchBarEnabled] = useState<boolean>(bundle.searchBarEnabled);
  const [textOverridesByLocale, setTextOverridesByLocale] = useState<
    Record<string, Record<string, string>>
  >(bundle.textOverridesByLocale ?? {});
  const [localeModalOpen, setLocaleModalOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState(
    () => shopLocales.find((l) => !l.primary)?.locale ?? ""
  );
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const statusSelectRef = useRef<any>(null);
  const localeSelectRef = useRef<any>(null);

  // ── Step 03 Pricing state ─────────────────────────────────────
  const pricing = useBundlePricing({
    initialPricing: bundle.pricing
      ? {
          enabled: bundle.pricing.enabled,
          method: bundle.pricing.method as any,
          rules: bundle.pricing.rules as any,
          showFooter: bundle.pricing.showFooter,
        }
      : null,
    onStateChange: () => {},
  });

  const [showProgressBar, setShowProgressBar] = useState(
    bundle.pricing?.showProgressBar !== false
  );
  const [discountMessagingEnabled, setDiscountMessagingEnabled] = useState(
    bundle.pricing?.showFooter !== false
  );
  const [progressMessage, setProgressMessage] = useState(
    (bundle.pricing?.messages as any)?.progress ??
      "Add {{conditionText}} to get {{discountText}}"
  );
  const [qualifiedMessage, setQualifiedMessage] = useState(
    (bundle.pricing?.messages as any)?.qualified ??
      "Congratulations! You got {{discountText}}!"
  );

  // ── Step 04 Assets state ──────────────────────────────────────
  const [promoBannerBgImage, setPromoBannerBgImage] = useState<string | null>(
    bundle.promoBannerBgImage ?? null
  );
  const [promoBannerBgImageCrop, setPromoBannerBgImageCrop] = useState<
    string | null
  >(bundle.promoBannerBgImageCrop ?? null);
  const [loadingGif, setLoadingGif] = useState<string | null>(
    bundle.loadingGif ?? null
  );
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [filtersDrawerStepIdx, setFiltersDrawerStepIdx] = useState(0);
  const [customFieldsModalOpen, setCustomFieldsModalOpen] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>(() =>
    (bundle.customFields ?? []).map((cf: any) => ({
      id: crypto.randomUUID(),
      dbId: cf.id as string,
      label: cf.label as string,
      fieldType: cf.fieldType as CustomFieldDef["fieldType"],
      required: cf.required as boolean,
      options: (cf.options as string[]) ?? [],
    }))
  );

  // ── Step 05 Pricing Tiers state ────────────────────────────────
  const [tiers, setTiers] = useState<
    Array<{ id: string; label: string; linkedBundleId: string }>
  >(() =>
    (bundle.tierConfig ?? []).map((t) => ({
      ...t,
      id: crypto.randomUUID(),
    }))
  );

  // ── Effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (statusSelectRef.current)
      (statusSelectRef.current as any).value = bundleStatus;
  }, [bundleStatus]);

  useEffect(() => {
    if (localeSelectRef.current && selectedLocale)
      (localeSelectRef.current as any).value = selectedLocale;
  }, [selectedLocale, localeModalOpen]);

  useEffect(() => {
    if (
      configFetcher.data?.ok &&
      configFetcher.data.intent === "saveConfig" &&
      configFetcher.state === "idle"
    ) {
      setWizardStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [configFetcher.data, configFetcher.state]);

  useEffect(() => {
    if (
      pricingFetcher.data?.ok &&
      pricingFetcher.data.intent === "savePricing" &&
      pricingFetcher.state === "idle"
    ) {
      setWizardStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pricingFetcher.data, pricingFetcher.state]);

  useEffect(() => {
    if (
      assetsFetcher.data?.ok &&
      assetsFetcher.data.intent === "saveAssets" &&
      assetsFetcher.state === "idle"
    ) {
      setWizardStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [assetsFetcher.data, assetsFetcher.state]);

  useEffect(() => {
    if (
      tiersFetcher.data?.ok &&
      tiersFetcher.data.intent === "saveTiers" &&
      tiersFetcher.state === "idle"
    ) {
      navigate(tiersFetcher.data.redirectTo);
    }
  }, [tiersFetcher.data, tiersFetcher.state, navigate]);

  const currentStep = steps[currentIdx];

  // ── Derived ────────────────────────────────────────────────────
  const pageTitle =
    wizardStep === 1
      ? "Configuration"
      : wizardStep === 2
      ? "Pricing"
      : wizardStep === 3
      ? "Assets"
      : "Pricing Tiers";
  const isSubmitting =
    wizardStep === 1
      ? configFetcher.state === "submitting"
      : wizardStep === 2
      ? pricingFetcher.state === "submitting"
      : wizardStep === 3
      ? assetsFetcher.state === "submitting"
      : tiersFetcher.state === "submitting";

  // ── Step 02 mutations ──────────────────────────────────────────
  const updateStep = useCallback(
    (idx: number, field: keyof WizardStepState, value: any) => {
      setSteps((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const updateCurrent = useCallback(
    (field: keyof WizardStepState, value: any) =>
      updateStep(currentIdx, field, value),
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
        imageUrl: p.images?.[0]?.originalSrc ?? p.images?.[0]?.url ?? null,
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

  // ── Step 04: Filters ──────────────────────────────────────────
  const addFilter = useCallback((stepIdx: number) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx
          ? {
              ...s,
              filters: [
                ...s.filters,
                { id: crypto.randomUUID(), type: "tag" as const, label: "" },
              ],
            }
          : s
      )
    );
  }, []);

  const removeFilter = useCallback((stepIdx: number, filterId: string) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx
          ? { ...s, filters: s.filters.filter((f) => f.id !== filterId) }
          : s
      )
    );
  }, []);

  const updateFilter = useCallback(
    (stepIdx: number, filterId: string, updates: Partial<FilterDef>) => {
      setSteps((prev) =>
        prev.map((s, i) =>
          i === stepIdx
            ? {
                ...s,
                filters: s.filters.map((f) =>
                  f.id === filterId ? { ...f, ...updates } : f
                ),
              }
            : s
        )
      );
    },
    []
  );

  // ── Step 04: Custom Fields ─────────────────────────────────────
  const addCustomField = useCallback(() => {
    setCustomFields((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        dbId: null,
        label: "",
        fieldType: "text" as const,
        required: false,
        options: [],
      },
    ]);
  }, []);

  const removeCustomField = useCallback((id: string) => {
    setCustomFields((prev) => prev.filter((cf) => cf.id !== id));
  }, []);

  const updateCustomField = useCallback(
    (id: string, updates: Partial<CustomFieldDef>) => {
      setCustomFields((prev) =>
        prev.map((cf) => (cf.id === id ? { ...cf, ...updates } : cf))
      );
    },
    []
  );

  // ── Navigation ─────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (wizardStep === 1) {
      window.history.back();
    } else {
      setWizardStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [wizardStep]);

  const handleNext = useCallback(() => {
    if (wizardStep === 1) {
      const fd = new FormData();
      fd.set("_intent", "saveConfig");
      fd.set("steps", JSON.stringify(steps));
      fd.set("bundleStatus", bundleStatus);
      fd.set("searchBarEnabled", String(searchBarEnabled));
      fd.set("textOverridesByLocale", JSON.stringify(textOverridesByLocale));
      configFetcher.submit(fd, { method: "post" });
    } else if (wizardStep === 2) {
      const fd = new FormData();
      fd.set("_intent", "savePricing");
      fd.set(
        "pricingData",
        JSON.stringify({
          discountEnabled: pricing.discountEnabled,
          discountType: pricing.discountType,
          discountRules: pricing.discountRules,
          discountMessagingEnabled,
          showProgressBar,
          messages: {
            progress: progressMessage,
            qualified: qualifiedMessage,
            showInCart: discountMessagingEnabled,
          },
        })
      );
      pricingFetcher.submit(fd, { method: "post" });
    } else if (wizardStep === 3) {
      const fd = new FormData();
      fd.set("_intent", "saveAssets");
      fd.set("promoBannerBgImage", promoBannerBgImage ?? "");
      fd.set("promoBannerBgImageCrop", promoBannerBgImageCrop ?? "");
      fd.set("loadingGif", loadingGif ?? "");
      fd.set("searchBarEnabled", String(searchBarEnabled));
      fd.set(
        "stepsFilters",
        JSON.stringify(
          steps
            .filter((s) => s.dbId)
            .map((s) => ({ stepDbId: s.dbId, filters: s.filters }))
        )
      );
      fd.set("customFields", JSON.stringify(customFields));
      assetsFetcher.submit(fd, { method: "post" });
    } else if (wizardStep === 4) {
      const fd = new FormData();
      fd.set("_intent", "saveTiers");
      fd.set(
        "tiers",
        JSON.stringify(
          tiers.map(({ label, linkedBundleId }) => ({ label, linkedBundleId }))
        )
      );
      tiersFetcher.submit(fd, { method: "post" });
    }
  }, [
    wizardStep,
    steps,
    bundleStatus,
    searchBarEnabled,
    textOverridesByLocale,
    configFetcher,
    pricingFetcher,
    assetsFetcher,
    tiersFetcher,
    pricing,
    showProgressBar,
    discountMessagingEnabled,
    progressMessage,
    qualifiedMessage,
    promoBannerBgImage,
    promoBannerBgImageCrop,
    loadingGif,
    customFields,
    tiers,
  ]);

  // ── Locale helpers ─────────────────────────────────────────────
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

  // ── Readiness ──────────────────────────────────────────────────
  const hasProducts = steps.some(
    (s) => s.products.length > 0 || s.collections.length > 0
  );
  const readinessItems: BundleReadinessItem[] = [
    { key: "embed", label: "App embed enabled", points: 15, done: readiness.appEmbedEnabled },
    { key: "products", label: "Products added to a step", points: 20, done: hasProducts },
    { key: "discount", label: "Discount configured", points: 15, done: readiness.hasDiscount },
    { key: "visible", label: "Bundle placed / visible", points: 25, done: readiness.hasBundleVisibility },
    { key: "product_active", label: "Parent product active", points: 15, done: readiness.parentProductActive },
  ];

  const selectedProductCount = currentStep.products.length;
  const selectedCollectionCount = currentStep.collections.length;
  const rulesCount = currentStep.conditions.length;
  const filtersCount = currentStep.filters.length;
  const customFieldsCount = customFields.length;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <ui-title-bar title={pageTitle}>
        <button variant="breadcrumb" onClick={() => window.history.back()}>
          Create Bundle
        </button>
      </ui-title-bar>

      <div className={styles.page}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <s-button
              variant="tertiary"
              icon="arrow-left"
              accessibilityLabel="Back"
              onClick={handleBack}
            />
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
          </div>
          <s-button
            variant="secondary"
            href="https://wolfpackapps.com/docs/bundle-configuration"
            target="_blank"
          >
            How to configure?
          </s-button>
        </div>

        {/* Step indicator — dynamic based on wizardStep */}
        <div className={styles.stepIndicator}>
          {STEPS_META.map((step, idx) => (
            <Fragment key={step.num}>
              {idx > 0 && <div className={styles.stepConnector} />}
              <div className={styles.stepItem}>
                {idx < wizardStep ? (
                  <>
                    <div className={styles.stepCircleDone}>✓</div>
                    <span className={styles.stepLabelDone}>{step.label}</span>
                  </>
                ) : idx === wizardStep ? (
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

        {/* ══════════════════════════════════════════════════════
            STEP 02 — Configuration
        ══════════════════════════════════════════════════════ */}
        {wizardStep === 1 && (
          <>
            {/* Step chip navigation */}
            <div className={styles.stepNav}>
              {steps.map((s, i) => (
                <button
                  key={s.tempId}
                  className={
                    i === currentIdx ? styles.stepChipActive : styles.stepChip
                  }
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

            <div className={styles.layout}>
              {/* LEFT — Config cards */}
              <div className={styles.leftCol}>
                <div
                  key={slideKey}
                  className={
                    slideDir
                      ? styles[
                          `slide${slideDir.charAt(0).toUpperCase()}${slideDir.slice(1)}`
                        ]
                      : ""
                  }
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Step Configuration */}
                    <div
                      className={styles.card}
                      data-tour-target="wizard-step-config"
                    >
                      <div className={styles.cardHeader}>
                        <s-heading>Step Configuration</s-heading>
                        <s-button
                          variant="secondary"
                          icon="globe"
                          onClick={() => setLocaleModalOpen(true)}
                        >
                          Multi Language
                        </s-button>
                      </div>

                      <div className={styles.stepConfigRow}>
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
                                <svg
                                  width="48"
                                  height="48"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#d1d5db"
                                  strokeWidth="1.5"
                                >
                                  <path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 5l-8 4-8-4" />
                                </svg>
                              </div>
                            )}
                          </div>

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

                          <s-button
                            variant="secondary"
                            icon="upload"
                            onClick={() => setShowIconPicker((v) => !v)}
                          >
                            {showIconPicker ? "Close picker" : "Upload Icon"}
                          </s-button>
                          <s-text color="subdued">512×512 px · PNG/SVG</s-text>
                        </div>

                        <div className={styles.fieldsColumn}>
                          <s-text-field
                            label="Step Name"
                            placeholder="Eg:- Add product"
                            value={currentStep.name}
                            onInput={(e: Event) =>
                              updateCurrent(
                                "name",
                                (e.target as HTMLInputElement).value
                              )
                            }
                            autoComplete="off"
                          />
                          <div>
                            <s-text-field
                              label="Product Page Title"
                              placeholder="Eg:- Customized T-shirt Bundle for you"
                              value={currentStep.pageTitle}
                              onInput={(e: Event) =>
                                updateCurrent(
                                  "pageTitle",
                                  (e.target as HTMLInputElement).value
                                )
                              }
                              autoComplete="off"
                            />
                            <s-text color="subdued">
                              This text will appear as the page header right after the navigation bar.
                            </s-text>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Select Product */}
                    <div
                      className={styles.card}
                      data-tour-target="wizard-select-product"
                    >
                      <div
                        className={styles.cardHeader}
                        style={{ marginBottom: 4 }}
                      >
                        <s-heading>Select Product</s-heading>
                      </div>
                      <s-text color="subdued">
                        Select product or collection to show in step
                      </s-text>

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
                            <span className={styles.tabBadge}>
                              {selectedProductCount}
                            </span>
                          )}
                        </button>
                        <button
                          className={
                            currentStep.activeTab === "collections"
                              ? styles.tabActive
                              : styles.tab
                          }
                          onClick={() =>
                            updateCurrent("activeTab", "collections")
                          }
                        >
                          Browse Collections
                          {selectedCollectionCount > 0 && (
                            <span className={styles.tabBadge}>
                              {selectedCollectionCount}
                            </span>
                          )}
                        </button>
                      </div>

                      <s-text color="subdued">
                        Select{" "}
                        {currentStep.activeTab === "products"
                          ? "product"
                          : "collection"}{" "}
                        here will be displayed on this step
                      </s-text>

                      <div className={styles.productActions}>
                        <s-button
                          variant="primary"
                          onClick={
                            currentStep.activeTab === "products"
                              ? pickProducts
                              : pickCollections
                          }
                        >
                          {currentStep.activeTab === "products"
                            ? "Add Product"
                            : "Add Collection"}
                        </s-button>

                        {currentStep.activeTab === "products" &&
                          selectedProductCount > 0 && (
                            <s-clickable onClick={pickProducts}>
                              <s-badge tone="success">
                                {selectedProductCount} Selected
                              </s-badge>
                            </s-clickable>
                          )}

                        {currentStep.activeTab === "collections" &&
                          selectedCollectionCount > 0 && (
                            <s-clickable onClick={pickCollections}>
                              <s-badge tone="success">
                                {selectedCollectionCount} Selected
                              </s-badge>
                            </s-clickable>
                          )}
                      </div>

                      <s-checkbox
                        label="Pre-select all products on this step"
                        checked={currentStep.preSelectAll || undefined}
                        onChange={(e: Event) =>
                          updateCurrent(
                            "preSelectAll",
                            (e.target as HTMLInputElement).checked
                          )
                        }
                      />
                    </div>

                    {/* Rules */}
                    <div className={styles.card} data-tour-target="wizard-rules">
                      <div
                        className={styles.cardHeader}
                        style={{ marginBottom: 4 }}
                      >
                        <s-heading>Rules</s-heading>
                      </div>
                      <s-text color="subdued">
                        Define conditions for product selection and quantity limits.
                      </s-text>

                      {currentStep.conditions.length === 0 ? (
                        <div className={styles.emptyState}>
                          No rules defined yet
                        </div>
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
                                  <s-option
                                    key={opt.value}
                                    value={opt.value}
                                    selected={
                                      rule.conditionType === opt.value ||
                                      undefined
                                    }
                                  >
                                    {opt.label}
                                  </s-option>
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
                                {[...STEP_CONDITION_OPERATOR_OPTIONS].map(
                                  (opt) => (
                                    <s-option
                                      key={opt.value}
                                      value={opt.value}
                                      selected={
                                        rule.conditionOperator === opt.value ||
                                        undefined
                                      }
                                    >
                                      {opt.label}
                                    </s-option>
                                  )
                                )}
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

                              <s-button
                                icon="delete"
                                variant="tertiary"
                                tone="critical"
                                accessibilityLabel="Remove rule"
                                onClick={() => removeRule(rule.id)}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.addRuleWrap}>
                        <s-button variant="secondary" icon="plus" onClick={addRule}>
                          Add Rule
                        </s-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — Config sidebar */}
              <div className={styles.rightCol}>
                <div
                  className={styles.sideCard}
                  data-tour-target="wizard-bundle-status"
                >
                  <s-heading>Bundle Status</s-heading>
                  <s-select
                    ref={statusSelectRef}
                    label=""
                    onChange={(e: Event) =>
                      setBundleStatus(
                        (e.target as HTMLSelectElement).value
                      )
                    }
                  >
                    {BUNDLE_STATUS_OPTIONS.map((opt) => (
                      <s-option
                        key={opt.value}
                        value={opt.value}
                        selected={bundleStatus === opt.value || undefined}
                      >
                        {opt.label}
                      </s-option>
                    ))}
                  </s-select>
                </div>

                <StepSummary
                  selectedCount={selectedProductCount + selectedCollectionCount}
                  rulesCount={rulesCount}
                  filtersCount={filtersCount}
                  searchBarEnabled={searchBarEnabled}
                  customFieldsCount={customFieldsCount}
                  onPreview={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem(`wpb_preview_${bundle.id}`, "1");
                    }
                    shopify.toast.show("Opening preview…");
                  }}
                />

                <s-banner tone="info" heading="PRO TIP">
                  Bundles with 3+ products see 24% higher conversion rates when
                  search filters are enabled.
                </s-banner>

                <div className={styles.wizardFooter}>
                  <s-button variant="secondary" onClick={handleBack}>
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
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 03 — Pricing
        ══════════════════════════════════════════════════════ */}
        {wizardStep === 2 && (
          <div className={styles.assetsLayout}>
              {/* Bundle pricing & Discounts */}
              <div className={styles.card}>
                <div className={styles.pricingCardHeader}>
                  <div>
                    <s-heading>Bundle pricing &amp; Discounts</s-heading>
                    <s-text color="subdued">
                      Set up discount rules, applied from lowest to highest.
                    </s-text>
                  </div>
                  <s-switch
                    checked={pricing.discountEnabled || undefined}
                    onChange={(e: Event) =>
                      pricing.toggleDiscountEnabled(
                        (e.target as HTMLInputElement).checked
                      )
                    }
                  />
                </div>

                <div className={styles.pricingContent}>
                    {/* Tip banner */}
                    <div className={styles.tipBanner}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style={{ flexShrink: 0, marginTop: 1 }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        Tip: Discounts are calculated based on the products in
                        cart, make sure to add the &ldquo;Default Product&rdquo;
                        quantity or amount while configuring discounts.
                      </span>
                    </div>

                    {/* Discount Type */}
                    <s-select
                      label="Discount Type"
                      onChange={(e: Event) => {
                        pricing.changeDiscountType(
                          (e.target as HTMLSelectElement).value as DiscountMethod
                        );
                        pricing.setDiscountRules([]);
                      }}
                    >
                      <s-option
                        value=""
                        disabled={true}
                        selected={!pricing.discountType || undefined}
                      >
                        Select discount type
                      </s-option>
                      {[...DISCOUNT_METHOD_OPTIONS].map((opt) => (
                        <s-option
                          key={opt.value}
                          value={opt.value}
                          selected={
                            pricing.discountType === opt.value || undefined
                          }
                        >
                          {opt.label}
                        </s-option>
                      ))}
                    </s-select>

                    {/* Discount Rules */}
                    {pricing.discountRules.length > 0 && (
                      <div className={styles.rulesList}>
                        {pricing.discountRules.map((rule, index) => (
                          <div key={rule.id} className={styles.discountRuleRow}>
                            <div className={styles.discountRuleHeader}>
                              <s-text>Rule {index + 1}</s-text>
                              <s-button
                                variant="tertiary"
                                tone="critical"
                                icon="delete"
                                accessibilityLabel="Remove rule"
                                onClick={() =>
                                  pricing.removeDiscountRule(rule.id)
                                }
                              />
                            </div>
                            <div className={styles.discountRuleFields}>
                              <s-select
                                label="Condition"
                                onChange={(e: Event) =>
                                  pricing.updateDiscountRule(rule.id, {
                                    condition: {
                                      ...rule.condition,
                                      type: (e.target as HTMLSelectElement)
                                        .value as any,
                                    },
                                  })
                                }
                              >
                                {[...DISCOUNT_CONDITION_TYPE_OPTIONS].map(
                                  (opt) => (
                                    <s-option
                                      key={opt.value}
                                      value={opt.value}
                                      selected={
                                        rule.condition.type === opt.value ||
                                        undefined
                                      }
                                    >
                                      {opt.label}
                                    </s-option>
                                  )
                                )}
                              </s-select>

                              <s-select
                                label="Operator"
                                onChange={(e: Event) =>
                                  pricing.updateDiscountRule(rule.id, {
                                    condition: {
                                      ...rule.condition,
                                      operator: (e.target as HTMLSelectElement)
                                        .value as any,
                                    },
                                  })
                                }
                              >
                                {[...DISCOUNT_OPERATOR_OPTIONS].map((opt) => (
                                  <s-option
                                    key={opt.value}
                                    value={opt.value}
                                    selected={
                                      rule.condition.operator === opt.value ||
                                      undefined
                                    }
                                  >
                                    {opt.label}
                                  </s-option>
                                ))}
                              </s-select>

                              <s-text-field
                                label={
                                  rule.condition.type === ConditionType.AMOUNT
                                    ? "Amount"
                                    : "Qty"
                                }
                                value={String(
                                  rule.condition.type === ConditionType.AMOUNT
                                    ? centsToAmount(rule.condition.value)
                                    : rule.condition.value
                                )}
                                type="number"
                                min="0"
                                autoComplete="off"
                                onInput={(e: Event) => {
                                  const num =
                                    Number(
                                      (e.target as HTMLInputElement).value
                                    ) || 0;
                                  pricing.updateDiscountRule(rule.id, {
                                    condition: {
                                      ...rule.condition,
                                      value:
                                        rule.condition.type ===
                                        ConditionType.AMOUNT
                                          ? amountToCents(num)
                                          : num,
                                    },
                                  });
                                }}
                              />

                              <s-text-field
                                label={
                                  pricing.discountType ===
                                  DiscountMethod.PERCENTAGE_OFF
                                    ? "% Off"
                                    : pricing.discountType ===
                                      DiscountMethod.FIXED_BUNDLE_PRICE
                                    ? "Bundle Price"
                                    : "Amount Off"
                                }
                                value={String(
                                  pricing.discountType ===
                                  DiscountMethod.PERCENTAGE_OFF
                                    ? rule.discount.value
                                    : centsToAmount(rule.discount.value)
                                )}
                                type="number"
                                min="0"
                                autoComplete="off"
                                onInput={(e: Event) => {
                                  const num =
                                    Number(
                                      (e.target as HTMLInputElement).value
                                    ) || 0;
                                  pricing.updateDiscountRule(rule.id, {
                                    discount: {
                                      ...rule.discount,
                                      value:
                                        pricing.discountType ===
                                        DiscountMethod.PERCENTAGE_OFF
                                          ? num
                                          : amountToCents(num),
                                    },
                                  });
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {pricing.discountRules.length < 4 && (
                      <s-button
                        icon="plus"
                        variant="primary"
                        onClick={pricing.addDiscountRule}
                      >
                        Add Rule
                      </s-button>
                    )}
                  </div>
              </div>

              {/* Discount Display Options */}
              <div
                className={`${styles.card} ${
                  !pricing.discountEnabled ? styles.cardDisabled : ""
                }`}
              >
                <div style={{ marginBottom: 16 }}>
                  <s-heading>Discount Display Options</s-heading>
                  <s-text color="subdued">
                    Choose how discounts are displayed
                  </s-text>
                </div>

                <div className={styles.displayOptionRow}>
                  <s-text>Progress bar</s-text>
                  <s-switch
                    checked={showProgressBar || undefined}
                    onChange={(e: Event) =>
                      setShowProgressBar(
                        (e.target as HTMLInputElement).checked
                      )
                    }
                  />
                </div>

                <div className={styles.displayOptionDivider} />

                <div className={styles.displayOptionRow}>
                  <div className={styles.displayOptionInfo}>
                    <s-text>Discount Messaging</s-text>
                    <s-text color="subdued">
                      Edit how discount message appear above the subtotal.
                    </s-text>
                  </div>
                  <s-switch
                    checked={discountMessagingEnabled || undefined}
                    onChange={(e: Event) =>
                      setDiscountMessagingEnabled(
                        (e.target as HTMLInputElement).checked
                      )
                    }
                  />
                </div>

                {discountMessagingEnabled && pricing.discountEnabled && (
                  <div className={styles.messageTemplateSection}>
                    <s-text-field
                      label="Progress message"
                      placeholder="Add {{conditionText}} to get {{discountText}}"
                      value={progressMessage}
                      onInput={(e: Event) =>
                        setProgressMessage(
                          (e.target as HTMLInputElement).value
                        )
                      }
                      autoComplete="off"
                    />
                    <s-text-field
                      label="Qualified message"
                      placeholder="Congratulations! You got {{discountText}}!"
                      value={qualifiedMessage}
                      onInput={(e: Event) =>
                        setQualifiedMessage(
                          (e.target as HTMLInputElement).value
                        )
                      }
                      autoComplete="off"
                    />
                    <s-text color="subdued">
                      {"Variables: {{conditionText}}, {{discountText}}, {{bundleName}}"}
                    </s-text>
                  </div>
                )}
              </div>

            <div className={styles.wizardFooter}>
              <s-button variant="secondary" onClick={handleBack}>
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
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 04 — Assets
        ══════════════════════════════════════════════════════ */}
        {wizardStep === 3 && (
          <div className={styles.assetsLayout}>
            {/* Media Assets */}
            <div className={styles.card}>
              <div style={{ marginBottom: 20 }}>
                <s-heading>Media Assets</s-heading>
                <s-text color="subdued">
                  Add visual media to your bundle configurator to enhance the customer experience on your storefront.
                </s-text>
              </div>
              <div className={styles.assetsGrid}>
                <div className={styles.assetBlock}>
                  <s-heading>Promo Banner</s-heading>
                  <FilePicker
                    value={promoBannerBgImage}
                    onChange={setPromoBannerBgImage}
                    cropValue={promoBannerBgImageCrop}
                    onCropChange={setPromoBannerBgImageCrop}
                    label="Choose background image"
                    hint="Recommended: 1920×400px"
                    uploadLabel="Upload image"
                  />
                  <div className={styles.formatChip}>
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Format: JPG, PNG, WebP
                  </div>
                </div>
                <div className={styles.assetBlock}>
                  <s-heading>Loading Animation</s-heading>
                  <FilePicker
                    value={loadingGif}
                    onChange={setLoadingGif}
                    label="Choose loading GIF"
                    hint="Recommended: 150×150px"
                    uploadLabel="Upload"
                    hideCropEditor
                  />
                  <div className={styles.formatChip}>
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Format: GIF only
                  </div>
                </div>
              </div>
            </div>

            {/* Filters + Search Bar + Custom Fields — single card */}
            <div className={styles.card}>
              {/* Filters */}
              <div
                className={styles.assetRow}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => setFiltersDrawerOpen(true)}
                onKeyDown={(e) => e.key === "Enter" && setFiltersDrawerOpen(true)}
              >
                <div className={styles.assetRowLeft}>
                  <s-icon type="filter" />
                  <div>
                    <p className={styles.assetRowTitle}>Filters</p>
                    <p className={styles.assetRowSubtitle}>
                      Create filters to display on this step
                    </p>
                  </div>
                </div>
                <s-button
                  variant="tertiary"
                  icon="arrow-right"
                  accessibilityLabel="Configure filters"
                />
              </div>

              <div className={styles.displayOptionDivider} />

              {/* Search Bar */}
              <div className={styles.assetRow}>
                <div className={styles.assetRowLeft}>
                  <s-icon type="search" />
                  <div>
                    <p className={styles.assetRowTitle}>Search Bar</p>
                    <p className={styles.assetRowSubtitle}>
                      Show a product search bar inside the bundle widget
                    </p>
                  </div>
                </div>
                <s-switch
                  checked={searchBarEnabled || undefined}
                  onChange={(e: Event) =>
                    setSearchBarEnabled((e.target as HTMLInputElement).checked)
                  }
                />
              </div>

              <div className={styles.displayOptionDivider} />

              {/* Custom Fields */}
              <div
                className={styles.assetRow}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => setCustomFieldsModalOpen(true)}
                onKeyDown={(e) =>
                  e.key === "Enter" && setCustomFieldsModalOpen(true)
                }
              >
                <div className={styles.assetRowLeft}>
                  <s-icon type="edit" />
                  <div>
                    <p className={styles.assetRowTitle}>Custom Fields</p>
                    <p className={styles.assetRowSubtitle}>
                      Add custom input fields (like gift notes or delivery dates) that will be attached to the order line items.
                    </p>
                  </div>
                </div>
                <s-button
                  variant="tertiary"
                  icon="arrow-right"
                  accessibilityLabel="Configure custom fields"
                />
              </div>
            </div>

            {/* Footer */}
            <div className={styles.wizardFooter}>
              <s-button variant="secondary" onClick={handleBack}>
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
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 05 — Pricing Tiers
        ══════════════════════════════════════════════════════ */}
        {wizardStep === 4 && (
          <div className={styles.assetsLayout}>
            <div className={styles.card}>
              <div style={{ marginBottom: 20 }}>
                <s-heading>Pricing Tiers</s-heading>
                <s-text color="subdued">
                  Let shoppers switch between different bundle price points on the same page.
                </s-text>
              </div>

              {tiers.map((tier, idx) => (
                <div
                  key={tier.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "16px",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#303030" }}>
                      Tier {idx + 1}
                    </span>
                    <button
                      type="button"
                      aria-label="Delete tier"
                      onClick={() =>
                        setTiers((prev) => prev.filter((t) => t.id !== tier.id))
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        color: "#d82c0d",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <div>
                      <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "#303030" }}>
                        Label
                      </p>
                      <s-text-field
                        label=""
                        placeholder="Buy 3 @ 699"
                        maxLength={50}
                        value={tier.label}
                        onInput={(e: Event) =>
                          setTiers((prev) =>
                            prev.map((t) =>
                              t.id === tier.id
                                ? { ...t, label: (e.target as HTMLInputElement).value }
                                : t
                            )
                          )
                        }
                        autoComplete="off"
                      />
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6d7175" }}>
                        Shown on the pill button (50 max characters)
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "#303030" }}>
                        Linked Bundle
                      </p>
                      <s-select
                        label=""
                        onChange={(e: Event) =>
                          setTiers((prev) =>
                            prev.map((t) =>
                              t.id === tier.id
                                ? { ...t, linkedBundleId: (e.currentTarget as HTMLSelectElement).value }
                                : t
                            )
                          )
                        }
                      >
                        <s-option value="" selected={!tier.linkedBundleId || undefined}>
                          Select bundle
                        </s-option>
                        {fpbBundles.map((b) => (
                          <s-option
                            key={b.id}
                            value={b.id}
                            selected={tier.linkedBundleId === b.id || undefined}
                          >
                            {b.name}
                          </s-option>
                        ))}
                      </s-select>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6d7175" }}>
                        Choose the product bundle to trigger for this tier
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setTiers((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), label: "", linkedBundleId: "" },
                  ])
                }
                style={{
                  width: "100%",
                  border: "1px dashed #c9cccf",
                  borderRadius: 8,
                  background: "none",
                  padding: "12px 0",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#303030",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
                Add Rule
              </button>
            </div>

            {/* Footer */}
            <div className={styles.wizardFooter}>
              <s-button variant="secondary" onClick={handleBack}>
                Back
              </s-button>
              <s-button
                variant="primary"
                loading={isSubmitting || undefined}
                onClick={handleNext}
              >
                Finish
              </s-button>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Language Modal */}
      <s-modal
        open={localeModalOpen || undefined}
        label="Multi Language"
        onHide={() => setLocaleModalOpen(false)}
      >
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
                    <s-option
                      key={l.locale}
                      value={l.locale}
                      selected={
                        selectedLocale === l.locale || undefined
                      }
                    >
                      {l.name}
                    </s-option>
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
                  placeholder={
                    currentStep.name || "Step name in English"
                  }
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

        <s-button
          slot="primaryAction"
          variant="primary"
          onClick={() => setLocaleModalOpen(false)}
        >
          Save
        </s-button>
        <s-button
          slot="secondaryActions"
          variant="secondary"
          onClick={() => setLocaleModalOpen(false)}
        >
          Cancel
        </s-button>
      </s-modal>

      {/* Filters Drawer */}
      {filtersDrawerOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setFiltersDrawerOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Filters</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setFiltersDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalSectionTitle}>Select Step</p>
              <div className={styles.stepNav} style={{ marginBottom: 16 }}>
                {steps.map((s, i) => (
                  <button
                    key={s.tempId}
                    className={
                      i === filtersDrawerStepIdx
                        ? styles.stepChipActive
                        : styles.stepChip
                    }
                    onClick={() => setFiltersDrawerStepIdx(i)}
                  >
                    Step {i + 1}
                    {s.filters.length > 0 && (
                      <span
                        className={styles.tabBadge}
                        style={{ marginLeft: 6 }}
                      >
                        {s.filters.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <p className={styles.modalSectionTitle}>
                Filters for Step {filtersDrawerStepIdx + 1}
              </p>
              {(steps[filtersDrawerStepIdx]?.filters ?? []).length === 0 ? (
                <div
                  className={styles.emptyState}
                  style={{ marginBottom: 12 }}
                >
                  No filters defined
                </div>
              ) : (
                <div className={styles.rulesList}>
                  {(steps[filtersDrawerStepIdx]?.filters ?? []).map(
                    (filter) => (
                      <div key={filter.id} className={styles.filterRow}>
                        <s-select
                          label="Type"
                          onChange={(e: Event) =>
                            updateFilter(filtersDrawerStepIdx, filter.id, {
                              type: (e.target as HTMLSelectElement)
                                .value as FilterDef["type"],
                            })
                          }
                        >
                          {FILTER_TYPE_OPTIONS.map((opt) => (
                            <s-option
                              key={opt.value}
                              value={opt.value}
                              selected={filter.type === opt.value || undefined}
                            >
                              {opt.label}
                            </s-option>
                          ))}
                        </s-select>
                        <s-text-field
                          label="Label"
                          value={filter.label}
                          placeholder="e.g. Size, Color"
                          autoComplete="off"
                          onInput={(e: Event) =>
                            updateFilter(filtersDrawerStepIdx, filter.id, {
                              label: (e.target as HTMLInputElement).value,
                            })
                          }
                        />
                        <s-button
                          icon="delete"
                          variant="tertiary"
                          tone="critical"
                          accessibilityLabel="Remove filter"
                          onClick={() =>
                            removeFilter(filtersDrawerStepIdx, filter.id)
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              )}
              <s-button
                variant="secondary"
                icon="plus"
                onClick={() => addFilter(filtersDrawerStepIdx)}
              >
                Add Filter
              </s-button>
            </div>
            <div className={styles.modalFooter}>
              <s-button
                variant="secondary"
                onClick={() => setFiltersDrawerOpen(false)}
              >
                Cancel
              </s-button>
              <s-button
                variant="primary"
                onClick={() => setFiltersDrawerOpen(false)}
              >
                Done
              </s-button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Fields Modal */}
      {customFieldsModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setCustomFieldsModalOpen(false)}
        >
          <div
            className={styles.modal}
            style={{ width: "min(600px, 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Custom Fields</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setCustomFieldsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6b7280" }}>
                Custom fields are shown to customers during bundle completion
                and saved as Shopify order line item properties.
              </p>
              {customFields.length === 0 ? (
                <div className={styles.emptyState}>
                  No custom fields defined yet
                </div>
              ) : (
                <div className={styles.rulesList}>
                  {customFields.map((cf) => (
                    <div key={cf.id} className={styles.customFieldRow}>
                      <div className={styles.customFieldRowTop}>
                        <s-text-field
                          label="Field Label"
                          value={cf.label}
                          placeholder="e.g. Gift message, Engraving text"
                          autoComplete="off"
                          onInput={(e: Event) =>
                            updateCustomField(cf.id, {
                              label: (e.target as HTMLInputElement).value,
                            })
                          }
                        />
                        <s-select
                          label="Type"
                          onChange={(e: Event) =>
                            updateCustomField(cf.id, {
                              fieldType: (e.target as HTMLSelectElement)
                                .value as CustomFieldDef["fieldType"],
                            })
                          }
                        >
                          {CUSTOM_FIELD_TYPE_OPTIONS.map((opt) => (
                            <s-option
                              key={opt.value}
                              value={opt.value}
                              selected={
                                cf.fieldType === opt.value || undefined
                              }
                            >
                              {opt.label}
                            </s-option>
                          ))}
                        </s-select>
                        <s-button
                          icon="delete"
                          variant="tertiary"
                          tone="critical"
                          accessibilityLabel="Remove field"
                          onClick={() => removeCustomField(cf.id)}
                        />
                      </div>
                      <s-checkbox
                        label="Required"
                        checked={cf.required || undefined}
                        onChange={(e: Event) =>
                          updateCustomField(cf.id, {
                            required: (e.target as HTMLInputElement).checked,
                          })
                        }
                      />
                      {cf.fieldType === "select" && (
                        <div style={{ marginTop: 8 }}>
                          <s-text color="subdued">
                            Options (one per line)
                          </s-text>
                          <s-text-area
                            label=""
                            value={cf.options.join("\n")}
                            placeholder={"Option 1\nOption 2\nOption 3"}
                            onInput={(e: Event) =>
                              updateCustomField(cf.id, {
                                options: (
                                  e.target as HTMLTextAreaElement
                                ).value
                                  .split("\n")
                                  .map((o) => o.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <s-button
                variant="secondary"
                icon="plus"
                onClick={addCustomField}
              >
                Add Field
              </s-button>
            </div>
            <div className={styles.modalFooter}>
              <s-button
                variant="secondary"
                onClick={() => setCustomFieldsModalOpen(false)}
              >
                Cancel
              </s-button>
              <s-button
                variant="primary"
                onClick={() => setCustomFieldsModalOpen(false)}
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
