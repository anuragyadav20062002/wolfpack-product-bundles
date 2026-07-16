import { CommonStepCategoryAccordion } from "../_shared/bundle-configure/CommonStepCategoryAccordion";
import { updatePpbCategoryVariantFlag } from "../../../lib/bundle-config/common-configure-page-model";
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
  const categories = ((step.StepCategory as any[]) ?? []);

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
      categoryControls={
        <div className={flow.productPageBundleStyles.categoryVariantControl}>
          <s-checkbox
            label="Display variants as individual products"
            checked={cat.displayVariantsAsIndividualProducts || undefined}
            onChange={(event) => {
              const checked = (event.target as HTMLInputElement).checked;
              flow.stepsState.updateStepField(
                step.id,
                "StepCategory",
                updatePpbCategoryVariantFlag(categories, catIndex, checked),
              );
              flow.markAsDirty();
            }}
          />
        </div>
      }
    />
  );
}
