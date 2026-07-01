import { useRef, useState } from "react";

import { moveArrayItem } from "../../../lib/bundle-config/reorder-items";
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
  const {
    hidePolarisModal,
    markAsDirty,
    productPageBundleStyles,
    shopify,
    showPolarisModal,
    stepsState,
  } = usePpbConfigureContext();
  const selectedProductsModalRef = useRef<any>(null);
  const [draggedProductIndex, setDraggedProductIndex] = useState<number | null>(
    null,
  );

  const updateCategoryProducts = (products: any[]) => {
    const updated = getStepCategories(step).map((category: any, index: number) =>
      index === catIndex
        ? {
            ...category,
            products,
          }
        : category,
    );
    stepsState.updateStepField(step.id, "StepCategory", updated);
    markAsDirty();
  };

  const handlePickProducts = async () => {
    const picked = await (shopify as any).resourcePicker({
      type: "product",
      multiple: true,
      selectionIds: catProducts.map((product: any) => ({ id: product.id })),
    });
    if (!picked) return;

    updateCategoryProducts(
      picked.map((product: any) => ({
        id: product.id,
        title: product.title,
        imageUrl:
          product.images?.[0]?.originalSrc || product.images?.[0]?.url || null,
        variants: product.variants || null,
        minQuantity: 1,
        maxQuantity: 10,
      })),
    );
  };

  const removeProduct = (productId: string) => {
    updateCategoryProducts(
      catProducts.filter((product: any) => product.id !== productId),
    );
  };

  const reorderProduct = (fromIndex: number, toIndex: number) => {
    updateCategoryProducts(moveArrayItem(catProducts, fromIndex, toIndex));
  };

  return (
    <div>
      <p className={productPageBundleStyles.categoryPickerHelp}>
        Products selected here will be displayed on this step
      </p>
      <div className={productPageBundleStyles.productActions}>
        <s-button variant="primary" onClick={handlePickProducts}>
          Add Products
        </s-button>
        {catProducts.length > 0 && (
          <button
            type="button"
            className={productPageBundleStyles.selectedItemsChip}
            onClick={() => showPolarisModal(selectedProductsModalRef)}
          >
            {catProducts.length} Selected
          </button>
        )}
      </div>
      <s-modal ref={selectedProductsModalRef} heading="Selected Products">
        {catProducts.length > 0 ? (
          <ul className={productPageBundleStyles.selectedItemList}>
            {catProducts.map((product: any, index: number) => (
              <li
                key={product.id ?? index}
                className={productPageBundleStyles.selectedItemRow}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (draggedProductIndex === null) return;
                  reorderProduct(draggedProductIndex, index);
                  setDraggedProductIndex(null);
                }}
              >
                <button
                  type="button"
                  className={productPageBundleStyles.selectedItemDrag}
                  aria-label={`Reorder ${product.title || "selected product"}`}
                  draggable="true"
                  onDragStart={(event) => {
                    event.stopPropagation();
                    setDraggedProductIndex(index);
                  }}
                  onDragEnd={(event) => {
                    event.stopPropagation();
                    setDraggedProductIndex(null);
                  }}
                >
                  ::
                </button>
                <span className={productPageBundleStyles.selectedItemName}>
                  {product.title || product.name || "Unnamed Product"}
                </span>
                <button
                  type="button"
                  className={productPageBundleStyles.selectedItemRemove}
                  aria-label={`Remove ${product.title || "selected product"}`}
                  onClick={() => removeProduct(product.id)}
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No products selected for this category yet.</p>
        )}
        <s-button
          slot="secondary-actions"
          variant="secondary"
          onClick={() => hidePolarisModal(selectedProductsModalRef)}
        >
          Close
        </s-button>
        <s-button slot="primary-action" variant="primary" onClick={handlePickProducts}>
          Add Products
        </s-button>
      </s-modal>
    </div>
  );
}
