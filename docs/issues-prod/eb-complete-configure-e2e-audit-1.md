# Issue: Easy Bundles Complete Configure E2E Audit
**Issue ID:** eb-complete-configure-e2e-audit-1
**Status:** Completed
**Priority:** High
**Created:** 2026-05-25
**Last Updated:** 2026-05-26 02:06 IST

## Overview

Perform a fresh evidence-backed audit of the Easy Bundles Bundle Configure surface for both Full Page / Landing Page bundles (FPB) and Product Page bundles (PPB). The audit covers clone-scoped accessible settings, toggles, inputs, radio buttons, dropdowns, dependencies between controls, help-content surfaces, saved Admin behavior, and storefront effects, including each bundle template on desktop and mobile. Emails / Customize Emails are excluded from clone scope by user direction.

This is research and documentation only. It does not authorize Wolfpack implementation changes, deployment, or edits to unrelated in-progress parity work.

## Progress Log

### 2026-05-26 02:06 IST - Follow-up gaps resolved
- Verified PPB Bundle Settings `Pre Selected Product` end to end: Admin save persisted `defaultProductsData.isDefaultProductsEnabled: true`, title `Preselected audit products`, and default product `18k Bloom Earrings`; desktop and mobile storefront rendered the configured default-products section.
- Verified FPB Bundle Banner placement without claiming upload persistence: the live upload path opened the operating-system file picker, but storefront DOM proved `.gbbAddProductPageBanners` sits immediately after step subtext and before category/product content on desktop and mobile.
- Captured FPB BXY selected-product success on desktop and mobile: three selected products produced success copy, a `₹0.00` discounted line, `3 item(s)`, and discounted total.
- Proved PPB global `Edit Defaults` cart-message settings: `Bundle Items` toggled the public `Items` cart-line property; `Original Bundle Price` toggled the public `Retail Price` property; `Discount Display` toggled the public `You Save` property and gated the Admin `Discount format` dropdown. All three were restored to their original on-state after proof.
- Updated `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md` with the fresh evidence; emails/customize emails remain excluded from clone scope.

### 2026-05-26 01:44 IST - Follow-up gap verification requested
- User flagged four remaining areas for live proof: PPB Bundle Settings Pre Selected Product, FPB Bundle Banner desktop/mobile placement, FPB BXY selected-product success, and PPB global Edit Defaults storefront effects.
- Reopening the audit issue to capture fresh evidence and update `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md` only after live verification.
- Emails and Customize Emails remain excluded from clone scope.

### 2026-05-26 00:00 IST - Blocked-gap resolution documented
- Updated `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md` with the resolved live evidence from the main thread.
- Resolved and documented PPB Bundle Quantity Options persistence/storefront proof, PPB Fixed Amount / Fixed Bundle Price / BXY save-to-storefront behavior, PPB Widget and Bundle Embed non-default persistence/storefront rendering, PPB per-bundle Quantity Validation behavior, PPB widget image upload persistence, and PPB Step Config upload persistence.
- Added FPB non-percentage discount proof from the existing research bundle `bundleId: 2`: Fixed Amount, Fixed Bundle Price, and BXY save payloads plus storefront progress/initial rendering.
- Recorded the narrow remaining non-assumptions: FPB Bundle Banner upload transport returned 200 but persisted banner storefront rendering was not proven, FPB BXY selected-product success state was not captured, and PPB global `Edit Defaults` settings remain inventoried rather than individually storefront-proven.
- Emails and Customize Emails were marked as intentionally excluded from clone scope per user direction.

### 2026-05-25 23:27 IST - Resume blocked-gap resolution
- User directed to resolve the blocked gaps and skip Emails / Customize Emails because those features are not being cloned.
- Resuming live EB verification for non-email gaps: upload controls, non-quantity discount save/storefront proof, PPB Bundle Quantity Options, PPB Widget/Embed non-default persistence, and PPB global Bundle Settings save/storefront effects.
- Will use harmless temporary test assets for upload controls and keep all fresh screenshots/evidence outside the git worktree.

### 2026-05-25 23:23 IST - Documentation completed with explicit blockers
- Created `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md` and added it to `docs/competitor-analysis/00-index.md`.
- Ran an advisor-agent review against the draft and corrected unsupported/over-broad wording: discount types beyond percentage quantity are now marked as UI inventory only, PPB Bundle Settings is marked as incomplete beyond global default inventory, FPB Add-ons mobile evidence was corrected, PPB template customization routing was weakened to evidence-limited, and FPB discount request evidence was split from the broader config wrapper request.
- Captured fresh mobile FPB Add-ons current-state evidence at `/private/tmp/eb-complete-configure-audit-2026-05-25/fpb-storefront-mobile-addons-current-state.png` and `fpb-storefront-runtime-addons-mobile-current-state.json`.
- Remaining blockers: upload controls need explicit permission before exercising, FPB Customize Emails needs a follow-up interaction path, PPB Bundle Quantity Options and Widget/Embed custom controls resisted reliable activation, non-quantity discount types need save/storefront proof, and PPB global Bundle Settings need per-setting save/storefront proof.
- The research doc is complete for verified findings and deliberately does not claim the blocked areas as complete.

### 2026-05-25 23:11 IST - PPB template evidence complete, documentation started
- Completed fresh PPB Product Page bundle audit coverage for create flow, Step Setup, Discount & Pricing, Bundle Visibility, Bundle Widget/Embed default surfaces, Bundle Settings defaults/global Edit Defaults route, Subscriptions, and all four Select template options.
- Captured PPB template save payloads and storefront runtime evidence for Product List/CASCADE, Product Grid/COGNIVE, Horizontal Slots/MODAL, and Vertical Slots/SIMPLIFIED, including desktop and mobile screenshots for each non-default template and final CASCADE reset proof.
- Resolved delegated-agent conflicts in the main thread: PPB templates do not use `bundleDesignPresetId`; Product Grid is `PDP_INPAGE + COGNIVE`; Horizontal Slots is `PDP_MODAL + MODAL`; Vertical Slots is `PDP_MODAL + SIMPLIFIED`.
- Confirmed remaining blocked areas that must be documented as limitations rather than assumptions: upload controls were not exercised, PPB Bundle Quantity Options did not become interactable through accessible controls, PPB widget/embed toggles resisted reliable activation, and FPB Customize Emails was not resolved.
- Next steps: write `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md` from verified screenshot/network/runtime evidence only, then mark the issue checklist according to documented coverage.

### 2026-05-25 22:30 IST - FPB template evidence complete
- Finished FPB Bundle Settings save/runtime/storefront verification, including preselected products, product slots, cart text, discount-label display, variant selector, plus-button text, and subscription integration gating.
- Verified FPB Subscriptions blocked/unblocked states and help articles, including the no-common-selling-plan response from `validateSellingPlanGroups`.
- Completed FPB Select template coverage for Standard, Classic, Compact, and Horizontal with Admin overlay screenshots, `stepsConfiguration/update` payloads, `modifyBundleFields` counter updates, and desktop/mobile storefront screenshots.
- Resolved a sidecar conflict in the main thread: FPB Standard Design persists as `bundleDesignPresetId: "DEFAULT"`, not `"STANDARD"`.
- Next steps: start fresh PPB bundle creation/configure audit and collect equivalent Admin-to-storefront evidence for Product Page templates and settings.

### 2026-05-25 22:01 IST - FPB audit continuation
- Completed fresh FPB coverage for Step Setup, Add-ons, Messages, Discount/Pricing, Bundle Visibility, and Bundle Widget with Admin screenshots, save payloads, and desktop/mobile storefront proof stored outside the repo.
- Started FPB Bundle Settings coverage, including default-state inventory, preselected products modal, quantity validation, product slots, variant selector, and plus-button text states.
- Explicitly blocked upload-based slot/banner proof pending user approval because uploading a local workspace file to Easy Bundles would export file contents to an external service.
- Next steps: finish Bundle Settings save/runtime verification, then continue FPB Subscriptions/Templates and PPB coverage.

### 2026-05-25 21:44 IST - Resume after AGENTS.md re-read
- Re-read `AGENTS.md` and the local Shopify skill before continuing live EB research.
- Confirmed fresh screenshot evidence remains outside the repo under `/private/tmp/eb-complete-configure-audit-2026-05-25/`.
- Confirmed unrelated dirty worktree entries are present and must be left untouched.
- Next steps: continue FPB Configure coverage from Bundle Visibility, then Bundle Settings, Subscriptions, templates, and PPB.

### 2026-05-25 20:42 IST - Audit initialized after workflow review
- Read `AGENTS.md` and `CLAUDE.md` before continuing work, including the issue-log, EB evidence, iframe-interaction, storefront viewport, and screenshot-commit constraints.
- Read the existing EB implementation reference and prior data-flow research context sufficiently to identify gaps that require fresh live verification rather than assumption.
- Cleared pre-existing untracked screenshot files at the user's direction before starting fresh capture; retained unrelated modified and non-screenshot files untouched.
- Scope for this pass: exhaustive FPB and PPB Admin-to-storefront evidence, template rendering, configuration dependencies, and conflict resolution on the main agent thread.
- Evidence handling: new screenshots may be captured for current verification and cited in the research record, but must not be included in a commit.
- Next steps: dispatch bounded research agents, enumerate all live configuration/help surfaces, exercise each state with fresh evidence, verify resulting storefront behavior on desktop and mobile, and consolidate only confirmed conclusions.

## Related Documentation

- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md`

## Phases Checklist

- [x] Phase 1 - Read repo operating rules and initialize audit issue
- [x] Phase 2 - Inventory FPB and PPB Admin controls and all visible help content
- [x] Phase 3 - Exercise clone-scoped configurable states and capture Admin persistence/network evidence
- [x] Phase 4 - Verify template states and resolved storefront-visible setting states on desktop and mobile
- [x] Phase 5 - Reconcile delegated findings in the main thread and document confirmed relationships
- [x] Phase 6 - Validate documentation completeness and explicitly record remaining blockers
