import { BundleType } from "../../../app/constants/bundle";
import {
  designSettingsReducer,
  markDesignSettingsDirty,
  setDesignSettings,
  setSelectedBundleType,
  updateDesignSetting,
} from "../../../app/store/slices/designSettingsSlice";
import type { DesignSettings } from "../../../app/types/state.types";

const productSettings = {
  customCss: "",
  buttonAddToCartText: "Add bundle",
} as DesignSettings;

const fullPageSettings = {
  customCss: "",
  buttonAddToCartText: "Add full page",
} as DesignSettings;

describe("designSettingsSlice", () => {
  it("sets settings by bundle type and clears dirty state", () => {
    const dirty = designSettingsReducer(undefined, markDesignSettingsDirty(true));
    const state = designSettingsReducer(
      dirty,
      setDesignSettings({ bundleType: BundleType.FULL_PAGE, settings: fullPageSettings }),
    );

    expect(state.fullPage).toEqual(fullPageSettings);
    expect(state.productPage).toBeNull();
    expect(state.isDirty).toBe(false);
  });

  it("updates the currently selected settings bucket and marks dirty", () => {
    let state = designSettingsReducer(
      undefined,
      setDesignSettings({ bundleType: BundleType.PRODUCT_PAGE, settings: productSettings }),
    );
    state = designSettingsReducer(state, updateDesignSetting({ key: "buttonAddToCartText", value: "Updated" }));

    expect(state.productPage?.buttonAddToCartText).toBe("Updated");
    expect(state.isDirty).toBe(true);
  });

  it("does not create settings when the selected bucket is empty", () => {
    const state = designSettingsReducer(
      undefined,
      setSelectedBundleType(BundleType.FULL_PAGE),
    );
    const updated = designSettingsReducer(
      state,
      updateDesignSetting({ key: "buttonAddToCartText", value: "Ignored" }),
    );

    expect(updated.fullPage).toBeNull();
    expect(updated.isDirty).toBe(false);
  });
});
