import { useRef, useState } from "react";
import type React from "react";

import { moveArrayItem } from "../../../../lib/bundle-config/reorder-items";

export interface CommonStepCategoryAccordionAdapter {
  categoryActiveTabs: Record<string, number>;
  categoryOpen: Record<string, boolean>;
  draggedCatKey: string | null;
  dragOverCatKey: string | null;
  handleCatDragEnd: (event: React.DragEvent) => void;
  handleCatDragStart: (
    event: React.DragEvent,
    stepId: string,
    catKey: string,
  ) => void;
  handleCatDrop: (
    event: React.DragEvent,
    stepId: string,
    catKey: string,
  ) => void;
  hidePolarisModal: (modalRef: React.RefObject<any>) => void;
  markAsDirty: () => void;
  openStepCategoryMultiLanguageModal: (
    stepId: string,
    catIndex: number,
  ) => void;
  setCategoryActiveTabs: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  setCategoryOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setDragOverCatKey: (catKey: string | null) => void;
  shopify: unknown;
  showPolarisModal: (modalRef: React.RefObject<any>) => void;
  stepsState: {
    updateStepField: (stepId: string, field: string, value: unknown) => void;
  };
  styles: Record<string, string>;
}

export function CommonStepCategoryAccordion({
  adapter,
  step,
  cat,
  catIndex,
  categoryControls,
}: {
  adapter: CommonStepCategoryAccordionAdapter;
  step: any;
  cat: any;
  catIndex: number;
  categoryControls?: React.ReactNode;
}) {
  const {
    categoryActiveTabs,
    categoryOpen,
    draggedCatKey,
    dragOverCatKey,
    handleCatDragEnd,
    handleCatDragStart,
    handleCatDrop,
    hidePolarisModal,
    markAsDirty,
    openStepCategoryMultiLanguageModal,
    setCategoryActiveTabs,
    setCategoryOpen,
    setDragOverCatKey,
    shopify,
    showPolarisModal,
    stepsState,
    styles,
  } = adapter;
  const catKey = `${step.id}__${cat.id ?? catIndex}`;
  const catActiveTab = categoryActiveTabs[catKey] ?? 0;
  const stepCategories = ((step.StepCategory as any[]) ?? []);
  const catProducts = (cat.products as any[]) ?? [];
  const catCollections = (cat.collections as any[]) ?? [];
  const isOpen = categoryOpen[catKey] ?? false;
  const shouldRenderCategoryNameField = stepCategories.length > 1;
  const modalIdBase = `configure-category-${catKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
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

  const updateCategory = (updater: (category: any) => any) => {
    const updated = stepCategories.map((category: any, index: number) =>
      index === catIndex ? updater(category) : category,
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

    updateCategory((category: any) => ({
      ...category,
      products: picked.map((product: any) => ({
        id: product.id,
        title: product.title,
        imageUrl:
          product.images?.[0]?.originalSrc || product.images?.[0]?.url || null,
        variants: product.variants || null,
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
      data-cat-key={catKey}
      className={`${styles.categoryAccordion}${dragOverCatKey === catKey ? ` ${styles.categoryDragOver}` : ""}`}
      onDragOver={(event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (draggedCatKey && draggedCatKey !== catKey)
          setDragOverCatKey(catKey);
      }}
      onDragLeave={(event: React.DragEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setDragOverCatKey(null);
      }}
      onDrop={(event: React.DragEvent) => handleCatDrop(event, step.id, catKey)}
    >
      <div
        className={styles.categoryAccordionHeader}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onClick={() =>
          setCategoryOpen((prev) => ({
            ...prev,
            [catKey]: !prev[catKey],
          }))
        }
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setCategoryOpen((prev) => ({
              ...prev,
              [catKey]: !prev[catKey],
            }));
          }
        }}
      >
        <span
          className={styles.categoryDrag}
          aria-hidden="true"
          draggable="true"
          onDragStart={(event: React.DragEvent) => {
            event.stopPropagation();
            handleCatDragStart(event, step.id, catKey);
          }}
          onDragEnd={handleCatDragEnd}
          onClick={(event: React.MouseEvent) => event.stopPropagation()}
        >
          ::
        </span>
        <span className={styles.categoryName}>
          {cat.name || `Category ${catIndex + 1}`}
        </span>
        <div
          className={styles.categoryActions}
          onClick={(event: React.MouseEvent) => event.stopPropagation()}
        >
          <button
            type="button"
            className={styles.categoryIconButton}
            aria-label="Clone"
            title="Clone"
            onClick={() => {
              stepsState.updateStepField(step.id, "StepCategory", [
                ...stepCategories,
                {
                  ...stepCategories[catIndex],
                  id: `cat-${Date.now()}`,
                  name: `${stepCategories[catIndex].name || `Category ${catIndex + 1}`} Copy`,
                  sortOrder: stepCategories.length,
                },
              ]);
              markAsDirty();
            }}
          >
            <s-icon type="duplicate" />
          </button>
          <button
            type="button"
            className={styles.categoryDeleteIconButton}
            aria-label="Delete"
            title="Delete"
            onClick={() => {
              const updated = stepCategories.filter(
                (_category: any, index: number) => index !== catIndex,
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
          className={styles.categoryChevron}
          aria-label={isOpen ? "Collapse category" : "Expand category"}
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            setCategoryOpen((prev) => ({
              ...prev,
              [catKey]: !prev[catKey],
            }));
          }}
        >
          {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>
      {isOpen && (
        <div className={styles.categoryAccordionBody}>
          {shouldRenderCategoryNameField && (
            <div className={styles.categoryFieldGroup}>
              <label
                className={styles.categoryFieldLabel}
                htmlFor={`configure-category-name-${catKey}`}
              >
                Category Name
              </label>
              <div className={styles.catNameRow}>
                <div className={styles.categoryInputStack}>
                  <input
                    id={`configure-category-name-${catKey}`}
                    className={styles.categoryNameInput}
                    type="text"
                    value={cat.name ?? ""}
                    placeholder={`Category ${catIndex + 1}`}
                    aria-label="Category name"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const updated = stepCategories.map(
                        (category: any, index: number) =>
                          index === catIndex
                            ? {
                                ...category,
                                name: event.target.value,
                                title: event.target.value,
                              }
                            : category,
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
                  className={styles.categoryTextButton}
                  onClick={() =>
                    openStepCategoryMultiLanguageModal(step.id, catIndex)
                  }
                >
                  <LanguageIcon />
                  Multi Language
                </button>
              </div>
            </div>
          )}
          <div className={styles.tabRow}>
            <button
              type="button"
              className={catActiveTab === 0 ? styles.tabActive : styles.tab}
              onClick={() =>
                setCategoryActiveTabs((prev) => ({
                  ...prev,
                  [catKey]: 0,
                }))
              }
            >
              Products
              {catProducts.length > 0 && (
                <span className={styles.tabBadge}>{catProducts.length}</span>
              )}
            </button>
            <button
              type="button"
              className={catActiveTab === 1 ? styles.tabActive : styles.tab}
              onClick={() =>
                setCategoryActiveTabs((prev) => ({
                  ...prev,
                  [catKey]: 1,
                }))
              }
            >
              Collections
              {catCollections.length > 0 && (
                <span className={styles.tabBadge}>{catCollections.length}</span>
              )}
            </button>
          </div>
          {catActiveTab === 0 && (
            <SelectedProductsPanel
              products={catProducts}
              draggedProductIndex={draggedProductIndex}
              handlePickProducts={handlePickProducts}
              modalId={selectedProductsModalId}
              modalRef={selectedProductsModalRef}
              removeProduct={removeCategoryProduct}
              reorderProduct={reorderCategoryProducts}
              setDraggedProductIndex={setDraggedProductIndex}
              showPolarisModal={showPolarisModal}
              hidePolarisModal={hidePolarisModal}
              styles={styles}
            />
          )}
          {catActiveTab === 1 && (
            <SelectedCollectionsPanel
              collections={catCollections}
              draggedCollectionIndex={draggedCollectionIndex}
              handlePickCollections={handlePickCollections}
              modalId={selectedCollectionsModalId}
              modalRef={selectedCollectionsModalRef}
              removeCollection={removeCategoryCollection}
              reorderCollection={reorderCategoryCollections}
              setDraggedCollectionIndex={setDraggedCollectionIndex}
              showPolarisModal={showPolarisModal}
              hidePolarisModal={hidePolarisModal}
              styles={styles}
            />
          )}
          {categoryControls}
        </div>
      )}
    </div>
  );
}

function SelectedProductsPanel({
  products,
  draggedProductIndex,
  handlePickProducts,
  hidePolarisModal,
  modalId,
  modalRef,
  removeProduct,
  reorderProduct,
  setDraggedProductIndex,
  showPolarisModal,
  styles,
}: {
  products: any[];
  draggedProductIndex: number | null;
  handlePickProducts: () => Promise<void>;
  hidePolarisModal: (modalRef: React.RefObject<any>) => void;
  modalId: string;
  modalRef: React.RefObject<any>;
  removeProduct: (productId: string) => void;
  reorderProduct: (fromIndex: number, toIndex: number) => void;
  setDraggedProductIndex: (index: number | null) => void;
  showPolarisModal: (modalRef: React.RefObject<any>) => void;
  styles: Record<string, string>;
}) {
  return (
    <div>
      <p className={styles.categoryPickerHelp}>
        Products selected here will be displayed on this step
      </p>
      <div className={styles.productActions}>
        <s-button variant="primary" onClick={handlePickProducts}>
          Add Products
        </s-button>
        {products.length > 0 && (
          <button
            type="button"
            className={styles.categorySelectedItemsChip}
            onClick={() => showPolarisModal(modalRef)}
          >
            {products.length} Selected
          </button>
        )}
      </div>
      <s-modal id={modalId} ref={modalRef} heading="Selected Products">
        {products.length > 0 ? (
          <ul className={styles.selectedItemList}>
            {products.map((product: any, index: number) => (
              <li
                key={product.id ?? index}
                className={styles.categorySelectedItemRow}
                onDragOver={(event: React.DragEvent) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDrop={(event: React.DragEvent) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (draggedProductIndex === null) return;
                  reorderProduct(draggedProductIndex, index);
                  setDraggedProductIndex(null);
                }}
              >
                <button
                  type="button"
                  className={styles.categorySelectedItemDrag}
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
                  ::
                </button>
                <img
                  className={styles.categorySelectedItemImage}
                  src={getProductImageUrl(product)}
                  alt={product.title || product.name || "Product"}
                />
                <span className={styles.categorySelectedItemName}>
                  {product.title || product.name || "Unnamed Product"}
                </span>
                <button
                  type="button"
                  className={styles.categorySelectedItemRemove}
                  aria-label={`Remove ${product.title || "selected product"}`}
                  onClick={() => removeProduct(product.id)}
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
          commandFor={modalId}
          command="--hide"
          onClick={() => hidePolarisModal(modalRef)}
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

function SelectedCollectionsPanel({
  collections,
  draggedCollectionIndex,
  handlePickCollections,
  hidePolarisModal,
  modalId,
  modalRef,
  removeCollection,
  reorderCollection,
  setDraggedCollectionIndex,
  showPolarisModal,
  styles,
}: {
  collections: any[];
  draggedCollectionIndex: number | null;
  handlePickCollections: () => Promise<void>;
  hidePolarisModal: (modalRef: React.RefObject<any>) => void;
  modalId: string;
  modalRef: React.RefObject<any>;
  removeCollection: (collectionId: string) => void;
  reorderCollection: (fromIndex: number, toIndex: number) => void;
  setDraggedCollectionIndex: (index: number | null) => void;
  showPolarisModal: (modalRef: React.RefObject<any>) => void;
  styles: Record<string, string>;
}) {
  return (
    <div>
      <p className={styles.categoryPickerHelp}>
        Collections selected here will be displayed on this step
      </p>
      <div className={styles.productActions}>
        <s-button variant="primary" onClick={handlePickCollections}>
          Add Collections
        </s-button>
        {collections.length > 0 && (
          <button
            type="button"
            className={styles.categorySelectedItemsChip}
            onClick={() => showPolarisModal(modalRef)}
          >
            {collections.length} Selected
          </button>
        )}
      </div>
      <s-modal id={modalId} ref={modalRef} heading="Selected Collections">
        {collections.length > 0 ? (
          <ul className={styles.selectedItemList}>
            {collections.map((collection: any, index: number) => (
              <li
                key={collection.id ?? index}
                className={styles.categorySelectedItemRow}
                onDragOver={(event: React.DragEvent) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDrop={(event: React.DragEvent) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (draggedCollectionIndex === null) return;
                  reorderCollection(draggedCollectionIndex, index);
                  setDraggedCollectionIndex(null);
                }}
              >
                <button
                  type="button"
                  className={styles.categorySelectedItemDrag}
                  aria-label={`Reorder ${
                    collection.title || "selected collection"
                  }`}
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
                  ::
                </button>
                <span className={styles.categorySelectedItemName}>
                  {collection.title || "Unnamed Collection"}
                </span>
                <button
                  type="button"
                  className={styles.categorySelectedItemRemove}
                  aria-label={`Remove ${
                    collection.title || "selected collection"
                  }`}
                  onClick={() => removeCollection(collection.id)}
                >
                  <s-icon type="delete" />
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
          commandFor={modalId}
          command="--hide"
          onClick={() => hidePolarisModal(modalRef)}
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
  );
}

function getProductImageUrl(product: any) {
  return (
    product.imageUrl ||
    product.image?.url ||
    product.images?.[0]?.url ||
    product.images?.[0]?.originalSrc ||
    "/bundle.avif"
  );
}

function LanguageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 3.25h5.25M4.63 2v1.25M6.5 3.25c-.38 1.97-1.75 3.5-3.75 4.25M3.38 4.75c.55 1.1 1.45 1.95 2.72 2.55M7.25 12l.7-1.75m0 0L9.5 6.5l1.55 3.75m-3.1 0h3.1M12 12l-.95-1.75"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 9L7 5L11 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 5L7 9L11 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
