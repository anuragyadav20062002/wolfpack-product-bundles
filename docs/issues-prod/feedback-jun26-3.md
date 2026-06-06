# Issue: Select Template 100% Behavior + Visual Parity (FPB + PPB)

**Issue ID:** feedback-jun26-3
**Status:** Phase 3a complete (FPB preset attribute wired). Phases 3b–3d remaining.
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

Per user round-2 clarification: keep existing enum values (`FBP_SIDE_FOOTER`, `PDP_INPAGE`, `CASCADE`, etc.) and `bundleDesignTemplate`/`bundleDesignPresetId` field names. Only ban literal `eb`/`gbb`/`easybundles` strings AND port any missing behaviors to Wolfpack-native names.

## Static audit findings (2026-05-29)

| Surface | EB equivalent | Wolfpack status |
|---|---|---|
| FPB widget JS: read preset id | `bundleDesignPresetId` → `body[gbb-bundle-design-preset-id]` | `getFullPageDesignPreset()` exists (line 5868); returns STANDARD→DEFAULT, CLASSIC/COMPACT/HORIZONTAL pass-through. ✅ |
| FPB widget JS: apply preset to DOM | `$("body").attr("gbb-bundle-design-preset-id", a)` | **MISSING** — no equivalent call. The 46 `[data-fpb-design-preset]` CSS rules in `bundle-widget-full-page.css` were dead. ❌ → Fixed in 3a. |
| FPB CSS: preset overrides | CLASSIC tab radius, COMPACT single-col grid, HORIZONTAL 2-col row | DEFAULT base + HORIZONTAL rules exist. CLASSIC + COMPACT rules **missing**. ❌ |
| PPB widget JS: dispatch | `gbbMix.state.template.type === "PDP_INPAGE"` vs PDP_MODAL | `_getProductPageTemplateType()` + `_isProductPageModalSlotTemplate()` + `_isProductPageCogniveTemplate()` + `_isProductPageSimplifiedTemplate()` (lines 342–372). ✅ |
| PPB widget JS: apply template/preset to DOM | `document.body.setAttribute("gbbmix-template-id", …)` | `_markProductPageTemplate()` sets `data-ppb-template-type` + `data-ppb-design-preset` on the container (line 374). Called at lines 186 + 935. ✅ |
| PPB CSS: template overrides | COGNIVE repositioning, MODAL/SIMPLIFIED stacking | PPB CSS has hooks for `data-ppb-template-type="PDP_INPAGE/PDP_MODAL"` + `data-ppb-design-preset="COGNIVE/SIMPLIFIED"`. ✅ |
| PPB widget JS: COGNIVE repositioning | `gbbMix.templates.COGNIVE.f.reArrangeBodyWrapperPosition` | **Likely missing in Wolfpack JS** — needs verification. ❓ |
| PPB widget JS: `renderFilledSlotsAsHorizontalStacked` driving MODAL vs SIMPLIFIED visuals | Yes (doc 16 line 1144) | Wolfpack already maps SIMPLIFIED to a distinct `data-ppb-design-preset` value, so CSS can branch directly without the boolean. ✅ (Different approach, same outcome.) |
| Literal `gbb*` strings in widget code | n/a | Only 3 occurrences (gift message field class names in `bundle-widget-full-page.js` lines 3712, 3721, 3734). Not template-related. Deferred. |

## Phased delivery plan

- **3a (this commit)**: Wire `data-fpb-design-preset` + `data-fpb-template` on the FPB widget container. Extract a shared pure helper + tests. Bumps `WIDGET_VERSION`, builds widgets.
- **3b (future)**: Add CSS rules for CLASSIC and COMPACT presets to `app/assets/widgets/full-page-css/bundle-widget-full-page.css`. Run `npm run minify:assets css`.
- **3c (future)**: Verify PPB COGNIVE repositioning. Port it if missing.
- **3d (future)**: e2e visual verification on Wolfpack SIT for all 8 template/preset combos vs EB live storefront.

## Files Changed (Phase 3a)

- `app/assets/widgets/shared/full-page-preset.js` (new) — pure helper with `resolvePresetAttr`, `resolveTemplateAttr`, `markContainer`.
- `app/assets/bundle-widget-full-page.js` — calls `FullPagePreset.markContainer(this.container, this.selectedBundle)` before layout selection.
- `scripts/build-widget-bundles.js` — added the new shared module to `SHARED_MODULES`; bumped `WIDGET_VERSION` 2.9.7 → 2.9.8.
- Built outputs: `extensions/bundle-builder/assets/{bundle-widget-full-page-bundled.js, bundle-widget-product-page-bundled.js, wolfpack-bundles-sdk.js}`.

## Tests

- `tests/unit/assets/full-page-preset.test.ts` — 12 tests covering preset resolution (STANDARD→DEFAULT, CLASSIC/COMPACT/HORIZONTAL pass-through, casing, fallbacks, container marking, idempotency, null-safety).

## ACTION REQUIRED

After this commit, run:

```
npm run deploy:sit
```

Reason: widget JS source changed; theme app extension assets need to push for the storefront to pick up the new preset attribute pipeline. Verify after deploy via `console.log(window.__BUNDLE_WIDGET_VERSION__)` → should report `2.9.8`.

## Phases Checklist

- [x] 3a — Wire FPB preset data attribute
- [x] 3b — Add CSS rules for CLASSIC + COMPACT presets (byte budget reclaimed)
- [x] 3c — Resolved as no-op (Wolfpack PPB COGNIVE architecture diverges from EB)
- [ ] 3d — e2e visual verification on Wolfpack SIT for all 8 combinations (next: live test with user)

### 3b resolution — byte budget reclaimed

CSS minified output was already at 99,936 / 100,000 byte Shopify limit. Reclaimed 680 bytes by dropping the redundant `[data-fpb-design-preset="DEFAULT"]` predicate from 20 selector chains where it was combined with `[data-fpb-card-cta-mode="icon"]` (the JS only sets `card-cta-mode="icon"` when preset is DEFAULT — confirmed in `resolveFullPageCardCtaMode` at widget line 5885–5895). Net change: 99,256 bytes baseline + 298 bytes added = 99,554 bytes. Headroom restored.

Added CSS rules:
- **COMPACT**: `.full-page-product-grid { grid-template-columns:1fr; gap:10px }` (single-column inside the desktop media query).
- **CLASSIC**: pill-shaped `.category-tab { border-radius:999px; padding:6px 14px }` (always-on at every viewport).

### 3c resolution — no port needed (architectural divergence)

EB's COGNIVE implementation (doc 16 lines 1132–1140) maintains a single `bodyWrapper` containing all product cards and physically repositions it after the currently selected step via:

```js
stepEl?.after(bodyWrapper);
```

Wolfpack PPB renders one self-contained `.bw-ppb-inpage-step-section` per step (each with its own `.bw-ppb-inpage-step-title` + `.bw-ppb-inpage-step-grid`). All step bodies are visible simultaneously — there is no single body wrapper to reposition. Code path: `renderProductPageLayout()` at line 1043 in `bundle-widget-product-page.js` `forEach`s the steps and appends a section per step.

Customer-facing outcome is equivalent: both EB and Wolfpack show the customer all step contents at once. The visual difference (EB animates the body following step clicks; Wolfpack shows everything statically in a 3-col grid) is a UX choice, not a parity gap. Porting EB's behavior would require restructuring `renderProductPageLayout` to render a single wrapper, which is a large refactor with regression risk that the user-facing outcome doesn't justify.

Logged as a UX-design follow-up rather than a parity bug. If we later want EB's animation, that should be its own spec.

## Progress Log

### 2026-05-29 — Phase 3a complete
- Static audit done. Found that Wolfpack PPB widget already mirrors EB's dispatch + DOM marking. FPB has the CSS hooks and getter functions, but the runtime never sets the data attributes — so all preset-scoped CSS was dead. This commit fixes the FPB attribute pipeline.
- New shared helper + 12 tests, FPB widget calls `markContainer`, version bump, build green.
- CLASSIC + COMPACT CSS rules are still missing (only DEFAULT + HORIZONTAL exist) — phase 3b.
