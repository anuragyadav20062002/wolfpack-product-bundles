import { CommonStepCategoryAccordion } from "../_shared/bundle-configure/CommonStepCategoryAccordion";
import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbCategoryAccordion({
  step,
  cat,
  catIndex,
}: {
  step: any;
  cat: any;
  catIndex: number;
}) {
  const flow = usePpbConfigureContext();

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
        styles: flow.productPageBundleStyles,
      }}
      step={step}
      cat={cat}
      catIndex={catIndex}
    />
  );
}
