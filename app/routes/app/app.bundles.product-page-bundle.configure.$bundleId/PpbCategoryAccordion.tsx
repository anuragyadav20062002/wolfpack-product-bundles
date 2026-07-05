import type React from "react";

import { PpbCategoryCollectionsPanel } from "./PpbCategoryCollectionsPanel";
import { PpbCategoryProductsPanel } from "./PpbCategoryProductsPanel";
import { usePpbConfigureContext } from "./PpbConfigureContext";
import { getStepCategories } from "./PpbStepSetupShared";

export function PpbCategoryAccordion({
  step,
  cat,
  catIndex,
}: {
  step: any;
  cat: any;
  catIndex: number;
}) {
  const {
    categoryActiveTabs,
    categoryOpen,
    draggedCatKey,
    dragOverCatKey,
    handleCatDragEnd,
    handleCatDragStart,
    handleCatDrop,
    markAsDirty,
    productPageBundleStyles,
    setCategoryActiveTabs,
    setCategoryOpen,
    setDragOverCatKey,
    stepsState,
  } = usePpbConfigureContext();
  const catKey = `${step.id}__${cat.id ?? catIndex}`;
  const catActiveTab = categoryActiveTabs[catKey] ?? 0;
  const catProducts = (cat.products as any[]) ?? [];
  const catCollections = (cat.collections as any[]) ?? [];
  const isOpen = categoryOpen[catKey] ?? false;

  return (
    <div
      data-cat-key={catKey}
      className={`${productPageBundleStyles.categoryAccordion}${
        dragOverCatKey === catKey
          ? ` ${productPageBundleStyles.categoryDragOver}`
          : ""
      }`}
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
        className={productPageBundleStyles.categoryAccordionHeader}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onClick={() =>
          setCategoryOpen((prev) => ({
            ...prev,
            [catKey]: !prev[catKey],
          }))
        }
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCategoryOpen((prev) => ({
              ...prev,
              [catKey]: !prev[catKey],
            }));
          }
        }}
      >
        <span
          className={productPageBundleStyles.categoryDrag}
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
        <span className={productPageBundleStyles.categoryName}>
          {cat.name || `Category ${catIndex + 1}`}
        </span>
        <div
          className={productPageBundleStyles.categoryActions}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <button
            type="button"
            className={productPageBundleStyles.categoryIconButton}
            aria-label="Clone"
            title="Clone"
            onClick={() => {
              const cats = getStepCategories(step);
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
            className={productPageBundleStyles.categoryDeleteIconButton}
            aria-label="Delete"
            title="Delete"
            onClick={() => {
              const updated = getStepCategories(step).filter(
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
          className={productPageBundleStyles.categoryChevron}
          aria-label={isOpen ? "Collapse category" : "Expand category"}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
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
        <div className={productPageBundleStyles.categoryAccordionBody}>
          <CategoryNameField
            step={step}
            cat={cat}
            catIndex={catIndex}
            catKey={catKey}
          />
          <div className={productPageBundleStyles.tabRow}>
            <button
              className={
                catActiveTab === 0
                  ? productPageBundleStyles.tabActive
                  : productPageBundleStyles.tab
              }
              onClick={() =>
                setCategoryActiveTabs((prev) => ({
                  ...prev,
                  [catKey]: 0,
                }))
              }
            >
              Products
              {catProducts.length > 0 && (
                <span className={productPageBundleStyles.tabBadge}>
                  {catProducts.length}
                </span>
              )}
            </button>
            <button
              className={
                catActiveTab === 1
                  ? productPageBundleStyles.tabActive
                  : productPageBundleStyles.tab
              }
              onClick={() =>
                setCategoryActiveTabs((prev) => ({
                  ...prev,
                  [catKey]: 1,
                }))
              }
            >
              Collections
              {catCollections.length > 0 && (
                <span className={productPageBundleStyles.tabBadge}>
                  {catCollections.length}
                </span>
              )}
            </button>
          </div>
          {catActiveTab === 0 && (
            <PpbCategoryProductsPanel
              step={step}
              catIndex={catIndex}
              catProducts={catProducts}
            />
          )}
          {catActiveTab === 1 && (
            <PpbCategoryCollectionsPanel
              step={step}
              catIndex={catIndex}
              catCollections={catCollections}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CategoryNameField({
  step,
  cat,
  catIndex,
  catKey,
}: {
  step: any;
  cat: any;
  catIndex: number;
  catKey: string;
}) {
  const {
    markAsDirty,
    openStepCategoryMultiLanguageModal,
    productPageBundleStyles,
    stepsState,
  } = usePpbConfigureContext();

  return (
    <div className={productPageBundleStyles.categoryFieldGroup}>
      <label
        className={productPageBundleStyles.categoryFieldLabel}
        htmlFor={`ppb-category-name-${catKey}`}
      >
        Category Name
      </label>
      <div className={productPageBundleStyles.catNameRow}>
        <div className={productPageBundleStyles.categoryInputStack}>
          <input
            id={`ppb-category-name-${catKey}`}
            className={productPageBundleStyles.categoryNameInput}
            type="text"
            value={cat.name ?? ""}
            placeholder={`Category ${catIndex + 1}`}
            aria-label="Category name"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const updated = getStepCategories(step).map(
                (c: any, i: number) =>
                  i === catIndex
                    ? {
                        ...c,
                        name: e.target.value,
                        title: e.target.value,
                      }
                    : c,
              );
              stepsState.updateStepField(step.id, "StepCategory", updated);
              markAsDirty();
            }}
          />
        </div>
        <button
          type="button"
          className={productPageBundleStyles.categoryTextButton}
          onClick={() => openStepCategoryMultiLanguageModal(step.id, catIndex)}
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
  );
}

function ChevronUpIcon() {
  return (
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
  );
}

function ChevronDownIcon() {
  return (
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
  );
}
