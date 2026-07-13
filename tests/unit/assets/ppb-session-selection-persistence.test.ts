const {
  ProductPageSelectionPersistenceMethods,
  createProductPageSessionSelectionPayload,
  getProductPageSelectionStorageKey,
  normalizeProductPageSessionSelections,
} = require("../../../app/assets/widgets/product-page/methods/selection-persistence-methods.js");

describe("ProductPageSessionSelectionPersistence", () => {
  it("builds a stable offer-scoped storage key", () => {
    expect(
      getProductPageSelectionStorageKey({ offerId: "MIX-156854", id: "db-id" })
    ).toBe("wpbPpb-cart-MIX-156854");
    expect(getProductPageSelectionStorageKey({ id: "db-id" })).toBe(
      "wpbPpb-cart-db-id"
    );
  });

  it("normalizes positive integer quantities within the current step count", () => {
    expect(
      normalizeProductPageSessionSelections(
        {
          v: 1,
          selectedProducts: [
            { "variant-1": 2, "variant-2": 0, "variant-3": -1 },
            { "variant-4": 1.9 },
            { "variant-extra-step": 1 },
          ],
        },
        2
      )
    ).toEqual([{ "variant-1": 2 }, { "variant-4": 1 }]);
  });

  it("rejects malformed or unsupported payloads", () => {
    expect(normalizeProductPageSessionSelections(null, 2)).toBeNull();
    expect(
      normalizeProductPageSessionSelections({ v: 2, selectedProducts: [] }, 2)
    ).toBeNull();
    expect(
      normalizeProductPageSessionSelections(
        { v: 1, selectedProducts: "bad" },
        2
      )
    ).toBeNull();
  });

  it("creates a versioned payload without retaining invalid quantities", () => {
    expect(
      createProductPageSessionSelectionPayload([
        { one: 1, zero: 0 },
        { two: 2 },
      ])
    ).toEqual({
      v: 1,
      selectedProducts: [{ one: 1 }, { two: 2 }],
    });
  });

  it("restores customer selections without removing configured defaults", () => {
    const storage = {
      getItem: jest.fn(() =>
        JSON.stringify({
          v: 1,
          selectedProducts: [{ customer: 2 }, {}],
        })
      ),
      setItem: jest.fn(),
    };
    const context = {
      selectedBundle: { offerId: "MIX-1", steps: [{}, {}] },
      selectedProducts: [{ required: 1 }, {}],
      _getProductPageSelectionStorage: () => storage,
      _getProductPageSelectionStorageKey:
        ProductPageSelectionPersistenceMethods._getProductPageSelectionStorageKey,
    };

    const restored =
      ProductPageSelectionPersistenceMethods._restoreSessionSelections.call(
        context
      );

    expect(restored).toBe(true);
    expect(context.selectedProducts).toEqual([
      { required: 1, customer: 2 },
      {},
    ]);
    expect(context._selectionPersistenceReady).toBe(true);
  });

  it("keeps initial selections when stored JSON is malformed", () => {
    const context = {
      selectedBundle: { offerId: "MIX-1", steps: [{}] },
      selectedProducts: [{ required: 1 }],
      _getProductPageSelectionStorage: () => ({ getItem: () => "{bad json" }),
      _getProductPageSelectionStorageKey:
        ProductPageSelectionPersistenceMethods._getProductPageSelectionStorageKey,
    };

    expect(
      ProductPageSelectionPersistenceMethods._restoreSessionSelections.call(
        context
      )
    ).toBe(false);
    expect(context.selectedProducts).toEqual([{ required: 1 }]);
    expect(context._selectionPersistenceReady).toBe(true);
  });

  it("persists current selections after initialization", () => {
    const storage = { setItem: jest.fn() };
    const context = {
      selectedBundle: { offerId: "MIX-1" },
      selectedProducts: [{ one: 1 }],
      _selectionPersistenceReady: true,
      _getProductPageSelectionStorage: () => storage,
      _getProductPageSelectionStorageKey:
        ProductPageSelectionPersistenceMethods._getProductPageSelectionStorageKey,
    };

    expect(
      ProductPageSelectionPersistenceMethods._persistSessionSelections.call(
        context
      )
    ).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      "wpbPpb-cart-MIX-1",
      JSON.stringify({ v: 1, selectedProducts: [{ one: 1 }] })
    );
  });

  it("preloads only steps containing restored selections", async () => {
    const context = {
      selectedProducts: [{ one: 1 }, {}, { three: 1 }],
      loadStepProducts: jest.fn().mockResolvedValue(undefined),
    };

    await ProductPageSelectionPersistenceMethods._preloadRestoredSelectionProducts.call(
      context
    );

    expect(context.loadStepProducts.mock.calls).toEqual([[0], [2]]);
  });
});
