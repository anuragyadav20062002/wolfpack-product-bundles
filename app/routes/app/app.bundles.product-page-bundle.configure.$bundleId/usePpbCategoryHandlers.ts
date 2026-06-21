import { useCallback, useState } from "react";

export function usePpbCategoryHandlers({
  stepsState,
  markAsDirty,
}: {
  stepsState: any;
  markAsDirty: () => void;
}) {
  const [showIconPickerForStep, setShowIconPickerForStep] = useState<
    string | null
  >(null);
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({});
  const [categoryActiveTabs, setCategoryActiveTabs] = useState<
    Record<string, number>
  >({});
  const [categoryRulesOpen, setCategoryRulesOpen] = useState<
    Record<string, boolean>
  >({});
  const getStepCategories = useCallback(
    (stepId: string): any[] => {
      const step = stepsState.steps.find(
        (candidate: any) => candidate.id === stepId,
      ) as any;
      return ((step as any)?.StepCategory as any[] | undefined) ?? [];
    },
    [stepsState.steps],
  );
  const updateStepCategories = useCallback(
    (stepId: string, updater: (categories: any[]) => any[]) => {
      const categories = getStepCategories(stepId);
      stepsState.updateStepField(stepId, "StepCategory", updater(categories));
      markAsDirty();
    },
    [getStepCategories, markAsDirty, stepsState],
  );
  const clearCategoryConditionRules = useCallback(
    (stepId: string) => {
      updateStepCategories(stepId, (categories) =>
        categories.map((category) => ({
          ...category,
          conditions: [],
          autoNextStepOnConditionMet: false,
        })),
      );
    },
    [updateStepCategories],
  );
  const addCategoryConditionRule = useCallback(
    (stepId: string, categoryIndex: number) => {
      updateStepCategories(stepId, (categories) =>
        categories.map((category, index) => {
          if (index !== categoryIndex) return category;
          const conditions = Array.isArray(category.conditions)
            ? category.conditions
            : [];
          return {
            ...category,
            conditions: [
              ...conditions,
              {
                id: `category-rule-${Date.now()}`,
                type: "quantity",
                condition: "greaterThanOrEqualTo",
                value: "01",
              },
            ],
          };
        }),
      );
    },
    [updateStepCategories],
  );
  const removeCategoryConditionRule = useCallback(
    (stepId: string, categoryIndex: number, ruleId: string) => {
      updateStepCategories(stepId, (categories) =>
        categories.map((category, index) => {
          if (index !== categoryIndex) return category;
          const conditions = Array.isArray(category.conditions)
            ? category.conditions
            : [];
          return {
            ...category,
            conditions: conditions.filter(
              (rule: any, ruleIndex: number) =>
                String(rule.id ?? ruleIndex) !== ruleId,
            ),
          };
        }),
      );
    },
    [updateStepCategories],
  );
  const updateCategoryConditionRule = useCallback(
    (
      stepId: string,
      categoryIndex: number,
      ruleId: string,
      field: string,
      value: string,
    ) => {
      updateStepCategories(stepId, (categories) =>
        categories.map((category, index) => {
          if (index !== categoryIndex) return category;
          const conditions = Array.isArray(category.conditions)
            ? category.conditions
            : [];
          return {
            ...category,
            conditions: conditions.map((rule: any, ruleIndex: number) =>
              String(rule.id ?? ruleIndex) === ruleId
                ? { ...rule, [field]: value }
                : rule,
            ),
          };
        }),
      );
    },
    [updateStepCategories],
  );
  const updateCategoryAutoNextRule = useCallback(
    (stepId: string, categoryIndex: number, enabled: boolean) => {
      updateStepCategories(stepId, (categories) =>
        categories.map((category, index) =>
          index === categoryIndex
            ? { ...category, autoNextStepOnConditionMet: enabled }
            : category,
        ),
      );
    },
    [updateStepCategories],
  );

  return {
    showIconPickerForStep,
    setShowIconPickerForStep,
    categoryOpen,
    setCategoryOpen,
    categoryActiveTabs,
    setCategoryActiveTabs,
    categoryRulesOpen,
    setCategoryRulesOpen,
    getStepCategories,
    updateStepCategories,
    clearCategoryConditionRules,
    addCategoryConditionRule,
    removeCategoryConditionRule,
    updateCategoryConditionRule,
    updateCategoryAutoNextRule,
  };
}
