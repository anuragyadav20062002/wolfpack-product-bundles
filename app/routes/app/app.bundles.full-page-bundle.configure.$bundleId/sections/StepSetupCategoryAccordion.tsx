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
    shopify,
    stepsState,
  } = flow;
  const catKey = `${step.id}__${cat.id ?? catIndex}`;
  const catActiveTab = categoryActiveTabs[catKey] ?? 0;
  const catProducts = (cat.products as any[]) ?? [];
  const catCollections = (cat.collections as any[]) ?? [];
  const isOpen = categoryOpen[catKey] ?? false;

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
                <p className={fullPageBundleStyles.categoryInputHelp}>
                  Will be visible on the storefront
                </p>
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
                  onClick={async () => {
                    const picked = await (shopify as any).resourcePicker({
                      type: "product",
                      multiple: true,
                      selectionIds: catProducts.map((p: any) => ({
                        id: p.id,
                      })),
                    });
                    if (!picked) return;
                    const updated = ((step.StepCategory as any[]) ?? []).map(
                      (c: any, i: number) =>
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
                    stepsState.updateStepField(
                      step.id,
                      "StepCategory",
                      updated,
                    );
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
                <div className={fullPageBundleStyles.categoryProductList}>
                  {catProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className={fullPageBundleStyles.categoryProductRow}
                    >
                      <img
                        className={fullPageBundleStyles.categoryProductImage}
                        src={product.imageUrl || "/bundle.png"}
                        alt={product.title}
                      />
                      <span
                        className={fullPageBundleStyles.categoryProductTitle}
                      >
                        {product.title}
                      </span>
                      <button
                        type="button"
                        className={fullPageBundleStyles.categoryDangerButton}
                        onClick={() => {
                          const updated = (
                            (step.StepCategory as any[]) ?? []
                          ).map((c: any, i: number) =>
                            i === catIndex
                              ? {
                                  ...c,
                                  products: c.products.filter(
                                    (p: any) => p.id !== product.id,
                                  ),
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
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                  onClick={async () => {
                    const picked = await (shopify as any).resourcePicker({
                      type: "collection",
                      multiple: true,
                      selectionIds: catCollections.map((c: any) => ({
                        id: c.id,
                      })),
                    });
                    if (!picked) return;
                    const updated = ((step.StepCategory as any[]) ?? []).map(
                      (c: any, i: number) =>
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
                    stepsState.updateStepField(
                      step.id,
                      "StepCategory",
                      updated,
                    );
                    markAsDirty();
                  }}
                >
                  Add Collections
                </s-button>
                {catCollections.length > 0 && (
                  <s-badge tone="success">
                    {catCollections.length} Selected
                  </s-badge>
                )}
              </div>
              {catCollections.length > 0 && (
                <div className={fullPageBundleStyles.categoryProductList}>
                  {catCollections.map((col: any) => (
                    <div
                      key={col.id}
                      className={fullPageBundleStyles.categoryProductRow}
                    >
                      <img
                        className={fullPageBundleStyles.categoryProductImage}
                        src={col.image?.url || "/bundle.png"}
                        alt={col.title}
                      />
                      <span
                        className={fullPageBundleStyles.categoryProductTitle}
                      >
                        {col.title}
                      </span>
                      <button
                        type="button"
                        className={fullPageBundleStyles.categoryDangerButton}
                        onClick={() => {
                          const updated = (
                            (step.StepCategory as any[]) ?? []
                          ).map((c: any, i: number) =>
                            i === catIndex
                              ? {
                                  ...c,
                                  collections: c.collections.filter(
                                    (col2: any) => col2.id !== col.id,
                                  ),
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
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
