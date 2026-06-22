import type React from "react";
import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbBundleEmbedSection() {
  const {
    activeSection,
    bundleEmbedAddBrowsedProduct,
    bundleEmbedCollectionsSelectedData,
    bundleEmbedDisplayOn,
    bundleEmbedEnabled,
    bundleEmbedSelectedProducts,
    bundleEmbedSubTitle,
    bundleEmbedTitle,
    getVisibilityResourceId,
    handlePlaceWidget,
    markAsDirty,
    openMultiLanguageModal,
    openVisibilityCollectionPicker,
    openVisibilityProductPicker,
    productPageBundleStyles,
    removeVisibilityCollectionTarget,
    removeVisibilityProductTarget,
    setBundleEmbedAddBrowsedProduct,
    setBundleEmbedDisplayOn,
    setBundleEmbedEnabled,
    setBundleEmbedSubTitle,
    setBundleEmbedTitle,
  } = usePpbConfigureContext();

  return (
    <>
      {activeSection === "bundle_embed" && (
        <div data-tour-target="ppb-bundle-embed">
          <div className={productPageBundleStyles.visibilityPanel}>
            <div className={productPageBundleStyles.visibilityTitleSwitchRow}>
              <div>
                <h3 className={productPageBundleStyles.visibilityPanelTitle}>
                  Embed Bundle Builder on Product Pages
                </h3>
                <p className={productPageBundleStyles.visibilityCardText}>
                  Directly embed the Bundle Builder block on product pages so
                  customers can curate bundles there.
                </p>
              </div>
              <s-switch
                checked={bundleEmbedEnabled || undefined}
                onChange={(e) => {
                  setBundleEmbedEnabled((e.target as HTMLInputElement).checked);
                  markAsDirty();
                }}
              />
            </div>
            <div
              style={{
                opacity: bundleEmbedEnabled ? 1 : 0.4,
                pointerEvents: bundleEmbedEnabled ? undefined : "none",
              }}
            >
              <div className={productPageBundleStyles.visibilitySectionHeader}>
                <span />
                <span title="Multi Language">
                  <s-button
                    variant="tertiary"
                    icon="globe"
                    accessibilityLabel="Multi Language"
                    onClick={() =>
                      openMultiLanguageModal("Bundle Embed", [
                        {
                          key: "embedTitle",
                          label: "Title",
                          fallback: bundleEmbedTitle,
                        },
                        {
                          key: "embedSubTitle",
                          label: "Sub Title",
                          fallback: bundleEmbedSubTitle,
                          multiline: true,
                        },
                      ])
                    }
                  >
                    Multi Language
                  </s-button>
                </span>
              </div>
              <div className={productPageBundleStyles.visibilityFieldStack}>
                <label className={productPageBundleStyles.visibilityFieldLabel}>
                  <span>Title</span>
                  <input
                    className={productPageBundleStyles.visibilityTextInput}
                    value={bundleEmbedTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setBundleEmbedTitle(e.target.value);
                      markAsDirty();
                    }}
                  />
                </label>
                <label className={productPageBundleStyles.visibilityFieldLabel}>
                  <span>Sub Title</span>
                  <input
                    className={productPageBundleStyles.visibilityTextInput}
                    value={bundleEmbedSubTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setBundleEmbedSubTitle(e.target.value);
                      markAsDirty();
                    }}
                  />
                </label>
              </div>
              <div className={productPageBundleStyles.visibilityPanelSection}>
                <h4 className={productPageBundleStyles.visibilitySectionTitle}>
                  Display Bundle on
                </h4>
                <div
                  className={productPageBundleStyles.visibilityTargetOptions}
                >
                  {[
                    { value: "all_products", label: "All products in bundle" },
                    { value: "specific_products", label: "Specific products" },
                    {
                      value: "specific_collections",
                      label: "Specific collections",
                    },
                  ].map(({ value, label }) => (
                    <label
                      key={value}
                      className={productPageBundleStyles.visibilityRadioLabel}
                    >
                      <input
                        type="radio"
                        name="embedDisplayOn"
                        value={value}
                        checked={bundleEmbedDisplayOn === value}
                        onChange={() => {
                          setBundleEmbedDisplayOn(value);
                          markAsDirty();
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                {bundleEmbedDisplayOn === "specific_products" && (
                  <div
                    className={productPageBundleStyles.visibilityTargetPicker}
                  >
                    <button
                      type="button"
                      className={
                        productPageBundleStyles.visibilitySecondaryAction
                      }
                      onClick={() => openVisibilityProductPicker("embed")}
                    >
                      Select products
                    </button>
                    <div
                      className={
                        productPageBundleStyles.visibilitySelectionList
                      }
                    >
                      {bundleEmbedSelectedProducts.map(
                        (product: any, index) => (
                          <div
                            key={getVisibilityResourceId(product) ?? index}
                            className={
                              productPageBundleStyles.visibilitySelectionItem
                            }
                          >
                            <span>{product.title ?? "Untitled product"}</span>
                            <button
                              type="button"
                              onClick={() =>
                                removeVisibilityProductTarget("embed", index)
                              }
                            >
                              Remove
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
                {bundleEmbedDisplayOn === "specific_collections" && (
                  <div
                    className={productPageBundleStyles.visibilityTargetPicker}
                  >
                    <button
                      type="button"
                      className={
                        productPageBundleStyles.visibilitySecondaryAction
                      }
                      onClick={() => openVisibilityCollectionPicker("embed")}
                    >
                      Select collections
                    </button>
                    <div
                      className={
                        productPageBundleStyles.visibilitySelectionList
                      }
                    >
                      {bundleEmbedCollectionsSelectedData.map(
                        (collection: any, index) => (
                          <div
                            key={getVisibilityResourceId(collection) ?? index}
                            className={
                              productPageBundleStyles.visibilitySelectionItem
                            }
                          >
                            <span>
                              {collection.title ?? "Untitled collection"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removeVisibilityCollectionTarget("embed", index)
                              }
                            >
                              Remove
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
              <label
                className={productPageBundleStyles.visibilityCheckboxLabel}
              >
                <input
                  type="checkbox"
                  checked={bundleEmbedAddBrowsedProduct}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setBundleEmbedAddBrowsedProduct(e.target.checked);
                    markAsDirty();
                  }}
                />
                <span>Add browsed product to bundle</span>
              </label>
            </div>
          </div>
          <div className={productPageBundleStyles.visibilityPlacementCard}>
            <div>
              <h4 className={productPageBundleStyles.visibilitySectionTitle}>
                Put the Bundle Builder at a custom location
              </h4>
              <p className={productPageBundleStyles.visibilityCardText}>
                By default, the bundle builder is added below the Buy Button.
                You can move it to a custom spot on the product page if you
                prefer.
              </p>
              <p className={productPageBundleStyles.visibilityCardText}>
                Place app block on the theme
              </p>
            </div>
            <button
              type="button"
              className={productPageBundleStyles.visibilityPrimaryAction}
              onClick={handlePlaceWidget}
            >
              Place Block
            </button>
          </div>
        </div>
      )}
    </>
  );
}
