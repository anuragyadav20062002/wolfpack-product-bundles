import { usePpbConfigureContext } from "./PpbConfigureContext";

type DefaultProductSelection = {
  graphqlId?: string;
  productId?: string;
  id?: string;
};

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

export function PpbDefaultProductsSettings() {
  const {
    buildDefaultProductEntryFromPicker,
    defaultProductsData,
    markAsDirty,
    productPageBundleStyles,
    setDefaultProductsData,
    shopify,
  } = usePpbConfigureContext();

  const selectedDefaultProducts = defaultProductsData.products ?? [];
  const defaultProductsEnabled =
    defaultProductsData.isDefaultProductsEnabled === true;
  const defaultProductCount = selectedDefaultProducts.length;
  const defaultProductSelectionIds = selectedDefaultProducts
    .map(
      (product: DefaultProductSelection) =>
        product.graphqlId || product.productId || product.id,
    )
    .filter(isString)
    .map((id: string) => ({ id }));

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
          product: ReturnType<typeof buildDefaultProductEntryFromPicker>,
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
    <s-section>
      <s-stack direction="block" gap="small">
        <div className={productPageBundleStyles.settingTitleRow}>
          <h3 className={productPageBundleStyles.settingTitle}>
            Pre Selected Product
          </h3>
          <span className={productPageBundleStyles.settingInlineSwitch}>
            <s-switch
              accessibilityLabel="Enable pre selected product"
              checked={defaultProductsEnabled || undefined}
              onChange={(e) => {
                const checked = (e.target as HTMLInputElement).checked;
                setDefaultProductsData((prev) => ({
                  ...prev,
                  isDefaultProductsEnabled: checked,
                  defaultProductsTitle: prev.defaultProductsTitle ?? "",
                  products: prev.products ?? [],
                }));
                markAsDirty();
              }}
            />
          </span>
        </div>
        <s-banner tone="info">
          Tip: Discounts are based on all items in your cart. Don&apos;t forget
          to include the Pre Selected Product&apos;s quantity or amount when
          setting up discounts.
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
        <div className={productPageBundleStyles.defaultProductsPickerGroup}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            Choose default products
          </p>
          <div className={productPageBundleStyles.defaultProductsPickerActions}>
            <s-button
              variant={defaultProductsEnabled ? "primary" : "secondary"}
              disabled={!defaultProductsEnabled || undefined}
              onClick={handleDefaultProductPicker}
            >
              Browse Products
            </s-button>
            {defaultProductCount > 0 && (
              <s-badge tone="success">{defaultProductCount} selected</s-badge>
            )}
          </div>
        </div>
      </s-stack>
    </s-section>
  );
}
