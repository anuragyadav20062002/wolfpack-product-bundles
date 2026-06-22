import {
  addRecentBundle,
  preferencesReducer,
  setPreferences,
} from "../../../app/store/slices/preferencesSlice";

describe("preferencesSlice", () => {
  it("merges preference updates with defaults", () => {
    const state = preferencesReducer(undefined, setPreferences({ theme: "dark" }));

    expect(state).toEqual({
      sidebarCollapsed: false,
      recentBundles: [],
      theme: "dark",
      showTips: true,
    });
  });

  it("dedupes recent bundles, keeps newest first, and caps at ten", () => {
    let state = preferencesReducer(undefined, addRecentBundle("bundle-1"));
    state = preferencesReducer(state, addRecentBundle("bundle-2"));
    state = preferencesReducer(state, addRecentBundle("bundle-1"));

    for (let i = 3; i <= 12; i += 1) {
      state = preferencesReducer(state, addRecentBundle(`bundle-${i}`));
    }

    expect(state.recentBundles).toHaveLength(10);
    expect(state.recentBundles[0]).toBe("bundle-12");
    expect(state.recentBundles).toEqual([
      "bundle-12",
      "bundle-11",
      "bundle-10",
      "bundle-9",
      "bundle-8",
      "bundle-7",
      "bundle-6",
      "bundle-5",
      "bundle-4",
      "bundle-3",
    ]);
  });
});
