# Product Owner Requirements: EB Evidence UI Clone Rewrite

**Feature ID:** eb-ui-clone-rewrite
**Issue:** eb-ui-clone-rewrite-1
**Status:** Draft
**Created:** 2026-05-26
**Author:** Feature Pipeline

## Prior Research

Primary evidence:
- `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md`
- `internal docs/EB Implementation Reference.md`
- `/private/tmp/eb-complete-configure-audit-2026-05-25/`

Secondary evidence:
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

## Functional Requirements

### FR-01: Evidence Manifest Gate

The implementation must maintain `docs/eb-ui-clone-rewrite/evidence-manifest.md` with one row per cloned control/template. Each row tracks control ID, bundle type, Admin screenshot, save payload or DB/metafield proof, runtime JSON, desktop screenshot, mobile screenshot, cart proof where relevant, implementation status, and remaining gap.

### FR-02: Shared Configure Shell

FPB and PPB configure routes must use a shared shell with:
- left setup rail
- readiness score
- nested section cards
- section-specific save/discard behavior
- EB-style cards, toggles, radios, dropdowns, modals, and template picker
- Shopify product and collection picker flows

### FR-03: FPB Configure Sections

FPB must include the clone-scoped sections:
- Step Setup
- Add-ons
- Messages, excluding email/customize email behavior
- Discount & Pricing
- Bundle Visibility
- Bundle Widget
- Bundle Settings
- Subscriptions
- Select Template

### FR-04: PPB Configure Sections

PPB must include:
- Create flow
- Step Setup
- Discount & Pricing
- Bundle Visibility
- Bundle Widget
- Bundle Embed
- Bundle Settings
- global Edit Defaults
- Subscriptions
- Select Template

### FR-05: Template Mapping

Template save and runtime mapping must preserve the audited two-field contracts:
- FPB: `FBP_SIDE_FOOTER` plus `DEFAULT`, `CLASSIC`, `COMPACT`, or `HORIZONTAL`
- PPB: `PDP_INPAGE` plus `CASCADE` or `COGNIVE`
- PPB: `PDP_MODAL` plus `MODAL` or `SIMPLIFIED`

### FR-06: Direct Persisted Contracts

The rewrite must add or normalize direct persisted contracts for:
- `defaultProductsData`
- `boxSelection`
- `bundleUpsellConfig`
- `bundleTextConfig`
- `discountDisplayOverride`
- `individualSellingPlanSelection`
- `validateQuantityPerProduct`
- PPB `useSingleStepCategoriesAsBundleSteps`
- global PPB `bundleCartLineMessaging`

No legacy field fallback chains are allowed.

### FR-07: Step And Category Data

Step/category data must support:
- direct products and collections
- subtitles and banner placement
- conditions
- product/collection source selection
- display variants as individual products
- display variants as swatches where audited
- category rules only when more than one category exists

### FR-08: Dependency Engine

The dependency engine must enforce:
- step rules and category rules are mutually exclusive
- category rules appear only with more than one category
- Discount Messaging requires Discount enabled
- Bundle Quantity Options are enabled only for quantity rules and never for Buy X, get Y
- Buy X, get Y clears/disables box selection and uses buy/get fields
- simple vs step-based progress controls gate tier text visibility
- Quantity Validation gates max quantity
- Pre Selected Product gates default product title/products
- Discount Display gates the discount format dropdown
- Subscriptions require common selling-plan validation

### FR-09: FPB Storefront Runtime

FPB runtime must implement:
- four audited templates
- default/preselected products
- variants as cards
- category collection expansion
- Bundle Quantity Options
- progress bars
- Buy X, get Y success/free-line behavior
- add-ons
- non-email message validation
- banner placement below step subtext
- upsell redirect behavior
- app-proxy config without changing load order

### FR-10: PPB Storefront Runtime

PPB runtime must implement:
- Product List, Product Grid, Horizontal Slots, and Vertical Slots
- in-page/modal dispatch
- default products
- quantity validation
- Bundle Quantity Options
- Buy X, get Y
- widget and embed branches
- selected product/cart behavior

### FR-11: Cart Properties

Cart behavior must emit the audited public/private line properties for Bundle Items, Retail Price, and You Save according to global Edit Defaults.

### FR-12: Evidence-Limited Rows

Evidence-limited rows must not be implemented beyond proven behavior:
- FPB Bundle Banner upload persistence remains blocked until fresh saved-field proof exists.
- PPB specific-products/specific-collections targeting and remaining global Edit Defaults controls require fresh Chrome proof.
- PPB Customize Colors & Language routing stays limited to proven global Brand Config behavior.

## Acceptance Criteria

### AC-01: Manifest Gate

Given a cloned control is implemented, when the manifest row is reviewed, then it must include Admin, persistence, runtime, desktop, mobile, and cart proof as applicable before the row is marked green.

### AC-02: No Unsupported Parity Claims

Given a control has missing saved-field or storefront proof, when the implementation status is recorded, then the row remains blocked or partial and names the missing proof.

### AC-03: No Code Competitor References

Given source code is searched, when `rg -n "eb|easybundles|skai|skailama" app extensions scripts prisma tests` runs, then no new competitor references are introduced outside docs.

### AC-04: Load Order Preserved

Given FPB widget config loads on storefront, when metafield cache exists, then the widget must read `data-bundle-config` before using the proxy fallback. If fallback is needed, the existing 503/504 retry remains intact.

### AC-05: Template Contracts

Given each audited FPB or PPB template is selected and saved, when the update payload and runtime config are inspected, then the mapped design fields match FR-05.

### AC-06: Desktop And Mobile Proof

Given each storefront-visible setting is implemented, when the evidence loop runs, then desktop and mobile captures exist and match the audited DOM/visual behavior.

## UI/UX Specification

Admin parity must follow measured audit evidence. Custom controls may be used only where Polaris web components cannot reach the target layout or interaction. Any such use must be documented in the manifest row.

Storefront parity must use audited template DOM/class markers and responsive behavior. Desktop proof uses at least 1280x800. Mobile proof uses 390x844.

## Data Changes

Expected schema/data changes:
- add direct Prisma columns where audited fields are not directly persisted today
- update save handlers to write the direct contracts
- update metafield writers and widget parsers together
- bump widget version before deploy handoff

Backwards-compatibility migrations and legacy readers are not allowed.

## Risks

| Risk | Mitigation |
|---|---|
| Large route/widget blast radius | Land in evidence-gated slices with RED tests before code. |
| App Admin visual parity conflicts with Polaris rule | Use only the scoped `eb-ui-clone-rewrite-1` exception and document every custom control. |
| Storefront proof lags implementation | Keep rows yellow until desktop/mobile/runtime/cart evidence is captured. |
| Existing DCP surfaces drift | Preserve existing DCP unless parity or breakage requires a same-issue change. |
| Widget source changes not reflected in assets | Run `npm run build:widgets` and CSS minification before handoff. |
