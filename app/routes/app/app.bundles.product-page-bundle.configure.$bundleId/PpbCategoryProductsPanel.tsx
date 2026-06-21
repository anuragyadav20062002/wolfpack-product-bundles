import { usePpbConfigureContext } from "./PpbConfigureContext";
import { getStepCategories } from "./PpbStepSetupShared";

export function PpbCategoryProductsPanel({
  step,
  catIndex,
  catProducts,
}: {
  step: any;
  catIndex: number;
  catProducts: any[];
}) {
  const { markAsDirty, productPageBundleStyles, shopify, stepsState } =
    usePpbConfigureContext();

  return (
    <div>
      <p className={productPageBundleStyles.categoryPickerHelp}>
        Products selected here will be displayed on this step
      </p>
      <div className={productPageBundleStyles.productActions}>
        <s-button
          variant="primary"
          onClick={async () => {
            const picked = await (shopify as any).resourcePicker({
              type: "product",
              multiple: true,
              selectionIds: catProducts.map((p: any) => ({ id: p.id })),
            });
            if (!picked) return;
            const updated = getStepCategories(step).map((c: any, i: number) =>
              i === catIndex
                ? {
                    ...c,
                    products: picked.map((p: any) => ({
                      id: p.id,
                      title: p.title,
                      imageUrl:
                        p.images?.[0]?.originalSrc ||
                        p.images?.[0]?.url ||
                        null,
                      variants: p.variants || null,
                      minQuantity: 1,
                      maxQuantity: 10,
                    })),
                  }
                : c,
            );
            stepsState.updateStepField(step.id, "StepCategory", updated);
            markAsDirty();
          }}
        >
          Add Products
        </s-button>
        {catProducts.length > 0 && (
          <s-badge tone="success">{catProducts.length} Selected</s-badge>
        )}
      </div>
      {catProducts.length > 0 && (
        <div className={productPageBundleStyles.categoryProductList}>
          {catProducts.map((product: any) => (
            <div
              key={product.id}
              className={productPageBundleStyles.categoryProductRow}
            >
              <img
                className={productPageBundleStyles.categoryProductImage}
                src={product.imageUrl || "/bundle.png"}
                alt={product.title}
              />
              <span className={productPageBundleStyles.categoryProductTitle}>
                {product.title}
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
                            products: c.products.filter(
                              (p: any) => p.id !== product.id,
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
