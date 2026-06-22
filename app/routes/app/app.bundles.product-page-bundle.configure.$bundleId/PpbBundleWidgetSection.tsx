import type React from "react";
import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbBundleWidgetSection() {
  const {
    activeSection,
    autoSelectBrowsedProduct,
    FilePicker,
    getVisibilityResourceId,
    handlePlaceWidget,
    markAsDirty,
    openMultiLanguageModal,
    openVisibilityCollectionPicker,
    openVisibilityProductPicker,
    productPageBundleStyles,
    removeVisibilityCollectionTarget,
    removeVisibilityProductTarget,
    setAutoSelectBrowsedProduct,
    setUpsellWidgetButtonText,
    setUpsellWidgetDescription,
    setUpsellWidgetDisplayMode,
    setUpsellWidgetDisplayOn,
    setUpsellWidgetEnabled,
    setUpsellWidgetImageUrl,
    setUpsellWidgetTitle,
    upsellWidgetButtonText,
    upsellWidgetCollectionsSelectedData,
    upsellWidgetDescription,
    upsellWidgetDisplayMode,
    upsellWidgetDisplayOn,
    upsellWidgetEnabled,
    upsellWidgetImageUrl,
    upsellWidgetSelectedProducts,
    upsellWidgetTitle,
  } = usePpbConfigureContext();

  return (
    <>
      {activeSection === "bundle_widget" && (
        <div data-tour-target="ppb-bundle-widget">
          <div className={productPageBundleStyles.visibilityPanel}>
            <div className={productPageBundleStyles.visibilityTitleSwitchRow}>
              <div>
                <h3 className={productPageBundleStyles.visibilityPanelTitle}>
                  Product Page Bundle Upsell Widgets
                </h3>
                <p className={productPageBundleStyles.visibilityCardText}>
                  This will display an upsell block or button on the product
                  pages of your choice.
                </p>
              </div>
              <s-switch
                checked={upsellWidgetEnabled || undefined}
                onChange={(e: any) => {
                  setUpsellWidgetEnabled(e.target.checked);
                  markAsDirty();
                }}
              />
            </div>
            <div
              className={productPageBundleStyles.upsellWidgetContent}
              style={{
                opacity: upsellWidgetEnabled ? 1 : 0.4,
                pointerEvents: upsellWidgetEnabled ? undefined : "none",
              }}
            >
              <div className={productPageBundleStyles.visibilityPreviewFrame}>
                <img
                  className={productPageBundleStyles.visibilityPreviewFullImage}
                  src={
                    upsellWidgetDisplayMode === "button"
                      ? "/Upsell-Button.png"
                      : "/Upsell-Block.png"
                  }
                  alt={
                    upsellWidgetDisplayMode === "button"
                      ? "Upsell Button preview"
                      : "Upsell Block preview"
                  }
                />
                <div className={productPageBundleStyles.visibilityRadioBar}>
                  <label
                    className={productPageBundleStyles.visibilityRadioLabel}
                  >
                    <input
                      type="radio"
                      name="upsellWidgetType"
                      value="block"
                      checked={upsellWidgetDisplayMode !== "button"}
                      onChange={() => {
                        setUpsellWidgetDisplayMode("block");
                        markAsDirty();
                      }}
                    />
                    <span>Offer Upsell Block</span>
                  </label>
                  <label
                    className={productPageBundleStyles.visibilityRadioLabel}
                  >
                    <input
                      type="radio"
                      name="upsellWidgetType"
                      value="button"
                      checked={upsellWidgetDisplayMode === "button"}
                      onChange={() => {
                        setUpsellWidgetDisplayMode("button");
                        markAsDirty();
                      }}
                    />
                    <span>Offer Upsell Button</span>
                  </label>
                </div>
              </div>
              <div className={productPageBundleStyles.visibilityInfoBanner}>
                Select if you want the upsell block or button to appear on
                product pages.
              </div>
              <div className={productPageBundleStyles.visibilityPanelSection}>
                <div
                  className={productPageBundleStyles.visibilitySectionHeader}
                >
                  <h4
                    className={productPageBundleStyles.visibilitySectionTitle}
                  >
                    Widget Settings
                  </h4>
                  <s-button
                    variant="secondary"
                    icon="globe"
                    onClick={() =>
                      openMultiLanguageModal("Bundle Widget", [
                        {
                          key: "widgetTitle",
                          label: "Widget Title",
                          fallback: upsellWidgetTitle,
                        },
                        {
                          key: "widgetDescription",
                          label: "Widget Description",
                          fallback: upsellWidgetDescription,
                          multiline: true,
                        },
                        {
                          key: "widgetButtonText",
                          label: "Widget Button Text",
                          fallback: upsellWidgetButtonText,
                        },
                      ])
                    }
                  >
                    Multi Language
                  </s-button>
                </div>
                <div className={productPageBundleStyles.visibilitySettingsGrid}>
                  <div
                    className={productPageBundleStyles.visibilityImagePicker}
                  >
                    <FilePicker
                      label="Upload Image"
                      value={upsellWidgetImageUrl || null}
                      onChange={(url) => {
                        setUpsellWidgetImageUrl(url ?? "");
                        markAsDirty();
                      }}
                    />
                  </div>
                  <div className={productPageBundleStyles.visibilityFieldStack}>
                    <label
                      className={productPageBundleStyles.visibilityFieldLabel}
                    >
                      <span>Widget Title</span>
                      <input
                        className={productPageBundleStyles.visibilityTextInput}
                        value={upsellWidgetTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setUpsellWidgetTitle(e.target.value);
                          markAsDirty();
                        }}
                      />
                    </label>
                    <label
                      className={productPageBundleStyles.visibilityFieldLabel}
                    >
                      <span>Widget Description</span>
                      <textarea
                        className={productPageBundleStyles.visibilityTextarea}
                        value={upsellWidgetDescription}
                        onChange={(
                          e: React.ChangeEvent<HTMLTextAreaElement>,
                        ) => {
                          setUpsellWidgetDescription(e.target.value);
                          markAsDirty();
                        }}
                      />
                    </label>
                    <label
                      className={productPageBundleStyles.visibilityFieldLabel}
                    >
                      <span>Widget Button Text</span>
                      <input
                        className={productPageBundleStyles.visibilityTextInput}
                        value={upsellWidgetButtonText}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setUpsellWidgetButtonText(e.target.value);
                          markAsDirty();
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className={productPageBundleStyles.visibilityPanelSection}>
                <h4 className={productPageBundleStyles.visibilitySectionTitle}>
                  Display Widget on
                </h4>
                <div
                  className={productPageBundleStyles.visibilityTargetOptions}
                >
                  {[
                    { value: "all", label: "All products in bundle" },
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
                        name="widgetDisplayOn"
                        value={value}
                        checked={upsellWidgetDisplayOn === value}
                        onChange={() => {
                          setUpsellWidgetDisplayOn(value);
                          markAsDirty();
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                {upsellWidgetDisplayOn === "specific_products" && (
                  <div
                    className={productPageBundleStyles.visibilityTargetPicker}
                  >
                    <button
                      type="button"
                      className={
                        productPageBundleStyles.visibilitySecondaryAction
                      }
                      onClick={() => openVisibilityProductPicker("widget")}
                    >
                      Select products
                    </button>
                    <div
                      className={
                        productPageBundleStyles.visibilitySelectionList
                      }
                    >
                      {upsellWidgetSelectedProducts.map(
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
                                removeVisibilityProductTarget("widget", index)
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
                {upsellWidgetDisplayOn === "specific_collections" && (
                  <div
                    className={productPageBundleStyles.visibilityTargetPicker}
                  >
                    <button
                      type="button"
                      className={
                        productPageBundleStyles.visibilitySecondaryAction
                      }
                      onClick={() => openVisibilityCollectionPicker("widget")}
                    >
                      Select collections
                    </button>
                    <div
                      className={
                        productPageBundleStyles.visibilitySelectionList
                      }
                    >
                      {upsellWidgetCollectionsSelectedData.map(
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
                                removeVisibilityCollectionTarget(
                                  "widget",
                                  index,
                                )
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
                  checked={autoSelectBrowsedProduct}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setAutoSelectBrowsedProduct(e.target.checked);
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
                Embed the Upsell
                {upsellWidgetDisplayMode === "button" ? "Button" : "Block"} at a
                custom location
              </h4>
              <p className={productPageBundleStyles.visibilityCardText}>
                By default, the upsell
                {upsellWidgetDisplayMode === "button" ? "button" : "block"} is
                added below the Buy Button. You can move it to a custom spot on
                the product page if you prefer.
              </p>
            </div>
            <button
              type="button"
              className={productPageBundleStyles.visibilityPrimaryAction}
              onClick={handlePlaceWidget}
            >
              Embed Upsell
              {upsellWidgetDisplayMode === "button" ? "Button" : "Block"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
