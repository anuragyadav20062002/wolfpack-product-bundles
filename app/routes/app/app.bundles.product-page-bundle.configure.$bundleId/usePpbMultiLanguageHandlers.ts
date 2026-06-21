import { useCallback, useMemo, useState } from "react";
import type { MultiLanguageField } from "../../../components/bundle-configure/MultiLanguageTextModal";
import type { StepSetupMultiLanguageTarget } from "./ConfigureBundleFlow.helpers";

export function usePpbMultiLanguageHandlers({
  shopLocales,
  stepsState,
  textOverridesByLocale,
  setTextOverridesByLocale,
  markAsDirty,
}: {
  shopLocales: Array<{ primary: boolean; locale: string }>;
  stepsState: any;
  textOverridesByLocale: Record<string, Record<string, string>>;
  setTextOverridesByLocale: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, string>>>
  >;
  markAsDirty: () => void;
}) {
  const [multiLanguageFields, setMultiLanguageFields] = useState<
    MultiLanguageField[]
  >([]);
  const [multiLanguageTitle, setMultiLanguageTitle] =
    useState("Multi Language");
  const [isMultiLanguageModalOpen, setIsMultiLanguageModalOpen] =
    useState(false);
  const [multiLanguageTarget, setMultiLanguageTarget] =
    useState<StepSetupMultiLanguageTarget>({ type: "text-overrides" });
  const [textOverridesLocale, setTextOverridesLocale] = useState<string>("en");
  const defaultMultiLanguageLocale = useCallback(
    () =>
      shopLocales.find((locale) => locale.primary)?.locale ??
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
    [defaultMultiLanguageLocale],
  );
  const openStepMultiLanguageModal = useCallback(
    (stepId: string) => {
      const step = stepsState.steps.find(
        (candidate: any) => candidate.id === stepId,
      ) as any;
      if (!step) return;
      setMultiLanguageTarget({ type: "step", stepId });
      setMultiLanguageTitle("Customize Text for Multiple Languages");
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
    [defaultMultiLanguageLocale, stepsState.steps],
  );
  const openStepCategoryMultiLanguageModal = useCallback(
    (stepId: string, categoryIndex: number) => {
      const step = stepsState.steps.find(
        (candidate: any) => candidate.id === stepId,
      ) as any;
      const category = (((step as any)?.StepCategory as any[] | undefined) ??
        [])[categoryIndex];
      if (!category) return;
      setMultiLanguageTarget({ type: "step-category", stepId, categoryIndex });
      setMultiLanguageTitle("Customize Text for Multiple Languages");
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
    [defaultMultiLanguageLocale, stepsState.steps],
  );
  const updateLocalizedTextOverride = useCallback(
    (locale: string, key: string, value: string) => {
      setTextOverridesByLocale((prev) => ({
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
      const category = (((step as any)?.StepCategory as any[] | undefined) ??
        [])[multiLanguageTarget.categoryIndex];
      return (category?.multiLangData ?? {}) as Record<
        string,
        Record<string, string>
      >;
    }
    return textOverridesByLocale;
  }, [multiLanguageTarget, stepsState.steps, textOverridesByLocale]);
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
        const categories =
          ((step as any)?.StepCategory as any[] | undefined) ?? [];
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
      setTextOverridesByLocale(nextValues);
      markAsDirty();
    },
    [markAsDirty, multiLanguageTarget, setTextOverridesByLocale, stepsState],
  );

  return {
    textOverridesLocale,
    setTextOverridesLocale,
    multiLanguageFields,
    setMultiLanguageFields,
    multiLanguageTitle,
    setMultiLanguageTitle,
    isMultiLanguageModalOpen,
    setIsMultiLanguageModalOpen,
    multiLanguageTarget,
    setMultiLanguageTarget,
    defaultMultiLanguageLocale,
    openMultiLanguageModal,
    openStepMultiLanguageModal,
    openStepCategoryMultiLanguageModal,
    updateLocalizedTextOverride,
    activeMultiLanguageValues,
    saveStepSetupMultiLanguageValues,
  };
}
