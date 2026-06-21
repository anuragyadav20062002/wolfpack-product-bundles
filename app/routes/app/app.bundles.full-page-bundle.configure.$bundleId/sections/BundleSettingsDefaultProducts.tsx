import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbDefaultProductsSettings({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeTabIndex,
    buildDefaultProductEntryFromPicker,
    bundle,
    defaultProductsData,
    DiscountMethod,
    markAsDirty,
    pricingState,
    setDefaultProductsData,
    shopify,
    stepsState,
  } = flow;
  const settingsStep = stepsState.steps[activeTabIndex] || stepsState.steps[0];
  const individualSellingPlanBlocked =
    pricingState.discountType === DiscountMethod.BUY_X_GET_Y;

  return (
    <>
      {/* Pre Selected Product */}
      <s-section>
        {(() => {
          const defaultProductsEnabled =
            defaultProductsData.isDefaultProductsEnabled === true;
          const selectedDefaultProducts = defaultProductsData.products ?? [];
          const defaultProductCount = selectedDefaultProducts.length;
          const defaultProductSelectionIds = selectedDefaultProducts
            .map(
              (product: any) =>
                product.graphqlId || product.productId || product.id,
            )
            .filter(Boolean)
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
                  p: any,
                ): p is NonNullable<
                  ReturnType<typeof buildDefaultProductEntryFromPicker>
                > => Boolean(p),
              );
            setDefaultProductsData((prev: any) => ({
              isDefaultProductsEnabled: true,
              defaultProductsTitle: prev.defaultProductsTitle ?? "",
              products: defaultProducts,
            }));
            markAsDirty();
          };
          return (
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
                  Pre Selected Product
                </h3>
                <s-switch
                  accessibilityLabel="Enable pre selected product"
                  checked={defaultProductsEnabled || undefined}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    setDefaultProductsData((prev: any) => ({
                      ...prev,
                      isDefaultProductsEnabled: checked,
                      defaultProductsTitle: prev.defaultProductsTitle ?? "",
                      products: prev.products ?? [],
                    }));
                    markAsDirty();
                  }}
                />
              </s-stack>
              <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                Choose products that should be added to bundle by default
              </p>
              <s-banner tone="info">
                Tip: Discounts are based on all items in your cart. Don&apos;t
                forget to include the Pre Selected Product&apos;s quantity or
                amount when setting up discounts.
              </s-banner>
              {!defaultProductsEnabled && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#6d7175",
                  }}
                >
                  These products will be added to user&apos;s box automatically
                  on the first step.
                </p>
              )}
              {defaultProductsEnabled && (
                <>
                  <s-text-field
                    label="Default products title"
                    value={defaultProductsData.defaultProductsTitle ?? ""}
                    onInput={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      setDefaultProductsData((prev: any) => ({
                        ...prev,
                        defaultProductsTitle: value,
                      }));
                      markAsDirty();
                    }}
                    autocomplete="off"
                  />
                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Choose default products
                    </p>
                    <s-stack direction="inline" alignItems="center" gap="small">
                      <s-button
                        variant="primary"
                        onClick={handleDefaultProductPicker}
                      >
                        Browse Products
                      </s-button>
                      {defaultProductCount > 0 && (
                        <s-badge tone="success">
                          {defaultProductCount} selected
                        </s-badge>
                      )}
                    </s-stack>
                  </div>
                </>
              )}
              {!defaultProductsEnabled && (
                <s-button variant="secondary" disabled>
                  Browse Products
                </s-button>
              )}
            </s-stack>
          );
        })()}
      </s-section>
      {/* Enable Quantity Validation + Product Slots + Slot Icon */}
    </>
  );
}
