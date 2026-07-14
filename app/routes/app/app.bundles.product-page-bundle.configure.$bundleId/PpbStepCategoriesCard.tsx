import { applyPpbCategoryVariantFlags } from "../../../lib/bundle-config/common-configure-page-model";
import { PpbCategoryAccordion } from "./PpbCategoryAccordion";
import { usePpbConfigureContext } from "./PpbConfigureContext";
import { getStepCategories, PlusIcon } from "./PpbStepSetupShared";

export function PpbStepCategoriesCard({ step }: { step: any }) {
  const {
    markAsDirty,
    productPageBundleStyles,
    QuestionHelpTooltip,
    stepsState,
  } = usePpbConfigureContext();
  const stepCategories = getStepCategories(step);

  return (
    <div className={productPageBundleStyles.card}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Category</h3>
        <QuestionHelpTooltip tooltipKey="category" />
      </div>
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 14,
          color: "#6d7175",
        }}
      >
        Add all product selections in this step to a single category or separate
        them into multiple categories for better segregation.
      </p>
      {stepCategories.length === 0 && (
        <div className={productPageBundleStyles.emptyState}>
          No category defined yet
        </div>
      )}
      {stepCategories.map((cat: any, catIndex: number) => (
        <PpbCategoryAccordion
          key={cat.id ?? catIndex}
          step={step}
          cat={cat}
          catIndex={catIndex}
        />
      ))}
      <button
        type="button"
        className={productPageBundleStyles.addSectionButton}
        onClick={() => {
          const displayVariantsForAllCategories =
            stepCategories.length > 0 &&
            stepCategories.every(
              (category: any) =>
                category.displayVariantsAsIndividualProducts === true,
            );
          stepsState.updateStepField(step.id, "StepCategory", [
            ...stepCategories,
            {
              id: `cat-${Date.now()}`,
              name: "",
              title: "",
              sortOrder: stepCategories.length,
              products: [],
              collections: [],
              displayVariantsAsIndividualProducts:
                displayVariantsForAllCategories,
              displayVariantsAsSwatches: false,
            },
          ]);
          markAsDirty();
        }}
      >
        <PlusIcon />
        Add Category
      </button>
      <PpbCategoryVariantControlsSlot step={step} categories={stepCategories} />
    </div>
  );
}

function PpbCategoryVariantControlsSlot({
  step,
  categories,
}: {
  step: any;
  categories: any[];
}) {
  const { markAsDirty, stepsState } = usePpbConfigureContext();

  return (
    <>
      <div style={{ margin: "12px 0" }}>
        <s-divider />
      </div>
      <s-checkbox
        label="Display variants as individual products"
        checked={
          (categories.length > 0 &&
            categories.every(
              (category: any) =>
                category.displayVariantsAsIndividualProducts === true,
            )) ||
          undefined
        }
        onChange={(event) => {
          const checked = (event.target as HTMLInputElement).checked;
          stepsState.updateStepField(
            step.id,
            "StepCategory",
            applyPpbCategoryVariantFlags(categories, {
              displayVariantsAsIndividualProducts: checked,
            }),
          );
          markAsDirty();
        }}
      />
    </>
  );
}
