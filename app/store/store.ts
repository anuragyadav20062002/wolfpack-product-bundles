import { configureStore, type Middleware } from "@reduxjs/toolkit";
import type { AppState, UserPreferences } from "../types/state.types";
import { adminApi } from "./api/adminApi";
import { bundleConfigureReducer } from "./slices/bundleConfigureSlice";
import { designSettingsReducer } from "./slices/designSettingsSlice";
import { metaReducer } from "./slices/metaSlice";
import { defaultPreferencesState, preferencesReducer } from "./slices/preferencesSlice";
import { subscriptionReducer } from "./slices/subscriptionSlice";
import { uiReducer } from "./slices/uiSlice";

const PREFERENCES_STORAGE_KEY = "wolfpack_user_preferences";
const RECENT_BUNDLES_STORAGE_KEY = "wolfpack_recent_bundles";

export const rootReducer = {
  designSettings: designSettingsReducer,
  ui: uiReducer,
  bundleConfiguration: bundleConfigureReducer,
  preferences: preferencesReducer,
  subscription: subscriptionReducer,
  meta: metaReducer,
  [adminApi.reducerPath]: adminApi.reducer,
};

function loadStoredPreferences(): UserPreferences | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const preferencesJson = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    const recentBundlesJson = window.localStorage.getItem(RECENT_BUNDLES_STORAGE_KEY);
    const preferences = preferencesJson
      ? { ...defaultPreferencesState, ...JSON.parse(preferencesJson) }
      : { ...defaultPreferencesState };

    if (recentBundlesJson) {
      preferences.recentBundles = JSON.parse(recentBundlesJson);
    }

    return preferences;
  } catch (error) {
    console.warn("Failed to load persisted preferences:", error);
    return undefined;
  }
}

const persistPreferencesMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action);

  if (typeof window === "undefined") return result;
  if (typeof action !== "object" || action === null || !("type" in action)) return result;
  if (!String(action.type).startsWith("preferences/")) return result;

  try {
    const preferences = (storeApi.getState() as RootState).preferences;
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    window.localStorage.setItem(RECENT_BUNDLES_STORAGE_KEY, JSON.stringify(preferences.recentBundles));
  } catch (error) {
    console.warn("Failed to persist preferences:", error);
  }

  return result;
};

export function makeStore(preloadedState?: Partial<AppState>) {
  const storedPreferences = loadStoredPreferences();

  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...preloadedState,
      preferences: preloadedState?.preferences ?? storedPreferences ?? defaultPreferencesState,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(adminApi.middleware, persistPreferencesMiddleware),
  });
}

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
