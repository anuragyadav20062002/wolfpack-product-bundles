# UX Gap Analysis — Wolfpack Product Bundles

**Date:** 2026-03-26
**Environment:** SIT (`wolfpack-store-test-1.myshopify.com`)
**App:** Wolfpack: Product Bundles -SIT
**Reviewed by:** Claude Code (live browser session via Chrome DevTools MCP)

---

## Summary

32 gaps identified across all app screens. 5 high-priority, 17 medium-priority, 10 low-priority.

| Severity | Count |
|----------|-------|
| 🔴 High   | 5     |
| 🟡 Medium | 17    |
| 🟢 Low    | 10    |

**Top 3 to address immediately:**
1. **GAP-19** — DCP paywall not enforced (direct revenue leak)
2. **GAP-11** — "Images & GIFs" tab name vs. GIF-only reality (misleading UX)
3. **GAP-26** — No mobile preview in DCP visual editor

---

## 1. Dashboard (`/app/dashboard`)

### GAP-01 — Cart demo exposes internal metadata 🟡 Medium
**Observed:** The cart demo section at the bottom of the dashboard displays raw Shopify line item properties (`_bundle_id`, `_bundle_name`, `_step_index`, `_step_name`) visible to merchants in the admin UI.

**Impact:** Merchants may be confused, thinking customers see these values. Creates a professionalism concern.

**Fix:** Filter out underscore-prefixed properties from cart demo display — same logic described in the Events FAQ for theme code.

---

### GAP-02 — Onboarding guide never dismisses 🟡 Medium
**Observed:** The "Bundle Setup Steps" onboarding checklist is always shown on the dashboard regardless of whether bundles already exist. The test store has 1 bundle yet the guide is still visible.

**Impact:** Creates visual noise for returning merchants; makes the dashboard feel unpolished.

**Fix:** Hide the guide when ≥1 bundle exists, or add a dismiss/collapse button.

---

### GAP-03 — No sort or filter on bundle list 🟡 Medium
**Observed:** Bundle list has no column sorting (by name, status, type, date) and no filter controls.

**Impact:** Grows into a real usability problem as merchants approach the 10- or 20-bundle limit.

**Fix:** Add sortable column headers; add a status filter dropdown.

---

### GAP-04 — No search on bundle list 🟡 Medium
**Observed:** No search bar to find a bundle by name.

**Impact:** Worse on Grow plan (20 bundles). Merchants with many bundles will be frustrated.

**Fix:** Add a search input above the bundle table.

---

## 2. Configure Page — Step Setup Tab

### GAP-05 — "Preview Bundle" disabled with no explanation 🟡 Medium
**Observed:** The "Preview Bundle" button is grayed out on the configure page but there is no tooltip or inline copy explaining why.

**Impact:** Merchants don't know what action is needed to unlock preview.

**Fix:** Add a disabled-state tooltip: "Add at least one step and save to preview your bundle."

---

### GAP-06 — "Sync Bundle" disabled state unexplained 🟢 Low
**Observed:** "Sync Bundle" is disabled after a fresh page load but no tooltip or message explains when it activates.

**Fix:** Add tooltip: "No changes to sync. Sync Bundle after updating your configuration."

---

### GAP-07 — Tab switching blocked by unsaved changes with no inline warning 🟡 Medium
**Observed:** Clicking the "Images & GIFs" tab while the "Discount & Pricing" tab has unsaved changes triggers a dismissive toast: "Please save or discard your changes before switching sections." No inline warning is shown on the tab before clicking.

**Impact:** Merchant loses their place; must dismiss the toast and decide what to do with no context.

**Fix:** Show an inline prompt on the tab the user is trying to leave, or allow navigation and surface an "unsaved changes" banner in the new tab.

---

### GAP-08 — "Mandatory default product" label is ambiguous 🟢 Low
**Observed:** The Step Options section contains a checkbox labelled "Mandatory default product". It's unclear if this means the product is pre-selected (soft default) or forced-selected (customer cannot deselect).

**Fix:** Rename to "Pre-select this product by default" or "Lock this product (customer cannot deselect)" depending on actual behaviour.

---

## 3. Configure Page — Discount & Pricing Tab

### GAP-09 — No feedback at max 4 discount rules 🟢 Low
**Observed:** The "Add rule" button does not visibly disable or show a counter when all 4 discount rule slots are used.

**Fix:** Disable the button and show "Maximum 4 rules reached" when at limit.

---

### GAP-10 — "Discount Messaging" checkbox checked with no rules 🟢 Low
**Observed:** The "Discount Messaging" checkbox is ticked by default even when no discount rules exist. The placeholder text says "Add discount rules to configure messaging" — implying the toggle is functional when it is actually inert.

**Fix:** Default the checkbox to unchecked, or disable it and show an explanation until at least one discount rule is added.

---

## 4. Configure Page — Images & GIFs Tab

### GAP-11 — Tab name "Images & GIFs" is misleading 🔴 High
**Observed:** The tab is named "Images & GIFs" but the only feature available is a single loading animation upload that accepts **GIF files only** (Max 150×150px). There is no static image support.

**Impact:** Merchants expect to upload a bundle hero image, thumbnail, or product imagery from this tab. The name creates false expectations.

**Fix (option A):** Rename the tab to "Loading Animation" to accurately describe what it does.
**Fix (option B):** Add a bundle thumbnail / hero image upload section to justify the name.

---

### GAP-12 — "Storefront" badge meaning is unclear 🟢 Low
**Observed:** A "Storefront" label/badge appears next to the "Loading Animation" heading but is neither a link, a button, nor explained anywhere.

**Fix:** Either remove it, or replace with a tooltip: "This animation appears on the storefront (visible to customers)."

---

### GAP-13 — "APPEARS DURING" chips are not configurable 🟡 Medium
**Observed:** The "Initial load", "Step transitions", and "Add to cart" chips are informational only. Merchants cannot choose which events trigger the animation.

**Impact:** A merchant may only want the animation on initial load and not on every step transition.

**Fix:** Convert chips to toggles if per-event control is a desired feature; otherwise add a note "Animation plays during all loading events."

---

### GAP-14 — No in-app preview of the uploaded GIF 🟡 Medium
**Observed:** After uploading a GIF, there is no thumbnail preview within the admin. The merchant must visit the storefront to verify it looks correct.

**Fix:** Show an inline thumbnail preview of the uploaded GIF in the admin upload area.

---

## 5. Analytics Page (`/app/attribution`)

### GAP-15 — Subtitle "UTM attribution & bundle revenue" is inaccurate 🔴 High
**Observed:** The page subtitle is "UTM attribution & bundle revenue" but there is no bundle revenue section on this page. Only UTM attribution data (which is currently empty / tracking not enabled) is present.

**Impact:** Misleads merchants into thinking bundle revenue reporting exists. May affect Grow plan upgrade decisions.

**Fix:** Change subtitle to "UTM attribution" until a bundle revenue section is built. Then update subtitle and add the section.

---

### GAP-16 — No custom date range 🟡 Medium
**Observed:** Only three preset options: Last 7 days, Last 30 days, Last 90 days. No custom date range picker.

**Impact:** Merchants running time-bound campaigns (e.g., Black Friday, a specific ad flight) cannot isolate their data.

**Fix:** Add a "Custom range" option with a date picker.

---

### GAP-17 — Revenue Trend shows only daily granularity 🟡 Medium
**Observed:** The Revenue Trend chart defaults to "daily" with no toggle to switch to weekly or monthly aggregation.

**Impact:** At the 90-day range, 90 data points with near-zero values is uninformative noise.

**Fix:** Add weekly/monthly granularity toggle alongside the existing "daily" label.

---

### GAP-18 — "Enable tracking" has no guided setup 🟡 Medium
**Observed:** Clicking "Enable tracking" presumably activates UTM pixel capture, but there are no instructions on how to tag ad links with UTM parameters to generate data.

**Impact:** Merchants enable tracking but have no data, don't know why, and may think the feature is broken.

**Fix:** After enabling, show a setup guide or link to docs: how to create UTM-tagged links, how long before data appears, etc.

---

## 6. Pricing Page (`/app/pricing`)

### GAP-19 — Design Control Panel accessible to Free plan users 🔴 High
**Observed:** The Pricing page lists "Design Control Panel" as an exclusive Grow plan feature. However, navigating to `/app/design-control-panel` works without any paywall for a Free plan user — the full visual editor and Custom CSS editor are accessible and functional.

**Impact:** Direct revenue leak. Free plan users get a feature they should be paying for.

**Fix:** Enforce a plan gate on the DCP route that checks for an active Grow subscription. On SIT, the gate should be skipped (env-based flag).

---

### GAP-20 — "Bundle analytics (coming soon)" but Analytics page already exists 🔴 High
**Observed:** The Grow plan feature list includes "Bundle analytics (coming soon)" yet the Analytics page (`/app/attribution`) is already live and accessible to all users — including Free plan users — without restriction.

**Impact:** Misleads potential Grow upgraders and creates a confusing inconsistency.

**Fix:** Update this bullet to accurately describe what is available vs. what is coming. Enforce any paid-only analytics features behind the plan gate if applicable.

---

### GAP-21 — No annual billing option 🟡 Medium
**Observed:** Only monthly billing at $9.99/month. No annual option visible.

**Fix:** Offer annual billing (e.g. $7.99/month billed $95.88/year — ~20% off) to reduce churn and increase LTV.

---

### GAP-22 — No free trial mentioned 🟡 Medium
**Observed:** The Grow plan upgrade CTA shows no free trial period.

**Fix:** Offer a 7- or 14-day free trial on Grow. Common pattern on Shopify apps that reduces upgrade hesitation. Configurable via Shopify Billing API `trialDays`.

---

## 7. Events Page (`/app/events`)

### GAP-23 — Page name "Events" is confusing 🟡 Medium
**Observed:** "Events" in the Shopify admin context typically means order events, webhook events, or calendar events. This page is a changelog + FAQ page.

**Fix:** Rename to "What's New", "Updates", or "Release Notes & Guides".

---

### GAP-24 — Very sparse content 🟢 Low
**Observed:** Only 1 release note and 1 FAQ/tutorial on the page.

**Impact:** Doesn't communicate product maturity or active development to new merchants.

**Note:** Content gap, not a UX bug. Will improve naturally as more releases ship.

---

### GAP-25 — Release dates are month-only 🟢 Low
**Observed:** Release date shows "Released: March 2026" — no specific day.

**Fix:** Use a specific date ("Released: March 15, 2026") so merchants can judge recency.

---

## 8. Design Control Panel — Visual Editor

### GAP-26 — No mobile / responsive preview toggle 🔴 High
**Observed:** The DCP visual editor preview is desktop-only. There is no mobile viewport toggle.

**Impact:** Bundle widgets must work well on mobile, which typically accounts for 60-80% of Shopify traffic. Merchants cannot test their design changes for mobile without leaving the app.

**Fix:** Add a device preview toggle (Desktop / Tablet / Mobile) in the DCP preview toolbar, using standard viewport widths (e.g. 375px, 768px, 1280px).

---

### GAP-27 — Numeric inputs are sliders only — no text field override 🟡 Medium
**Observed:** Font Size, Font Weight, Hover Lift, Transition Duration, and other numeric settings use sliders only. There is no text input for setting a precise value.

**Impact:** Setting exactly 14px or 200ms requires careful slider dragging. Accessibility concern for keyboard users.

**Fix:** Add a companion number input field next to each slider, bound to the same value.

---

### GAP-28 — No "Reset to defaults" per section 🟡 Medium
**Observed:** The right panel for each DCP section (e.g. Product Card) has no "Reset to defaults" or "Restore original settings" action.

**Impact:** Accidental or experimental changes are hard to undo beyond manually reversing each control.

**Fix:** Add a "Reset section" or "Restore defaults" button in the section header of each right panel.

---

### GAP-29 — Left nav sections have no description or visual hint 🟡 Medium
**Observed:** The DCP left navigation contains 10+ sections (Global Colors, Product Card, Bundle Footer, General, Bundle Header, Promo Banner, Pricing Tier Pills…) with no descriptions or thumbnail previews of what each section controls.

**Impact:** First-time users must click through all sections blindly to understand the DCP scope.

**Fix:** Add a short one-line description under each nav item, or show a hover tooltip with a micro-preview.

---

### GAP-30 — No clear save confirmation or auto-save indicator 🟡 Medium
**Observed:** It is not clear from the visual editor viewport whether changes are auto-saved or require a manual save. No persistent Save button is visible in the editor's primary viewport area.

**Fix:** Either add a persistent "Save" button in the DCP header/toolbar, or show a clear "Auto-saving…" / "All changes saved" status indicator.

---

## Cross-Cutting Issues

### GAP-31 — No global Help / Support link in app navigation 🟡 Medium
**Observed:** The only support surface is the chat bubble (bottom-right corner). There is no help center link, documentation link, or keyboard-accessible support entry point in the app navigation.

**Fix:** Add a "Help" or "?" link in the app header or sidebar nav that opens docs / support chat.

---

### GAP-32 — Back arrows on secondary pages navigate to Shopify home 🟢 Low
**Observed:** On Analytics, Pricing, and Events pages, the back arrow (←) in the page heading navigates to the Shopify admin root, not back to the app's own Dashboard.

**Impact:** Minor but breaks expected navigation flow for merchants who navigate between app pages.

**Fix:** The back breadcrumb on all secondary app pages should link to `/app/dashboard`, not Shopify admin root.

---

## Appendix — Screens Reviewed

| Screen | URL |
|--------|-----|
| Dashboard | `/app/dashboard` |
| Configure — Step Setup | `/app/bundles/product-page-bundle/configure/:id` |
| Configure — Discount & Pricing | (tab on configure page) |
| Configure — Images & GIFs | (tab on configure page) |
| Analytics | `/app/attribution` |
| Pricing | `/app/pricing` |
| Events | `/app/events` |
| Design Control Panel | `/app/design-control-panel` |
| DCP Visual Editor (FPB) | (opened via Customize button) |
