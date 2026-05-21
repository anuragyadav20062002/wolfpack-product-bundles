# Issue: Configure/Edit FPB and PPB Parity + Wiring

**Issue ID:** configure-edit-fpb-ppb-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-21
**Last Updated:** 2026-05-21 19:40

## Overview
Audit and wire the FPB and PPB configure/edit pages against the EB reference, focusing on multilingual controls, PPB placement/visibility, shared FPB styling, right-panel spacing, theme app extension detection, Bundle Settings parity, control wiring, and first-load guided tour readiness requirements.

## Progress Log

### 2026-05-21 18:20 - Started parity and wiring pass
- Created test bundles through the live embedded Admin create workflow:
  - FPB: `Codex FPB 2026-05-21` (`cmpfhj2m10000v0t038osl42y`)
  - PPB: `Codex PPB 2026-05-21` (`cmpfhk3ys0001v0t0w2r3xvls`)
- Started impact and codebase search across configure routes, shared CSS, widget placement services, internal docs, and prior EB audit notes.
- Next: inspect live EB/WPB configure pages, document parity gaps, then implement scoped route/style/wiring fixes.

### 2026-05-21 18:29 - Implemented first parity and wiring slice
- EB comparison:
  - Rechecked EB configure in Chrome on the current Bundle Settings view.
  - Used existing EB audit notes for PPB Bundle Visibility, Bundle Widget, Bundle Embed, and Bundle Settings structure.
- Theme app extension detection:
  - Updated app embed detection to recognize prod and SIT app handles.
  - Scoped embed checks by block handle so PPB checks `bundle-product-page-embed` and FPB checks `bundle-full-page-embed`.
  - Updated theme editor deep links to use the relevant embed block per bundle type.
- UI parity:
  - Added App Embed Status cards to PPB and FPB Bundle Visibility sections.
  - Tightened top/left padding for right-column configure cards.
  - Copied FPB step-tab styling into PPB Step Flow.
  - Removed email wording from Bundle Link helper copy.
- Multi Language:
  - Added a reusable `MultiLanguageTextModal`.
  - Wired PPB Bundle Widget, Bundle Embed, and Pre Selected Product text controls to `textOverridesByLocale`.
  - Wired FPB add button and Bundle Cart text controls to `textOverridesByLocale`.
  - Left EB-style disabled Multi Language buttons disabled where there is no existing storefront/runtime consumer.
- Guided tour:
  - Added `?first_load=true` gating for the create-configure guided tour.
  - Trimmed tour steps to minimum storefront-readiness path: enable embed, add products, place bundle, set active.
- Verification:
  - `npx eslint --max-warnings 9999 ...` passed with warnings only.
  - `npm run build` passed.
  - Graphify code graph rebuilt using the project pipx graphify environment.

### 2026-05-21 18:40 - Browser verified PPB/FPB modal and placement wiring
- PPB embedded Admin verification:
  - Bundle Visibility shows App Embed Status, publishing cards, bundle link, and Bundle Widget/Bundle Embed follow-on setup cards.
  - Top app embed banner and visibility card both show Not enabled on the test shop; readiness score stays at 0, so the banner is not falsely removed before enablement.
  - Place Widget opens the theme-template modal and loads the Product Pages default template choice.
  - Bundle Widget Multi language opens the translation modal with Language, Widget Title, Widget Description, and Widget Button Text fields.
- FPB embedded Admin verification:
  - Bundle Settings renders the expected Pre Selected Product, quantity validation, slot icon, add-button text, Bundle Cart, banner, CSS, price toggles, and Bundle Status controls.
  - Bundle Cart Multi Language opens the translation modal with Language, Bundle Cart Title, and Bundle Cart Subtitle fields.
- Follow-up from verification:
  - PPB Place Widget modal was changed to the same Polaris modal helper/close pattern used by FPB.
  - Shared Multi Language modal was changed to the imperative Polaris modal API so it opens reliably in embedded Admin.
- Validation:
  - `npx eslint --max-warnings 9999 app/components/bundle-configure/MultiLanguageTextModal.tsx 'app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx'` passed with warnings only.
  - `npm run build` passed.
  - Graphify rebuild rerun after final modal changes.

### 2026-05-21 19:40 - Reopened for modal and Bundle Settings parity corrections
- User reported:
  - Admin modals are not working correctly, including newly added Multi Language modals.
  - Multi Language modals need to match EB behavior and presentation more closely.
  - Bundle Settings parity must be re-run for both PPB and FPB.
  - Category empty state should match the Rules Configuration empty state.
  - Bundle Product Card ellipsis menu items need Polaris icons.
- Next:
  - Reverse engineer EB modal behavior in Chrome.
  - Replace the fragile modal implementation path with the same reliable interaction model.
  - Re-run Bundle Settings parity on PPB and FPB before final verification.

### 2026-05-21 20:05 - Implemented EB-style modal and empty-state corrections
- EB modal reverse engineering:
  - Inspected EB's Bundle Settings Multi Language modal in the embedded Admin app.
  - Matched the shared WPB Multi Language modal to EB's title (`Customize Text for Multiple Languages`), `Select Language` label, broad locale list, prefilled field behavior, and `Save and close` action.
- Modal reliability:
  - Rewired PPB page-selection, products, collections, discard, and sync modals to the same Polaris modal helper/on-hide lifecycle used elsewhere.
  - Added the same on-hide lifecycle to FPB steps-tier, page-selection, products, collections, discard, and sync modals.
- Bundle Settings parity pass:
  - Rechecked EB FPB/PPB Bundle Settings docs and current EB modal behavior.
  - Enabled bundle-specific cart line item discount display customization for PPB and FPB instead of leaving the EB-visible option disabled.
  - Adjusted FPB pre-selected product helper copy to EB wording and removed active-step-only wording from Product Slots.
- Empty states and icons:
  - Added `No category defined yet` empty state in FPB and PPB category sections using the shared Rules Configuration empty-state styling.
  - Added Polaris icons to PPB Bundle Product Card ellipsis actions and the single FPB Sync Product menu item.
- Verification:
  - `npm run build` passed.
  - `npx eslint --max-warnings 9999 app/components/bundle-configure/MultiLanguageTextModal.tsx 'app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx' 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx'` passed with warnings only.
  - Graphify code graph rebuilt using the project pipx graphify environment.
- Browser verification blocker:
  - Attempted to reload the embedded WPB Admin configure page for live modal verification after the rebuild.
  - Chrome produced a `beforeunload` dialog and the DevTools dialog-handling call was rejected by the runtime usage-limit guard, so live post-patch verification could not be completed without risking a bypass.

## Related Documentation
- `docs/ppb-eb-configure-clone/eb-ppb-configure-audit-2026-05-21.md`
- `docs/eb-fpb-exploration/EB_FPB_CONFIGURE_EXPLORATION.md`
- `docs/app-nav-map/APP_NAVIGATION_MAP.md`

## Phases Checklist
- [x] Phase 1: Create FPB and PPB test bundles
- [x] Phase 2: EB/WPB configure parity audit
- [x] Phase 3: Multi Language wiring pass
- [x] Phase 4: PPB FPB-style step tabs and right-panel spacing
- [x] Phase 5: PPB Place Widget and Bundle Visibility wiring
- [x] Phase 6: Theme app extension detection/banner wiring
- [x] Phase 7: Bundle Settings and all-control wiring verification
- [x] Phase 8: First-load guided tour minimum readiness analysis
- [x] Phase 9: Lint/build/browser verification
- [x] Phase 10: EB modal reverse engineering and modal fixes
- [x] Phase 11: PPB/FPB Bundle Settings parity rerun
- [x] Phase 12: Category empty state and ellipsis icon parity
