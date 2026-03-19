# Product Owner Requirements — Beco-Style Pricing Tier Selection

**Document Type:** PO Requirements
**Feature ID:** fpb-tier-selection
**Status:** Draft
**Created:** 2026-03-17
**Author:** Feature Pipeline

---

## 1. Overview

This document translates the Business Requirements (00-BR.md) into precise, testable acceptance criteria. It defines the complete expected behaviour of the tier pill selector for engineers and QA.

---

## 2. Functional Requirements

### FR-01: Maximum Tier Count
- The system supports a maximum of **4 tiers** per widget instance.
- Tiers are numbered 1 through 4. Tiers 3 and 4 are optional.
- A tier is considered "configured" when both its label AND its bundle ID are non-empty strings in the block settings.

### FR-02: Pill Bar Visibility
- The pill bar is **hidden** (not rendered in the DOM) when fewer than 2 tiers are configured.
- The pill bar is **visible** when 2, 3, or 4 tiers are configured.
- In theme editor (`request.design_mode`) with at least 2 configured tiers, the pill bar is shown even when bundle IDs resolve to "preview".

### FR-03: Default Active Tier
- On page load, **Tier 1** is the default active tier.
- The bundle displayed by default is determined by the existing priority chain (custom metafield → page handle → app metafield → block setting). If the primary `bundle_id` resolves to the same ID as Tier 1's bundle ID, Tier 1 is correctly highlighted active. If the resolved bundle ID does not match any tier, Tier 1 is still treated as active.
- The widget initialises exactly as it does today when only one tier is configured — the tier feature is purely additive.

### FR-04: Pill Appearance — Active State
- The active pill has:
  - Background: CSS variable `--bundle-tier-pill-active-bg` (default: `#00FF00`)
  - Text colour: CSS variable `--bundle-tier-pill-active-text` (default: `#000000`)
  - Border: CSS variable `--bundle-tier-pill-border` (default: `1px solid #000000`)
  - Border-radius: CSS variable `--bundle-tier-pill-border-radius` (default: `8px`)
  - Min-height: CSS variable `--bundle-tier-pill-height` (default: `52px`)
  - Cursor: `default` (not pointer — it is already selected)

### FR-05: Pill Appearance — Inactive State
- The inactive pill has:
  - Background: CSS variable `--bundle-tier-pill-inactive-bg` (default: `rgb(242, 250, 238)`)
  - Text colour: CSS variable `--bundle-tier-pill-inactive-text` (default: `#333333`)
  - Same border, border-radius, and height as the active pill
  - Cursor: `pointer`
  - Hover: subtle background shift (CSS variable `--bundle-tier-pill-hover-bg`, default: `rgb(220, 245, 210)`)

### FR-06: Pill Label Text
- Each pill displays the merchant-configured label text verbatim.
- Labels are not truncated by default but must wrap if they exceed the pill width.
- Font: inherits from `--bundle-font-family`; weight: CSS variable `--bundle-tier-pill-font-weight` (default: `600`); size: CSS variable `--bundle-tier-pill-font-size` (default: `14px`).

### FR-07: Tier Switch Interaction
**Step-by-step flow when a shopper clicks an inactive pill:**

1. The clicked pill immediately receives the `bundle-tier-pill--loading` CSS class (visually disabled, cursor `not-allowed`).
2. All other pills also receive a temporary `bundle-tier-pill--disabled` class to prevent double-clicks.
3. The widget content area displays the existing loading spinner overlay (same as initial page load).
4. The widget fetches the new tier's bundle data from `/apps/product-bundles/api/bundle/{newBundleId}.json`.
5. On success: the widget re-renders with the new bundle's steps and products. All previously selected products are cleared. The clicked pill becomes the active pill; the former active pill becomes inactive.
6. On failure: the loading overlay is hidden. The pills are re-enabled. An error toast is shown ("Failed to load this tier. Please try again."). The previously active tier remains active.
7. Pills are re-enabled after step 5 or step 6.

### FR-08: Mobile Layout
- On screens ≤ 768px wide: pills are displayed in a **horizontally scrollable row** (overflow-x: auto, no line wrapping).
- Pills maintain their minimum height on mobile.
- The pill bar has a subtle bottom-fade scroll indicator on mobile when pills overflow.
- Touch targets: each pill has a minimum touch-target height of 48px (WCAG 2.5.5 Target Size).

### FR-09: Pill Bar Placement
- The tier pill bar is inserted **above the promo banner** (if the promo banner is enabled) and **above the widget's main layout wrapper**.
- It sits inside the `.bundle-widget-full-page` container so it inherits the full-width background.
- The pill bar has consistent padding matching the content section: `20px 40px` on desktop, `16px 16px` on mobile.

### FR-10: Accessibility
- Each pill is a `<button>` element (not a `<div>` or `<span>`).
- Active pill has `aria-pressed="true"`; inactive pills have `aria-pressed="false"`.
- The pill bar has `role="group"` and `aria-label="Bundle pricing tiers"`.
- Pills are keyboard-navigable (Tab, Enter/Space to activate).

### FR-11: Backward Compatibility
- If no tier settings are configured in the Liquid block, the widget behaves identically to its current behaviour. No regressions.
- The `data-bundle-id` attribute on the container continues to hold the primary (Tier 1) bundle ID and is the fallback for the existing resolution chain.

---

## 3. Merchant Configuration — Theme Editor Settings

The following new settings are added to the `bundle-full-page.liquid` schema under a new header "Pricing Tiers (Optional)":

| Setting ID | Type | Label | Notes |
|---|---|---|---|
| `tier_1_label` | text | Tier 1 label | e.g. "Buy 2 @499 ›" |
| `tier_1_bundle_id` | text | Tier 1 bundle ID | Pre-filled from `bundle_id` if empty |
| `tier_2_label` | text | Tier 2 label | e.g. "Buy 3 @699 ›" |
| `tier_2_bundle_id` | text | Tier 2 bundle ID | Required for Tier 2 to be active |
| `tier_3_label` | text | Tier 3 label | Optional |
| `tier_3_bundle_id` | text | Tier 3 bundle ID | Optional |
| `tier_4_label` | text | Tier 4 label | Optional |
| `tier_4_bundle_id` | text | Tier 4 bundle ID | Optional |

**Validation Rules:**
- A tier is considered configured only when BOTH label and bundle_id are non-empty.
- Tier 2 is required to show the pill bar at all. Configuring Tiers 3/4 without Tier 2 does not show a pill bar.
- Tier 1 label defaults to "Tier 1" if label is empty but bundle_id is set (edge case: prevent blank pill).

---

## 4. Data Flow Summary

```
Theme Editor
  └─ block.settings.tier_N_label + tier_N_bundle_id (N = 1..4)
       └─ Liquid renders data-tier-config="[{label, bundleId}, ...]" on container div
            └─ Widget JS parses data-tier-config on init
                 ├─ parseTierConfig(rawJson) → TierConfig[]
                 ├─ initTierPills(tiers) → renders pill bar DOM
                 └─ switchTier(bundleId) → fetch + re-init widget content
```

---

## 5. Acceptance Criteria

### AC-01: No tiers configured
**Given** the merchant has not entered any tier labels or bundle IDs
**When** the full-page bundle page loads
**Then** no tier pill bar is rendered and the widget behaves exactly as before this feature was added

### AC-02: One tier partially configured (label only, no bundle ID)
**Given** the merchant has entered Tier 1 label but left Tier 1 bundle ID empty (and no Tier 2)
**When** the full-page bundle page loads
**Then** no pill bar is rendered

### AC-03: Two tiers fully configured
**Given** the merchant has configured Tier 1 and Tier 2 with labels and bundle IDs
**When** the full-page bundle page loads
**Then** a pill bar with exactly two pills is rendered above the promo banner; Tier 1 pill is active

### AC-04: Clicking inactive pill switches tier
**Given** two tiers are configured and Tier 1 is active
**When** the shopper clicks the Tier 2 pill
**Then** a loading overlay appears, the Tier 2 bundle data is fetched, the widget re-renders with Tier 2 content, and the Tier 2 pill is now active

### AC-05: API failure on tier switch
**Given** two tiers are configured and Tier 1 is active
**When** the shopper clicks Tier 2 and the API returns a 500 error
**Then** the loading overlay disappears, an error toast is shown, and Tier 1 pill remains active

### AC-06: Active pill is not re-clickable in a meaningful way
**Given** Tier 1 is currently active
**When** the shopper clicks the Tier 1 pill
**Then** nothing happens (no fetch, no re-render, no spinner)

### AC-07: Mobile scroll
**Given** three or more tiers are configured on a 375px viewport
**When** the full-page bundle page loads
**Then** the pills are in a single horizontal row that can be scrolled horizontally; no vertical wrapping

### AC-08: Keyboard accessibility
**Given** two tiers are configured
**When** the user tabs to the Tier 2 pill and presses Enter
**Then** the tier switches exactly as if clicked with a mouse

### AC-09: aria-pressed reflects state
**Given** two tiers are configured and Tier 1 is active
**When** the page loads
**Then** Tier 1 pill has aria-pressed="true" and Tier 2 pill has aria-pressed="false"
**And When** Tier 2 is activated
**Then** Tier 2 pill has aria-pressed="true" and Tier 1 pill has aria-pressed="false"

### AC-10: Selections cleared on tier switch
**Given** the shopper has selected products in Steps 1 and 2 of Tier 1
**When** the shopper switches to Tier 2
**Then** all previously selected products are cleared and the step progress indicator resets to Step 1

---

## 6. Out-of-Scope Clarifications (for this release)

- No DCP panel sliders for tier pill colours — colours are set via CSS variable overrides by developers, not merchants, in v1.
- No per-tier promo banner image override (Beco has this; deferred to v2).
- No URL deep-link to a tier via hash parameter (deferred to v2).
- No analytics events on tier pill clicks (deferred to v2).
