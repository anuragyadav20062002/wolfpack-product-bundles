import { fullPageProductCardFooterMethods } from "../../../app/assets/widgets/full-page/methods/product-card-footer-methods.js";

describe("FPB compare-at price visibility", () => {
  it.each([
    [true, true],
    [false, false],
  ])(
    "honors the persisted storefront flag when it is %s",
    (showProductComparedAtPrice, expectedVisible) => {
      const originalDocument = (global as { document?: unknown }).document;
      let renderedHtml = "";
      (global as { document?: unknown }).document = {
        createElement: () => ({
          firstChild: null as null | { html: string },
          get innerHTML() {
            return renderedHtml;
          },
          set innerHTML(value: string) {
            renderedHtml = value;
            this.firstChild = { html: value };
          },
        }),
      };

      try {
        const card = fullPageProductCardFooterMethods.createProductCard.call(
          {
            selectedProducts: [{}],
            selectedBundle: {
              showProductComparedAtPrice,
              variantSelectorEnabled: false,
              steps: [{}],
            },
            getFullPageDesignPreset: () => "STANDARD",
            buildPaidAddonProductDisplayData: (value: unknown) => value,
            isVariantOutOfStock: () => false,
            getProductCardAddButtonText: () => "Add",
            applyStandardExpandedVariantTitle: () => undefined,
            attachProductCardListeners: () => undefined,
          },
          {
            id: "variant-sale",
            title: "Sale product",
            price: 48900,
            compareAtPrice: 52900,
          },
          0,
        ) as { html: string };

        expect(card.html.includes("bw-product-card__compare-price")).toBe(
          expectedVisible,
        );
      } finally {
        (global as { document?: unknown }).document = originalDocument;
      }
    },
  );
});
