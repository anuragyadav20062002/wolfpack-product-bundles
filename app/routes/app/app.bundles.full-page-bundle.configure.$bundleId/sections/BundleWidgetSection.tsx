import { isMultiLanguageActionDisabled } from "../../../../lib/bundle-config/common-configure-page-model";
import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function BundleWidgetSection({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeSection,
    autoSelectBrowsedProduct,
    fullPageBundleStyles,
    getVisibilityResourceId,
    handlePlaceWidget,
    markAsDirty,
    openMultiLanguageModal,
    openVisibilityCollectionPicker,
    openVisibilityProductPicker,
    removeVisibilityCollectionTarget,
    removeVisibilityProductTarget,
    setAutoSelectBrowsedProduct,
    setTextOverrides,
    setUpsellWidgetButtonText,
    setUpsellWidgetDisplayMode,
    setUpsellWidgetDisplayOn,
    setUpsellWidgetEnabled,
    shopLocales,
    upsellWidgetButtonText,
    upsellWidgetCollectionsSelectedData,
    upsellWidgetDisplayMode,
    upsellWidgetDisplayOn,
    upsellWidgetEnabled,
    upsellWidgetSelectedProducts,
  } = flow;

  return (
    <>
      {activeSection === "bundle_widget" && (
        <div data-tour-target="fpb-bundle-widget">
          <div className={fullPageBundleStyles.visibilityPanel}>
            <div className={fullPageBundleStyles.visibilityTitleSwitchRow}>
              <div>
                <h3 className={fullPageBundleStyles.visibilityPanelTitle}>
                  Product Page Bundle Upsell Widgets
                </h3>
                <p className={fullPageBundleStyles.visibilityCardText}>
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
              className={fullPageBundleStyles.upsellWidgetContent}
              style={{
                opacity: upsellWidgetEnabled ? 1 : 0.4,
                pointerEvents: upsellWidgetEnabled ? undefined : "none",
              }}
            >
              <div className={fullPageBundleStyles.visibilityPreviewFrame}>
                <img
                  className={fullPageBundleStyles.visibilityPreviewFullImage}
                  src={
                    upsellWidgetDisplayMode === "button"
                      ? "/Upsell-Button.avif"
                      : "/Upsell-Block.avif"
                  }
                  alt={
                    upsellWidgetDisplayMode === "button"
                      ? "Upsell Button preview"
                      : "Upsell Block preview"
                  }
                />
                <div className={fullPageBundleStyles.visibilityRadioBar}>
                  <label className={fullPageBundleStyles.visibilityRadioLabel}>
                    <input
                      type="radio"
                      name="fpbUpsellWidgetType"
                      value="block"
                      checked={upsellWidgetDisplayMode !== "button"}
                      onChange={() => {
                        setUpsellWidgetDisplayMode("block");
                        markAsDirty();
                      }}
                    />
                    <span>Offer Upsell Block</span>
                  </label>
                  <label className={fullPageBundleStyles.visibilityRadioLabel}>
                    <input
                      type="radio"
                      name="fpbUpsellWidgetType"
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
              <div className={fullPageBundleStyles.visibilityInfoBanner}>
                Select if you want the upsell block or button to appear on
                product pages.
              </div>
              <div className={fullPageBundleStyles.visibilityPanelSection}>
                <div className={fullPageBundleStyles.visibilitySectionHeader}>
                  <h4 className={fullPageBundleStyles.visibilitySectionTitle}>
                    Widget Settings
                  </h4>
                  <s-button
                    variant="secondary"
                    icon="globe"
                    disabled={
                      isMultiLanguageActionDisabled(shopLocales) || undefined
                    }
                    onClick={() =>
                      openMultiLanguageModal("Bundle Widget", [
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
                <div className={fullPageBundleStyles.visibilityFieldStack}>
                  <label className={fullPageBundleStyles.visibilityFieldLabel}>
                    <span>Widget Button Text</span>
                    <input
                      className={fullPageBundleStyles.visibilityTextInput}
                      value={upsellWidgetButtonText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setUpsellWidgetButtonText(value);
                        setTextOverrides((prev) => ({
                          ...prev,
                          widgetButtonText: value,
                        }));
                        markAsDirty();
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className={fullPageBundleStyles.visibilityPanelSection}>
                <h4 className={fullPageBundleStyles.visibilitySectionTitle}>
                  Display Widget on
                </h4>
                <div className={fullPageBundleStyles.visibilityTargetOptions}>
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
                      className={fullPageBundleStyles.visibilityRadioLabel}
                    >
                      <input
                        type="radio"
                        name="fpbWidgetDisplayOn"
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
                  <div className={fullPageBundleStyles.visibilityTargetPicker}>
                    <button
                      type="button"
                      className={fullPageBundleStyles.visibilitySecondaryAction}
                      onClick={() => openVisibilityProductPicker("widget")}
                    >
                      Select products
                    </button>
                    <div
                      className={fullPageBundleStyles.visibilitySelectionList}
                    >
                      {upsellWidgetSelectedProducts.map(
                        (product: any, index: number) => (
                          <div
                            key={getVisibilityResourceId(product) ?? index}
                            className={
                              fullPageBundleStyles.visibilitySelectionItem
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
                  <div className={fullPageBundleStyles.visibilityTargetPicker}>
                    <button
                      type="button"
                      className={fullPageBundleStyles.visibilitySecondaryAction}
                      onClick={() => openVisibilityCollectionPicker("widget")}
                    >
                      Select collections
                    </button>
                    <div
                      className={fullPageBundleStyles.visibilitySelectionList}
                    >
                      {upsellWidgetCollectionsSelectedData.map(
                        (collection: any, index: number) => (
                          <div
                            key={getVisibilityResourceId(collection) ?? index}
                            className={
                              fullPageBundleStyles.visibilitySelectionItem
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
              <label className={fullPageBundleStyles.visibilityCheckboxLabel}>
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
          <div className={fullPageBundleStyles.visibilityPlacementCard}>
            <div>
              <h4 className={fullPageBundleStyles.visibilitySectionTitle}>
                Embed the Upsell
                {upsellWidgetDisplayMode === "button" ? "Button" : "Block"} at a
                custom location
              </h4>
              <p className={fullPageBundleStyles.visibilityCardText}>
                By default, the upsell
                {upsellWidgetDisplayMode === "button" ? "button" : "block"} is
                added below the Buy Button. You can move it to a custom spot on
                the product page if you prefer.
              </p>
            </div>
            <button
              type="button"
              className={fullPageBundleStyles.visibilityPrimaryAction}
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
