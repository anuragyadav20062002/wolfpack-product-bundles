# Test Spec: EnablePreviewModal + useEnablePreviewGate

**Spec ID:** enable-preview-gate  **Issue:** [feedback-jun26-10]  **Created:** 2026-05-29

## Purpose

Centralize the "enable the theme app extension before previewing" guidance so all four preview entry points share the same behavior.

## Test Cases

### `decideEnablePreviewGate` (pure helper backing the hook)

Contract:
```ts
decideEnablePreviewGate({ appEmbedEnabled, themeEditorUrl }): { mode: "proceed" } | { mode: "block_with_modal" } | { mode: "block_silent" }
```

| # | Scenario | Input | Expected |
|---|---|---|---|
| 1 | App embed enabled → proceed | `{ appEmbedEnabled: true, themeEditorUrl: "x" }` | `{ mode: "proceed" }` |
| 2 | App embed enabled even without themeEditorUrl → proceed | `{ appEmbedEnabled: true, themeEditorUrl: null }` | `{ mode: "proceed" }` |
| 3 | App embed disabled + themeEditorUrl present → modal | `{ appEmbedEnabled: false, themeEditorUrl: "x" }` | `{ mode: "block_with_modal" }` |
| 4 | App embed disabled and no themeEditorUrl → block silent | `{ appEmbedEnabled: false, themeEditorUrl: null }` | `{ mode: "block_silent" }` |

### `EnablePreviewModal` behavior

| # | Scenario | Assertion |
|---|---|---|
| 5 | Returns null when closed | `open=false` returns no dialog |
| 6 | Renders translated heading and body copy | visible text uses the translation keys |
| 7 | Primary CTA uses setup callback first | `onSetupVisibility` is called and direct navigation is skipped |
| 8 | Primary CTA opens Theme Editor in a new tab | absent setup callback, the shared Theme Editor new-tab helper is called |

## Acceptance Criteria

- [ ] All 8 cases pass
- [ ] Helper is pure
- [ ] No competitor keyword references in source
