import { CommonStepCategoryAccordion } from "../../_shared/bundle-configure/CommonStepCategoryAccordion";
import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbStepCategoryAccordion({
  flow,
  step,
  cat,
  catIndex,
}: {
  flow: ConfigureBundleFlowContext;
  step: any;
  cat: any;
  catIndex: number;
}) {
  return (
    <CommonStepCategoryAccordion
      adapter={{
        categoryActiveTabs: flow.categoryActiveTabs,
        categoryOpen: flow.categoryOpen,
        draggedCatKey: flow.draggedCatKey,
        dragOverCatKey: flow.dragOverCatKey,
        handleCatDragEnd: flow.handleCatDragEnd,
        handleCatDragStart: flow.handleCatDragStart,
        handleCatDrop: flow.handleCatDrop,
        hidePolarisModal: flow.hidePolarisModal,
        markAsDirty: flow.markAsDirty,
        openStepCategoryMultiLanguageModal:
          flow.openStepCategoryMultiLanguageModal,
        setCategoryActiveTabs: flow.setCategoryActiveTabs,
        setCategoryOpen: flow.setCategoryOpen,
        setDragOverCatKey: flow.setDragOverCatKey,
        shopify: flow.shopify,
        showPolarisModal: flow.showPolarisModal,
        stepsState: flow.stepsState,
        styles: flow.fullPageBundleStyles,
      }}
      step={step}
      cat={cat}
      catIndex={catIndex}
    />
  );
}
