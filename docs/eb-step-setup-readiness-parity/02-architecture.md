# Architecture: EB Step Setup + Readiness Score Parity — FPB & PPB

## Fast-Track Note
> BR context from: feature-pipeline skill invocation audit findings (2026-05-17), covering EB FPB + PPB configure page Chrome DevTools live audit.

---

## Impact Analysis

- **Communities touched:** FPB configure (god node: `BundleWidgetFullPage` — 126 edges), PPB configure (god node: `BundleWidgetProductPage` — 83 edges), `BundleReadinessOverlay` (standalone, no cross-community edges to step nodes)
- **God nodes affected:** `BundleWidgetFullPage`, `BundleWidgetProductPage`
- **Blast radius:**
  - FPB: any change to `route.tsx` touches all 126 downstream dependents (step state, conditions, pricing). Must not break save/load cycle.
  - PPB: loader query change (Phase 2) adds `StepCategory` include — this is additive and safe. Action handler changes affect how step data is persisted — must verify save/submit flow still works end-to-end.
  - `BundleReadinessOverlay`: only 1-line collapsed bar text change; zero blast radius.

---

## Decision

All FPB gaps are UI-only and live entirely in `route.tsx` + `BundleReadinessOverlay.tsx` + `bundle.ts` constants — no data model changes needed. PPB is split into two phases: Phase 1 covers UI restructuring within the existing data model (header, rules, step config); Phase 2 adds the multi-category system using the existing `StepCategory` Prisma model (already schema-ready). This avoids shipping a broken half-feature — Phase 1 is self-contained and shippable; Phase 2 is a separate commit/PR.

---

## Data Model

No new Prisma migrations required. `StepCategory` already exists in `schema.prisma` with `id, stepId, name, sortOrder, products (Json), collections (Json)`. Phase 2 uses it as-is by adding it to the PPB loader include.

```typescript
// Constants change (app/constants/bundle.ts)
// Add "Weight" to STEP_CONDITION_TYPE_OPTIONS — EB has Quantity / Amount / Weight
{ label: "Weight", value: "weight" }
```

---

## Phase 1 — UI/UX Parity (no data model changes)

### Gap inventory

| # | Location | Gap | EB reference |
|---|---|---|---|
| 1 | FPB + PPB | Step chips missing `>` chevron suffix | EB: `[N] Step Name >` |
| 2 | FPB | Step Setup toggle is `s-checkbox` — should be `s-switch` (blue ON/OFF) | EB: blue ON/OFF toggle controls step name visibility |
| 3 | PPB | Step Flow header missing `QuestionHelpTooltip` + "How to setup?" link | EB PPB has both; FPB already has both ✅ |
| 4 | PPB | Step Setup toggle is `s-button duplicate + s-button delete` only — should include `s-switch` | EB PPB has no toggle (PPB has no step name visibility concept), but currently WPB PPB has no toggle at all |
| 5 | PPB | "Conditions" section → "Rules Configuration" (rename + restructure to EB radio style + autoNext) | EB: radio group "No rules" / "Step rules" + Rule #N cards + autoNext checkbox |
| 6 | PPB | No "Step Config" section (image upload + Step Title text field) | EB PPB has Step Config: image + Step Title |
| 7 | Readiness Score | Collapsed bar subtitle shows "N / 6 items complete" instead of EB copy | EB: "Complete all steps to maximise your bundle's success." |
| 8 | Constants | `STEP_CONDITION_TYPE_OPTIONS` missing "Weight" | EB: Quantity / Amount / Weight |

**Deferred:** Settings/gear icon in FPB Step Setup header — unknown behavior in EB, no equivalent WPB feature, not implementing a dead button.

### Files — Phase 1

| File | Action | What changes |
|---|---|---|
| `app/components/bundle-configure/BundleReadinessOverlay.tsx` | modify | Line 174: replace `{doneCount}/{allItems.length} items complete` with `Complete all steps to maximise your bundle's success.` |
| `app/constants/bundle.ts` | modify | Add `{ label: "Weight", value: "weight" }` to `STEP_CONDITION_TYPE_OPTIONS` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | (a) Step chips: add `›` suffix span after step name; (b) Step Setup toggle: replace `s-checkbox` at ~line 2127 with `s-switch` |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | (a) Step Flow header: add `QuestionHelpTooltip` import + render + "How to setup?" link (~line 1661); (b) Step chips: add `›` suffix span (~line 1675); (c) Conditions → Rules Configuration: rename heading + new subtitle + s-choice-list radio group "No rules"/"Step rules" + Rule #N card style + autoNext checkbox; (d) Add "Step Config" card (image upload + Step Title field) after rules section |

---

## Phase 2 — PPB Multi-Category System (data model shift)

### What changes

PPB currently uses `StepProduct` (individual DB rows) for product selection. EB PPB uses a named multi-category system (same as FPB) — each step has one or more named category rows, each with its own Products/Collections tabs.

The `StepCategory` Prisma model is already in the schema. Phase 2 adds it to PPB.

**Breaking change:** Existing `StepProduct` records on PPB steps will no longer surface in the UI. The merchant must re-add products through the new category system. Per CLAUDE.md's No Backwards Compatibility Rule, no shim or migration fallback will be added — show a sync prompt banner after deploy.

### Files — Phase 2

| File | Action | What changes |
|---|---|---|
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Loader: add `StepCategory: true` to Prisma `include` alongside existing `StepProduct: true` |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Action: handle `StepCategory` upsert/delete in the form submit (parallel to how FPB route saves step categories) |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | UI: replace Products/Collections flat tabs with multi-category accordion (same component pattern as FPB, minus "Display variants as individual products" checkbox) |

### Sync prompt banner

After Phase 2 ships, a `<s-banner tone="warning">` should appear in PPB configure for any bundle that has `StepProduct` records but zero `StepCategory` records, prompting the merchant to re-add their products. This is the standard CLAUDE.md sync mechanism.

---

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| No new unit tests required | — | Phase 1 changes are pure JSX/CSS — no new logic, no exported functions. Polaris rendering is explicitly excluded from TDD per CLAUDE.md. |
| Phase 2: manual integration test | UI + DB | After saving a PPB step with categories, verify `StepCategory` rows are created in DB; verify `StepProduct` rows are NOT written for new saves; verify reload shows category data correctly |

**No tests needed:** JSX rendering changes, Polaris component swaps (`s-checkbox` → `s-switch`), CSS/styling changes, route annotation changes.

**Manual verification checklist (before commit):**
- [ ] FPB step chips show `[N] Name ›` format
- [ ] FPB Step Setup toggle renders as ON/OFF switch (not checkbox)
- [ ] PPB Step Flow header shows ⓘ tooltip + "How to setup?" link
- [ ] PPB step chips show `[N] Name ›` format  
- [ ] PPB "Rules Configuration" heading + subtitle correct; radio group shows "No rules" / "Step rules"
- [ ] PPB rule block shows Rule #N heading, Remove link, type/operator/value fields, autoNext checkbox
- [ ] PPB "Step Config" card shows image upload area + Step Title field
- [ ] Readiness Score collapsed bar shows "Complete all steps to maximise your bundle's success."
- [ ] Weight appears in rule type dropdown (FPB + PPB)
- [ ] Saving still works on both FPB and PPB — no regression in step save flow

---

## Implementation Order

```
Commit 1: BundleReadinessOverlay.tsx — collapsed bar subtitle (1 line)
Commit 2: app/constants/bundle.ts — add Weight to condition type options
Commit 3: FPB route — step chips chevron + s-switch toggle
Commit 4: PPB route Phase 1 — header tooltip, chips chevron, rules restructure, step config
Commit 5: PPB route Phase 2 — multi-category loader + action + UI
```
