# Issue: Theme App Extension Prompt Before Preview

**Issue ID:** feedback-jun26-10
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

When a merchant clicks Preview from any surface (CREATE wizard, FPB configure, PPB configure, dashboard) while the theme app extension is disabled, the preview either silently fails or opens a bare-bones URL that doesn't render the bundle. We need a single, explicit modal that explains the missing prerequisite and deep-links the merchant straight to the Theme Editor.

Commit #2 (wizard) already gates on `appEmbedEnabled` and opens the theme editor URL inline with a toast. This commit replaces the toast pattern with a small modal everywhere, so the guidance is the same regardless of entry point.

## Approach

1. New `app/components/EnablePreviewModal.tsx` — wraps `s-modal` with a heading, a short ordered list of steps, and a primary CTA that opens `themeEditorUrl` in a new tab. Props: `open`, `onClose`, `themeEditorUrl`.
2. Add `useEnablePreviewGate(appEmbedEnabled, themeEditorUrl, onProceed)` hook (`app/hooks/useEnablePreviewGate.ts`) that returns:
   - `requestPreview()` — call instead of `onProceed` directly; opens modal when disabled, else runs `onProceed`.
   - `modalProps` — spread onto `<EnablePreviewModal {...modalProps} />`.
3. Wire the hook into:
   - CREATE wizard (replace inline themeEditorUrl open in `handleWizardPreview`)
   - FPB configure (`handlePreviewBundle` at line 2180+)
   - PPB configure (`handlePreviewBundle` at line 1481+)
   - Dashboard (`handlePreviewBundle` already uses helper — wrap with the gate hook)

## Files Changed

- `app/components/EnablePreviewModal.tsx` (new)
- `app/hooks/useEnablePreviewGate.ts` (new)
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` — gate `handleWizardPreview`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — gate `handlePreviewBundle`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — gate `handlePreviewBundle`
- `app/routes/app/app.dashboard/route.tsx` — gate dashboard preview

## Tests

- `tests/unit/components/enable-preview-modal.test.ts` — JSX contract: renders heading, ordered list, CTA wired to window.open(themeEditorUrl); does not render when themeEditorUrl is null.
- `tests/unit/hooks/use-enable-preview-gate.test.ts` — pure test on the gating logic (when appEmbedEnabled, requestPreview calls onProceed immediately and modal stays closed; when disabled, modal opens and onProceed not called).

## Phases Checklist

- [x] Phase 1: Failing tests for modal + hook
- [x] Phase 2: Implement modal + hook
- [x] Phase 3: Wire into all 4 entry points
- [x] Phase 4: Tests + lint green
- [x] Phase 5: Commit

**Status:** Completed

## Progress Log

### 2026-05-29 — Implementation complete
- New `app/components/EnablePreviewModal.tsx` — custom modal (no Polaris `s-modal` reuse so it works inside cross-origin iframe Admin contexts) with the three-step guidance and a primary CTA opening `themeEditorUrl`.
- New `app/hooks/useEnablePreviewGate.ts` — pure helper `decideEnablePreviewGate({appEmbedEnabled, themeEditorUrl})` returning `proceed | block_with_modal | block_silent`, plus the React hook that wires it to state and exposes `{ requestPreview, modalProps }`.
- Wired into all four preview entry points: CREATE wizard, FPB configure, PPB configure, dashboard. Each calls `enablePreviewGate.requestPreview(() => actualPreviewLogic())` and renders `<EnablePreviewModal {...enablePreviewGate.modalProps} />` near the other modals.
- Dashboard loader now exposes `appEmbedEnabled` (previously only `themeEditorUrl`).
- 14 tests green (8 new for modal + hook; 6 prior wizard contract still green after #2 contract was updated to assert `useEnablePreviewGate` instead of the old inline embed gate).

### 2026-05-29 — Starting implementation
- Created issue file. Modal + hook test first.
