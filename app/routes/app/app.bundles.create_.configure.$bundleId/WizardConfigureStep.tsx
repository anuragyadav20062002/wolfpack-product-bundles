import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { SaveBar } from "@shopify/app-bridge-react";
import { DiscountMethod, createNewPricingRule } from "../../../types/pricing";
import { useBundlePricing } from "../../../hooks/useBundlePricing";
import type { BundleReadinessItem } from "../../../components/bundle-configure/BundleReadinessOverlay";
import { getBundleWizardConfigurePath } from "../../../lib/bundle-navigation";
import { markBundlePreviewComplete } from "../../../lib/bundle-preview-readiness";
import { buildWizardPreviewUrl } from "../../../lib/wizard-preview-url";
import { useEnablePreviewGate } from "../../../hooks/useEnablePreviewGate";
import type { loader } from "./loader.server";
import type { CustomFieldDef, FilterDef, WizardStepState } from "./types";
import { emptyStep, initSteps } from "./wizard-state";
import { useWizardStepHandlers } from "./useWizardStepHandlers";
import { buildCreateWizardAssetsPayload, buildCreateWizardConfigPayload, buildCreateWizardPricingPayload, shouldSubmitCreateWizardPage } from "./wizard-payloads";
import { STEPS_META } from "./wizard-constants";
import { ConfigurationStep } from "./ConfigurationStep";
import { PricingStep } from "./PricingStep";
import { AssetsStep } from "./AssetsStep";
import { WizardOverlays } from "./WizardOverlays";
import styles from "./wizard-configure.module.css";
import { navigateBackOrFallback } from "../../../lib/navigation";
declare const shopify: { resourcePicker: (opts: { type: string; multiple: boolean; selectionIds?: { id: string }[]; }) => Promise<{ selection: any[] } | null>; toast: { show: (msg: string, opts?: { isError?: boolean }) => void }; saveBar: { leaveConfirmation: () => Promise<void> | void }; };
export default function WizardConfigureStep() {
  const { bundle, readiness, shopLocales, shop, themeEditorUrl } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const configFetcher = useFetcher<{
    ok: boolean;
    intent: string;
    steps?: Array<{ tempId: string; dbId: string }>;
  }>();
  const pricingFetcher = useFetcher<{ ok: boolean; intent: string }>();
  const assetsFetcher = useFetcher<{
    ok: boolean;
    intent: string;
    redirectTo: string;
  }>();
  const stepsMeta = STEPS_META;
  const [wizardStep, setWizardStep] = useState(1);
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
  const localeModalRef = useRef<any>(null);
  useEffect(() => {
    const modal = localeModalRef.current;
    if (!modal) return;
    const handler = () => setLocaleModalOpen(false);
    modal.addEventListener("dismiss", handler);
    modal.addEventListener("hide", handler);
    return () => {
      modal.removeEventListener("dismiss", handler);
      modal.removeEventListener("hide", handler);
    };
  }, []);
  useEffect(() => {
    const modal = localeModalRef.current;
    if (!modal) return;
    if (localeModalOpen) {
      modal.showOverlay?.();
      modal.show?.();
    } else {
      modal.hideOverlay?.();
      modal.hide?.();
      modal.close?.();
    }
  }, [localeModalOpen]);
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
  const [promoBannerBgImage, setPromoBannerBgImage] = useState<string | null>(
    bundle.promoBannerBgImage ?? null
  );
  const [loadingGif, setLoadingGif] = useState<string | null>(
    bundle.loadingGif ?? null
  );
  const [categoryActiveTabs, setCategoryActiveTabs] = useState<Record<string, number>>({});
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
  const editRoutePath = getBundleWizardConfigurePath(bundle.id);
  const currentConfigPayload = buildCreateWizardConfigPayload({
    steps,
    bundleStatus,
    searchBarEnabled,
    textOverridesByLocale,
  });
  const currentPricingPayload = buildCreateWizardPricingPayload({
    discountEnabled: pricing.discountEnabled,
    discountType: pricing.discountType,
    discountRules: pricing.discountRules,
    discountMessagingEnabled,
    showProgressBar,
    progressMessage,
    qualifiedMessage,
  });
  const currentAssetsPayload = buildCreateWizardAssetsPayload({
    promoBannerBgImage,
    loadingGif,
    searchBarEnabled,
    steps,
    customFields,
  });
  const configBaselineRef = useRef(currentConfigPayload);
  const pricingBaselineRef = useRef(currentPricingPayload);
  const assetsBaselineRef = useRef(currentAssetsPayload);
  const [, forceSaveBarRender] = useState(0);
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
      if (configFetcher.data.steps?.length) {
        setSteps((prev) => {
          const nextSteps = prev.map((step) => {
            const saved = configFetcher.data?.steps?.find(
              (s) => s.tempId === step.tempId
            );
            return saved ? { ...step, dbId: saved.dbId } : step;
          });
          configBaselineRef.current = buildCreateWizardConfigPayload({
            steps: nextSteps,
            bundleStatus,
            searchBarEnabled,
            textOverridesByLocale,
          });
          assetsBaselineRef.current = buildCreateWizardAssetsPayload({
            promoBannerBgImage,
            loadingGif,
            searchBarEnabled,
            steps: nextSteps,
            customFields,
          });
          return nextSteps;
        });
      } else {
        configBaselineRef.current = currentConfigPayload;
      }
      forceSaveBarRender((revision) => revision + 1);
      shopify.toast.show("Settings saved successfully");
    }
  }, [configFetcher.data, configFetcher.state]);
  useEffect(() => {
    if (
      pricingFetcher.data?.ok &&
      pricingFetcher.data.intent === "savePricing" &&
      pricingFetcher.state === "idle"
    ) {
      pricingBaselineRef.current = currentPricingPayload;
      forceSaveBarRender((revision) => revision + 1);
      shopify.toast.show("Settings saved successfully");
    }
  }, [pricingFetcher.data, pricingFetcher.state]);
  useEffect(() => {
    if (
      assetsFetcher.data?.ok &&
      assetsFetcher.data.intent === "saveAssets" &&
      assetsFetcher.state === "idle"
    ) {
      assetsBaselineRef.current = currentAssetsPayload;
      forceSaveBarRender((revision) => revision + 1);
      shopify.toast.show("Settings saved successfully");
    }
  }, [assetsFetcher.data, assetsFetcher.state, currentAssetsPayload]);
  const currentStep = steps[currentIdx];
  const pageTitle =
    wizardStep === 1
      ? "Configuration"
      : wizardStep === 2
      ? "Pricing"
      : "Assets";
  const isSubmitting =
    wizardStep === 1
      ? configFetcher.state === "submitting"
      : wizardStep === 2
      ? pricingFetcher.state === "submitting"
      : assetsFetcher.state === "submitting";
  const isAnyWizardSaveInFlight =
    configFetcher.state !== "idle" ||
    pricingFetcher.state !== "idle" ||
    assetsFetcher.state !== "idle";
  const isCurrentWizardPageDirty =
    wizardStep === 1
      ? shouldSubmitCreateWizardPage({
          baseline: configBaselineRef.current,
          current: currentConfigPayload,
          requirePersistedStepIds: true,
          steps,
        })
      : wizardStep === 2
      ? shouldSubmitCreateWizardPage({
          baseline: pricingBaselineRef.current,
          current: currentPricingPayload,
        })
      : shouldSubmitCreateWizardPage({
          baseline: assetsBaselineRef.current,
          current: currentAssetsPayload,
        });
  const { updateCurrent, navigateTo, handleAddStep, handleRemoveStep, addRule, removeRule, updateRule, pickProducts, pickCollections, updateStepCategory, addCategory, deleteCategory, pickCategoryProducts, pickCategoryCollections, addFilter, removeFilter, updateFilter, addCustomField, removeCustomField, updateCustomField } = useWizardStepHandlers({ currentIdx, currentStep, steps, setCurrentIdx, setCustomFields, setSlideDir, setSlideKey, setSteps });
  const promptSaveBarBeforeNavigation = useCallback(() => {
    shopify.toast.show("Save or discard your changes before moving to another step.", {
      isError: true,
    });
    void shopify.saveBar.leaveConfirmation();
  }, []);
  const handleSaveCurrentWizardPage = useCallback(() => {
    if (isAnyWizardSaveInFlight) return;
    if (wizardStep === 1) {
      const fd = new FormData();
      fd.set("_intent", "saveConfig");
      fd.set("steps", JSON.stringify(steps));
      fd.set("bundleStatus", bundleStatus);
      fd.set("searchBarEnabled", String(searchBarEnabled));
      fd.set("textOverridesByLocale", JSON.stringify(textOverridesByLocale));
      configFetcher.submit(fd, { method: "post" });
      return;
    }
    if (wizardStep === 2) {
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
      return;
    }
    const fd = new FormData();
    fd.set("_intent", "saveAssets");
    fd.set("promoBannerBgImage", promoBannerBgImage ?? "");
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
  }, [
    isAnyWizardSaveInFlight,
    wizardStep,
    steps,
    bundleStatus,
    searchBarEnabled,
    textOverridesByLocale,
    configFetcher,
    pricingFetcher,
    assetsFetcher,
    pricing,
    showProgressBar,
    discountMessagingEnabled,
    progressMessage,
    qualifiedMessage,
    promoBannerBgImage,
    loadingGif,
    customFields,
  ]);
  const handleDiscardCurrentWizardPage = useCallback(() => {
    if (wizardStep === 1) {
      const saved = JSON.parse(configBaselineRef.current || currentConfigPayload);
      const restoredSteps: WizardStepState[] = (saved.steps || []).map(
        (step: Partial<WizardStepState>, index: number) => ({
          tempId: step.tempId || crypto.randomUUID(),
          dbId: step.dbId ?? null,
          name: step.name ?? "",
          pageTitle: step.pageTitle ?? "",
          iconUrl: step.iconUrl ?? null,
          products: step.products ?? [],
          collections: step.collections ?? [],
          StepCategory:
            step.StepCategory && step.StepCategory.length > 0
              ? step.StepCategory
              : [{ id: `cat-${index}`, name: "Category 1", sortOrder: 0, products: [], collections: [] }],
          conditions: step.conditions ?? [],
          filters: step.filters ?? [],
          preSelectAll: false,
          activeTab: "products",
        })
      );
      setSteps(restoredSteps.length > 0 ? restoredSteps : [emptyStep()]);
      setBundleStatus(saved.bundleStatus);
      setSearchBarEnabled(Boolean(saved.searchBarEnabled));
      setTextOverridesByLocale(saved.textOverridesByLocale ?? {});
      setCurrentIdx((idx) => Math.min(idx, Math.max(restoredSteps.length - 1, 0)));
    } else if (wizardStep === 2) {
      const saved = JSON.parse(pricingBaselineRef.current || currentPricingPayload);
      const discountType = (saved.discountType || DiscountMethod.PERCENTAGE_OFF) as DiscountMethod;
      pricing.toggleDiscountEnabled(Boolean(saved.discountEnabled));
      pricing.changeDiscountType(discountType);
      pricing.setDiscountRules(
        Array.isArray(saved.discountRules) && saved.discountRules.length > 0
          ? saved.discountRules
          : [createNewPricingRule(discountType)]
      );
      setDiscountMessagingEnabled(Boolean(saved.discountMessagingEnabled));
      setShowProgressBar(Boolean(saved.showProgressBar));
      setProgressMessage(saved.messages?.progress ?? "");
      setQualifiedMessage(saved.messages?.qualified ?? "");
    } else {
      const saved = JSON.parse(assetsBaselineRef.current || currentAssetsPayload);
      setPromoBannerBgImage(saved.promoBannerBgImage || null);
      setLoadingGif(saved.loadingGif || null);
      setSearchBarEnabled(Boolean(saved.searchBarEnabled));
      setCustomFields(saved.customFields ?? []);
      setSteps((prev) =>
        prev.map((step) => {
          const savedFilters = (saved.stepsFilters ?? []).find(
            (entry: { stepDbId: string; filters: FilterDef[] }) =>
              entry.stepDbId === step.dbId
          );
          return savedFilters ? { ...step, filters: savedFilters.filters ?? [] } : step;
        })
      );
    }
    shopify.toast.show("Changes discarded");
  }, [wizardStep, currentConfigPayload, currentPricingPayload, currentAssetsPayload, pricing]);
  const handleBack = useCallback(() => {
    if (isCurrentWizardPageDirty) {
      promptSaveBarBeforeNavigation();
      return;
    }
    if (wizardStep === 1) {
      navigateBackOrFallback(navigate, "/app/dashboard", { replaceFallback: true });
    } else {
      setWizardStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isCurrentWizardPageDirty, promptSaveBarBeforeNavigation, wizardStep]);
  const handleNext = useCallback(() => {
    if (isCurrentWizardPageDirty) {
      promptSaveBarBeforeNavigation();
      return;
    }
    if (wizardStep === 3) {
      navigate(editRoutePath);
      return;
    }
    setWizardStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [editRoutePath, isCurrentWizardPageDirty, navigate, promptSaveBarBeforeNavigation, wizardStep]);
  const enablePreviewGate = useEnablePreviewGate({
    appEmbedEnabled: readiness.appEmbedEnabled,
    themeEditorUrl,
    onSilentBlock: () => shopify.toast.show("Theme editor is unavailable for this shop.", { isError: true }),
  });
  const handleWizardPreview = useCallback(() => {
    enablePreviewGate.requestPreview(() => {
      const result = buildWizardPreviewUrl({
        shop,
        bundleId: bundle.id,
        bundleType: bundle.bundleType as "full_page" | "product_page",
        productHandle: bundle.shopifyProductHandle,
        pageHandle: bundle.shopifyPageHandle,
      });
      if (result.kind === "error") {
        shopify.toast.show("Save the bundle first to generate a preview URL.", { isError: true });
        return;
      }
      if (typeof window !== "undefined") {
        markBundlePreviewComplete({
          bundleId: bundle.id,
          storage: window.localStorage,
        });
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }, [
    enablePreviewGate,
    shop,
    bundle.id,
    bundle.bundleType,
    bundle.shopifyProductHandle,
    bundle.shopifyPageHandle,
  ]);
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
  const hasProducts = steps.some(
    (s) =>
      s.products.length > 0 ||
      s.collections.length > 0 ||
      s.StepCategory.some(
        (cat) => cat.products.length > 0 || cat.collections.length > 0
      )
  );
  const readinessItems: BundleReadinessItem[] = [
    { key: "embed", label: "App embed enabled", description: "Required to display bundles on your storefront.", points: 15, done: readiness.appEmbedEnabled },
    { key: "products", label: "Products added to a step", description: "Add at least one product to a bundle step.", points: 20, done: hasProducts },
    { key: "discount", label: "Discount configured", description: "Set a discount to give customers a reason to bundle.", points: 15, done: readiness.hasDiscount },
    { key: "visible", label: "Bundle placed / visible", description: "Place your bundle on a page so customers can find it.", points: 25, done: readiness.hasBundleVisibility },
    { key: "product_active", label: "Parent product active", description: "Your parent product must be active to accept orders.", points: 15, done: readiness.parentProductActive },
  ];
  const selectedProductCount = currentStep.products.length;
  const selectedCollectionCount = currentStep.collections.length;
  const rulesCount = currentStep.conditions.length;
  const filtersCount = currentStep.filters.length;
  const customFieldsCount = customFields.length;
  const ctx = { steps, currentIdx, navigateTo, handleRemoveStep, handleAddStep, slideKey, slideDir, currentStep, showIconPicker, updateCurrent, setShowIconPicker, setLocaleModalOpen, categoryActiveTabs, setCategoryActiveTabs, updateStepCategory, deleteCategory, pickCategoryProducts, pickCategoryCollections, addCategory, updateRule, removeRule, addRule, statusSelectRef, setBundleStatus, bundleStatus, selectedProductCount, selectedCollectionCount, rulesCount, filtersCount, searchBarEnabled, customFieldsCount, isAnyWizardSaveInFlight, handleBack, handleNext, pricing, showProgressBar, setShowProgressBar, discountMessagingEnabled, setDiscountMessagingEnabled, progressMessage, setProgressMessage, qualifiedMessage, setQualifiedMessage, promoBannerBgImage, setPromoBannerBgImage, loadingGif, setLoadingGif, setSearchBarEnabled, enablePreviewGate, localeModalRef, shopLocales, localeSelectRef, setSelectedLocale, selectedLocale, getTranslation, setTranslation, filtersDrawerOpen, setFiltersDrawerOpen, filtersDrawerStepIdx, setFiltersDrawerStepIdx, updateFilter, removeFilter, addFilter, customFieldsModalOpen, setCustomFieldsModalOpen, customFields, updateCustomField, removeCustomField, addCustomField, readinessItems, bundle, readinessOpen, setReadinessOpen };
  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSaveCurrentWizardPage(); }} onReset={(e) => { e.preventDefault(); handleDiscardCurrentWizardPage(); }}>
        <SaveBar id="create-wizard-save-bar" open={isCurrentWizardPageDirty}>
          <button type="submit" variant="primary" loading={isSubmitting ? "" : undefined} disabled={isAnyWizardSaveInFlight}>Save</button>
          <button type="reset" disabled={isAnyWizardSaveInFlight}>Discard</button>
        </SaveBar>
      </form>
      <ui-title-bar title={pageTitle}><button variant="breadcrumb" onClick={() => navigateBackOrFallback(navigate, "/app/dashboard", { replaceFallback: true })}>Create Bundle</button></ui-title-bar>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}><s-button variant="tertiary" icon="arrow-left" accessibilityLabel="Back" onClick={handleBack} /><h1 className={styles.pageTitle}>{pageTitle}</h1></div>
          <s-stack direction="inline" gap="small"><s-button variant="secondary" icon="view" onClick={handleWizardPreview}>Preview</s-button><s-button variant="secondary" href="https://wolfpackapps.com/docs/bundle-configuration" target="_blank">How to configure?</s-button></s-stack>
        </div>
        <div className={styles.stepIndicator}>
          {stepsMeta.map((step, idx) => {
            const isDone = idx < wizardStep;
            const isClickable = isDone && idx >= 1;
            return <Fragment key={step.num}>{idx > 0 && <div className={styles.stepConnector} />}{isClickable ? <button className={styles.stepItemClickable} onClick={() => setWizardStep(idx)} type="button" aria-label={`Go to ${step.label}`}><div className={styles.stepCircleDone}>✓</div><span className={styles.stepLabelDone}>{step.label}</span></button> : <div className={styles.stepItem}>{isDone ? <><div className={styles.stepCircleDone}>✓</div><span className={styles.stepLabelDone}>{step.label}</span></> : idx === wizardStep ? <><div className={styles.stepCircleActive}>{step.num}</div><span className={styles.stepLabelActive}>{step.label}</span></> : <><span className={styles.stepNumFuture}>{step.num}</span><span className={styles.stepLabelFuture}>{step.label}</span></>}</div>}</Fragment>;
          })}
        </div>
        {wizardStep === 1 && <ConfigurationStep ctx={ctx} />}
        {wizardStep === 2 && <PricingStep ctx={ctx} />}
        {wizardStep === 3 && <AssetsStep ctx={ctx} />}
      </div>
      <WizardOverlays ctx={ctx} />
    </>
  );
}
