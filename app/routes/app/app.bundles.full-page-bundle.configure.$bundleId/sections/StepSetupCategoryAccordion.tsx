import { useRef, useState } from "react";

import { moveArrayItem } from "../../../../lib/bundle-config/reorder-items";
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
  const {
    categoryActiveTabs,
    categoryOpen,
    draggedCatKey,
    dragOverCatKey,
    fullPageBundleStyles,
    handleCatDragEnd,
    handleCatDragStart,
    handleCatDrop,
    markAsDirty,
    openStepCategoryMultiLanguageModal,
    setCategoryActiveTabs,
    setCategoryOpen,
    setDragOverCatKey,
    showPolarisModal,
    hidePolarisModal,
    shopify,
    stepsState,
  } = flow;
  const catKey = `${step.id}__${cat.id ?? catIndex}`;
  const catActiveTab = categoryActiveTabs[catKey] ?? 0;
  const catProducts = (cat.products as any[]) ?? [];
  const catCollections = (cat.collections as any[]) ?? [];
  const isOpen = categoryOpen[catKey] ?? false;
  const modalIdBase = `fpb-category-${catKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const selectedProductsModalId = `${modalIdBase}-selected-products-modal`;
  const selectedCollectionsModalId = `${modalIdBase}-selected-collections-modal`;
  const selectedProductsModalRef = useRef<any>(null);
  const selectedCollectionsModalRef = useRef<any>(null);
  const [draggedProductIndex, setDraggedProductIndex] = useState<number | null>(
    null,
  );
  const [draggedCollectionIndex, setDraggedCollectionIndex] = useState<
    number | null
  >(null);
  const getProductImageUrl = (product: any) =>
    product.imageUrl ||
    product.image?.url ||
    product.images?.[0]?.url ||
    product.images?.[0]?.originalSrc ||
    "/bundle.png";

  const updateCategory = (updater: (category: any) => any) => {
    const updated = ((step.StepCategory as any[]) ?? []).map(
      (category: any, index: number) =>
        index === catIndex ? updater(category) : category,
    );
    stepsState.updateStepField(step.id, "StepCategory", updated);
    markAsDirty();
  };

  const handlePickProducts = async () => {
    const picked = await (shopify as any).resourcePicker({
      type: "product",
      multiple: true,
      selectionIds: catProducts.map((p: any) => ({
        id: p.id,
      })),
    });
    if (!picked) return;

    updateCategory((category: any) => ({
      ...category,
      products: picked.map((p: any) => ({
        id: p.id,
        title: p.title,
        imageUrl: p.images?.[0]?.originalSrc || p.images?.[0]?.url || null,
        variants: p.variants || null,
        minQuantity: 1,
        maxQuantity: 10,
      })),
    }));
  };

  const handlePickCollections = async () => {
    const picked = await (shopify as any).resourcePicker({
      type: "collection",
      multiple: true,
      selectionIds: catCollections.map((collection: any) => ({
        id: collection.id,
      })),
    });
    if (!picked) return;

    updateCategory((category: any) => ({
      ...category,
      collections: picked.map((collection: any) => ({
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
      })),
    }));
  };

  const removeCategoryProduct = (productId: string) => {
    updateCategory((category: any) => ({
      ...category,
      products: ((category.products as any[]) ?? []).filter(
        (product: any) => product.id !== productId,
      ),
    }));
  };

  const removeCategoryCollection = (collectionId: string) => {
    updateCategory((category: any) => ({
      ...category,
      collections: ((category.collections as any[]) ?? []).filter(
        (collection: any) => collection.id !== collectionId,
      ),
    }));
  };

  const reorderCategoryProducts = (fromIndex: number, toIndex: number) => {
    updateCategory((category: any) => ({
      ...category,
      products: moveArrayItem(
        ((category.products as any[]) ?? []),
        fromIndex,
        toIndex,
      ),
    }));
  };

  const reorderCategoryCollections = (fromIndex: number, toIndex: number) => {
    updateCategory((category: any) => ({
      ...category,
      collections: moveArrayItem(
        ((category.collections as any[]) ?? []),
        fromIndex,
        toIndex,
      ),
    }));
  };

  return (
    <div
      key={cat.id ?? catIndex}
      data-cat-key={catKey}
      className={`${fullPageBundleStyles.categoryAccordion}${dragOverCatKey === catKey ? ` ${fullPageBundleStyles.categoryDragOver}` : ""}`}
      onDragOver={(e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedCatKey && draggedCatKey !== catKey)
          setDragOverCatKey(catKey);
      }}
      onDragLeave={(e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setDragOverCatKey(null);
      }}
      onDrop={(e: React.DragEvent) => handleCatDrop(e, step.id, catKey)}
    >
      <div
        className={fullPageBundleStyles.categoryAccordionHeader}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onClick={() =>
          setCategoryOpen((prev: Record<string, boolean>) => ({
            ...prev,
            [catKey]: !prev[catKey],
          }))
        }
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCategoryOpen((prev: Record<string, boolean>) => ({
              ...prev,
              [catKey]: !prev[catKey],
            }));
          }
        }}
      >
        <span
          className={fullPageBundleStyles.categoryDrag}
          aria-hidden="true"
          draggable="true"
          onDragStart={(e: React.DragEvent) => {
            e.stopPropagation();
            handleCatDragStart(e, step.id, catKey);
          }}
          onDragEnd={handleCatDragEnd}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          ⠿
        </span>
        <span className={fullPageBundleStyles.categoryName}>
          {cat.name || `Category ${catIndex + 1}`}
        </span>
        <div
          className={fullPageBundleStyles.categoryActions}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <button
            type="button"
            className={fullPageBundleStyles.categoryIconButton}
            aria-label="Clone"
            title="Clone"
            onClick={() => {
              const cats = (step.StepCategory as any[]) ?? [];
              stepsState.updateStepField(step.id, "StepCategory", [
                ...cats,
                {
                  ...cats[catIndex],
                  id: `cat-${Date.now()}`,
                  name: `${cats[catIndex].name || `Category ${catIndex + 1}`} Copy`,
                  sortOrder: cats.length,
                },
              ]);
              markAsDirty();
            }}
          >
            <s-icon type="duplicate" />
          </button>
          <button
            type="button"
            className={fullPageBundleStyles.categoryDeleteIconButton}
            aria-label="Delete"
            title="Delete"
            onClick={() => {
              const updated = ((step.StepCategory as any[]) ?? []).filter(
                (_: any, i: number) => i !== catIndex,
              );
              stepsState.updateStepField(step.id, "StepCategory", updated);
              markAsDirty();
            }}
          >
            <s-icon type="delete" />
          </button>
        </div>
        <button
          type="button"
          className={fullPageBundleStyles.categoryChevron}
          aria-label={isOpen ? "Collapse category" : "Expand category"}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setCategoryOpen((prev: Record<string, boolean>) => ({
              ...prev,
              [catKey]: !prev[catKey],
            }));
          }}
        >
          {isOpen ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 9L7 5L11 9"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 5L7 9L11 5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      {isOpen && (
        <div className={fullPageBundleStyles.categoryAccordionBody}>
          <div className={fullPageBundleStyles.categoryFieldGroup}>
            <label
              className={fullPageBundleStyles.categoryFieldLabel}
              htmlFor={`fpb-category-name-${catKey}`}
            >
              Category Name
            </label>
            <div className={fullPageBundleStyles.catNameRow}>
              <div className={fullPageBundleStyles.categoryInputStack}>
                <input
                  id={`fpb-category-name-${catKey}`}
                  className={fullPageBundleStyles.categoryNameInput}
                  type="text"
                  value={cat.name ?? ""}
                  placeholder={`Category ${catIndex + 1}`}
                  aria-label="Category name"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const updated = ((step.StepCategory as any[]) ?? []).map(
                      (c: any, i: number) =>
                        i === catIndex
                          ? {
                              ...c,
                              name: e.target.value,
                              title: e.target.value,
                            }
                          : c,
                    );
                    stepsState.updateStepField(
                      step.id,
                      "StepCategory",
                      updated,
                    );
                    markAsDirty();
                  }}
                />
              </div>
              <button
                type="button"
                className={fullPageBundleStyles.categoryTextButton}
                onClick={() =>
                  openStepCategoryMultiLanguageModal(step.id, catIndex)
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 3.25h5.25M4.63 2v1.25M6.5 3.25c-.38 1.97-1.75 3.5-3.75 4.25M3.38 4.75c.55 1.1 1.45 1.95 2.72 2.55M7.25 12l.7-1.75m0 0L9.5 6.5l1.55 3.75m-3.1 0h3.1M12 12l-.95-1.75"
                    stroke="currentColor"
                    strokeWidth="1.15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Multi Language
              </button>
            </div>
          </div>
          <div className={fullPageBundleStyles.tabRow}>
            <button
              className={
                catActiveTab === 0
                  ? fullPageBundleStyles.tabActive
                  : fullPageBundleStyles.tab
              }
              onClick={() =>
                setCategoryActiveTabs((prev: Record<string, number>) => ({
                  ...prev,
                  [catKey]: 0,
                }))
              }
            >
              Products
              {catProducts.length > 0 && (
                <span className={fullPageBundleStyles.tabBadge}>
                  {catProducts.length}
                </span>
              )}
            </button>
            <button
              className={
                catActiveTab === 1
                  ? fullPageBundleStyles.tabActive
                  : fullPageBundleStyles.tab
              }
              onClick={() =>
                setCategoryActiveTabs((prev: Record<string, number>) => ({
                  ...prev,
                  [catKey]: 1,
                }))
              }
            >
              Collections
              {catCollections.length > 0 && (
                <span className={fullPageBundleStyles.tabBadge}>
                  {catCollections.length}
                </span>
              )}
            </button>
          </div>
          {catActiveTab === 0 && (
            <div>
              <p className={fullPageBundleStyles.categoryPickerHelp}>
                Products selected here will be displayed on this step
              </p>
              <div className={fullPageBundleStyles.productActions}>
                <s-button
                  variant="primary"
                  onClick={handlePickProducts}
                >
                  Add Products
                </s-button>
                {catProducts.length > 0 && (
                  <button
                    type="button"
                    className={fullPageBundleStyles.categorySelectedItemsChip}
                    onClick={() => showPolarisModal(selectedProductsModalRef)}
                  >
                    {catProducts.length} Selected
                  </button>
                )}
              </div>
              <s-modal
                id={selectedProductsModalId}
                ref={selectedProductsModalRef}
                heading="Selected Products"
              >
                {catProducts.length > 0 ? (
                  <ul className={fullPageBundleStyles.selectedItemList}>
                    {catProducts.map((product: any, index: number) => (
                      <li
                        key={product.id ?? index}
                        className={fullPageBundleStyles.categorySelectedItemRow}
                        onDragOver={(event: React.DragEvent) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onDrop={(event: React.DragEvent) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (draggedProductIndex === null) return;
                          reorderCategoryProducts(draggedProductIndex, index);
                          setDraggedProductIndex(null);
                        }}
                      >
                        <button
                          type="button"
                          className={fullPageBundleStyles.categorySelectedItemDrag}
                          aria-label={`Reorder ${product.title || "selected product"}`}
                          draggable="true"
                          onClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                          }}
                          onDragStart={(event: React.DragEvent) => {
                            event.stopPropagation();
                            setDraggedProductIndex(index);
                          }}
                          onDragEnd={(event: React.DragEvent) => {
                            event.stopPropagation();
                            setDraggedProductIndex(null);
                          }}
                        >
                          ⠿
                        </button>
                        <img
                          className={fullPageBundleStyles.categorySelectedItemImage}
                          src={getProductImageUrl(product)}
                          alt={product.title || product.name || "Product"}
                        />
                        <span className={fullPageBundleStyles.categorySelectedItemName}>
                          {product.title || product.name || "Unnamed Product"}
                        </span>
                        <button
                          type="button"
                          className={fullPageBundleStyles.categorySelectedItemRemove}
                          aria-label={`Remove ${product.title || "selected product"}`}
                          onClick={() => removeCategoryProduct(product.id)}
                        >
                          <s-icon type="delete" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                    No products selected for this category yet.
                  </p>
                )}
                <s-button
                  slot="secondary-actions"
                  variant="secondary"
                  commandFor={selectedProductsModalId}
                  command="--hide"
                  onClick={() => hidePolarisModal(selectedProductsModalRef)}
                >
                  Close
                </s-button>
                <s-button
                  slot="primary-action"
                  variant="primary"
                  onClick={handlePickProducts}
                >
                  Add Products
                </s-button>
              </s-modal>
            </div>
          )}
          {catActiveTab === 1 && (
            <div>
              <p className={fullPageBundleStyles.categoryPickerHelp}>
                Collections selected here will be displayed on this step
              </p>
              <div className={fullPageBundleStyles.productActions}>
                <s-button
                  variant="primary"
                  onClick={handlePickCollections}
                >
                  Add Collections
                </s-button>
                {catCollections.length > 0 && (
                  <button
                    type="button"
                    className={fullPageBundleStyles.categorySelectedItemsChip}
                    onClick={() => showPolarisModal(selectedCollectionsModalRef)}
                  >
                    {catCollections.length} Selected
                  </button>
                )}
              </div>
              <s-modal
                id={selectedCollectionsModalId}
                ref={selectedCollectionsModalRef}
                heading="Selected Collections"
              >
                {catCollections.length > 0 ? (
                  <ul className={fullPageBundleStyles.selectedItemList}>
                    {catCollections.map((collection: any, index: number) => (
                      <li
                        key={collection.id ?? index}
                        className={fullPageBundleStyles.categorySelectedItemRow}
                        onDragOver={(event: React.DragEvent) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onDrop={(event: React.DragEvent) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (draggedCollectionIndex === null) return;
                          reorderCategoryCollections(
                            draggedCollectionIndex,
                            index,
                          );
                          setDraggedCollectionIndex(null);
                        }}
                      >
                        <button
                          type="button"
                          className={fullPageBundleStyles.categorySelectedItemDrag}
                          aria-label={`Reorder ${collection.title || "selected collection"}`}
                          draggable="true"
                          onClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                          }}
                          onDragStart={(event: React.DragEvent) => {
                            event.stopPropagation();
                            setDraggedCollectionIndex(index);
                          }}
                          onDragEnd={(event: React.DragEvent) => {
                            event.stopPropagation();
                            setDraggedCollectionIndex(null);
                          }}
                        >
                          ⠿
                        </button>
                        <span className={fullPageBundleStyles.categorySelectedItemName}>
                          {collection.title || "Unnamed Collection"}
                        </span>
                        <button
                          type="button"
                          className={fullPageBundleStyles.categorySelectedItemRemove}
                          aria-label={`Remove ${collection.title || "selected collection"}`}
                          onClick={() =>
                            removeCategoryCollection(collection.id)
                          }
                        >
                          x
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                    No collections selected for this category yet.
                  </p>
                )}
                <s-button
                  slot="secondary-actions"
                  variant="secondary"
                  commandFor={selectedCollectionsModalId}
                  command="--hide"
                  onClick={() => hidePolarisModal(selectedCollectionsModalRef)}
                >
                  Close
                </s-button>
                <s-button
                  slot="primary-action"
                  variant="primary"
                  onClick={handlePickCollections}
                >
                  Add Collections
                </s-button>
              </s-modal>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
