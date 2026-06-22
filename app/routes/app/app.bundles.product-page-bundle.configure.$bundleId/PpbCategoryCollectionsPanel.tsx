import { usePpbConfigureContext } from "./PpbConfigureContext";
import { getStepCategories } from "./PpbStepSetupShared";

export function PpbCategoryCollectionsPanel({
  step,
  catIndex,
  catCollections,
}: {
  step: any;
  catIndex: number;
  catCollections: any[];
}) {
  const { markAsDirty, productPageBundleStyles, shopify, stepsState } =
    usePpbConfigureContext();

  return (
    <div>
      <p className={productPageBundleStyles.categoryPickerHelp}>
        Collections selected here will be displayed on this step
      </p>
      <div className={productPageBundleStyles.productActions}>
        <s-button
          variant="primary"
          onClick={async () => {
            const picked = await (shopify as any).resourcePicker({
              type: "collection",
              multiple: true,
              selectionIds: catCollections.map((c: any) => ({ id: c.id })),
            });
            if (!picked) return;
            const updated = getStepCategories(step).map((c: any, i: number) =>
              i === catIndex
                ? {
                    ...c,
                    collections: picked.map((col: any) => ({
                      id: col.id,
                      handle: col.handle,
                      title: col.title,
                    })),
                  }
                : c,
            );
            stepsState.updateStepField(step.id, "StepCategory", updated);
            markAsDirty();
          }}
        >
          Add Collections
        </s-button>
        {catCollections.length > 0 && (
          <s-badge tone="success">{catCollections.length} Selected</s-badge>
        )}
      </div>
      {catCollections.length > 0 && (
        <div className={productPageBundleStyles.categoryProductList}>
          {catCollections.map((col: any) => (
            <div
              key={col.id}
              className={productPageBundleStyles.categoryProductRow}
            >
              <span className={productPageBundleStyles.categoryProductTitle}>
                {col.title}
              </span>
              <button
                type="button"
                className={productPageBundleStyles.categoryDangerButton}
                onClick={() => {
                  const updated = getStepCategories(step).map(
                    (c: any, i: number) =>
                      i === catIndex
                        ? {
                            ...c,
                            collections: c.collections.filter(
                              (col2: any) => col2.id !== col.id,
                            ),
                          }
                        : c,
                  );
                  stepsState.updateStepField(step.id, "StepCategory", updated);
                  markAsDirty();
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
