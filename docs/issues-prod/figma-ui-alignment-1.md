# Issue: Figma UI Alignment — Dashboard

**Issue ID:** figma-ui-alignment-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-08
**Last Updated:** 2026-05-11 15:00

## Overview

Verifying and aligning the app's Admin UI against Figma design images, page by page.
Starting with the Dashboard. Each design image is reviewed, gaps are identified, and
implementation is updated to match while keeping Polaris web components throughout.

## Phases Checklist
- [x] Phase 1 — Dashboard gap analysis
- [x] Phase 2 — Dashboard fixes (filter pills, button icon, language selector)
- [x] Phase 3 — Step 02 Configuration gap analysis
- [x] Phase 4 — Step 02 Configuration fixes (StepSummary, s-modal, s-option, full-width Add Rule)
- [x] Phase 5 — Step 03 Pricing layout alignment
- [x] Phase 6 — Step 04 Assets layout alignment
- [x] Phase 7 — Step 05 Pricing Tiers implementation
- [x] Phase 8 — Readiness Score + Guided Tour competitor-parity redesign
- [x] Phase 9 — Create bundle wizard end-to-end flow test + bug fix
- [x] Phase 10 — Readiness overlay polish + PPB wizard Pricing Tiers guard
- [x] Phase 11 — Readiness overlay collapsed state competitor parity (donut size, score text, chevron direction, pill shape)
- [x] Phase 12 — Readiness overlay C-gauge arc, rounded-rect trigger, expanded background dim
- [x] Phase 13 — Readiness overlay collapsed state: content-sized trigger width, larger donut
- [x] Phase 14 — Dashboard status filter default changed from "active" to "all"
- [x] Phase 15 — Dashboard horizontal margins (padding: 0 4px → 0 32px)
- [x] Phase 16 — Filter pill labels: remove "Status: " / "Type: " prefix when option selected
- [x] Phase 17 — Guided tour jitter fix, smooth spotlight transitions, readiness overlay tour target
- [x] Phase 18 — i18n research doc + architecture scaffold (admin UI + storefront research)
- [x] Phase 19 — i18n implementation: packages, config, locale files, app.tsx wiring, dashboard t() extraction
- [x] Phase 20 — Locale persistence via localStorage: language preference survives navigation away from dashboard

## Progress Log

### 2026-05-11 15:00 - Phase 20: Locale persistence via localStorage

- **Problem:** Language preference was URL-param driven (`?locale=fr`). Navigating to any page without `?locale=` caused `app.tsx` loader to return `locale: "en"` and `useEffect` fired `changeLanguage("en")` — reverting the language
- **Fix in `app/routes/app/app.tsx`:**
  - Added `useSearchParams()` import from `@remix-run/react`
  - Replaced the loader-derived `locale` approach with `useSearchParams()`-based logic:
    - If `?locale=` present in URL and supported → use it and save to `localStorage("wolfpack-locale")`
    - If `?locale=` absent → read from `localStorage("wolfpack-locale")` (falls back to `"en"`)
  - Removed `locale` from `useLoaderData` destructure (still available from loader for SSR Polaris translations but not used for i18next)
- **Fix in `app/routes/app/app.dashboard/route.tsx`:**
  - `handleLanguageChange` now calls `localStorage.setItem("wolfpack-locale", locale)` before updating search params
- Files: `app/routes/app/app.tsx`, `app/routes/app/app.dashboard/route.tsx`

### 2026-05-10 - Phase 19: i18n full implementation

**Packages installed:** `i18next@26.0.10`, `react-i18next@17.0.7`

**Files created:**
- `app/i18n/config.ts` — i18next singleton, pre-bundles all 6 locale resources, `fallbackLng: "en"`, `useSuspense: false`
- `app/i18n/polaris-locales.server.ts` — server-only imports of `@shopify/polaris/locales/*.json` for all 6 locales; excluded from client bundle via `.server.ts` suffix
- `app/i18n/locales/en.json` — English base (54 keys across dashboard namespace)
- `app/i18n/locales/fr.json` — full French translation
- `app/i18n/locales/de.json`, `es.json`, `ja.json`, `pt-BR.json` — full machine translations; all 54 dashboard keys translated per locale; `label` key translated (Sprache/Idioma/言語); language option names use native forms (Français, Deutsch, Español, 日本語, Português)

**`app/routes/app/app.tsx` changes:**
- Loader reads `?locale` from URL, calls `getPolarisLocale(locale)`, returns `{ locale, polarisTranslations }`
- `AppProvider` receives `i18n={polarisTranslations}` → Polaris components translate automatically
- `I18nextProvider` wraps `<Outlet />` to make `useTranslation()` available across all routes
- `useEffect` calls `i18n.changeLanguage(locale)` when locale from URL changes

**`app/routes/app/app.dashboard/route.tsx` changes:**
- `useTranslation()` added to both `BundleActionsButtons` (memo) and `Dashboard`
- All 54 hardcoded UI strings replaced with `t("dashboard.key")` calls
- `STATUS_BADGES` static object removed → `getStatusDisplay` uses `t(`dashboard.status.${status}`)`
- `BUNDLE_TYPE_LABELS` static object removed → `getBundleTypeDisplay` uses `t(`dashboard.bundleType.${bundleType}`)`
- `languageOptions` labels use `t("dashboard.language.{locale}")` — wrapped in `useMemo([t])` so they update on language change
- Pagination uses `t("dashboard.pagination.page", { current, total })` interpolation
- `confirm()` and `toast.show()` calls use `t()` for their messages

**Architecture notes:**
- SSR always renders English (i18next singleton initialized with `lng: "en"`)
- Client re-renders immediately after hydration when `useEffect` fires `changeLanguage(locale)`
- All 6 locale resources are pre-bundled (locale files are ~5 KB each); no network fetch on language change
- `pt-BR.json` Polaris locale exists in `@shopify/polaris/locales/` — all 6 locales fully covered

### 2026-05-09 19:30 - Phase 18: i18n research doc

- Created `docs/i18n-research.md` covering admin UI and storefront widget
- Admin UI: `react-i18next` + JSON locale files; `@shopify/react-i18n` is deprecated
- Storefront: DCP-driven `data-i18n` JSON blob injected from Liquid; no npm i18n lib needed in widget bundle
- Includes installation steps, directory layout, config scaffold, Polaris locale wiring, string extraction order, and open questions
- No code changes — research only

### 2026-05-09 19:00 - Phase 15–17: Dashboard margins, filter labels, guided tour

**Phase 15 — Dashboard horizontal margins:**
- `.dashboardPage` `padding` changed from `0 4px 88px` → `0 32px 88px`
- File: `app/routes/app/app.dashboard/dashboard.module.css`

**Phase 16 — Filter pill label prefix removal:**
- Status pill: `Status: Active` → `Active`
- Type pill: `Type: Full page` → `Full page`
- File: `app/routes/app/app.dashboard/route.tsx`

**Phase 17 — Guided tour jitter + smooth spotlight + readiness target:**
- Removed immediate `updatePositions(el)` call (source of wrong-position jitter before scroll settles)
- Replaced 350ms fixed timeout with rAF polling that detects when scroll has settled (stable rect for ≥4 frames)
- Added CSS transitions to SVG spotlight rect (`x`/`y`/`width`/`height` as CSS properties)
- Added `transition: top 0.35s ease, left 0.35s ease` to `.overlay` for smooth tooltip movement
- No-spotlight steps now compute a centered bottom position instead of falling back to CSS defaults (cleaner transition path)
- Added `data-tour-target="fpb-readiness-score"` to collapsed trigger div in `BundleReadinessOverlay.tsx`
- Updated last FPB_TOUR_STEPS entry `targetSection` from `""` → `"fpb-readiness-score"`
- Files: `BundleGuidedTour.tsx`, `BundleGuidedTour.module.css`, `BundleReadinessOverlay.tsx`, `tourSteps.ts`

### 2026-05-09 18:00 - Phase 14: Dashboard status filter default fix

- Changed `statusFilter` default from `"active"` → `"all"` in `route.tsx:332`
- Design shows unfiltered "Status ▾" pill; "active" preset was hiding bundles and showing wrong empty state
- Files modified: `app/routes/app/app.dashboard/route.tsx`
- Next: continue dashboard UI validation

### 2026-05-09 17:30 - Phase 13: Collapsed trigger width + donut size fix

**Root cause of empty space:**
- `.panelWrapper` always has `width: min(360px, calc(100vw - 40px))` even when height is 0 (collapsed)
- This forced the container to be 360px wide, so the `.collapsed` trigger stretched to fill 360px
- Result: donut + chevron on the left with ~280px of dead space to the right

**Changes:**
- Added `display: flex; flex-direction: column; align-items: flex-start` to `.container`
  — with `align-items: flex-start`, flex children size to their content width instead of stretching
  — collapsed trigger now sizes to content (donut + chevron only)
  — `.collapsedOpen` width override still applies when expanded (360px trigger to match panel)
- Donut SVG: 48×48 → 56×56, viewBox 0 0 48 48 → 0 0 56 56, center (24,24) → (28,28)
- radius: 18 → 22, strokeWidth: 4 → 4.5, fontSize: 14 → 16, text y: 29 → 34
- `transform` origin updated: `rotate(135 24 24)` → `rotate(135 28 28)`

**Files changed:**
- `app/components/bundle-configure/BundleReadinessOverlay.tsx`
- `app/components/bundle-configure/BundleReadinessOverlay.module.css`

### 2026-05-09 17:00 - Phase 12: C-gauge arc, rounded-rect trigger, expanded background dim

**Gap analysis vs competitor screenshots (expanded + collapsed):**
- Donut was a full-circle arc (strokeDashoffset approach) — competitor uses a 270° C-gauge (gap at bottom)
- Collapsed trigger `border-radius: 50px` (pill) — competitor uses `~16px` rounded rectangle
- No background dimming when expanded — competitor dims the page and blocks interaction

**Changes:**
- SVG donut → C-gauge: `strokeDasharray` for both track (gray, fixed 270°) and progress (colored, score-proportional), `transform="rotate(135 24 24)"` to position gap at bottom. Removed `offset` variable, added `arcLength` + `progressLength`
- `border-radius: 50px` → `16px` on `.collapsed`
- Added `.dimOverlay` CSS class: `position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 499`
- JSX: wrapped return in fragment, renders `<div className={styles.dimOverlay} onClick={toggle} />` when `expanded === true` — clicking dim also collapses the panel

**Files changed:**
- `app/components/bundle-configure/BundleReadinessOverlay.tsx`
- `app/components/bundle-configure/BundleReadinessOverlay.module.css`

### 2026-05-09 16:30 - Phase 11 (continued): Collapsed trigger pill-shape fix

**Additional gap vs competitor:**
- Trigger `border-radius` was `12px` (rounded rect) — competitor uses a fully pill-shaped trigger (~50px radius)
- Box shadow was too subtle; hover shadow also adjusted for consistency

**Changes:**
- `.collapsed` `border-radius`: `12px` → `50px` (full pill)
- `.collapsed` `padding`: adjusted to `6px 14px 6px 6px` for tighter pill appearance
- `.collapsed` `box-shadow`: `0 2px 10px rgba(0,0,0,0.12)` → `0 2px 12px rgba(0,0,0,0.14)`
- `.collapsed:hover` shadow strengthened to `0 4px 20px rgba(0,0,0,0.20)`

**Files changed:**
- `app/components/bundle-configure/BundleReadinessOverlay.module.css`

### 2026-05-09 16:00 - Phase 11: Readiness overlay collapsed state competitor parity

**Gap analysis vs competitor collapsed state (competitor-readiness-collapsed.png):**
- Chevron direction was **inverted**: our SVG showed ∨ (down) when collapsed, competitor shows ∧ (up) when collapsed
- Score text inside donut was too small (fontSize="11") — competitor renders it larger/bolder (~14px)
- Donut circle slightly undersized (44px) vs competitor (~48px)

**Changes:**
- Fixed SVG chevron paths — swapped so collapsed = ∧ (M2 9L7 4L12 9), expanded = ∨ (M2 5L7 10L12 5)
- Donut SVG: 44×44 → 48×48, viewBox 0 0 44 44 → 0 0 48 48, center (22,22) → (24,24), text anchor y="27" → y="29"
- Score text: fontSize="11" → fontSize="14", fontWeight="600" → fontWeight="700"
- Stroke rotation origin updated: rotate(-90 22 22) → rotate(-90 24 24)

**Files changed:**
- `app/components/bundle-configure/BundleReadinessOverlay.tsx`

### 2026-05-10 14:30 - Dashboard empty state: bundle.png image + 2-line text + font weight

- Replaced `s-icon type="package"` with `<img src="/bundle.png">` inside `.emptyBundlesIcon`
- Replaced `s-text` body with `<p className={emptyBundlesBody}>` for explicit font control
- CSS: `.emptyBundlesIcon` → wider (100px), overflow hidden; added `.emptyBundlesImg` (64px contain); added `.emptyBundlesBody` (max-width 340px, font-weight 500, text-align center, line-height 1.55 for 2-line wrap)
- Disabled Vercel plugin for this project in `.claude/settings.json` (was producing Next.js false-positive warnings on Remix files)
- Files: route.tsx, dashboard.module.css, .claude/settings.json

### 2026-05-09 15:00 - Phase 10: Readiness overlay polish + PPB wizard Pricing Tiers guard

**Changes implemented:**

*BundleReadinessOverlay — UI polish:*
- Panel items list: added `max-height: 280px` + `overflow-y: auto` + `scrollbar-width: thin` for scrollability
- Smooth expand/collapse animation: replaced conditional `{expanded && <panel>}` with always-rendered
  `panelWrapper → panelInner` using CSS grid `grid-template-rows: 0fr → 1fr` transition (0.25s cubic-bezier)
- SVG chevron: replaced `∧`/`∨` text characters with a 14×14 SVG path chevron (`stroke="#555"`, `strokeWidth="2"`)
  that flips direction based on `expanded` state
- Collapsed trigger: added permanent `box-shadow: 0 2px 10px rgba(0,0,0,0.12)` (was hover-only);
  stronger hover shadow; slightly increased right padding to `14px` for better visual weight
- Panel: updated `box-shadow` to `0 4px 20px rgba(0,0,0,0.1)` (was 0.08); border unified to `#e0e0e0`

*Create bundle wizard — PPB Pricing Tiers guard:*
- Added `isFpb = bundle.bundleType === "full_page"` and `stepsMeta = isFpb ? STEPS_META : STEPS_META.slice(0,4)`
- Step indicator renders 4 steps (not 5) for product-page bundles
- `assetsFetcher` useEffect: for PPB navigates directly to configure page; for FPB still advances to step 4 (Pricing Tiers)
- Pricing Tiers JSX block guarded with `wizardStep === 4 && isFpb`

**Files changed:**
- `app/components/bundle-configure/BundleReadinessOverlay.tsx`
- `app/components/bundle-configure/BundleReadinessOverlay.module.css`
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-09 14:00 - Phase 9: Create bundle wizard end-to-end flow test + bug fix

**End-to-end test result:** All 5 wizard steps tested in SIT; full flow works correctly.
- Step 01 (Bundle Name & Description) → Step 02 (Configuration) → Step 03 (Pricing) →
  Step 04 (Assets) → Step 05 (Pricing Tiers) → Full configure page — all transitions pass.

**Bug found and fixed:**
- In the Pricing Tiers step, the Linked Bundle `<s-select>` onChange handler was reading
  `(e.currentTarget as HTMLSelectElement).value`. Polaris web component custom events can
  dispatch with `currentTarget = null` (event dispatched outside React's synthetic event
  system), causing a TypeError crash and Remix error boundary 500 page.
- Fix: changed to `(e.target as HTMLSelectElement).value` — consistent with all other
  `<s-select>` change handlers in the file.

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` (line 2025)

### 2026-05-09 12:00 - Phase 8: Readiness Score + Guided Tour redesign

**Gap analysis vs. competitor (Easy Bundle Builder):**
- Collapsed state: competitor shows only donut + chevron ∧; ours had extra "Readiness / Score" text labels
- Expanded trigger: competitor shows donut + "Readiness Score" bold + "N/M items complete" subtitle + chevron ∨; ours had same minimal trigger in both states
- Panel items: competitor uses SVG circle indicators, description text per item, green border+bg for done items, "+N Points" badge chip; ours used text "○"/"✓" characters, no description, no done-item styling
- Score color: competitor uses red (#d82c0d) for low scores; ours returned gray (#aaa)
- Status line: competitor shows plain "Your bundle isn't ready to sell yet." (no ⚠ icon); ours had ⚠ prefix
- Guided tour: two dismiss buttons (header + footer); competitor has only one action (Got it / Next)
- Guided tour bug: when `data-tour-target` element is missing from the DOM, `tooltipStyle`/`spotlightRect` were not reset — tooltip stayed frozen at previous step's position

**Changes implemented:**
- `BundleReadinessItem` interface: added `description?: string` field
- `scoreColor()`: changed < 40 branch from `#aaa` → `#d82c0d`
- Collapsed trigger: removed `.scoreLabel` text; shows only donut + chevron; chevron now `∧` when collapsed, `∨` when expanded (matches competitor convention)
- Expanded trigger: conditionally renders `.scoreLabel` block with bold "Readiness Score" title + "N/M items complete" subtitle; `.collapsedOpen` class widens trigger to match panel
- Panel items: replaced text check chars with SVG circle indicators (filled green ✓ for done, empty gray ring for pending); added `.itemContent` flex column with bold label + description text; replaced inline points text with `.itemPoints` chip badge; `.panelItemDone` adds green border + bg
- Status line: removed ⚠, plain text only; shows both ready/not-ready states
- `BundleReadinessOverlay.module.css`: full CSS rewrite — removed old `.scoreLabel`, `.checkDone`, `.checkPending`, `.itemAction`, `.statusLine` classes; added new `.scoreLabelTitle`, `.scoreLabelSub`, `.collapsedOpen`, `.panelItemDone`, `.itemIndicator`, `.itemContent`, `.itemDesc`, `.itemPointsDone` classes
- Added `description` to all 5 readiness items in route.tsx
- `BundleGuidedTour.tsx`: removed redundant "Dismiss" button from `.actions` footer (kept header "Dismiss guided tour" link only)
- `BundleGuidedTour.tsx`: fixed missing-element bug — when `document.querySelector` returns null, now resets `spotlightRect` and `tooltipStyle` to defaults before returning

**Files changed:**
- `app/components/bundle-configure/BundleReadinessOverlay.tsx`
- `app/components/bundle-configure/BundleReadinessOverlay.module.css`
- `app/components/bundle-configure/BundleGuidedTour.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-09 01:00 - Step 05 Pricing Tiers implementation

**Gap analysis vs. Figma Image #6:**
- Heading "Pricing Tiers" + subtitle: "Let shoppers switch between different bundle price points on the same page."
- Tier card (bordered): "Tier N" bold label + red trash icon; 2-col grid: Label (text input, placeholder "Buy 3 @ 699", helper "Shown on the pill button (50 max characters)") + Linked Bundle (select, helper "Choose the product bundle to trigger for this tier")
- Full-width dashed "Add Rule" button
- Footer: "Back" (secondary) + "Finish" (primary dark)

**Changes implemented:**
- Added `tiersFetcher` fetcher for `saveTiers` action
- Added `tiers` state initialized from `bundle.tierConfig`
- Changed `assetsFetcher` useEffect: now advances to `wizardStep(4)` instead of navigating away
- Added `tiersFetcher` useEffect: navigates to `redirectTo` on successful `saveTiers`
- Updated `pageTitle` derived value to include "Pricing Tiers" for wizardStep 4
- Updated `isSubmitting` to use `tiersFetcher.state` for wizardStep 4
- Updated `handleNext` deps + added wizardStep 4 branch: submits `saveTiers` via `tiersFetcher`
- Renamed "Finish Setup" → "Next" on Step 04 Assets footer
- Added `wizardStep === 4` JSX: full Pricing Tiers card with tier rows, Label/Linked Bundle 2-col grid, dashed Add Rule button, Back/Finish footer

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-09 00:15 - Step 04 feature row dividers, padding, and typography fix

**Problem:** Filters/Search Bar/Custom Fields rows were cramped with no visible separators. `s-heading`/`s-text` Polaris web components inside rows caused wrong visual weight and inconsistent spacing.

**Changes implemented:**
- Replaced `<s-heading>` + `<s-text>` in all three feature rows with `<p className={styles.assetRowTitle}>` and `<p className={styles.assetRowSubtitle}>`
- Added `padding: 16px 0` to `.assetRow` for vertical breathing room
- Fixed `.displayOptionDivider` background from `#f3f4f6` (nearly invisible) → `#e5e7eb` and added `margin: 0 -24px` so dividers span full card width (counteracts card's 24px padding)
- Set `.assetRowLeft` to `align-items: flex-start` so icon pins to the top of multi-line subtitle text

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css`

### 2026-05-08 19:12 - Dashboard gap analysis + fixes

**Gap analysis findings:**
- Language selector present in impl, absent in design → keep as extra feature, but fix broken event handler
- Filter dropdowns: design shows pill-style outlined buttons ("Status ▾", "Bundle type ▾"); impl uses `s-select` form controls → replace with `s-button + s-popover + s-choice-list`
- Create Bundle button: design shows no icon, impl has `icon="plus"` → remove icon
- Sync Collections icon: design shows refresh icon, impl uses `icon="refresh"` → already correct, no change

**Root cause of language selector bug:**
The `change` event handler was reading `(e as CustomEvent).detail?.value` first — Polaris web
components don't fire CustomEvents with a `detail` payload. The fallback `e.target.value` may
also be unreliable due to shadow DOM event re-targeting. Fixed to use `e.currentTarget.value`
which is always the `s-select` element the listener is attached to.

**Files changed:**
- `app/routes/app/app.dashboard/route.tsx`
- `app/routes/app/app.dashboard/dashboard.module.css`

**Next:** Continue with next Figma design image (TBD by user)

### 2026-05-08 22:30 - Gap 7: FilePicker empty state redesign

**Changes implemented:**
- Added `hint` prop to FilePicker — displays recommendation text inside the drop zone (e.g. "Recommended: 1920×400px")
- Added `uploadLabel` prop — controls upload button text ("Upload image" / "Upload")
- Replaced `ImageIcon` with inline monitor SVG matching Figma design
- Replaced "Select from store files or upload" subtitle with `hint` text
- Added pill-style "Upload image" button inside the empty-state drop zone
  - Triggers direct file upload (no modal) — auto-applies the uploaded file via `onChange` on success
  - Shows inline spinner + status text in the drop zone while uploading/polling
  - Shows errors below the zone when modal is not open
- Moved `<input type="file">` outside the `<dialog>` so `.click()` is a trusted user gesture regardless of dialog open state
- Added `uploadFromTrigger` state to differentiate direct-upload path from modal-upload path
- Updated Promo Banner FilePicker: `label="Choose background image"`, `hint="Recommended: 1920×400px"`, `uploadLabel="Upload image"`, removed `<s-text>` subtitle above picker
- Updated Loading Animation FilePicker: `label="Choose loading GIF"`, `hint="Recommended: 150×150px"`, `uploadLabel="Upload"`, removed `<s-text>` subtitle above picker

**Files changed:**
- `app/components/design-control-panel/settings/FilePicker.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-08 22:05 - Step 04 Assets layout alignment

**Changes implemented:**
- Added card subtitle "Add visual media to your bundle configurator..." below Media Assets heading
- Renamed "Loading GIF" → "Loading Animation" (heading + FilePicker label)
- Added `formatChip` info pills below each FilePicker (format: JPG/PNG/WebP for banner, GIF only for animation)
- Added `assetRowLeft` wrapper with `s-icon` (filter/search/edit) to all three feature rows
- Merged Filters, Search Bar, Custom Fields from 3 separate cards into 1 card with `displayOptionDivider` separators
- Updated subtitle text: Filters → "Create filters to display on this step", Custom Fields → "Add custom input fields (like gift notes or delivery dates)..."
- Deferred: FilePicker internal empty-state UI redesign (Gap 7) — separate task

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css`

### 2026-05-08 21:10 - Step 03 Pricing layout alignment

**Changes implemented:**
- Replaced 2-column `styles.layout` with single-column `styles.assetsLayout` for pricing step
- Removed entire Pricing Summary right sidebar (Discounts, Type, Rules, Progress bar, Messaging summary)
- Moved Back/Next footer out of sidebar to bottom of single-column layout
- Removed `{pricing.discountEnabled && ...}` gate on `pricingContent` div — Tip banner, Discount Type select, and Add Rule button now always visible regardless of toggle state

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-08 20:45 - Step 02 Configuration fixes

**Changes implemented:**
- Created `StepSummary.tsx` — new extracted component with 5 summary rows: Selected products, Rules, Filters, Search Bar, Custom Fields; uses existing CSS classes + Polaris web components
- Replaced old 2-row inline Step Summary sideCard with `<StepSummary />` component import
- Added `filtersCount` and `customFieldsCount` derived values in route component
- Migrated Multi Language modal from custom `div.modalBackdrop` to `s-modal` (controlled via `open={localeModalOpen || undefined}`, dismiss via `onHide`)
- Replaced ALL `<option>` → `<s-option>` throughout file (10 occurrences: rule conditions/operators, bundle status, discount type/conditions/operators, locale select, filter type, custom field type)
- Wrapped "Add Rule" button (step 02 Rules card) in `.addRuleWrap` div for full-width layout
- Added `.previewButtonWrap` and `.addRuleWrap` CSS classes in `wizard-configure.module.css`

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/StepSummary.tsx` (created)
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css`

## Related Documentation
- Figma designs provided incrementally by user in chat
- `docs/app-nav-map/APP_NAVIGATION_MAP.md`
