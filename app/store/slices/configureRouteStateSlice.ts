import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ConfigureModalKey = "pageSelection" | "widgetInstall" | "products" | "collections";

export interface ConfigureRouteState {
  isDirty: boolean;
  modals: Record<ConfigureModalKey, boolean>;
  currentModalStepId: string;
  isLoadingPages: boolean;
  availablePages: any[];
  selectedPage: any | null;
  bundleProduct: any | null;
  productStatus: string;
  productTitle: string;
  productImageUrl: string;
  selectedCollections: Record<string, any[]>;
  ruleMessages: Record<string, { discountText: string; successMessage: string }>;
  activeTabIndex: number;
  activeSection: string;
  forceNavigation: boolean;
  showAutoPlacementBanner: boolean;
  dismissedBanners: string[];
}

export const defaultConfigureRouteState: ConfigureRouteState = {
  isDirty: false,
  modals: {
    pageSelection: false,
    widgetInstall: false,
    products: false,
    collections: false,
  },
  currentModalStepId: "",
  isLoadingPages: false,
  availablePages: [],
  selectedPage: null,
  bundleProduct: null,
  productStatus: "ACTIVE",
  productTitle: "",
  productImageUrl: "",
  selectedCollections: {},
  ruleMessages: {},
  activeTabIndex: 0,
  activeSection: "step_setup",
  forceNavigation: false,
  showAutoPlacementBanner: false,
  dismissedBanners: [],
};

function markDirty(state: ConfigureRouteState) {
  state.isDirty = true;
}

export const configureRouteStateSlice = createSlice({
  name: "configureRouteState",
  initialState: defaultConfigureRouteState,
  reducers: {
    initializeConfigureRouteState(
      state,
      action: PayloadAction<Partial<Pick<
        ConfigureRouteState,
        | "bundleProduct"
        | "productStatus"
        | "productTitle"
        | "productImageUrl"
        | "selectedCollections"
        | "ruleMessages"
      >>>,
    ) {
      state.bundleProduct = action.payload.bundleProduct ?? null;
      state.productStatus = action.payload.productStatus ?? "ACTIVE";
      state.productTitle = action.payload.productTitle ?? "";
      state.productImageUrl = action.payload.productImageUrl ?? "";
      state.selectedCollections = action.payload.selectedCollections ?? {};
      state.ruleMessages = action.payload.ruleMessages ?? {};
      state.isDirty = false;
      state.activeTabIndex = 0;
      state.activeSection = "step_setup";
      state.forceNavigation = false;
    },
    markConfigureRouteDirty(state, action: PayloadAction<boolean>) {
      state.isDirty = action.payload;
    },
    openConfigureModal(
      state,
      action: PayloadAction<{ modal: ConfigureModalKey; stepId?: string }>,
    ) {
      state.modals[action.payload.modal] = true;
      if (action.payload.stepId !== undefined) {
        state.currentModalStepId = action.payload.stepId;
      }
    },
    closeConfigureModal(state, action: PayloadAction<ConfigureModalKey>) {
      state.modals[action.payload] = false;
    },
    setCurrentConfigureModalStepId(state, action: PayloadAction<string>) {
      state.currentModalStepId = action.payload;
    },
    setConfigureLoadingPages(state, action: PayloadAction<boolean>) {
      state.isLoadingPages = action.payload;
    },
    setAvailablePages(state, action: PayloadAction<any[]>) {
      state.availablePages = action.payload;
    },
    setConfigureSelectedPage(state, action: PayloadAction<any | null>) {
      state.selectedPage = action.payload;
    },
    setBundleProductDraft(state, action: PayloadAction<any | null>) {
      state.bundleProduct = action.payload;
      markDirty(state);
    },
    setConfigureProductStatus(state, action: PayloadAction<string>) {
      state.productStatus = action.payload;
      markDirty(state);
    },
    setConfigureProductTitle(state, action: PayloadAction<string>) {
      state.productTitle = action.payload;
    },
    setConfigureProductImageUrl(state, action: PayloadAction<string>) {
      state.productImageUrl = action.payload;
    },
    setConfigureSelectedCollections(state, action: PayloadAction<Record<string, any[]>>) {
      state.selectedCollections = action.payload;
      markDirty(state);
    },
    setConfigureRuleMessages(
      state,
      action: PayloadAction<Record<string, { discountText: string; successMessage: string }>>,
    ) {
      state.ruleMessages = action.payload;
      markDirty(state);
    },
    setActiveConfigureTabIndex(state, action: PayloadAction<number>) {
      state.activeTabIndex = action.payload;
    },
    setActiveConfigureSection(state, action: PayloadAction<string>) {
      state.activeSection = action.payload;
    },
    setConfigureForceNavigation(state, action: PayloadAction<boolean>) {
      state.forceNavigation = action.payload;
    },
    setShowAutoPlacementBanner(state, action: PayloadAction<boolean>) {
      state.showAutoPlacementBanner = action.payload;
    },
    setDismissedConfigureBanners(state, action: PayloadAction<string[]>) {
      state.dismissedBanners = action.payload;
    },
  },
});

export const {
  closeConfigureModal,
  initializeConfigureRouteState,
  markConfigureRouteDirty,
  openConfigureModal,
  setActiveConfigureSection,
  setActiveConfigureTabIndex,
  setAvailablePages,
  setBundleProductDraft,
  setConfigureForceNavigation,
  setConfigureLoadingPages,
  setConfigureProductImageUrl,
  setConfigureProductStatus,
  setConfigureProductTitle,
  setConfigureRuleMessages,
  setConfigureSelectedCollections,
  setConfigureSelectedPage,
  setCurrentConfigureModalStepId,
  setDismissedConfigureBanners,
  setShowAutoPlacementBanner,
} = configureRouteStateSlice.actions;

export const configureRouteStateReducer = configureRouteStateSlice.reducer;
