import { fullPageProductCardFooterMethods } from "../../../app/assets/widgets/full-page/methods/product-card-footer-methods.js";

describe("FPB product card description", () => {
  it("omits merchant product descriptions from storefront cards", () => {
    const originalDocument = (global as { document?: unknown }).document;
    let renderedHtml = "";

    (global as { document?: unknown }).document = {
      createElement: () => {
        const wrapper = {
          firstChild: null as null | { html: string },
          get innerHTML() {
            return renderedHtml;
          },
          set innerHTML(value: string) {
            renderedHtml = value;
            this.firstChild = { html: value };
          },
        };
        return wrapper;
      },
    };

    try {
      const card = fullPageProductCardFooterMethods.createProductCard.call(
        {
          selectedProducts: [{}],
          selectedBundle: {
            variantSelectorEnabled: false,
            steps: [{}],
          },
          getFullPageDesignPreset: () => "STANDARD",
          buildPaidAddonProductDisplayData: (product: unknown) => product,
          isVariantOutOfStock: () => false,
          getProductCardAddButtonText: () => "Add",
          applyStandardExpandedVariantTitle: () => undefined,
          attachProductCardListeners: () => undefined,
        },
        {
          id: "variant-1",
          title: "Daily Essential",
          description: "Merchant description belongs in the product modal.",
          price: 1299,
          imageUrl: "https://cdn.example.test/product.jpg",
        },
        0,
      ) as { html: string };

      expect(card.html).toContain("Daily Essential");
      expect(card.html).not.toContain("Merchant description belongs in the product modal.");
      expect(card.html).not.toContain("bw-product-card__description");
    } finally {
      (global as { document?: unknown }).document = originalDocument;
    }
  });
});
