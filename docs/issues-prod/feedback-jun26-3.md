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

- [x] 3a — Wire FPB preset data attribute (this commit)
- [ ] 3b — Add CSS rules for CLASSIC + COMPACT presets **[BLOCKED: byte budget]**
- [ ] 3c — Verify + port any missing PPB template behaviors (COGNIVE repositioning)
- [ ] 3d — e2e visual verification on Wolfpack SIT for all 8 combinations

### 3b blocker — minified CSS byte budget

`extensions/bundle-builder/assets/bundle-widget-full-page.css` after minification is **99,936 bytes** — already within 64 bytes of Shopify's 100,000-byte app-block asset limit. Even a minimal CLASSIC + COMPACT addition (~300 bytes) pushes the file over the limit, and the minifier script exits non-zero. Need to trim existing CSS elsewhere as a prerequisite. Out of scope for this session — open as a follow-up commit titled e.g. `[feedback-jun26-3b] chore: reclaim FPB CSS byte budget for preset overrides`.

## Progress Log

### 2026-05-29 — Phase 3a complete
- Static audit done. Found that Wolfpack PPB widget already mirrors EB's dispatch + DOM marking. FPB has the CSS hooks and getter functions, but the runtime never sets the data attributes — so all preset-scoped CSS was dead. This commit fixes the FPB attribute pipeline.
- New shared helper + 12 tests, FPB widget calls `markContainer`, version bump, build green.
- CLASSIC + COMPACT CSS rules are still missing (only DEFAULT + HORIZONTAL exist) — phase 3b.
