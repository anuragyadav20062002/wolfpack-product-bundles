import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "@remix-run/react";
import {
  asVisibilityArray,
  getVisibilityDisplayTarget,
} from "./visibility-helpers";
import { resolveFpbTemplateSelection } from "../../../lib/fpb-template-selection";
import { getPreviewReadinessStorageKey } from "../../../lib/bundle-preview-readiness";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";

export function useConfigureVisibilityTemplateState(
  flow: ConfigureBundleFlowDraft,
) {
  const { appEmbedEnabled, bundle, markAsDirty, stepsState, textOverrides } = flow;
  const [isInstallingWidget, setIsInstallingWidget] = useState(false);
  const [activeAssetTabIndex, setActiveAssetTabIndex] = useState(0);
  const [searchBarEnabled, setSearchBarEnabled] = useState<boolean>(
    (bundle as any).searchBarEnabled ?? false,
  );
  const originalSearchBarEnabledRef = useRef<boolean>(
    (bundle as any).searchBarEnabled ?? false,
  );
  const savedBundleUpsellConfig = ((bundle as any).bundleUpsellConfig ??
    null) as any;
  const savedWidgetConfiguration = savedBundleUpsellConfig?.widgetConfiguration;
  const savedWidgetDisplayConfiguration =
    savedWidgetConfiguration?.displayConfiguration;
  const [upsellWidgetEnabled, setUpsellWidgetEnabled] = useState<boolean>(
    savedWidgetConfiguration?.isEnabled ??
      (bundle as any).upsellWidgetEnabled ??
      false,
  );
  const [upsellWidgetDisplayMode, setUpsellWidgetDisplayMode] =
    useState<string>((bundle as any).upsellWidgetDisplayMode ?? "button");
  const [upsellWidgetDisplayOn, setUpsellWidgetDisplayOn] = useState<string>(
    (bundle as any).upsellWidgetDisplayOn ??
      getVisibilityDisplayTarget(savedWidgetDisplayConfiguration, "all"),
  );
  const [upsellWidgetTitle, setUpsellWidgetTitle] = useState<string>(
    savedWidgetConfiguration?.title ?? "Bundle & Save",
  );
  const [upsellWidgetDescription, setUpsellWidgetDescription] =
    useState<string>(savedWidgetConfiguration?.description ?? "");
  const [upsellWidgetButtonText, setUpsellWidgetButtonText] = useState<string>(
    savedWidgetConfiguration?.buttonText ??
      textOverrides.widgetButtonText ??
      "Save More With Bundle",
  );
  const [upsellWidgetImageUrl, setUpsellWidgetImageUrl] = useState<string>(
    savedWidgetConfiguration?.imageUrl ?? "",
  );
  const [upsellWidgetLanguageMode, setUpsellWidgetLanguageMode] =
    useState<string>(
      savedWidgetConfiguration?.languageMode ??
        savedBundleUpsellConfig?.languageMode ??
        "SINGLE",
    );
  const [upsellWidgetSelectedProducts, setUpsellWidgetSelectedProducts] =
    useState<unknown[]>(
      asVisibilityArray(savedWidgetDisplayConfiguration?.selectedProducts),
    );
  const [
    upsellWidgetSpecificProductPages,
    setUpsellWidgetSpecificProductPages,
  ] = useState<unknown[]>(
    asVisibilityArray(
      savedWidgetDisplayConfiguration?.showOnSpecificProductPages,
    ),
  );
  const [
    upsellWidgetCollectionsSelectedData,
    setUpsellWidgetCollectionsSelectedData,
  ] = useState<unknown[]>(
    asVisibilityArray(savedWidgetDisplayConfiguration?.collectionsSelectedData),
  );
  const [
    upsellWidgetSpecificCollectionPages,
    setUpsellWidgetSpecificCollectionPages,
  ] = useState<unknown[]>(
    asVisibilityArray(
      savedWidgetDisplayConfiguration?.showOnSpecificCollectionPages,
    ),
  );
  const [autoSelectBrowsedProduct, setAutoSelectBrowsedProduct] =
    useState<boolean>(
      savedWidgetConfiguration?.useLinkProductAsDefaultProduct ??
        (bundle as any).autoSelectBrowsedProduct ??
        false,
    );
  const isBundleVisibilityPending = !appEmbedEnabled;
  const originalUpsellWidgetEnabledRef = useRef<boolean>(
    savedWidgetConfiguration?.isEnabled ??
      (bundle as any).upsellWidgetEnabled ??
      false,
  );
  const originalUpsellWidgetDisplayModeRef = useRef<string>(
    (bundle as any).upsellWidgetDisplayMode ?? "button",
  );
  const originalUpsellWidgetDisplayOnRef = useRef<string>(
    (bundle as any).upsellWidgetDisplayOn ??
      getVisibilityDisplayTarget(savedWidgetDisplayConfiguration, "all"),
  );
  const originalUpsellWidgetButtonTextRef = useRef<string>(
    savedWidgetConfiguration?.buttonText ??
      (bundle as any).textOverrides?.widgetButtonText ??
      "Save More With Bundle",
  );
  const originalAutoSelectBrowsedProductRef = useRef<boolean>(
    savedWidgetConfiguration?.useLinkProductAsDefaultProduct ??
      (bundle as any).autoSelectBrowsedProduct ??
      false,
  );
  const [bundleBannerDesktopUrl, setBundleBannerDesktopUrl] = useState<string>(
    (bundle as any).bundleBannerDesktopUrl ?? "",
  );
  const [bundleBannerMobileUrl, setBundleBannerMobileUrl] = useState<string>(
    (bundle as any).bundleBannerMobileUrl ?? "",
  );
  const [bundleLevelCss, setBundleLevelCss] = useState<string>(
    (bundle as any).bundleLevelCss ?? "",
  );
  const initialTemplateSelection = resolveFpbTemplateSelection(bundle as any);
  const [bundleDesignTemplate, setBundleDesignTemplate] = useState<
    string | null
  >(initialTemplateSelection.bundleDesignTemplate);
  const [bundleDesignPresetId, setBundleDesignPresetId] = useState<
    string | null
  >(initialTemplateSelection.bundleDesignPresetId);
  const [pendingDesignTemplate, setPendingDesignTemplate] = useState<
    string | null
  >(null);
  const [pendingDesignPresetId, setPendingDesignPresetId] = useState<
    string | null
  >(null);
  const [slideKey, setSlideKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"forward" | "backward" | null>(null);
  const [categoryActiveTabs, setCategoryActiveTabs] = useState<
    Record<string, number>
  >({});
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({});
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
  const [showIconPickerForStep, setShowIconPickerForStep] = useState<
    string | null
  >(null);
  const [isStepLocaleModalOpen, setIsStepLocaleModalOpen] = useState(false);
  const selectTemplateModalRef = useRef<HTMLDivElement>(null);
  const selectTemplateOpenButtonRef = useRef<HTMLButtonElement>(null);
  const [isSelectTemplateModalOpen, setIsSelectTemplateModalOpen] =
    useState(false);
  const [templateModalStep, setTemplateModalStep] = useState<
    | "templates"
    | "colorsAndCorners"
    | "textAndImages"
    | "enableThemeExtension"
    | "confirm"
  >("templates");
  const templateFetcher = useFetcher();
  const [templateSaveError, setTemplateSaveError] = useState<string | null>(
    null,
  );
  const lastTemplateRequestRef = useRef<{
    template: string | null;
    presetId: string | null;
  } | null>(null);
  const lastTemplateResponseRef = useRef<unknown>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);

  useEffect(() => {
    setHasPreview(
      !!localStorage.getItem(getPreviewReadinessStorageKey(bundle.id)),
    );
  }, [bundle.id]);

  Object.assign(flow, {
    activeAssetTabIndex,
    addCategoryConditionRule,
    asVisibilityArray,
    autoSelectBrowsedProduct,
    bundleBannerDesktopUrl,
    bundleBannerMobileUrl,
    bundleDesignPresetId,
    bundleDesignTemplate,
    bundleLevelCss,
    categoryActiveTabs,
    categoryOpen,
    categoryRulesOpen,
    clearCategoryConditionRules,
    getStepCategories,
    getVisibilityDisplayTarget,
    hasPreview,
    isBundleVisibilityPending,
    isInstallingWidget,
    isSelectTemplateModalOpen,
    isStepLocaleModalOpen,
    isSyncModalOpen,
    lastTemplateRequestRef,
    lastTemplateResponseRef,
    originalAutoSelectBrowsedProductRef,
    originalSearchBarEnabledRef,
    originalUpsellWidgetButtonTextRef,
    originalUpsellWidgetDisplayModeRef,
    originalUpsellWidgetDisplayOnRef,
    originalUpsellWidgetEnabledRef,
    pendingDesignPresetId,
    pendingDesignTemplate,
    productMenuOpen,
    readinessOpen,
    removeCategoryConditionRule,
    savedBundleUpsellConfig,
    savedWidgetConfiguration,
    savedWidgetDisplayConfiguration,
    searchBarEnabled,
    selectTemplateModalRef,
    selectTemplateOpenButtonRef,
    setActiveAssetTabIndex,
    setAutoSelectBrowsedProduct,
    setBundleBannerDesktopUrl,
    setBundleBannerMobileUrl,
    setBundleDesignPresetId,
    setBundleDesignTemplate,
    setBundleLevelCss,
    setCategoryActiveTabs,
    setCategoryOpen,
    setCategoryRulesOpen,
    setHasPreview,
    setIsInstallingWidget,
    setIsSelectTemplateModalOpen,
    setIsStepLocaleModalOpen,
    setIsSyncModalOpen,
    setPendingDesignPresetId,
    setPendingDesignTemplate,
    setProductMenuOpen,
    setReadinessOpen,
    setSearchBarEnabled,
    setShowIconPickerForStep,
    setSlideDir,
    setSlideKey,
    setTemplateModalStep,
    setTemplateSaveError,
    setUpsellWidgetButtonText,
    setUpsellWidgetCollectionsSelectedData,
    setUpsellWidgetDescription,
    setUpsellWidgetDisplayMode,
    setUpsellWidgetDisplayOn,
    setUpsellWidgetEnabled,
    setUpsellWidgetImageUrl,
    setUpsellWidgetLanguageMode,
    setUpsellWidgetSelectedProducts,
    setUpsellWidgetSpecificCollectionPages,
    setUpsellWidgetSpecificProductPages,
    setUpsellWidgetTitle,
    showIconPickerForStep,
    slideDir,
    slideKey,
    templateFetcher,
    templateModalStep,
    templateSaveError,
    updateCategoryAutoNextRule,
    updateCategoryConditionRule,
    updateStepCategories,
    upsellWidgetButtonText,
    upsellWidgetCollectionsSelectedData,
    upsellWidgetDescription,
    upsellWidgetDisplayMode,
    upsellWidgetDisplayOn,
    upsellWidgetEnabled,
    upsellWidgetImageUrl,
    upsellWidgetLanguageMode,
    upsellWidgetSelectedProducts,
    upsellWidgetSpecificCollectionPages,
    upsellWidgetSpecificProductPages,
    upsellWidgetTitle,
  });
}
