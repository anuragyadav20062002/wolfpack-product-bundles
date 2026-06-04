# FPB Add-ons Admin EB Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the FPB Free Gift & Add Ons Admin section to match EB and prove save/discard/storefront behavior.

**Architecture:** Keep the current direct `addonDraft -> personalizationData.addonProducts` serializer and replace only the Admin section structure/styling and dirty wiring. Use route-source tests to guard EB marker order and SaveBar wiring, then prove behavior in Chrome.

**Tech Stack:** Remix route TSX, Shopify App Bridge SaveBar, Polaris web components plus custom Admin controls/CSS, Jest source-contract tests, Chrome DevTools MCP.

---

### Task 1: RED Tests

**Files:**
- Modify: `tests/unit/routes/fpb-addons-admin-layout.test.ts`
- Create: `test-spec/fpb-addons-admin-eb-parity.spec.md`

- [ ] Add tests for EB help URL, layout markers, source order, and footer message dirty wiring.
- [ ] Run `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/fpb-addons-admin-layout.test.ts`.
- [ ] Expected before implementation: FAIL on missing EB-specific markers or missing `markAsDirty()` in footer message handlers.

### Task 2: Admin UI Patch

**Files:**
- Modify: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- Modify: `app/styles/routes/full-page-bundle-configure.module.css`

- [ ] Replace the active `free_gift_addons` render body with EB-ordered custom wrappers.
- [ ] Add dedicated classes for step card, Add-ons card, tier card, selected count, discount grid, tier rules, footer messaging, custom switches, and compact fields.
- [ ] Make `How to setup?` open the EB help article URL.
- [ ] Call `markAsDirty()` after footer `setRuleMessages` updates.

### Task 3: Verification

**Files:**
- Modify: `docs/issues-prod/fpb-addons-admin-eb-parity-1.md`

- [ ] Run focused Add-ons Admin tests.
- [ ] Run FPB save bundle tests that cover direct Add-ons persistence.
- [ ] Run modified-file ESLint.
- [ ] Run Chrome Admin SaveBar verification.
- [ ] Run Chrome storefront/cart verification.
- [ ] Rebuild graph outputs and commit scoped files.
