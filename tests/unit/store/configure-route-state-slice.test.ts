import {
  closeConfigureModal,
  configureRouteStateReducer,
  initializeConfigureRouteState,
  markConfigureRouteDirty,
  openConfigureModal,
  setActiveConfigureSection,
  setActiveConfigureTabIndex,
  setAvailablePages,
  setBundleProductDraft,
  setConfigureForceNavigation,
  setConfigureProductImageUrl,
  setConfigureProductStatus,
  setConfigureProductTitle,
  setConfigureRuleMessages,
  setConfigureSelectedCollections,
  setConfigureSelectedPage,
  setDismissedConfigureBanners,
  setShowAutoPlacementBanner,
} from "../../../app/store/slices/configureRouteStateSlice";

describe("configureRouteStateSlice", () => {
  it("initializes shared configure state from loader-shaped data", () => {
    const state = configureRouteStateReducer(
      undefined,
      initializeConfigureRouteState({
        bundleProduct: { id: "product-1", title: "Bundle", status: "ACTIVE" },
        productStatus: "ACTIVE",
        productTitle: "Bundle",
        productImageUrl: "https://cdn.example/image.png",
        selectedCollections: { "step-1": [{ id: "collection-1" }] },
        ruleMessages: { "rule-1": { discountText: "Save", successMessage: "Saved" } },
      }),
    );

    expect(state.bundleProduct).toEqual({ id: "product-1", title: "Bundle", status: "ACTIVE" });
    expect(state.productStatus).toBe("ACTIVE");
    expect(state.productTitle).toBe("Bundle");
    expect(state.productImageUrl).toBe("https://cdn.example/image.png");
    expect(state.selectedCollections).toEqual({ "step-1": [{ id: "collection-1" }] });
    expect(state.ruleMessages).toEqual({ "rule-1": { discountText: "Save", successMessage: "Saved" } });
    expect(state.activeSection).toBe("step_setup");
    expect(state.activeTabIndex).toBe(0);
    expect(state.isDirty).toBe(false);
  });

  it("tracks configure modal state and current modal step", () => {
    let state = configureRouteStateReducer(undefined, openConfigureModal({ modal: "products", stepId: "step-1" }));
    expect(state.modals.products).toBe(true);
    expect(state.currentModalStepId).toBe("step-1");

    state = configureRouteStateReducer(state, openConfigureModal({ modal: "collections", stepId: "step-2" }));
    expect(state.modals.collections).toBe(true);
    expect(state.currentModalStepId).toBe("step-2");

    state = configureRouteStateReducer(state, openConfigureModal({ modal: "pageSelection" }));
    state = configureRouteStateReducer(state, openConfigureModal({ modal: "widgetInstall" }));
    expect(state.modals.pageSelection).toBe(true);
    expect(state.modals.widgetInstall).toBe(true);

    state = configureRouteStateReducer(state, closeConfigureModal("products"));
    expect(state.modals.products).toBe(false);
  });

  it("stores page data and product draft updates", () => {
    let state = configureRouteStateReducer(undefined, setAvailablePages([{ handle: "default" }]));
    state = configureRouteStateReducer(state, setConfigureSelectedPage({ handle: "default" }));
    state = configureRouteStateReducer(state, setBundleProductDraft({ id: "product-2", title: "New" }));
    state = configureRouteStateReducer(state, setConfigureProductStatus("DRAFT"));
    state = configureRouteStateReducer(state, setConfigureProductTitle("New title"));
    state = configureRouteStateReducer(state, setConfigureProductImageUrl("image.png"));

    expect(state.availablePages).toEqual([{ handle: "default" }]);
    expect(state.selectedPage).toEqual({ handle: "default" });
    expect(state.bundleProduct).toEqual({ id: "product-2", title: "New" });
    expect(state.productStatus).toBe("DRAFT");
    expect(state.productTitle).toBe("New title");
    expect(state.productImageUrl).toBe("image.png");
    expect(state.isDirty).toBe(true);
  });

  it("replaces selected collections and rule messages while marking dirty", () => {
    let state = configureRouteStateReducer(
      undefined,
      setConfigureSelectedCollections({ "step-1": [{ id: "collection-1" }] }),
    );
    state = configureRouteStateReducer(
      state,
      setConfigureRuleMessages({ "rule-1": { discountText: "Save", successMessage: "Saved" } }),
    );

    expect(state.selectedCollections).toEqual({ "step-1": [{ id: "collection-1" }] });
    expect(state.ruleMessages).toEqual({ "rule-1": { discountText: "Save", successMessage: "Saved" } });
    expect(state.isDirty).toBe(true);
  });

  it("tracks navigation, banner, and explicit dirty state", () => {
    let state = configureRouteStateReducer(undefined, setActiveConfigureTabIndex(2));
    state = configureRouteStateReducer(state, setActiveConfigureSection("bundle_visibility"));
    state = configureRouteStateReducer(state, setConfigureForceNavigation(true));
    state = configureRouteStateReducer(state, setShowAutoPlacementBanner(true));
    state = configureRouteStateReducer(state, setDismissedConfigureBanners(["embed"]));
    state = configureRouteStateReducer(state, markConfigureRouteDirty(false));

    expect(state.activeTabIndex).toBe(2);
    expect(state.activeSection).toBe("bundle_visibility");
    expect(state.forceNavigation).toBe(true);
    expect(state.showAutoPlacementBanner).toBe(true);
    expect(state.dismissedBanners).toEqual(["embed"]);
    expect(state.isDirty).toBe(false);
  });
});
