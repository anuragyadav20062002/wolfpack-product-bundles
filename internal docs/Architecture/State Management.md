---
title: State Management
type: architecture
audited: 2026-06-21
sources: app/store, app/hooks/useAppState.ts, app/components/shared/FilePicker.tsx
---

# State Management

Admin client state uses Redux Toolkit under `app/store/`.

## Boundaries

- Remix loaders/actions remain the primary route data model.
- Redux owns client-only Admin UI state: modal keys, toast list, navigation state, loading flags, preferences, design settings draft state, shared bundle configure draft state, subscription cache, and small app meta state.
- RTK Query is used only for standalone client-side server-state calls that were already direct fetch/fetcher flows:
  - `GET /app/store-files`
  - `POST /app/upload-store-file`
  - `GET /app/upload-store-file?fileId=...`
  - `POST /api/ensure-product-template`
- Shopify App Bridge side effects stay in route code and hooks.
- Storefront widget runtime state stays outside Redux.

## Provider

Authenticated Admin routes are wrapped with `ReduxProvider` in `app/routes/app/app.tsx`.

## Slices

- `uiSlice` — keyed modals, toasts, navigation, global loading.
- `preferencesSlice` — localStorage-backed Admin preferences and recent bundles.
- `designSettingsSlice` — design settings draft buckets by bundle type.
- `bundleConfigureSlice` — shared bundle configure draft fields.
- `subscriptionSlice` — client subscription cache used by existing hooks.
- `metaSlice` — initialized/version metadata for hook compatibility.

## Compatibility Layer

`app/hooks/useAppState.ts` and `app/contexts/AppStateContext.tsx` keep the old hook names and return shapes while dispatching Redux actions. Production code should not import `appState` from `app/services/app.state.service.ts`.

`AppStateService` remains only as legacy code until deleted safely; do not add new imports.
