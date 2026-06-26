import { useCallback, useMemo, useRef, useState } from "react";
import { type MultiLanguageField } from "../../../components/bundle-configure/MultiLanguageTextModal";
import { ADDON_MESSAGE_KEY } from "./configure-constants";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";
import type { StepSetupMultiLanguageTarget } from "./visibility-helpers";

export function useConfigureLocalizationState(flow: ConfigureBundleFlowDraft) {
  const {
    addonDraft,
    bundle,
    markAsDirty,
    ruleMessages,
    setTextOverridesByLocale,
    setTextOverridesLocale,
    shopLocales,
    stepsState,
    textOverridesByLocale,
    updateAddonDraft,
  } = flow;
  const [multiLanguageFields, setMultiLanguageFields] = useState<
    MultiLanguageField[]
  >([]);
  const [multiLanguageTitle, setMultiLanguageTitle] =
    useState("Multi Language");
  const [multiLanguageLayout, setMultiLanguageLayout] = useState<
    "rich" | "compact"
  >("rich");
  const [isMultiLanguageModalOpen, setIsMultiLanguageModalOpen] =
    useState(false);
  const [multiLanguageTarget, setMultiLanguageTarget] =
    useState<StepSetupMultiLanguageTarget>({ type: "text-overrides" });
  const [
    discountMessagingMultiLanguageEnabled,
    setDiscountMessagingMultiLanguageEnabled,
  ] = useState<boolean>(!!(bundle as any).pricing?.ruleMessagesByLocale);
  const originalDiscountMessagingMultiLanguageEnabledRef = useRef<boolean>(
    !!(bundle as any).pricing?.ruleMessagesByLocale,
  );
  const [ruleMessagesByLocale, setRuleMessagesByLocale] = useState<
    Record<
      string,
      Record<string, { discountText: string; successMessage: string }>
    >
  >(
    ((bundle as any).pricing?.ruleMessagesByLocale as Record<
      string,
      Record<string, { discountText: string; successMessage: string }>
    >) ?? {},
  );
  const originalRuleMessagesByLocaleRef = useRef<
    Record<
      string,
      Record<string, { discountText: string; successMessage: string }>
    >
  >(
    ((bundle as any).pricing?.ruleMessagesByLocale as Record<
      string,
      Record<string, { discountText: string; successMessage: string }>
    >) ?? {},
  );
  const [activeDiscountLocale, setActiveDiscountLocale] = useState<string>(
    shopLocales.find((l: { primary: boolean }) => l.primary)?.locale ??
      shopLocales[0]?.locale ??
      "en",
  );
  const [globalSuccessMessage, setGlobalSuccessMessage] = useState<string>(
    (bundle as any).pricing?.messages?.successMessage ?? "",
  );
  const [successMessageByLocale, setSuccessMessageByLocale] = useState<
    Record<string, string>
  >(
    ((bundle as any).pricing?.messages?.successMessageByLocale as Record<
      string,
      string
    >) ?? {},
  );
  const [tierTextByRuleId, setTierTextByRuleId] = useState<
    Record<string, { tierText: string; tierSubtext: string }>
  >(
    ((bundle as any).pricing?.messages?.tierTextByRuleId as Record<
      string,
      { tierText: string; tierSubtext: string }
    >) ?? {},
  );
  const [tierTextByLocaleByRuleId, setTierTextByLocaleByRuleId] = useState<
    Record<string, Record<string, { tierText: string; tierSubtext: string }>>
  >(
    ((bundle as any).pricing?.messages?.tierTextByLocaleByRuleId as Record<
      string,
      Record<string, { tierText: string; tierSubtext: string }>
    >) ?? {},
  );
  const progressBarMultiLangModalRef = useRef<any>(null);
  const [isProgressBarMultiLangModalOpen, setIsProgressBarMultiLangModalOpen] =
    useState(false);
  const [activeProgressBarLocale, setActiveProgressBarLocale] =
    useState<string>(
      shopLocales.find((l: { primary: boolean }) => l.primary)?.locale ??
        shopLocales[0]?.locale ??
        "en",
    );
  const bundleQuantityMultiLangModalRef = useRef<any>(null);
  const [
    isBundleQuantityMultiLangModalOpen,
    setIsBundleQuantityMultiLangModalOpen,
  ] = useState(false);
  const [activeBundleQuantityLocale, setActiveBundleQuantityLocale] =
    useState<string>(
      shopLocales.find((l: { primary: boolean }) => l.primary)?.locale ??
        shopLocales[0]?.locale ??
        "en",
    );
  const defaultMultiLanguageLocale = useCallback(
    () =>
      shopLocales.find((locale: { primary: boolean }) => locale.primary)
        ?.locale ??
      shopLocales[0]?.locale ??
      "en",
    [shopLocales],
  );
  const openMultiLanguageModal = useCallback(
    (title: string, fields: MultiLanguageField[]) => {
      setMultiLanguageTarget({ type: "text-overrides" });
      setMultiLanguageTitle(title);
      setMultiLanguageFields(fields);
      setTextOverridesLocale(defaultMultiLanguageLocale());
      setIsMultiLanguageModalOpen(true);
    },
    [defaultMultiLanguageLocale, setTextOverridesLocale],
  );
  const openStepMultiLanguageModal = useCallback(
    (stepId: string) => {
      const step = stepsState.steps.find(
        (candidate: any) => candidate.id === stepId,
      ) as any;
      if (!step) return;
      setMultiLanguageTarget({ type: "step", stepId });
      setMultiLanguageTitle("Customize Text for Multiple Languages");
      setMultiLanguageLayout("rich");
      setMultiLanguageFields([
        {
          key: "productPageStepText",
          label: "Step Name",
          fallback: step.name ?? "",
        },
        {
          key: "productPageSubtext",
          label: "Step Title",
          fallback: step.pageTitle ?? "",
        },
      ]);
      setTextOverridesLocale(defaultMultiLanguageLocale());
      setIsMultiLanguageModalOpen(true);
    },
    [defaultMultiLanguageLocale, setTextOverridesLocale, stepsState.steps],
  );
  const openStepCategoryMultiLanguageModal = useCallback(
    (stepId: string, categoryIndex: number) => {
      const step = stepsState.steps.find(
        (candidate: any) => candidate.id === stepId,
      ) as any;
      const category = ((step?.StepCategory as any[] | undefined) ?? [])[
        categoryIndex
      ];
      if (!category) return;
      setMultiLanguageTarget({ type: "step-category", stepId, categoryIndex });
      setMultiLanguageTitle("Customize Text for Multiple Languages");
      setMultiLanguageLayout("rich");
      setMultiLanguageFields([
        {
          key: "name",
          label: "Category Name",
          fallback: category.name ?? `Category ${categoryIndex + 1}`,
        },
        {
          key: "title",
          label: "Category Title",
          fallback: category.title ?? "",
        },
      ]);
      setTextOverridesLocale(defaultMultiLanguageLocale());
      setIsMultiLanguageModalOpen(true);
    },
    [defaultMultiLanguageLocale, setTextOverridesLocale, stepsState.steps],
  );
  const openAddonStepMultiLanguageModal = useCallback(() => {
    setMultiLanguageTarget({ type: "addon-step" });
    setMultiLanguageTitle("Customize Text for Multiple Languages");
    setMultiLanguageLayout("rich");
    setMultiLanguageFields([
      { key: "personalizeStepText", label: "Step Name", fallback: "Step Text" },
      {
        key: "personalizePageSubtext",
        label: "Step Title",
        fallback: "Step Subtext",
      },
    ]);
    setTextOverridesLocale(defaultMultiLanguageLocale());
    setIsMultiLanguageModalOpen(true);
  }, [defaultMultiLanguageLocale, setTextOverridesLocale]);
  const openAddonSectionMultiLanguageModal = useCallback(() => {
    const addonTiers = Array.isArray(addonDraft.addonTiers)
      ? addonDraft.addonTiers
      : [];
    setMultiLanguageTarget({ type: "addon-section" });
    setMultiLanguageTitle("Customize Text for Multiple Languages");
    setMultiLanguageLayout("compact");
    setMultiLanguageFields([
      {
        key: "addonProductsTitle",
        label: "Add on Section title",
        fallback: addonDraft.addonProductsTitle || "",
      },
      ...addonTiers.map((tier: any, index: number) => ({
        key: `tier${index + 1}Title`,
        label: `Tier#${index + 1} Title`,
        fallback: tier.title || `Tier ${index + 1}`,
      })),
    ]);
    setTextOverridesLocale(defaultMultiLanguageLocale());
    setIsMultiLanguageModalOpen(true);
  }, [
    addonDraft.addonProductsTitle,
    addonDraft.addonTiers,
    defaultMultiLanguageLocale,
    setTextOverridesLocale,
  ]);
  const openAddonFooterMultiLanguageModal = useCallback(() => {
    const addonTiers = Array.isArray(addonDraft.addonTiers)
      ? addonDraft.addonTiers
      : [];
    const savedAddonMessages =
      (bundle as any).personalizationData?.addonProducts?.addonsMessaging
        ?.tier1 || {};
    const addonMessages = ruleMessages[ADDON_MESSAGE_KEY] || {
      discountText: savedAddonMessages.ineligibleState || "",
      successMessage: savedAddonMessages.eligibleState || "",
    };
    setMultiLanguageTarget({ type: "addon-footer" });
    setMultiLanguageTitle("Customize Text for Multiple Languages");
    setMultiLanguageLayout("compact");
    setMultiLanguageFields(
      addonTiers.flatMap((_: any, index: number) => [
        {
          key: `tier${index + 1}MessageWhenRuleNotMet`,
          label: "Message when rule not met",
          fallback: addonMessages.discountText || "",
          headingBefore: `Tier ${index + 1}`,
        },
        {
          key: `tier${index + 1}SuccessMessage`,
          label: "Success Message",
          fallback: addonMessages.successMessage || "",
        },
      ]),
    );
    setTextOverridesLocale(defaultMultiLanguageLocale());
    setIsMultiLanguageModalOpen(true);
  }, [
    addonDraft.addonTiers,
    bundle,
    defaultMultiLanguageLocale,
    ruleMessages,
    setTextOverridesLocale,
  ]);
  const updateLocalizedTextOverride = useCallback(
    (locale: string, key: string, value: string) => {
      setTextOverridesByLocale((prev: any) => ({
        ...prev,
        [locale]: { ...(prev[locale] ?? {}), [key]: value },
      }));
      markAsDirty();
    },
    [markAsDirty, setTextOverridesByLocale],
  );
  const activeMultiLanguageValues = useMemo(() => {
    if (multiLanguageTarget?.type === "step") {
      const step = stepsState.steps.find(
        (candidate: any) => candidate.id === multiLanguageTarget.stepId,
      ) as any;
      return (step?.multiLangData ?? {}) as Record<
        string,
        Record<string, string>
      >;
    }
    if (multiLanguageTarget?.type === "step-category") {
      const step = stepsState.steps.find(
        (candidate: any) => candidate.id === multiLanguageTarget.stepId,
      ) as any;
      const category = ((step?.StepCategory as any[] | undefined) ?? [])[
        multiLanguageTarget.categoryIndex
      ];
      return (category?.multiLangData ?? {}) as Record<
        string,
        Record<string, string>
      >;
    }
    if (
      multiLanguageTarget?.type === "addon-step" ||
      multiLanguageTarget?.type === "addon-section" ||
      multiLanguageTarget?.type === "addon-footer"
    ) {
      return (addonDraft.addonMultiLangData ?? {}) as Record<
        string,
        Record<string, string>
      >;
    }
    return textOverridesByLocale;
  }, [
    addonDraft.addonMultiLangData,
    multiLanguageTarget,
    stepsState.steps,
    textOverridesByLocale,
  ]);
  const saveStepSetupMultiLanguageValues = useCallback(
    (nextValues: Record<string, Record<string, string>>) => {
      if (multiLanguageTarget?.type === "step") {
        stepsState.updateStepField(
          multiLanguageTarget.stepId,
          "multiLangData",
          nextValues,
        );
        markAsDirty();
        return;
      }
      if (multiLanguageTarget?.type === "step-category") {
        const step = stepsState.steps.find(
          (candidate: any) => candidate.id === multiLanguageTarget.stepId,
        ) as any;
        const categories = (step?.StepCategory as any[] | undefined) ?? [];
        const updatedCategories = categories.map((category, index) =>
          index === multiLanguageTarget.categoryIndex
            ? {
                ...category,
                multiLangData: {
                  ...(category.multiLangData ?? {}),
                  ...nextValues,
                },
              }
            : category,
        );
        stepsState.updateStepField(
          multiLanguageTarget.stepId,
          "StepCategory",
          updatedCategories,
        );
        markAsDirty();
        return;
      }
      if (
        multiLanguageTarget?.type === "addon-step" ||
        multiLanguageTarget?.type === "addon-section" ||
        multiLanguageTarget?.type === "addon-footer"
      ) {
        updateAddonDraft({ addonMultiLangData: nextValues });
        return;
      }
      setTextOverridesByLocale(nextValues);
      markAsDirty();
    },
    [
      markAsDirty,
      multiLanguageTarget,
      setTextOverridesByLocale,
      stepsState,
      updateAddonDraft,
    ],
  );

  Object.assign(flow, {
    activeBundleQuantityLocale,
    activeDiscountLocale,
    activeMultiLanguageValues,
    activeProgressBarLocale,
    bundleQuantityMultiLangModalRef,
    discountMessagingMultiLanguageEnabled,
    globalSuccessMessage,
    isBundleQuantityMultiLangModalOpen,
    isMultiLanguageModalOpen,
    isProgressBarMultiLangModalOpen,
    multiLanguageFields,
    multiLanguageLayout,
    multiLanguageTarget,
    multiLanguageTitle,
    openAddonFooterMultiLanguageModal,
    openAddonSectionMultiLanguageModal,
    openAddonStepMultiLanguageModal,
    openMultiLanguageModal,
    openStepCategoryMultiLanguageModal,
    openStepMultiLanguageModal,
    originalDiscountMessagingMultiLanguageEnabledRef,
    originalRuleMessagesByLocaleRef,
    progressBarMultiLangModalRef,
    ruleMessagesByLocale,
    saveStepSetupMultiLanguageValues,
    setActiveBundleQuantityLocale,
    setActiveDiscountLocale,
    setActiveProgressBarLocale,
    setDiscountMessagingMultiLanguageEnabled,
    setGlobalSuccessMessage,
    setIsBundleQuantityMultiLangModalOpen,
    setIsMultiLanguageModalOpen,
    setIsProgressBarMultiLangModalOpen,
    setMultiLanguageFields,
    setMultiLanguageLayout,
    setMultiLanguageTarget,
    setMultiLanguageTitle,
    setRuleMessagesByLocale,
    setSuccessMessageByLocale,
    setTierTextByLocaleByRuleId,
    setTierTextByRuleId,
    successMessageByLocale,
    tierTextByLocaleByRuleId,
    tierTextByRuleId,
    updateLocalizedTextOverride,
  });
}
