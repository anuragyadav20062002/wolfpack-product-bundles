import type React from "react";
import { usePpbConfigureContext } from "./PpbConfigureContext";
import { PpbBundleStatusCard } from "./PpbBundleStatusCard";
import type { IndividualSellingPlanShowFor } from "./usePpbBundleSettingsState";

export function PpbBundleSettingsSection() {
  const {
    activeSection,
    buildDefaultProductEntryFromPicker,
    bundleBannerDesktopUrl,
    bundleBannerMobileUrl,
    bundleLevelCss,
    bundleLevelCssExpanded,
    defaultProductsData,
    DiscountMethod,
    FilePicker,
    INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE,
    individualSellingPlanEnabled,
    individualSellingPlanShowFor,
    markAsDirty,
    maxQtyPerProduct,
    pricingState,
    PRODUCT_PAGE_EDIT_DEFAULTS_HREF,
    productPageBundleStyles,
    quantityValidationEnabled,
    QuestionHelpTooltip,
    setBundleBannerDesktopUrl,
    setBundleBannerMobileUrl,
    setBundleLevelCss,
    setBundleLevelCssExpanded,
    setDefaultProductsData,
    setIndividualSellingPlanEnabled,
    setIndividualSellingPlanShowFor,
    setMaxQtyPerProduct,
    setQuantityValidationEnabled,
    setTextOverrides,
    setVariantSelectorEnabled,
    shopify,
    textOverrides,
    variantSelectorEnabled,
  } = usePpbConfigureContext();

  return (
    <>
      {activeSection === "bundle_settings" &&
        (() => {
          const selectedDefaultProducts = defaultProductsData.products ?? [];
          const defaultProductsEnabled =
            defaultProductsData.isDefaultProductsEnabled === true;
          const defaultProductCount = selectedDefaultProducts.length;
          const defaultProductSelectionIds = selectedDefaultProducts
            .map(
              (product: any) =>
                product.graphqlId || product.productId || product.id,
            )
            .filter(Boolean)
            .map((id: string) => ({ id }));
          const individualSellingPlanBlocked =
            pricingState.discountType === DiscountMethod.BUY_X_GET_Y;
          const handleDefaultProductPicker = async () => {
            const picked = await (shopify as any).resourcePicker({
              type: "product",
              multiple: true,
              action: "select",
              selectionIds: defaultProductSelectionIds,
            });
            if (!picked) return;
            const defaultProducts = picked
              .map(buildDefaultProductEntryFromPicker)
              .filter(
                (
                  product,
                ): product is NonNullable<
                  ReturnType<typeof buildDefaultProductEntryFromPicker>
                > => Boolean(product),
              );
            setDefaultProductsData((prev) => ({
              isDefaultProductsEnabled: true,
              defaultProductsTitle: prev.defaultProductsTitle ?? "",
              products: defaultProducts,
            }));
            markAsDirty();
          };
          return (
            <div data-tour-target="ppb-bundle-status">
              <s-stack direction="block" gap="base">
                <s-section>
                  <s-stack direction="block" gap="small">
                    <div className={productPageBundleStyles.settingTitleRow}>
                      <h3 className={productPageBundleStyles.settingTitle}>
                        Pre Selected Product
                      </h3>
                      <span
                        className={productPageBundleStyles.settingInlineSwitch}
                      >
                        <s-switch
                          accessibilityLabel="Enable pre selected product"
                          checked={defaultProductsEnabled || undefined}
                          onChange={(e) => {
                            const checked = (e.target as HTMLInputElement)
                              .checked;
                            setDefaultProductsData((prev) => ({
                              ...prev,
                              isDefaultProductsEnabled: checked,
                              defaultProductsTitle:
                                prev.defaultProductsTitle ?? "",
                              products: prev.products ?? [],
                            }));
                            markAsDirty();
                          }}
                        />
                      </span>
                    </div>
                    <s-banner tone="info">
                      Tip: Discounts are based on all items in your cart.
                      Don&apos;t forget to include the Pre Selected
                      Product&apos;s quantity or amount when setting up
                      discounts.
                    </s-banner>
                    <s-text-field
                      label="Default products title"
                      value={defaultProductsData.defaultProductsTitle ?? ""}
                      onInput={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        setDefaultProductsData((prev) => ({
                          ...prev,
                          defaultProductsTitle: value,
                        }));
                        markAsDirty();
                      }}
                      autocomplete="off"
                    />
                    <div
                      className={
                        productPageBundleStyles.defaultProductsPickerGroup
                      }
                    >
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                        Choose default products
                      </p>
                      <div
                        className={
                          productPageBundleStyles.defaultProductsPickerActions
                        }
                      >
                        <s-button
                          variant={
                            defaultProductsEnabled ? "primary" : "secondary"
                          }
                          disabled={!defaultProductsEnabled || undefined}
                          onClick={handleDefaultProductPicker}
                        >
                          Browse Products
                        </s-button>
                        {defaultProductCount > 0 && (
                          <s-badge tone="success">
                            {defaultProductCount} selected
                          </s-badge>
                        )}
                      </div>
                    </div>
                  </s-stack>
                </s-section>
                <s-section>
                  <s-stack direction="block" gap="small">
                    <div className={productPageBundleStyles.settingTitleRow}>
                      <h3 className={productPageBundleStyles.settingTitle}>
                        Enable Quantity Validation
                      </h3>
                      <span
                        className={productPageBundleStyles.settingInlineSwitch}
                      >
                        <s-switch
                          accessibilityLabel="Enable quantity validation"
                          checked={quantityValidationEnabled || undefined}
                          onChange={(e) => {
                            setQuantityValidationEnabled(
                              (e.target as HTMLInputElement).checked,
                            );
                            markAsDirty();
                          }}
                        />
                      </span>
                    </div>
                    <s-number-field
                      label="Maximum allowed quantity per product"
                      min={1}
                      value={maxQtyPerProduct || "1"}
                      disabled={!quantityValidationEnabled}
                      onInput={(e) => {
                        setMaxQtyPerProduct(
                          (e.target as HTMLInputElement).value,
                        );
                        markAsDirty();
                      }}
                      autocomplete="off"
                    />
                    <s-banner tone="info">
                      Bundles with 3+ products see 24% higher conversion rates
                      when search filters are enabled.
                    </s-banner>
                    {individualSellingPlanBlocked && (
                      <s-banner tone="warning">
                        {INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE}
                      </s-banner>
                    )}
                    <div className={productPageBundleStyles.settingTitleRow}>
                      <h3
                        className={`${productPageBundleStyles.settingTitle} ${individualSellingPlanBlocked ? productPageBundleStyles.settingTitleMuted : ""}`}
                      >
                        Pre-order &amp; Subscription Integration
                      </h3>
                      <span
                        className={productPageBundleStyles.settingInlineSwitch}
                      >
                        <s-switch
                          accessibilityLabel="Enable pre-order and subscription integration"
                          checked={
                            (!individualSellingPlanBlocked &&
                              individualSellingPlanEnabled) ||
                            undefined
                          }
                          disabled={individualSellingPlanBlocked || undefined}
                          onChange={(e) => {
                            setIndividualSellingPlanEnabled(
                              (e.target as HTMLInputElement).checked,
                            );
                            markAsDirty();
                          }}
                        />
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#8c9196" }}>
                      Let customers select a unique selling plan (subscription,
                      pre-order, etc.) for each product in the bundle.
                    </p>
                    {!individualSellingPlanBlocked &&
                      individualSellingPlanEnabled && (
                        <s-stack direction="block" gap="small-200">
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#202223",
                            }}
                          >
                            Apply to products
                          </p>
                          {(
                            [
                              {
                                value: "ALL_PRODUCTS",
                                label: "Show for all products",
                                description:
                                  "Display selling plan options on every product in the bundle.",
                              },
                              {
                                value: "OOS_PRODUCTS",
                                label: "Show only for out of stock products",
                                description:
                                  "Display selling plan options only when a product is out of stock (e.g. for pre-orders).",
                              },
                            ] as {
                              value: IndividualSellingPlanShowFor;
                              label: string;
                              description: string;
                            }[]
                          ).map(({ value, label, description }) => (
                            <label
                              key={value}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 8,
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="radio"
                                name="individualSellingPlanShowFor"
                                value={value}
                                checked={individualSellingPlanShowFor === value}
                                onChange={() => {
                                  setIndividualSellingPlanShowFor(value);
                                  markAsDirty();
                                }}
                                style={{ marginTop: 3, flexShrink: 0 }}
                              />
                              <span
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "#202223",
                                  }}
                                >
                                  {label}
                                </span>
                                <span
                                  style={{ fontSize: 12, color: "#6d7175" }}
                                >
                                  {description}
                                </span>
                              </span>
                            </label>
                          ))}
                        </s-stack>
                      )}
                    <div className={productPageBundleStyles.settingTitleRow}>
                      <div>
                        <h3 className={productPageBundleStyles.settingTitle}>
                          Variant Selector
                          <QuestionHelpTooltip tooltipKey="variantSelector" />
                        </h3>
                        <p
                          style={{ margin: 0, fontSize: 13, color: "#6d7175" }}
                        >
                          Enable variant selection within the product cards
                          instead of the quick look
                        </p>
                      </div>
                      <span
                        className={productPageBundleStyles.settingInlineSwitch}
                      >
                        <s-switch
                          accessibilityLabel="Variant selector"
                          checked={variantSelectorEnabled || undefined}
                          onChange={(e) => {
                            setVariantSelectorEnabled(
                              (e.target as HTMLInputElement).checked,
                            );
                            markAsDirty();
                          }}
                        />
                      </span>
                    </div>
                  </s-stack>
                </s-section>
                <s-section>
                  <s-stack direction="block" gap="small">
                    <s-stack direction="inline" alignItems="center" gap="small">
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 600,
                          flex: 1,
                        }}
                      >
                        Cart line item discount display
                      </h3>
                      <QuestionHelpTooltip tooltipKey="cartLineItemDiscountDisplay" />
                      <button
                        type="button"
                        onClick={() => {
                          const authSearch = window.location.search.replace(
                            /^\?/,
                            "",
                          );
                          const targetHref = authSearch
                            ? `${PRODUCT_PAGE_EDIT_DEFAULTS_HREF}&${authSearch}`
                            : PRODUCT_PAGE_EDIT_DEFAULTS_HREF;
                          window.location.assign(targetHref);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          minHeight: 32,
                          padding: "0 12px",
                          borderRadius: 8,
                          border: "1px solid #c9cccf",
                          color: "#202223",
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                          background: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        Edit Defaults
                      </button>
                    </s-stack>
                    <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                      Shows how much the customer is saving on the bundle in
                      cart
                    </p>
                    {[
                      {
                        value: "defaults",
                        label: "Use app defaults",
                        description:
                          "Uses the discount format and label configured in your app settings.",
                      },
                      {
                        value: "custom",
                        label: "Customize for this bundle",
                        description:
                          "Set a different discount format or label for this bundle only.",
                      },
                    ].map(({ value, label, description }) => (
                      <label
                        key={value}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="cartDiscountDisplay"
                          value={value}
                          checked={
                            (textOverrides.cartDiscountDisplay ??
                              "defaults") === value
                          }
                          onChange={() => {
                            setTextOverrides((prev) => ({
                              ...prev,
                              cartDiscountDisplay: value,
                            }));
                            markAsDirty();
                          }}
                          style={{ marginTop: 3 }}
                        />
                        <span>
                          <span style={{ display: "block", fontSize: 14 }}>
                            {label}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: 13,
                              color: "#6d7175",
                            }}
                          >
                            {description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </s-stack>
                </s-section>
                <s-section>
                  <s-stack direction="block" gap="small">
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                      Bundle Banner
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                      Upload banner images for desktop and mobile views that
                      will be displayed at the top of your bundle page.
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          Banner Image: Desktop
                        </p>
                        <FilePicker
                          value={bundleBannerDesktopUrl || null}
                          onChange={(url) => {
                            setBundleBannerDesktopUrl(url ?? "");
                            markAsDirty();
                          }}
                        />
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: 12,
                            color: "#6d7175",
                          }}
                        >
                          Recommended Size:
                          <span style={{ color: "#202223" }}>1900x230</span>
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          Banner Image: Mobile
                        </p>
                        <FilePicker
                          value={bundleBannerMobileUrl || null}
                          onChange={(url) => {
                            setBundleBannerMobileUrl(url ?? "");
                            markAsDirty();
                          }}
                        />
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: 12,
                            color: "#6d7175",
                          }}
                        >
                          Recommended Size:
                          <span style={{ color: "#202223" }}>1100x500</span>
                        </p>
                      </div>
                    </div>
                  </s-stack>
                </s-section>
                <s-section>
                  <s-stack direction="block" gap="small">
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                      onClick={() => setBundleLevelCssExpanded((prev) => !prev)}
                    >
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                        Bundle Level CSS
                      </h3>
                      <span
                        style={{
                          fontSize: 18,
                          color: "#6d7175",
                          display: "inline-block",
                          transform: bundleLevelCssExpanded
                            ? "rotate(180deg)"
                            : "none",
                          transition: "transform 0.2s",
                        }}
                      >
                        ▾
                      </span>
                    </button>
                    {bundleLevelCssExpanded && (
                      <textarea
                        value={bundleLevelCss}
                        placeholder="/* Add custom CSS for this bundle */"
                        rows={6}
                        style={{
                          width: "100%",
                          fontFamily: "monospace",
                          fontSize: 13,
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid #c9cccf",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                        onInput={(e) => {
                          setBundleLevelCss(
                            (e.target as HTMLTextAreaElement).value,
                          );
                          markAsDirty();
                        }}
                      />
                    )}
                  </s-stack>
                </s-section>
                <PpbBundleStatusCard />
              </s-stack>
            </div>
          );
        })()}
    </>
  );
}
